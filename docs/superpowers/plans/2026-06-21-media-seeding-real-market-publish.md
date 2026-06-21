# Media-Seeding Real Market Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `media-seeding` the first video agent that is truly created, published, and rendered in the market from the Skill pipeline, including one real showcase video reused across market detail and workbench.

**Architecture:** Add a server-side published-market projection for video skills, persist one showcase-video payload on the published `SkillVersion`, and update market/detail/workbench UIs to prefer the published view for `media-seeding` while safely falling back to the current static config for everything else.

**Tech Stack:** TypeScript, React, Express, Prisma, Node test runner

## Global Constraints

- Only `media-seeding` moves to the real publish pipeline in this iteration.
- Static market config remains as fallback for all other agents and for failure cases.
- The same showcase video payload must be reused in public detail and app workbench.
- No unrelated refactors while touching market pages and skill services.

---

### Task 1: Add showcase video metadata to published skill data

**Files:**
- Modify: `src/types/skills.ts`
- Modify: `src/server/skillStudioService.ts`
- Modify: `src/lib/skillDraft.ts`
- Modify: `src/server/bootstrap/demoSeedData.ts`
- Modify: `prisma/seed.ts`
- Test: `tests/server/skillStudioService.test.ts`

**Interfaces:**
- Consumes: `SkillVersionRecord`, `SkillExperienceConfig`
- Produces: `showcaseVideo?: { title; summary; videoUrl; coverUrl; posterText }`

- [ ] **Step 1: Write the failing test**

```ts
test('getSkillExperienceConfig returns showcase video for media-seeding', async () => {
  const experience = await getSkillExperienceConfig('media-seeding');
  assert.equal(experience.latestShowcaseVideo?.title, '通勤防晒真人种草样片');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/server/skillStudioService.test.ts`
Expected: FAIL because `latestShowcaseVideo` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface SkillShowcaseVideo {
  title: string;
  summary: string;
  videoUrl: string;
  coverUrl?: string;
  posterText?: string;
}
```

```ts
latestShowcaseVideo: binding.version.showcaseVideo,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/server/skillStudioService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/skills.ts src/server/skillStudioService.ts src/lib/skillDraft.ts src/server/bootstrap/demoSeedData.ts prisma/seed.ts tests/server/skillStudioService.test.ts
git commit -m "feat: add showcase video metadata to skill versions"
```

### Task 2: Build a published market projection for video skills

**Files:**
- Create: `src/server/publishedMarketService.ts`
- Modify: `server.ts`
- Test: `tests/server/publishedMarketService.test.ts`

**Interfaces:**
- Consumes: `listSkills()`, `getSkillExperienceConfig(skillId)`
- Produces: `listPublishedMarketAgents(): Promise<PublishedMarketAgent[]>`

- [ ] **Step 1: Write the failing test**

```ts
test('listPublishedMarketAgents returns a published media-seeding card with showcase video', async () => {
  const agents = await listPublishedMarketAgents();
  const mediaSeeding = agents.find((agent) => agent.agentId === 'media-seeding');
  assert.ok(mediaSeeding);
  assert.equal(mediaSeeding?.showcaseVideo?.videoUrl, '/media/showcase/media-seeding-sample.mp4');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/server/publishedMarketService.test.ts`
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

```ts
app.get('/api/published-market/agents', async (_req, res) => {
  res.json({ success: true, data: await listPublishedMarketAgents() });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/server/publishedMarketService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/publishedMarketService.ts server.ts tests/server/publishedMarketService.test.ts
git commit -m "feat: add published market projection for video skills"
```

### Task 3: Let market/detail pages prefer the published market view

**Files:**
- Modify: `src/lib/skillStudioApi.ts`
- Modify: `src/lib/agentsPageData.ts`
- Modify: `src/pages/app/AgentsPage.tsx`
- Modify: `src/pages/PublicAgentDetailPage.tsx`
- Possibly Modify: `src/types/agentsPage.ts`
- Test: `tests/ui/publishedMarketModel.test.ts`

**Interfaces:**
- Consumes: `/api/published-market/agents`
- Produces: market/detail models that override static `media-seeding` fields when published data exists

- [ ] **Step 1: Write the failing test**

```ts
test('mergePublishedMarketAgents overrides the static media-seeding card', () => {
  const result = mergePublishedMarketAgents(staticCards, [publishedMediaSeeding]);
  assert.equal(result.find((card) => card.id === 'media-seeding')?.description, 'published description');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/publishedMarketModel.test.ts`
Expected: FAIL because merge logic does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
if (published.agentId === staticCard.id) {
  return {
    ...staticCard,
    name: published.name,
    description: published.description,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/publishedMarketModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/skillStudioApi.ts src/lib/agentsPageData.ts src/pages/app/AgentsPage.tsx src/pages/PublicAgentDetailPage.tsx tests/ui/publishedMarketModel.test.ts
git commit -m "feat: read media-seeding market content from published skills"
```

### Task 4: Reuse the same showcase video in the workbench

**Files:**
- Modify: `src/types/skills.ts`
- Modify: `src/pages/app/UgcVideoAgentPage.tsx`
- Test: `tests/ui/publishedMarketModel.test.ts`

**Interfaces:**
- Consumes: `getSkillExperienceConfig('media-seeding')`
- Produces: default-case section that renders `latestShowcaseVideo`

- [ ] **Step 1: Write the failing test**

```ts
test('buildWorkbenchShowcase returns published showcase video when available', () => {
  const showcase = buildWorkbenchShowcase(experienceWithVideo);
  assert.equal(showcase.kind, 'video');
  assert.equal(showcase.videoUrl, '/media/showcase/media-seeding-sample.mp4');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/publishedMarketModel.test.ts`
Expected: FAIL because workbench showcase helper does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
if (skillExperience?.latestShowcaseVideo) {
  return {
    kind: 'video',
    ...skillExperience.latestShowcaseVideo,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/publishedMarketModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/app/UgcVideoAgentPage.tsx tests/ui/publishedMarketModel.test.ts
git commit -m "feat: reuse published showcase video in media-seeding workbench"
```

### Task 5: Seed one real media-seeding showcase asset and verify the full path

**Files:**
- Create: `public/media/showcase/media-seeding-sample.mp4`
- Create: `public/media/showcase/media-seeding-cover.png`
- Modify: `src/server/bootstrap/demoSeedData.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: seed-time published skill payload
- Produces: local published showcase asset available to market/detail/workbench

- [ ] **Step 1: Prepare the asset file and metadata**

```ts
showcaseVideo: {
  title: '通勤防晒真人种草样片',
  summary: '围绕轻薄防晒与通勤场景的 10 秒真人种草案例。',
  videoUrl: '/media/showcase/media-seeding-sample.mp4',
  coverUrl: '/media/showcase/media-seeding-cover.png',
  posterText: '真人种草 · 通勤防晒'
}
```

- [ ] **Step 2: Seed the published skill with the showcase metadata**

Run: `npm run prisma:seed`
Expected: success with updated published `media-seeding` version

- [ ] **Step 3: Run focused verification**

Run: `npx tsx --test tests/server/skillStudioService.test.ts tests/server/publishedMarketService.test.ts tests/ui/publishedMarketModel.test.ts`
Expected: PASS

- [ ] **Step 4: Run project-level verification**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/media/showcase/media-seeding-sample.mp4 public/media/showcase/media-seeding-cover.png src/server/bootstrap/demoSeedData.ts prisma/seed.ts tests/server/skillStudioService.test.ts tests/server/publishedMarketService.test.ts tests/ui/publishedMarketModel.test.ts
git commit -m "feat: publish media-seeding with a real showcase video"
```
