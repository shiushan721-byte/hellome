import type { LucideIcon } from 'lucide-react';
import {
  Code2,
  FolderKanban,
  Gauge,
  Home,
  LayoutDashboard,
  LogIn,
  Settings,
} from 'lucide-react';
import { CATEGORIES, type AgentCategory } from '../data/agentsCatalog';

export type SidebarMode = 'app' | 'guest';

export const MARKET_SUBCATEGORIES = CATEGORIES.filter((c) => c.id !== 'all');

export type AppNavId =
  | 'workbench'
  | 'market'
  | 'projects'
  | 'usage'
  | 'api'
  | 'settings';

export type GuestNavId = 'market' | 'api' | 'login';

export interface AppNavItem {
  id: AppNavId;
  label: string;
  icon: LucideIcon;
  to?: string;
  end?: boolean;
  hasSubmenu?: boolean;
  action?: 'agentsyun';
}

export interface GuestNavItem {
  id: GuestNavId;
  label: string;
  icon: LucideIcon;
  to?: string;
  action?: 'login' | 'agentsyun';
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
    id: 'projects',
    label: '项目中心',
    icon: FolderKanban,
    to: '/app/projects',
  },
  {
    id: 'usage',
    label: '账户总览',
    icon: Gauge,
    to: '/app/usage',
  },
];

export const APP_NAV_SECONDARY: AppNavItem[] = [
  {
    id: 'api',
    label: 'API',
    icon: Code2,
    action: 'agentsyun',
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
    id: 'api',
    label: 'API',
    icon: Code2,
    action: 'agentsyun',
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
    case 'projects':
      return pathname === '/app/projects';
    case 'usage':
      return pathname === '/app/usage' || pathname.startsWith('/app/usage/');
    case 'api':
      return false;
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

/** 用户已进入某个智能体工作台（非智能体市场列表页） */
export function isAgentSessionPath(pathname: string): boolean {
  return pathname.startsWith('/app/agents/') && pathname.length > '/app/agents/'.length;
}
