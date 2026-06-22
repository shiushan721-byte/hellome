import { isAuthenticated } from './auth';
import { navigateExternalTab, openBlankExternalTab } from './openExternalTab';
import {
  clearPendingIntent,
  getPendingIntent,
  stashIntent,
  type PendingAgentIntent,
} from './pendingAgentIntent';

export type GnomicAction = 'view' | 'experience' | 'clone';

export interface OpenGnomicTemplateOptions {
  templateId: string;
  action: GnomicAction;
  redirectPath: string;
}

export interface PendingGnomicIntent extends OpenGnomicTemplateOptions {}

type StartGnomicSsoSuccess = { ok: true; redirectUrl: string };
type StartGnomicSsoFailure = {
  ok: false;
  code: string;
  message: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '请先登录后再使用 Gnomic 模板',
  GNOMIC_ACCOUNT_BIND_FAILED: '该手机号已存在 Gnomic 账号，暂时无法自动绑定，请联系客服处理。',
  GNOMIC_CREATE_USER_FAILED: '暂时无法创建 Gnomic 账号，请稍后重试。',
  GNOMIC_SERVICE_UNAVAILABLE: 'Gnomic 服务暂时不可用，请稍后再试。',
  INVALID_REDIRECT: '跳转目标无效，请稍后重试。',
};

function resolveErrorMessage(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] ?? fallback ?? '打开 Gnomic 模板失败，请稍后重试。';
}

async function readJsonResponse<T>(response: Response, emptyMessage: string): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(emptyMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Gnomic 服务响应异常，请确认 HelloMe 开发服务已启动后重试');
  }
}

async function requestGnomicSsoStart(
  options: OpenGnomicTemplateOptions,
): Promise<StartGnomicSsoSuccess> {
  const response = await fetch('/api/gnomic/sso/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId: options.templateId,
      action: options.action,
      redirectPath: options.redirectPath,
    }),
  });

  const payload = await readJsonResponse<StartGnomicSsoSuccess | StartGnomicSsoFailure>(
    response,
    'Gnomic SSO 服务无响应，请重启 HelloMe 开发服务后重试',
  );
  if (!response.ok || !payload.ok) {
    const failure = payload as StartGnomicSsoFailure;
    throw new Error(resolveErrorMessage(failure.code, failure.message));
  }

  return payload;
}

export function openGnomicTemplate(
  options: OpenGnomicTemplateOptions,
  openLogin?: (intent: PendingAgentIntent) => void,
): void {
  if (!isAuthenticated()) {
    const intent: PendingAgentIntent = {
      redirect: '/app/agents',
      gnomic: options,
    };
    stashIntent(intent);
    openLogin?.(intent);
    return;
  }

  const popup = openBlankExternalTab();
  void requestGnomicSsoStart(options)
    .then((result) => {
      navigateExternalTab(popup, result.redirectUrl);
    })
    .catch((error) => {
      popup?.close();
      const message = error instanceof Error ? error.message : '打开 Gnomic 模板失败，请稍后重试。';
      window.alert(message);
    });
}

export async function replayPendingGnomicIntent(): Promise<boolean> {
  const intent = getPendingIntent();
  if (!intent?.gnomic) return false;

  const gnomicIntent = intent.gnomic;
  clearPendingIntent();

  const popup = openBlankExternalTab();
  try {
    const result = await requestGnomicSsoStart(gnomicIntent);
    navigateExternalTab(popup, result.redirectUrl);
    return true;
  } catch (error) {
    popup?.close();
    const message = error instanceof Error ? error.message : '打开 Gnomic 模板失败，请稍后重试。';
    window.alert(message);
    return false;
  }
}
