import type {
  AgentQuotaSnapshot,
  EnabledAgentSummary,
  HomeDashboardData,
  PromptMatchResult,
  RecommendedAction,
} from '../types/homeDashboard';
import type { Task, TaskStatus } from '../types/workbench';
import { SLOT_AGENT_IDS } from '../types/agentSlots';
import { getAgentById } from '../data/agentsCatalog';
import {
  canEnableAgent,
  getActiveAgents,
  getOccupiedSlotCount,
  isAgentActive,
} from './agentSlotStore';
import { getPlanEntitlements } from './planEntitlements';
import { getUsage, isLowBalance } from './usageStore';
import { getTasks } from './taskStore';
import { getAgentsPageData } from './agentsPageData';
import type { AgentMarketCard } from '../types/agentsPage';

const AGENT_KEYWORDS: Partial<Record<string, string[]>> = {
  geo: ['geo', '检测', '可见度', '品牌', 'ai', '搜索', '大模型', '优化', 'faq', '提及'],
  media: ['公众号', '小红书', '自媒体', '文章', '改写', '标题', '内容'],
  sales: ['销售', '客户', '私信', '邮件', '获客', '外联', '跟进', '话术'],
  'faq-generator': ['faq', '问答', 'llms', '语料', '召回', '结构化', '批量'],
};

export const AGENT_TASK_TEMPLATES: Partial<
  Record<string, Array<{ id: string; title: string; prompt?: string }>>
> = {
  geo: [
    { id: 'geo-detect', title: '检测品牌 AI 可见度', prompt: '检测品牌在 AI 搜索里的可见度' },
    { id: 'geo-suggest', title: '生成 GEO 优化建议', prompt: '生成 GEO 优化建议' },
  ],
  media: [
    { id: 'media-article', title: '写公众号文章', prompt: '写一篇公众号文章' },
    { id: 'media-xhs', title: '小红书改写', prompt: '把内容改成小红书风格' },
  ],
  sales: [
    { id: 'sales-analyze', title: '分析客户网站', prompt: '分析客户网站' },
    { id: 'sales-dm', title: '生成销售私信', prompt: '生成销售私信' },
  ],
  'faq-generator': [
    { id: 'faq-batch', title: '批量生成 FAQ', prompt: '基于品牌语料批量生成 FAQ' },
    { id: 'faq-llms', title: '生成 LLMs.txt', prompt: '生成 LLMs.txt 提升 AI 召回' },
  ],
};

const ONBOARDING_AGENT_IDS = ['geo', 'media', 'sales', 'faq-generator'] as const;

function scoreAgent(prompt: string, agentId: string): number {
  const lower = prompt.toLowerCase();
  const keywords = AGENT_KEYWORDS[agentId];
  if (!keywords?.length) return 0;
  return keywords.reduce((score, kw) => {
    if (lower.includes(kw.toLowerCase())) return score + 1;
    return score;
  }, 0);
}

export function matchPromptToAgent(prompt: string): PromptMatchResult {
  const trimmed = prompt.trim();
  if (!trimmed) return { type: 'no_match' };

  const enabledIds = getActiveAgents().map((a) => a.agentId);

  // 优先在已启用智能体中匹配
  let bestEnabled: string | null = null;
  let bestEnabledScore = 0;
  for (const id of enabledIds) {
    const s = scoreAgent(trimmed, id);
    if (s > bestEnabledScore) {
      bestEnabledScore = s;
      bestEnabled = id;
    }
  }
  if (bestEnabled && bestEnabledScore > 0) {
    const agent = getAgentById(bestEnabled);
    return { type: 'match', agentId: bestEnabled, agentName: agent?.name ?? bestEnabled };
  }

  // 未命中已启用时，判断最适合但未启用的智能体
  let best: string | null = null;
  let bestScore = 0;
  for (const id of SLOT_AGENT_IDS) {
    const s = scoreAgent(trimmed, id);
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }

  if (!best || bestScore === 0) return { type: 'no_match' };

  const agent = getAgentById(best);
  const agentName = agent?.name ?? best;

  const check = canEnableAgent(best, agent?.available ?? false);
  if (check.reason === 'slots_full') {
    return { type: 'slots_full', agentId: best, agentName };
  }

  return { type: 'needs_enable', agentId: best, agentName };
}

function taskUpdatedAt(task: Task): string {
  return task.completedAt ?? task.createdAt;
}

function buildEnabledSummaries(): EnabledAgentSummary[] {
  const tasks = getTasks();
  const result: EnabledAgentSummary[] = [];

  for (const activation of getActiveAgents()) {
    const agent = getAgentById(activation.agentId);
    if (!agent) continue;

    const agentTasks = tasks
      .filter((t) => t.agentType === activation.agentId)
      .sort((a, b) => new Date(taskUpdatedAt(b)).getTime() - new Date(taskUpdatedAt(a)).getTime());

    const latest = agentTasks[0];
    const slotId = activation.agentId;
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const monthTasks = agentTasks.filter(
      (t) => t.createdAt.startsWith(monthKey) && (t.status === 'completed' || t.status === 'failed'),
    );
    const monthlyTokenFromTasks = monthTasks.reduce((sum, t) => sum + t.tokenUsed, 0);

    result.push({
      agentId: activation.agentId,
      name: agent.name,
      description: agent.desc,
      path: agent.path,
      iconSrc: agent.iconSrc,
      monthlyTaskCount: monthTasks.length || activation.completedTaskCount,
      monthlyTokenUsed: monthlyTokenFromTasks || activation.tokenUsed,
      lastUsedAt: latest ? taskUpdatedAt(latest) : activation.activatedAt,
      latestTask: latest
        ? {
            id: latest.id,
            name: latest.name,
            status: latest.status,
            updatedAt: taskUpdatedAt(latest),
          }
        : undefined,
      templates: AGENT_TASK_TEMPLATES[slotId] ?? [],
    });
  }

  return result.sort((a, b) => {
    const ta = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const tb = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return tb - ta;
  });
}

function buildAgentQuota(): AgentQuotaSnapshot {
  const usage = getUsage();
  const plan = getPlanEntitlements(usage.planName);
  const enabledCount = getOccupiedSlotCount();

  return {
    planName: usage.planName,
    enabledCount,
    enabledLimit: plan.enabledAgentLimit,
    slotsRemaining: Math.max(0, plan.enabledAgentLimit - enabledCount),
  };
}

function buildRecommendedActions(enabledIds: Set<string>): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const tasks = getTasks();

  const lastGeo = tasks.find((t) => t.agentType === 'geo' && t.status === 'completed');
  if (lastGeo && enabledIds.has('geo')) {
    actions.push({
      id: 'rec-geo-faq',
      title: '基于上次 GEO 报告，继续生成官网 FAQ',
      agentId: 'geo',
      sourceTaskId: lastGeo.id,
      estimatedTokenMin: 3000,
      estimatedTokenMax: 8000,
      requiresActivation: false,
    });
  }

  if (!enabledIds.has('media')) {
    actions.push({
      id: 'rec-media-hint',
      title: '把文章改成公众号风格（需启用自媒体智能体）',
      agentId: 'media',
      estimatedTokenMin: 2000,
      estimatedTokenMax: 12000,
      requiresActivation: true,
    });
  } else {
    const lastContent = tasks.find((t) => t.status === 'completed');
    if (lastContent) {
      actions.push({
        id: 'rec-media-xhs',
        title: '基于上次内容，继续生成小红书改写版',
        agentId: 'media',
        sourceTaskId: lastContent.id,
        estimatedTokenMin: 2000,
        estimatedTokenMax: 8000,
        requiresActivation: false,
      });
    }
  }

  if (enabledIds.has('sales')) {
    actions.push({
      id: 'rec-sales-followup',
      title: '基于客户分析结果，继续生成跟进邮件',
      agentId: 'sales',
      estimatedTokenMin: 1500,
      estimatedTokenMax: 4000,
      requiresActivation: false,
    });
  }

  return actions.slice(0, 3);
}

function buildAddableAgentIds(): string[] {
  return SLOT_AGENT_IDS.filter((id) => {
    if (isAgentActive(id)) return false;
    const agent = getAgentById(id);
    if (!agent?.available) return false;
    const check = canEnableAgent(id, true);
    return check.allowed || check.reason === 'already_active';
  });
}

function buildRecentTasks(enabledIds: Set<string>): Task[] {
  const tasks = getTasks();
  const enabled = tasks.filter((t) => enabledIds.has(t.agentType));
  const other = tasks.filter((t) => !enabledIds.has(t.agentType));
  return [...enabled, ...other].slice(0, 8);
}

export function getHomeDashboardData(): HomeDashboardData {
  const usage = getUsage();
  const enabledAgents = buildEnabledSummaries();
  const enabledIds = new Set(enabledAgents.map((a) => a.agentId));

  return {
    usage,
    agentQuota: buildAgentQuota(),
    enabledAgents,
    recentTasks: buildRecentTasks(enabledIds),
    recommendedActions: buildRecommendedActions(enabledIds),
    addableAgentIds: buildAddableAgentIds(),
  };
}

export function getOnboardingAgents() {
  return ONBOARDING_AGENT_IDS.map((id) => getAgentById(id)).filter(Boolean);
}

export function getOnboardingMarketCards(): AgentMarketCard[] {
  const ids = new Set<string>(ONBOARDING_AGENT_IDS);
  return getAgentsPageData('market').marketAgents.filter((card) => ids.has(card.id));
}

export function statusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    running: '进行中',
    waiting_confirmation: '等待确认',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  };
  return map[status];
}

export function isLowBalanceUsage(): boolean {
  return isLowBalance(getUsage());
}
