import { getDefaultHomePageConfig, HOME_CONFIG_KEY, HOME_CONFIG_SCOPE } from '../../lib/homePageConfigDefaults';
import type { AdminHomeConfigState, HomePageConfigPayload, HomePageOperationConfig } from '../../types/homePageConfig';
import { getPrismaClient } from '../db/prisma';
import { publishFrontendConfig, upsertFrontendConfig } from './adminService';

let memoryDraft: {
  id: string;
  payload: HomePageConfigPayload;
  version: number;
  updatedAt: string;
} | null = null;

let memoryPublished: {
  id: string;
  payload: HomePageConfigPayload;
  version: number;
  updatedAt: string;
} | null = null;

const URL_WHITELIST = /^https?:\/\//i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeHomePageConfigPayload(raw: unknown): HomePageConfigPayload {
  const fallback = getDefaultHomePageConfig();
  if (!isRecord(raw)) return fallback;

  const heroAds = Array.isArray(raw.heroAds) ? (raw.heroAds as HomePageConfigPayload['heroAds']) : fallback.heroAds;
  const agentRecommendations = Array.isArray(raw.agentRecommendations)
    ? (raw.agentRecommendations as HomePageConfigPayload['agentRecommendations'])
    : fallback.agentRecommendations;
  const agentShowcase = isRecord(raw.agentShowcase)
    ? ({ ...fallback.agentShowcase, ...(raw.agentShowcase as object) } as HomePageConfigPayload['agentShowcase'])
    : fallback.agentShowcase;

  return { heroAds, agentRecommendations, agentShowcase };
}

export function validateHomePageConfig(payload: HomePageConfigPayload): string[] {
  const errors: string[] = [];

  const enabledAds = payload.heroAds.filter((ad) => ad.enabled);
  for (const ad of enabledAds) {
    if (!ad.title?.trim()) errors.push(`广告「${ad.name || ad.id}」缺少主标题`);
    if (!ad.primaryButton?.label?.trim()) errors.push(`广告「${ad.name || ad.id}」缺少主按钮文案`);
    if (!ad.primaryButton?.action) errors.push(`广告「${ad.name || ad.id}」缺少主按钮动作`);
    if (ad.primaryButton?.action === 'open_url' && ad.primaryButton.target && !URL_WHITELIST.test(ad.primaryButton.target)) {
      errors.push(`广告「${ad.name || ad.id}」外链未通过白名单校验`);
    }
  }

  for (const rec of payload.agentRecommendations.filter((item) => item.enabled && item.status !== 'hidden')) {
    if (!rec.agentId?.trim()) errors.push(`推荐位「${rec.title || rec.id}」未关联智能体`);
    if (!rec.title?.trim()) errors.push(`推荐位 ${rec.id} 缺少标题`);
  }

  const enabledTabs = payload.agentShowcase.tabs.filter((tab) => tab.enabled);
  if (payload.agentShowcase.enabled && enabledTabs.length === 0) {
    errors.push('智能体展示页至少需要一个启用标签');
  }
  if (
    payload.agentShowcase.enabled &&
    enabledTabs.length > 0 &&
    !enabledTabs.some((tab) => tab.agentId === payload.agentShowcase.defaultAgentId)
  ) {
    errors.push('默认标签必须在已启用标签中');
  }

  return errors;
}

function filterActiveHeroAds(ads: HomePageConfigPayload['heroAds']) {
  const now = Date.now();
  return ads
    .filter((ad) => ad.enabled)
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

function toPublicConfig(
  payload: HomePageConfigPayload,
  version: number,
  updatedAt: string,
): HomePageOperationConfig {
  return {
    heroAds: filterActiveHeroAds(payload.heroAds),
    agentRecommendations: filterActiveRecommendations(payload.agentRecommendations),
    agentShowcase: {
      ...payload.agentShowcase,
      tabs: payload.agentShowcase.enabled
        ? [...payload.agentShowcase.tabs].filter((tab) => tab.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
        : [],
    },
    version,
    updatedAt,
  };
}

export async function getPublishedHomePageConfig(): Promise<HomePageOperationConfig> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const published = await prisma.frontendConfig.findFirst({
        where: { key: HOME_CONFIG_KEY, status: 'published' },
        orderBy: { version: 'desc' },
      });
      if (published) {
        return toPublicConfig(
          normalizeHomePageConfigPayload(published.payload),
          published.version,
          published.updatedAt.toISOString(),
        );
      }
    } catch {
      // fall through
    }
  }

  if (memoryPublished) {
    return toPublicConfig(memoryPublished.payload, memoryPublished.version, memoryPublished.updatedAt);
  }

  const defaults = getDefaultHomePageConfig();
  return toPublicConfig(defaults, 0, new Date().toISOString());
}

export async function getAdminHomeConfigState(): Promise<AdminHomeConfigState> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const draft = await prisma.frontendConfig.findFirst({
        where: { key: HOME_CONFIG_KEY, status: 'draft' },
        orderBy: { version: 'desc' },
      });
      const published = await prisma.frontendConfig.findFirst({
        where: { key: HOME_CONFIG_KEY, status: 'published' },
        orderBy: { version: 'desc' },
      });
      const source = draft ?? published;
      const config = source
        ? normalizeHomePageConfigPayload(source.payload)
        : getDefaultHomePageConfig();

      return {
        draftId: draft?.id ?? null,
        status: draft ? 'draft' : published ? 'published' : 'default',
        publishedVersion: published?.version ?? 0,
        version: source?.version ?? 0,
        updatedAt: (source?.updatedAt ?? new Date()).toISOString(),
        config,
      };
    } catch {
      // fall through
    }
  }

  if (memoryDraft || memoryPublished) {
    const source = memoryDraft ?? memoryPublished!;
    return {
      draftId: memoryDraft?.id ?? null,
      status: memoryDraft ? 'draft' : 'published',
      publishedVersion: memoryPublished?.version ?? 0,
      version: source.version,
      updatedAt: source.updatedAt,
      config: source.payload,
    };
  }

  return {
    draftId: null,
    status: 'default',
    publishedVersion: 0,
    version: 0,
    updatedAt: new Date().toISOString(),
    config: getDefaultHomePageConfig(),
  };
}

export async function saveAdminHomeConfigDraft(input: {
  draftId?: string | null;
  config: HomePageConfigPayload;
  actorId: string;
}) {
  const payload = normalizeHomePageConfigPayload(input.config);
  const row = await upsertFrontendConfig({
    id: input.draftId ?? undefined,
    key: HOME_CONFIG_KEY,
    name: '首页运营配置',
    scope: HOME_CONFIG_SCOPE,
    payload,
    actorId: input.actorId,
  });

  if (!getPrismaClient()) {
    memoryDraft = {
      id: row.id,
      payload,
      version: row.version,
      updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date().toISOString(),
    };
  }

  return {
    draftId: row.id,
    status: 'draft' as const,
    version: row.version,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : new Date(row.updatedAt as Date).toISOString(),
    config: payload,
  };
}

export async function publishAdminHomeConfig(draftId: string, actorId: string) {
  const prisma = getPrismaClient();
  let payload: HomePageConfigPayload = getDefaultHomePageConfig();

  if (prisma) {
    const draft = await prisma.frontendConfig.findUnique({ where: { id: draftId } });
    if (!draft) throw new Error('草稿不存在');
    payload = normalizeHomePageConfigPayload(draft.payload);
  } else if (memoryDraft?.id === draftId) {
    payload = memoryDraft.payload;
  } else {
    throw new Error('草稿不存在');
  }

  const errors = validateHomePageConfig(payload);
  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }

  const published = await publishFrontendConfig(draftId, actorId);

  if (!prisma) {
    memoryPublished = {
      id: published.id,
      payload,
      version: published.version,
      updatedAt: new Date().toISOString(),
    };
    memoryDraft = null;
  }

  return {
    draftId: published.id,
    version: published.version,
    publishedAt:
      typeof published.publishedAt === 'string'
        ? published.publishedAt
        : published.publishedAt
          ? new Date(published.publishedAt as Date).toISOString()
          : new Date().toISOString(),
  };
}

export async function listHomePublishRecords() {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      return await prisma.publishRecord.findMany({
        where: { module: HOME_CONFIG_SCOPE },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      // fall through
    }
  }
  return [];
}
