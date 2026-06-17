import { AGENTS, getAgentById } from '../data/agentsCatalog';
import type {
  AgentMarketCard,
  AgentMarketStatus,
  AgentQuotaSnapshot,
  AgentsPageData,
  AgentsTab,
  MyAgentCard,
} from '../types/agentsPage';
import {
  canDeactivateAgent,
  getActivation,
  getActivations,
  getActiveAgents,
  getAgentDisplayStatus,
  getOccupiedSlotCount,
} from './agentSlotStore';
import { getPlanEntitlements } from './planEntitlements';
import { getTasks } from './taskStore';
import { getUsage } from './usageStore';

const TASK_STATUS_LABEL: Record<string, string> = {
  running: '进行中',
  waiting_confirmation: '等待确认',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
};

export function normalizeAgentsTab(tab: string | null): AgentsTab {
  if (tab === 'mine' || tab === 'enabled' || tab === 'cooling') return 'mine';
  return 'market';
}

function parseTokenRange(tokenRange: string): { min: number; max: number } {
  const nums = tokenRange.match(/[\d,]+/g);
  if (!nums || nums.length < 2) return { min: 0, max: 0 };
  return {
    min: Number(nums[0].replace(/,/g, '')),
    max: Number(nums[1].replace(/,/g, '')),
  };
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function resolveMarketStatus(agentId: string, planAvailable: boolean): AgentMarketStatus {
  if (!planAvailable) return 'coming_soon';

  if (getAgentDisplayStatus(agentId, true) === 'active') return 'active';
  if (getAgentDisplayStatus(agentId, planAvailable) === 'unavailable') return 'plan_unavailable';

  const plan = getPlanEntitlements(getUsage().planName);
  if (getOccupiedSlotCount() >= plan.enabledAgentLimit) return 'quota_full';

  return 'inactive';
}

function buildQuotaSnapshot(): AgentQuotaSnapshot {
  const usage = getUsage();
  const plan = getPlanEntitlements(usage.planName);
  const occupied = getOccupiedSlotCount();

  return {
    enabledCount: getActiveAgents().length,
    enabledLimit: plan.enabledAgentLimit,
    tokenBalance: usage.tokenBalance,
    planName: usage.planName,
    slotsRemaining: Math.max(0, plan.enabledAgentLimit - occupied),
  };
}

function buildMarketAgents(): AgentMarketCard[] {
  return AGENTS.map((agent) => {
    const { min, max } = parseTokenRange(agent.tokenRange);
    return {
      id: agent.id,
      name: agent.name,
      description: agent.desc,
      category: agent.category,
      tokenRange: agent.tokenRange,
      estimatedTokenMin: min,
      estimatedTokenMax: max,
      creator: agent.creator,
      creatorAvatar: agent.creatorAvatar,
      heat: agent.heat,
      likes: agent.likes,
      iconSrc: agent.iconSrc,
      status: resolveMarketStatus(agent.id, agent.available),
      badge: agent.badge,
    };
  });
}

function isReadonlyAgent(agentId: string): boolean {
  const activation = getActivation(agentId);
  if (!activation || activation.status !== 'active') return false;

  const plan = getPlanEntitlements(getUsage().planName);
  const active = getActiveAgents();
  const idx = active.findIndex((a) => a.agentId === agentId);
  return idx >= 0 && idx >= plan.enabledAgentLimit;
}

function buildMyAgents(): MyAgentCard[] {
  const month = currentMonthKey();
  const tasks = getTasks();
  const cards: MyAgentCard[] = [];

  for (const activation of getActivations().filter((a) => a.status === 'active')) {
    const agent = getAgentById(activation.agentId);
    if (!agent) continue;

    const agentTasks = tasks.filter(
      (t) => t.agentType === activation.agentId && t.createdAt.startsWith(month),
    );
    const latest = [...tasks]
      .filter((t) => t.agentType === activation.agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const readonly = isReadonlyAgent(activation.agentId);
    const status = readonly ? 'readonly' : 'active';
    const deactivateCheck =
      status === 'active' ? canDeactivateAgent(activation.agentId) : { allowed: false };

    cards.push({
      id: agent.id,
      name: agent.name,
      description: agent.desc,
      iconSrc: agent.iconSrc,
      status,
      monthlyTaskCount: agentTasks.length,
      monthlyTokenUsed: activation.tokenUsed,
      latestTask: latest
        ? {
            id: latest.id,
            name: latest.name,
            status: latest.status,
            statusLabel: TASK_STATUS_LABEL[latest.status] ?? latest.status,
            updatedAt: latest.completedAt ?? latest.createdAt,
          }
        : undefined,
      canDeactivate: deactivateCheck.allowed,
      deactivateReason: !deactivateCheck.allowed ? deactivateCheck.message : undefined,
      hasRunningTasks: deactivateCheck.hasRunningTasks ?? false,
    });
  }

  return cards;
}

export function getAgentsPageData(tab: string | null): AgentsPageData {
  return {
    activeTab: normalizeAgentsTab(tab),
    quota: buildQuotaSnapshot(),
    marketAgents: buildMarketAgents(),
    myAgents: buildMyAgents(),
  };
}
