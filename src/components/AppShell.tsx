import { BarChart3, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/settings", label: "Team", icon: Users },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="eyebrow">Dealtr.com</p>
            <h1>Forge</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <p>Internal task operations</p>
          <span>Auth and role gates will attach here before external deployment.</span>
        </div>
      </aside>

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
