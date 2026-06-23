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
  tokenHint?: string;
  status: HomeAgentRecommendationStatus;
  cta: {
    label: string;
    action: 'use_agent' | 'view_agent' | 'apply_beta';
  };
  startAt?: string;
  endAt?: string;
};

export type HomeShowcaseTaskAction = 'use_agent' | 'view_agent' | 'open_url';

export type HomeAgentShowcaseTab = {
  id: string;
  agentId: string;
  tabLabel: string;
  name: string;
  shortName: string;
  badge?: string;
  tagline: string;
  description: string;
  coreScenarios: string[];
  quickTasks: Array<{
    title: string;
    action: HomeShowcaseTaskAction;
    target?: string;
  }>;
  cta: {
    label: string;
    action: 'use_agent' | 'view_agent';
  };
  enabled: boolean;
  sortOrder: number;
};

export type HomeAgentShowcaseConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  defaultAgentId: string;
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
  draftId: string | null;
  status: 'default' | 'draft' | 'published';
  publishedVersion: number;
  version: number;
  updatedAt: string;
  config: HomePageConfigPayload;
};
