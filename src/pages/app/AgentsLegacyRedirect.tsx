import { Navigate, useSearchParams } from 'react-router-dom';

/** 兼容旧链接 /app/agents?tab=… */
export default function AgentsLegacyRedirect() {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.delete('tab');
  const qs = next.toString();
  return <Navigate to={`/app/agents${qs ? `?${qs}` : ''}`} replace />;
}
