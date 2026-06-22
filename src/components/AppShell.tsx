import { BarChart3, Building2, ClipboardList, Package, PanelLeftClose, PanelLeftOpen, Users, UsersRound } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import forgeLogo from "../assets/forgetrans.png";
import { AppToaster } from "./AppToaster";
import { useAuth } from "../hooks/useAuth";
import { useOrganization } from "../hooks/useOrganization";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/product", label: "Product", icon: Package },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/partners", label: "Partners", icon: UsersRound },
];
const teamNavigationItem = { to: "/settings", label: "Settings", icon: Users };

export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const TeamIcon = teamNavigationItem.icon;
  const { profile, user } = useAuth();
  const { organization } = useOrganization();
  const displayName = profile?.name || user?.email?.split("@")[0] || "Forge user";
  const organizationName = organization?.name || "Forge Internal";

  return (
    <div className={`app-shell ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="brand brand-toggle"
          onClick={() => setIsCollapsed((current) => !current)}
          type="button"
        >
          <span className="brand-mark" aria-hidden="true">
            <img src={forgeLogo} alt="" className="brand-mark-image" />
          </span>
          <span className="brand-copy">
            <p className="eyebrow">{displayName}</p>
            <h1>{organizationName}</h1>
          </span>
          <span className="brand-toggle-icon" aria-hidden="true">
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </span>
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
        <nav className="nav-list nav-list-bottom" aria-label="Sidebar settings">
          <NavLink to={teamNavigationItem.to} className="nav-link">
            <TeamIcon size={18} />
            <span className="nav-label">{teamNavigationItem.label}</span>
          </NavLink>
        </nav>

      </aside>

      <main className="main-panel">
        <AppToaster />
        <Outlet />
      </main>
    </div>
  );
}
