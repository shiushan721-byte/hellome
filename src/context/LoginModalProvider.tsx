import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import { isAuthenticated } from '../lib/auth';
import {
  parseIntentFromSearchParams,
  type PendingAgentIntent,
} from '../lib/pendingAgentIntent';

type LoginModalContextValue = {
  openLogin: (intent?: PendingAgentIntent) => void;
  closeLogin: () => void;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

function loginFallbackPath(intent: PendingAgentIntent): string {
  if (intent.redirect?.startsWith('/')) return intent.redirect;
  if (intent.agentId) return `/agents/${intent.agentId}`;
  return '/agents';
}

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<{ open: boolean; intent: PendingAgentIntent }>({
    open: false,
    intent: {},
  });
  const handledPathRef = useRef<string | null>(null);

  const openLogin = useCallback((intent: PendingAgentIntent = {}) => {
    if (isAuthenticated()) return;
    setState({ open: true, intent });
  }, []);

  const closeLogin = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (handledPathRef.current === key) return;

    if (location.pathname === '/login') {
      handledPathRef.current = key;
      const params = new URLSearchParams(location.search);
      const intent = parseIntentFromSearchParams(params);
      if (!isAuthenticated()) {
        openLogin(intent);
      }
      navigate(loginFallbackPath(intent), { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    if (params.get('login') === '1') {
      handledPathRef.current = key;
      const intent = parseIntentFromSearchParams(params);
      params.delete('login');
      const nextSearch = params.toString();
      navigate(
        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' },
        { replace: true },
      );
      if (!isAuthenticated()) {
        openLogin(intent);
      }
    }
  }, [location.pathname, location.search, navigate, openLogin]);

  return (
    <LoginModalContext.Provider value={{ openLogin, closeLogin }}>
      {children}
      {state.open && <LoginModal intent={state.intent} onClose={closeLogin} />}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal(): LoginModalContextValue {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error('useLoginModal must be used within LoginModalProvider');
  }
  return ctx;
}
