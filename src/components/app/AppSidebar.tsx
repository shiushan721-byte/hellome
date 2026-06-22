import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Menu,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import { replayPendingIntent } from '../../lib/pendingAgentIntent';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import {
  APP_NAV_PRIMARY,
  APP_NAV_SECONDARY,
  GUEST_NAV_ITEMS,
  isAgentSessionPath,
  isAppNavActive,
  isGuestNavActive,
  type GuestNavId,
  type SidebarMode,
} from '../../lib/sidebarNav';
import {
  getSidebarCollapsed,
  setSidebarCollapsed,
  subscribeSidebarCollapsed,
} from '../../lib/sidebarState';
import HermesActionModal from './HermesActionModal';
import { HermesDebugDock } from './HermesDebugPanel';
import SidebarMoreMenu from './SidebarMoreMenu';
import { useLoginModal } from '../../context/LoginModalProvider';
import { openAgentsyunHub } from '../../lib/agentsyunSso';

interface AppSidebarProps {
  mode: SidebarMode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsed,
    () => false,
  );
}

function NavItemStyles(active: boolean, collapsed: boolean): string {
  const base = collapsed
    ? 'flex items-center transition-colors duration-200 ease-out rounded-xl'
    : 'group relative flex items-center transition-colors duration-200 ease-out rounded-xl';
  const size = collapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 h-12 w-full';
  const state = active
    ? collapsed
      ? 'bg-[#f0f0f2] text-[#111111]'
      : 'bg-[#f0f0f2] text-[#111111] font-semibold'
    : collapsed
      ? 'text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111]'
      : 'text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111] font-medium';
  return `${base} ${size} ${state}`;
}

function SimpleNavLink({
  to,
  label,
  icon: Icon,
  active,
  collapsed,
  end,
  onClick,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  end?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={NavItemStyles(active, collapsed)}
    >
      <Icon className={`shrink-0 ${collapsed ? 'w-6 h-6' : 'w-[22px] h-[22px]'}`} strokeWidth={active ? 2.25 : 2} />
      {!collapsed && <span className="text-base truncate">{label}</span>}
    </NavLink>
  );
}

function BrandMark({
  collapsed,
  mode,
  onExpand,
}: {
  collapsed: boolean;
  mode: SidebarMode;
  onExpand?: () => void;
}) {
  const logo = (
    <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0 rounded-lg">
      <Zap className="w-4 h-4 text-white fill-white" />
    </div>
  );

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="mx-auto flex items-center justify-center"
        aria-label="展开侧边栏"
      >
        {logo}
      </button>
    );
  }

  return (
    <Link to={modeHomePath(mode)} className="flex items-center gap-2.5 min-w-0">
      {logo}
      <div className="flex flex-col leading-none gap-0.5 min-w-0">
        <span className="text-base font-bold font-display text-[#111111] truncate">
          Hello<span className="font-serif italic font-semibold">Me</span>
        </span>
        <span className="text-[9px] text-black/40 tracking-[0.15em]">哈啰蜜</span>
      </div>
    </Link>
  );
}

function modeHomePath(mode: SidebarMode): string {
  return mode === 'guest' ? '/agents' : '/app/agents';
}

function SidebarFooter({
  collapsed,
  moreOpen,
  onHermesClick,
  onMoreMouseEnter,
  onMoreMouseLeave,
  moreButtonRef,
  showDebug,
  themeMode,
  onToggleTheme,
}: {
  collapsed: boolean;
  moreOpen: boolean;
  onHermesClick: () => void;
  onMoreMouseEnter: () => void;
  onMoreMouseLeave: () => void;
  moreButtonRef: RefObject<HTMLButtonElement | null>;
  showDebug?: boolean;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const iconBtn =
    themeMode === 'dark'
      ? 'flex items-center justify-center rounded-xl text-[#E7EAEE] hover:bg-[#111827] hover:text-white transition-colors'
      : 'flex items-center justify-center rounded-xl text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111] transition-colors';
  const iconSize = collapsed ? 'w-11 h-11 mx-auto' : 'w-10 h-10';

  return (
    <div
      className={`shrink-0 border-t ${
        themeMode === 'dark' ? 'border-white/10' : 'border-[#f0f0f0]'
      } ${themeMode === 'dark' ? 'bg-[#0f172a]' : 'bg-white'} ${
        collapsed ? 'p-2 space-y-1.5' : 'p-3 space-y-2'
      }`}
    >
      {showDebug ? <HermesDebugDock collapsed={collapsed} /> : null}
      {!collapsed ? (
        <button
          type="button"
          onClick={onHermesClick}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-[#f0f1f3] text-sm font-semibold text-[#111111] hover:bg-[#e8e9ec] transition-colors"
        >
          链接 Me
          <ExternalLink className="w-4 h-4 opacity-60" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onHermesClick}
          className={`${iconBtn} ${iconSize}`}
          title="链接 Me"
          aria-label="链接 Me"
        >
          <ExternalLink className="w-6 h-6" />
        </button>
      )}

      <div className={collapsed ? 'space-y-2' : 'flex items-center gap-2'}>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`${iconBtn} ${iconSize} ${!collapsed ? 'flex-1' : ''}`}
          title="主题切换"
          aria-label="主题切换"
        >
          {themeMode === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
        <button
          ref={moreButtonRef}
          type="button"
          onMouseEnter={onMoreMouseEnter}
          onMouseLeave={onMoreMouseLeave}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          className={`${iconBtn} ${iconSize} ${!collapsed ? 'flex-1' : ''} ${
            moreOpen ? 'bg-[#f0f0f2] text-[#111111]' : ''
          }`}
          title="更多"
          aria-label="更多"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function SidebarInner({
  mode,
  collapsed,
  onToggleCollapse,
  onMobileClose,
}: {
  mode: SidebarMode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  const THEME_KEY = 'hellome_theme_mode';
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    return saved === 'dark' || saved === 'light' ? saved : prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  const onToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_KEY, next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  const [moreOpen, setMoreOpen] = useState(false);
  const [hermesModal, setHermesModal] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMoreMenu = () => {
    if (moreCloseTimeoutRef.current) {
      clearTimeout(moreCloseTimeoutRef.current);
      moreCloseTimeoutRef.current = null;
    }
    setMoreOpen(true);
  };

  const scheduleCloseMoreMenu = () => {
    if (moreCloseTimeoutRef.current) clearTimeout(moreCloseTimeoutRef.current);
    moreCloseTimeoutRef.current = setTimeout(() => {
      setMoreOpen(false);
      moreCloseTimeoutRef.current = null;
    }, 120);
  };

  const handleNavigate = () => onMobileClose?.();

  const handleHermes = () => {
    if (hermes.status === 'connected') {
      refreshHermesConnection();
      return;
    }
    if (mode === 'guest') {
      openLogin({ redirect: '/agents' });
      return;
    }
    setHermesModal(true);
  };

  const renderAppNav = () => (
    <>
      {APP_NAV_PRIMARY.map((item) => (
        <SimpleNavLink
          key={item.id}
          to={item.to}
          label={item.label}
          icon={item.icon}
          active={isAppNavActive(item.id, location.pathname)}
          collapsed={collapsed}
          end={item.end}
          onClick={handleNavigate}
        />
      ))}

      {!collapsed && <div className="my-3 border-t border-[#f0f0f0]" />}
      {collapsed && <div className="my-2 border-t border-[#f0f0f0] mx-2" />}

      {APP_NAV_SECONDARY.map((item) =>
        item.action === 'agentsyun' ? (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              openAgentsyunHub({}, openLogin);
              handleNavigate();
            }}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={NavItemStyles(false, collapsed)}
          >
            <item.icon
              className={`shrink-0 ${collapsed ? 'w-6 h-6' : 'w-[22px] h-[22px]'}`}
              strokeWidth={2}
            />
            {!collapsed && <span className="text-base truncate">{item.label}</span>}
          </button>
        ) : (
          <SimpleNavLink
            key={item.id}
            to={item.to!}
            label={item.label}
            icon={item.icon}
            active={isAppNavActive(item.id, location.pathname)}
            collapsed={collapsed}
            onClick={handleNavigate}
          />
        ),
      )}
    </>
  );

  const renderGuestNav = () => (
    <>
      {GUEST_NAV_ITEMS.map((item) =>
        item.action === 'login' ? (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              openLogin({ redirect: '/agents' });
              handleNavigate();
            }}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={NavItemStyles(false, collapsed)}
          >
            <item.icon
              className={`shrink-0 ${collapsed ? 'w-6 h-6' : 'w-[22px] h-[22px]'}`}
              strokeWidth={2}
            />
            {!collapsed && <span className="text-base truncate">{item.label}</span>}
          </button>
        ) : item.action === 'agentsyun' ? (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              openAgentsyunHub({ loginRedirect: '/agents' }, openLogin);
              handleNavigate();
            }}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={NavItemStyles(false, collapsed)}
          >
            <item.icon
              className={`shrink-0 ${collapsed ? 'w-6 h-6' : 'w-[22px] h-[22px]'}`}
              strokeWidth={2}
            />
            {!collapsed && <span className="text-base truncate">{item.label}</span>}
          </button>
        ) : (
          <SimpleNavLink
            key={item.id}
            to={item.to!}
            label={item.label}
            icon={item.icon}
            active={isGuestNavActive(item.id as GuestNavId, location.pathname)}
            collapsed={collapsed}
            onClick={handleNavigate}
          />
        ),
      )}
    </>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className={`shrink-0 border-b border-[#f0f0f0] flex items-center ${
          collapsed ? 'justify-center h-14 px-2' : 'justify-between h-14 px-3'
        }`}
      >
        <BrandMark
          collapsed={collapsed}
          mode={mode}
          onExpand={collapsed ? onToggleCollapse : undefined}
        />
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-black/45 hover:bg-[#f7f7f8] hover:text-black transition-colors"
            aria-label="收起侧边栏"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav
        className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${
          collapsed ? 'overflow-x-hidden py-3 px-2 space-y-2' : 'overflow-x-hidden py-4 px-3 space-y-1'
        }`}
      >
        {mode === 'app' ? renderAppNav() : renderGuestNav()}
      </nav>

      <div className="relative shrink-0">
        <SidebarFooter
          collapsed={collapsed}
          moreOpen={moreOpen}
          onHermesClick={handleHermes}
          onMoreMouseEnter={openMoreMenu}
          onMoreMouseLeave={scheduleCloseMoreMenu}
          moreButtonRef={moreButtonRef}
          showDebug={mode === 'app'}
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
        />
        <SidebarMoreMenu
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          onMouseEnter={openMoreMenu}
          onMouseLeave={scheduleCloseMoreMenu}
          anchorRef={moreButtonRef}
        />
      </div>

      {hermesModal && mode === 'app' && (
        <HermesActionModal
          variant="pairing"
          status={hermes.status}
          onClose={() => setHermesModal(false)}
          onOpenHermes={() => refreshHermesConnection()}
          onPairedComplete={() => {
            if (isHermesConnected()) {
              setHermesModal(false);
              navigate(replayPendingIntent());
            }
          }}
        />
      )}
    </div>
  );
}

export function MobileNavBar({
  onMenuClick,
  mode,
}: {
  onMenuClick: () => void;
  mode: SidebarMode;
}) {
  return (
    <header className="lg:hidden h-14 shrink-0 border-b border-[#f0f0f0] bg-white px-4 flex items-center justify-between">
      <button
        type="button"
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#f7f7f8]"
        aria-label="打开菜单"
      >
        <PanelLeftOpen className="w-5 h-5" />
      </button>
      <Link to={modeHomePath(mode)} className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black flex items-center justify-center rounded-lg">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="text-sm font-bold font-display">
          Hello<span className="font-serif italic font-semibold">Me</span>
        </span>
      </Link>
      <span className="w-10" aria-hidden />
    </header>
  );
}

export default function AppSidebar({ mode, mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const collapsed = useSidebarCollapsed();
  const location = useLocation();
  const savedBeforeAgentRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (mode !== 'app') return;

    if (isAgentSessionPath(location.pathname)) {
      if (savedBeforeAgentRef.current === null) {
        savedBeforeAgentRef.current = getSidebarCollapsed();
      }
      if (!getSidebarCollapsed()) {
        setSidebarCollapsed(true);
      }
      return;
    }

    if (savedBeforeAgentRef.current !== null) {
      setSidebarCollapsed(savedBeforeAgentRef.current);
      savedBeforeAgentRef.current = null;
    }
  }, [location.pathname, mode]);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setSidebarCollapsed(next);
    if (isAgentSessionPath(location.pathname)) {
      savedBeforeAgentRef.current = next;
    }
  };

  const sidebarContent = (
    <SidebarInner
      mode={mode}
      collapsed={collapsed}
      onToggleCollapse={handleToggleCollapse}
      onMobileClose={onMobileClose}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col h-screen sticky top-0 bg-white border-r border-[#f0f0f0] transition-[width] duration-200 ease-out overflow-hidden ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="关闭菜单"
            onClick={onMobileClose}
          />
          <aside className="relative w-full max-w-[320px] h-full bg-white flex flex-col shadow-xl">
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={onMobileClose}
                className="w-9 h-9 rounded-lg border border-black/10 text-black/55 hover:bg-[#f7f7f8]"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <SidebarInner
              mode={mode}
              collapsed={false}
              onToggleCollapse={() => onMobileClose?.()}
              onMobileClose={onMobileClose}
            />
          </aside>
        </div>
      )}
    </>
  );
}
