import { getVideoAgentProfile } from '../config/videoAgentProfiles';
import { getSkill, getSkillExperienceConfig } from './skillStudioService';
import type { SkillShowcaseVideo } from '../types/skills';

const VIDEO_AGENT_IDS = [
  'media-seeding',
  'media-review',
  'media-conversion',
  'media-showcase',
  'media-demo',
  'media-proposal',
] as const;

export interface PublishedMarketAgent {
  agentId: string;
  skillId: string;
  name: string;
  description: string;
  status: 'published';
  entryLabel: string;
  tokenRange: string;
  category: 'content';
  showcaseVideo?: SkillShowcaseVideo;
}

function isPublishedVideoSkill(skill: { id: string; category: string; status: string }): boolean {
  return skill.category === 'ugc_video' && skill.status === 'published';
}

function toPublishedMarketAgent(input: {
  skillId: string;
  name: string;
  description?: string;
  showcaseVideo?: SkillShowcaseVideo;
}): PublishedMarketAgent | null {
  const profile = getVideoAgentProfile(input.skillId);
  if (!profile) return null;
  return {
    agentId: input.skillId,
    skillId: input.skillId,
    name: input.name,
    description: input.description || profile.marketDescription,
    status: 'published',
    entryLabel: profile.marketEntryLabel,
    tokenRange: profile.tokenRange,
    category: 'content',
    showcaseVideo: input.showcaseVideo,
  };
}

export async function listPublishedMarketAgents(): Promise<PublishedMarketAgent[]> {
  const skills = await Promise.all(VIDEO_AGENT_IDS.map((skillId) => getSkill(skillId)));
  const videoSkills = skills.filter(isPublishedVideoSkill);
  const experiences = await Promise.all(
    videoSkills.map(async (skill) => {
      const experience = await getSkillExperienceConfig(skill.id);
      return toPublishedMarketAgent({
        skillId: skill.id,
        name: experience.name,
        description: experience.description ?? experience.summary,
        showcaseVideo: experience.businessFrame.result.showcaseVideo,
      });
    }),
  );

  return experiences.filter((item): item is PublishedMarketAgent => Boolean(item));
}

export async function getPublishedMarketAgent(agentId: string): Promise<PublishedMarketAgent | null> {
  const agents = await listPublishedMarketAgents();
  return agents.find((agent) => agent.agentId === agentId) ?? null;
}
