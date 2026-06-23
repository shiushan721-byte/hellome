import type { UsageLedgerEntry } from '../types/workbench';

const AGENT_LABELS: Record<string, string> = {
  billing: '算力充值',
  geo: 'GEO 智能体',
  media: '内容创作',
  sales: '销售获客',
  system: '系统',
};

export function agentLabel(agentId: string): string {
  return AGENT_LABELS[agentId] ?? agentId;
}

export type DailyTokenBillRow = {
  date: string;
  consumptionTokens: number;
  estimatedMaxTokens: number;
  settlementPercent: number | null;
};

export type ProductTokenBillRow = {
  agent: string;
  agentLabel: string;
  consumptionTokens: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function formatBillingDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDefaultBillingRange(): { from: string; to: string } {
  const now = new Date();
  const to = formatBillingDate(now);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  return { from: formatBillingDate(fromDate), to };
}

function isUsageEntry(entry: UsageLedgerEntry) {
  return entry.kind !== 'topup' && entry.status !== 'refunded';
}

function inDateRange(iso: string, from: string, to: string) {
  const day = formatBillingDate(new Date(iso));
  return day >= from && day <= to;
}

export function filterLedgerEntries(
  ledger: UsageLedgerEntry[],
  input: { dateFrom: string; dateTo: string; agent: string },
) {
  return ledger.filter((entry) => {
    if (!inDateRange(entry.time, input.dateFrom, input.dateTo)) return false;
    if (input.agent !== 'all' && entry.agent !== input.agent) return false;
    return true;
  });
}

export function aggregateDailyBills(entries: UsageLedgerEntry[]): DailyTokenBillRow[] {
  const map = new Map<string, { consumption: number; estimatedMax: number }>();

  for (const entry of entries) {
    if (!isUsageEntry(entry)) continue;
    const date = formatBillingDate(new Date(entry.time));
    const prev = map.get(date) ?? { consumption: 0, estimatedMax: 0 };
    map.set(date, {
      consumption: prev.consumption + entry.tokenUsed,
      estimatedMax: prev.estimatedMax + entry.estimatedTokenMax,
    });
  }

  return [...map.entries()]
    .map(([date, stats]) => ({
      date,
      consumptionTokens: stats.consumption,
      estimatedMaxTokens: stats.estimatedMax,
      settlementPercent:
        stats.estimatedMax > 0
          ? Number(((stats.consumption / stats.estimatedMax) * 100).toFixed(2))
          : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function aggregateProductBills(entries: UsageLedgerEntry[]): ProductTokenBillRow[] {
  const map = new Map<string, number>();

  for (const entry of entries) {
    if (!isUsageEntry(entry)) continue;
    map.set(entry.agent, (map.get(entry.agent) ?? 0) + entry.tokenUsed);
  }

  return [...map.entries()]
    .map(([agent, consumptionTokens]) => ({
      agent,
      agentLabel: agentLabel(agent),
      consumptionTokens,
    }))
    .sort((a, b) => b.consumptionTokens - a.consumptionTokens);
}

export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

export function fmtPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${Number.isInteger(v) ? v : v.toFixed(2)}%`;
}

export function listAgentFilterOptions(ledger: UsageLedgerEntry[]) {
  const agents = [...new Set(ledger.map((entry) => entry.agent).filter(Boolean))].sort();
  return [
    { label: '全部智能体', value: 'all' },
    ...agents.map((agent) => ({ label: agentLabel(agent), value: agent })),
  ];
}
