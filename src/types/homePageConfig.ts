export type HomeButtonAction =
  | 'login'
  | 'use_agent'
  | 'open_market'
  | 'open_workbench'
  | 'open_url'
  | 'open_gnomic'
  | 'open_agentsyun';

export type HomeHeroAdConfig = {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
  brandText: string;
  title: string;
  subtitle: string;
  primaryButton: {
    label: string;
    action: HomeButtonAction;
    target?: string;
    agentId?: string;
  };
  secondaryButton?: {
    label: string;
    action: HomeButtonAction;
    target?: string;
    agentId?: string;
  };
  media?: {
    type: 'none' | 'image' | 'video';
    url?: string;
    posterUrl?: string;
  };
  startAt?: string;
  endAt?: string;
};

export type HomeAgentRecommendationStatus = 'open' | 'coming_soon' | 'beta' | 'hidden';

export type HomeAgentRecommendationConfig = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  agentId: string;
  title: string;
  description: string;
  badge?: string;
  iconUrl?: string;
  reason?: string;
  tokenHint?: string;
  status: HomeAgentRecommendationStatus;
  cta: {
    label: string;
    action: 'use_agent' | 'view_agent' | 'apply_beta';
  };
  startAt?: string;
  endAt?: string;
};

export type HomeAgentShowcaseCard = {
  id: string;
  agentId: string;
  buttonLabel: string;
  visible: boolean;
  sortOrder: number;
};

export type HomeAgentShowcaseTab = {
  id: string;
  tabLabel: string;
  tabKey: string;
  enabled: boolean;
  sortOrder: number;
  agents: HomeAgentShowcaseCard[];
};

export type HomeAgentShowcaseConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  defaultTabKey: string;
  /** @deprecated use defaultTabKey */
  defaultAgentId?: string;
  defaultButtonLabel?: string;
  footerText?: string;
  tabs: HomeAgentShowcaseTab[];
};

export type HomePageConfigPayload = {
  heroAds: HomeHeroAdConfig[];
  agentRecommendations: HomeAgentRecommendationConfig[];
  agentShowcase: HomeAgentShowcaseConfig;
};

export type HomePageOperationConfig = HomePageConfigPayload & {
  version: number;
  updatedAt: string;
};

export type AdminHomeConfigState = {
  configId: string | null;
  status: 'default' | 'published';
  version: number;
  updatedAt: string;
  config: HomePageConfigPayload;
  /** @deprecated 使用 configId */
  draftId?: string | null;
  /** @deprecated */
  publishedVersion?: number;
};
