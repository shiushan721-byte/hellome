import type { AgentMarketCard } from '../types/agentsPage';
import type { PublishedMarketAgent } from './skillStudioApi';
import type { SkillExperienceConfig } from '../types/skills';

export function mergePublishedMarketAgents(
  cards: AgentMarketCard[],
  publishedAgents: PublishedMarketAgent[],
): AgentMarketCard[] {
  if (publishedAgents.length === 0) return cards;
  return cards.map((card) => {
    const published = publishedAgents.find((item) => item.agentId === card.id);
    if (!published) return card;
    return {
      ...card,
      name: published.name,
      description: published.description,
      tokenRange: published.tokenRange,
      category: published.category,
      status: published.status === 'published' ? 'available' : card.status,
    };
  });
}

export function buildWorkbenchShowcaseVideo(skillExperience: SkillExperienceConfig | null) {
  return skillExperience?.businessFrame.result.showcaseVideo ?? null;
}
