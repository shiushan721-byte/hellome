export type UserRole = 'user' | 'creator' | 'admin';

export interface DemoAccountPreset {
  label: string;
  role: UserRole;
  phone: string;
  description: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  workspace: string;
  role: UserRole;
}

export interface SendCodeResult {
  phone: string;
  expiresInSec: number;
  cooldownSec: number;
  testingCode?: string;
  simulated: boolean;
}

export interface DemoSession {
  id: string;
  user: UserProfile;
  createdAt: number;
}

export interface VerificationCodeRecord {
  code: string;
  phone: string;
  expiresAt: number;
  sentAt: number;
}
