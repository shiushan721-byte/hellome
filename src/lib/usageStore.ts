import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';

const USAGE_KEY = 'hellome_usage';
const LEDGER_KEY = 'hellome_usage_ledger';

const DEFAULT_USAGE: UsageSnapshot = {
  planName: '体验套餐',
  tokenBalance: 83.2,
  monthlySpend: 16.8,
  geoUsed: 2,
  geoLimit: 20,
  contentUsed: 0,
  contentLimit: 10,
  salesUsed: 0,
  salesLimit: 500,
};

export function getUsage(): UsageSnapshot {
  const raw = localStorage.getItem(USAGE_KEY);
  if (!raw) return { ...DEFAULT_USAGE };
  try {
    const parsed = JSON.parse(raw) as Partial<UsageSnapshot>;
    return {
      planName: parsed.planName ?? DEFAULT_USAGE.planName,
      tokenBalance: Number(parsed.tokenBalance ?? DEFAULT_USAGE.tokenBalance),
      monthlySpend: Number(parsed.monthlySpend ?? DEFAULT_USAGE.monthlySpend),
      geoUsed: Number(parsed.geoUsed ?? DEFAULT_USAGE.geoUsed),
      geoLimit: Number(parsed.geoLimit ?? DEFAULT_USAGE.geoLimit),
      contentUsed: Number(parsed.contentUsed ?? DEFAULT_USAGE.contentUsed),
      contentLimit: Number(parsed.contentLimit ?? DEFAULT_USAGE.contentLimit),
      salesUsed: Number(parsed.salesUsed ?? DEFAULT_USAGE.salesUsed),
      salesLimit: Number(parsed.salesLimit ?? DEFAULT_USAGE.salesLimit),
    };
  } catch {
    return { ...DEFAULT_USAGE };
  }
}

export function saveUsage(usage: UsageSnapshot): void {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

export function getLedger(): UsageLedgerEntry[] {
  const raw = localStorage.getItem(LEDGER_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UsageLedgerEntry[];
  } catch {
    return [];
  }
}

export function addLedgerEntry(entry: Omit<UsageLedgerEntry, 'id'>): void {
  const ledger = getLedger();
  ledger.unshift({ ...entry, id: `ledger-${Date.now()}` });
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger.slice(0, 100)));
}

export function consumeGeo(cost: number, taskName: string, agent = 'GEO 智能体'): boolean {
  const usage = getUsage();
  if (usage.geoUsed + cost > usage.geoLimit) return false;
  usage.geoUsed += cost;
  usage.tokenBalance = Math.max(0, usage.tokenBalance - cost * 2.5);
  usage.monthlySpend += cost * 2.5;
  saveUsage(usage);
  addLedgerEntry({
    time: new Date().toISOString(),
    taskName,
    agent,
    costType: 'GEO 检测次数',
    costAmount: cost,
  });
  return true;
}
