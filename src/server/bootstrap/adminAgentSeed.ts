import { getVideoAgentProfile } from '../../config/videoAgentProfiles';
import { seedAdminAgentsFromSkills } from '../admin/adminAgentService';
import type { AgentMarketStatus } from '../../types/adminAgent';

const VIDEO_AGENT_SLUGS = [
  'media-seeding',
  'media-review',
  'media-conversion',
  'media-showcase',
  'media-demo',
  'media-proposal',
] as const;

const OFFLINE_AGENT_SLUGS = [
  'sales',
  'schema-optimizer',
  'competitor-scan',
  'hermes-report',
  'faq-generator',
  'ppt-outline',
  'outreach-mail',
  'copy-audit',
  'sov-tracker',
  'prompt-lab',
] as const;

function seedIcon(slug: string) {
  return `/uploads/seed-icons/${slug}.png`;
}

export async function seedAdminAgents() {
  const items: Array<{
    slug: string;
    name: string;
    description: string;
    iconUrl: string;
    category?: string;
    status: AgentMarketStatus;
    version: string;
    skillId: string;
  }> = [
    {
      slug: 'geo',
      name: 'GEO 智能体',
      description: '检测品牌在 DeepSeek、豆包、Kimi 等 AI 回答里的可见度与推荐率。',
      iconUrl: seedIcon('geo'),
      category: 'geo',
      status: 'online',
      version: '1.0.0',
      skillId: 'geo',
    },
    ...VIDEO_AGENT_SLUGS.map((slug) => {
      const profile = getVideoAgentProfile(slug)!;
      return {
        slug,
        name: profile.publicName,
        description: profile.marketDescription,
        iconUrl: seedIcon('media'),
        category: 'content',
        status: 'online' as const,
        version: '1.0.0',
        skillId: slug,
      };
    }),
    ...OFFLINE_AGENT_SLUGS.map((slug) => ({
      slug,
      name: slug,
      description: '待上架智能体',
      iconUrl: seedIcon(slug),
      category: 'content',
      status: 'offline' as const,
      version: '0.1.0',
      skillId: slug,
    })),
  ];

  await seedAdminAgentsFromSkills(items);
}
