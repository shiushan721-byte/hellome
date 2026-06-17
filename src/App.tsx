import { Routes, Route, Navigate } from 'react-router-dom';
import MarketingPage from './pages/MarketingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/app/AppShell';
import AppHomePage from './pages/app/AppHomePage';
import AgentsPage from './pages/app/AgentsPage';
import GeoAgentPage from './pages/app/GeoAgentPage';
import TasksPage from './pages/app/TasksPage';
import TaskRunPage from './pages/app/TaskRunPage';
import UsagePage from './pages/app/UsagePage';
import SettingsPage from './pages/app/SettingsPage';
import SettingsAuthPage from './pages/app/SettingsAuthPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppHomePage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/geo" element={<GeoAgentPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskRunPage />} />
        <Route path="usage" element={<UsagePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/auth" element={<SettingsAuthPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
