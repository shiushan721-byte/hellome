import type { TaskExecutionMode, TaskRecoveryState, UgcRoutePlan, UgcSystemUnderstanding, UgcTaskArtifact, UgcTaskInput } from '../types/ugc';
import type { HermesLogEntry, Task, TaskStep, TaskStatus } from '../types/workbench';

export interface PresentUgcTaskInput {
  id: string;
  name: string;
  agentType?: Task['agentType'];
  status: TaskStatus;
  executionMode?: TaskExecutionMode;
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  estimatedTokenMin: number;
  estimatedTokenMax: number;
  tokenUsed: number;
  currentTokenUsed?: number;
  costEstimate?: string;
  input?: UgcTaskInput;
  steps?: TaskStep[];
  logs?: HermesLogEntry[];
  understanding?: UgcSystemUnderstanding;
  routePlan?: UgcRoutePlan;
  artifacts?: UgcTaskArtifact[];
  recoveryState?: TaskRecoveryState;
  pendingConfirmation?: Task['pendingConfirmation'];
}

export function presentUgcTask(task: PresentUgcTaskInput): Task {
  return {
    id: task.id,
    name: task.name,
    agentType: task.agentType ?? 'media',
    status: task.status,
    executionMode: task.executionMode,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    durationMs: task.durationMs,
    estimatedTokenMin: task.estimatedTokenMin,
    estimatedTokenMax: task.estimatedTokenMax,
    tokenUsed: task.tokenUsed,
    currentTokenUsed: task.currentTokenUsed ?? 0,
    costEstimate: task.costEstimate,
    input: task.input,
    steps: task.steps ?? [],
    logs: task.logs ?? [],
    understanding: task.understanding,
    routePlan: task.routePlan,
    artifacts: task.artifacts ?? [],
    recoveryState: task.recoveryState,
    pendingConfirmation: task.pendingConfirmation,
  };
}
