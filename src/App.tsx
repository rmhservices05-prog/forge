import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { NewsProvider } from "./context/NewsContext";
import { TaskProvider } from "./context/TaskContext";
import { Dashboard } from "./pages/Dashboard";
import { NewsRoom } from "./pages/NewsRoom";
import { TaskDetail } from "./pages/TaskDetail";
import { Tasks } from "./pages/Tasks";
import { TeamSettings } from "./pages/TeamSettings";

export default function App() {
  return (
    <TaskProvider>
      <NewsProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news-room" element={<NewsRoom />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/settings" element={<TeamSettings />} />
          </Route>
        </Routes>
      </NewsProvider>
    </TaskProvider>
  );
}
