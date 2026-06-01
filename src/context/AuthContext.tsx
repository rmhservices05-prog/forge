import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { organizationRepository, type OrganizationProfile } from "../data/organizationRepository";
import { requireSupabase, supabase } from "../lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContextValue";

function toAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Authentication failed. Please try again.";
  }

  if (error.message === "Failed to fetch") {
    return "Cannot reach Supabase from this deployment. Verify VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY in Render and ensure Supabase project API/Auth are active.";
  }

  return error.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sessionRef = useRef<Session | null>(null);

  const syncProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user?.id) {
      setProfile(null);
      return null;
    }

    const nextProfile = await organizationRepository.waitForProfile(nextSession.user.id);
    if (!nextProfile) {
      throw new Error("Your account was created, but its Forge organization membership is not ready yet. Please wait a moment and sign in again.");
    }

    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const applySession = useCallback(
    async (nextSession: Session | null, showLoading: boolean, clearError = true) => {
      if (showLoading) {
        setLoading(true);
      }

      if (clearError) {
        setError("");
      }
      setSession(nextSession);

      if (!nextSession?.user?.id) {
        setProfile(null);
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      try {
        await syncProfile(nextSession);
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : "Unable to load organization profile");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [syncProfile],
  );

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Add your Vite env vars to continue.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      void applySession(data.session ?? null, true, !sessionError);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setSession(nextSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        setError("");
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const previousUserId = sessionRef.current?.user?.id ?? null;
      const nextUserId = nextSession?.user?.id ?? null;
      const shouldShowLoading = previousUserId !== nextUserId;

      void applySession(nextSession, shouldShowLoading);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      error,
      async signIn(email, password) {
        setError("");
        const client = requireSupabase();
        const { error: signInError } = await client.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(toAuthErrorMessage(signInError));
          throw signInError;
        }
      },
      async signUp(name, email, password) {
        setError("");
        const client = requireSupabase();
        const trimmedName = name.trim();
        if (!trimmedName) {
          const nameError = new Error("Name is required to create an account.");
          setError(nameError.message);
          throw nameError;
        }
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: trimmedName,
            },
          },
        });

        if (signUpError) {
          setError(toAuthErrorMessage(signUpError));
          throw signUpError;
        }

        if (data.session?.user?.id) {
          const nextProfile = await organizationRepository.waitForProfile(data.session.user.id);
          if (!nextProfile) {
            throw new Error("Your account was created, but the organization profile has not appeared yet. Try signing in again in a moment.");
          }
        }
      },
      async updateProfile(name) {
        setError("");
        const trimmedName = name.trim();
        if (!trimmedName) {
          const nameError = new Error("Name is required.");
          setError(nameError.message);
          throw nameError;
        }

        const client = requireSupabase();
        const currentUser = session?.user;

        if (!currentUser?.id) {
          const sessionError = new Error("You need to be signed in to update your profile.");
          setError(sessionError.message);
          throw sessionError;
        }

        const { error: authUpdateError } = await client.auth.updateUser({
          data: {
            ...currentUser.user_metadata,
            name: trimmedName,
          },
        });

        if (authUpdateError) {
          setError(authUpdateError.message);
          throw authUpdateError;
        }

        await organizationRepository.updateProfile(currentUser.id, { name: trimmedName });
        await syncProfile(session);
      },
      async refreshProfile() {
        setError("");
        await syncProfile(session);
      },
      async signOut() {
        setError("");
        const client = requireSupabase();
        const { error: signOutError } = await client.auth.signOut();

        if (signOutError) {
          setError(signOutError.message);
          throw signOutError;
        }
      },
    }),
    [error, loading, profile, session, syncProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
