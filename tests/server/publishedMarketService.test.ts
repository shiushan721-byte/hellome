import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublishedMarketAgent, listPublishedMarketAgents } from '../../src/server/publishedMarketService';

process.env.ALLOW_INMEMORY_FALLBACK = 'true';

test('listPublishedMarketAgents returns a published media-seeding card with showcase video', async () => {
  const agents = await listPublishedMarketAgents();
  const mediaSeeding = agents.find((agent) => agent.agentId === 'media-seeding');

  assert.ok(mediaSeeding);
  assert.equal(mediaSeeding?.status, 'published');
  assert.equal(mediaSeeding?.showcaseVideo?.videoUrl, '/media/showcase/media-seeding-sample.webm');
});

test('getPublishedMarketAgent returns media-seeding published detail', async () => {
  const agent = await getPublishedMarketAgent('media-seeding');

  assert.ok(agent);
  assert.equal(agent?.name.length ? true : false, true);
  assert.equal(agent?.entryLabel.length ? true : false, true);
  assert.equal(agent?.showcaseVideo?.title, '通勤防晒真人种草样片');
});
