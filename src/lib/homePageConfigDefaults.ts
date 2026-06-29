import type { HomePageConfigPayload, HomeAgentShowcaseCard, HomeAgentShowcaseTab } from '../types/homePageConfig';
import { createDefaultHeroSlot, HERO_AD_SLOT_COUNT } from './homeHeroAds';
import { buildDefaultCardsForCategory, MARKET_CATEGORY_TABS } from './agentMarketCategories';

export const HOME_CONFIG_KEY = 'home.page_config';
export const HOME_CONFIG_SCOPE = 'home';

function tab(
  id: string,
  tabLabel: string,
  tabKey: string,
  agents: HomeAgentShowcaseCard[],
  sortOrder: number,
  enabled: boolean,
): HomeAgentShowcaseTab {
  return { id, tabLabel, tabKey, enabled, sortOrder, agents };
}

export function getDefaultHomePageConfig(): HomePageConfigPayload {
  const legacyEnabledKeys = new Set(['all', 'geo', 'content', 'sales']);

  return {
    heroAds: Array.from({ length: HERO_AD_SLOT_COUNT }, (_, index) => createDefaultHeroSlot(index)),
    agentRecommendations: [
      {
        id: 'rec-geo',
        enabled: true,
        sortOrder: 0,
        agentId: 'geo',
        title: 'GEO 智能体',
        description: '检测品牌 AI 可见度',
        badge: '官网主推',
        status: 'open',
        cta: { label: '使用智能体', action: 'use_agent' },
      },
      {
        id: 'rec-media-seeding',
        enabled: true,
        sortOrder: 1,
        agentId: 'media-seeding',
        title: '新品种草视频',
        description: '新品首发种草短视频',
        badge: '热门',
        status: 'open',
        cta: { label: '使用智能体', action: 'use_agent' },
      },
      {
        id: 'rec-sales',
        enabled: true,
        sortOrder: 2,
        agentId: 'sales',
        title: '销售获客智能体',
        description: '客户画像与跟进闭环',
        badge: '高效获客',
        status: 'open',
        cta: { label: '使用智能体', action: 'use_agent' },
      },
    ],
    agentShowcase: {
      enabled: true,
      title: '智能体服务',
      subtitle: '按需调用，支持任务执行全程进度监控，针对企业痛点场景深度定制。',
      defaultTabKey: 'all',
      defaultButtonLabel: '使用智能体',
      footerText: '支持企业定制自建：可无缝结合内部研发 API 及数据库资源。',
      tabs: MARKET_CATEGORY_TABS.map((cat, index) =>
        tab(
          `tab-${cat.id}`,
          cat.label,
          cat.id,
          buildDefaultCardsForCategory(cat.id),
          index,
          legacyEnabledKeys.has(cat.id),
        ),
      ),
    },
  };
}
