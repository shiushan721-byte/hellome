import { getDefaultHomePageConfig } from './homePageConfigDefaults';
import { normalizeHeroAds } from './homeHeroAds';
import { syncShowcaseTabsWithMarketCategories } from './agentMarketCategories';
import {
  HOME_RECOMMEND_DESC_MAX,
  HOME_RECOMMEND_TITLE_MAX,
  clampHomeRecommendText,
} from './homePageRecommendLimits';
import type {
  HomeAgentRecommendationConfig,
  HomeAgentShowcaseCard,
  HomeAgentShowcaseTab,
  HomePageConfigPayload,
} from '../types/homePageConfig';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateShowcaseTab(raw: Record<string, unknown>, index: number): HomeAgentShowcaseTab {
  if (Array.isArray(raw.agents)) {
    return {
      id: String(raw.id ?? `tab-${index}`),
      tabLabel: String(raw.tabLabel ?? '标签'),
      tabKey: String(raw.tabKey ?? raw.id ?? `tab-${index}`),
      enabled: raw.enabled !== false,
      sortOrder: Number(raw.sortOrder ?? index),
      agents: (raw.agents as HomeAgentShowcaseCard[]).map((card, cardIndex) => ({
        id: String(card.id ?? `card-${cardIndex}`),
        agentId: String(card.agentId ?? ''),
        buttonLabel: String(card.buttonLabel ?? '使用智能体'),
        visible: card.visible !== false,
        sortOrder: Number(card.sortOrder ?? cardIndex),
      })),
    };
  }

  const agentId = String(raw.agentId ?? 'geo');
  const tabId = String(raw.id ?? `tab-${index}`);
  const cta = isRecord(raw.cta) ? raw.cta : null;
  return {
    id: tabId,
    tabLabel: String(raw.tabLabel ?? raw.shortName ?? raw.name ?? '标签'),
    tabKey: String(raw.tabKey ?? agentId),
    enabled: raw.enabled !== false,
    sortOrder: Number(raw.sortOrder ?? index),
    agents: [
      {
        id: `${tabId}-card`,
        agentId,
        buttonLabel: String(cta?.label ?? '使用智能体'),
        visible: true,
        sortOrder: 0,
      },
    ],
  };
}

function normalizeShowcase(raw: unknown, fallback: HomePageConfigPayload['agentShowcase']) {
  if (!isRecord(raw)) return fallback;
  const tabs = Array.isArray(raw.tabs)
    ? raw.tabs.map((tab, index) => migrateShowcaseTab(isRecord(tab) ? tab : {}, index))
    : fallback.tabs;
  const defaultTabKey = String(raw.defaultTabKey ?? raw.defaultAgentId ?? fallback.defaultTabKey ?? 'all');
  const syncedTabs = syncShowcaseTabsWithMarketCategories(tabs);
  return {
    ...fallback,
    enabled: raw.enabled !== false,
    title: String(raw.title ?? fallback.title),
    subtitle: String(raw.subtitle ?? fallback.subtitle),
    defaultTabKey,
    defaultButtonLabel: raw.defaultButtonLabel ? String(raw.defaultButtonLabel) : fallback.defaultButtonLabel,
    footerText: raw.footerText ? String(raw.footerText) : fallback.footerText,
    tabs: syncedTabs,
  };
}

function normalizeRecommendations(
  raw: unknown,
  fallback: HomeAgentRecommendationConfig[],
): HomeAgentRecommendationConfig[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.map((item, index) => {
    const rec = isRecord(item) ? item : {};
    return {
      id: String(rec.id ?? `rec-${index}`),
      enabled: rec.enabled !== false,
      sortOrder: Number(rec.sortOrder ?? index),
      agentId: String(rec.agentId ?? 'geo'),
      title: clampHomeRecommendText(String(rec.title ?? ''), HOME_RECOMMEND_TITLE_MAX),
      description: clampHomeRecommendText(String(rec.description ?? ''), HOME_RECOMMEND_DESC_MAX),
      badge: rec.badge ? String(rec.badge) : undefined,
      iconUrl: rec.iconUrl ? String(rec.iconUrl) : undefined,
      status: (rec.status as HomeAgentRecommendationConfig['status']) ?? 'open',
      cta: isRecord(rec.cta)
        ? {
            label: String(rec.cta.label ?? '使用智能体'),
            action: (rec.cta.action as HomeAgentRecommendationConfig['cta']['action']) ?? 'use_agent',
          }
        : { label: '使用智能体', action: 'use_agent' },
      startAt: rec.startAt ? String(rec.startAt) : undefined,
      endAt: rec.endAt ? String(rec.endAt) : undefined,
    };
  });
}

export function normalizeHomePageConfigPayload(raw: unknown): HomePageConfigPayload {
  const fallback = getDefaultHomePageConfig();
  if (!isRecord(raw)) return fallback;

  const heroAds = normalizeHeroAds(raw.heroAds);
  const agentRecommendations = normalizeRecommendations(raw.agentRecommendations, fallback.agentRecommendations);
  const agentShowcase = normalizeShowcase(raw.agentShowcase, fallback.agentShowcase);

  return { heroAds, agentRecommendations, agentShowcase };
}
