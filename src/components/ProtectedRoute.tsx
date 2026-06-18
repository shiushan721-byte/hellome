import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { getHermesConnection } from '../lib/hermesConnection';

export default function ProtectedRoute({
  children,
  requireHermes = false,
}: {
  children: ReactNode;
  requireHermes?: boolean;
}) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireHermes) {
    const hermes = getHermesConnection();
    if (hermes.status !== 'connected') {
      const next =
        hermes.status === 'offline'
          ? '/connect-hermes?status=offline'
          : '/connect-hermes';
      return <Navigate to={next} replace />;
    }
  }
  return <>{children}</>;
}
