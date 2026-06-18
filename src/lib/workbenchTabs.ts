import type { EnabledAgentSummary } from '../types/homeDashboard';

export const WORKBENCH_TABS_MIGRATION_KEY = 'hellome_workbench_tabs_v2';

export const WORKBENCH_HIDDEN_TABS_KEY = 'hellome_workbench_hidden_tabs';
export const WORKBENCH_TAB_ORDER_KEY = 'hellome_workbench_tab_order';
export const WORKBENCH_LAST_AGENT_KEY = 'hellome_workbench_last_agent';
export const WORKBENCH_PINNED_TABS_KEY = 'hellome_workbench_pinned_tabs';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeWorkbenchTabs(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function migrateWorkbenchTabsIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(WORKBENCH_TABS_MIGRATION_KEY) === '1') return;

  // 旧版会把全部可用智能体展示为标签；重置为仅用户主动打开后才出现标签
  window.localStorage.removeItem(WORKBENCH_TAB_ORDER_KEY);
  window.localStorage.removeItem(WORKBENCH_HIDDEN_TABS_KEY);
  window.localStorage.removeItem(WORKBENCH_PINNED_TABS_KEY);
  window.localStorage.removeItem(WORKBENCH_LAST_AGENT_KEY);
  window.localStorage.setItem(WORKBENCH_TABS_MIGRATION_KEY, '1');
  notify();
}

function readStringArray(key: string): string[] {
  migrateWorkbenchTabsIfNeeded();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, next: string[]): void {
  localStorage.setItem(key, JSON.stringify(next));
  notify();
}

export function getHiddenTabIds(): string[] {
  return readStringArray(WORKBENCH_HIDDEN_TABS_KEY);
}

export function getTabOrder(): string[] {
  return readStringArray(WORKBENCH_TAB_ORDER_KEY);
}

export function getPinnedTabIds(): string[] {
  return readStringArray(WORKBENCH_PINNED_TABS_KEY);
}

/** 智能体标签是否已在工作台标签栏中打开 */
export function isAgentTabOpen(agentId: string): boolean {
  return getVisibleRecentAgentIds().includes(agentId);
}

export function isTabVisible(agentId: string): boolean {
  return !getHiddenTabIds().includes(agentId);
}

export function showAgentTab(agentId: string): void {
  writeStringArray(
    WORKBENCH_HIDDEN_TABS_KEY,
    getHiddenTabIds().filter((id) => id !== agentId),
  );
}

export function hideAgentTab(agentId: string): void {
  writeStringArray(
    WORKBENCH_HIDDEN_TABS_KEY,
    Array.from(new Set([...getHiddenTabIds(), agentId])),
  );
}

/** 关闭工作台标签：隐藏标签并更新最近打开记录 */
export function closeAgentTab(agentId: string): void {
  hideAgentTab(agentId);
  const visible = getVisibleRecentAgentIds();
  if (getLastOpenedAgentId() === agentId) {
    const fallback = visible[visible.length - 1] ?? null;
    if (fallback) setLastOpenedAgentId(fallback);
    else {
      localStorage.removeItem(WORKBENCH_LAST_AGENT_KEY);
      notify();
    }
  }
}

export function setTabOrder(order: string[]): void {
  writeStringArray(WORKBENCH_TAB_ORDER_KEY, order);
}

export function setLastOpenedAgentId(agentId: string): void {
  localStorage.setItem(WORKBENCH_LAST_AGENT_KEY, agentId);
  notify();
}

export function getLastOpenedAgentId(): string | null {
  return localStorage.getItem(WORKBENCH_LAST_AGENT_KEY);
}

/** 最近打开且未关闭的智能体标签 ID */
export function getVisibleRecentAgentIds(): string[] {
  const hidden = new Set(getHiddenTabIds());
  return getTabOrder().filter((id) => !hidden.has(id));
}

export function sortRecentAgentSummaries(agents: EnabledAgentSummary[]): EnabledAgentSummary[] {
  const hidden = getHiddenTabIds();
  const order = getTabOrder();
  const pinned = new Set(getPinnedTabIds());
  const orderMap = new Map(order.map((id, idx) => [id, idx]));

  return agents
    .filter((agent) => order.includes(agent.agentId) && !hidden.includes(agent.agentId))
    .sort((a, b) => {
      const pinDiff = Number(pinned.has(b.agentId)) - Number(pinned.has(a.agentId));
      if (pinDiff !== 0) return pinDiff;
      const aIdx = orderMap.get(a.agentId) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderMap.get(b.agentId) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
}

/** @deprecated 使用 sortRecentAgentSummaries */
export function getVisibleEnabledAgents(agents: EnabledAgentSummary[]): EnabledAgentSummary[] {
  return sortRecentAgentSummaries(agents);
}

export function findAdjacentVisibleTabId(
  closingAgentId: string,
): string | null {
  const visibleIds = getVisibleRecentAgentIds();
  const idx = visibleIds.indexOf(closingAgentId);
  if (idx < 0) return visibleIds[0] ?? null;
  return visibleIds[idx + 1] ?? visibleIds[idx - 1] ?? null;
}

export function openAgentTab(agentId: string): void {
  showAgentTab(agentId);
  const order = getTabOrder();
  if (!order.includes(agentId)) {
    setTabOrder([...order, agentId]);
  }
  setLastOpenedAgentId(agentId);
}

export function pruneWorkbenchTabs(validAgentIds: Set<string>): void {
  const hidden = getHiddenTabIds().filter((id) => validAgentIds.has(id));
  const order = getTabOrder().filter((id) => validAgentIds.has(id));
  if (hidden.length !== getHiddenTabIds().length) {
    writeStringArray(WORKBENCH_HIDDEN_TABS_KEY, hidden);
  }
  if (order.length !== getTabOrder().length) {
    writeStringArray(WORKBENCH_TAB_ORDER_KEY, order);
  }
}
