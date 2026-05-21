import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { organizationRepository, type OrganizationProfile } from "../data/organizationRepository";
import { requireSupabase, supabase } from "../lib/supabase";
import { AuthContext, type AuthContextValue } from "./authContextValue";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setError("Supabase is not configured. Add your Vite env vars to continue.");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function syncProfile(nextSession: Session | null) {
      if (!nextSession?.user?.id) {
        setProfile(null);
        return;
      }

      const nextProfile = await organizationRepository.waitForProfile(nextSession.user.id);
      if (!nextProfile) {
        throw new Error("Your account was created, but its Forge organization membership is not ready yet. Please wait a moment and sign in again.");
      }

      setProfile(nextProfile);
    }

    async function hydrate(nextSession: Session | null) {
      setLoading(true);
      setError("");
      setSession(nextSession);

      try {
        await syncProfile(nextSession);
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : "Unable to load organization profile");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      void hydrate(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      void hydrate(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
          setError(signInError.message);
          throw signInError;
        }
      },
      async signUp(email, password) {
        setError("");
        const client = requireSupabase();
        const { data, error: signUpError } = await client.auth.signUp({ email, password });

        if (signUpError) {
          setError(signUpError.message);
          throw signUpError;
        }

        if (data.session?.user?.id) {
          const nextProfile = await organizationRepository.waitForProfile(data.session.user.id);
          if (!nextProfile) {
            throw new Error("Your account was created, but the organization profile has not appeared yet. Try signing in again in a moment.");
          }
        }
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
    [error, loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
