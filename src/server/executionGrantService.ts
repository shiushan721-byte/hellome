import { createHash, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';

export class ExecutionGrantError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'EXPIRED' | 'REVOKED' | 'INVALID' | 'UNAVAILABLE' = 'INVALID',
  ) {
    super(message);
    this.name = 'ExecutionGrantError';
  }
}

export type ExecutionGrantRecord = {
  grantId: string;
  taskId: string;
  skillId: string;
  skillVersionId: string;
  deviceId?: string;
  token: string;
  expiresAt: string;
  allowedProviders: string[];
  allowedModels: string[];
  tokenBudgetMax: number;
};

type MemoryGrant = ExecutionGrantRecord & {
  grantTokenHash: string;
  revokedAt?: string;
};

const memoryGrants = new Map<string, MemoryGrant>();
const DEFAULT_GRANT_TTL_MS = 10 * 60 * 1000;
const DEFAULT_ALLOWED_PROVIDERS = ['openrouter'];
const DEFAULT_ALLOWED_MODELS = ['google/gemini-2.5-flash', 'google/gemini-2.5-pro'];

function hashGrantToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

function toRecord(grant: MemoryGrant): Omit<ExecutionGrantRecord, 'token'> & { token?: string } {
  return {
    grantId: grant.grantId,
    taskId: grant.taskId,
    skillId: grant.skillId,
    skillVersionId: grant.skillVersionId,
    deviceId: grant.deviceId,
    expiresAt: grant.expiresAt,
    allowedProviders: grant.allowedProviders,
    allowedModels: grant.allowedModels,
    tokenBudgetMax: grant.tokenBudgetMax,
  };
}

export async function createExecutionGrant(input: {
  taskId: string;
  skillId: string;
  skillVersionId: string;
  deviceId?: string;
  tokenBudgetMax?: number;
  ttlMs?: number;
}): Promise<ExecutionGrantRecord> {
  const grantId = `grant_${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
  const token = randomBytes(24).toString('hex');
  const grantTokenHash = hashGrantToken(token);
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_GRANT_TTL_MS)).toISOString();
  const allowedProviders = DEFAULT_ALLOWED_PROVIDERS;
  const allowedModels = DEFAULT_ALLOWED_MODELS;
  const tokenBudgetMax = input.tokenBudgetMax ?? 30000;

  const record: MemoryGrant = {
    grantId,
    taskId: input.taskId,
    skillId: input.skillId,
    skillVersionId: input.skillVersionId,
    deviceId: input.deviceId,
    token,
    grantTokenHash,
    expiresAt,
    allowedProviders,
    allowedModels,
    tokenBudgetMax,
  };

  memoryGrants.set(grantId, record);
  memoryGrants.set(grantTokenHash, record);

  const prisma = getPrismaClient();
  if (prisma) {
    await prisma.executionGrant.create({
      data: {
        id: grantId,
        taskId: input.taskId,
        skillId: input.skillId,
        skillVersionId: input.skillVersionId,
        deviceId: input.deviceId ?? null,
        grantTokenHash,
        allowedProviders: allowedProviders as unknown as Prisma.InputJsonValue,
        allowedModels: allowedModels as unknown as Prisma.InputJsonValue,
        tokenBudgetMax,
        expiresAt: new Date(expiresAt),
      },
    });

    await prisma.task.update({
      where: { id: input.taskId },
      data: { executionGrantId: grantId },
    });
  } else if (!isFallbackAllowed()) {
    throw new ExecutionGrantError('数据库不可用，无法创建 execution grant。', 'UNAVAILABLE');
  }

  return record;
}

async function loadGrantById(grantId: string): Promise<MemoryGrant | null> {
  const cached = memoryGrants.get(grantId);
  if (cached) return cached;

  const prisma = getPrismaClient();
  if (!prisma) return null;

  const row = await prisma.executionGrant.findUnique({ where: { id: grantId } });
  if (!row) return null;

  const grant: MemoryGrant = {
    grantId: row.id,
    taskId: row.taskId,
    skillId: row.skillId,
    skillVersionId: row.skillVersionId,
    deviceId: row.deviceId ?? undefined,
    token: '',
    grantTokenHash: row.grantTokenHash,
    expiresAt: row.expiresAt.toISOString(),
    allowedProviders: Array.isArray(row.allowedProviders)
      ? row.allowedProviders.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ALLOWED_PROVIDERS,
    allowedModels: Array.isArray(row.allowedModels)
      ? row.allowedModels.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ALLOWED_MODELS,
    tokenBudgetMax: row.tokenBudgetMax,
    revokedAt: row.revokedAt?.toISOString(),
  };
  memoryGrants.set(grantId, grant);
  return grant;
}

async function loadGrantByToken(token: string): Promise<MemoryGrant | null> {
  const grantTokenHash = hashGrantToken(token);
  const cached = memoryGrants.get(grantTokenHash);
  if (cached) return cached;

  const prisma = getPrismaClient();
  if (!prisma) return null;

  const row = await prisma.executionGrant.findFirst({ where: { grantTokenHash } });
  if (!row) return null;

  const grant: MemoryGrant = {
    grantId: row.id,
    taskId: row.taskId,
    skillId: row.skillId,
    skillVersionId: row.skillVersionId,
    deviceId: row.deviceId ?? undefined,
    token,
    grantTokenHash,
    expiresAt: row.expiresAt.toISOString(),
    allowedProviders: Array.isArray(row.allowedProviders)
      ? row.allowedProviders.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ALLOWED_PROVIDERS,
    allowedModels: Array.isArray(row.allowedModels)
      ? row.allowedModels.filter((item): item is string => typeof item === 'string')
      : DEFAULT_ALLOWED_MODELS,
    tokenBudgetMax: row.tokenBudgetMax,
    revokedAt: row.revokedAt?.toISOString(),
  };
  memoryGrants.set(row.id, grant);
  memoryGrants.set(grantTokenHash, grant);
  return grant;
}

function assertGrantActive(grant: MemoryGrant): void {
  if (grant.revokedAt) {
    throw new ExecutionGrantError('execution grant 已撤销。', 'REVOKED');
  }
  if (new Date(grant.expiresAt).getTime() <= Date.now()) {
    throw new ExecutionGrantError('execution grant 已过期。', 'EXPIRED');
  }
}

export async function validateExecutionGrantToken(token: string, taskId?: string): Promise<MemoryGrant> {
  const grant = await loadGrantByToken(token);
  if (!grant) {
    throw new ExecutionGrantError('execution grant 不存在。', 'NOT_FOUND');
  }
  assertGrantActive(grant);
  if (taskId && grant.taskId !== taskId) {
    throw new ExecutionGrantError('execution grant 与任务不匹配。', 'INVALID');
  }
  return grant;
}

export async function revokeExecutionGrant(grantId: string): Promise<{ grantId: string; revokedAt: string }> {
  const grant = await loadGrantById(grantId);
  if (!grant) {
    throw new ExecutionGrantError('execution grant 不存在。', 'NOT_FOUND');
  }

  const revokedAt = nowIso();
  grant.revokedAt = revokedAt;
  memoryGrants.set(grantId, grant);
  memoryGrants.set(grant.grantTokenHash, grant);

  const prisma = getPrismaClient();
  if (prisma) {
    await prisma.executionGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date(revokedAt) },
    });
  }

  return { grantId, revokedAt };
}

export async function revokeActiveGrantsForTask(taskId: string): Promise<void> {
  const prisma = getPrismaClient();
  const revokedAt = new Date();

  for (const grant of memoryGrants.values()) {
    if (grant.taskId === taskId && !grant.revokedAt) {
      grant.revokedAt = revokedAt.toISOString();
      memoryGrants.set(grant.grantId, grant);
      memoryGrants.set(grant.grantTokenHash, grant);
    }
  }

  if (prisma) {
    await prisma.executionGrant.updateMany({
      where: { taskId, revokedAt: null },
      data: { revokedAt },
    });
  }
}

export function getExecutionGrantPublicView(
  grant: ExecutionGrantRecord,
): Omit<ExecutionGrantRecord, 'token'> {
  return {
    grantId: grant.grantId,
    taskId: grant.taskId,
    skillId: grant.skillId,
    skillVersionId: grant.skillVersionId,
    deviceId: grant.deviceId,
    expiresAt: grant.expiresAt,
    allowedProviders: grant.allowedProviders,
    allowedModels: grant.allowedModels,
    tokenBudgetMax: grant.tokenBudgetMax,
  };
}
