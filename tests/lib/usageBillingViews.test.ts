import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateDailyBills,
  aggregateProductBills,
  filterLedgerEntries,
  getDefaultBillingRange,
} from '../../src/lib/usageBillingViews';
import type { UsageLedgerEntry } from '../../src/types/workbench';

test('aggregateDailyBills groups usage by date', () => {
  const ledger: UsageLedgerEntry[] = [
    {
      id: '1',
      time: '2026-06-22T10:00:00.000Z',
      taskId: 't1',
      taskName: 'GEO',
      agent: 'geo',
      estimatedTokenMin: 1000,
      estimatedTokenMax: 2000,
      tokenUsed: 1500,
      status: 'settled',
    },
    {
      id: '2',
      time: '2026-06-22T12:00:00.000Z',
      taskId: 't2',
      taskName: 'UGC',
      agent: 'media-seeding',
      estimatedTokenMin: 500,
      estimatedTokenMax: 1000,
      tokenUsed: 800,
      status: 'settled',
    },
  ];

  const rows = aggregateDailyBills(ledger);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].consumptionTokens, 2300);
  assert.equal(rows[0].estimatedMaxTokens, 3000);
});

test('aggregateProductBills groups by agent and ignores topups', () => {
  const ledger: UsageLedgerEntry[] = [
    {
      id: '1',
      time: '2026-06-22T10:00:00.000Z',
      taskId: '',
      taskName: '充值',
      agent: 'billing',
      estimatedTokenMin: 0,
      estimatedTokenMax: 0,
      tokenUsed: 5000,
      status: 'settled',
      kind: 'topup',
    },
    {
      id: '2',
      time: '2026-06-22T11:00:00.000Z',
      taskId: 't1',
      taskName: 'GEO',
      agent: 'geo',
      estimatedTokenMin: 1000,
      estimatedTokenMax: 2000,
      tokenUsed: 1200,
      status: 'settled',
    },
  ];

  const rows = aggregateProductBills(ledger);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].agent, 'geo');
  assert.equal(rows[0].consumptionTokens, 1200);
});

test('filterLedgerEntries respects date range', () => {
  const range = getDefaultBillingRange();
  const ledger: UsageLedgerEntry[] = [
    {
      id: '1',
      time: `${range.to}T10:00:00.000Z`,
      taskId: 't1',
      taskName: 'GEO',
      agent: 'geo',
      estimatedTokenMin: 0,
      estimatedTokenMax: 0,
      tokenUsed: 100,
      status: 'settled',
    },
    {
      id: '2',
      time: '2020-01-01T10:00:00.000Z',
      taskId: 't2',
      taskName: '旧记录',
      agent: 'geo',
      estimatedTokenMin: 0,
      estimatedTokenMax: 0,
      tokenUsed: 999,
      status: 'settled',
    },
  ];

  const filtered = filterLedgerEntries(ledger, {
    dateFrom: range.from,
    dateTo: range.to,
    agent: 'all',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '1');
});
