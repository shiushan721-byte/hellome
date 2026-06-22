import type { Request } from 'express';
import { getPrismaClient } from '../db/prisma';

export interface AuditLogInput {
  actorId: string;
  actorName?: string;
  module: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

const memoryLogs: AuditLogInput[] = [];

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: input.actorId,
          actorName: input.actorName,
          module: input.module,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          before: input.before as object | undefined,
          after: input.after as object | undefined,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      });
      return;
    } catch (error) {
      console.warn('[audit] prisma write failed, using memory', error);
    }
  }

  memoryLogs.unshift({ ...input, createdAt: new Date().toISOString() } as AuditLogInput & { createdAt: string });
  if (memoryLogs.length > 500) memoryLogs.length = 500;
}

export function auditFromRequest(
  req: Request,
  actor: { id: string; name?: string },
  entry: Omit<AuditLogInput, 'actorId' | 'actorName' | 'ip' | 'userAgent'>,
): AuditLogInput {
  return {
    actorId: actor.id,
    actorName: actor.name,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent') ?? undefined,
    ...entry,
  };
}

export async function listAuditLogs(limit = 100) {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      return await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch {
      // fall through
    }
  }

  return memoryLogs.slice(0, limit).map((log, index) => ({
    id: `mem-${index}`,
    ...log,
    createdAt: (log as AuditLogInput & { createdAt?: string }).createdAt ?? new Date().toISOString(),
  }));
}
