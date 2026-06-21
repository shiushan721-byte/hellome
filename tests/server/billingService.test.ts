import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBillingLedgerEntry,
  buildUsageSummary,
  normalizeBillingTopupInput,
} from '../../src/server/billingService';

test('buildUsageSummary includes topups in token balance', () => {
  const summary = buildUsageSummary({
    planName: '体验版',
    monthlyTokenLimit: 20_000,
    monthlyUsed: 6_000,
    topupTotal: 12_000,
    lowBalanceThreshold: 0.1,
    resetAt: '2026-07-01T00:00:00.000Z',
  });

  assert.equal(summary.monthlyTokenUsed, 6_000);
  assert.equal(summary.tokenBalance, 26_000);
  assert.equal(summary.monthlyTokenLimit, 20_000);
});

test('normalizeBillingTopupInput trims note and rejects non-positive token amounts', () => {
  assert.throws(
    () => normalizeBillingTopupInput({ tokenAmount: 0, note: '  demo  ' }),
    /Token 数量必须大于 0/,
  );

  const normalized = normalizeBillingTopupInput({
    tokenAmount: '12000',
    note: '  补充测试额度  ',
  });

  assert.equal(normalized.tokenAmount, 12_000);
  assert.equal(normalized.note, '补充测试额度');
});

test('buildBillingLedgerEntry maps topup rows into usage ledger shape', () => {
  const entry = buildBillingLedgerEntry({
    id: 'topup_1',
    createdAt: new Date('2026-06-21T09:30:00.000Z'),
    tokenAmount: 50_000,
    note: '新手包',
  });

  assert.equal(entry.kind, 'topup');
  assert.equal(entry.taskName, '算力充值');
  assert.equal(entry.agent, 'billing');
  assert.equal(entry.tokenUsed, 50_000);
  assert.equal(entry.status, 'settled');
});
