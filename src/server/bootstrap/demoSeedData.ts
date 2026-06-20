import type { Prisma } from '@prisma/client';
import { buildDefaultBusinessFrame } from '../skillStudioService';
import { buildDemoProfile } from './demoSeedHelpers';

export function buildDemoUsers() {
  return [
    buildDemoProfile({
      phone: '13800138001',
      name: 'HelloMe 普通用户',
      email: 'user@hellome.ai',
      workspace: '个人空间',
      role: 'user',
    }),
    buildDemoProfile({
      phone: '13800138002',
      name: 'HelloMe 创作者',
      email: 'creator@hellome.ai',
      workspace: 'Creator Studio',
      role: 'creator',
    }),
    buildDemoProfile({
      phone: '13800138000',
      name: 'HelloMe 演示管理员',
      email: 'admin@hellome.ai',
      workspace: 'HelloMe Demo Workspace',
      role: 'admin',
    }),
  ];
}

export type DemoTaskSeed = {
  id: string;
  name: string;
  status: 'completed' | 'waiting_confirmation';
  userExternalId: string;
  workspaceSlug: string;
  sellingPoint: string;
  platform: string;
  effectGoal: string;
  tokenUsed: number;
};

export function buildDemoTaskSeeds(): DemoTaskSeed[] {
  const user = buildDemoUsers()[0];
  const creator = buildDemoUsers()[1];

  return [
    {
      id: 'seed_ugc_task_completed',
      name: 'UGC 视频广告 · 抖音',
      status: 'completed',
      userExternalId: user.externalId,
      workspaceSlug: user.workspaceSlug,
      sellingPoint: '轻薄防晒，通勤一整天也不闷',
      platform: '抖音',
      effectGoal: '更像真人种草',
      tokenUsed: 18600,
    },
    {
      id: 'seed_ugc_task_waiting',
      name: '真人种草视频 · 小红书',
      status: 'waiting_confirmation',
      userExternalId: creator.externalId,
      workspaceSlug: creator.workspaceSlug,
      sellingPoint: '三秒起泡，敏感肌也能放心用',
      platform: '小红书',
      effectGoal: '更像真人种草',
      tokenUsed: 4200,
    },
  ];
}

export type DemoSkillSeed = {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerExternalId: string;
  version: {
    id: string;
    versionNumber: number;
    versionLabel: string;
    title: string;
    summary: string;
    inputConfig: Prisma.InputJsonValue;
    understandingConfig: Prisma.InputJsonValue;
    executionConfig: Prisma.InputJsonValue;
    businessFrame: Prisma.InputJsonValue;
    artifactConfig: Prisma.InputJsonValue;
  };
};

function defaultInputConfig() {
  return {
    sellingPointLabel: '一句话卖点',
    sellingPointPlaceholder: '请用一句话说清产品最想让客户记住什么。',
    productImageHint: '上传包装图、单品图或客户给到的主视觉素材。',
    talentImageHint: '上传人物图、模特图或客户给到的人设参考。',
    referenceUrlHint: '可选填写，用于帮助系统更快理解风格方向。',
  };
}

function defaultUnderstandingConfig() {
  return {
    prompt: '先理解客户业务，再输出目标用户、风格、人设、脚本草案和交付目标。',
    confirmationMessage: '样片生成会进入高成本步骤，确认后将正式调用视频模型。',
  };
}

function defaultExecutionConfig() {
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
    ],
  };
}

function defaultArtifactConfig() {
  return [
    { label: '样片视频', fileName: 'sample-video.mp4' },
    { label: '封面首帧', fileName: 'cover-frame.png' },
    { label: '脚本草案', fileName: 'script.md' },
    { label: '客户交付摘要', fileName: 'delivery-summary.pdf' },
  ];
}

export function buildDemoSkillSeed(): DemoSkillSeed {
  const creator = buildDemoUsers()[1];
  const businessFrame = buildDefaultBusinessFrame();

  return {
    id: 'media-ugc',
    slug: 'media-ugc',
    name: '短视频客户交付 Agent',
    description: '固定结果导向页面范式下的 UGC 交付 Skill。',
    ownerExternalId: creator.externalId,
    version: {
      id: 'media-ugc-v1',
      versionNumber: 1,
      versionLabel: 'v0.1.0',
      title: '短视频客户交付 Agent',
      summary: '帮助视频服务商更快完成短视频客户提案与交付。',
      inputConfig: defaultInputConfig(),
      understandingConfig: defaultUnderstandingConfig(),
      executionConfig: defaultExecutionConfig(),
      businessFrame: businessFrame as unknown as Prisma.InputJsonValue,
      artifactConfig: defaultArtifactConfig(),
    },
  };
}

export type DemoLedgerSeed = {
  userExternalId: string;
  taskId?: string;
  tokenUsed: number;
  videoCost?: string;
  status: 'reserved' | 'settled' | 'refunded' | 'failed';
};

export function buildDemoLedgerSeeds(): DemoLedgerSeed[] {
  const user = buildDemoUsers()[0];
  const creator = buildDemoUsers()[1];
  const tasks = buildDemoTaskSeeds();

  return [
    {
      userExternalId: user.externalId,
      taskId: tasks[0].id,
      tokenUsed: tasks[0].tokenUsed,
      videoCost: '预计 1 次样片生成 + 1 次视频合成',
      status: 'settled',
    },
    {
      userExternalId: creator.externalId,
      taskId: tasks[1].id,
      tokenUsed: tasks[1].tokenUsed,
      videoCost: '预计 1 次样片生成 + 1 次视频合成',
      status: 'reserved',
    },
    {
      userExternalId: user.externalId,
      tokenUsed: 1200,
      videoCost: '系统初始化赠送额度',
      status: 'settled',
    },
  ];
}
