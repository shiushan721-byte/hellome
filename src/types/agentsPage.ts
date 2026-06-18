export type AgentsTab = 'market' | 'mine';

export type AgentMarketStatus = 'available' | 'coming_soon';

export type MyAgentStatus = 'active';

export interface AgentQuotaSnapshot {
  enabledCount: number;
  tokenBalance: number;
}

export interface AgentMarketCard {
  id: string;
  name: string;
  description: string;
  category: string;
  tokenRange: string;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  creator: string;
  creatorAvatar: string;
  heat: string;
  likes: string;
  iconSrc: string;
  status: AgentMarketStatus;
  badge?: string;
}

export interface MyAgentCard {
  id: string;
  name: string;
  description: string;
  iconSrc: string;
  status: MyAgentStatus;
  monthlyTaskCount: number;
  monthlyTokenUsed: number;
  latestTask?: {
    id: string;
    name: string;
    status: string;
    statusLabel: string;
    updatedAt: string;
  };
  canDeactivate: boolean;
  deactivateReason?: string;
  hasRunningTasks?: boolean;
}

export interface AgentsPageData {
  activeTab: AgentsTab;
  quota: AgentQuotaSnapshot;
  marketAgents: AgentMarketCard[];
  myAgents: MyAgentCard[];
}
