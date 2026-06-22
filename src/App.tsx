import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { PartnerProvider } from "./context/PartnerContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import { TaskProvider } from "./context/TaskContext";
import { useAuth } from "./hooks/useAuth";
import { useOrganization } from "./hooks/useOrganization";
import { AuthPage } from "./pages/AuthPage";
import { Companies } from "./pages/Companies";
import { CompanyProfile } from "./pages/CompanyProfile";
import { Dashboard } from "./pages/Dashboard";
import { Product } from "./pages/Product";
import { PartnerPipeline } from "./pages/PartnerPipeline";
import { TaskDetail } from "./pages/TaskDetail";
import { Tasks } from "./pages/Tasks";
import { TeamSettings } from "./pages/TeamSettings";

function OrganizationRoutes() {
  const { loading, error, organization } = useOrganization();

  if (loading) {
    return (
      <div className="centered-state">
        <h2>Loading organization...</h2>
        <p>Preparing the shared internal workspace.</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="centered-state">
        <h2>Organization setup issue</h2>
        <p>{error || "Forge could not load the default organization."}</p>
      </div>
    );
  }

  return (
    <CompanyProvider>
      <TaskProvider>
        <PartnerProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/product" element={<Product />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/companies/:companyId" element={<CompanyProfile />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:taskId" element={<TaskDetail />} />
              <Route path="/partners" element={<PartnerPipeline />} />
              <Route path="/settings" element={<TeamSettings />} />
            </Route>
          </Routes>
        </PartnerProvider>
      </TaskProvider>
    </CompanyProvider>
  );
}

function AppRoutes() {
  const { user, profile, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="centered-state">
        <h2>Connecting workspace...</h2>
        <p>Restoring your Supabase session and joining the Forge organization.</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile) {
    return (
      <div className="centered-state">
        <h2>Organization setup issue</h2>
        <p>{error || "Forge could not finish enrolling this account into the organization."}</p>
      </div>
    );
  }

  return (
    <OrganizationProvider>
      <OrganizationRoutes />
    </OrganizationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
