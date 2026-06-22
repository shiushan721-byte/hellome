import {
  createAgentsyunSsoTicket,
  createAgentsyunUser,
  findAgentsyunUserByPhone,
} from './agentsyunClient';
import { createBinding, findBindingByHellomeUserId } from './agentsyunBindingStore';
import { persistSsoTicket } from './agentsyunTicketStore';
import { resolveAgentsyunRedirectPath } from './agentsyunRedirect';
import { AgentsyunSsoError, type StartAgentsyunSsoInput } from './agentsyunTypes';

function getAgentsyunSsoBaseUrl(): string {
  return (process.env.AGENTSYUN_SSO_BASE_URL?.trim() || 'https://www.agentsyun.com').replace(/\/$/, '');
}

async function resolveAgentsyunUserId(input: StartAgentsyunSsoInput): Promise<string> {
  const existingBinding = await findBindingByHellomeUserId(input.hellomeUserId);
  if (existingBinding?.status === 'active') {
    return existingBinding.agentsyunUserId;
  }

  const phoneLookup = await findAgentsyunUserByPhone(input.phone);
  if (phoneLookup.exists && phoneLookup.agentsyunUserId) {
    try {
      await createBinding({
        hellomeUserId: input.hellomeUserId,
        agentsyunUserId: phoneLookup.agentsyunUserId,
        phone: input.phone,
      });
      return phoneLookup.agentsyunUserId;
    } catch {
      throw new AgentsyunSsoError(
        'AGENTSYUN_ACCOUNT_BIND_FAILED',
        '该手机号已存在 Agent云 账号，暂时无法自动绑定，请联系客服处理。',
      );
    }
  }

  let created: { agentsyunUserId: string };
  try {
    created = await createAgentsyunUser({
      hellomeUserId: input.hellomeUserId,
      phone: input.phone,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      source: 'hellome',
    });
  } catch (error) {
    if (error instanceof AgentsyunSsoError) throw error;
    throw new AgentsyunSsoError('AGENTSYUN_CREATE_USER_FAILED', '暂时无法创建 Agent云 账号，请稍后重试。');
  }

  try {
    await createBinding({
      hellomeUserId: input.hellomeUserId,
      agentsyunUserId: created.agentsyunUserId,
      phone: input.phone,
    });
  } catch {
    throw new AgentsyunSsoError(
      'AGENTSYUN_ACCOUNT_BIND_FAILED',
      '该手机号已存在 Agent云 账号，暂时无法自动绑定，请联系客服处理。',
    );
  }

  return created.agentsyunUserId;
}

export async function startAgentsyunSso(
  input: StartAgentsyunSsoInput,
): Promise<{ redirectUrl: string }> {
  if (!input.hellomeUserId.trim() || !input.phone.trim()) {
    throw new AgentsyunSsoError('UNAUTHENTICATED', '请先登录');
  }

  const redirectPath = resolveAgentsyunRedirectPath(input.redirectPath);
  const agentsyunUserId = await resolveAgentsyunUserId(input);

  let ticketResult: { ticket: string; expiresAt: string };
  try {
    ticketResult = await createAgentsyunSsoTicket({
      hellomeUserId: input.hellomeUserId,
      agentsyunUserId,
      redirectPath,
    });
  } catch (error) {
    if (error instanceof AgentsyunSsoError) throw error;
    throw new AgentsyunSsoError('AGENTSYUN_SERVICE_UNAVAILABLE', 'Agent云 服务暂时不可用，请稍后再试。');
  }

  await persistSsoTicket({
    ticket: ticketResult.ticket,
    expiresAt: ticketResult.expiresAt,
  });

  const redirectUrl = `${getAgentsyunSsoBaseUrl()}/sso/hellome?ticket=${encodeURIComponent(ticketResult.ticket)}&redirect=${encodeURIComponent(redirectPath)}`;
  return { redirectUrl };
}
