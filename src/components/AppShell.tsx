import { BarChart3, ClipboardList, Newspaper, PanelLeftClose, PanelLeftOpen, Users } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/news-room", label: "News Room", icon: Newspaper },
  { to: "/settings", label: "Team", icon: Users },
];

export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`app-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="sidebar-collapse-button"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <nav className="nav-list" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <Icon size={18} />
                <span className="nav-label">{item.label}</span>
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
