import { getUser } from './auth';

const HERMES_CONNECTION_KEY = 'hellome_hermes_connection';

export type HermesConnectionStatus =
  | 'not_paired'
  | 'pairing'
  | 'connected'
  | 'offline'
  | 'account_mismatch'
  | 'version_unsupported'
  | 'capability_missing';

type HermesCapability =
  | 'browser_automation'
  | 'webchat_bridge'
  | 'file_access'
  | 'message_platforms';

export interface HermesDevice {
  id: string;
  deviceName: string;
  os: 'windows' | 'macos' | 'linux';
  version: string;
  accountEmail: string;
  pairedAt: string;
  lastSeenAt: string;
  status: HermesConnectionStatus;
  capabilities: HermesCapability[];
}

export interface HermesConnectionSnapshot {
  status: HermesConnectionStatus;
  device: HermesDevice | null;
  lastError?: string;
}
export type HermesDebugPreset = 'not_installed' | 'not_paired' | 'paired';

const DEFAULT_SNAPSHOT: HermesConnectionSnapshot = {
  status: 'not_paired',
  device: null,
};
let cachedRaw: string | null = null;
let cachedSnapshot: HermesConnectionSnapshot = DEFAULT_SNAPSHOT;
let cacheInitialized = false;

export function getCurrentAccountId(): string {
  const user = getUser();
  return (user.email || user.phone || '').trim();
}

export function getHermesConnection(): HermesConnectionSnapshot {
  try {
    const raw = localStorage.getItem(HERMES_CONNECTION_KEY);
    if (cacheInitialized && raw === cachedRaw) {
      return cachedSnapshot;
    }
    cacheInitialized = true;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = DEFAULT_SNAPSHOT;
      return cachedSnapshot;
    }
    const parsed = JSON.parse(raw) as HermesConnectionSnapshot;
    if (!parsed || !parsed.status) {
      cachedSnapshot = DEFAULT_SNAPSHOT;
      return cachedSnapshot;
    }
    cachedSnapshot = parsed;
    return cachedSnapshot;
  } catch {
    cachedSnapshot = DEFAULT_SNAPSHOT;
    return cachedSnapshot;
  }
}

function setHermesConnection(next: HermesConnectionSnapshot): void {
  cachedSnapshot = next;
  cachedRaw = JSON.stringify(next);
  cacheInitialized = true;
  try {
    localStorage.setItem(HERMES_CONNECTION_KEY, cachedRaw);
  } catch {
    // ignore persistence failures to avoid runtime crash
  }
  try {
    window.dispatchEvent(new Event('hermes-connection-updated'));
  } catch {
    // ignore event dispatch failures
  }
}

export function subscribeHermesConnection(onStoreChange: () => void): () => void {
  const listener = () => onStoreChange();
  try {
    window.addEventListener('storage', listener);
    window.addEventListener('hermes-connection-updated', listener);
  } catch {
    return () => {};
  }
  return () => {
    try {
      window.removeEventListener('storage', listener);
      window.removeEventListener('hermes-connection-updated', listener);
    } catch {
      // no-op
    }
  };
}

export function refreshHermesConnection(): HermesConnectionSnapshot {
  const current = getHermesConnection();
  if (!current.device) return current;
  const account = getCurrentAccountId();
  if (!account) return current;
  if (current.device.accountEmail !== account) {
    const next: HermesConnectionSnapshot = {
      ...current,
      status: 'account_mismatch',
      lastError: '账号不一致，无法配对',
    };
    setHermesConnection(next);
    return next;
  }
  if (current.status === 'offline') return current;
  const next: HermesConnectionSnapshot = {
    ...current,
    status: 'connected',
    device: {
      ...current.device,
      status: 'connected',
      lastSeenAt: new Date().toISOString(),
    },
    lastError: undefined,
  };
  setHermesConnection(next);
  return next;
}

export function pairHermesWithCurrentAccount(): HermesConnectionSnapshot {
  const account = getCurrentAccountId();
  if (!account) {
    const failed: HermesConnectionSnapshot = {
      status: 'account_mismatch',
      device: null,
      lastError: '账号不一致，无法配对',
    };
    setHermesConnection(failed);
    return failed;
  }
  const now = new Date().toISOString();
  const next: HermesConnectionSnapshot = {
    status: 'connected',
    device: {
      id: 'HZ-HERMES',
      deviceName: 'Shiushan 的电脑',
      os: 'macos',
      version: 'v0.2.3',
      accountEmail: account,
      pairedAt: now,
      lastSeenAt: now,
      status: 'connected',
      capabilities: ['browser_automation', 'webchat_bridge', 'file_access', 'message_platforms'],
    },
  };
  setHermesConnection(next);
  return next;
}

export function markHermesOffline(): HermesConnectionSnapshot {
  const current = getHermesConnection();
  if (!current.device) return current;
  const next: HermesConnectionSnapshot = {
    ...current,
    status: 'offline',
    device: {
      ...current.device,
      status: 'offline',
    },
  };
  setHermesConnection(next);
  return next;
}

export function clearHermesPairing(): void {
  setHermesConnection(DEFAULT_SNAPSHOT);
}

export function applyHermesDebugPreset(preset: HermesDebugPreset): HermesConnectionSnapshot {
  const account = getCurrentAccountId();
  const now = new Date().toISOString();
  if (preset === 'not_installed') {
    const next: HermesConnectionSnapshot = {
      status: 'capability_missing',
      device: null,
      lastError: '未安装 Hermes',
    };
    setHermesConnection(next);
    return next;
  }
  if (preset === 'not_paired') {
    const next: HermesConnectionSnapshot = {
      status: 'not_paired',
      device: null,
    };
    setHermesConnection(next);
    return next;
  }
  const next: HermesConnectionSnapshot = {
    status: 'connected',
    device: {
      id: 'HZ-HERMES',
      deviceName: 'Shiushan 的电脑',
      os: 'macos',
      version: 'v0.2.3',
      accountEmail: account || 'debug@example.com',
      pairedAt: now,
      lastSeenAt: now,
      status: 'connected',
      capabilities: ['browser_automation', 'webchat_bridge', 'file_access', 'message_platforms'],
    },
  };
  setHermesConnection(next);
  return next;
}
