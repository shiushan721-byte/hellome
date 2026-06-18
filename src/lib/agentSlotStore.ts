import type {
  DeactivateCheckResult,
  EnableCheckResult,
  UserAgentActivation,
} from '../types/agentSlots';
import { isSlotAgent } from '../types/agentSlots';
import { getPlanEntitlements } from './planEntitlements';
import { getUsage } from './usageStore';
import { getTasks } from './taskStore';

const ACTIVATIONS_KEY = 'hellome_agent_activations';

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

export function bumpAgentSlots(): void {
  notify();
}

function normalizeActivation(raw: UserAgentActivation): UserAgentActivation {
  if (raw.status === 'cooling_down' as string) {
    return { ...raw, status: 'inactive' };
  }
  return raw;
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
    activationsSnapshot = (JSON.parse(raw) as UserAgentActivation[]).map(normalizeActivation);
  } catch {
    activationsSnapshot = [];
  }
  return activationsSnapshot;
}

function getActivationsRaw(): UserAgentActivation[] {
  return readActivationsFromStorage();
}

function saveActivations(list: UserAgentActivation[]): void {
  localStorage.setItem(ACTIVATIONS_KEY, JSON.stringify(list));
  activationsSnapshot = list;
  activationsSnapshotRaw = localStorage.getItem(ACTIVATIONS_KEY);
  notify();
}

export function getActivations(): UserAgentActivation[] {
  return getActivationsRaw();
}

export function getActivation(agentId: string): UserAgentActivation | undefined {
  return getActivations().find((a) => a.agentId === agentId);
}

export function isAgentActive(agentId: string): boolean {
  return getActivation(agentId)?.status === 'active';
}

export function getOccupiedSlotCount(): number {
  return getActivations().filter((a) => a.status === 'active').length;
}

export function getActiveAgents(): UserAgentActivation[] {
  return getActivations().filter((a) => a.status === 'active');
}

/** @deprecated 冷却期已移除，始终返回空数组 */
export function getCoolingAgents(): UserAgentActivation[] {
  return [];
}

/** @deprecated 冷却期已移除 */
export function getSwapQuota(): { instantSwapUsed: number; instantSwapLimit: number } {
  return { instantSwapUsed: 0, instantSwapLimit: 0 };
}

function hasRunningTasksForAgent(agentId: string): boolean {
  const running = new Set(['running', 'waiting_confirmation']);
  return getTasks().some((t) => t.agentType === agentId && running.has(t.status));
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
    return {
      allowed: false,
      reason: 'slots_full',
      message: '当前套餐可同时启用的智能体名额已满，请先停用一个已启用智能体或升级套餐',
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
      message: '停用前需要先完成或取消当前任务。已消耗的 Token 会按实际执行情况结算。',
    };
  }

  return {
    allowed: true,
    message:
      '停用后会立即释放 1 个智能体名额。历史任务和结果仍可查看，但你将不能继续发起该智能体任务、继续生成或重新运行历史任务。已消耗的 Token 不会退回。',
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

  list[idx] = {
    ...list[idx],
    status: 'inactive',
    deactivatedAt: new Date().toISOString(),
  };
  saveActivations(list);
  return { ok: true };
}

export function recordAgentTaskCompletion(agentId: string, tokenUsed: number): void {
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

export function setAgentUsageStats(
  agentId: string,
  stats: { completedTaskCount: number; tokenUsed: number },
): void {
  const list = getActivationsRaw();
  const idx = list.findIndex((a) => a.agentId === agentId && a.status === 'active');
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    completedTaskCount: stats.completedTaskCount,
    tokenUsed: stats.tokenUsed,
  };
  saveActivations(list);
}

export function getAgentDisplayStatus(
  agentId: string,
  planAvailable: boolean,
): 'inactive' | 'active' | 'unavailable' {
  if (!planAvailable) return 'unavailable';
  const a = getActivation(agentId);
  if (a?.status === 'active') return 'active';
  return 'inactive';
}

export function clearAllActivationsForDebug(): void {
  saveActivations([]);
}
