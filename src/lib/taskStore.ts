import type { GeoTaskInput, Task, TaskStep } from '../types/workbench';
import { GEO_STEPS } from '../types/workbench';

const TASKS_KEY = 'hellome_tasks';
const EMPTY_TASKS: Task[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

let snapshot: Task[] = EMPTY_TASKS;
let snapshotRaw: string | null = '__init__';

function readTasksFromStorage(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY);
  if (raw === snapshotRaw) return snapshot;

  snapshotRaw = raw;
  if (!raw) {
    snapshot = EMPTY_TASKS;
    return snapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Task[];
    snapshot = Array.isArray(parsed) ? parsed : EMPTY_TASKS;
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

function buildSteps(): TaskStep[] {
  return GEO_STEPS.map((name, i) => ({
    id: `step-${i}`,
    name,
    status: 'pending' as const,
  }));
}

export function createGeoTask(input: GeoTaskInput): Task {
  const task: Task = {
    id: `task-${Date.now()}`,
    name: `${input.brandName} GEO 可见度检测`,
    agentType: 'geo',
    status: 'running',
    createdAt: new Date().toISOString(),
    costType: 'GEO 检测次数',
    costAmount: input.depth === 'deep' ? 2 : 1,
    input,
    steps: buildSteps(),
    logs: [],
  };
  saveTask(task);
  return task;
}

export function duplicateTask(id: string): Task | undefined {
  const source = getTask(id);
  if (!source?.input) return undefined;
  return createGeoTask(source.input);
}
