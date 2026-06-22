import crypto from 'node:crypto';
import { getPrismaClient } from '../db/prisma';
import type { GnomicSsoTicketRecord } from './gnomicTypes';

const memoryTickets = new Map<string, GnomicSsoTicketRecord>();

function ticketTtlMs(): number {
  const seconds = Number(process.env.GNOMIC_SSO_TICKET_TTL_SECONDS ?? 120);
  return Math.max(60, Math.min(180, seconds)) * 1000;
}

function toRecord(row: {
  id: string;
  ticket: string;
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}): GnomicSsoTicketRecord {
  return {
    id: row.id,
    ticket: row.ticket,
    hellomeUserId: row.hellomeUserId,
    gnomicUserId: row.gnomicUserId,
    redirectPath: row.redirectPath,
    used: row.used,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function persistSsoTicket(input: {
  ticket: string;
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
  expiresAt: string;
}): Promise<GnomicSsoTicketRecord> {
  const expiresAt = new Date(input.expiresAt);
  const prisma = getPrismaClient();

  if (prisma) {
    const row = await prisma.gnomicSsoTicket.create({
      data: {
        ticket: input.ticket,
        hellomeUserId: input.hellomeUserId,
        gnomicUserId: input.gnomicUserId,
        redirectPath: input.redirectPath,
        expiresAt,
      },
    });
    return toRecord(row);
  }

  const record: GnomicSsoTicketRecord = {
    id: `ticket_${input.ticket}`,
    ticket: input.ticket,
    hellomeUserId: input.hellomeUserId,
    gnomicUserId: input.gnomicUserId,
    redirectPath: input.redirectPath,
    used: false,
    expiresAt,
    createdAt: new Date(),
  };
  memoryTickets.set(record.ticket, record);
  return record;
}

export async function createLocalSsoTicket(input: {
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
}): Promise<GnomicSsoTicketRecord> {
  const ticket = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ticketTtlMs()).toISOString();
  return persistSsoTicket({ ...input, ticket, expiresAt });
}
