import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveTaskRunState } from '../../src/server/taskStateMachine';

test('deriveTaskRunState maps confirmation pause to waiting_confirmation', () => {
  const result = deriveTaskRunState({
    currentStatus: 'running',
    hermes: {
      runState: 'waiting_confirmation',
      pauseReasonType: 'confirmation',
      recoverable: true,
      resumeMode: 'continue',
    },
  });

  assert.equal(result.status, 'waiting_confirmation');
  assert.equal(result.pendingConfirmation?.action, '确认继续');
});
