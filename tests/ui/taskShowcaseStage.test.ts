import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskShowcaseViewModel } from '../../src/components/app/tasks/TaskShowcaseStage';

test('buildTaskShowcaseViewModel returns recovery CTA for interrupted task', () => {
  const viewModel = buildTaskShowcaseViewModel({
    status: 'failed',
    recoveryState: {
      runState: 'interrupted',
      pauseReasonMessage: '执行中断，可从上一步恢复',
      resumeMode: 'continue',
      recoverable: true,
    },
  });

  assert.equal(viewModel.primaryActionLabel, '从这里继续');
  assert.equal(viewModel.headline, '任务已中断待恢复');
});
