import type { GnomicAction } from './gnomicTypes';
import { GnomicSsoError } from './gnomicTypes';

const ALLOWED_ACTIONS = new Set<GnomicAction>(['view', 'experience', 'clone']);
const TEMPLATE_ID_PATTERN = /^[a-z0-9-]+$/;

export function buildRedirectPath(templateId: string, action: GnomicAction): string {
  const params = new URLSearchParams({ template: templateId, action });
  return `/workspace?${params.toString()}`;
}

export function validateRedirectPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith('/')) {
    throw new GnomicSsoError('INVALID_REDIRECT', '跳转路径无效');
  }
  if (trimmed.includes('://') || trimmed.startsWith('//')) {
    throw new GnomicSsoError('INVALID_REDIRECT', '不允许跳转到外部链接');
  }
  if (/javascript:/i.test(trimmed)) {
    throw new GnomicSsoError('INVALID_REDIRECT', '跳转路径无效');
  }

  const parsed = new URL(trimmed, 'https://placeholder.local');
  if (parsed.pathname !== '/workspace') {
    throw new GnomicSsoError('INVALID_REDIRECT', '仅允许跳转到 Gnomic 工作台');
  }

  const template = parsed.searchParams.get('template');
  const action = parsed.searchParams.get('action');

  if (template && !TEMPLATE_ID_PATTERN.test(template)) {
    throw new GnomicSsoError('INVALID_REDIRECT', '模板 ID 无效');
  }
  if (action && !ALLOWED_ACTIONS.has(action as GnomicAction)) {
    throw new GnomicSsoError('INVALID_REDIRECT', '模板动作无效');
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function resolveRedirectPath(input: {
  templateId?: string;
  action?: GnomicAction;
  redirectPath?: string;
}): string {
  if (input.redirectPath?.trim()) {
    return validateRedirectPath(input.redirectPath);
  }
  if (input.templateId?.trim() && input.action) {
    const templateId = input.templateId.trim();
    if (!TEMPLATE_ID_PATTERN.test(templateId)) {
      throw new GnomicSsoError('INVALID_REDIRECT', '模板 ID 无效');
    }
    return validateRedirectPath(buildRedirectPath(templateId, input.action));
  }
  throw new GnomicSsoError('INVALID_REDIRECT', '缺少跳转目标');
}
