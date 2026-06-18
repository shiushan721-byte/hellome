import type { EnabledAgentSummary } from '../types/homeDashboard';

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

function readStringArray(key: string): string[] {
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

export function setTabOrder(order: string[]): void {
  writeStringArray(WORKBENCH_TAB_ORDER_KEY, order);
}

export function setLastOpenedAgentId(agentId: string): void {
  localStorage.setItem(WORKBENCH_LAST_AGENT_KEY, agentId);
}

export function getLastOpenedAgentId(): string | null {
  return localStorage.getItem(WORKBENCH_LAST_AGENT_KEY);
}

export function sortVisibleEnabledAgents(agents: EnabledAgentSummary[]): EnabledAgentSummary[] {
  const hidden = getHiddenTabIds();
  const order = getTabOrder();
  const pinned = new Set(getPinnedTabIds());
  const orderMap = new Map(order.map((id, idx) => [id, idx]));

  return agents
    .filter((agent) => !hidden.includes(agent.agentId))
    .sort((a, b) => {
      const pinDiff = Number(pinned.has(b.agentId)) - Number(pinned.has(a.agentId));
      if (pinDiff !== 0) return pinDiff;
      const aIdx = orderMap.get(a.agentId) ?? Number.MAX_SAFE_INTEGER;
      const bIdx = orderMap.get(b.agentId) ?? Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
}

export function getVisibleEnabledAgents(agents: EnabledAgentSummary[]): EnabledAgentSummary[] {
  return sortVisibleEnabledAgents(agents);
}

export function shouldShowEnabledAgentsPanel(enabledAgents: EnabledAgentSummary[]): boolean {
  return enabledAgents.length > 0 && getVisibleEnabledAgents(enabledAgents).length === 0;
}

export function findAdjacentVisibleTabId(
  closingAgentId: string,
  enabledAgentIds: string[],
): string | null {
  const visibleIds = enabledAgentIds.filter((id) => isTabVisible(id));
  const idx = visibleIds.indexOf(closingAgentId);
  if (idx < 0) return visibleIds[0] ?? null;
  return visibleIds[idx + 1] ?? visibleIds[idx - 1] ?? null;
}

export function openAgentTab(agentId: string): void {
  showAgentTab(agentId);
  setLastOpenedAgentId(agentId);
}

export function pruneWorkbenchTabs(enabledAgentIds: Set<string>): void {
  const hidden = getHiddenTabIds().filter((id) => enabledAgentIds.has(id));
  const order = getTabOrder().filter((id) => enabledAgentIds.has(id));
  if (hidden.length !== getHiddenTabIds().length) {
    writeStringArray(WORKBENCH_HIDDEN_TABS_KEY, hidden);
  }
  if (order.length !== getTabOrder().length) {
    writeStringArray(WORKBENCH_TAB_ORDER_KEY, order);
  }
}
