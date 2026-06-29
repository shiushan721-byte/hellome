import { getVideoAgentProfile } from '../config/videoAgentProfiles';
import { resolveAgentCategorySlug } from '../data/agentCategories';
import { getSkill, getSkillExperienceConfig } from './skillStudioService';
import { listOnlineAgentsForMarket } from './admin/adminAgentService';
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
  category: string;
  iconUrl?: string;
  showcaseVideo?: SkillShowcaseVideo;
}

function resolvePublishedCategory(slug: string, dbCategory?: string | null): string {
  return dbCategory?.trim() || resolveAgentCategorySlug(slug) || 'content';
}

function isPublishedVideoSkill(skill: { id: string; category: string; status: string }): boolean {
  return skill.category === 'ugc_video' && skill.status === 'published';
}

function toPublishedMarketAgent(input: {
  skillId: string;
  name: string;
  description?: string;
  iconUrl?: string;
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
    category: resolvePublishedCategory(input.skillId),
    iconUrl: input.iconUrl,
    showcaseVideo: input.showcaseVideo,
  };
}

async function listLegacyPublishedVideoAgents(): Promise<PublishedMarketAgent[]> {
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

export async function listPublishedMarketAgents(): Promise<PublishedMarketAgent[]> {
  const onlineAgents = await listOnlineAgentsForMarket();
  if (onlineAgents.length === 0) {
    return listLegacyPublishedVideoAgents();
  }

  const results: PublishedMarketAgent[] = [];

  for (const online of onlineAgents) {
    const skillId = online.slug;
    const profile = getVideoAgentProfile(skillId);
    const isVideoAgent = VIDEO_AGENT_IDS.includes(skillId as (typeof VIDEO_AGENT_IDS)[number]);

    if (isVideoAgent && profile) {
      const skill = await getSkill(skillId);
      if (skill && isPublishedVideoSkill(skill)) {
        const experience = await getSkillExperienceConfig(skillId);
        const item = toPublishedMarketAgent({
          skillId,
          name: online.name || experience.name,
          description: online.description || experience.description || experience.summary,
          iconUrl: online.iconUrl,
          showcaseVideo: experience.businessFrame.result.showcaseVideo,
        });
        if (item) {
          results.push(item);
          continue;
        }
      }
    }

    results.push({
      agentId: online.slug,
      skillId: online.slug,
      name: online.name,
      description: online.description,
      status: 'published',
      entryLabel: profile?.marketEntryLabel ?? '立即使用',
      tokenRange: profile?.tokenRange ?? '—',
      category: resolvePublishedCategory(online.slug, online.category),
      iconUrl: online.iconUrl,
    });
  }

  return results;
}

export async function getPublishedMarketAgent(agentId: string): Promise<PublishedMarketAgent | null> {
  const onlineAgents = await listOnlineAgentsForMarket();
  if (onlineAgents.length > 0 && !onlineAgents.some((agent) => agent.agentId === agentId)) {
    return null;
  }

  const agents = await listPublishedMarketAgents();
  return agents.find((agent) => agent.agentId === agentId) ?? null;
}
