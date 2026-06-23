import { AGENTS, getAgentById } from '../data/agentsCatalog';

export type ResolvedHomeAgentMeta = {
  agentId: string;
  name: string;
  description: string;
  iconUrl: string;
  tokenRange: string;
  available: boolean;
};

export function resolveHomeAgentMeta(agentId: string): ResolvedHomeAgentMeta | null {
  const agent = getAgentById(agentId);
  if (!agent) return null;
  return {
    agentId: agent.id,
    name: agent.name,
    description: agent.desc,
    iconUrl: agent.iconSrc,
    tokenRange: agent.tokenRange,
    available: agent.available,
  };
}

export function listHomeAgentOptions() {
  return AGENTS.map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    description: agent.desc,
    iconUrl: agent.iconSrc,
    category: agent.category,
    available: agent.available,
  }));
}
