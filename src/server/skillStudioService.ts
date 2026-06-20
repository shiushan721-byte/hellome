import { type Prisma } from '@prisma/client';
import { generateText } from './adapters/modelAdapter';
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';
import type {
  SkillArtifactTemplate,
  SkillBusinessFrame,
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
    sourceSkillId: DEFAULT_SKILL_ID,
    name: '真人种草视频',
    title: '真人种草视频',
    summary: '更适合首屏抓人、真实试用感强的种草型视频样片。',
    preferredEffect: '更像真人种草',
    preferredPlanId: 'ugc_video_factory',
  },
  'media-review': {
    sourceSkillId: DEFAULT_SKILL_ID,
    name: '测评讲解视频',
    title: '测评讲解视频',
    summary: '更适合口播讲解、开箱测评和偏信息传达的视频样片。',
    preferredEffect: '更像测评讲解',
    preferredPlanId: 'talking_head_ugc',
  },
  'media-conversion': {
    sourceSkillId: DEFAULT_SKILL_ID,
    name: '带货转化视频',
    title: '带货转化视频',
    summary: '更适合强调行动引导、成交转化和强收口的带货样片。',
    preferredEffect: '更像带货转化',
    preferredPlanId: 'ugc_video_factory',
  },
};

type SkillAggregate = {
  skill: SkillRecord;
  versions: SkillVersionRecord[];
};

const memoryStore = new Map<string, SkillAggregate>();

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
  };
}

function defaultArtifactConfig(): SkillArtifactTemplate[] {
  return [
    { label: '样片视频', fileName: 'sample-video.mp4' },
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
        { id: 'confirm', label: '确认方向', kind: 'confirm' },
        { id: 'render', label: '正式生成', kind: 'auto' },
      ],
    },
    result: {
      promiseLine: '快速得到可交付的视频样片。',
      deliveryLabels: ['9:16', '10 秒样片', '带字幕'],
      showcaseHint: '把最好的一次调试结果设为市场展示案例。',
    },
  };
}

function createDefaultAggregate(): SkillAggregate {
  const createdAt = nowIso();
  const latestVersion: SkillVersionRecord = {
    id: `${DEFAULT_SKILL_ID}-v1`,
    versionNumber: 1,
    versionLabel: 'v0.1.0',
    status: 'draft',
    title: '短视频客户交付 Agent',
    summary: '帮助视频服务商更快完成短视频客户提案与交付。',
    inputConfig: defaultInputConfig(),
    understandingConfig: defaultUnderstandingConfig(),
    executionConfig: defaultExecutionConfig(),
    businessFrame: buildDefaultBusinessFrame(),
    artifactConfig: defaultArtifactConfig(),
    createdAt,
  };

  return {
    skill: {
      id: DEFAULT_SKILL_ID,
      slug: DEFAULT_SKILL_ID,
      name: '短视频客户交付 Agent',
      description: '固定结果导向页面范式下的 UGC 交付 Skill。',
      category: 'ugc_video',
      status: 'draft',
      currentVersion: 1,
      updatedAt: createdAt,
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
  const created = createDefaultAggregate();
  memoryStore.set(skillId, cloneAggregate(created));
  return cloneAggregate(created);
}

function normalizeVersionPayload(payload: Partial<SkillVersionRecord>): SkillVersionRecord {
  const defaultBusiness = buildDefaultBusinessFrame();
  return {
    id: payload.id || `${DEFAULT_SKILL_ID}-v1`,
    versionNumber: Number(payload.versionNumber ?? 1),
    versionLabel: payload.versionLabel || 'v0.1.0',
    status: payload.status || 'draft',
    title: payload.title || '短视频客户交付 Agent',
    summary: payload.summary,
    inputConfig: payload.inputConfig ?? defaultInputConfig(),
    understandingConfig: payload.understandingConfig ?? defaultUnderstandingConfig(),
    executionConfig: payload.executionConfig ?? defaultExecutionConfig(),
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
      },
    },
    artifactConfig: payload.artifactConfig ?? defaultArtifactConfig(),
    createdAt: payload.createdAt || nowIso(),
    publishedAt: payload.publishedAt,
  };
}

function resolvePublicSkillVariant(skillId: string) {
  return PUBLIC_SKILL_VARIANTS[skillId] ?? PUBLIC_SKILL_VARIANTS[DEFAULT_SKILL_ID];
}

function getPublishedOrLatestVersion(aggregate: SkillAggregate): SkillVersionRecord {
  return (
    aggregate.versions.find((version) => version.status === 'published') ??
    aggregate.skill.latestVersion ??
    aggregate.versions[0] ??
    normalizeVersionPayload({})
  );
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
        createdAt: new Date(version.createdAt),
        publishedAt: version.publishedAt ? new Date(version.publishedAt) : null,
      })),
    });
  }

  memoryStore.set(aggregate.skill.id, cloneAggregate(aggregate));
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

export async function listSkills(): Promise<SkillRecord[]> {
  const prismaData = await loadFromPrisma(DEFAULT_SKILL_ID);
  if (prismaData) {
    memoryStore.set(prismaData.skill.id, cloneAggregate(prismaData));
    return [prismaData.skill];
  }
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
  const latest = aggregate.skill.latestVersion;
  latest.status = 'published';
  latest.publishedAt = nowIso();
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
  const variant = resolvePublicSkillVariant(skillId);
  const aggregate = await loadFromPrisma(variant.sourceSkillId);
  const resolved = aggregate ?? ensureMemoryAggregate(variant.sourceSkillId);
  const version = getPublishedOrLatestVersion(resolved);

  return {
    ...version.executionConfig,
    defaultPlanId: variant.preferredPlanId ?? version.executionConfig.defaultPlanId,
  };
}

export async function getSkillExperienceConfig(skillId: string): Promise<SkillExperienceConfig> {
  const variant = resolvePublicSkillVariant(skillId);
  const aggregate = await loadFromPrisma(variant.sourceSkillId);
  const resolved = aggregate ?? ensureMemoryAggregate(variant.sourceSkillId);
  const version = getPublishedOrLatestVersion(resolved);

  return {
    id: skillId,
    name: variant.name,
    description: resolved.skill.description,
    title: variant.title,
    summary: variant.summary || version.summary,
    inputConfig: version.inputConfig,
    understandingConfig: version.understandingConfig,
    executionConfig: {
      ...version.executionConfig,
      defaultPlanId: variant.preferredPlanId ?? version.executionConfig.defaultPlanId,
    },
    businessFrame: version.businessFrame,
    artifactConfig: version.artifactConfig,
  };
}

export async function resolveSkillRoutePlan(
  skillId: string,
  input: UgcTaskInput,
): Promise<UgcRoutePlan> {
  const variant = resolvePublicSkillVariant(skillId);
  const aggregate = await loadFromPrisma(variant.sourceSkillId);
  const resolved = aggregate ?? ensureMemoryAggregate(variant.sourceSkillId);
  const version = getPublishedOrLatestVersion(resolved);
  const execution = {
    ...version.executionConfig,
    defaultPlanId: variant.preferredPlanId ?? version.executionConfig.defaultPlanId,
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
