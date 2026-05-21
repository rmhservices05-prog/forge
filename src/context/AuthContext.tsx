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

    async function syncMembership(nextSession: Session | null) {
      if (!nextSession?.user.email) {
        setProfile(null);
        return;
      }

      const nextProfile = await organizationRepository.ensureMembership(
        nextSession.user.id,
        nextSession.user.email,
      );
      setProfile(nextProfile);
    }

    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session ?? null);
      try {
        await syncMembership(data.session ?? null);
      } catch (membershipError) {
        setError(membershipError instanceof Error ? membershipError.message : "Unable to join organization");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setLoading(true);
      void syncMembership(nextSession)
        .catch((membershipError) => {
          setError(membershipError instanceof Error ? membershipError.message : "Unable to join organization");
        })
        .finally(() => {
          setSession(nextSession);
          setLoading(false);
        });
      setError("");
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
        const { error: signUpError } = await client.auth.signUp({ email, password });

        if (signUpError) {
          setError(signUpError.message);
          throw signUpError;
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
