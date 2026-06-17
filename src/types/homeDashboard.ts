import type { Task, TaskStatus, UsageSnapshot } from './workbench';

export interface AgentQuotaSnapshot {
  planName: string;
  enabledCount: number;
  enabledLimit: number;
  slotsRemaining: number;
}

export interface EnabledAgentSummary {
  agentId: string;
  name: string;
  description: string;
  path: string;
  iconSrc: string;
  monthlyTaskCount: number;
  monthlyTokenUsed: number;
  latestTask?: {
    id: string;
    name: string;
    status: TaskStatus;
    updatedAt: string;
  };
  /** 最近任务时间或启用时间，用于首页排序 */
  lastUsedAt?: string;
  templates: Array<{ id: string; title: string; prompt?: string }>;
}

export interface RecommendedAction {
  id: string;
  title: string;
  agentId: string;
  sourceTaskId?: string;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  requiresActivation: boolean;
}

export type PromptMatchResult =
  | { type: 'match'; agentId: string; agentName: string }
  | { type: 'needs_enable'; agentId: string; agentName: string }
  | { type: 'slots_full'; agentId: string; agentName: string }
  | { type: 'no_match' };

export interface HomeDashboardData {
  usage: UsageSnapshot;
  agentQuota: AgentQuotaSnapshot;
  enabledAgents: EnabledAgentSummary[];
  recentTasks: Task[];
  recommendedActions: RecommendedAction[];
  addableAgentIds: string[];
}
