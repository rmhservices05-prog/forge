import { Eye, EyeOff, LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import coverimage from "../assets/coverimage.jpg";
import forgetrans from "../assets/forgetrans.png";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../lib/supabase";

export function AuthPage() {
  const { signIn, signUp, error } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const fullName = useMemo(() => `${firstName.trim()} ${lastName.trim()}`.trim(), [firstName, lastName]);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        await signUp(fullName, email.trim(), password);
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
      <div className="auth-shell">
        <section className="auth-panel auth-copy-panel">
          <div className="auth-copy-header">
            <img className="auth-brand-image" src={forgetrans} alt="Forge" />
          </div>

          <div
            className="auth-visual-frame"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(30, 20, 44, 0.14) 0%, rgba(15, 10, 22, 0.52) 100%), url(${coverimage})`,
            }}
          />
        </section>

        <section className="auth-panel auth-form-panel">
          <div className="auth-toggle-row" role="tablist" aria-label="Authentication mode">
            <button className={mode === "signin" ? "auth-toggle active" : "auth-toggle"} onClick={() => setMode("signin")} type="button">
              <LogIn size={16} />
              Sign in
            </button>
            <button className={mode === "signup" ? "auth-toggle active" : "auth-toggle"} onClick={() => setMode("signup")} type="button">
              <UserPlus size={16} />
              Create account
            </button>
          </div>

          <div className="auth-heading-block">
            <h1>{isSignup ? "Create an account" : "Welcome back"}</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup ? (
              <div className="auth-name-grid">
                <label>
                  <span className="auth-label-text">First name</span>
                  <input
                    autoComplete="given-name"
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Fletcher"
                    required
                    type="text"
                    value={firstName}
                  />
                </label>
                <label>
                  <span className="auth-label-text">Last name</span>
                  <input
                    autoComplete="family-name"
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    required
                    type="text"
                    value={lastName}
                  />
                </label>
              </div>
            ) : null}

            <label>
              <span className="auth-label-text">Email</span>
              <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} />
            </label>

            <label>
              <span className="auth-label-text">Password</span>
              <span className="auth-password-wrap">
                <input
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isSignup ? "Enter your password" : "Enter your password"}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {!isSupabaseConfigured ? <p className="form-error">Supabase env vars are missing. Add them in `.env.local`.</p> : null}
            {error ? <p className="form-error">{error}</p> : null}
            {message ? <p className="form-success">{message}</p> : null}

            {!isSignup ? (
              <button className="primary-button auth-submit-button" disabled={submitting || !isSupabaseConfigured} type="submit">
                {submitting ? "Working..." : "Sign in"}
              </button>
            ) : null}

          </form>
        </section>
      </div>
    </div>
  );
}
