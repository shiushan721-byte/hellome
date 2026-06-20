import test from 'node:test';
import assert from 'node:assert/strict';
import { computeSkillVersionChecksum } from '../../src/server/skillChecksum';
import { normalizeHermesTaskEventEnvelope } from '../../src/server/hermesContract';
import {
  getPublishedSkillRuntimeSnapshot,
  PublishedSkillVersionRequiredError,
  resolvePublishedSkillBinding,
} from '../../src/server/skillStudioService';
import { createExecutionGrant, validateExecutionGrantToken } from '../../src/server/executionGrantService';
import { ingestHermesTaskEvent } from '../../src/server/hermesEventIngestService';
import { createUgcTask } from '../../src/server/ugcTaskService';

process.env.ALLOW_INMEMORY_FALLBACK = 'true';

test('computeSkillVersionChecksum is stable for the same snapshot', () => {
  const version = {
    id: 'media-ugc-v1',
    versionNumber: 1,
    versionLabel: 'v0.1.0',
    status: 'published' as const,
    title: 'Demo Skill',
    summary: 'demo',
    inputConfig: {
      sellingPointLabel: '卖点',
      sellingPointPlaceholder: 'placeholder',
      productImageHint: 'product',
      talentImageHint: 'talent',
      referenceUrlHint: 'reference',
    },
    understandingConfig: {
      prompt: 'prompt',
      confirmationMessage: 'confirm',
    },
    executionConfig: {
      mode: 'backend_silent' as const,
      debugMode: 'local_debug' as const,
      videoProvider: 'provider',
      requireConfirmation: true,
      routingMode: 'auto' as const,
      defaultPlanId: 'ugc_video_factory',
      availablePlans: [],
    },
    businessFrame: {
      goal: { summary: 'goal', scenarios: ['a'] },
      budget: { defaultTier: 'standard' as const, confirmationRequired: true, notes: 'notes' },
      executionPlan: { stages: [{ id: 'goal', label: '目标', kind: 'auto' as const }] },
      result: { promiseLine: 'promise', deliveryLabels: ['9:16'], showcaseHint: 'hint' },
    },
    artifactConfig: [{ label: 'video', fileName: 'sample.mp4' }],
    createdAt: '2026-06-20T00:00:00.000Z',
  };

  const first = computeSkillVersionChecksum(version);
  const second = computeSkillVersionChecksum(version);

  assert.match(first, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first, second);
});

test('resolvePublishedSkillBinding returns published version in fallback mode', async () => {
  const binding = await resolvePublishedSkillBinding('media-ugc');

  assert.equal(binding.skillSlug, 'media-ugc');
  assert.equal(binding.version.status, 'published');
  assert.match(binding.checksum, /^sha256:/);
});

test('getPublishedSkillRuntimeSnapshot includes checksum and execution manifest', async () => {
  const snapshot = await getPublishedSkillRuntimeSnapshot('media-ugc');

  assert.equal(snapshot.slug, 'media-ugc');
  assert.match(snapshot.checksum, /^sha256:/);
  assert.equal(typeof snapshot.executionManifest, 'object');
});

test('createExecutionGrant validates token for task events', async () => {
  const grant = await createExecutionGrant({
    taskId: 'ugc_test_grant',
    skillId: 'media-ugc',
    skillVersionId: 'media-ugc-v1',
  });

  const validated = await validateExecutionGrantToken(grant.token, 'ugc_test_grant');
  assert.equal(validated.grantId, grant.grantId);
});

test('createUgcTask binds published skill version and issues execution grant', async () => {
  const task = await createUgcTask({
    input: {
      skillId: 'media-ugc',
      sellingPoint: '轻薄防晒，通勤一整天也不闷',
      platform: '抖音',
      effectGoal: '更像真人种草',
    },
    userExternalId: 'task-user',
    workspaceName: '个人空间',
  });

  assert.equal(task.status, 'queued');
  assert.match(task.costEstimate ?? '', /UGC Video Factory|Fallback|Talking Head|Product Video/);
});

test('ingestHermesTaskEvent persists structured task_received event', async () => {
  const task = await createUgcTask({
    input: {
      skillId: 'media-ugc',
      sellingPoint: '三秒起泡，敏感肌也能放心用',
      platform: '小红书',
      effectGoal: '更像真人种草',
    },
    userExternalId: 'event-user',
    workspaceName: '个人空间',
  });

  const envelope = normalizeHermesTaskEventEnvelope({
    taskId: task.id,
    executionId: `${task.id}-exec-0`,
    eventId: `${task.id}-hermes-1`,
    eventType: 'task_received',
    createdAt: new Date().toISOString(),
    payload: {
      deviceId: 'device_demo',
      skillId: 'media-ugc',
      checksumMatched: true,
    },
  });

  const result = await ingestHermesTaskEvent({
    taskId: task.id,
    envelope,
  });

  assert.equal(result.eventId, envelope.eventId);
  assert.equal(result.status, 'running');
});

test('normalizeHermesTaskEventEnvelope falls back safely', () => {
  const envelope = normalizeHermesTaskEventEnvelope(null, 'task_123');
  assert.equal(envelope.taskId, 'task_123');
  assert.equal(envelope.eventType, 'task_failed');
});

test('PublishedSkillVersionRequiredError carries skill id in message', () => {
  const error = new PublishedSkillVersionRequiredError('demo-skill');
  assert.match(error.message, /demo-skill/);
  assert.equal(error.skillId, 'demo-skill');
});
