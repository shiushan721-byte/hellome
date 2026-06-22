import crypto from 'node:crypto';
import type { CreateGnomicUserPayload } from './gnomicTypes';
import { GnomicSsoError } from './gnomicTypes';

export interface GnomicFindByPhoneResult {
  exists: boolean;
  gnomicUserId?: string;
}

export interface GnomicCreateTicketResult {
  ticket: string;
  expiresAt: string;
}

const mockUsersByPhone = new Map<string, string>();

function getApiBaseUrl(): string {
  return process.env.GNOMIC_INTERNAL_API_BASE_URL?.trim() ?? '';
}

function getApiKey(): string {
  return process.env.GNOMIC_INTERNAL_API_KEY?.trim() ?? '';
}

function isMockMode(): boolean {
  return !getApiBaseUrl();
}

function mockGnomicUserId(phone: string): string {
  const digest = crypto.createHash('sha256').update(phone).digest('hex').slice(0, 16);
  return `gnomic_mock_${digest}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GnomicSsoError('GNOMIC_SERVICE_UNAVAILABLE', 'Gnomic 服务暂时不可用，请稍后再试。');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new GnomicSsoError('GNOMIC_SERVICE_UNAVAILABLE', 'Gnomic 服务暂时不可用，请稍后再试。');
  }

  return (await response.json()) as T;
}

export async function findGnomicUserByPhone(phone: string): Promise<GnomicFindByPhoneResult> {
  if (isMockMode()) {
    const gnomicUserId = mockUsersByPhone.get(phone);
    if (!gnomicUserId) {
      return { exists: false };
    }
    return { exists: true, gnomicUserId };
  }

  const data = await postJson<GnomicFindByPhoneResult>('/internal/hellome/users/find-by-phone', { phone });
  return data;
}

export async function createGnomicUser(payload: CreateGnomicUserPayload): Promise<{ gnomicUserId: string }> {
  if (isMockMode()) {
    const existing = mockUsersByPhone.get(payload.phone);
    if (existing) {
      return { gnomicUserId: existing };
    }
    const gnomicUserId = mockGnomicUserId(payload.phone);
    mockUsersByPhone.set(payload.phone, gnomicUserId);
    return { gnomicUserId };
  }

  try {
    return await postJson<{ gnomicUserId: string }>('/internal/hellome/users/create', payload);
  } catch (error) {
    if (error instanceof GnomicSsoError) throw error;
    throw new GnomicSsoError('GNOMIC_CREATE_USER_FAILED', '暂时无法创建 Gnomic 账号，请稍后重试。');
  }
}

export async function createGnomicSsoTicket(input: {
  hellomeUserId: string;
  gnomicUserId: string;
  redirectPath: string;
}): Promise<GnomicCreateTicketResult> {
  if (isMockMode()) {
    const ticket = crypto.randomBytes(24).toString('hex');
    const ttlSeconds = Number(process.env.GNOMIC_SSO_TICKET_TTL_SECONDS ?? 120);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return { ticket, expiresAt };
  }

  try {
    return await postJson<GnomicCreateTicketResult>('/internal/hellome/sso/tickets', input);
  } catch (error) {
    if (error instanceof GnomicSsoError) throw error;
    throw new GnomicSsoError('GNOMIC_SERVICE_UNAVAILABLE', 'Gnomic 服务暂时不可用，请稍后再试。');
  }
}

export function isGnomicClientMockMode(): boolean {
  return isMockMode();
}
