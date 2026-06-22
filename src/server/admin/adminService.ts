import { getPrismaClient } from '../db/prisma';
import {
  buildUsageSummary,
  getUsageSummaryForExternalId,
  recordBillingTopupForExternalId,
} from '../billingService';
import { listUgcTasks } from '../ugcTaskService';
import { WORKFLOW_MARKET_ITEMS } from '../../data/workflowMarket';

export async function getAdminDashboardStats() {
  const prisma = getPrismaClient();

  if (!prisma) {
    const tasks = await listUgcTasks();
    return {
      users: 3,
      tasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      topups: 0,
      gnomicBindings: 0,
      publishedConfigs: 0,
      dbConnected: false,
    };
  }

  try {
    const [users, tasks, completedTasks, topups, gnomicBindings, publishedConfigs] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'completed' } }),
      prisma.billingTopup.count(),
      prisma.gnomicAccountBinding.count(),
      prisma.frontendConfig.count({ where: { status: 'published' } }),
    ]);

    return {
      users,
      tasks,
      completedTasks,
      topups,
      gnomicBindings,
      publishedConfigs,
      dbConnected: true,
    };
  } catch {
    const tasks = await listUgcTasks();
    return {
      users: 0,
      tasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      topups: 0,
      gnomicBindings: 0,
      publishedConfigs: 0,
      dbConnected: false,
    };
  }
}

export async function listAdminUsers() {
  const prisma = getPrismaClient();
  if (!prisma) {
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
      },
    ];
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const enriched = await Promise.all(
    users.map(async (user) => {
      const usage = await getUsageSummaryForExternalId(user.externalId);
      return {
        id: user.id,
        externalId: user.externalId,
        displayName: user.displayName ?? user.externalId,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        status: 'active',
        tokenBalance: usage.tokenBalance,
      };
    }),
  );

  return enriched;
}

export async function getAdminUserDetail(userId: string) {
  const prisma = getPrismaClient();
  if (!prisma) {
    const list = await listAdminUsers();
    const user = list.find((u) => u.id === userId);
    if (!user) return null;
    return {
      ...user,
      usage: buildUsageSummary({ monthlyTokenLimit: 20000, monthlyUsed: 0 }),
      topups: [],
      tasks: (await listUgcTasks()).slice(0, 10),
      ledgers: [],
      devices: [],
      gnomicBinding: null,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [topups, tasks, ledgers, devices, gnomicBinding, usage] = await Promise.all([
    prisma.billingTopup.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.task.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.usageLedger.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.hermesDevice.findMany({ where: { userId } }),
    prisma.gnomicAccountBinding.findFirst({ where: { hellomeUserId: user.externalId } }),
    getUsageSummaryForExternalId(user.externalId),
  ]);

  return {
    id: user.id,
    externalId: user.externalId,
    displayName: user.displayName ?? user.externalId,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    status: 'active',
    tokenBalance: usage.tokenBalance,
    usage,
    topups: topups.map((row) => ({
      id: row.id,
      tokenAmount: row.tokenAmount,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      name: task.name,
      agentType: task.agentType,
      status: task.status,
      tokenUsed: task.tokenUsed,
      createdAt: task.createdAt.toISOString(),
    })),
    ledgers,
    devices,
    gnomicBinding,
  };
}

export async function adjustUserTokens(
  userId: string,
  input: { tokenAmount: number; note?: string },
  externalId: string,
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return { ok: true, tokenAmount: input.tokenAmount };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('用户不存在');

  await recordBillingTopupForExternalId(user.externalId, {
    tokenAmount: input.tokenAmount,
    note: input.note ?? `管理员调整 (${externalId})`,
  });

  return { ok: true, tokenAmount: input.tokenAmount };
}

export async function listAdminOrders() {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  const topups = await prisma.billingTopup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { externalId: true, displayName: true, phone: true } } },
  });

  return topups.map((row) => ({
    id: row.id,
    orderNo: `TOPUP-${row.id.slice(0, 8).toUpperCase()}`,
    userId: row.userId,
    userLabel: row.user.displayName ?? row.user.phone ?? row.user.externalId,
    type: 'topup',
    tokenAmount: row.tokenAmount,
    amountCents: 0,
    channel: 'manual',
    status: 'paid',
    createdAt: row.createdAt.toISOString(),
    paidAt: row.createdAt.toISOString(),
    note: row.note,
  }));
}

export async function listAdminTasks() {
  const prisma = getPrismaClient();
  if (!prisma) {
    const tasks = await listUgcTasks();
    return tasks.map((task) => ({
      id: task.id,
      name: task.name,
      agentType: task.agentType,
      status: task.status,
      tokenUsed: task.tokenUsed,
      createdAt: task.createdAt,
      userId: (task as { userId?: string }).userId ?? 'local',
    }));
  }

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { externalId: true, displayName: true } } },
  });

  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    agentType: task.agentType,
    status: task.status,
    tokenUsed: task.tokenUsed,
    createdAt: task.createdAt.toISOString(),
    userId: task.userId,
    userLabel: task.user.displayName ?? task.user.externalId,
  }));
}

export async function listAdminArtifacts() {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  const artifacts = await prisma.taskArtifact.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      task: {
        select: { id: true, name: true, userId: true },
      },
    },
  });

  return artifacts.map((artifact) => ({
    id: artifact.id,
    taskId: artifact.taskId,
    taskName: artifact.task.name,
    type: artifact.type,
    label: artifact.label,
    url: artifact.url,
    createdAt: artifact.createdAt.toISOString(),
    status: 'visible',
  }));
}

const memoryConfigs: Array<{
  id: string;
  key: string;
  name: string;
  scope: string;
  version: number;
  status: string;
  payload: unknown;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}> = [];

export async function listFrontendConfigs(scope?: string) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      return await prisma.frontendConfig.findMany({
        where: scope ? { scope } : undefined,
        orderBy: [{ scope: 'asc' }, { key: 'asc' }, { version: 'desc' }],
        take: 200,
      });
    } catch {
      // fall through
    }
  }

  return scope ? memoryConfigs.filter((c) => c.scope === scope) : memoryConfigs;
}

export async function upsertFrontendConfig(input: {
  id?: string;
  key: string;
  name: string;
  scope: string;
  payload: unknown;
  actorId: string;
}) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      if (input.id) {
        return await prisma.frontendConfig.update({
          where: { id: input.id },
          data: {
            name: input.name,
            payload: input.payload as object,
            updatedBy: input.actorId,
          },
        });
      }

      const latest = await prisma.frontendConfig.findFirst({
        where: { key: input.key },
        orderBy: { version: 'desc' },
      });
      const version = (latest?.version ?? 0) + 1;

      return await prisma.frontendConfig.create({
        data: {
          key: input.key,
          name: input.name,
          scope: input.scope,
          version,
          status: 'draft',
          payload: input.payload as object,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
      });
    } catch {
      // fall through
    }
  }

  const now = new Date().toISOString();
  if (input.id) {
    const idx = memoryConfigs.findIndex((c) => c.id === input.id);
    if (idx >= 0) {
      memoryConfigs[idx] = {
        ...memoryConfigs[idx],
        name: input.name,
        payload: input.payload,
        updatedAt: now,
      };
      return memoryConfigs[idx];
    }
  }

  const row = {
    id: `mem-${Date.now()}`,
    key: input.key,
    name: input.name,
    scope: input.scope,
    version: 1,
    status: 'draft',
    payload: input.payload,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryConfigs.unshift(row);
  return row;
}

export async function publishFrontendConfig(id: string, actorId: string) {
  const prisma = getPrismaClient();
  const now = new Date();

  if (prisma) {
    try {
      const config = await prisma.frontendConfig.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: now,
          updatedBy: actorId,
        },
      });

      await prisma.publishRecord.create({
        data: {
          module: config.scope,
          targetKey: config.key,
          version: config.version,
          title: config.name,
          snapshot: config.payload as object,
          publishedBy: actorId,
        },
      });

      return config;
    } catch {
      // fall through
    }
  }

  const idx = memoryConfigs.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error('配置不存在');
  memoryConfigs[idx] = {
    ...memoryConfigs[idx],
    status: 'published',
    publishedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return memoryConfigs[idx];
}

export async function getPublishedConfigByScope(scope: string) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const configs = await prisma.frontendConfig.findMany({
        where: { scope, status: 'published' },
        orderBy: [{ key: 'asc' }, { version: 'desc' }],
      });
      const map = new Map<string, (typeof configs)[number]>();
      for (const config of configs) {
        if (!map.has(config.key)) map.set(config.key, config);
      }
      return [...map.values()];
    } catch {
      // fall through
    }
  }

  const published = memoryConfigs.filter((c) => c.scope === scope && c.status === 'published');
  const map = new Map<string, (typeof published)[number]>();
  for (const config of published) {
    if (!map.has(config.key)) map.set(config.key, config);
  }
  return [...map.values()];
}

export async function listWorkflowTemplates() {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const rows = await prisma.workflowTemplate.findMany({ orderBy: { sortOrder: 'asc' } });
      if (rows.length > 0) return rows;
    } catch {
      // fall through
    }
  }

  return WORKFLOW_MARKET_ITEMS.map((item, index) => ({
    id: item.id,
    templateId: item.templateId,
    title: item.title,
    category: item.category,
    coverUrl: null,
    authorName: item.author.name,
    pricePerRun: item.pricePerRun,
    gnomicPath: item.actionPath.view,
    status: 'published',
    sortOrder: index,
    recommended: index < 3,
    metadata: item,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function updateWorkflowTemplate(
  templateId: string,
  input: Partial<{
    title: string;
    category: string;
    status: string;
    sortOrder: number;
    recommended: boolean;
    pricePerRun: number;
  }>,
) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      return await prisma.workflowTemplate.upsert({
        where: { templateId },
        create: {
          templateId,
          title: input.title ?? templateId,
          category: input.category ?? 'content',
          gnomicPath: `/workspace?template=${templateId}`,
          status: input.status ?? 'draft',
          sortOrder: input.sortOrder ?? 0,
          recommended: input.recommended ?? false,
          pricePerRun: input.pricePerRun,
        },
        update: {
          title: input.title,
          category: input.category,
          status: input.status,
          sortOrder: input.sortOrder,
          recommended: input.recommended,
          pricePerRun: input.pricePerRun,
        },
      });
    } catch {
      // fall through
    }
  }

  return { templateId, ...input };
}

export async function listGnomicBindings() {
  const prisma = getPrismaClient();
  if (!prisma) return [];

  try {
    return await prisma.gnomicAccountBinding.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  } catch {
    return [];
  }
}

export async function listRechargePacks() {
  const prisma = getPrismaClient();
  if (!prisma) {
    return [
      { id: 'pack-1', name: '体验包', tokenAmount: 10000, bonusTokens: 0, priceCents: 990, status: 'published', recommended: false, sortOrder: 0 },
      { id: 'pack-2', name: '标准包', tokenAmount: 50000, bonusTokens: 5000, priceCents: 4990, status: 'published', recommended: true, sortOrder: 1 },
    ];
  }

  try {
    return await prisma.rechargePack.findMany({ orderBy: { sortOrder: 'asc' } });
  } catch {
    return [];
  }
}
