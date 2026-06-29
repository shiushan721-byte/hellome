import {
  CATEGORIES,
  listAgentSlugsForCategory,
  resolveAgentCategorySlug,
  type AgentCategory,
} from '../data/agentCategories';
import { isMarketOnlineAgent, listMarketOnlineAgentSlugs } from '../data/marketAgentSeed';
import type { HomeAgentShowcaseCard, HomeAgentShowcaseTab } from '../types/homePageConfig';

/** 与智能体市场页 `CATEGORIES` 保持一致 */
export const MARKET_CATEGORY_TABS = CATEGORIES;

export function resolveAgentMarketCategory(agentId: string): AgentCategory | null {
  return resolveAgentCategorySlug(agentId);
}

export function agentBelongsToMarketCategory(agentId: string, categoryId: AgentCategory): boolean {
  if (categoryId === 'all') return true;
  return resolveAgentCategorySlug(agentId) === categoryId;
}

export function buildDefaultCardsForCategory(
  categoryId: AgentCategory,
  buttonLabel = '使用智能体',
): HomeAgentShowcaseCard[] {
  const slugs =
    categoryId === 'all'
      ? listMarketOnlineAgentSlugs()
      : listAgentSlugsForCategory(categoryId).filter(isMarketOnlineAgent);
  return slugs.map((agentId, index) => ({
    id: `card-${agentId}`,
    agentId,
    buttonLabel,
    visible: true,
    sortOrder: index,
  }));
}

/** 将配置中的标签与智能体市场分类对齐（名称、编码、顺序固定） */
export function syncShowcaseTabsWithMarketCategories(tabs: HomeAgentShowcaseTab[]): HomeAgentShowcaseTab[] {
  return MARKET_CATEGORY_TABS.map((cat, index) => {
    const existing =
      tabs.find((tab) => tab.tabKey === cat.id) ??
      tabs.find((tab) => tab.tabLabel === cat.label);

    return {
      id: existing?.id ?? `tab-${cat.id}`,
      tabLabel: cat.label,
      tabKey: cat.id,
      enabled: existing?.enabled ?? false,
      sortOrder: index,
      agents: existing?.agents ?? [],
    };
  });
}

export function filterAgentsForMarketCategory<T extends { slug: string; category?: string | null; status?: string }>(
  agents: T[],
  categoryId: AgentCategory,
  options?: { onlineOnly?: boolean },
): T[] {
  const onlineOnly = options?.onlineOnly ?? true;
  return agents.filter((agent) => {
    if (onlineOnly && agent.status && agent.status !== 'online') return false;
    if (categoryId === 'all') return true;
    const category =
      (agent.category as AgentCategory | null | undefined) ?? resolveAgentCategorySlug(agent.slug);
    return category === categoryId;
  });
}
