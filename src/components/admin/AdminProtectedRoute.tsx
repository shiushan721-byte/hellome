import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessAdmin, ensureAdminServerSession } from '../../lib/auth';

export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void ensureAdminServerSession().then((ok) => {
      if (cancelled) return;
      setAllowed(ok);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <p className="p-6 text-sm text-black/50">正在建立管理员会话…</p>;
  }

  if (!allowed || !canAccessAdmin()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/agents?login=1&redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
