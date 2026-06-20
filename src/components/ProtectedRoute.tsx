import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessAdmin, canAccessStudio, isAuthenticated } from '../lib/auth';
import { getHermesConnection } from '../lib/hermesConnection';

export default function ProtectedRoute({
  children,
  requireHermes = false,
  requireStudio = false,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireHermes?: boolean;
  requireStudio?: boolean;
  requireAdmin?: boolean;
}) {
  const location = useLocation();
  if (!isAuthenticated()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/agents?login=1&redirect=${redirect}`} replace />;
  }
  if (requireAdmin && !canAccessAdmin()) {
    return <Navigate to="/app" replace />;
  }
  if (requireStudio && !canAccessStudio()) {
    return <Navigate to="/app" replace />;
  }
  if (requireHermes) {
    const hermes = getHermesConnection();
    if (hermes.status !== 'connected') {
      const next =
        hermes.status === 'offline'
          ? '/connect-hermes?status=offline'
          : hermes.status === 'account_mismatch'
            ? '/connect-hermes?status=account_mismatch'
            : hermes.status === 'api_unavailable'
              ? '/connect-hermes?status=service_unavailable'
            : hermes.status === 'capability_missing'
              ? '/connect-hermes?status=not_installed'
              : '/connect-hermes';
      return <Navigate to={next} replace />;
    }
  }
  return <>{children}</>;
}
