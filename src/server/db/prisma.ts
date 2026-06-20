import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __hellomePrisma__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize Prisma Client');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalThis.__hellomePrisma__) {
    globalThis.__hellomePrisma__ = createPrismaClient();
  }
  return globalThis.__hellomePrisma__;
}

export function requirePrismaClient(): PrismaClient {
  const client = getPrismaClient();
  if (client) return client;
  return createPrismaClient();
}
