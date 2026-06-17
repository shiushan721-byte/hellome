import type {
  AgentSwapQuota,
  DeactivateCheckResult,
  EnableCheckResult,
  SlotAgentId,
  UserAgentActivation,
} from '../types/agentSlots';
import { SLOT_RULES, isSlotAgent } from '../types/agentSlots';
import { getPlanEntitlements } from './planEntitlements';
import { getUsage } from './usageStore';
import { getTasks } from './taskStore';

const ACTIVATIONS_KEY = 'hellome_agent_activations';
const SWAP_KEY = 'hellome_agent_swap';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  activationsSnapshotRaw = '__stale__';
  listeners.forEach((fn) => fn());
}

export function subscribeAgentSlots(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 外部变更（如切换套餐）后刷新订阅方 */
export function bumpAgentSlots(): void {
  notify();
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getActivationsRaw(): UserAgentActivation[] {
  return readActivationsFromStorage();
}

let activationsSnapshot: UserAgentActivation[] = [];
let activationsSnapshotRaw: string | null = '__init__';

function readActivationsFromStorage(): UserAgentActivation[] {
  const raw = localStorage.getItem(ACTIVATIONS_KEY);
  if (raw === activationsSnapshotRaw) return activationsSnapshot;

  activationsSnapshotRaw = raw;
  if (!raw) {
    activationsSnapshot = [];
    return activationsSnapshot;
  }

  try {
    activationsSnapshot = JSON.parse(raw) as UserAgentActivation[];
  } catch {
    activationsSnapshot = [];
  }
  return activationsSnapshot;
}

function saveActivations(list: UserAgentActivation[]): void {
  localStorage.setItem(ACTIVATIONS_KEY, JSON.stringify(list));
  activationsSnapshot = list;
  activationsSnapshotRaw = localStorage.getItem(ACTIVATIONS_KEY);
  notify();
}

function getSwapQuotaRaw(): AgentSwapQuota {
  const raw = localStorage.getItem(SWAP_KEY);
  const plan = getPlanEntitlements(getUsage().planName);
  const month = currentMonth();
  if (!raw) {
    return { month, instantSwapUsed: 0, instantSwapLimit: plan.monthlyInstantSwapLimit };
  }
  try {
    const parsed = JSON.parse(raw) as AgentSwapQuota;
    if (parsed.month !== month) {
      return { month, instantSwapUsed: 0, instantSwapLimit: plan.monthlyInstantSwapLimit };
    }
    return {
      month,
      instantSwapUsed: parsed.instantSwapUsed ?? 0,
      instantSwapLimit: plan.monthlyInstantSwapLimit,
    };
  } catch {
    return { month, instantSwapUsed: 0, instantSwapLimit: plan.monthlyInstantSwapLimit };
  }
}

function saveSwapQuota(q: AgentSwapQuota): void {
  localStorage.setItem(SWAP_KEY, JSON.stringify(q));
  notify();
}

function expireCooling(activations: UserAgentActivation[]): UserAgentActivation[] {
  const now = Date.now();
  let changed = false;
  const next = activations.map((a) => {
    if (a.status === 'cooling_down' && a.slotReleaseAt && new Date(a.slotReleaseAt).getTime() <= now) {
      changed = true;
      return { ...a, status: 'inactive' as const, slotReleaseAt: undefined };
    }
    return a;
  });
  if (changed) {
    localStorage.setItem(ACTIVATIONS_KEY, JSON.stringify(next));
    activationsSnapshot = next;
    activationsSnapshotRaw = localStorage.getItem(ACTIVATIONS_KEY);
    notify();
  }
  return changed ? next : activations;
}

export function getActivations(): UserAgentActivation[] {
  return expireCooling(getActivationsRaw());
}

export function getActivation(agentId: string): UserAgentActivation | undefined {
  return getActivations().find((a) => a.agentId === agentId);
}

export function getSwapQuota(): AgentSwapQuota {
  return getSwapQuotaRaw();
}

export function isAgentActive(agentId: string): boolean {
  const a = getActivation(agentId);
  return a?.status === 'active';
}

export function getOccupiedSlotCount(now = Date.now()): number {
  return getActivations().filter((a) => {
    if (a.status === 'active') return true;
    if (a.status === 'cooling_down' && a.slotReleaseAt) {
      return new Date(a.slotReleaseAt).getTime() > now;
    }
    return false;
  }).length;
}

export function getActiveAgents(): UserAgentActivation[] {
  return getActivations().filter((a) => a.status === 'active');
}

export function getCoolingAgents(): UserAgentActivation[] {
  const now = Date.now();
  return getActivations().filter(
    (a) =>
      a.status === 'cooling_down' &&
      a.slotReleaseAt &&
      new Date(a.slotReleaseAt).getTime() > now,
  );
}

function hasRunningTasksForAgent(agentId: SlotAgentId): boolean {
  const running = new Set(['running', 'waiting_confirmation']);
  return getTasks().some(
    (t) => t.agentType === agentId && running.has(t.status),
  );
}

export function canEnableAgent(agentId: string, planAvailable = true): EnableCheckResult {
  if (!isSlotAgent(agentId)) {
    return { allowed: false, reason: 'unavailable', message: '该智能体暂不支持启用' };
  }
  if (!planAvailable) {
    return { allowed: false, reason: 'unavailable', message: '当前套餐不支持该智能体，请升级套餐' };
  }

  const existing = getActivation(agentId);
  if (existing?.status === 'active') {
    return { allowed: true, reason: 'already_active' };
  }

  const plan = getPlanEntitlements(getUsage().planName);
  const occupied = getOccupiedSlotCount();

  if (occupied >= plan.enabledAgentLimit) {
    const cooling = getCoolingAgents();
    if (cooling.length > 0) {
      const next = cooling.reduce((min, a) => {
        const t = new Date(a.slotReleaseAt!).getTime();
        return t < min ? t : min;
      }, Infinity);
      const hours = Math.ceil((next - Date.now()) / (60 * 60 * 1000));
      return {
        allowed: false,
        reason: 'cooling',
        message: `名额已满，有智能体名额将在约 ${hours} 小时后释放，或请停用其他智能体`,
      };
    }
    return {
      allowed: false,
      reason: 'slots_full',
      message: '可启用智能体名额已满，请停用一个已启用智能体或升级套餐',
    };
  }

  return { allowed: true };
}

export function canDeactivateAgent(agentId: string): DeactivateCheckResult {
  if (!isSlotAgent(agentId)) {
    return { allowed: false, message: '该智能体无法停用' };
  }

  const activation = getActivation(agentId);
  if (!activation || activation.status !== 'active') {
    return { allowed: false, message: '该智能体未启用' };
  }

  if (hasRunningTasksForAgent(agentId)) {
    return {
      allowed: false,
      hasRunningTasks: true,
      message: '该智能体还有进行中的任务，请先完成或取消任务后再停用',
    };
  }

  const activatedAt = activation.activatedAt
    ? new Date(activation.activatedAt).getTime()
    : 0;
  const inTrial =
    Date.now() - activatedAt < SLOT_RULES.trialWindowMs &&
    activation.completedTaskCount === 0 &&
    activation.tokenUsed < SLOT_RULES.trialTokenThreshold;

  if (inTrial) {
    return {
      allowed: true,
      mode: 'trial_release',
      message: '该智能体尚未完成正式任务，停用后会立即释放名额。历史记录仍会保留。',
    };
  }

  const swap = getSwapQuota();
  if (swap.instantSwapUsed < swap.instantSwapLimit) {
    return {
      allowed: true,
      mode: 'instant_swap',
      message: `你本月还有 ${swap.instantSwapLimit - swap.instantSwapUsed} 次即时更换机会，本次停用会立即释放名额。停用后不能继续发起新任务或重新运行，历史结果仍可查看。`,
    };
  }

  const releaseAt = new Date(Date.now() + SLOT_RULES.cooldownMs).toISOString();
  return {
    allowed: true,
    mode: 'cooldown',
    releaseAt,
    message:
      '你本月的即时更换机会已用完。确认停用后，该名额将在 24 小时后释放。停用后不能继续发起新任务或重新运行，历史结果仍可查看。',
  };
}

export function activateAgent(agentId: string): { ok: boolean; error?: string } {
  const check = canEnableAgent(agentId, true);
  if (!check.allowed && check.reason !== 'already_active') {
    return { ok: false, error: check.message };
  }
  if (check.reason === 'already_active') return { ok: true };

  const list = getActivationsRaw().filter((a) => a.agentId !== agentId);
  list.push({
    agentId,
    status: 'active',
    activatedAt: new Date().toISOString(),
    completedTaskCount: 0,
    tokenUsed: 0,
  });
  saveActivations(list);
  return { ok: true };
}

export function deactivateAgent(agentId: string): { ok: boolean; error?: string } {
  const check = canDeactivateAgent(agentId);
  if (!check.allowed) return { ok: false, error: check.message };

  const list = getActivationsRaw();
  const idx = list.findIndex((a) => a.agentId === agentId);
  if (idx < 0) return { ok: false, error: '未找到启用记录' };

  const prev = list[idx];
  const now = new Date().toISOString();

  if (check.mode === 'trial_release' || check.mode === 'instant_swap') {
    if (check.mode === 'instant_swap') {
      const swap = getSwapQuotaRaw();
      saveSwapQuota({ ...swap, instantSwapUsed: swap.instantSwapUsed + 1 });
    }
    list[idx] = {
      ...prev,
      status: 'inactive',
      deactivatedAt: now,
      slotReleaseAt: undefined,
    };
  } else {
    list[idx] = {
      ...prev,
      status: 'cooling_down',
      deactivatedAt: now,
      slotReleaseAt: check.releaseAt,
    };
  }

  saveActivations(list);
  return { ok: true };
}

export function recordAgentTaskCompletion(agentId: SlotAgentId, tokenUsed: number): void {
  const list = getActivationsRaw();
  const idx = list.findIndex((a) => a.agentId === agentId && a.status === 'active');
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    completedTaskCount: list[idx].completedTaskCount + 1,
    tokenUsed: list[idx].tokenUsed + tokenUsed,
  };
  saveActivations(list);
}

export function formatReleaseCountdown(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return '即将释放';
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 0) return `${h} 小时 ${m} 分钟`;
  return `${m} 分钟`;
}

export function getAgentDisplayStatus(
  agentId: string,
  planAvailable: boolean,
): 'inactive' | 'active' | 'cooling_down' | 'unavailable' {
  if (!planAvailable) return 'unavailable';
  const a = getActivation(agentId);
  if (!a || a.status === 'inactive') return 'inactive';
  if (a.status === 'active') return 'active';
  if (a.status === 'cooling_down' && a.slotReleaseAt && new Date(a.slotReleaseAt).getTime() > Date.now()) {
    return 'cooling_down';
  }
  return 'inactive';
}
