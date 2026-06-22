import {
  canAccessAdmin,
  canAccessStudio,
  DEMO_ACCOUNT_PRESETS,
  DEFAULT_LOGIN_PHONE as DEMO_PHONE,
  DEMO_VERIFICATION_CODE,
  getUser,
  getUserRole,
  isAuthenticated,
  isDemoVerificationCode,
  loginWithPhone as loginWithPhoneCore,
  logout as logoutCore,
  requestLoginCode,
  syncAuthSession as syncAuthSessionCore,
} from '../../复用组件库/auth-login-kit/frontend-auth-core';
import type {
  DemoAccountPreset,
  SendCodeResult,
  UserProfile,
  UserRole,
} from '../../复用组件库/auth-login-kit/auth-types';
import { initUsageForNewUser, syncUsageState } from './usageStore';
import { syncProfileOnLogin } from './profileStore';

export type { DemoAccountPreset, SendCodeResult, UserProfile, UserRole };
export {
  canAccessAdmin,
  canAccessStudio,
  DEMO_ACCOUNT_PRESETS,
  DEMO_PHONE,
  getUser,
  getUserRole,
  isAuthenticated,
  requestLoginCode,
};

/** 演示环境默认验证码 */
export const DEMO_CODE = DEMO_VERIFICATION_CODE;

function syncProjectSideEffects(user: UserProfile): void {
  syncProfileOnLogin(user.email || user.phone || 'guest');
  initUsageForNewUser();
  void syncUsageState();
}

export function verifyDemoCode(phone: string, code: string): boolean {
  return isDemoVerificationCode(phone, code);
}

export async function loginWithPhone(phone: string, code: string): Promise<UserProfile> {
  const user = await loginWithPhoneCore(phone, code);
  syncProjectSideEffects(user);
  return user;
}

export async function syncAuthSession(): Promise<UserProfile | null> {
  const user = await syncAuthSessionCore();
  if (user) {
    syncProjectSideEffects(user);
  }
  return user;
}

export async function logout(): Promise<void> {
  await logoutCore();
}
