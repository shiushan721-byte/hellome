import { AgentsyunSsoError } from './agentsyunTypes';

export const DEFAULT_AGENTSYUN_HUB_REDIRECT_PATH = '/hub/models';

export function validateAgentsyunRedirectPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/')) {
    throw new AgentsyunSsoError('INVALID_REDIRECT', '跳转路径无效');
  }
  if (trimmed.includes('://') || trimmed.startsWith('//')) {
    throw new AgentsyunSsoError('INVALID_REDIRECT', '不允许跳转到外部链接');
  }
  if (/javascript:/i.test(trimmed)) {
    throw new AgentsyunSsoError('INVALID_REDIRECT', '跳转路径无效');
  }

  const parsed = new URL(trimmed, 'https://placeholder.local');
  if (!parsed.pathname.startsWith('/hub')) {
    throw new AgentsyunSsoError('INVALID_REDIRECT', '仅允许跳转到 Agent云 Hub');
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function resolveAgentsyunRedirectPath(redirectPath?: string): string {
  if (redirectPath?.trim()) {
    return validateAgentsyunRedirectPath(redirectPath);
  }
  return validateAgentsyunRedirectPath(DEFAULT_AGENTSYUN_HUB_REDIRECT_PATH);
}
