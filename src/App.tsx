import { Routes, Route, Navigate } from 'react-router-dom';
import MarketingPage from './pages/MarketingPage';
import LoginPage from './pages/LoginPage';
import PublicAgentsPage from './pages/PublicAgentsPage';
import PublicAgentDetailPage from './pages/PublicAgentDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/app/AppShell';
import AppHomePage from './pages/app/AppHomePage';
import AgentsPage from './pages/app/AgentsPage';
import AgentsLegacyRedirect from './pages/app/AgentsLegacyRedirect';
import GeoAgentPage from './pages/app/GeoAgentPage';
import AgentComingSoonPage from './pages/app/AgentComingSoonPage';
import AgentLauncherPage from './pages/app/AgentLauncherPage';
import TasksPage from './pages/app/TasksPage';
import TaskRunPage from './pages/app/TaskRunPage';
import UsagePage from './pages/app/UsagePage';
import SettingsPage from './pages/app/SettingsPage';
import SettingsAuthPage from './pages/app/SettingsAuthPage';
import ConnectHermesPage from './pages/ConnectHermesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/agents" element={<PublicAgentsPage />} />
      <Route path="/agents/:agentId" element={<PublicAgentDetailPage />} />
      <Route
        path="/connect-hermes"
        element={
          <ProtectedRoute>
            <ConnectHermesPage />
          </ProtectedRoute>
        }
      />

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
        <Route path="agents/market" element={<Navigate to="/app/agents" replace />} />
        <Route path="agents/mine" element={<Navigate to="/app/agents" replace />} />
        <Route path="agents/geo" element={<GeoAgentPage />} />
        <Route path="agents/media" element={<AgentComingSoonPage agentId="media" />} />
        <Route path="agents/sales" element={<AgentComingSoonPage agentId="sales" />} />
        <Route path="agents/:agentId" element={<AgentLauncherPage />} />
        <Route path="agents-legacy" element={<AgentsLegacyRedirect />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskRunPage />} />
        <Route path="usage" element={<UsagePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/profile" element={<Navigate to="/app/settings" replace />} />
        <Route path="settings/auth" element={<SettingsAuthPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
