import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Code2,
  Folder,
  Gauge,
  Home,
  LayoutDashboard,
  ListChecks,
  LogIn,
  Settings,
  ShieldCheck,
  WandSparkles,
} from 'lucide-react';
import { CATEGORIES, type AgentCategory } from '../data/agentsCatalog';

export type SidebarMode = 'app' | 'guest';

export const MARKET_SUBCATEGORIES = CATEGORIES.filter((c) => c.id !== 'all');

export type AppNavId =
  | 'workbench'
  | 'market'
  | 'tasks'
  | 'results'
  | 'studio'
  | 'admin'
  | 'usage'
  | 'settings';

export type GuestNavId = 'market' | 'tutorial' | 'api' | 'login';

export interface AppNavItem {
  id: AppNavId;
  label: string;
  icon: LucideIcon;
  to: string;
  end?: boolean;
  hasSubmenu?: boolean;
}

export interface GuestNavItem {
  id: GuestNavId;
  label: string;
  icon: LucideIcon;
  to?: string;
  action?: 'login';
  hasSubmenu?: boolean;
  requiresLogin?: boolean;
}

export const APP_NAV_PRIMARY: AppNavItem[] = [
  {
    id: 'market',
    label: '首页',
    icon: Home,
    to: '/app/agents',
    end: true,
  },
  {
    id: 'workbench',
    label: '我的工作台',
    icon: LayoutDashboard,
    to: '/app',
    end: true,
  },
  {
    id: 'tasks',
    label: '任务中心',
    icon: ListChecks,
    to: '/app/tasks',
  },
  {
    id: 'results',
    label: '成果中心',
    icon: Folder,
    to: '/app/results',
  },
];

export const APP_NAV_SECONDARY: AppNavItem[] = [
  {
    id: 'studio',
    label: 'Creator Studio',
    icon: WandSparkles,
    to: '/app/studio',
  },
  {
    id: 'admin',
    label: 'Boss Admin',
    icon: ShieldCheck,
    to: '/admin',
  },
  {
    id: 'usage',
    label: '算力中心',
    icon: Gauge,
    to: '/app/usage',
  },
  {
    id: 'settings',
    label: '设置',
    icon: Settings,
    to: '/app/settings',
  },
];

export const GUEST_NAV_ITEMS: GuestNavItem[] = [
  {
    id: 'market',
    label: '首页',
    icon: Home,
    to: '/agents',
  },
  {
    id: 'tutorial',
    label: '教程',
    icon: BookOpen,
    to: '/agents',
  },
  {
    id: 'api',
    label: 'API',
    icon: Code2,
    to: '/agents',
  },
  {
    id: 'login',
    label: '登录',
    icon: LogIn,
    action: 'login',
  },
];

export function isAppNavActive(id: AppNavId, pathname: string): boolean {
  switch (id) {
    case 'workbench':
      return pathname === '/app' || /^\/app\/agents\/[^/]+$/.test(pathname);
    case 'market':
      return pathname === '/app/agents';
    case 'tasks':
      return pathname === '/app/tasks' || pathname.startsWith('/app/tasks/');
    case 'results':
      return pathname === '/app/results' || pathname.startsWith('/app/results/');
    case 'studio':
      return pathname === '/app/studio' || pathname.startsWith('/app/studio/');
    case 'admin':
      return pathname === '/admin' || pathname.startsWith('/admin/');
    case 'usage':
      return pathname === '/app/usage';
    case 'settings':
      return pathname === '/app/settings' || pathname.startsWith('/app/settings/');
    default:
      return false;
  }
}

export function isGuestNavActive(id: GuestNavId, pathname: string): boolean {
  if (id === 'market') {
    return pathname === '/agents' || pathname.startsWith('/agents/');
  }
  return false;
}

export function marketCategoryHref(
  mode: SidebarMode,
  category: AgentCategory,
): string {
  const base = mode === 'guest' ? '/agents' : '/app/agents';
  if (category === 'all') return base;
  return `${base}?category=${category}`;
}

export function parseMarketCategory(search: string): AgentCategory {
  const value = new URLSearchParams(search).get('category');
  if (value && MARKET_SUBCATEGORIES.some((c) => c.id === value)) {
    return value as AgentCategory;
  }
  return 'all';
}
