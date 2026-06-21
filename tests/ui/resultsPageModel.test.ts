import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResultEntries } from '../../src/lib/resultsCenter';
import type { Task } from '../../src/types/workbench';

test('buildResultEntries returns delivery cards with editable skill link for completed media tasks', () => {
  const entries = buildResultEntries(
    [
      {
        id: 'ugc_1',
        name: '真人种草视频 · 抖音',
        agentType: 'media',
        status: 'completed',
        createdAt: '2026-06-20T10:00:00.000Z',
        completedAt: '2026-06-20T10:10:00.000Z',
        estimatedTokenMin: 12000,
        estimatedTokenMax: 28000,
        tokenUsed: 22600,
        steps: [],
        logs: [],
        input: {
          skillId: 'media-seeding',
          sellingPoint: '一喷速干不粘杯',
          platform: '抖音',
          effectGoal: '更像真人种草',
        },
        artifacts: [
          { id: 'video', type: 'video', label: '样片视频', fileName: 'sample-video.mp4' },
          { id: 'cover', type: 'image', label: '封面首帧', fileName: 'cover-frame.png' },
        ],
      } satisfies Task,
    ],
    { canEditSkill: true },
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0].title, '真人种草视频 · 抖音');
  assert.equal(entries[0].artifactCount, 2);
  assert.equal(entries[0].artifactSummary, '1 条样片视频 + 1 个交付附件');
  assert.equal(entries[0].openTaskHref, '/app/tasks/ugc_1');
  assert.equal(entries[0].editSkillHref, '/app/studio/skills/media-seeding');
});

test('buildResultEntries filters out unfinished tasks and sorts latest completed first', () => {
  const entries = buildResultEntries(
    [
      {
        id: 'running_1',
        name: '运行中任务',
        agentType: 'media',
        status: 'running',
        createdAt: '2026-06-20T09:00:00.000Z',
        estimatedTokenMin: 1,
        estimatedTokenMax: 2,
        tokenUsed: 0,
        steps: [],
        logs: [],
      } satisfies Task,
      {
        id: 'geo_2',
        name: 'GEO 报告任务',
        agentType: 'geo',
        status: 'completed',
        createdAt: '2026-06-20T08:00:00.000Z',
        completedAt: '2026-06-20T08:30:00.000Z',
        estimatedTokenMin: 5000,
        estimatedTokenMax: 10000,
        tokenUsed: 6200,
        steps: [],
        logs: [],
      } satisfies Task,
      {
        id: 'ugc_3',
        name: '较新的视频任务',
        agentType: 'media',
        status: 'completed',
        createdAt: '2026-06-20T11:00:00.000Z',
        completedAt: '2026-06-20T11:05:00.000Z',
        estimatedTokenMin: 12000,
        estimatedTokenMax: 28000,
        tokenUsed: 18000,
        steps: [],
        logs: [],
      } satisfies Task,
    ],
    { canEditSkill: false },
  );

  assert.deepEqual(
    entries.map((entry) => entry.id),
    ['ugc_3', 'geo_2'],
  );
  assert.equal(entries[1].artifactSummary, '1 项报告成果');
});
