import { UsersRound } from "lucide-react";
import { users } from "../data/users";

// TODO: Add CRM module routes for contacts, companies, opportunities, contracts, compliance logs, and support tickets.
export function TeamSettings() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Team and access</p>
          <h2>Settings</h2>
          <span>Placeholder for authentication, role-based access, and broader CRM modules.</span>
        </div>
      </header>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Initial Users</h3>
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
