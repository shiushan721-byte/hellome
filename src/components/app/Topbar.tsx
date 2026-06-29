import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { isAuthenticated, logout } from '../../lib/auth';
import { useLoginModal } from '../../context/LoginModalProvider';
import { getProfile, subscribeProfile } from '../../lib/profileStore';
import UserAvatar from './UserAvatar';
import { getUsage, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import {
  getHermesConnection,
  subscribeHermesConnection,
  type HermesConnectionStatus,
} from '../../lib/hermesConnection';
import { formatHermesTopbarLabel } from './HermesDebugPanel';
import type { MeProfile } from '../../lib/profileStore';
import WorkbenchTabsBar from './WorkbenchTabsBar';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import {
  getVisibleRecentAgentIds,
  subscribeWorkbenchTabs,
} from '../../lib/workbenchTabs';

type TopbarProps = {
  variant?: 'app' | 'guest';
};

function useUserMenuPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean) {
  const [style, setStyle] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open]);

  return style;
}

function UserMenuPopover({
  open,
  onClose,
  anchorRef,
  profile,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  profile: MeProfile;
  onLogout: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useUserMenuPosition(anchorRef, open);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      className="fixed z-[90] w-44 rounded-xl border border-black/10 bg-white shadow-xl overflow-hidden"
      style={{ top: position.top, right: position.right }}
    >
      <div className="px-3 py-2.5 border-b border-black/8">
        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{profile.nickname}</p>
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="w-full px-3 py-2.5 text-xs text-left flex items-center gap-2 hover:bg-[#F2F0ED] text-black/70"
      >
        <LogOut className="w-3.5 h-3.5" />
        退出登录
      </button>
    </div>,
    document.body,
  );
}

function hermesStatusTone(status: HermesConnectionStatus): string {
  switch (formatHermesTopbarLabel(status)) {
    case '已连接':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    case 'Me运行中':
      return 'border-violet-300 bg-violet-50 text-violet-800';
    case '未下载':
      return 'border-black/15 bg-white text-black/60';
    case '未配对':
      return 'border-sky-300 bg-sky-50 text-sky-800';
    case '未连接':
      return 'border-amber-300 bg-amber-50 text-amber-800';
    default:
      return 'border-black/15 bg-white text-black/60';
  }
}

export default function Topbar({ variant = 'app' }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useLoginModal();
  const isGuest = variant === 'guest' || !isAuthenticated();

  const profile = useSyncExternalStore(subscribeProfile, getProfile, getProfile);
  const usage = useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const workbenchRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => getVisibleRecentAgentIds().join(','),
    () => '',
  );
  const hermesConnected = useSyncExternalStore(
    subscribeHermesConnection,
    isHermesConnected,
    isHermesConnected,
  );
  const showWorkbenchTabs =
    !isGuest &&
    hermesConnected &&
    workbenchRevision.length > 0 &&
    (location.pathname === '/app' || /^\/app\/agents\/[^/]+$/.test(location.pathname));
  const low = isLowBalance(usage);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = () => {
    void logout();
    navigate('/agents');
  };

  if (isGuest) {
    return (
      <header className="h-14 border-b border-black/8 bg-[#FDFCFB]/95 backdrop-blur-md px-5 flex items-center justify-end shrink-0 z-30">
        <button
          type="button"
          onClick={() => openLogin({ redirect: '/agents' })}
          className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg transition-colors"
        >
          登录
        </button>
      </header>
    );
  }

  return (
    <header
      className={`h-14 border-b border-black/8 shrink-0 z-30 min-w-0 flex ${
        showWorkbenchTabs
          ? 'bg-[#eceff3] items-stretch'
          : 'bg-[#FDFCFB]/95 backdrop-blur-md items-center'
      }`}
    >
      <div
        className={`flex-1 min-w-0 h-full ${
          showWorkbenchTabs ? 'flex items-start overflow-visible' : 'overflow-visible'
        }`}
      >
        {showWorkbenchTabs ? (
          <WorkbenchTabsBar variant="topbar" />
        ) : (
          <div className="flex h-full items-center pl-5">
            <button
              type="button"
              onClick={() => navigate('/welcome')}
              className="text-xs font-medium text-black/55 hover:text-black transition-colors"
            >
              营销页
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0 pr-5 self-center">
        {showWorkbenchTabs ? (
          <button
            type="button"
            onClick={() => navigate('/welcome')}
            className="hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-full border border-black/15 bg-white text-black/70 hover:border-black/25 font-medium transition-colors"
          >
            营销页
          </button>
        ) : null}
        <button type="button" className="text-black/45 hover:text-black transition-colors" aria-label="通知">
          <Bell className="w-[15px] h-[15px]" />
        </button>

        <button
          type="button"
          onClick={() => navigate(low ? '/app/usage/recharge' : '/app/usage')}
          className={`hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-colors ${
            low
              ? 'border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200'
              : 'border-black/15 bg-white text-black/70 hover:border-black/25'
          }`}
        >
          {low ? '充值算力' : '充值'}
        </button>
        <span
          className={`hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-full border font-medium ${hermesStatusTone(hermes.status)}`}
        >
          {formatHermesTopbarLabel(hermes.status)}
        </span>

        <div className="relative">
          <button
            ref={userButtonRef}
            type="button"
            onClick={() => setShowUserMenu((open) => !open)}
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            aria-label="打开账号菜单"
            className="rounded-full transition-shadow hover:ring-2 hover:ring-black/10"
          >
            <UserAvatar profile={profile} size="sm" />
          </button>
          <UserMenuPopover
            open={showUserMenu}
            onClose={() => setShowUserMenu(false)}
            anchorRef={userButtonRef}
            profile={profile}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
