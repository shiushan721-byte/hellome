import { isAuthenticated } from './auth';
import { isHermesConnected } from './firstRunOnboarding';
import { stashIntent, type AgentIntentAction, type PendingAgentIntent } from './pendingAgentIntent';
import { openAgentWorkspace } from './openAgentWorkspace';

export type UseAgentBlockReason = 'login' | 'hermes' | 'recharge' | 'unavailable';

export interface UseAgentOptions {
  guestMode?: boolean;
  lowBalance?: boolean;
  action?: AgentIntentAction;
  redirect?: string;
}

export interface UseAgentResult {
  ok: boolean;
  reason?: UseAgentBlockReason;
  agentId: string;
}

export function buildUseAgentIntent(
  agentId: string,
  options: UseAgentOptions = {},
): PendingAgentIntent {
  return {
    agentId,
    action: options.action ?? 'use',
    redirect: options.redirect ?? `/app?agent=${agentId}`,
  };
}

/** 判断使用智能体时的阻塞原因；无阻塞则返回 null */
export function getUseAgentBlockReason(
  agentId: string,
  options: UseAgentOptions = {},
): UseAgentBlockReason | null {
  const guestMode = options.guestMode ?? !isAuthenticated();

  if (guestMode) return 'login';
  if (!isHermesConnected()) return 'hermes';
  if (options.lowBalance) return 'recharge';
  return null;
}

export function stashUseAgentIntent(agentId: string, options: UseAgentOptions = {}): void {
  stashIntent(buildUseAgentIntent(agentId, options));
}

/**
 * 统一「使用智能体」判断：登录 → 配对 → 充值 → 打开工作台
 * 返回结果供调用方展示弹窗或跳转。
 */
export function tryUseAgent(agentId: string, options: UseAgentOptions = {}): UseAgentResult {
  const block = getUseAgentBlockReason(agentId, options);
  if (block === 'login' || block === 'hermes') {
    stashUseAgentIntent(agentId, options);
    return { ok: false, reason: block, agentId };
  }
  if (block === 'recharge') {
    return { ok: false, reason: block, agentId };
  }

  openAgentWorkspace(agentId);
  return { ok: true, agentId };
}
