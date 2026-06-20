import type {
  DemoAccountPreset,
  SendCodeResult,
  UserProfile,
  UserRole,
} from './auth-types';

const AUTH_KEY = 'hellome_auth';
const USER_KEY = 'hellome_user';

export const DEFAULT_LOGIN_PHONE = '13800138000';

export const DEMO_ACCOUNT_PRESETS: DemoAccountPreset[] = [
  {
    label: '普通用户',
    role: 'user',
    phone: '13800138001',
    description: '只看结果导向前台，不能进入 Creator Studio 或 Admin。',
  },
  {
    label: '创作者',
    role: 'creator',
    phone: '13800138002',
    description: '可进入当前前台中的 Creator Studio，配置、调试、发布 UGC Skill。',
  },
  {
    label: '管理员',
    role: 'admin',
    phone: DEFAULT_LOGIN_PHONE,
    description: '可进入 Creator Studio 和 Boss Admin，用于数据、审核与协助处理。',
  },
];

const DEFAULT_USER: UserProfile = {
  name: '访客用户',
  phone: '',
  email: '',
  workspace: '个人空间',
  role: 'user',
};

function persistAuthState(authenticated: boolean, user: UserProfile | null): void {
  if (!authenticated || !user) {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function getUser(): UserProfile {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return DEFAULT_USER;

  try {
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: parsed.name || DEFAULT_USER.name,
      phone: parsed.phone || DEFAULT_USER.phone,
      email: parsed.email || DEFAULT_USER.email,
      workspace: parsed.workspace || DEFAULT_USER.workspace,
      role:
        parsed.role === 'admin' || parsed.role === 'creator' || parsed.role === 'user'
          ? parsed.role
          : DEFAULT_USER.role,
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function getUserRole(): UserRole {
  return getUser().role;
}

export function canAccessStudio(): boolean {
  const role = getUserRole();
  return role === 'creator' || role === 'admin';
}

export function canAccessAdmin(): boolean {
  return getUserRole() === 'admin';
}

export async function requestLoginCode(phone: string): Promise<SendCodeResult> {
  const response = await fetch('/api/auth/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: SendCodeResult;
    error?: string;
  };

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || '验证码发送失败');
  }

  return json.data;
}

export async function loginWithPhone(phone: string, code: string): Promise<UserProfile> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, code }),
  });

  const json = (await response.json()) as {
    success: boolean;
    data?: { user: UserProfile };
    error?: string;
  };

  if (!response.ok || !json.success || !json.data?.user) {
    throw new Error(json.error || '登录失败');
  }

  persistAuthState(true, json.data.user);
  return json.data.user;
}

export async function syncAuthSession(): Promise<UserProfile | null> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    const json = (await response.json()) as {
      success: boolean;
      data?: { authenticated: boolean; user?: UserProfile };
    };

    if (!response.ok || !json.success || !json.data?.authenticated || !json.data.user) {
      persistAuthState(false, null);
      return null;
    }

    persistAuthState(true, json.data.user);
    return json.data.user;
  } catch {
    return isAuthenticated() ? getUser() : null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    persistAuthState(false, null);
  }
}
