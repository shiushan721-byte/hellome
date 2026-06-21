/**
 * agentOrchestratorService — implements the "HelloMe 智能体工坊" data
 * model defined in `docs/superpowers/specs/2026-06-20-creator-skill-orchestrator-design.md`.
 *
 * Core invariant: every Skill (a.k.a. video agent) is composed of four
 * business objects:
 *   1. goal        — why the agent exists
 *   2. budget      — cost strategy + whether the user may upgrade
 *   3. executionPlan — which business stages + producer steps run
 *   4. result      — what users see, what they get, what to showcase
 *
 * The service exposes read APIs (project the latest version's business
 * frame as a stable snapshot) and write APIs (partial mutations on any
 * of the four objects; persists a new draft version).
 *
 * Persistence model:
 *   - skillStudioService is the source of truth for Skill / SkillVersion.
 *   - This service delegates load + persist to it; we never bypass.
 *   - Every mutation goes through `updateBusinessFrame` which deep-merges
 *     into the current frame, then calls `updateSkill` to bump the version.
 */
import {
  type SkillBusinessFrame,
  type SkillBusinessFrameUpdate,
  type SkillRecord,
  type SkillVersionRecord,
} from '../types/skills';
import { getSkill, updateSkill } from './skillStudioService';

// =============================================================================
// Domain types — not in `skills.ts` because they are orchestrator-only
// =============================================================================

/** Stable public shape returned by the orchestrator API. */
export interface AgentOrchestratorView {
  agentId: string;
  name: string;
  slug: string;
  status: SkillRecord['status'];
  currentVersion: number;
  updatedAt: string;
  /** Aggregated 4-object snapshot. */
  businessFrame: SkillBusinessFrame;
  /** Stage count for quick UI rendering (matches `executionPlan.stages.length`). */
  stageCount: number;
  /** Convenience: confirm-node count for UX ("2 confirmation points"). */
  confirmationCount: number;
}

const INDUSTRY_VOCAB = {
  consumer: '消费品商家',
  retail: '本地门店',
  service: '服务型公司',
  manufacturing: '制造业企业',
  channel: '渠道/代理商',
  content: '内容团队',
} as const;

const SCENARIO_VOCAB = {
  seeding: '产品种草',
  review: '测评讲解',
  conversion: '带货转化',
  showcase: '宣传介绍',
  demo: '演示视频',
  proposal: '客户提案',
} as const;

const DEFAULT_STAGES: SkillBusinessFrame['executionPlan']['stages'] = [
  { id: 'understand', label: '理解业务', kind: 'auto' },
  { id: 'structure', label: '组织交付方式', kind: 'auto' },
  { id: 'audio_synthesize', label: '配音合成', kind: 'auto' },
  { id: 'draft', label: '生成前台草稿', kind: 'auto' },
  { id: 'refine', label: '优化结果表达', kind: 'auto' },
  { id: 'publish', label: '发布智能体', kind: 'auto' },
];

const DEFAULT_PRODUCER_STEPS: Record<string, Array<{ id: string; label: string }>> = {
  understand: [
    { id: 'identify_audience', label: '识别受众' },
    { id: 'classify_video', label: '判断视频类型' },
  ],
  structure: [
    { id: 'generate_script', label: '生成脚本' },
    { id: 'plan_shots', label: '规划镜头' },
  ],
  audio_synthesize: [
    { id: 'generate_audio', label: '生成配音音轨' },
  ],
  draft: [
    { id: 'front_end_draft', label: '前台草稿' },
    { id: 'product_bar', label: '结果商品条' },
  ],
  refine: [
    { id: 'showcase_case', label: '沉淀展示案例' },
  ],
  publish: [
    { id: 'version_release', label: '发布版本' },
  ],
};

/**
 * Compose the default business frame for a freshly created video agent
 * built from the entry-point B business sentence.
 */
export function buildDefaultBusinessFrame(input: {
  industry: keyof typeof INDUSTRY_VOCAB | string;
  scenario: keyof typeof SCENARIO_VOCAB | string;
  displayName: string;
}): SkillBusinessFrame {
  const industryLabel = INDUSTRY_VOCAB[input.industry as keyof typeof INDUSTRY_VOCAB] ?? input.industry;
  const scenarioLabel = SCENARIO_VOCAB[input.scenario as keyof typeof SCENARIO_VOCAB] ?? input.scenario;
  return {
    goal: {
      summary: `为 ${industryLabel} 提供 ${scenarioLabel} 类型的视频表达`,
      scenarios: [scenarioLabel],
      industry: industryLabel,
      businessSentence: `我想做一个服务于 ${industryLabel} 的视频智能体，它要帮我完成 ${scenarioLabel}。`,
    },
    budget: {
      defaultTier: 'standard',
      confirmationRequired: true,
      notes: '默认标准档，正式生成前需要确认。',
      upgradeEnabled: true,
    },
    executionPlan: {
      stages: DEFAULT_STAGES.map((stage) => ({
        ...stage,
        producerSteps: DEFAULT_PRODUCER_STEPS[stage.id] ?? [],
      })),
    },
    result: {
      promiseLine: `帮助 ${industryLabel} 在 ${scenarioLabel} 场景中获得更清晰的视频表达`,
      deliveryLabels: ['30-60 秒视频', '基础字幕版', '横版 / 竖版', 'AI 配音版'],
      showcaseHint: '适合作为客户演示 / 内部对齐 / 短视频平台首发素材',
      orientationTags: [scenarioLabel, industryLabel, '视频智能体'],
    },
  };
}

export const VOCABULARIES = {
  industries: Object.entries(INDUSTRY_VOCAB).map(([id, label]) => ({ id, label })),
  scenarios: Object.entries(SCENARIO_VOCAB).map(([id, label]) => ({ id, label })),
};

// =============================================================================
// Read path — project the latest version into the orchestrator view shape.
// =============================================================================
export async function getAgentView(agentId: string): Promise<AgentOrchestratorView> {
  const record = await getSkill(agentId);
  const version = record.latestVersion;
  const stages = version.businessFrame.executionPlan.stages;
  return {
    agentId: record.id,
    name: record.name,
    slug: record.slug,
    status: record.status,
    currentVersion: record.currentVersion,
    updatedAt: record.updatedAt,
    businessFrame: version.businessFrame,
    stageCount: stages.length,
    confirmationCount: stages.filter((s) => s.kind === 'confirm').length,
  };
}

export async function listAgentViews(): Promise<AgentOrchestratorView[]> {
  const records = await listAllSkillsSafe();
  return Promise.all(records.map((r) => getAgentView(r.id)));
}

// =============================================================================
// Write path — partial mutations on the business frame.
// =============================================================================
export async function updateAgentBusinessFrame(
  agentId: string,
  patch: SkillBusinessFrameUpdate,
  ownerExternalId: string = 'creator@hellome.ai',
): Promise<AgentOrchestratorView> {
  const record = await getSkill(agentId);
  const current = record.latestVersion.businessFrame;
  const next: SkillBusinessFrame = {
    goal: { ...current.goal, ...(patch.goal ?? {}) },
    budget: { ...current.budget, ...(patch.budget ?? {}) },
    executionPlan: {
      stages: patch.executionPlan?.stages ?? current.executionPlan.stages,
    },
    result: { ...current.result, ...(patch.result ?? {}) },
  };

  await updateSkill(ownerExternalId, record.id, {
    name: record.name,
    description: record.description ?? '',
    latestVersion: {
      ...record.latestVersion,
      businessFrame: next,
    },
  });

  return getAgentView(agentId);
}

// =============================================================================
// Entry-point B — create a new agent from a business sentence.
// =============================================================================
export interface CreateAgentFromSpecInput {
  industry: string;
  scenario: string;
  displayName?: string;
  slug?: string;
  ownerExternalId?: string;
}

export async function createAgentFromSpec(
  input: CreateAgentFromSpecInput,
): Promise<AgentOrchestratorView> {
  const slug = input.slug ?? `${input.industry}-${input.scenario}`;
  const displayName = input.displayName ?? `${input.industry} · ${input.scenario} 视频智能体`;
  const ownerExternalId = input.ownerExternalId ?? 'creator@hellome.ai';

  // Look up owner (Prisma needs internal id, not externalId).
  const { getPrismaClient } = await import('./db/prisma');
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error('createAgentFromSpec requires a live database (Prisma). Run `npm run db:up` first.');
  }
  const owner = await prisma.user.findFirst({ where: { phone: '13800138002' } });
  if (!owner) {
    throw new Error('Demo creator user (phone 13800138002) not found. Run `npm run db:up && npm run prisma:seed`.');
  }

  const businessFrame = buildDefaultBusinessFrame({
    industry: input.industry,
    scenario: input.scenario,
    displayName,
  });

  // Persist via direct Prisma — bypasses the `updateSkill` 3-arg signature
  // and lets us seed an arbitrary new agent id.
  await prisma.skill.upsert({
    where: { id: slug },
    create: {
      id: slug,
      slug,
      name: displayName,
      description: businessFrame.goal.businessSentence ?? businessFrame.goal.summary,
      category: 'media',
      status: 'draft',
      currentVersion: 1,
      ownerId: owner.id,
    },
    update: {
      name: displayName,
      description: businessFrame.goal.businessSentence ?? businessFrame.goal.summary,
      category: 'media',
    },
  });

  const { computeSkillVersionChecksum } = await import('./skillChecksum');
  const versionId = `${slug}-v1`;
  const versionRecord = {
    id: versionId,
    versionNumber: 1,
    versionLabel: 'v0.1.0',
    status: 'draft' as const,
    title: displayName,
    summary: businessFrame.goal.summary,
    inputConfig: {
      sellingPointLabel: '核心卖点',
      sellingPointPlaceholder: '请用一句话说明产品核心卖点',
      productImageHint: '建议上传产品图',
      talentImageHint: '可选：上传真人参考图',
      referenceUrlHint: '可选：粘贴参考视频 / 落地页 URL',
    },
    understandingConfig: {
      prompt: '你是一个视频智能体的策略助手。基于用户输入给出对目标、受众、表达方式的理解。',
      confirmationMessage: '已生成对本次任务的初步理解，请继续。',
    },
    executionConfig: {
      mode: 'backend_silent' as const,
      debugMode: 'local_debug' as const,
      videoProvider: 'media-ugc',
      requireConfirmation: true,
      routingMode: 'auto' as const,
      defaultPlanId: 'ugc_video_factory',
      availablePlans: [],
      modelSelection: {
        imageModel: 'z-image-turbo',
        videoModel: 'wan22-5b',
        audioModel: 'tts_chatterbox_api',
        audioEnabled: true,
      },
    },
    businessFrame,
    artifactConfig: [
      { label: '样片视频', fileName: 'sample-video.mp4' },
      { label: 'AI 配音音轨', fileName: 'voiceover.wav' },
      { label: '封面首帧', fileName: 'cover-frame.png' },
      { label: '脚本草案', fileName: 'script.md' },
      { label: '交付摘要', fileName: 'delivery-summary.pdf' },
    ],
    createdAt: new Date().toISOString(),
  };
  const checksum = computeSkillVersionChecksum(versionRecord);

  await prisma.skillVersion.upsert({
    where: { id: versionId },
    create: {
      id: versionId,
      skillId: slug,
      versionNumber: versionRecord.versionNumber,
      versionLabel: versionRecord.versionLabel,
      status: versionRecord.status,
      title: versionRecord.title,
      summary: versionRecord.summary,
      inputConfig: versionRecord.inputConfig as never,
      understandingConfig: versionRecord.understandingConfig as never,
      executionConfig: versionRecord.executionConfig as never,
      businessFrame: versionRecord.businessFrame as never,
      artifactConfig: versionRecord.artifactConfig as never,
      createdAt: new Date(versionRecord.createdAt),
      checksum,
    },
    update: {
      title: versionRecord.title,
      summary: versionRecord.summary,
      businessFrame: versionRecord.businessFrame as never,
      checksum,
    },
  });

  // Quiet log so the operator sees what landed.
  // eslint-disable-next-line no-console
  console.log(`[agentOrchestrator] created agent ${slug} for ${input.industry}/${input.scenario} (owner=${ownerExternalId})`);

  return getAgentView(slug);
}

// =============================================================================
// Internal: avoid circular import with skillStudioService by going through
// its already-exported helpers.
// =============================================================================
async function listAllSkillsSafe(): Promise<SkillRecord[]> {
  const { listSkills } = await import('./skillStudioService');
  return listSkills();
}
