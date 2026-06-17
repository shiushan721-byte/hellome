import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';
import { SIGNUP_BONUS_TOKENS } from '../types/workbench';

const USAGE_KEY = 'hellome_usage';
const LEDGER_KEY = 'hellome_usage_ledger';

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

export function getUsage(): UsageSnapshot {
  const raw = localStorage.getItem(USAGE_KEY);
  if (!raw) return { ...DEFAULT_USAGE };
  try {
    return normalizeUsage(JSON.parse(raw) as Partial<UsageSnapshot> & Record<string, unknown>);
  } catch {
    return { ...DEFAULT_USAGE };
  }
}

export function saveUsage(usage: UsageSnapshot): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
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
  const usage = getUsage();
  usage.tokenBalance = Math.max(0, usage.tokenBalance - params.tokenUsed);
  usage.monthlyTokenUsed += params.tokenUsed;
  saveUsage(usage);
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
