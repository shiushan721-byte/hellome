import { getPrismaClient } from '../db/prisma';
import type { GnomicAccountBindingRecord, GnomicBindingStatus } from './gnomicTypes';

const memoryBindingsByHellomeUserId = new Map<string, GnomicAccountBindingRecord>();
const memoryBindingsByGnomicUserId = new Map<string, GnomicAccountBindingRecord>();

function toRecord(row: {
  id: string;
  hellomeUserId: string;
  gnomicUserId: string;
  phone: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): GnomicAccountBindingRecord {
  return {
    id: row.id,
    hellomeUserId: row.hellomeUserId,
    gnomicUserId: row.gnomicUserId,
    phone: row.phone ?? undefined,
    status: row.status as GnomicBindingStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findBindingByHellomeUserId(
  hellomeUserId: string,
): Promise<GnomicAccountBindingRecord | null> {
  const prisma = getPrismaClient();
  if (prisma) {
    const row = await prisma.gnomicAccountBinding.findUnique({ where: { hellomeUserId } });
    return row ? toRecord(row) : null;
  }
  return memoryBindingsByHellomeUserId.get(hellomeUserId) ?? null;
}

export async function createBinding(input: {
  hellomeUserId: string;
  gnomicUserId: string;
  phone?: string;
}): Promise<GnomicAccountBindingRecord> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const row = await prisma.gnomicAccountBinding.create({
        data: {
          hellomeUserId: input.hellomeUserId,
          gnomicUserId: input.gnomicUserId,
          phone: input.phone,
          status: 'active',
        },
      });
      return toRecord(row);
    } catch {
      throw new Error('GNOMIC_ACCOUNT_BIND_FAILED');
    }
  }

  if (
    memoryBindingsByHellomeUserId.has(input.hellomeUserId) ||
    memoryBindingsByGnomicUserId.has(input.gnomicUserId)
  ) {
    throw new Error('GNOMIC_ACCOUNT_BIND_FAILED');
  }

  const now = new Date();
  const record: GnomicAccountBindingRecord = {
    id: `binding_${input.hellomeUserId}`,
    hellomeUserId: input.hellomeUserId,
    gnomicUserId: input.gnomicUserId,
    phone: input.phone,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  memoryBindingsByHellomeUserId.set(record.hellomeUserId, record);
  memoryBindingsByGnomicUserId.set(record.gnomicUserId, record);
  return record;
}
