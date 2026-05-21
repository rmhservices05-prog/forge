import { Save, UsersRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";

// TODO: Add CRM module routes for contacts, companies, opportunities, contracts, compliance logs, and support tickets.
export function TeamSettings() {
  const { profile, user, updateProfile, signOut, error } = useAuth();
  const { organization, users } = useOrganization();
  const [name, setName] = useState(profile?.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(profile?.name ?? "");
  }, [profile?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await updateProfile(name);
      setMessage("Profile updated.");
    } catch {
      // Error state is surfaced from the auth context.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Profile and access</p>
          <h2>Settings</h2>
          <span>Update how your name appears across Forge, then review who shares this workspace with you.</span>
        </div>
        <button className="secondary-button" onClick={() => void signOut()} type="button">
          Sign out
        </button>
      </header>

      {error ? <div className="inline-alert error">{error}</div> : null}

      <section className="settings-stack">
        <article className="panel">
          <div className="panel-heading">
            <h3>Profile settings</h3>
          </div>
          <form className="settings-form" onSubmit={handleSubmit}>
            <label>
              Display name
              <input
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Smith"
                required
                type="text"
                value={name}
              />
            </label>

            <label>
              Email
              <input readOnly type="email" value={profile?.email ?? user?.email ?? ""} />
            </label>

            <div className="settings-user-meta">
              <div className="user-row">
                <div>
                  <strong>{organization?.name ?? "Forge Internal"}</strong>
                  <span>{user?.id ?? "No session id available"}</span>
                </div>
                <span className="badge">{profile?.role ?? "Authenticated"}</span>
              </div>
            </div>

            {message ? <p className="form-success">{message}</p> : null}

            <div className="settings-actions">
              <button className="primary-button" disabled={submitting} type="submit">
                <Save size={16} />
                {submitting ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>{organization?.name ?? "Organization"} Members</h3>
            <UsersRound size={18} />
          </div>
          <div className="user-list">
            {users.map((user) => (
              <div className="user-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <span className="badge">{user.role}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
