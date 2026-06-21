import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  FileCode2,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  PenLine,
  Presentation,
  Sparkles,
} from 'lucide-react';
import { getVideoAgentProfile } from '../config/videoAgentProfiles';

export type MarketSpotDisplayStatus = 'open' | 'coming_soon' | 'beta' | 'recommended';

export interface MarketHeroBannerConfig {
  agentId: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tags: string[];
  tokenHint: string;
}

export interface MarketMediumBannerConfig {
  id: string;
  agentId: string;
  title: string;
  subtitle: string;
  cta: string;
  displayStatus: MarketSpotDisplayStatus;
  gradient: string;
}

export interface MarketProductSpot {
  id: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  icon: LucideIcon;
  displayStatus: MarketSpotDisplayStatus;
}

/** @deprecated use MARKET_HERO_BANNER */
export const MARKET_BANNER = {
  agentId: 'geo',
  title: 'GEO 智能体',
  subtitle: '检测你的品牌在 AI 回答里的可见度',
  tags: ['支持 DeepSeek、豆包、Kimi 等模型检测'],
  tokenHint: '预计消耗 8,000-30,000 Token',
};

export const MARKET_HERO_BANNER: MarketHeroBannerConfig = {
  agentId: 'geo',
  eyebrow: 'GEO 检测',
  title: 'AI 品牌可见度',
  subtitle: '检测你的品牌是否会被 AI 推荐',
  tags: ['支持 DeepSeek、豆包、Kimi 等模型'],
  tokenHint: '预计消耗 8,000-30,000 Token',
};

export const MARKET_MEDIUM_BANNERS: MarketMediumBannerConfig[] = [
  {
    id: 'medium-geo-suggest',
    agentId: 'geo',
    title: 'GEO 优化建议',
    subtitle: '根据检测结果生成 FAQ、LLMs.txt、Schema',
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#0F3D3E] via-[#145454] to-[#1A6B6C]',
  },
  {
    id: 'medium-media',
    agentId: 'media-seeding',
    title: getVideoAgentProfile('media-seeding')!.publicName,
    subtitle: getVideoAgentProfile('media-seeding')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'recommended',
    gradient: 'from-[#2B223B] via-[#44355D] to-[#5B4A76]',
  },
  {
    id: 'medium-media-review',
    agentId: 'media-review',
    title: getVideoAgentProfile('media-review')!.publicName,
    subtitle: getVideoAgentProfile('media-review')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#243344] via-[#35506B] to-[#476A87]',
  },
  {
    id: 'medium-media-conversion',
    agentId: 'media-conversion',
    title: getVideoAgentProfile('media-conversion')!.publicName,
    subtitle: getVideoAgentProfile('media-conversion')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#4A2E21] via-[#6A4433] to-[#8A5A40]',
  },
  {
    id: 'medium-media-showcase',
    agentId: 'media-showcase',
    title: getVideoAgentProfile('media-showcase')!.publicName,
    subtitle: getVideoAgentProfile('media-showcase')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#22352C] via-[#375546] to-[#557865]',
  },
  {
    id: 'medium-media-demo',
    agentId: 'media-demo',
    title: getVideoAgentProfile('media-demo')!.publicName,
    subtitle: getVideoAgentProfile('media-demo')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#283247] via-[#3C4D6B] to-[#5A7092]',
  },
  {
    id: 'medium-media-proposal',
    agentId: 'media-proposal',
    title: getVideoAgentProfile('media-proposal')!.publicName,
    subtitle: getVideoAgentProfile('media-proposal')!.workbenchSubtitle,
    cta: '立即使用',
    displayStatus: 'open',
    gradient: 'from-[#46322A] via-[#684A3D] to-[#8B6350]',
  },
  {
    id: 'medium-sales',
    agentId: 'sales',
    title: '销售获客智能体',
    subtitle: '分析客户网站，生成私信和邮件',
    cta: '内测中',
    displayStatus: 'beta',
    gradient: 'from-[#3A2E1F] via-[#4D3D2A] to-[#5C4A35]',
  },
];

export const MARKET_PRODUCT_SPOTS: MarketProductSpot[] = [
  {
    id: 'product-geo',
    title: 'GEO 智能体',
    description: '检测品牌 AI 可见度',
    agentId: 'geo',
    agentName: 'GEO 智能体',
    icon: Globe,
    displayStatus: 'open',
  },
  {
    id: 'product-geo-suggest',
    title: 'GEO 优化建议',
    description: '输出可执行优化方案',
    agentId: 'geo',
    agentName: 'GEO 智能体',
    icon: Sparkles,
    displayStatus: 'open',
  },
  {
    id: 'product-faq',
    title: 'FAQ 批量生成',
    description: '基于品牌语料批量生成',
    agentId: 'faq-generator',
    agentName: 'FAQ 批量生成',
    icon: MessageSquare,
    displayStatus: 'open',
  },
  {
    id: 'product-llms',
    title: 'LLMs.txt 生成',
    description: '提升 AI 召回友好度',
    agentId: 'faq-generator',
    agentName: 'FAQ 批量生成',
    icon: FileCode2,
    displayStatus: 'open',
  },
  {
    id: 'product-schema',
    title: 'Schema 结构化优化',
    description: '输出结构化数据包',
    agentId: 'schema-optimizer',
    agentName: 'Schema 结构化优化',
    icon: Layers,
    displayStatus: 'open',
  },
  {
    id: 'product-media-seeding',
    title: getVideoAgentProfile('media-seeding')!.publicName,
    description: getVideoAgentProfile('media-seeding')!.marketDescription,
    agentId: 'media-seeding',
    agentName: getVideoAgentProfile('media-seeding')!.publicName,
    icon: PenLine,
    displayStatus: 'recommended',
  },
  {
    id: 'product-media-review',
    title: getVideoAgentProfile('media-review')!.publicName,
    description: getVideoAgentProfile('media-review')!.marketDescription,
    agentId: 'media-review',
    agentName: getVideoAgentProfile('media-review')!.publicName,
    icon: FileText,
    displayStatus: 'open',
  },
  {
    id: 'product-media-conversion',
    title: getVideoAgentProfile('media-conversion')!.publicName,
    description: getVideoAgentProfile('media-conversion')!.marketDescription,
    agentId: 'media-conversion',
    agentName: getVideoAgentProfile('media-conversion')!.publicName,
    icon: Sparkles,
    displayStatus: 'open',
  },
  {
    id: 'product-media-showcase',
    title: getVideoAgentProfile('media-showcase')!.publicName,
    description: getVideoAgentProfile('media-showcase')!.marketDescription,
    agentId: 'media-showcase',
    agentName: getVideoAgentProfile('media-showcase')!.publicName,
    icon: Sparkles,
    displayStatus: 'open',
  },
  {
    id: 'product-media-demo',
    title: getVideoAgentProfile('media-demo')!.publicName,
    description: getVideoAgentProfile('media-demo')!.marketDescription,
    agentId: 'media-demo',
    agentName: getVideoAgentProfile('media-demo')!.publicName,
    icon: Presentation,
    displayStatus: 'open',
  },
  {
    id: 'product-media-proposal',
    title: getVideoAgentProfile('media-proposal')!.publicName,
    description: getVideoAgentProfile('media-proposal')!.marketDescription,
    agentId: 'media-proposal',
    agentName: getVideoAgentProfile('media-proposal')!.publicName,
    icon: FileText,
    displayStatus: 'open',
  },
  {
    id: 'product-sales',
    title: '销售获客智能体',
    description: '分析客户并生成触达话术',
    agentId: 'sales',
    agentName: '销售获客智能体',
    icon: BarChart3,
    displayStatus: 'beta',
  },
  {
    id: 'product-ppt',
    title: 'PPT 大纲智能体',
    description: '主题转演讲结构与要点',
    agentId: 'ppt-outline',
    agentName: 'PPT 大纲智能体',
    icon: Presentation,
    displayStatus: 'coming_soon',
  },
];

export const MARKET_PRODUCT_SECTION = {
  title: '一键使用热门智能体',
  subtitle: 'GEO 与 UGC 视频广告已开放，更多交付型智能体陆续上线',
};
