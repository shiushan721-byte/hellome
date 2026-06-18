import { activateAgent } from './agentSlotStore';
import { isHermesConnected } from './firstRunOnboarding';
import { isAuthenticated } from './auth';
import { openAgentTab } from './workbenchTabs';

export type AgentIntentAction = 'enable' | 'use' | 'view' | 'enter';

export interface PendingAgentIntent {
  redirect?: string;
  agentId?: string;
  action?: AgentIntentAction;
}

const STORAGE_KEY = 'hellome_pending_agent_intent';

export function savePendingIntent(intent: PendingAgentIntent): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function getPendingIntent(): PendingAgentIntent | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingAgentIntent;
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function parseIntentFromSearchParams(params: URLSearchParams): PendingAgentIntent {
  const redirect = params.get('redirect') || undefined;
  const agentId = params.get('agent') || params.get('agentId') || undefined;
  const action = params.get('action') as AgentIntentAction | null;
  return {
    redirect,
    agentId,
    action: action || undefined,
  };
}

export function mergeIntent(base: PendingAgentIntent, extra: PendingAgentIntent): PendingAgentIntent {
  return {
    redirect: extra.redirect ?? base.redirect,
    agentId: extra.agentId ?? base.agentId,
    action: extra.action ?? base.action,
  };
}

export function buildLoginUrl(intent: PendingAgentIntent): string {
  const params = new URLSearchParams();
  if (intent.redirect) params.set('redirect', intent.redirect);
  if (intent.agentId) params.set('agent', intent.agentId);
  if (intent.action) params.set('action', intent.action);
  const qs = params.toString();
  return qs ? `/login?${qs}` : '/login';
}

export function buildConnectHermesUrl(intent: PendingAgentIntent): string {
  const params = new URLSearchParams();
  if (intent.redirect) params.set('redirect', intent.redirect);
  if (intent.agentId) params.set('agent', intent.agentId);
  if (intent.action) params.set('action', intent.action);
  const qs = params.toString();
  return qs ? `/connect-hermes?${qs}` : '/connect-hermes';
}

export function stashIntent(intent: PendingAgentIntent): void {
  const existing = getPendingIntent();
  savePendingIntent(existing ? mergeIntent(existing, intent) : intent);
}

/** 配对或登录完成后回放用户意图，返回目标路径 */
export function replayPendingIntent(): string {
  const intent = getPendingIntent();
  clearPendingIntent();

  if (!intent) return '/app';

  const { agentId, action, redirect } = intent;

  if (agentId && (action === 'enable' || action === 'use' || action === 'enter')) {
    activateAgent(agentId);
    openAgentTab(agentId);
    return `/app?agent=${agentId}`;
  }

  if (redirect) return redirect;

  if (agentId && action === 'view') {
    return `/app/agents/${agentId}`;
  }

  if (agentId) return `/app/agents/${agentId}`;

  return '/app';
}

export function resolvePostLoginPath(intent: PendingAgentIntent): string {
  stashIntent(intent);
  if (!isHermesConnected()) {
    return buildConnectHermesUrl(intent);
  }
  return replayPendingIntent();
}

export type UserAccessLevel = 'visitor' | 'logged_in_unpaired' | 'logged_in_paired';

export function getUserAccessLevel(): UserAccessLevel {
  if (!isAuthenticated()) return 'visitor';
  if (!isHermesConnected()) return 'logged_in_unpaired';
  return 'logged_in_paired';
}
