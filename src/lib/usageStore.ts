import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';
import { SIGNUP_BONUS_TOKENS } from '../types/workbench';
import { getPlanEntitlements } from './planEntitlements';

const USAGE_KEY = 'hellome_usage';
const LEDGER_KEY = 'hellome_usage_ledger';

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyUsage(): void {
  usageSnapshotRaw = '__stale__';
  ledgerSnapshotRaw = '__stale__';
  listeners.forEach((fn) => fn());
}

export function subscribeUsage(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextMonthResetAt(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const DEFAULT_USAGE: UsageSnapshot = {
  planName: '体验版',
  tokenBalance: SIGNUP_BONUS_TOKENS,
  monthlyTokenLimit: SIGNUP_BONUS_TOKENS,
  monthlyTokenUsed: 0,
  resetAt: nextMonthResetAt(),
  lowBalanceThreshold: 0.1,
};

let usageSnapshot: UsageSnapshot = DEFAULT_USAGE;
let usageSnapshotRaw: string | null = '__init__';
let ledgerSnapshot: UsageLedgerEntry[] = [];
let ledgerSnapshotRaw: string | null = '__init__';

function normalizeUsage(parsed: Partial<UsageSnapshot> & Record<string, unknown>): UsageSnapshot {
  return {
    planName: String(parsed.planName ?? DEFAULT_USAGE.planName),
    tokenBalance: Number(parsed.tokenBalance ?? DEFAULT_USAGE.tokenBalance),
    monthlyTokenLimit: Number(parsed.monthlyTokenLimit ?? DEFAULT_USAGE.monthlyTokenLimit),
    monthlyTokenUsed: Number(parsed.monthlyTokenUsed ?? 0),
    resetAt: String(parsed.resetAt ?? nextMonthResetAt()),
    lowBalanceThreshold: Number(parsed.lowBalanceThreshold ?? 0.1),
  };
}

function readUsageFromCache(): UsageSnapshot {
  const raw = localStorage.getItem(USAGE_KEY);
  if (raw === usageSnapshotRaw) return usageSnapshot;

  usageSnapshotRaw = raw;
  if (!raw) {
    usageSnapshot = DEFAULT_USAGE;
    return usageSnapshot;
  }

  try {
    usageSnapshot = normalizeUsage(
      JSON.parse(raw) as Partial<UsageSnapshot> & Record<string, unknown>,
    );
  } catch {
    usageSnapshot = DEFAULT_USAGE;
  }
  return usageSnapshot;
}

function readLedgerFromCache(): UsageLedgerEntry[] {
  const raw = localStorage.getItem(LEDGER_KEY);
  if (raw === ledgerSnapshotRaw) return ledgerSnapshot;

  ledgerSnapshotRaw = raw;
  if (!raw) {
    ledgerSnapshot = [];
    return ledgerSnapshot;
  }

  try {
    const entries = JSON.parse(raw) as UsageLedgerEntry[];
    ledgerSnapshot = entries.map((e) => ({
      ...e,
      taskId: e.taskId ?? '',
      estimatedTokenMin: Number(e.estimatedTokenMin ?? 0),
      estimatedTokenMax: Number(e.estimatedTokenMax ?? 0),
      tokenUsed: Number(e.tokenUsed ?? 0),
      status: e.status ?? 'settled',
    }));
  } catch {
    ledgerSnapshot = [];
  }
  return ledgerSnapshot;
}

function persistUsageCache(usage: UsageSnapshot): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  usageSnapshot = usage;
  usageSnapshotRaw = localStorage.getItem(USAGE_KEY);
}

function persistLedgerCache(entries: UsageLedgerEntry[]): void {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(entries));
  ledgerSnapshot = entries;
  ledgerSnapshotRaw = localStorage.getItem(LEDGER_KEY);
}

export function getUsage(): UsageSnapshot {
  return readUsageFromCache();
}

export function saveUsage(usage: UsageSnapshot): void {
  persistUsageCache(usage);
  notifyUsage();
}

export function getLedger(): UsageLedgerEntry[] {
  return readLedgerFromCache();
}

export async function syncUsageFromServer(): Promise<UsageSnapshot> {
  const response = await fetch('/api/billing/usage', {
    credentials: 'include',
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: UsageSnapshot;
    error?: string;
  };

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || '读取算力余额失败');
  }

  const normalized = normalizeUsage(json.data as Partial<UsageSnapshot> & Record<string, unknown>);
  persistUsageCache(normalized);
  notifyUsage();
  return normalized;
}

export async function syncUsageLedgerFromServer(): Promise<UsageLedgerEntry[]> {
  const response = await fetch('/api/billing/ledger', {
    credentials: 'include',
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: UsageLedgerEntry[];
    error?: string;
  };

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || '读取算力账本失败');
  }

  const normalized = json.data.map((entry) => ({
    ...entry,
    taskId: entry.taskId ?? '',
    estimatedTokenMin: Number(entry.estimatedTokenMin ?? 0),
    estimatedTokenMax: Number(entry.estimatedTokenMax ?? 0),
    tokenUsed: Number(entry.tokenUsed ?? 0),
    status: entry.status ?? 'settled',
  }));
  persistLedgerCache(normalized);
  notifyUsage();
  return normalized;
}

export async function syncUsageState(): Promise<void> {
  try {
    await Promise.all([syncUsageFromServer(), syncUsageLedgerFromServer()]);
  } catch {
    // keep local cache as resilience fallback in demo phase
  }
}

/** 调试：切换套餐身份并同步 Token 额度 */
export function applyDebugPlan(planName: string): void {
  const ent = getPlanEntitlements(planName);
  const usage = getUsage();
  saveUsage({
    ...usage,
    planName: ent.planName,
    monthlyTokenLimit: ent.monthlyTokenLimit,
    tokenBalance: ent.monthlyTokenLimit,
    monthlyTokenUsed: 0,
  });
}

export function initUsageForNewUser(): void {
  if (!localStorage.getItem(USAGE_KEY)) {
    persistUsageCache(DEFAULT_USAGE);
  }
}

export function isLowBalance(usage = getUsage()): boolean {
  const threshold = usage.monthlyTokenLimit * usage.lowBalanceThreshold;
  return usage.tokenBalance < threshold;
}

export function getComputeStats(usage = getUsage()) {
  const ledger = getLedger();
  const ledgerUsed = ledger.reduce(
    (sum, entry) => sum + (entry.status === 'refunded' ? 0 : entry.tokenUsed),
    0,
  );
  const lifetimeUsedTokens = Math.max(ledgerUsed, usage.monthlyTokenUsed);
  const lifetimePurchasedTokens = usage.tokenBalance + lifetimeUsedTokens;

  return {
    lifetimeUsedTokens,
    lifetimePurchasedTokens,
    monthlyUsed: usage.monthlyTokenUsed,
  };
}

export function canAffordTask(estimatedMax: number, usage = getUsage()): boolean {
  return usage.tokenBalance >= estimatedMax;
}

export function addLedgerEntry(entry: Omit<UsageLedgerEntry, 'id'>): void {
  const ledger = getLedger();
  const next = [
    { ...entry, id: `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
    ...ledger,
  ].slice(0, 100);
  persistLedgerCache(next);
  notifyUsage();
}

export function settleTaskTokens(params: {
  taskId: string;
  taskName: string;
  agent: string;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  tokenUsed: number;
  status?: UsageLedgerEntry['status'];
}): void {
  const prev = getUsage();
  saveUsage({
    ...prev,
    tokenBalance: Math.max(0, prev.tokenBalance - params.tokenUsed),
    monthlyTokenUsed: prev.monthlyTokenUsed + params.tokenUsed,
  });
  addLedgerEntry({
    time: new Date().toISOString(),
    taskId: params.taskId,
    taskName: params.taskName,
    agent: params.agent,
    estimatedTokenMin: params.estimatedTokenMin,
    estimatedTokenMax: params.estimatedTokenMax,
    tokenUsed: params.tokenUsed,
    status: params.status ?? 'settled',
  });
}
