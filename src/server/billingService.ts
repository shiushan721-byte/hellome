import { getPrismaClient } from './db/prisma';
import type { UsageLedgerEntry, UsageSnapshot } from '../types/workbench';

const DEFAULT_PLAN_NAME = process.env.DEMO_PLAN_NAME?.trim() || '体验版';
const DEFAULT_MONTHLY_LIMIT = Number(process.env.DEMO_MONTHLY_TOKEN_LIMIT ?? 20_000);
const DEFAULT_LOW_BALANCE_THRESHOLD = Number(process.env.DEMO_LOW_BALANCE_THRESHOLD ?? 0.1);

function nextMonthResetAt(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function defaultUsage(): UsageSnapshot {
  return {
    planName: DEFAULT_PLAN_NAME,
    tokenBalance: DEFAULT_MONTHLY_LIMIT,
    monthlyTokenLimit: DEFAULT_MONTHLY_LIMIT,
    monthlyTokenUsed: 0,
    resetAt: nextMonthResetAt(),
    lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
  };
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
  return {
    planName: DEFAULT_PLAN_NAME,
    monthlyTokenLimit: DEFAULT_MONTHLY_LIMIT,
    monthlyTokenUsed: monthlyUsed,
    tokenBalance: Math.max(0, DEFAULT_MONTHLY_LIMIT - monthlyUsed),
    resetAt: end.toISOString(),
    lowBalanceThreshold: DEFAULT_LOW_BALANCE_THRESHOLD,
  };
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

  return rows.map((row) => ({
    id: row.id,
    time: row.createdAt.toISOString(),
    taskId: row.task?.id ?? '',
    taskName: row.task?.name ?? '系统结算',
    agent: row.task?.agentType ?? 'system',
    estimatedTokenMin: row.task?.estimatedTokenMin ?? 0,
    estimatedTokenMax: row.task?.estimatedTokenMax ?? 0,
    tokenUsed: row.tokenUsed,
    status: row.status,
  }));
}
