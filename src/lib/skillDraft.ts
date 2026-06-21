import type {
  SkillArtifactTemplate,
  SkillBusinessFrame,
  SkillExecutionConfig,
  SkillInputConfig,
  SkillModelSelectionConfig,
  SkillRecord,
  SkillRoutePlan,
  SkillShowcaseVideo,
  SkillUnderstandingConfig,
  SkillVersionRecord,
} from '../types/skills';

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

function defaultPlans(): SkillRoutePlan[] {
  return [
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
  ];
}

function defaultExecutionConfig(): SkillExecutionConfig {
  return {
    mode: 'backend_silent',
    debugMode: 'local_debug',
    videoProvider: '待接入真实 provider',
    requireConfirmation: true,
    routingMode: 'auto',
    defaultPlanId: 'ugc_video_factory',
    availablePlans: defaultPlans(),
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

function defaultBusinessFrame(): SkillBusinessFrame {
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

function normalizeShowcaseVideo(value: SkillShowcaseVideo | undefined): SkillShowcaseVideo | undefined {
  if (!value?.title || !value?.summary || !value?.videoUrl) return undefined;
  return {
    title: value.title,
    summary: value.summary,
    videoUrl: value.videoUrl,
    coverUrl: value.coverUrl || undefined,
    posterText: value.posterText || undefined,
  };
}

export function normalizeSkillVersion(version: Partial<SkillVersionRecord> | undefined): SkillVersionRecord {
  const execution = {
    ...defaultExecutionConfig(),
    ...(version?.executionConfig ?? {}),
  };
  const modelSelection = {
    ...defaultModelSelectionConfig(),
    ...(version?.executionConfig?.modelSelection ?? {}),
    imageModel: normalizeModelId(version?.executionConfig?.modelSelection?.imageModel, defaultModelSelectionConfig().imageModel),
    videoModel: normalizeModelId(version?.executionConfig?.modelSelection?.videoModel, defaultModelSelectionConfig().videoModel),
    audioModel: normalizeModelId(version?.executionConfig?.modelSelection?.audioModel, defaultModelSelectionConfig().audioModel),
    audioEnabled:
      typeof version?.executionConfig?.modelSelection?.audioEnabled === 'boolean'
        ? version.executionConfig.modelSelection.audioEnabled
        : defaultModelSelectionConfig().audioEnabled,
  };

  const availablePlans =
    Array.isArray(version?.executionConfig?.availablePlans) && version.executionConfig.availablePlans.length > 0
      ? version.executionConfig.availablePlans.map((plan, index) => ({
          id: plan?.id || `plan-${index + 1}`,
          label: plan?.label || `方案 ${index + 1}`,
          description: plan?.description || '',
          providerHint: plan?.providerHint || '',
          fitPlatforms: Array.isArray(plan?.fitPlatforms) ? plan.fitPlatforms : [],
        }))
      : defaultPlans();

  const defaultPlanId =
    execution.defaultPlanId && availablePlans.some((plan) => plan.id === execution.defaultPlanId)
      ? execution.defaultPlanId
      : availablePlans[0]?.id || 'ugc_video_factory';

  return {
    id: version?.id || 'media-ugc-v1',
    versionNumber: Number(version?.versionNumber ?? 1),
    versionLabel: version?.versionLabel || 'v0.1.0',
    status: version?.status || 'draft',
    title: version?.title || 'UGC 视频广告生成',
    summary: version?.summary,
    inputConfig: {
      ...defaultInputConfig(),
      ...(version?.inputConfig ?? {}),
    },
    understandingConfig: {
      ...defaultUnderstandingConfig(),
      ...(version?.understandingConfig ?? {}),
    },
    executionConfig: {
      ...execution,
      defaultPlanId,
      availablePlans,
      modelSelection,
    },
    businessFrame: {
      ...defaultBusinessFrame(),
      ...(version?.businessFrame ?? {}),
      goal: {
        ...defaultBusinessFrame().goal,
        ...(version?.businessFrame?.goal ?? {}),
        scenarios:
          Array.isArray(version?.businessFrame?.goal?.scenarios) && version.businessFrame.goal.scenarios.length > 0
            ? version.businessFrame.goal.scenarios
            : defaultBusinessFrame().goal.scenarios,
      },
      budget: {
        ...defaultBusinessFrame().budget,
        ...(version?.businessFrame?.budget ?? {}),
      },
      executionPlan: {
        stages:
          Array.isArray(version?.businessFrame?.executionPlan?.stages) &&
          version.businessFrame.executionPlan.stages.length > 0
            ? version.businessFrame.executionPlan.stages.map((stage, index) => ({
                id: stage?.id || `stage-${index + 1}`,
                label: stage?.label || `阶段 ${index + 1}`,
                kind: stage?.kind === 'confirm' ? 'confirm' : 'auto',
              }))
            : defaultBusinessFrame().executionPlan.stages,
      },
      result: {
        ...defaultBusinessFrame().result,
        ...(version?.businessFrame?.result ?? {}),
        deliveryLabels:
          Array.isArray(version?.businessFrame?.result?.deliveryLabels) &&
          version.businessFrame.result.deliveryLabels.length > 0
            ? version.businessFrame.result.deliveryLabels
            : defaultBusinessFrame().result.deliveryLabels,
        showcaseVideo: normalizeShowcaseVideo(version?.businessFrame?.result?.showcaseVideo),
      },
    },
    artifactConfig:
      Array.isArray(version?.artifactConfig) && version.artifactConfig.length > 0
        ? version.artifactConfig.map((artifact, index) => ({
            label: artifact?.label || `交付文件 ${index + 1}`,
            fileName: artifact?.fileName || `artifact-${index + 1}.txt`,
          }))
        : defaultArtifactConfig(),
    createdAt: version?.createdAt || new Date().toISOString(),
    publishedAt: version?.publishedAt,
  };
}

export function normalizeSkillRecord(skill: SkillRecord): SkillRecord {
  return {
    ...skill,
    description: skill.description || '',
    latestVersion: normalizeSkillVersion(skill.latestVersion),
  };
}
