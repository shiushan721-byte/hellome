import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHermesRunPayload } from '../../src/server/hermesContract';

test('normalizeHermesRunPayload returns fallback interrupted payload for malformed input', () => {
  const result = normalizeHermesRunPayload(null);

  assert.equal(result.runState, 'interrupted');
  assert.equal(result.pauseReasonType, 'provider_error');
  assert.equal(result.recoverable, true);
  assert.equal(result.resumeMode, 'retry_step');
});
