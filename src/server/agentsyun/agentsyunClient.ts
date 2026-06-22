import crypto from 'node:crypto';
import { AgentsyunSsoError } from './agentsyunTypes';

const mockUsersByPhone = new Map<string, string>();

function getApiBaseUrl(): string {
  return process.env.AGENTSYUN_INTERNAL_API_BASE_URL?.trim() ?? '';
}

function getApiKey(): string {
  return process.env.AGENTSYUN_INTERNAL_API_KEY?.trim() ?? '';
}

function isMockMode(): boolean {
  return !getApiBaseUrl();
}

function mockAgentsyunUserId(phone: string): string {
  const digest = crypto.createHash('sha256').update(phone).digest('hex').slice(0, 16);
  return `agentsyun_mock_${digest}`;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AgentsyunSsoError('AGENTSYUN_SERVICE_UNAVAILABLE', 'Agent云 服务暂时不可用，请稍后再试。');
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
    throw new AgentsyunSsoError('AGENTSYUN_SERVICE_UNAVAILABLE', 'Agent云 服务暂时不可用，请稍后再试。');
  }

  return (await response.json()) as T;
}

export async function findAgentsyunUserByPhone(phone: string): Promise<{
  exists: boolean;
  agentsyunUserId?: string;
}> {
  if (isMockMode()) {
    const agentsyunUserId = mockUsersByPhone.get(phone);
    if (!agentsyunUserId) return { exists: false };
    return { exists: true, agentsyunUserId };
  }

  return postJson('/internal/hellome/users/find-by-phone', { phone });
}

export async function createAgentsyunUser(payload: {
  hellomeUserId: string;
  phone: string;
  nickname: string;
  avatarUrl?: string;
  source: 'hellome';
}): Promise<{ agentsyunUserId: string }> {
  if (isMockMode()) {
    const existing = mockUsersByPhone.get(payload.phone);
    if (existing) return { agentsyunUserId: existing };
    const agentsyunUserId = mockAgentsyunUserId(payload.phone);
    mockUsersByPhone.set(payload.phone, agentsyunUserId);
    return { agentsyunUserId };
  }

  try {
    return await postJson('/internal/hellome/users/create', payload);
  } catch (error) {
    if (error instanceof AgentsyunSsoError) throw error;
    throw new AgentsyunSsoError('AGENTSYUN_CREATE_USER_FAILED', '暂时无法创建 Agent云 账号，请稍后重试。');
  }
}

export async function createAgentsyunSsoTicket(input: {
  hellomeUserId: string;
  agentsyunUserId: string;
  redirectPath: string;
}): Promise<{ ticket: string; expiresAt: string }> {
  if (isMockMode()) {
    const ticket = crypto.randomBytes(24).toString('hex');
    const ttlSeconds = Number(process.env.AGENTSYUN_SSO_TICKET_TTL_SECONDS ?? 120);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    return { ticket, expiresAt };
  }

  try {
    return await postJson('/internal/hellome/sso/tickets', input);
  } catch (error) {
    if (error instanceof AgentsyunSsoError) throw error;
    throw new AgentsyunSsoError('AGENTSYUN_SERVICE_UNAVAILABLE', 'Agent云 服务暂时不可用，请稍后再试。');
  }
}
