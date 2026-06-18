import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getAgentById } from '../../data/agentsCatalog';
import { isAgentActive } from '../../lib/agentSlotStore';
import AgentComingSoonPage from './AgentComingSoonPage';

const GEO_WORKBENCH_IDS = new Set(['geo']);

/** /app/agents/:agentId — 从工作台标签进入已启用智能体 */
export default function AgentLauncherPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  if (!agentId) return <Navigate to="/app/agents" replace />;

  const agent = getAgentById(agentId);
  if (!agent?.available) return <Navigate to="/app/agents" replace />;

  if (!isAgentActive(agentId)) {
    return <Navigate to={`/app/agents?enable=${agentId}`} replace />;
  }

  if (GEO_WORKBENCH_IDS.has(agentId) || agent.path === '/app/agents/geo') {
    return <Navigate to="/app/agents/geo" replace state={{ ...location.state, agentId }} />;
  }

  if (agent.path.startsWith('/app/agents/')) {
    return <Navigate to={agent.path} replace state={location.state} />;
  }

  return <AgentComingSoonPage agentId={agentId} />;
}
