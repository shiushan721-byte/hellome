import { createGnomicSsoTicket, createGnomicUser, findGnomicUserByPhone } from './gnomicClient';
import { createBinding, findBindingByHellomeUserId } from './gnomicBindingStore';
import { persistSsoTicket } from './gnomicTicketStore';
import { resolveRedirectPath } from './gnomicRedirect';
import { GnomicSsoError, type StartGnomicSsoInput } from './gnomicTypes';

function getGnomicSsoBaseUrl(): string {
  return (process.env.GNOMIC_SSO_BASE_URL?.trim() || 'https://www.gnomic.cn').replace(/\/$/, '');
}

function logGnomicEvent(event: string, payload: Record<string, unknown>): void {
  console.info(`[gnomic] ${event}`, payload);
}

async function resolveGnomicUserId(input: StartGnomicSsoInput): Promise<{
  gnomicUserId: string;
  hasBinding: boolean;
  createdGnomicUser: boolean;
}> {
  const existingBinding = await findBindingByHellomeUserId(input.hellomeUserId);
  if (existingBinding?.status === 'active') {
    logGnomicEvent('gnomic_account_binding_found', {
      hellomeUserId: input.hellomeUserId,
      gnomicUserId: existingBinding.gnomicUserId,
    });
    return {
      gnomicUserId: existingBinding.gnomicUserId,
      hasBinding: true,
      createdGnomicUser: false,
    };
  }

  const phoneLookup = await findGnomicUserByPhone(input.phone);
  if (phoneLookup.exists && phoneLookup.gnomicUserId) {
    try {
      await createBinding({
        hellomeUserId: input.hellomeUserId,
        gnomicUserId: phoneLookup.gnomicUserId,
        phone: input.phone,
      });
      logGnomicEvent('gnomic_account_binding_found', {
        hellomeUserId: input.hellomeUserId,
        gnomicUserId: phoneLookup.gnomicUserId,
        source: 'phone_lookup',
      });
      return {
        gnomicUserId: phoneLookup.gnomicUserId,
        hasBinding: false,
        createdGnomicUser: false,
      };
    } catch {
      throw new GnomicSsoError(
        'GNOMIC_ACCOUNT_BIND_FAILED',
        '该手机号已存在 Gnomic 账号，暂时无法自动绑定，请联系客服处理。',
      );
    }
  }

  let created: { gnomicUserId: string };
  try {
    created = await createGnomicUser({
      hellomeUserId: input.hellomeUserId,
      phone: input.phone,
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      source: 'hellome',
    });
  } catch (error) {
    if (error instanceof GnomicSsoError) throw error;
    throw new GnomicSsoError('GNOMIC_CREATE_USER_FAILED', '暂时无法创建 Gnomic 账号，请稍后重试。');
  }

  try {
    await createBinding({
      hellomeUserId: input.hellomeUserId,
      gnomicUserId: created.gnomicUserId,
      phone: input.phone,
    });
  } catch {
    throw new GnomicSsoError(
      'GNOMIC_ACCOUNT_BIND_FAILED',
      '该手机号已存在 Gnomic 账号，暂时无法自动绑定，请联系客服处理。',
    );
  }

  logGnomicEvent('gnomic_account_created', {
    hellomeUserId: input.hellomeUserId,
    gnomicUserId: created.gnomicUserId,
  });

  return {
    gnomicUserId: created.gnomicUserId,
    hasBinding: false,
    createdGnomicUser: true,
  };
}

export async function startGnomicSso(
  input: StartGnomicSsoInput,
): Promise<{ redirectUrl: string }> {
  if (!input.hellomeUserId.trim() || !input.phone.trim()) {
    throw new GnomicSsoError('UNAUTHENTICATED', '请先登录');
  }

  const redirectPath = resolveRedirectPath({
    templateId: input.templateId,
    action: input.action,
    redirectPath: input.redirectPath,
  });

  logGnomicEvent('gnomic_sso_start', {
    hellomeUserId: input.hellomeUserId,
    templateId: input.templateId,
    action: input.action,
    redirectPath,
  });

  const { gnomicUserId, hasBinding, createdGnomicUser } = await resolveGnomicUserId(input);

  let ticketResult: { ticket: string; expiresAt: string };
  try {
    ticketResult = await createGnomicSsoTicket({
      hellomeUserId: input.hellomeUserId,
      gnomicUserId,
      redirectPath,
    });
  } catch (error) {
    if (error instanceof GnomicSsoError) throw error;
    throw new GnomicSsoError('GNOMIC_SERVICE_UNAVAILABLE', 'Gnomic 服务暂时不可用，请稍后再试。');
  }

  await persistSsoTicket({
    ticket: ticketResult.ticket,
    hellomeUserId: input.hellomeUserId,
    gnomicUserId,
    redirectPath,
    expiresAt: ticketResult.expiresAt,
  });

  const redirectUrl = `${getGnomicSsoBaseUrl()}/sso/hellome?ticket=${encodeURIComponent(ticketResult.ticket)}&redirect=${encodeURIComponent(redirectPath)}`;

  logGnomicEvent('gnomic_sso_ticket_created', {
    hellomeUserId: input.hellomeUserId,
    gnomicUserId,
    templateId: input.templateId,
    action: input.action,
    hasBinding,
    createdGnomicUser,
  });

  logGnomicEvent('gnomic_sso_redirect', {
    hellomeUserId: input.hellomeUserId,
    templateId: input.templateId,
    action: input.action,
  });

  return { redirectUrl };
}
