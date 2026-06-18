import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getAgentById } from '../../data/agentsCatalog';
import { isAgentActive } from '../../lib/agentSlotStore';

/** /app/agents/:agentId — 从首页进入已启用智能体 */
export default function AgentLauncherPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const location = useLocation();
  if (!agentId) return <Navigate to="/app/agents/market" replace />;

  const agent = getAgentById(agentId);
  if (!agent?.available) return <Navigate to="/app/agents/market" replace />;

  if (!isAgentActive(agentId)) {
    return <Navigate to={`/app/agents/market?enable=${agentId}`} replace />;
  }

  // Workbench tabs should stay in agent workbench flow instead of bouncing to task center.
  if (agent.path.startsWith('/app/tasks')) {
    return <Navigate to="/app/agents/geo" replace state={{ ...location.state, agentId }} />;
  }

  return <Navigate to={agent.path} replace state={location.state} />;
}
