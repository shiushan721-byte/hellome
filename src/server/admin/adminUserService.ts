import { getPrismaClient } from '../db/prisma';
import { getUsageSummaryForExternalId, recordBillingTopupForExternalId } from '../billingService';
import { listUgcTasks } from '../ugcTaskService';
import { listAuditLogs } from './auditLogService';

const LOW_BALANCE_THRESHOLD = Number(process.env.DEMO_LOW_BALANCE_THRESHOLD ?? 0.1);
const DEFAULT_MONTHLY_LIMIT = Number(process.env.DEMO_MONTHLY_TOKEN_LIMIT ?? 20_000);

export interface ListAdminUsersParams {
  q?: string;
  status?: string;
  hasHermes?: boolean;
  hasGnomic?: boolean;
  hasTopup?: boolean;
  lowBalance?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminUserListItem {
  id: string;
  externalId: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  tokenBalance: number;
  totalTopup: number;
  totalConsumed: number;
  taskCount: number;
  artifactCount: number;
  hermesStatus: 'connected' | 'offline' | 'none';
  gnomicBound: boolean;
}

function formatDevice(row: {
  id: string;
  deviceName: string;
  os: string;
  version: string | null;
  status: string;
  lastSeenAt: Date | null;
  debugEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    deviceName: row.deviceName,
    os: row.os,
    version: row.version,
    status: row.status,
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    debugEnabled: row.debugEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function formatLedger(row: {
  id: string;
  tokenUsed: number;
  status: string;
  createdAt: Date;
  task?: { id: string; name: string; agentType: string } | null;
}) {
  return {
    id: row.id,
    time: row.createdAt.toISOString(),
    taskId: row.task?.id ?? '',
    taskName: row.task?.name ?? '系统结算',
    agent: row.task?.agentType ?? 'system',
    tokenUsed: row.tokenUsed,
    status: row.status,
    kind: 'usage' as const,
  };
}

function demoUsers(): AdminUserListItem[] {
  return [
    {
      id: 'demo-user',
      externalId: '13800138001',
      displayName: 'HelloMe 普通用户',
      phone: '13800138001',
      email: 'user@hellome.ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      tokenBalance: 20000,
      totalTopup: 0,
      totalConsumed: 0,
      taskCount: 0,
      artifactCount: 0,
      hermesStatus: 'none',
      gnomicBound: false,
    },
    {
      id: 'demo-admin',
      externalId: '13800138000',
      displayName: 'HelloMe 演示管理员',
      phone: '13800138000',
      email: 'admin@hellome.ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      tokenBalance: 50000,
      totalTopup: 0,
      totalConsumed: 0,
      taskCount: 0,
      artifactCount: 0,
      hermesStatus: 'none',
      gnomicBound: false,
    },
  ];
}

function matchesQuery(user: AdminUserListItem, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    user.id.toLowerCase().includes(needle) ||
    user.externalId.toLowerCase().includes(needle) ||
    (user.phone ?? '').includes(needle) ||
    user.displayName.toLowerCase().includes(needle)
  );
}

export async function listAdminUsersQuery(params: ListAdminUsersParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const prisma = getPrismaClient();

  if (!prisma) {
    let rows = demoUsers();
    if (params.q?.trim()) rows = rows.filter((u) => matchesQuery(u, params.q!.trim()));
    if (params.lowBalance) rows = rows.filter((u) => u.tokenBalance < DEFAULT_MONTHLY_LIMIT * LOW_BALANCE_THRESHOLD);
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { total, page, pageSize, users: rows.slice(start, start + pageSize) };
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { adminMeta: true },
  });

  const enriched: AdminUserListItem[] = await Promise.all(
    users.map(async (user) => {
      const [usage, taskCount, artifactCount, devices, gnomic, topupAgg, consumedAgg] = await Promise.all([
        getUsageSummaryForExternalId(user.externalId),
        prisma.task.count({ where: { userId: user.id } }),
        prisma.taskArtifact.count({ where: { task: { userId: user.id } } }),
        prisma.hermesDevice.findMany({ where: { userId: user.id }, select: { status: true } }),
        prisma.gnomicAccountBinding.findFirst({ where: { hellomeUserId: user.externalId } }),
        prisma.billingTopup.aggregate({ where: { userId: user.id }, _sum: { tokenAmount: true } }),
        prisma.usageLedger.aggregate({
          where: { userId: user.id, status: { in: ['reserved', 'settled'] } },
          _sum: { tokenUsed: true },
        }),
      ]);

      const connected = devices.some((d) => d.status === 'connected');
      const hermesStatus: AdminUserListItem['hermesStatus'] =
        devices.length === 0 ? 'none' : connected ? 'connected' : 'offline';

      return {
        id: user.id,
        externalId: user.externalId,
        displayName: user.displayName ?? user.externalId,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        status: user.adminMeta?.status ?? 'active',
        tokenBalance: usage.tokenBalance,
        totalTopup: topupAgg._sum.tokenAmount ?? 0,
        totalConsumed: consumedAgg._sum.tokenUsed ?? 0,
        taskCount,
        artifactCount,
        hermesStatus,
        gnomicBound: Boolean(gnomic && gnomic.status === 'active'),
      };
    }),
  );

  let filtered = enriched;

  if (params.q?.trim()) {
    const q = params.q.trim();
    const qLower = q.toLowerCase();
    const taskMatchIds = new Set(
      (
        await prisma.task.findMany({
          where: { OR: [{ id: { contains: q } }, { name: { contains: q, mode: 'insensitive' } }] },
          select: { userId: true },
          take: 50,
        })
      ).map((t) => t.userId),
    );
    const orderMatchIds = new Set(
      (
        await prisma.billingTopup.findMany({
          where: { note: { contains: q, mode: 'insensitive' } },
          select: { userId: true },
          take: 50,
        })
      ).map((t) => t.userId),
    );

    filtered = filtered.filter(
      (user) =>
        matchesQuery(user, q) ||
        taskMatchIds.has(user.id) ||
        orderMatchIds.has(user.id) ||
        user.id === q ||
        user.externalId === q,
    );
  }

  if (params.hasHermes === true) filtered = filtered.filter((u) => u.hermesStatus !== 'none');
  if (params.hasHermes === false) filtered = filtered.filter((u) => u.hermesStatus === 'none');
  if (params.hasGnomic === true) filtered = filtered.filter((u) => u.gnomicBound);
  if (params.hasGnomic === false) filtered = filtered.filter((u) => !u.gnomicBound);
  if (params.hasTopup === true) filtered = filtered.filter((u) => u.totalTopup > 0);
  if (params.lowBalance) {
    filtered = filtered.filter((u) => u.tokenBalance < DEFAULT_MONTHLY_LIMIT * LOW_BALANCE_THRESHOLD);
  }

  if (params.createdFrom) {
    const from = new Date(params.createdFrom);
    filtered = filtered.filter((u) => new Date(u.createdAt) >= from);
  }
  if (params.createdTo) {
    const to = new Date(params.createdTo);
    filtered = filtered.filter((u) => new Date(u.createdAt) <= to);
  }

  if (params.status) {
    filtered = filtered.filter((u) => u.status === params.status);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, users: filtered.slice(start, start + pageSize) };
}

export async function getAdminUserDetail(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const list = demoUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) return null;
    const tasks = (await listUgcTasks()).slice(0, 20).map((t) => ({
      id: t.id,
      name: t.name,
      agentType: t.agentType,
      status: t.status,
      tokenUsed: t.tokenUsed,
      createdAt: t.createdAt,
      startedAt: (t as { startedAt?: string }).startedAt ?? null,
      completedAt: (t as { completedAt?: string }).completedAt ?? null,
      requiresConfirm: (t as { requiresConfirm?: boolean }).requiresConfirm ?? false,
    }));
    return {
      profile: user,
      summary: {
        tokenBalance: user.tokenBalance,
        totalTopup: 0,
        totalConsumed: 0,
        monthlyConsumed: 0,
        taskCount: tasks.length,
        artifactCount: 0,
        lastTopupAt: null,
        lastConsumedAt: null,
      },
      topups: [],
      ledgers: [],
      tasks,
      artifacts: [],
      devices: [],
      gnomicBinding: null,
      auditLogs: [],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminMeta: true },
  });
  if (!user) return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    usage,
    topups,
    tasks,
    ledgers,
    devices,
    gnomicBinding,
    artifacts,
    topupAgg,
    consumedAgg,
    monthlyAgg,
    lastTopup,
    lastLedger,
    taskCount,
    artifactCount,
  ] = await Promise.all([
    getUsageSummaryForExternalId(user.externalId),
    prisma.billingTopup.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.usageLedger.findMany({
      where: { userId },
      include: { task: { select: { id: true, name: true, agentType: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.hermesDevice.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    prisma.gnomicAccountBinding.findFirst({ where: { hellomeUserId: user.externalId } }),
    prisma.taskArtifact.findMany({
      where: { task: { userId } },
      include: { task: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.billingTopup.aggregate({ where: { userId }, _sum: { tokenAmount: true } }),
    prisma.usageLedger.aggregate({
      where: { userId, status: { in: ['reserved', 'settled'] } },
      _sum: { tokenUsed: true },
    }),
    prisma.usageLedger.aggregate({
      where: {
        userId,
        status: { in: ['reserved', 'settled'] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { tokenUsed: true },
    }),
    prisma.billingTopup.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.usageLedger.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.task.count({ where: { userId } }),
    prisma.taskArtifact.count({ where: { task: { userId } } }),
  ]);

  const allLogs = await listAuditLogs(200);
  const auditLogs = allLogs
    .filter((log) => log.targetType === 'user' && log.targetId === userId)
    .map((log) => ({
      id: log.id,
      createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
      actorId: log.actorId,
      actorName: log.actorName,
      module: log.module,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      before: log.before,
      after: log.after,
      ip: log.ip,
    }));

  const connected = devices.some((d) => d.status === 'connected');

  return {
    profile: {
      id: user.id,
      externalId: user.externalId,
      displayName: user.displayName ?? user.externalId,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      status: user.adminMeta?.status ?? 'active',
      lastLoginAt: user.adminMeta?.lastLoginAt?.toISOString() ?? null,
      disabledReason: user.adminMeta?.disabledReason ?? null,
      tags: user.adminMeta?.tags ?? [],
      tokenBalance: usage.tokenBalance,
      hermesStatus: devices.length === 0 ? 'none' : connected ? 'connected' : 'offline',
      gnomicBound: Boolean(gnomicBinding && gnomicBinding.status === 'active'),
    },
    summary: {
      tokenBalance: usage.tokenBalance,
      totalTopup: topupAgg._sum.tokenAmount ?? 0,
      totalConsumed: consumedAgg._sum.tokenUsed ?? 0,
      monthlyConsumed: monthlyAgg._sum.tokenUsed ?? 0,
      taskCount,
      artifactCount,
      lastTopupAt: lastTopup?.createdAt.toISOString() ?? null,
      lastConsumedAt: lastLedger?.createdAt.toISOString() ?? null,
    },
    topups: topups.map((row) => ({
      id: row.id,
      tokenAmount: row.tokenAmount,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
      source: 'admin_or_billing',
    })),
    ledgers: ledgers.map(formatLedger),
    tasks: tasks.map((task) => ({
      id: task.id,
      name: task.name,
      agentType: task.agentType,
      status: task.status,
      tokenUsed: task.tokenUsed,
      estimatedTokenMin: task.estimatedTokenMin,
      estimatedTokenMax: task.estimatedTokenMax,
      requiresConfirm: task.requiresConfirm,
      createdAt: task.createdAt.toISOString(),
      startedAt: task.startedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
    })),
    artifacts: artifacts.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type,
      fileName: row.fileName,
      url: row.url,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      taskId: row.taskId,
      taskName: row.task.name,
      createdAt: row.createdAt.toISOString(),
    })),
    devices: devices.map(formatDevice),
    gnomicBinding: gnomicBinding
      ? {
          id: gnomicBinding.id,
          hellomeUserId: gnomicBinding.hellomeUserId,
          gnomicUserId: gnomicBinding.gnomicUserId,
          phone: gnomicBinding.phone,
          status: gnomicBinding.status,
          createdAt: gnomicBinding.createdAt.toISOString(),
          updatedAt: gnomicBinding.updatedAt.toISOString(),
        }
      : null,
    auditLogs,
  };
}

const ADJUSTMENT_TYPES = new Set([
  'compensation',
  'gift',
  'support',
  'campaign',
  'test',
  'deduction',
  'refund_recovery',
  'correction',
]);

export async function adjustUserTokens(
  userId: string,
  input: { type?: string; tokenAmount: number; reason?: string; note?: string },
  actorId: string,
) {
  const prisma = getPrismaClient();
  const type = input.type && ADJUSTMENT_TYPES.has(input.type) ? input.type : 'correction';
  const tokenAmount = Math.round(Number(input.tokenAmount));
  if (!Number.isFinite(tokenAmount) || tokenAmount === 0) {
    throw new Error('Token 调整数量无效');
  }

  const noteParts = [input.reason, input.note, `类型:${type}`, `操作人:${actorId}`].filter(Boolean);
  const note = noteParts.join(' | ') || `管理员调整 (${actorId})`;

  if (!prisma) {
    return { ok: true, tokenAmount, type, balanceAfter: null };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('用户不存在');

  const usage = await getUsageSummaryForExternalId(user.externalId);
  const balanceAfter = usage.tokenBalance + tokenAmount;
  if (balanceAfter < 0) {
    throw new Error('扣减后 Token 余额不能小于 0');
  }

  await recordBillingTopupForExternalId(user.externalId, { tokenAmount, note });

  return { ok: true, tokenAmount, type, balanceAfter };
}
