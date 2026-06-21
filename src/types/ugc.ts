export type TaskExecutionMode = 'backend_silent' | 'local_debug';

export type TaskArtifactType = 'video' | 'image' | 'script' | 'report' | 'audio';

export type TaskRunState =
  | 'queued'
  | 'running'
  | 'waiting_confirmation'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskPauseReasonType =
  | 'confirmation'
  | 'context_limit'
  | 'provider_error'
  | 'missing_input'
  | 'timeout';

export type TaskResumeMode =
  | 'continue'
  | 'retry_step'
  | 'require_input'
  | 'require_creator_fix';

export interface TaskRecoveryState {
  runState: Extract<TaskRunState, 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed'>;
  pauseReasonType?: TaskPauseReasonType;
  pauseReasonMessage?: string;
  resumeMode?: TaskResumeMode;
  recoverable?: boolean;
  artifactsPreserved?: string[];
  willChargeAgain?: boolean;
}

export interface UgcRoutePlan {
  id: string;
  label: string;
  providerHint: string;
  reason: string;
}

export interface UgcTaskInput {
  skillId?: string;
  productImageUrl?: string;
  productImageName?: string;
  talentImageUrl?: string;
  talentImageName?: string;
  sellingPoint: string;
  platform: string;
  effectGoal: string;
  referenceUrl?: string;
}

export interface UgcSystemUnderstanding {
  targetAudience: string;
  videoStyle: string;
  coreAngle: string;
  outputGoal: string;
  draftScript: string;
}

export interface UgcTaskArtifact {
  id: string;
  type: TaskArtifactType;
  label: string;
  fileName: string;
  url?: string;
  mimeType?: string;
}

export interface UgcTaskEvent {
  id: string;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
