import { isAuthenticated } from './auth';
import { navigateExternalTab, openBlankExternalTab } from './openExternalTab';
import {
  clearPendingIntent,
  getPendingIntent,
  stashIntent,
  type PendingAgentIntent,
} from './pendingAgentIntent';

export const AGENTSYUN_HUB_URL = 'https://www.agentsyun.com/hub/models';
export const AGENTSYUN_HUB_REDIRECT_PATH = '/hub/models';

export interface PendingAgentsyunIntent {
  redirectPath: string;
}

type StartAgentsyunSsoSuccess = { ok: true; redirectUrl: string };
type StartAgentsyunSsoFailure = {
  ok: false;
  code: string;
  message: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '请先登录后再打开 Agent云 Token 工场',
  AGENTSYUN_ACCOUNT_BIND_FAILED: '该手机号已存在 Agent云 账号，暂时无法自动绑定，请联系客服处理。',
  AGENTSYUN_CREATE_USER_FAILED: '暂时无法创建 Agent云 账号，请稍后重试。',
  AGENTSYUN_SERVICE_UNAVAILABLE: 'Agent云 服务暂时不可用，请稍后再试。',
  INVALID_REDIRECT: '跳转目标无效，请稍后重试。',
};

function buildDirectHubUrl(redirectPath: string): string {
  const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
  return `https://www.agentsyun.com${path}`;
}

async function readJsonResponse<T>(response: Response, emptyMessage: string): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(emptyMessage);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Agent云 服务响应异常，请确认 HelloMe 开发服务已启动后重试');
  }
}

async function requestAgentsyunSsoStart(redirectPath: string): Promise<StartAgentsyunSsoSuccess> {
  const response = await fetch('/api/agentsyun/sso/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectPath }),
  });

  const payload = await readJsonResponse<StartAgentsyunSsoSuccess | StartAgentsyunSsoFailure>(
    response,
    'Agent云 SSO 服务无响应，请重启 HelloMe 开发服务后重试',
  );

  if (!response.ok || !payload.ok) {
    const failure = payload as StartAgentsyunSsoFailure;
    throw new Error(ERROR_MESSAGES[failure.code] ?? failure.message ?? '打开 Agent云 失败，请稍后重试。');
  }

  return payload;
}

function launchAgentsyunNavigation(redirectPath: string, popup: Window | null): void {
  void requestAgentsyunSsoStart(redirectPath)
    .then((result) => {
      navigateExternalTab(popup, result.redirectUrl);
    })
    .catch((error) => {
      console.warn('[agentsyun] SSO start failed, opening hub directly', error);
      navigateExternalTab(popup, buildDirectHubUrl(redirectPath));
    });
}

export function openAgentsyunHub(
  options: { redirectPath?: string; loginRedirect?: string } = {},
  openLogin?: (intent: PendingAgentIntent) => void,
): void {
  const redirectPath = options.redirectPath ?? AGENTSYUN_HUB_REDIRECT_PATH;

  if (!isAuthenticated()) {
    const intent: PendingAgentIntent = {
      redirect: options.loginRedirect ?? '/app/agents',
      agentsyun: { redirectPath },
    };
    stashIntent(intent);
    openLogin?.(intent);
    return;
  }

  const popup = openBlankExternalTab();
  launchAgentsyunNavigation(redirectPath, popup);
}

export async function replayPendingAgentsyunIntent(): Promise<boolean> {
  const intent = getPendingIntent();
  if (!intent?.agentsyun) return false;

  const { redirectPath } = intent.agentsyun;
  clearPendingIntent();

  const popup = openBlankExternalTab();
  try {
    const result = await requestAgentsyunSsoStart(redirectPath);
    navigateExternalTab(popup, result.redirectUrl);
    return true;
  } catch (error) {
    console.warn('[agentsyun] replay SSO failed, opening hub directly', error);
    navigateExternalTab(popup, buildDirectHubUrl(redirectPath));
    return true;
  }
}
