import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_SLUG_CATEGORY } from '../../src/data/agentCategories';
import {
  MARKET_ONLINE_AGENT_SLUGS,
  isMarketOnlineAgent,
  listMarketCatalogSlugs,
  listMarketOfflineAgentSlugs,
} from '../../src/data/marketAgentSeed';

test('market online agents are exactly 15 catalog entries', () => {
  const catalogSlugs = listMarketCatalogSlugs();
  assert.equal(MARKET_ONLINE_AGENT_SLUGS.length, 15);
  assert.equal(catalogSlugs.length, Object.keys(AGENT_SLUG_CATEGORY).length);
  for (const slug of MARKET_ONLINE_AGENT_SLUGS) {
    assert.ok(catalogSlugs.includes(slug), `missing catalog agent: ${slug}`);
    assert.ok(isMarketOnlineAgent(slug));
  }
  assert.equal(listMarketOfflineAgentSlugs().length, catalogSlugs.length - 15);
  assert.deepEqual(listMarketOfflineAgentSlugs().sort(), ['copy-audit', 'sov-tracker']);
});
