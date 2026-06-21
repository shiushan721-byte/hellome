import { getPrismaClient } from './db/prisma';
import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';

const DEFAULT_PLAN_NAME = process.env.DEMO_PLAN_NAME?.trim() || '体验版';
const DEFAULT_MONTHLY_LIMIT = Number(process.env.DEMO_MONTHLY_TOKEN_LIMIT ?? 20_000);
const DEFAULT_LOW_BALANCE_THRESHOLD = Number(process.env.DEMO_LOW_BALANCE_THRESHOLD ?? 0.1);

export interface BillingTopupInput {
  tokenAmount: number;
  note?: string;
}

export function normalizeBillingTopupInput(input: {
  tokenAmount?: number | string | null;
  note?: string | null;
}): BillingTopupInput {
  const tokenAmount = Number(input.tokenAmount ?? 0);
  if (!Number.isFinite(tokenAmount) || tokenAmount <= 0) {
    throw new Error('Token 数量必须大于 0');
  }

  return {
    tokenAmount: Math.round(tokenAmount),
    note: input.note?.trim() || undefined,
  };
}

function nextMonthResetAt(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function buildUsageSummary(input: {
  planName?: string;
  monthlyTokenLimit: number;
  monthlyUsed: number;
  topupTotal?: number;
  lowBalanceThreshold?: number;
  resetAt?: string;
}): UsageSnapshot {
  return {
    planName: input.planName ?? DEFAULT_PLAN_NAME,
    tokenBalance: Math.max(0, input.monthlyTokenLimit + (input.topupTotal ?? 0) - input.monthlyUsed),
    monthlyTokenLimit: input.monthlyTokenLimit,
    monthlyTokenUsed: input.monthlyUsed,
    resetAt: input.resetAt ?? nextMonthResetAt(),
    lowBalanceThreshold: input.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE_THRESHOLD,
  };
}

function defaultUsage(): UsageSnapshot {
  return buildUsageSummary({
    monthlyTokenLimit: DEFAULT_MONTHLY_LIMIT,
    monthlyUsed: 0,
  });
}

export function buildBillingLedgerEntry(row: {
  id: string;
  createdAt: Date;
  tokenAmount: number;
  note?: string | null;
}): UsageLedgerEntry {
  return {
    id: row.id,
    time: row.createdAt.toISOString(),
    taskId: '',
    taskName: '算力充值',
    agent: 'billing',
    estimatedTokenMin: 0,
    estimatedTokenMax: 0,
    tokenUsed: row.tokenAmount,
    status: 'settled',
    kind: 'topup',
    note: row.note ?? undefined,
  };
}

async function findOrCreateUserIdByExternalId(externalId: string): Promise<string | null> {
  const prisma = getPrismaClient();
  if (!prisma || !externalId.trim()) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { externalId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: {
      externalId,
      phone: externalId,
    },
    select: { id: true },
  });
  return created.id;
}

export async function getUsageSummaryForExternalId(externalId: string): Promise<UsageSnapshot> {
  const prisma = getPrismaClient();
  if (!prisma || !externalId.trim()) {
    return defaultUsage();
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const user = await prisma.user.findUnique({
    where: { externalId },
    select: { id: true },
  });

  if (!user) {
    return defaultUsage();
  }

  const aggregate = await prisma.usageLedger.aggregate({
    where: {
      userId: user.id,
      createdAt: {
        gte: start,
        lt: end,
      },
      status: {
        in: ['reserved', 'settled'],
      },
    },
    _sum: {
      tokenUsed: true,
    },
  });

  const monthlyUsed = aggregate._sum.tokenUsed ?? 0;
  const topupAggregate = await prisma.billingTopup.aggregate({
    where: { userId: user.id },
    _sum: {
      tokenAmount: true,
    },
  });
  const topupTotal = topupAggregate._sum.tokenAmount ?? 0;

  return buildUsageSummary({
    planName: DEFAULT_PLAN_NAME,
    monthlyTokenLimit: DEFAULT_MONTHLY_LIMIT,
    monthlyUsed,
    topupTotal,
    lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
    resetAt: end.toISOString(),
  });
}

export async function getUsageLedgerForExternalId(externalId: string): Promise<UsageLedgerEntry[]> {
  const prisma = getPrismaClient();
  if (!prisma || !externalId.trim()) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { externalId },
    select: { id: true },
  });

  if (!user) {
    return [];
  }

  const rows = await prisma.usageLedger.findMany({
    where: { userId: user.id },
    include: {
      task: {
        select: {
          id: true,
          name: true,
          agentType: true,
          estimatedTokenMin: true,
          estimatedTokenMax: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const topups = await prisma.billingTopup.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const usageEntries = rows.map((row) => ({
    id: row.id,
    time: row.createdAt.toISOString(),
    taskId: row.task?.id ?? '',
    taskName: row.task?.name ?? '系统结算',
    agent: row.task?.agentType ?? 'system',
    estimatedTokenMin: row.task?.estimatedTokenMin ?? 0,
    estimatedTokenMax: row.task?.estimatedTokenMax ?? 0,
    tokenUsed: row.tokenUsed,
    status: row.status,
    kind: 'usage' as const,
  }));
  const topupEntries = topups.map(buildBillingLedgerEntry);

  return [...usageEntries, ...topupEntries]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 100);
}

export async function recordBillingTopupForExternalId(
  externalId: string,
  input: BillingTopupInput,
): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !externalId.trim()) {
    return;
  }

  const userId = await findOrCreateUserIdByExternalId(externalId);
  if (!userId) {
    return;
  }

  await prisma.billingTopup.create({
    data: {
      userId,
      tokenAmount: input.tokenAmount,
      note: input.note,
    },
  });
}
