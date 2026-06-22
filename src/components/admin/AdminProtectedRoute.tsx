import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessAdmin, isAuthenticated } from '../../lib/auth';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/agents?login=1&redirect=${redirect}`} replace />;
  }

  if (!canAccessAdmin()) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
