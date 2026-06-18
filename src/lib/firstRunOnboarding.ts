import { getHermesConnection } from './hermesConnection';
import type { HermesConnectionSnapshot } from './hermesConnection';

export const HERMES_DOWNLOAD_URL = 'https://hermes.agentsyun.com/';

export type FirstRunHermesStatus =
  | 'not_connected'
  | 'waiting_pairing'
  | 'account_mismatch'
  | 'offline'
  | 'connected';

export interface FirstRunOnboardingState {
  helloMeAccountId: string;
  helloMeDisplayName: string;
  hermesStatus: FirstRunHermesStatus;
  hermesVersion?: string;
  deviceName?: string;
  lastCheckedAt?: string;
}

export function mapToFirstRunStatus(snapshot: HermesConnectionSnapshot): FirstRunHermesStatus {
  switch (snapshot.status) {
    case 'connected':
      return 'connected';
    case 'offline':
      return 'offline';
    case 'account_mismatch':
      return 'account_mismatch';
    case 'capability_missing':
      return 'not_connected';
    case 'not_paired':
    case 'pairing':
    default:
      return 'waiting_pairing';
  }
}

export function buildOnboardingState(
  snapshot: HermesConnectionSnapshot,
  accountId: string,
  displayName: string,
): FirstRunOnboardingState {
  return {
    helloMeAccountId: accountId,
    helloMeDisplayName: displayName,
    hermesStatus: mapToFirstRunStatus(snapshot),
    hermesVersion: snapshot.device?.version,
    deviceName: snapshot.device?.deviceName,
    lastCheckedAt: snapshot.device?.lastSeenAt,
  };
}

export function isHermesConnected(): boolean {
  return getHermesConnection().status === 'connected';
}

export function isWorkbenchNavRestricted(): boolean {
  return false;
}

export function isWorkbenchPathBlocked(_pathname: string): boolean {
  return false;
}

export function getNavDisabledReason(): string {
  return '请先完成 Hz-Hermes 配对';
}

export function getPostPairingPath(): string {
  return '/app';
}
