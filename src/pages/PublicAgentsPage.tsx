import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import PublicMarketLayout from '../layouts/PublicMarketLayout';
import AgentsPage from './app/AgentsPage';

export default function PublicAgentsPage() {
  if (isAuthenticated()) {
    return <Navigate to="/app/agents" replace />;
  }

  return (
    <PublicMarketLayout>
      <AgentsPage variant="public" />
    </PublicMarketLayout>
  );
}
