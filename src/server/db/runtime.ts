import { getPrismaClient } from './prisma';

export function isFallbackAllowed(): boolean {
  return String(process.env.ALLOW_INMEMORY_FALLBACK ?? 'false').toLowerCase() === 'true';
}

export function isPersistenceEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function assertDatabaseReady(): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (isFallbackAllowed()) return;
    throw new Error('DATABASE_URL 未配置，且未启用内存回退。');
  }
  await prisma.$queryRaw`SELECT 1`;
}
