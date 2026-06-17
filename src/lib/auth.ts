const AUTH_KEY = 'hellome_auth';
const USER_KEY = 'hellome_user';

/** 演示环境默认测试账号 */
export const DEMO_PHONE = '13800138000';
export const DEMO_CODE = '123456';

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  workspace: string;
}

const DEFAULT_USER: UserProfile = {
  name: '访客用户',
  phone: '',
  email: '',
  workspace: '个人空间',
};

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
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function verifyDemoCode(phone: string, code: string): boolean {
  const normalizedPhone = phone.replace(/\D/g, '');
  const demoPhone = DEMO_PHONE.replace(/\D/g, '');
  return normalizedPhone === demoPhone && code === DEMO_CODE;
}

export function loginWithPhone(phone: string): void {
  const digits = phone.replace(/\D/g, '');
  const displayName = digits.length >= 4 ? `用户 ${digits.slice(-4)}` : '用户';
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      name: displayName,
      phone: digits,
      email: '',
      workspace: '个人空间',
    }),
  );
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}
