import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMediaDeliveryView, deriveMediaTaskStage, resolvePrimaryVideoArtifact } from '../../src/lib/mediaTaskPresentation';
import type { Task } from '../../src/types/workbench';

function buildMediaTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'ugc_test',
    name: '新品种草视频',
    agentType: 'media',
    status: 'completed',
    createdAt: '2026-06-21T10:00:00.000Z',
    completedAt: '2026-06-21T10:10:00.000Z',
    estimatedTokenMin: 1000,
    estimatedTokenMax: 2000,
    tokenUsed: 1500,
    steps: [],
    logs: [],
    artifacts: [],
    ...overrides,
  };
}

test('resolvePrimaryVideoArtifact picks the playable video and ignores audio/image artifacts', () => {
  const primary = resolvePrimaryVideoArtifact([
    { id: 'a1', type: 'audio', label: 'AI 配音', fileName: 'audio-mock.wav', mimeType: 'audio/wav', url: '/media/audio.wav' },
    { id: 'a2', type: 'image', label: '封面', fileName: 'cover.png', mimeType: 'image/png', url: '/media/cover.png' },
    { id: 'a3', type: 'video', label: '样片视频', fileName: 'sample-video.webm', mimeType: 'video/webm', url: '/media/sample-video.webm' },
  ]);

  assert.equal(primary?.fileName, 'sample-video.webm');
});

test('buildMediaDeliveryView places the video first and marks fallback audio as supporting', () => {
  const task = buildMediaTask({
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
  assert.equal(view.artifactSummary, '1 条样片视频 + 2 个交付附件');
});

test('deriveMediaTaskStage returns waiting_confirmation for confirmation tasks', () => {
  const stage = deriveMediaTaskStage(
    buildMediaTask({
      status: 'waiting_confirmation',
    }),
  );

  assert.equal(stage, 'waiting_confirmation');
});
