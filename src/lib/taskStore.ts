import type { GeoTaskInput, Task, TaskStep } from '../types/workbench';
import { GEO_STEPS } from '../types/workbench';
import { estimateGeoTokens } from './tokenBilling';
import { ensureDemoTasks } from './taskSeed';

const TASKS_KEY = 'hellome_tasks';
const EMPTY_TASKS: Task[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

let snapshot: Task[] = EMPTY_TASKS;
let snapshotRaw: string | null = '__init__';

function normalizeTask(raw: Task & Record<string, unknown>): Task {
  const geoInput = isGeoTaskInput(raw.input) ? raw.input : undefined;
  const est =
    raw.estimatedTokenMin != null
      ? { min: Number(raw.estimatedTokenMin), max: Number(raw.estimatedTokenMax) }
      : geoInput
        ? estimateGeoTokens(geoInput)
        : { min: 12000, max: 25000 };

  return {
    ...raw,
    estimatedTokenMin: est.min,
    estimatedTokenMax: est.max,
    tokenUsed: Number(raw.tokenUsed ?? 0),
    currentTokenUsed: raw.currentTokenUsed != null ? Number(raw.currentTokenUsed) : undefined,
    steps: (raw.steps ?? []).map((s) => ({
      ...s,
      tokenUsed: s.tokenUsed != null ? Number(s.tokenUsed) : undefined,
    })),
  };
}

function isGeoTaskInput(input: Task['input']): input is GeoTaskInput {
  return Boolean(
    input &&
      typeof input === 'object' &&
      'brandName' in input &&
      'websiteUrl' in input,
  );
}

function readTasksFromStorage(): Task[] {
  ensureDemoTasks();
  const raw = localStorage.getItem(TASKS_KEY);
  if (raw === snapshotRaw) return snapshot;

  snapshotRaw = raw;
  if (!raw) {
    snapshot = EMPTY_TASKS;
    return snapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Task[];
    snapshot = Array.isArray(parsed) ? parsed.map((t) => normalizeTask(t as Task & Record<string, unknown>)) : EMPTY_TASKS;
  } catch {
    snapshot = EMPTY_TASKS;
  }
  return snapshot;
}

function notify(): void {
  snapshotRaw = '__stale__';
  listeners.forEach((fn) => fn());
}

export function subscribeTasks(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTasks(): Task[] {
  return readTasksFromStorage();
}

export function getTask(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id);
}

export function saveTask(task: Task): void {
  const tasks = [...getTasks()];
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) tasks[idx] = task;
  else tasks.unshift(task);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  notify();
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter((t) => t.id !== id);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  notify();
}

const RUNNING_STATUSES = new Set(['running', 'waiting_confirmation']);

export function getRunningTasksForAgent(agentId: string): Task[] {
  return getTasks().filter((t) => t.agentType === agentId && RUNNING_STATUSES.has(t.status));
}

/** 取消智能体下所有进行中的任务，返回取消数量 */
export function cancelRunningTasksForAgent(agentId: string): number {
  const running = getRunningTasksForAgent(agentId);
  for (const task of running) {
    saveTask({
      ...task,
      status: 'cancelled',
      pendingConfirmation: undefined,
    });
  }
  return running.length;
}

function buildSteps(): TaskStep[] {
  return GEO_STEPS.map((name, i) => ({
    id: `step-${i}`,
    name,
    status: 'pending' as const,
  }));
}

export function createGeoTask(input: GeoTaskInput): Task {
  const est = estimateGeoTokens(input);
  const task: Task = {
    id: `task-${Date.now()}`,
    name: `${input.brandName} GEO 可见度检测`,
    agentType: 'geo',
    status: 'running',
    createdAt: new Date().toISOString(),
    estimatedTokenMin: est.min,
    estimatedTokenMax: est.max,
    tokenUsed: 0,
    currentTokenUsed: 0,
    input,
    steps: buildSteps(),
    logs: [],
  };
  saveTask(task);
  return task;
}

export function duplicateTask(id: string): Task | undefined {
  const source = getTask(id);
  if (!isGeoTaskInput(source?.input)) return undefined;
  return createGeoTask(source.input);
}
