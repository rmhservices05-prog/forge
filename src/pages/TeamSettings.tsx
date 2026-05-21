import { UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";

// TODO: Add CRM module routes for contacts, companies, opportunities, contracts, compliance logs, and support tickets.
export function TeamSettings() {
  const { profile, user, signOut } = useAuth();
  const { organization, users } = useOrganization();

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Team and access</p>
          <h2>Settings</h2>
          <span>Every authenticated Forge user is enrolled into the shared internal organization automatically.</span>
        </div>
        <button className="secondary-button" onClick={() => void signOut()} type="button">
          Sign out
        </button>
      </header>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Signed-in User</h3>
          </div>
          <div className="user-list">
            <div className="user-row">
              <div>
                <strong>{user?.email ?? "Unknown user"}</strong>
                <span>{user?.id ?? "No session id available"}</span>
              </div>
              <span className="badge">{profile?.role ?? "Authenticated"}</span>
            </div>
          </div>
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
