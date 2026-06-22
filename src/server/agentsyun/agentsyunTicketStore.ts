import crypto from 'node:crypto';

function ticketTtlMs(): number {
  const seconds = Number(process.env.AGENTSYUN_SSO_TICKET_TTL_SECONDS ?? 120);
  return Math.max(60, Math.min(180, seconds)) * 1000;
}

const memoryTickets = new Map<string, { ticket: string; expiresAt: Date }>();

export async function persistSsoTicket(input: {
  ticket: string;
  expiresAt: string;
}): Promise<void> {
  memoryTickets.set(input.ticket, {
    ticket: input.ticket,
    expiresAt: new Date(input.expiresAt),
  });
}

export async function createLocalSsoTicket(): Promise<{ ticket: string; expiresAt: string }> {
  const ticket = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + ticketTtlMs()).toISOString();
  await persistSsoTicket({ ticket, expiresAt });
  return { ticket, expiresAt };
}
