import { getMarketAgentSeedMeta, isMarketOnlineAgent, listMarketCatalogSlugs } from '../../data/marketAgentSeed';
import { seedAdminAgentsFromSkills } from '../admin/adminAgentService';
import type { AgentMarketStatus } from '../../types/adminAgent';

const VIDEO_AGENT_SLUGS = new Set([
  'media-seeding',
  'media-review',
  'media-conversion',
  'media-showcase',
  'media-demo',
  'media-proposal',
]);

function seedIcon(slug: string) {
  if (VIDEO_AGENT_SLUGS.has(slug)) return '/uploads/seed-icons/media.png';
  return `/uploads/seed-icons/${slug}.png`;
}

export async function seedAdminAgents() {
  const items = listMarketCatalogSlugs()
    .map((slug) => {
      const meta = getMarketAgentSeedMeta(slug);
      if (!meta) return null;
      const status: AgentMarketStatus = isMarketOnlineAgent(slug) ? 'online' : 'offline';
      return {
        slug: meta.slug,
        name: meta.name,
        description: meta.description,
        iconUrl: seedIcon(meta.slug),
        category: meta.category,
        status,
        version: status === 'online' ? '1.0.0' : '0.1.0',
        skillId: meta.slug,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  await seedAdminAgentsFromSkills(items);
}
