import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../lib/supabase";

export function AuthPage() {
  const { signIn, signUp, error } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setMessage(
          "Account created. Forge automatically assigns new users to the internal organization during signup. If email confirmation is enabled in Supabase, confirm your email before signing in.",
        );
      }
    } catch {
      // Error state is surfaced from the auth context.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel auth-copy-panel">
        <div className="auth-badge">
          <LockKeyhole size={18} />
          Supabase secured workspace
        </div>
        <h1>Sign in to Forge</h1>
        <p>
          We&apos;re moving the task workspace into Supabase so auth, saving, and future team collaboration all share the same backbone.
        </p>
        <ul className="auth-copy-list">
          <li>Email/password auth with session persistence</li>
          <li>Saved tasks, comments, subtasks, and project icon</li>
          <li>Per-user row security ready for expansion</li>
        </ul>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="auth-toggle-row" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === "signin" ? "auth-toggle active" : "auth-toggle"}
            onClick={() => setMode("signin")}
            type="button"
          >
            <LogIn size={16} />
            Sign in
          </button>
          <button
            className={mode === "signup" ? "auth-toggle active" : "auth-toggle"}
            onClick={() => setMode("signup")}
            type="button"
          >
            <UserPlus size={16} />
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              type="password"
              value={password}
            />
          </label>

          {!isSupabaseConfigured ? (
            <p className="form-error">Supabase env vars are missing. Add them in `.env.local`.</p>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}

          <button className="primary-button auth-submit-button" disabled={submitting || !isSupabaseConfigured} type="submit">
            {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </section>
    </div>
  );
}
