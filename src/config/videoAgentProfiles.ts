import type { SkillInputConfig } from '../types/skills';

export type VideoAgentProfile = {
  id:
    | 'media-seeding'
    | 'media-review'
    | 'media-conversion'
    | 'media-showcase'
    | 'media-demo'
    | 'media-proposal';
  publicName: string;
  title: string;
  marketDescription: string;
  workbenchSubtitle: string;
  tokenRange: string;
  orientationTags: [string, string, string];
  platform: string;
  effectGoal: '更像真人种草' | '更像测评讲解' | '更像带货转化';
  formatLabel: string;
  preferredPlanId?: string;
  audienceSummary: string;
  inputSummary: string;
  deliverySummary: string;
  marketEntryLabel: string;
  inputConfig: SkillInputConfig;
};

export const VIDEO_AGENT_PROFILES: Record<VideoAgentProfile['id'], VideoAgentProfile> = {
  'media-seeding': {
    id: 'media-seeding',
    publicName: '新品种草视频',
    title: '新品种草视频',
    marketDescription: '更适合新品首发、真实种草和小品牌日常传播的短视频样片。',
    workbenchSubtitle: '适合新品首发、门店上新和小品牌日常传播',
    tokenRange: '12,000-28,000 Token',
    orientationTags: ['10秒', '9:16', '真人种草风格'],
    platform: '抖音',
    effectGoal: '更像真人种草',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'ugc_video_factory',
    audienceSummary: '适合新品品牌、小门店和需要轻量种草传播的小团队。',
    inputSummary: '选择业务场景，上传产品素材，系统会自动整理种草表达。',
    deliverySummary: '先生成一版 10 秒种草样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做种草视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次想让用户记住什么卖点',
      sellingPointPlaceholder: '比如：帮我们做一条新品种草视频，重点让用户记住咖啡液方便、好看、适合送礼。',
      productImageHint: '上传包装图、单品图或本次新品主视觉素材。',
      talentImageHint: '上传真人参考、模特图或用户出镜素材（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统更快理解种草表达方向。',
    },
  },
  'media-review': {
    id: 'media-review',
    publicName: '测评讲解视频',
    title: '测评讲解视频',
    marketDescription: '更适合先讲效果、再给理由的测评口播和体验讲解类样片。',
    workbenchSubtitle: '适合开箱测评、体验讲解和偏信息传达的视频传播',
    tokenRange: '14,000-30,000 Token',
    orientationTags: ['10秒', '9:16', '测评讲解风格'],
    platform: '视频号',
    effectGoal: '更像测评讲解',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'talking_head_ugc',
    audienceSummary: '适合需要讲清体验、效果和购买建议的内容团队与品牌。',
    inputSummary: '选择讲解重点，上传产品素材，系统自动整理讲解结构。',
    deliverySummary: '先生成一版讲解样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做讲解视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次最想讲清楚什么体验或结论',
      sellingPointPlaceholder: '比如：帮我们做一条测评讲解视频，重点讲清楚这款护肤品上脸快、妆感轻、日常通勤够用。',
      productImageHint: '上传产品图、功能细节图或开箱展示素材。',
      talentImageHint: '上传讲解人物、试用者或口播出镜参考（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统理解测评讲解的表达方式。',
    },
  },
  'media-conversion': {
    id: 'media-conversion',
    publicName: '带货转化视频',
    title: '带货转化视频',
    marketDescription: '更适合强调行动引导、成交节奏和购买动机的短视频样片。',
    workbenchSubtitle: '适合活动转化、商品带货和更强行动引导的视频场景',
    tokenRange: '15,000-32,000 Token',
    orientationTags: ['10秒', '9:16', '带货转化风格'],
    platform: '抖音',
    effectGoal: '更像带货转化',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'ugc_video_factory',
    audienceSummary: '适合活动促销、商品带货和需要更强行动引导的团队。',
    inputSummary: '选择成交目标，上传商品素材，系统自动整理转化表达。',
    deliverySummary: '先生成一版转化样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做带货视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次最想推动用户做什么动作',
      sellingPointPlaceholder: '比如：帮我们做一条带货转化视频，重点突出活动价、限时优惠和立即下单理由。',
      productImageHint: '上传产品图、促销物料或活动主视觉素材。',
      talentImageHint: '上传出镜人物或口播带货参考（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统理解更强转化导向的视频表达。',
    },
  },
  'media-showcase': {
    id: 'media-showcase',
    publicName: '品牌宣传视频',
    title: '品牌宣传视频',
    marketDescription: '更适合门店宣传、空间展示和品牌形象露出的短视频样片。',
    workbenchSubtitle: '适合门店宣传、空间氛围展示和品牌形象传播',
    tokenRange: '13,000-26,000 Token',
    orientationTags: ['10秒', '9:16', '品牌宣传风格'],
    platform: '抖音',
    effectGoal: '更像真人种草',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'product_video_ad_maker',
    audienceSummary: '适合门店老板、小品牌和需要空间氛围传播的团队。',
    inputSummary: '选择门店业务，上传空间或产品素材，系统自动整理宣传方向。',
    deliverySummary: '先生成一版宣传样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做宣传视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次最想突出什么品牌氛围或门店特点',
      sellingPointPlaceholder: '比如：帮我们给新开的咖啡店做一条品牌宣传视频，重点突出空间氛围、夜间灯光和新品甜品。',
      productImageHint: '上传门店、空间、产品或品牌主视觉素材。',
      talentImageHint: '上传人物出镜参考或顾客氛围素材（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统理解品牌宣传的表达方向。',
    },
  },
  'media-demo': {
    id: 'media-demo',
    publicName: '产品演示视频',
    title: '产品演示视频',
    marketDescription: '更适合设备展示、功能讲解和项目开工前演示的产品视频样片。',
    workbenchSubtitle: '适合设备展示、功能讲解和项目演示沟通',
    tokenRange: '16,000-34,000 Token',
    orientationTags: ['10秒', '9:16', '演示视频风格'],
    platform: '视频号',
    effectGoal: '更像测评讲解',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'talking_head_ugc',
    audienceSummary: '适合设备商、项目团队和需要客户演示沟通的业务场景。',
    inputSummary: '选择演示重点，上传设备或流程素材，系统自动整理演示逻辑。',
    deliverySummary: '先生成一版演示样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做演示视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次最想演示什么功能、流程或亮点',
      sellingPointPlaceholder: '比如：帮我们做一条产品演示视频，重点讲清楚这台设备的自动分拣流程和现场效率提升。',
      productImageHint: '上传设备图、产品图、流程图或现场素材。',
      talentImageHint: '上传讲解人员、操作员或出镜人物参考（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统理解演示讲解的表达结构。',
    },
  },
  'media-proposal': {
    id: 'media-proposal',
    publicName: '客户提案视频',
    title: '客户提案视频',
    marketDescription: '更适合给客户演示方案方向、提案思路和项目预期的视频样片。',
    workbenchSubtitle: '适合给客户展示方案方向、提案创意和项目预期',
    tokenRange: '14,000-30,000 Token',
    orientationTags: ['10秒', '9:16', '提案展示风格'],
    platform: '视频号',
    effectGoal: '更像测评讲解',
    formatLabel: '10 秒 / 9:16',
    preferredPlanId: 'talking_head_ugc',
    audienceSummary: '适合服务商、策划团队和需要先向客户展示方案方向的场景。',
    inputSummary: '选择提案目标，上传项目素材，系统自动整理提案表达。',
    deliverySummary: '先生成一版提案样片，再继续整理封面与交付说明。',
    marketEntryLabel: '开始做提案视频',
    inputConfig: {
      sellingPointLabel: '告诉我这次最想向客户呈现什么方案重点',
      sellingPointPlaceholder: '比如：帮我们做一条客户提案视频，重点展示门店升级后的空间气质、内容方向和活动预期效果。',
      productImageHint: '上传客户素材、项目素材或方案相关视觉参考。',
      talentImageHint: '上传出镜人物、讲解人或客户偏好参考（选填）。',
      referenceUrlHint: '可选填写，用于帮助系统理解提案展示的方向。',
    },
  },
};

export const VIDEO_AGENT_IDS = Object.keys(VIDEO_AGENT_PROFILES) as VideoAgentProfile['id'][];

export function isVideoAgentId(value: string): value is VideoAgentProfile['id'] {
  return value in VIDEO_AGENT_PROFILES;
}

export function getVideoAgentProfile(id: string): VideoAgentProfile | undefined {
  return isVideoAgentId(id) ? VIDEO_AGENT_PROFILES[id] : undefined;
}
