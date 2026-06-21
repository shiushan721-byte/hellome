import { type Prisma } from '@prisma/client';
import { generateText } from './adapters/modelAdapter';
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';
import { computeSkillVersionChecksum, withSkillVersionChecksum } from './skillChecksum';
import type {
  SkillArtifactTemplate,
  SkillBusinessFrame,
  SkillModelSelectionConfig,
  SkillShowcaseVideo,
  SkillDebugInput,
  SkillDebugResult,
  SkillExecutionConfig,
  SkillExperienceConfig,
  SkillInputConfig,
  SkillRoutePlan,
  SkillRecord,
  SkillUnderstandingConfig,
  SkillVersionRecord,
} from '../types/skills';
import type { UgcTaskInput, UgcRoutePlan } from '../types/ugc';
import { getVideoAgentProfile } from '../config/videoAgentProfiles';

const DEFAULT_SKILL_ID = 'media-ugc';

const PUBLIC_SKILL_VARIANTS: Record<
  string,
  {
    sourceSkillId: string;
    name: string;
    title: string;
    summary: string;
    preferredEffect: string;
    preferredPlanId?: string;
  }
> = {
  'media-ugc': {
    sourceSkillId: DEFAULT_SKILL_ID,
    name: 'UGC 视频广告生成',
    title: 'UGC 视频广告生成',
    summary: '面向真实交付的 UGC 视频样片工作台。',
    preferredEffect: '更像真人种草',
  },
  'media-seeding': {
    sourceSkillId: 'media-seeding',
    name: '新品种草视频',
    title: '新品种草视频',
    summary: '更适合新品首发、真实种草和小品牌日常传播的短视频样片。',
    preferredEffect: '更像真人种草',
    preferredPlanId: 'ugc_video_factory',
  },
  'media-review': {
    sourceSkillId: 'media-review',
    name: '测评讲解视频',
    title: '测评讲解视频',
    summary: '更适合口播讲解、开箱测评和偏信息传达的视频样片。',
    preferredEffect: '更像测评讲解',
    preferredPlanId: 'talking_head_ugc',
  },
  'media-conversion': {
    sourceSkillId: 'media-conversion',
    name: '带货转化视频',
    title: '带货转化视频',
    summary: '更适合强调行动引导、成交转化和强收口的带货样片。',
    preferredEffect: '更像带货转化',
    preferredPlanId: 'ugc_video_factory',
  },
  'media-showcase': {
    sourceSkillId: 'media-showcase',
    name: '品牌宣传视频',
    title: '品牌宣传视频',
    summary: '更适合门店宣传、空间展示和品牌形象露出的短视频样片。',
    preferredEffect: '更像真人种草',
    preferredPlanId: 'product_video_ad_maker',
  },
  'media-demo': {
    sourceSkillId: 'media-demo',
    name: '产品演示视频',
    title: '产品演示视频',
    summary: '更适合设备展示、功能讲解和项目演示的产品视频样片。',
    preferredEffect: '更像测评讲解',
    preferredPlanId: 'talking_head_ugc',
  },
  'media-proposal': {
    sourceSkillId: 'media-proposal',
    name: '客户提案视频',
    title: '客户提案视频',
    summary: '更适合给客户展示方案方向、提案创意和项目预期的视频样片。',
    preferredEffect: '更像测评讲解',
    preferredPlanId: 'talking_head_ugc',
  },
};

type SkillAggregate = {
  skill: SkillRecord;
  versions: SkillVersionRecord[];
};

const memoryStore = new Map<string, SkillAggregate>();

function defaultShowcaseVideo(skillId: string): SkillShowcaseVideo | undefined {
  if (skillId !== 'media-seeding') return undefined;
  return {
    title: '通勤防晒真人种草样片',
    summary: '围绕轻薄防晒与通勤场景的 10 秒真人种草案例。',
    videoUrl: '/media/showcase/media-seeding-sample.webm',
    coverUrl: '/media/showcase/media-seeding-cover.png',
    posterText: '真人种草 · 通勤防晒',
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultInputConfig(): SkillInputConfig {
  return {
    sellingPointLabel: '一句话卖点',
    sellingPointPlaceholder: '请用一句话说清产品最想让客户记住什么。',
    productImageHint: '上传包装图、单品图或客户给到的主视觉素材。',
    talentImageHint: '上传人物图、模特图或客户给到的人设参考。',
    referenceUrlHint: '可选填写，用于帮助系统更快理解风格方向。',
  };
}

function defaultUnderstandingConfig(): SkillUnderstandingConfig {
  return {
    prompt: '先理解客户业务，再输出目标用户、风格、人设、脚本草案和交付目标。',
    confirmationMessage: '样片生成会进入高成本步骤，确认后将正式调用视频模型。',
  };
}

function defaultExecutionConfig(): SkillExecutionConfig {
  return {
    mode: 'backend_silent',
    debugMode: 'local_debug',
    videoProvider: '待接入真实 provider',
    requireConfirmation: true,
    routingMode: 'auto',
    defaultPlanId: 'ugc_video_factory',
    availablePlans: [
      {
        id: 'ugc_video_factory',
        label: 'UGC Video Factory',
        description: '适合人物图 + 产品图 + 一句话卖点的标准 UGC 样片生成。',
        providerHint: 'Generative-Media-Skills',
        fitPlatforms: ['抖音', '小红书', '视频号'],
      },
      {
        id: 'product_video_ad_maker',
        label: 'Product Video Ad Maker',
        description: '适合只有产品图、弱人物依赖的商品展示广告样片。',
        providerHint: 'Generative-Media-Skills',
        fitPlatforms: ['抖音', '小红书'],
      },
      {
        id: 'talking_head_ugc',
        label: 'Talking Head UGC',
        description: '适合更强口播讲解、更像真人测评的交付场景。',
        providerHint: 'OpenShorts-style flow',
        fitPlatforms: ['视频号', '抖音'],
      },
    ],
    modelSelection: defaultModelSelectionConfig(),
  };
}

function normalizeModelId(modelId: string | undefined, fallback: string): string {
  const normalized = modelId?.trim();
  if (!normalized || normalized.startsWith('local/')) return fallback;
  return normalized;
}

function defaultModelSelectionConfig(): SkillModelSelectionConfig {
  return {
    imageModel: 'z-image-turbo',
    videoModel: 'wan22-5b',
    audioModel: 'tts_chatterbox_api',
    audioEnabled: true,
  };
}

function defaultArtifactConfig(): SkillArtifactTemplate[] {
  return [
    { label: '样片视频', fileName: 'sample-video.mp4' },
    { label: 'AI 配音音轨', fileName: 'voiceover.wav' },
    { label: '封面首帧', fileName: 'cover-frame.png' },
    { label: '脚本草案', fileName: 'script.md' },
    { label: '客户交付摘要', fileName: 'delivery-summary.pdf' },
  ];
}

export function buildDefaultBusinessFrame(): SkillBusinessFrame {
  return {
    goal: {
      summary: '帮助小团队更快拿到可交付的视频表达。',
      scenarios: ['产品介绍', '门店宣传'],
    },
    budget: {
      defaultTier: 'standard',
      confirmationRequired: true,
      notes: '先用低成本阶段明确方向，再决定是否进入正式生成。',
    },
    executionPlan: {
      stages: [
        { id: 'goal', label: '明确目标', kind: 'auto' },
        { id: 'structure', label: '组织表达', kind: 'auto' },
        { id: 'audio_synthesize', label: '配音合成', kind: 'auto' },
        { id: 'confirm', label: '确认方向', kind: 'confirm' },
        { id: 'render', label: '正式生成', kind: 'auto' },
      ],
    },
    result: {
      promiseLine: '快速得到可交付的视频样片。',
      deliveryLabels: ['9:16', '10 秒样片', '带字幕', 'AI 配音版'],
      showcaseHint: '把最好的一次调试结果设为市场展示案例。',
    },
  };
}

function createDefaultAggregate(skillId: string = DEFAULT_SKILL_ID): SkillAggregate {
  const createdAt = nowIso();
  const variant = resolvePublicSkillVariant(skillId);
  const profile = getVideoAgentProfile(skillId);
  const baseBusinessFrame = buildDefaultBusinessFrame();
  const executionConfig = defaultExecutionConfig();
  if (skillId === 'media-seeding') {
    executionConfig.modelSelection = {
      ...executionConfig.modelSelection,
      videoModel: 'ltx-2b',
    };
  }
  const latestVersion = withSkillVersionChecksum({
    id: `${skillId}-v1`,
    versionNumber: 1,
    versionLabel: 'v0.1.0',
    status: 'published',
    title: profile?.title ?? variant.title,
    summary: profile?.workbenchSubtitle ?? variant.summary,
    inputConfig: profile?.inputConfig ?? defaultInputConfig(),
    understandingConfig: defaultUnderstandingConfig(),
    executionConfig,
    businessFrame: profile
      ? {
          ...baseBusinessFrame,
          result: {
            ...baseBusinessFrame.result,
            promiseLine: profile.workbenchSubtitle,
            orientationTags: profile.orientationTags,
            showcaseVideo: defaultShowcaseVideo(skillId),
          },
        }
      : {
          ...baseBusinessFrame,
          result: {
            ...baseBusinessFrame.result,
            showcaseVideo: defaultShowcaseVideo(skillId),
          },
        },
    artifactConfig: defaultArtifactConfig(),
    createdAt,
    publishedAt: createdAt,
  });

  return {
    skill: {
      id: skillId,
      slug: skillId,
      name: profile?.publicName ?? variant.name,
      description: profile?.marketDescription ?? '固定结果导向页面范式下的 UGC 交付 Skill。',
      category: 'ugc_video',
      status: 'published',
      currentVersion: 1,
      updatedAt: createdAt,
      publishedAt: createdAt,
      latestVersion,
    },
    versions: [latestVersion],
  };
}

function cloneAggregate<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ensureMemoryAggregate(skillId: string): SkillAggregate {
  const existing = memoryStore.get(skillId);
  if (existing) return cloneAggregate(existing);
  const created = createDefaultAggregate(skillId);
  memoryStore.set(skillId, cloneAggregate(created));
  return cloneAggregate(created);
}

function normalizeVersionPayload(payload: Partial<SkillVersionRecord>): SkillVersionRecord {
  const defaultBusiness = buildDefaultBusinessFrame();
  const defaultExecution = defaultExecutionConfig();
  const executionConfig = {
    ...defaultExecution,
    ...(payload.executionConfig ?? {}),
    modelSelection: {
      ...defaultExecution.modelSelection,
      ...(payload.executionConfig?.modelSelection ?? {}),
      imageModel: normalizeModelId(payload.executionConfig?.modelSelection?.imageModel, defaultExecution.modelSelection.imageModel),
      videoModel: normalizeModelId(payload.executionConfig?.modelSelection?.videoModel, defaultExecution.modelSelection.videoModel),
      audioModel: normalizeModelId(payload.executionConfig?.modelSelection?.audioModel, defaultExecution.modelSelection.audioModel),
      audioEnabled:
        typeof payload.executionConfig?.modelSelection?.audioEnabled === 'boolean'
          ? payload.executionConfig.modelSelection.audioEnabled
          : defaultExecution.modelSelection.audioEnabled,
    },
  };
  return {
    id: payload.id || `${DEFAULT_SKILL_ID}-v1`,
    versionNumber: Number(payload.versionNumber ?? 1),
    versionLabel: payload.versionLabel || 'v0.1.0',
    status: payload.status || 'draft',
    title: payload.title || '短视频客户交付 Agent',
    summary: payload.summary,
    inputConfig: payload.inputConfig ?? defaultInputConfig(),
    understandingConfig: payload.understandingConfig ?? defaultUnderstandingConfig(),
    executionConfig,
    businessFrame: {
      ...defaultBusiness,
      ...(payload.businessFrame ?? {}),
      goal: {
        ...defaultBusiness.goal,
        ...(payload.businessFrame?.goal ?? {}),
        scenarios:
          Array.isArray(payload.businessFrame?.goal?.scenarios) && payload.businessFrame.goal.scenarios.length > 0
            ? payload.businessFrame.goal.scenarios
            : defaultBusiness.goal.scenarios,
      },
      budget: {
        ...defaultBusiness.budget,
        ...(payload.businessFrame?.budget ?? {}),
      },
      executionPlan: {
        stages:
          Array.isArray(payload.businessFrame?.executionPlan?.stages) &&
          payload.businessFrame.executionPlan.stages.length > 0
            ? payload.businessFrame.executionPlan.stages.map((stage, index) => ({
                id: stage?.id || `stage-${index + 1}`,
                label: stage?.label || `阶段 ${index + 1}`,
                kind: stage?.kind === 'confirm' ? 'confirm' : 'auto',
              }))
            : defaultBusiness.executionPlan.stages,
      },
      result: {
        ...defaultBusiness.result,
        ...(payload.businessFrame?.result ?? {}),
        deliveryLabels:
          Array.isArray(payload.businessFrame?.result?.deliveryLabels) &&
          payload.businessFrame.result.deliveryLabels.length > 0
            ? payload.businessFrame.result.deliveryLabels
            : defaultBusiness.result.deliveryLabels,
        showcaseVideo:
          payload.businessFrame?.result?.showcaseVideo?.title &&
          payload.businessFrame?.result?.showcaseVideo?.summary &&
          payload.businessFrame?.result?.showcaseVideo?.videoUrl
            ? {
                title: payload.businessFrame.result.showcaseVideo.title,
                summary: payload.businessFrame.result.showcaseVideo.summary,
                videoUrl: payload.businessFrame.result.showcaseVideo.videoUrl,
                coverUrl: payload.businessFrame.result.showcaseVideo.coverUrl,
                posterText: payload.businessFrame.result.showcaseVideo.posterText,
              }
            : defaultBusiness.result.showcaseVideo,
      },
    },
    artifactConfig: payload.artifactConfig ?? defaultArtifactConfig(),
    createdAt: payload.createdAt || nowIso(),
    publishedAt: payload.publishedAt,
    checksum: payload.checksum,
  };
}

export class PublishedSkillVersionRequiredError extends Error {
  constructor(readonly skillId: string) {
    super(`Skill ${skillId} 尚未发布可用版本，正式任务无法执行。`);
    this.name = 'PublishedSkillVersionRequiredError';
  }
}

export type PublishedSkillBinding = {
  skillId: string;
  skillSlug: string;
  skillVersionId: string;
  versionNumber: number;
  versionLabel: string;
  checksum: string;
  version: SkillVersionRecord;
  skill: SkillRecord;
  variant: (typeof PUBLIC_SKILL_VARIANTS)[string];
};

function resolvePublicSkillVariant(skillId: string) {
  return PUBLIC_SKILL_VARIANTS[skillId] ?? PUBLIC_SKILL_VARIANTS[DEFAULT_SKILL_ID];
}

function getPublishedVersion(aggregate: SkillAggregate): SkillVersionRecord | null {
  return aggregate.versions.find((version) => version.status === 'published') ?? null;
}

function resolveVersionChecksum(version: SkillVersionRecord): string {
  return version.checksum && version.checksum.length > 0
    ? version.checksum
    : computeSkillVersionChecksum(version);
}

async function persistToPrisma(ownerExternalId: string, aggregate: SkillAggregate): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma && !isFallbackAllowed()) {
    throw new Error('Skill Studio 持久化已启用，但数据库不可用。');
  }
  if (!prisma) {
    memoryStore.set(aggregate.skill.id, cloneAggregate(aggregate));
    return;
  }
  const prismaDb = prisma as any;

  const user = await prisma.user.upsert({
    where: { externalId: ownerExternalId },
    update: {},
    create: {
      externalId: ownerExternalId,
      email: ownerExternalId.includes('@') ? ownerExternalId : null,
      phone: ownerExternalId.includes('@') ? null : ownerExternalId,
    },
  });

  await prismaDb.skill.upsert({
    where: { slug: aggregate.skill.slug },
    update: {
      name: aggregate.skill.name,
      description: aggregate.skill.description ?? null,
      category: aggregate.skill.category,
      status: aggregate.skill.status,
      currentVersion: aggregate.skill.currentVersion,
      publishedAt: aggregate.skill.publishedAt ? new Date(aggregate.skill.publishedAt) : null,
      ownerId: user.id,
    },
    create: {
      id: aggregate.skill.id,
      slug: aggregate.skill.slug,
      name: aggregate.skill.name,
      description: aggregate.skill.description ?? null,
      category: aggregate.skill.category,
      status: aggregate.skill.status,
      currentVersion: aggregate.skill.currentVersion,
      publishedAt: aggregate.skill.publishedAt ? new Date(aggregate.skill.publishedAt) : null,
      ownerId: user.id,
    },
  });

  await prismaDb.skillVersion.deleteMany({ where: { skillId: aggregate.skill.id } });
  if (aggregate.versions.length > 0) {
    await prismaDb.skillVersion.createMany({
      data: aggregate.versions.map((version) => ({
        id: version.id,
        skillId: aggregate.skill.id,
        versionNumber: version.versionNumber,
        versionLabel: version.versionLabel,
        status: version.status,
        title: version.title,
        summary: version.summary ?? null,
        inputConfig: version.inputConfig as unknown as Prisma.InputJsonValue,
        understandingConfig: version.understandingConfig as unknown as Prisma.InputJsonValue,
        executionConfig: version.executionConfig as unknown as Prisma.InputJsonValue,
        businessFrame: version.businessFrame as unknown as Prisma.InputJsonValue,
        artifactConfig: version.artifactConfig as unknown as Prisma.InputJsonValue,
        checksum: resolveVersionChecksum(version),
        createdAt: new Date(version.createdAt),
        publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
      })),
    });
  }

  memoryStore.set(aggregate.skill.id, cloneAggregate(aggregate));
}

function aggregateFromPrismaRow(row: any): SkillAggregate | null {
  if (!row) return null;
  const versions = row.versions.map((version: any) =>
    normalizeVersionPayload({
      id: version.id,
      versionNumber: version.versionNumber,
      versionLabel: version.versionLabel,
      status: version.status,
      title: version.title,
      summary: version.summary ?? undefined,
      inputConfig: (version.inputConfig ?? undefined) as SkillVersionRecord['inputConfig'],
      understandingConfig: (version.understandingConfig ?? undefined) as SkillVersionRecord['understandingConfig'],
      executionConfig: (version.executionConfig ?? undefined) as SkillVersionRecord['executionConfig'],
      businessFrame: (version.businessFrame ?? undefined) as SkillVersionRecord['businessFrame'],
      artifactConfig: (version.artifactConfig ?? undefined) as SkillVersionRecord['artifactConfig'],
      createdAt: version.createdAt.toISOString(),
      publishedAt: version.publishedAt?.toISOString(),
      checksum: version.checksum ?? undefined,
    }),
  );

  const latestVersion =
    versions.find((version) => version.versionNumber === row.currentVersion) ??
    versions[0] ??
    normalizeVersionPayload({});

  return {
    skill: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category,
      status: row.status,
      currentVersion: row.currentVersion,
      updatedAt: row.updatedAt.toISOString(),
      publishedAt: row.publishedAt?.toISOString(),
      latestVersion,
    },
    versions,
  };
}

async function loadFromPrisma(skillId: string): Promise<SkillAggregate | null> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (!isFallbackAllowed()) {
      throw new Error('Skill Studio 持久化已启用，但数据库不可用。');
    }
    return null;
  }
  const prismaDb = prisma as any;

  const row = await prismaDb.skill.findFirst({
    where: { OR: [{ id: skillId }, { slug: skillId }] },
    include: {
      versions: { orderBy: { versionNumber: 'desc' } },
    },
  });

  return aggregateFromPrismaRow(row);
}

export async function listSkills(): Promise<SkillRecord[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (isFallbackAllowed()) {
      return [ensureMemoryAggregate(DEFAULT_SKILL_ID).skill];
    }
    throw new Error('Skill Studio 持久化已启用，但数据库不可用。');
  }
  // Pull every skill row so the orchestrator / admin endpoints can see all
  // agents. Sorted by id for stable ordering.
  const rows = await (prisma as any).skill.findMany({
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
    orderBy: { id: 'asc' },
  });
  const records: SkillRecord[] = [];
  for (const row of rows) {
    const aggregate = aggregateFromPrismaRow(row);
    if (aggregate) {
      memoryStore.set(aggregate.skill.id, cloneAggregate(aggregate));
      records.push(aggregate.skill);
    }
  }
  if (records.length > 0) return records;
  // Empty DB — fall back to the demo seed so first-time boot has *something*.
  return [ensureMemoryAggregate(DEFAULT_SKILL_ID).skill];
}

export async function getSkill(skillId: string): Promise<SkillRecord> {
  const prismaData = await loadFromPrisma(skillId);
  if (prismaData) {
    memoryStore.set(prismaData.skill.id, cloneAggregate(prismaData));
    return prismaData.skill;
  }
  return ensureMemoryAggregate(skillId).skill;
}

export async function getSkillVersions(skillId: string): Promise<SkillVersionRecord[]> {
  const prismaData = await loadFromPrisma(skillId);
  if (prismaData) {
    memoryStore.set(prismaData.skill.id, cloneAggregate(prismaData));
    return prismaData.versions;
  }
  return ensureMemoryAggregate(skillId).versions;
}

export async function updateSkill(
  ownerExternalId: string,
  skillId: string,
  payload: {
    name: string;
    description?: string;
    latestVersion: SkillVersionRecord;
  },
): Promise<SkillRecord> {
  const aggregate = ensureMemoryAggregate(skillId);
  const normalizedVersion = normalizeVersionPayload(payload.latestVersion);
  const existingIndex = aggregate.versions.findIndex((version) => version.id === normalizedVersion.id);
  if (existingIndex >= 0) {
    aggregate.versions[existingIndex] = normalizedVersion;
  } else {
    aggregate.versions.unshift(normalizedVersion);
  }

  aggregate.skill = {
    ...aggregate.skill,
    name: payload.name,
    description: payload.description,
    latestVersion: normalizedVersion,
    currentVersion: normalizedVersion.versionNumber,
    updatedAt: nowIso(),
    status: normalizedVersion.status,
  };

  await persistToPrisma(ownerExternalId, aggregate);
  return cloneAggregate(aggregate.skill);
}

export async function publishSkill(ownerExternalId: string, skillId: string): Promise<SkillRecord> {
  const aggregate = ensureMemoryAggregate(skillId);
  const latest = withSkillVersionChecksum({
    ...aggregate.skill.latestVersion,
    status: 'published',
    publishedAt: nowIso(),
  });
  latest.checksum = computeSkillVersionChecksum(latest);
  aggregate.skill.status = 'published';
  aggregate.skill.publishedAt = latest.publishedAt;
  aggregate.skill.updatedAt = nowIso();
  aggregate.skill.latestVersion = latest;
  aggregate.versions = aggregate.versions.map((version) =>
    version.id === latest.id ? latest : version,
  );
  await persistToPrisma(ownerExternalId, aggregate);
  return cloneAggregate(aggregate.skill);
}

export async function runSkillDebug(
  ownerExternalId: string,
  skillId: string,
  input: SkillDebugInput,
): Promise<SkillDebugResult> {
  const skill = await getSkill(skillId);
  const prompt = [
    `你是 HelloMe 的 ${skill.name} 调试助手。`,
    `任务卖点：${input.sellingPoint}`,
    `目标平台：${input.platform}`,
    `风格目标：${input.effectGoal}`,
    input.referenceDirection ? `参考方向：${input.referenceDirection}` : '',
    '请输出目标用户、视频风格、核心卖点、交付目标和一句脚本草案。',
  ]
    .filter(Boolean)
    .join('\n');

  const llm = await generateText({
    system: skill.latestVersion.understandingConfig.prompt,
    prompt,
  });

  const result: SkillDebugResult = {
    runId: `${skillId}-${Date.now().toString(36)}`,
    input,
    understanding: {
      targetAudience: '25-35 岁短视频高频消费人群，关注真实试用与转化效率。',
      videoStyle: `${input.effectGoal}，并优先贴合 ${input.platform} 的消费场景与节奏。`,
      coreAngle: input.sellingPoint,
      outputGoal: `${input.platform} 的 10 秒 UGC 视频交付样片`,
      draftScript: llm.text,
    },
    logs: [
      { level: 'success', message: '已读取当前 SkillVersion 的系统理解配置' },
      { level: 'info', message: '已生成 system understanding 调试结果' },
      {
        level: llm.source === 'provider' ? 'success' : 'warning',
        message:
          llm.source === 'provider'
            ? `已调用真实模型：${llm.provider} / ${llm.model}`
            : '当前使用本地 fallback 结果，后续接入真实视频 provider 后再联调',
      },
    ],
    provider: llm.provider,
    model: llm.model,
    source: llm.source,
  };

  const prisma = getPrismaClient();
  if (prisma) {
    const prismaDb = prisma as any;
    await prismaDb.skillDebugRun.create({
      data: {
        skillId: skill.id,
        skillVersionId: skill.latestVersion.id,
        status: 'completed',
        inputPayload: input as unknown as Prisma.InputJsonValue,
        outputPayload: result as unknown as Prisma.InputJsonValue,
        logPayload: result.logs as unknown as Prisma.InputJsonValue,
      },
    });
  }

  memoryStore.set(skill.id, cloneAggregate(ensureMemoryAggregate(skill.id)));
  void ownerExternalId;
  return result;
}

export async function getSkillRuntimeConfig(skillId: string): Promise<SkillExecutionConfig> {
  const binding = await resolvePublishedSkillBinding(skillId);
  return {
    ...binding.version.executionConfig,
    defaultPlanId: binding.variant.preferredPlanId ?? binding.version.executionConfig.defaultPlanId,
  };
}

export async function getSkillExperienceConfig(skillId: string): Promise<SkillExperienceConfig> {
  const binding = await resolvePublishedSkillBinding(skillId);
  const profile = getVideoAgentProfile(skillId);
  const title = profile?.title ?? binding.variant.title;
  const name = profile?.publicName ?? binding.variant.name;
  const summary = (profile?.marketDescription ?? binding.variant.summary) || binding.version.summary;
  const inputConfig = profile?.inputConfig ?? binding.version.inputConfig;
  const businessFrame = profile
    ? {
        ...binding.version.businessFrame,
        result: {
          ...binding.version.businessFrame.result,
          promiseLine: profile.workbenchSubtitle,
          orientationTags: profile.orientationTags,
        },
      }
    : binding.version.businessFrame;

  return {
    id: skillId,
    name,
    description: binding.skill.description,
    title,
    summary,
    inputConfig,
    understandingConfig: binding.version.understandingConfig,
    executionConfig: {
      ...binding.version.executionConfig,
      defaultPlanId: binding.variant.preferredPlanId ?? binding.version.executionConfig.defaultPlanId,
    },
    businessFrame,
    artifactConfig: binding.version.artifactConfig,
  };
}

export async function resolvePublishedSkillBinding(skillId: string): Promise<PublishedSkillBinding> {
  const variant = resolvePublicSkillVariant(skillId);
  const aggregate = await loadFromPrisma(variant.sourceSkillId);
  const resolved = aggregate ?? ensureMemoryAggregate(variant.sourceSkillId);
  const version = getPublishedVersion(resolved);
  if (!version) {
    throw new PublishedSkillVersionRequiredError(skillId);
  }

  return {
    skillId: resolved.skill.id,
    skillSlug: resolved.skill.slug,
    skillVersionId: version.id,
    versionNumber: version.versionNumber,
    versionLabel: version.versionLabel,
    checksum: resolveVersionChecksum(version),
    version,
    skill: resolved.skill,
    variant,
  };
}

export async function getPublishedSkillRuntimeSnapshot(skillId: string) {
  const binding = await resolvePublishedSkillBinding(skillId);
  return {
    skillId: binding.skillId,
    slug: binding.skillSlug,
    versionNumber: binding.versionNumber,
    versionLabel: binding.versionLabel,
    checksum: binding.checksum,
    executionManifest: {
      title: binding.version.title,
      summary: binding.version.summary,
      inputConfig: binding.version.inputConfig,
      understandingConfig: binding.version.understandingConfig,
      executionConfig: {
        ...binding.version.executionConfig,
        defaultPlanId: binding.variant.preferredPlanId ?? binding.version.executionConfig.defaultPlanId,
      },
      businessFrame: binding.version.businessFrame,
      artifactConfig: binding.version.artifactConfig,
    },
    modelPolicy: {
      videoProvider: binding.version.executionConfig.videoProvider,
      availablePlans: binding.version.executionConfig.availablePlans,
      modelSelection: binding.version.executionConfig.modelSelection,
    },
    publishedAt: binding.version.publishedAt ?? binding.skill.publishedAt,
  };
}

export async function resolveSkillRoutePlan(
  skillId: string,
  input: UgcTaskInput,
): Promise<UgcRoutePlan> {
  const binding = await resolvePublishedSkillBinding(skillId);
  const execution = {
    ...binding.version.executionConfig,
    defaultPlanId: binding.variant.preferredPlanId ?? binding.version.executionConfig.defaultPlanId,
  };
  const plans = execution.availablePlans;
  const defaultPlan =
    plans.find((plan) => plan.id === execution.defaultPlanId) ??
    plans[0];

  if (!defaultPlan) {
    return {
      id: 'fallback',
      label: 'Fallback Skill Plan',
      providerHint: execution.videoProvider,
      reason: '当前未配置可用方案，先走默认 fallback。',
    };
  }

  if (execution.routingMode === 'fixed') {
    return {
      id: defaultPlan.id,
      label: defaultPlan.label,
      providerHint: defaultPlan.providerHint,
      reason: '当前 Skill 已配置为固定执行方案。',
    };
  }

  const hasTalent = Boolean(input.talentImageUrl);
  if (!hasTalent) {
    const productPlan = plans.find((plan) => plan.id === 'product_video_ad_maker');
    if (productPlan) {
      return {
        id: productPlan.id,
        label: productPlan.label,
        providerHint: productPlan.providerHint,
        reason: '本次缺少人物图，系统自动切到更适合纯产品展示的方案。',
      };
    }
  }

  if (input.effectGoal.includes('测评') || input.platform === '视频号') {
    const talkingHeadPlan = plans.find((plan) => plan.id === 'talking_head_ugc');
    if (talkingHeadPlan) {
      return {
        id: talkingHeadPlan.id,
        label: talkingHeadPlan.label,
        providerHint: talkingHeadPlan.providerHint,
        reason: '当前平台或效果目标更偏口播讲解，系统自动切到讲解型方案。',
      };
    }
  }

  return {
    id: defaultPlan.id,
    label: defaultPlan.label,
    providerHint: defaultPlan.providerHint,
    reason: '当前输入符合默认 UGC 样片方案，系统自动使用主路由。',
  };
}
