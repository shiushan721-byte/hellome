import type { HomePageConfigPayload } from '../types/homePageConfig';

export const HOME_CONFIG_KEY = 'home.page_config';
export const HOME_CONFIG_SCOPE = 'home';

export function getDefaultHomePageConfig(): HomePageConfigPayload {
  return {
    heroAds: [
      {
        id: 'hero-default',
        name: '默认首屏',
        enabled: true,
        sortOrder: 0,
        brandText: 'HelloMe',
        title: '让智能体完成复杂任务',
        subtitle: '选择场景，输入目标。过程看得见，结果可交付。',
        primaryButton: { label: '立即使用', action: 'login' },
        media: { type: 'none' },
      },
    ],
    agentRecommendations: [
      {
        id: 'rec-geo',
        enabled: true,
        sortOrder: 0,
        agentId: 'geo',
        title: 'GEO 智能体',
        description: '检测品牌在 AI 回答中的可见度与首推率',
        badge: '官网主推',
        tokenHint: '预计 8,000–30,000 Token',
        status: 'open',
        cta: { label: '使用智能体', action: 'use_agent' },
      },
      {
        id: 'rec-media',
        enabled: true,
        sortOrder: 1,
        agentId: 'media',
        title: '自媒体小助手',
        description: '公众号、小红书内容与发布前体检',
        badge: '创作者首选',
        tokenHint: '预计 5,000–20,000 Token',
        status: 'open',
        cta: { label: '使用智能体', action: 'use_agent' },
      },
      {
        id: 'rec-sales',
        enabled: true,
        sortOrder: 2,
        agentId: 'sales',
        title: '销售获客智能体',
        description: '客户画像、私信与邮件跟进闭环',
        badge: '高效获客',
        status: 'coming_soon',
        cta: { label: '即将开放', action: 'view_agent' },
      },
    ],
    agentShowcase: {
      enabled: true,
      title: '三大核心智能体服务',
      subtitle: '按需调用，支持任务执行全程进度监控，针对企业痛点场景深度定制。',
      defaultAgentId: 'geo',
      footerText: '支持企业定制自建：可无缝结合内部研发 API 及数据库资源。',
      tabs: [
        {
          id: 'tab-geo',
          agentId: 'geo',
          tabLabel: 'GEO 智能体',
          name: 'GEO 智能体',
          shortName: 'GEO 智能体',
          badge: '重磅场景 · 官网主推',
          tagline: 'AI 可见度检测与优化',
          description:
            '专为数字营销时代打造，核心检测您的品牌在各类 AI 生成式搜索回复中的占比，通过智能逆向推荐机制给出科学的提分建议。',
          coreScenarios: [
            'AI 纯答案率、提及率与首推率多模型全量化',
            '核心竞品抢首推词的占位份额比例 (SoV)',
            '自然搜索向大模型召回的下一阶段改造工单输出',
          ],
          quickTasks: [
            { title: '检测行业内品牌词大模型首位率', action: 'use_agent' },
            { title: '竞品召回漏洞专项补齐', action: 'use_agent' },
            { title: '官网Schema结构化标记重构', action: 'use_agent' },
          ],
          cta: { label: '立即在此场景中开始工作', action: 'use_agent' },
          enabled: true,
          sortOrder: 0,
        },
        {
          id: 'tab-media',
          agentId: 'media',
          tabLabel: '自媒体小助手',
          name: '自媒体小助手',
          shortName: '自媒体小助手',
          badge: '创作者首选',
          tagline: '公众号、小红书、PPT内容与发布前体检',
          description:
            '支持自媒体全生命周期管理，从核心文案起草开始，进行字词禁忌敏评检测、传播模型符合评分、以及自动重塑幻灯片大纲。',
          coreScenarios: [
            '微信公众号、小红书、知乎多平台发前合规审计',
            '高点击率爆棚标题逆向大模型测试与修正模型',
            'PPT 结构大纲及演讲手稿的提分生成',
          ],
          quickTasks: [
            { title: '生成小红书爆款排版格式', action: 'use_agent' },
            { title: '发布前政治/错别字安全体检', action: 'use_agent' },
            { title: '大纲结构智能化重排', action: 'use_agent' },
          ],
          cta: { label: '立即在此场景中开始工作', action: 'use_agent' },
          enabled: true,
          sortOrder: 1,
        },
        {
          id: 'tab-sales',
          agentId: 'sales',
          tabLabel: '销售获客智能体',
          name: '销售获客智能体',
          shortName: '销售获客智能体',
          badge: '高效获客神器',
          tagline: '客户画像精准定位、私信与邮件跟进闭环',
          description:
            '为销售及商务拓展团队深度降本，完成海量潜在企业分析、私信外联脚本起草，并对回访邮件及长文跟进形成闭环逻辑。',
          coreScenarios: [
            '根据目标企业官网一键提取买家决策链痛点',
            '生成式微信/LinkedIn领英私聊话术',
            '高意向潜在客户多段式精细化跟进邮件',
          ],
          quickTasks: [
            { title: '全自动外联开发邮件优化', action: 'use_agent' },
            { title: 'B2B 买家个性特征深度提取', action: 'use_agent' },
            { title: '私聊话术自适应训练', action: 'use_agent' },
          ],
          cta: { label: '立即在此场景中开始工作', action: 'use_agent' },
          enabled: true,
          sortOrder: 2,
        },
      ],
    },
  };
}
