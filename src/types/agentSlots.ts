export type AgentActivationStatus =
  | 'inactive'
  | 'active'
  | 'cooling_down'
  | 'unavailable';

export interface PlanEntitlements {
  planName: string;
  monthlyTokenLimit: number;
  enabledAgentLimit: number;
  monthlyInstantSwapLimit: number;
}

export interface UserAgentActivation {
  agentId: string;
  status: AgentActivationStatus;
  activatedAt?: string;
  deactivatedAt?: string;
  slotReleaseAt?: string;
  completedTaskCount: number;
  tokenUsed: number;
}

export interface AgentSwapQuota {
  month: string;
  instantSwapUsed: number;
  instantSwapLimit: number;
}

export type DeactivateMode = 'trial_release' | 'instant_swap' | 'cooldown';

export interface EnableCheckResult {
  allowed: boolean;
  reason?: 'already_active' | 'unavailable' | 'slots_full' | 'cooling';
  message?: string;
}

export interface DeactivateCheckResult {
  allowed: boolean;
  mode?: DeactivateMode;
  message?: string;
  releaseAt?: string;
  hasRunningTasks?: boolean;
}

export const SLOT_RULES = {
  trialWindowMs: 10 * 60 * 1000,
  trialTokenThreshold: 1000,
  cooldownMs: 24 * 60 * 60 * 1000,
} as const;

/** Core agents that participate in slot quota */
export const SLOT_AGENT_IDS = ['geo', 'media', 'sales'] as const;
export type SlotAgentId = (typeof SLOT_AGENT_IDS)[number];

export function isSlotAgent(agentId: string): agentId is SlotAgentId {
  return (SLOT_AGENT_IDS as readonly string[]).includes(agentId);
}

export function agentTypeToSlotId(agentType: string): SlotAgentId | null {
  if (agentType === 'geo' || agentType === 'media' || agentType === 'sales') return agentType;
  return null;
}
