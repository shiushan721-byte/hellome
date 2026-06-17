import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';
import { SIGNUP_BONUS_TOKENS } from '../types/workbench';
import { getPlanEntitlements } from './planEntitlements';

const USAGE_KEY = 'hellome_usage';
const LEDGER_KEY = 'hellome_usage_ledger';

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyUsage(): void {
  usageSnapshotRaw = '__stale__';
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
  planName: '专业版',
  tokenBalance: 183_240,
  monthlyTokenLimit: 500_000,
  monthlyTokenUsed: 316_760,
  resetAt: nextMonthResetAt(),
  lowBalanceThreshold: 0.1,
};

let usageSnapshot: UsageSnapshot = DEFAULT_USAGE;
let usageSnapshotRaw: string | null = '__init__';

function normalizeUsage(parsed: Partial<UsageSnapshot> & Record<string, unknown>): UsageSnapshot {
  if (parsed.monthlyTokenLimit != null) {
    return {
      planName: String(parsed.planName ?? DEFAULT_USAGE.planName),
      tokenBalance: Number(parsed.tokenBalance ?? DEFAULT_USAGE.tokenBalance),
      monthlyTokenLimit: Number(parsed.monthlyTokenLimit ?? DEFAULT_USAGE.monthlyTokenLimit),
      monthlyTokenUsed: Number(parsed.monthlyTokenUsed ?? 0),
      resetAt: String(parsed.resetAt ?? nextMonthResetAt()),
      lowBalanceThreshold: Number(parsed.lowBalanceThreshold ?? 0.1),
    };
  }

  // Migrate legacy count-based / yuan balance storage
  return { ...DEFAULT_USAGE };
}

function readUsageFromStorage(): UsageSnapshot {
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

export function getUsage(): UsageSnapshot {
  return readUsageFromStorage();
}

export function saveUsage(usage: UsageSnapshot): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  usageSnapshot = usage;
  usageSnapshotRaw = localStorage.getItem(USAGE_KEY);
  notifyUsage();
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
    saveUsage({
      planName: '体验版',
      tokenBalance: SIGNUP_BONUS_TOKENS,
      monthlyTokenLimit: SIGNUP_BONUS_TOKENS,
      monthlyTokenUsed: 0,
      resetAt: nextMonthResetAt(),
      lowBalanceThreshold: 0.1,
    });
  }
}

export function isLowBalance(usage = getUsage()): boolean {
  const threshold = usage.monthlyTokenLimit * usage.lowBalanceThreshold;
  return usage.tokenBalance < threshold;
}

export function canAffordTask(estimatedMax: number, usage = getUsage()): boolean {
  return usage.tokenBalance >= estimatedMax;
}

export function getLedger(): UsageLedgerEntry[] {
  const raw = localStorage.getItem(LEDGER_KEY);
  if (!raw) return [];
  try {
    const entries = JSON.parse(raw) as UsageLedgerEntry[];
    return entries.map((e) => ({
      ...e,
      taskId: e.taskId ?? '',
      estimatedTokenMin: Number(e.estimatedTokenMin ?? 0),
      estimatedTokenMax: Number(e.estimatedTokenMax ?? 0),
      tokenUsed: Number(e.tokenUsed ?? 0),
      status: e.status ?? 'settled',
    }));
  } catch {
    return [];
  }
}

export function addLedgerEntry(entry: Omit<UsageLedgerEntry, 'id'>): void {
  const ledger = getLedger();
  ledger.unshift({ ...entry, id: `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger.slice(0, 100)));
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
