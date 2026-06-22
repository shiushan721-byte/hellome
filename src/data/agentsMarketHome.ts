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
import { MARKET_BANNER_IMAGES } from './marketBannerImages';

export type MarketSpotDisplayStatus = 'open' | 'coming_soon' | 'beta' | 'recommended';

export interface MarketBannerSlot {
  id?: string;
  imageSrc: string;
  imagePosition?: string;
  href?: string;
}

export interface MarketHeroBannerConfig extends MarketBannerSlot {}

export interface MarketMediumBannerConfig extends MarketBannerSlot {
  id: string;
}

/** 游客态 /app 路径互转 */
export function resolveMarketBannerHref(href: string, guestMode: boolean): string {
  if (/^https?:\/\//i.test(href)) return href;

  if (guestMode) {
    if (href.startsWith('/app/agents/')) return href.replace('/app/agents/', '/agents/');
    if (href === '/app/agents') return '/agents';
    if (href.startsWith('/app/')) return href.replace(/^\/app/, '') || '/agents';
    return href;
  }

  if (href.startsWith('/agents/')) return href.replace('/agents/', '/app/agents/');
  if (href === '/agents') return '/app/agents';
  return href;
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
  imageSrc: MARKET_BANNER_IMAGES.heroGeo,
  imagePosition: 'center',
  href: '/agents/geo',
};

export const MARKET_MEDIUM_BANNERS: MarketMediumBannerConfig[] = [
  {
    id: 'medium-geo-suggest',
    imageSrc: MARKET_BANNER_IMAGES.geoSuggest,
    imagePosition: 'center',
    href: '/agents/geo',
  },
  {
    id: 'medium-media',
    imageSrc: MARKET_BANNER_IMAGES.media,
    imagePosition: 'center',
    href: '/agents/media-seeding',
  },
  {
    id: 'medium-sales',
    imageSrc: MARKET_BANNER_IMAGES.sales,
    imagePosition: 'center',
    href: '/agents/sales',
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
    id: 'product-media',
    title: '新品种草视频',
    description: '新品首发、真实种草短视频样片',
    agentId: 'media-seeding',
    agentName: '新品种草视频',
    icon: PenLine,
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
  subtitle: 'GEO 智能体已开放，内容创作与销售获客即将上线',
};
