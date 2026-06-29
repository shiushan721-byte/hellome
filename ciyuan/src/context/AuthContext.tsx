import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { get } from '../utils/request';

const USER_PROFILE_STORAGE_KEY = 'huizhi-user-profile';
const TOKEN_STORAGE_KEY = 'token';

interface UserProfile {
  userId?: number;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  uid?: string;
}

interface AuthContextType {
  isLogin: boolean;
  isCheckingLoginStatus: boolean;
  userProfile: UserProfile | null;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  login: (token: string, user: { userId: number; phone: string; username: string }) => void;
  logout: () => void;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLogin, setIsLogin] = useState(false);
  const [isCheckingLoginStatus, setIsCheckingLoginStatus] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setIsCheckingLoginStatus(false);
      return;
    }

    get<{ userId: number; phone: string; username: string; userType: string }>(
      '/api/app/auth/current-user',
    )
      .then((data) => {
        const profile: UserProfile = {
          userId: data.userId,
          phone: data.phone,
          name: data.username || '用户' + data.phone.slice(-4),
        };
        setUserProfile(profile);
        setIsLogin(true);
        try {
          localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      })
      .finally(() => {
        setIsCheckingLoginStatus(false);
      });

    const handleAuthExpired = () => {
      setUserProfile(null);
      setIsLogin(false);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = useCallback(
    (token: string, user: { userId: number; phone: string; username: string }) => {
      const profile: UserProfile = {
        userId: user.userId,
        phone: user.phone,
        name: user.username || '用户' + user.phone.slice(-4),
      };
      setUserProfile(profile);
      setIsLogin(true);
      setLoginModalOpen(false);

      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        /* ignore quota / private mode */
      }

      window.dispatchEvent(new CustomEvent('login-success'));
    },
    [],
  );

  const requireAuth = useCallback(() => {
    if (isLogin) return true;
    setLoginModalOpen(true);
    return false;
  }, [isLogin]);

  const logout = useCallback(() => {
    setUserProfile(null);
    setIsLogin(false);

    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    } catch {
      /* ignore */
    }

    window.dispatchEvent(new CustomEvent('logout'));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLogin,
        isCheckingLoginStatus,
        userProfile,
        loginModalOpen,
        setLoginModalOpen,
        login,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
