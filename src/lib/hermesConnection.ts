import { getUser } from './auth';

const HERMES_CONNECTION_KEY = 'hellome_hermes_connection';

export type HermesConnectionStatus =
  | 'not_paired'
  | 'pairing'
  | 'connected'
  | 'me_running'
  | 'offline'
  | 'account_mismatch'
  | 'version_unsupported'
  | 'capability_missing'
  | 'api_unavailable';

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
export type HermesDebugPreset =
  | 'first_run_empty'
  | 'not_installed'
  | 'not_paired'
  | 'account_mismatch'
  | 'offline'
  | 'paired'
  | 'me_running';

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

export function setHermesConnectionSnapshot(next: HermesConnectionSnapshot): void {
  setHermesConnection(next);
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
  void syncHermesConnection();
  return current;
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
      id: 'Hz-Hermes',
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

export async function syncHermesConnection(): Promise<HermesConnectionSnapshot> {
  const accountId = getCurrentAccountId();
  try {
    const response = await fetch(`/api/hermes/pairing/status?accountId=${encodeURIComponent(accountId)}`);
    const json = (await response.json()) as {
      success: boolean;
      data?: HermesConnectionSnapshot;
      error?: string;
    };
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.error || '读取 Hermes 配对状态失败');
    }
    setHermesConnection(json.data);
    return json.data;
  } catch (error) {
    const fallback: HermesConnectionSnapshot = {
      status: 'api_unavailable',
      device: null,
      lastError: error instanceof Error ? error.message : 'Hermes 检测服务暂时不可用',
    };
    setHermesConnection(fallback);
    return fallback;
  }
}

export async function pairHermesLocallyWithCurrentAccount(
  displayName?: string,
): Promise<HermesConnectionSnapshot> {
  const accountId = getCurrentAccountId();
  const response = await fetch('/api/hermes/pairing/local-pair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      displayName,
    }),
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: HermesConnectionSnapshot;
    error?: string;
  };
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || 'Hermes 本机配对失败');
  }
  setHermesConnection(json.data);
  return json.data;
}

export async function disconnectHermesCurrentAccount(): Promise<HermesConnectionSnapshot> {
  const accountId = getCurrentAccountId();
  const response = await fetch('/api/hermes/pairing/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });
  const json = (await response.json()) as {
    success: boolean;
    data?: HermesConnectionSnapshot;
    error?: string;
  };
  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.error || '解除 Hermes 配对失败');
  }
  setHermesConnection(json.data);
  return json.data;
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

  if (preset === 'first_run_empty' || preset === 'not_paired') {
    const next: HermesConnectionSnapshot = {
      status: 'not_paired',
      device: null,
    };
    setHermesConnection(next);
    return next;
  }

  if (preset === 'not_installed') {
    const next: HermesConnectionSnapshot = {
      status: 'capability_missing',
      device: null,
      lastError: '未安装 Hz-Hermes',
    };
    setHermesConnection(next);
    return next;
  }

  if (preset === 'account_mismatch') {
    const next: HermesConnectionSnapshot = {
      status: 'account_mismatch',
      device: {
        id: 'Hz-Hermes',
        deviceName: '其他设备',
        os: 'windows',
        version: 'v0.2.3',
        accountEmail: 'other@example.com',
        pairedAt: now,
        lastSeenAt: now,
        status: 'account_mismatch',
        capabilities: ['browser_automation'],
      },
      lastError: '账号不一致，无法配对',
    };
    setHermesConnection(next);
    return next;
  }

  if (preset === 'offline') {
    pairHermesWithCurrentAccount();
    return markHermesOffline();
  }

  if (preset === 'me_running') {
    const next: HermesConnectionSnapshot = {
      status: 'me_running',
      device: {
        id: 'Hz-Hermes',
        deviceName: 'Shiushan 的电脑',
        os: 'macos',
        version: 'v0.2.3',
        accountEmail: account || 'debug@example.com',
        pairedAt: now,
        lastSeenAt: now,
        status: 'me_running',
        capabilities: ['browser_automation', 'webchat_bridge', 'file_access', 'message_platforms'],
      },
    };
    setHermesConnection(next);
    return next;
  }

  const next: HermesConnectionSnapshot = {
    status: 'connected',
    device: {
      id: 'Hz-Hermes',
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
