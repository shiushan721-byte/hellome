import { AGENTS } from '../data/agentsCatalog';

export type AgentActivationStatus = 'inactive' | 'active' | 'readonly';

export interface PlanEntitlements {
  planName: string;
  monthlyTokenLimit: number;
  enabledAgentLimit: number;
}

export interface UserAgentActivation {
  agentId: string;
  status: AgentActivationStatus;
  activatedAt?: string;
  deactivatedAt?: string;
  completedTaskCount: number;
  tokenUsed: number;
}

export interface EnableCheckResult {
  allowed: boolean;
  reason?: 'already_active' | 'unavailable' | 'slots_full';
  message?: string;
}

export interface DeactivateCheckResult {
  allowed: boolean;
  message?: string;
  hasRunningTasks?: boolean;
}

/** 目录中所有智能体均参与名额占用 */
export const SLOT_AGENT_IDS = AGENTS.map((a) => a.id);

export type SlotAgentId = string;

export function isSlotAgent(agentId: string): boolean {
  return AGENTS.some((a) => a.id === agentId);
}

export function agentTypeToSlotId(agentType: string): SlotAgentId | null {
  if (isSlotAgent(agentType)) return agentType;
  return null;
}
