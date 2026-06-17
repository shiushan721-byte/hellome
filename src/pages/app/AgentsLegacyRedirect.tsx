import { Navigate, useSearchParams } from 'react-router-dom';
import { agentsTabPath, normalizeAgentsTab } from '../../lib/agentsPageData';

/** 兼容旧链接 /app/agents?tab=… */
export default function AgentsLegacyRedirect() {
  const [searchParams] = useSearchParams();
  const tab = normalizeAgentsTab(searchParams.get('tab'));
  const next = new URLSearchParams(searchParams);
  next.delete('tab');
  const qs = next.toString();
  return <Navigate to={`${agentsTabPath(tab)}${qs ? `?${qs}` : ''}`} replace />;
}
