import test from 'node:test';
import assert from 'node:assert/strict';
import { presentUgcTask } from '../../src/server/taskPresenter';

test('presentUgcTask exposes interrupted recovery state to frontend', () => {
  const task = presentUgcTask({
    id: 'task_1',
    name: '视频智能体任务',
    agentType: 'media',
    status: 'failed',
    estimatedTokenMin: 2000,
    estimatedTokenMax: 8000,
    tokenUsed: 1200,
    createdAt: new Date().toISOString(),
    steps: [],
    logs: [],
    recoveryState: {
      runState: 'interrupted',
      pauseReasonType: 'context_limit',
      pauseReasonMessage: '本轮上下文已满，需要开启新一轮续跑',
      resumeMode: 'continue',
      recoverable: true,
      artifactsPreserved: ['script.md'],
      willChargeAgain: false,
    },
  });

  assert.equal(task.recoveryState?.runState, 'interrupted');
  assert.equal(task.recoveryState?.resumeMode, 'continue');
});
