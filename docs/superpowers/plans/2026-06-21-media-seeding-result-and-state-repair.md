# Media-Seeding Result And State Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `media-seeding` complete only when a real primary video exists, then rebuild result/detail/status UI so video tasks read as result-first and stage-accurate.

**Architecture:** First tighten the server-side delivery gate by resolving one canonical primary video artifact, filtering degraded artifacts, and refusing to mark tasks completed without it. Then add a shared media task presentation model that drives task detail, result summary, and running/completed state copy from the same derived stage facts.

**Tech Stack:** TypeScript, React, Express, Node test runner, Hermes local-gen

## Global Constraints

- This iteration only repairs the `media-seeding` sample path.
- A video task must not become `completed` without a real playable primary video artifact.
- Fallback audio may remain as a supporting artifact, but it must never become the main result surface.
- Task detail, result summary, and status copy must read from the same derived media stage model.
- Avoid database schema changes; prefer derived presenter/model layers.

---

### Task 1: Enforce a primary video completion gate in the UGC pipeline

**Files:**
- Modify: `src/server/ugcTaskService.ts`
- Test: `tests/server/ugcTaskService.delivery.test.ts`

**Interfaces:**
- Consumes: `HermesLocalGenResult`, `UgcTaskArtifact[]`
- Produces:
  - `detectArtifactFormat(filePath: string): Promise<{ ext: string; mimeType: string }>`
  - `extractPrimaryOutput(result: HermesLocalGenResult, preferredKinds: Array<'images' | 'gifs' | 'video'>): Promise<{ file: string; sizeBytes?: number; mimeType: string }>`
  - `resolvePrimaryVideoArtifact(artifacts: UgcTaskArtifact[]): UgcTaskArtifact | null`

- [ ] **Step 1: Write the failing test**

```ts
test('resolvePrimaryVideoArtifact picks the playable video and ignores audio/image artifacts', async () => {
  const artifacts = [
    { id: 'a1', type: 'audio', label: 'AI 配音', fileName: 'audio-mock.wav', mimeType: 'audio/wav', url: '/media/audio.wav' },
    { id: 'a2', type: 'image', label: '封面', fileName: 'cover.png', mimeType: 'image/png', url: '/media/cover.png' },
    { id: 'a3', type: 'video', label: '样片视频', fileName: 'sample-video.webm', mimeType: 'video/webm', url: '/media/sample-video.webm' },
  ] as const;

  const primary = resolvePrimaryVideoArtifact(artifacts as unknown as UgcTaskArtifact[]);

  assert.equal(primary?.fileName, 'sample-video.webm');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/server/ugcTaskService.delivery.test.ts`
Expected: FAIL because `resolvePrimaryVideoArtifact` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function resolvePrimaryVideoArtifact(artifacts: UgcTaskArtifact[]): UgcTaskArtifact | null {
  const playable = artifacts.filter((artifact) => artifact.type === 'video');
  if (playable.length === 0) return null;
  return playable
    .slice()
    .sort((left, right) => {
      const leftScore = left.mimeType?.startsWith('video/') ? 1 : 0;
      const rightScore = right.mimeType?.startsWith('video/') ? 1 : 0;
      return rightScore - leftScore;
    })[0] ?? null;
}
```

- [ ] **Step 4: Gate completion on the primary video**

```ts
const primaryVideoArtifact = resolvePrimaryVideoArtifact([videoArtifact, ...(audioArtifact ? [audioArtifact] : []), coverArtifact]);
if (!primaryVideoArtifact) {
  throw new Error('主视频未生成成功，不能标记任务完成');
}
record.task.artifacts = [primaryVideoArtifact, ...(audioArtifact ? [audioArtifact] : []), coverArtifact, scriptArtifact, summaryArtifact];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx tsx --test tests/server/ugcTaskService.delivery.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/ugcTaskService.ts tests/server/ugcTaskService.delivery.test.ts
git commit -m "fix: require primary video before completing ugc tasks"
```

### Task 2: Add a shared media delivery presentation model

**Files:**
- Create: `src/lib/mediaTaskPresentation.ts`
- Test: `tests/ui/mediaTaskPresentation.test.ts`

**Interfaces:**
- Consumes: `Task`, `UgcTaskArtifact`
- Produces:
  - `deriveMediaTaskStage(task: Task): 'queued' | 'understanding' | 'route_planning' | 'waiting_confirmation' | 'rendering_video' | 'packaging_delivery' | 'completed' | 'recoverable_error' | 'failed'`
  - `buildMediaDeliveryView(task: Task): { stage; primaryArtifact; supportingArtifacts; hasFallbackAudio; artifactSummary; statusHeadline; statusBody }`

- [ ] **Step 1: Write the failing test**

```ts
test('buildMediaDeliveryView places the video first and marks fallback audio as supporting', () => {
  const task = buildTaskFixture({
    status: 'completed',
    artifacts: [
      { id: 'audio', type: 'audio', label: 'AI 配音', fileName: 'audio-mock.wav', mimeType: 'audio/wav', url: '/media/audio-mock.wav' },
      { id: 'video', type: 'video', label: '样片视频', fileName: 'sample-video.webm', mimeType: 'video/webm', url: '/media/sample-video.webm' },
      { id: 'cover', type: 'image', label: '封面首帧', fileName: 'cover.png', mimeType: 'image/png', url: '/media/cover.png' },
    ],
  });

  const view = buildMediaDeliveryView(task);

  assert.equal(view.primaryArtifact?.type, 'video');
  assert.equal(view.supportingArtifacts[0]?.type, 'audio');
  assert.equal(view.hasFallbackAudio, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/mediaTaskPresentation.test.ts`
Expected: FAIL because `mediaTaskPresentation.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export function deriveMediaTaskStage(task: Task) {
  if (task.recoveryState?.runState === 'interrupted') return 'recoverable_error';
  if (task.status === 'waiting_confirmation') return 'waiting_confirmation';
  if (task.status === 'completed') return 'completed';
  if (task.status === 'failed') return 'failed';
  const activeIndex = task.steps.findIndex((step) => step.status === 'active');
  if (task.status === 'queued') return 'queued';
  if (activeIndex <= 0) return 'understanding';
  if (activeIndex <= 2) return 'route_planning';
  if (activeIndex <= 4) return 'rendering_video';
  return 'packaging_delivery';
}
```

```ts
export function buildMediaDeliveryView(task: Task) {
  const primaryArtifact = resolvePrimaryVideoArtifact(task.artifacts ?? []);
  const supportingArtifacts = (task.artifacts ?? []).filter((artifact) => artifact.id !== primaryArtifact?.id);
  const hasFallbackAudio = supportingArtifacts.some((artifact) => artifact.type === 'audio' && artifact.fileName.includes('mock'));
  return {
    stage: deriveMediaTaskStage(task),
    primaryArtifact,
    supportingArtifacts,
    hasFallbackAudio,
    artifactSummary: primaryArtifact ? `1 条样片视频 + ${supportingArtifacts.length} 个交付附件` : `${supportingArtifacts.length} 个交付附件`,
    statusHeadline: primaryArtifact ? '结果已整理完成' : '主结果尚未就绪',
    statusBody: primaryArtifact ? '主视频已可查看，附件已整理完成。' : '系统尚未拿到可交付的主视频。',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/mediaTaskPresentation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/mediaTaskPresentation.ts tests/ui/mediaTaskPresentation.test.ts
git commit -m "feat: add shared media task presentation model"
```

### Task 3: Rebuild task detail to show the primary result first

**Files:**
- Modify: `src/components/app/tasks/UgcDeliveryPanel.tsx`
- Modify: `src/components/app/tasks/TaskShowcaseStage.tsx`
- Modify: `src/components/app/tasks/TaskResultSummaryBar.tsx`
- Test: `tests/ui/taskShowcaseStage.test.ts`

**Interfaces:**
- Consumes: `buildMediaDeliveryView(task)`
- Produces:
  - `UgcDeliveryPanel` renders primary video before supporting artifacts
  - `TaskShowcaseStage` uses derived stage/status copy instead of ad-hoc copy

- [ ] **Step 1: Write the failing test**

```ts
test('completed media task shows primary video before supporting artifacts', () => {
  const task = buildCompletedMediaTaskFixture();
  const view = buildMediaDeliveryView(task);

  assert.equal(view.primaryArtifact?.label, '样片视频');
  assert.equal(view.supportingArtifacts.map((artifact) => artifact.label).includes('AI 配音音轨'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/taskShowcaseStage.test.ts`
Expected: FAIL because current components do not use the shared view model.

- [ ] **Step 3: Write minimal implementation**

```tsx
const deliveryView = buildMediaDeliveryView(task);
const previewArtifact = deliveryView.primaryArtifact;
const fileArtifacts = deliveryView.supportingArtifacts;
```

```tsx
{deliveryView.hasFallbackAudio ? (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
    当前音轨为降级附件，主结果以视频样片为准。
  </div>
) : null}
```

```tsx
<h3 className="text-sm font-semibold text-black">正式样片</h3>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/taskShowcaseStage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/app/tasks/UgcDeliveryPanel.tsx src/components/app/tasks/TaskShowcaseStage.tsx src/components/app/tasks/TaskResultSummaryBar.tsx tests/ui/taskShowcaseStage.test.ts
git commit -m "feat: make task detail result-first for media deliveries"
```

### Task 4: Unify task detail status and stage copy

**Files:**
- Modify: `src/components/app/tasks/TaskRunLayout.tsx`
- Modify: `src/components/app/tasks/TaskStageRail.tsx`
- Modify: `src/components/app/tasks/TaskStatusBadge.tsx`
- Test: `tests/ui/taskRunLayout.test.ts`

**Interfaces:**
- Consumes: `deriveMediaTaskStage(task)`, `buildMediaDeliveryView(task)`
- Produces: one consistent media-stage-aware header/rail/right-panel experience

- [ ] **Step 1: Write the failing test**

```ts
test('waiting confirmation media task shows confirmation stage in header and rail', () => {
  const task = buildTaskFixture({ status: 'waiting_confirmation' });
  const stage = deriveMediaTaskStage(task);

  assert.equal(stage, 'waiting_confirmation');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/taskRunLayout.test.ts`
Expected: FAIL because there is no shared stage derivation in the layout tests.

- [ ] **Step 3: Write minimal implementation**

```tsx
const deliveryView = isUgcTask ? buildMediaDeliveryView(task) : null;
const mediaStage = deliveryView?.stage;
```

```ts
if (mediaStage === 'waiting_confirmation') return '等待你确认后继续';
if (mediaStage === 'rendering_video') return '正在生成正式样片';
if (mediaStage === 'packaging_delivery') return '视频已生成，正在整理交付';
if (mediaStage === 'completed') return '正式样片与交付已完成';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/taskRunLayout.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/app/tasks/TaskRunLayout.tsx src/components/app/tasks/TaskStageRail.tsx src/components/app/tasks/TaskStatusBadge.tsx tests/ui/taskRunLayout.test.ts
git commit -m "feat: unify media task stage copy across detail layout"
```

### Task 5: Make the Results page describe real video outcomes

**Files:**
- Modify: `src/lib/resultsCenter.ts`
- Modify: `src/pages/app/ResultsPage.tsx`
- Test: `tests/ui/resultsPageModel.test.ts`

**Interfaces:**
- Consumes: `buildMediaDeliveryView(task)`
- Produces: result entries with result-first summaries for media tasks

- [ ] **Step 1: Write the failing test**

```ts
test('buildResultEntries summarizes media completion as primary video plus attachments', () => {
  const entries = buildResultEntries([buildCompletedMediaTaskFixture()], { canEditSkill: true });
  assert.equal(entries[0]?.artifactSummary, '1 条样片视频 + 3 个交付附件');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ui/resultsPageModel.test.ts`
Expected: FAIL because the current summary is generic.

- [ ] **Step 3: Write minimal implementation**

```ts
if (task.agentType === 'media') {
  const deliveryView = buildMediaDeliveryView(task);
  return {
    ...base,
    artifactSummary: deliveryView.artifactSummary,
    artifactLabels: [
      deliveryView.primaryArtifact?.label ?? '样片视频',
      ...deliveryView.supportingArtifacts.map((artifact) => artifact.label),
    ].filter(Boolean),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/ui/resultsPageModel.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/resultsCenter.ts src/pages/app/ResultsPage.tsx tests/ui/resultsPageModel.test.ts
git commit -m "feat: make results center summarize media outcomes"
```

### Task 6: Regenerate and publish a stable `media-seeding` showcase asset

**Files:**
- Modify: `scripts/run_media_seeding_case.ts`
- Modify: `src/server/skillStudioService.ts`
- Modify: `src/server/bootstrap/demoSeedData.ts`
- Replace: `public/media/showcase/media-seeding-sample.webm`
- Replace: `public/media/showcase/media-seeding-cover.png`

**Interfaces:**
- Consumes: `chooseHermesVideoModel(...)`, generated delivery bundle under `public/media/<task-id>/`
- Produces: stable showcase asset paths reused by published market pages

- [ ] **Step 1: Adjust the sample generation script to use the stable model path**

```ts
input: {
  skillId: 'media-seeding',
  sellingPoint: '轻薄防晒，通勤一整天也不闷，补喷也不花妆。',
  platform: '抖音',
  effectGoal: '更像真人种草',
}
```

- [ ] **Step 2: Run the sample generation script**

Run: `npx tsx scripts/run_media_seeding_case.ts`
Expected: task reaches a bundle with one primary video artifact and supporting files.

- [ ] **Step 3: Replace showcase assets**

```bash
cp public/media/<task-id>/<primary-video-file> public/media/showcase/media-seeding-sample.webm
cp public/media/<task-id>/cover-frame.png public/media/showcase/media-seeding-cover.png
```

- [ ] **Step 4: Verify the published showcase metadata still points to the replaced assets**

Run: `npx tsx --test tests/server/skillStudioService.test.ts tests/server/publishedMarketService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/run_media_seeding_case.ts src/server/skillStudioService.ts src/server/bootstrap/demoSeedData.ts public/media/showcase/media-seeding-sample.webm public/media/showcase/media-seeding-cover.png
git commit -m "feat: refresh media-seeding showcase with stable generated video"
```

## Self-Review

- Spec coverage: Task 1 covers real completion gate; Tasks 2-4 cover unified stage/result presentation; Task 5 covers results-center summary; Task 6 covers regenerated showcase asset.
- Placeholder scan: no `TODO` / `TBD` / “similar to above” placeholders remain.
- Type consistency: all UI tasks consume `buildMediaDeliveryView(task)` and `deriveMediaTaskStage(task)` from Task 2; server-side primary video resolution is defined in Task 1 and reused downstream.
