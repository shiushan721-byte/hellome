import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { HermesConnectionSnapshot } from '../lib/hermesConnection';

const execFileAsync = promisify(execFile);
const HERMES_ROOT = '/Users/feihong/.hermes/hermes-agent';
const HERMES_PYTHON = '/Users/feihong/.hermes/hermes-agent/venv/bin/python';
const HERMES_APP = '/Applications/Hermes.app';
const PLATFORM = 'hellome';

type PairingPayload = {
  accountId: string;
  displayName?: string;
};

type PythonPairingStatus = {
  approved: boolean;
  hasPending: boolean;
  userName?: string;
  approvedAt?: number;
};

function hasHermesRuntime(): boolean {
  return fs.existsSync(HERMES_PYTHON) && fs.existsSync(HERMES_ROOT);
}

function buildSnapshot(
  accountId: string,
  status: HermesConnectionSnapshot['status'],
  options?: {
    version?: string | null;
    deviceName?: string;
    lastError?: string;
    approvedAt?: number;
  },
): HermesConnectionSnapshot {
  return {
    status,
    device:
      status === 'not_paired' || status === 'capability_missing'
        ? null
        : {
            id: 'Hz-Hermes',
            deviceName: options?.deviceName ?? 'Hermes.app',
            os: 'macos',
            version: options?.version ?? 'unknown',
            accountEmail: accountId,
            pairedAt: options?.approvedAt
              ? new Date(options.approvedAt * 1000).toISOString()
              : new Date().toISOString(),
            lastSeenAt: new Date().toISOString(),
            status,
            capabilities: ['browser_automation', 'webchat_bridge', 'file_access', 'message_platforms'],
          },
    lastError: options?.lastError,
  };
}

async function getHermesVersion(): Promise<string | null> {
  try {
    const result = await execFileAsync('hermes', ['--version'], { timeout: 5000 });
    return result.stdout.trim() || result.stderr.trim() || null;
  } catch {
    return null;
  }
}

async function runHermesPairingPython(
  action: 'status' | 'pair_local' | 'revoke',
  payload: PairingPayload,
): Promise<PythonPairingStatus> {
  const script = `
import json, sys
from gateway.pairing import PairingStore

platform = sys.argv[1]
action = sys.argv[2]
account = sys.argv[3]
name = sys.argv[4] if len(sys.argv) > 4 else ""

store = PairingStore()

def get_status():
    approved = store.is_approved(platform, account)
    approved_list = store.list_approved(platform)
    pending_list = store.list_pending(platform)
    matched = next((item for item in approved_list if item.get("user_id") == account), None)
    pending = any(item.get("user_id") == account for item in pending_list)
    print(json.dumps({
        "approved": approved,
        "hasPending": pending,
        "userName": (matched or {}).get("user_name") or name,
        "approvedAt": (matched or {}).get("approved_at"),
    }))

if action == "status":
    get_status()
elif action == "pair_local":
    store._approve_user(platform, account, name)
    get_status()
elif action == "revoke":
    store.revoke(platform, account)
    get_status()
else:
    raise SystemExit("unknown action")
`.trim();

  const result = await execFileAsync(
    HERMES_PYTHON,
    ['-c', script, PLATFORM, action, payload.accountId, payload.displayName ?? ''],
    {
      cwd: HERMES_ROOT,
      timeout: 10000,
    },
  );

  return JSON.parse(result.stdout.trim()) as PythonPairingStatus;
}

export async function getHermesPairingStatus(accountId: string): Promise<HermesConnectionSnapshot> {
  if (!hasHermesRuntime()) {
    return {
      status: 'capability_missing',
      device: null,
      lastError: '未检测到可用的 Hermes 本地运行时',
    };
  }

  if (!accountId.trim()) {
    return {
      status: 'account_mismatch',
      device: null,
      lastError: '当前 HelloMe 账号为空，无法完成配对',
    };
  }

  const [pairing, version] = await Promise.all([
    runHermesPairingPython('status', { accountId }),
    getHermesVersion(),
  ]);

  if (pairing.approved) {
    return buildSnapshot(accountId, 'connected', {
      version,
      deviceName: fs.existsSync(HERMES_APP) ? 'Hermes.app' : 'Hermes CLI',
      approvedAt: pairing.approvedAt,
    });
  }

  if (pairing.hasPending) {
    return buildSnapshot(accountId, 'pairing', {
      version,
      deviceName: fs.existsSync(HERMES_APP) ? 'Hermes.app' : 'Hermes CLI',
    });
  }

  return {
    status: 'not_paired',
    device: null,
  };
}

export async function pairHermesLocally(payload: PairingPayload): Promise<HermesConnectionSnapshot> {
  if (!hasHermesRuntime()) {
    return {
      status: 'capability_missing',
      device: null,
      lastError: '未检测到 Hermes 本地运行时，无法完成本机配对',
    };
  }

  const version = await getHermesVersion();
  const result = await runHermesPairingPython('pair_local', payload);
  if (!result.approved) {
    return {
      status: 'not_paired',
      device: null,
      lastError: 'Hermes 本机配对未成功',
    };
  }

  return buildSnapshot(payload.accountId, 'connected', {
    version,
    deviceName: fs.existsSync(HERMES_APP) ? 'Hermes.app' : 'Hermes CLI',
    approvedAt: result.approvedAt,
  });
}

export async function revokeHermesPairing(accountId: string): Promise<HermesConnectionSnapshot> {
  if (!hasHermesRuntime()) {
    return {
      status: 'capability_missing',
      device: null,
      lastError: '未检测到 Hermes 本地运行时',
    };
  }

  await runHermesPairingPython('revoke', { accountId });
  return {
    status: 'not_paired',
    device: null,
  };
}
