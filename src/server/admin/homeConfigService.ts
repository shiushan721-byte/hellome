import { getDefaultHomePageConfig, HOME_CONFIG_KEY, HOME_CONFIG_SCOPE } from '../../lib/homePageConfigDefaults';
import { getHeroAdImageSizeHint, heroAdHasImage } from '../../lib/homeHeroAds';
import { normalizeHomePageConfigPayload } from '../../lib/homePageConfigNormalize';
import {
  HOME_RECOMMEND_DESC_MAX,
  HOME_RECOMMEND_TITLE_MAX,
} from '../../lib/homePageRecommendLimits';
import type {
  AdminHomeConfigState,
  HomePageConfigPayload,
  HomePageOperationConfig,
} from '../../types/homePageConfig';
import { getPrismaClient } from '../db/prisma';
import { listOnlineAgentsForMarket } from './adminAgentService';

let memoryPublished: {
  id: string;
  payload: HomePageConfigPayload;
  version: number;
  updatedAt: string;
} | null = null;

const URL_WHITELIST = /^https?:\/\//i;

export { normalizeHomePageConfigPayload } from '../../lib/homePageConfigNormalize';

export function validateHomePageConfig(payload: HomePageConfigPayload): string[] {
  const errors: string[] = [];

  const enabledAds = payload.heroAds.filter((ad) => ad.enabled);
  for (const ad of enabledAds) {
    if (!ad.media?.url?.trim()) {
      errors.push(`「${ad.name || ad.id}」请上传图片（${getHeroAdImageSizeHint(ad)}）`);
    }
    if (!ad.primaryButton?.action) errors.push(`「${ad.name || ad.id}」缺少点击动作`);
    if (ad.primaryButton?.action === 'open_url' && ad.primaryButton.target && !URL_WHITELIST.test(ad.primaryButton.target)) {
      errors.push(`「${ad.name || ad.id}」外链未通过白名单校验`);
    }
  }

  for (const rec of payload.agentRecommendations.filter((item) => item.enabled && item.status !== 'hidden')) {
    if (!rec.agentId?.trim()) errors.push(`推荐位 ${rec.id} 未关联智能体`);
    if (!rec.title?.trim()) errors.push(`推荐位 ${rec.id} 标题不能为空`);
    if (Array.from(rec.title).length > HOME_RECOMMEND_TITLE_MAX) {
      errors.push(`推荐位 ${rec.id} 标题不能超过 ${HOME_RECOMMEND_TITLE_MAX} 字`);
    }
    if (!rec.description?.trim()) errors.push(`推荐位 ${rec.id} 简介不能为空`);
    if (Array.from(rec.description).length > HOME_RECOMMEND_DESC_MAX) {
      errors.push(`推荐位 ${rec.id} 简介不能超过 ${HOME_RECOMMEND_DESC_MAX} 字`);
    }
  }

  const enabledTabs = payload.agentShowcase.tabs.filter((tab) => tab.enabled);
  const defaultTabKey =
    payload.agentShowcase.defaultTabKey || payload.agentShowcase.defaultAgentId || 'all';
  if (payload.agentShowcase.enabled && enabledTabs.length === 0) {
    errors.push('智能体展示页至少需要一个启用标签');
  }
  if (
    payload.agentShowcase.enabled &&
    enabledTabs.length > 0 &&
    !enabledTabs.some((tab) => tab.tabKey === defaultTabKey)
  ) {
    errors.push('默认标签必须在已启用标签中');
  }

  for (const tab of enabledTabs) {
    const visibleCards = tab.agents.filter((card) => card.visible && card.agentId?.trim());
    if (visibleCards.length === 0) {
      errors.push(`标签「${tab.tabLabel}」至少需要一个展示智能体`);
    }
  }

  return errors;
}

function filterActiveHeroAds(ads: HomePageConfigPayload['heroAds']) {
  const now = Date.now();
  return ads
    .filter((ad) => ad.enabled && heroAdHasImage(ad))
    .filter((ad) => {
      const start = ad.startAt ? Date.parse(ad.startAt) : null;
      const end = ad.endAt ? Date.parse(ad.endAt) : null;
      if (start && !Number.isNaN(start) && now < start) return false;
      if (end && !Number.isNaN(end) && now > end) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function filterActiveRecommendations(items: HomePageConfigPayload['agentRecommendations']) {
  const now = Date.now();
  return items
    .filter((item) => item.enabled && item.status !== 'hidden')
    .filter((item) => {
      const start = item.startAt ? Date.parse(item.startAt) : null;
      const end = item.endAt ? Date.parse(item.endAt) : null;
      if (start && !Number.isNaN(start) && now < start) return false;
      if (end && !Number.isNaN(end) && now > end) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function resolveOnlineAgentIds(): Promise<Set<string> | null> {
  try {
    const online = await listOnlineAgentsForMarket();
    if (online.length === 0) return null;
    return new Set(online.map((agent) => agent.slug));
  } catch {
    return null;
  }
}

function filterShowcaseForPublic(
  showcase: HomePageConfigPayload['agentShowcase'],
  onlineIds: Set<string> | null,
) {
  const tabs = showcase.enabled
    ? [...showcase.tabs]
        .filter((tab) => tab.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((tab) => ({
          ...tab,
          agents: [...tab.agents]
            .filter((card) => card.visible && card.agentId.trim())
            .filter((card) => !onlineIds || onlineIds.has(card.agentId))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
        .filter((tab) => tab.agents.length > 0)
    : [];

  return { ...showcase, tabs };
}

function toPublicConfig(
  payload: HomePageConfigPayload,
  version: number,
  updatedAt: string,
  onlineIds: Set<string> | null,
): HomePageOperationConfig {
  const recommendations = filterActiveRecommendations(payload.agentRecommendations).filter(
    (item) => !onlineIds || onlineIds.has(item.agentId),
  );

  return {
    heroAds: filterActiveHeroAds(payload.heroAds),
    agentRecommendations: recommendations,
    agentShowcase: filterShowcaseForPublic(payload.agentShowcase, onlineIds),
    version,
    updatedAt,
  };
}

async function findPublishedHomeConfigRow() {
  const prisma = getPrismaClient();
  if (!prisma) return null;
  try {
    return await prisma.frontendConfig.findFirst({
      where: { key: HOME_CONFIG_KEY, status: 'published' },
      orderBy: { version: 'desc' },
    });
  } catch {
    return null;
  }
}

async function upsertPublishedHomeConfig(input: {
  configId?: string | null;
  payload: HomePageConfigPayload;
  actorId: string;
}) {
  const prisma = getPrismaClient();
  const now = new Date();

  if (prisma) {
    const existing =
      (input.configId
        ? await prisma.frontendConfig.findFirst({
            where: { id: input.configId, key: HOME_CONFIG_KEY },
          })
        : null) ?? (await findPublishedHomeConfigRow());

    if (existing) {
      return prisma.frontendConfig.update({
        where: { id: existing.id },
        data: {
          payload: input.payload as object,
          status: 'published',
          publishedAt: now,
          updatedBy: input.actorId,
        },
      });
    }

    const latest = await prisma.frontendConfig.findFirst({
      where: { key: HOME_CONFIG_KEY },
      orderBy: { version: 'desc' },
    });
    const version = (latest?.version ?? 0) + 1;

    return prisma.frontendConfig.create({
      data: {
        key: HOME_CONFIG_KEY,
        name: '首页运营配置',
        scope: HOME_CONFIG_SCOPE,
        version,
        status: 'published',
        payload: input.payload as object,
        createdBy: input.actorId,
        updatedBy: input.actorId,
        publishedAt: now,
      },
    });
  }

  const updatedAt = now.toISOString();
  if (memoryPublished && (!input.configId || memoryPublished.id === input.configId)) {
    memoryPublished = {
      ...memoryPublished,
      payload: input.payload,
      version: memoryPublished.version + 1,
      updatedAt,
    };
    return {
      id: memoryPublished.id,
      version: memoryPublished.version,
      updatedAt: new Date(updatedAt),
    };
  }

  memoryPublished = {
    id: `mem-${Date.now()}`,
    payload: input.payload,
    version: 1,
    updatedAt,
  };
  return {
    id: memoryPublished.id,
    version: memoryPublished.version,
    updatedAt: new Date(updatedAt),
  };
}

export async function getPublishedHomePageConfig(): Promise<HomePageOperationConfig> {
  const onlineIds = await resolveOnlineAgentIds();
  const published = await findPublishedHomeConfigRow();

  if (published) {
    return toPublicConfig(
      normalizeHomePageConfigPayload(published.payload),
      published.version,
      published.updatedAt.toISOString(),
      onlineIds,
    );
  }

  if (memoryPublished) {
    return toPublicConfig(memoryPublished.payload, memoryPublished.version, memoryPublished.updatedAt, onlineIds);
  }

  const defaults = getDefaultHomePageConfig();
  return toPublicConfig(defaults, 0, new Date().toISOString(), onlineIds);
}

export async function getAdminHomeConfigState(): Promise<AdminHomeConfigState> {
  const published = await findPublishedHomeConfigRow();

  if (published) {
    return {
      configId: published.id,
      status: 'published',
      version: published.version,
      updatedAt: published.updatedAt.toISOString(),
      config: normalizeHomePageConfigPayload(published.payload),
    };
  }

  if (memoryPublished) {
    return {
      configId: memoryPublished.id,
      status: 'published',
      version: memoryPublished.version,
      updatedAt: memoryPublished.updatedAt,
      config: normalizeHomePageConfigPayload(memoryPublished.payload),
    };
  }

  return {
    configId: null,
    status: 'default',
    version: 0,
    updatedAt: new Date().toISOString(),
    config: getDefaultHomePageConfig(),
  };
}

/** 保存首页配置并立即生效（上架即前台可见，无独立发布步骤） */
export async function saveAdminHomeConfig(input: {
  configId?: string | null;
  config: HomePageConfigPayload;
  actorId: string;
}) {
  const payload = normalizeHomePageConfigPayload(input.config);
  const errors = validateHomePageConfig(payload);
  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }

  const row = await upsertPublishedHomeConfig({
    configId: input.configId,
    payload,
    actorId: input.actorId,
  });

  if (!getPrismaClient()) {
    memoryPublished = {
      id: row.id,
      payload,
      version: row.version,
      updatedAt:
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? new Date().toISOString()),
    };
  }

  return {
    configId: row.id,
    status: 'published' as const,
    version: row.version,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt ?? new Date().toISOString()),
    config: payload,
  };
}

/** @deprecated 使用 saveAdminHomeConfig */
export async function saveAdminHomeConfigDraft(input: {
  draftId?: string | null;
  config: HomePageConfigPayload;
  actorId: string;
}) {
  return saveAdminHomeConfig({
    configId: input.draftId,
    config: input.config,
    actorId: input.actorId,
  });
}
