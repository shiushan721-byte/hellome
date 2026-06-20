import type { TaskPauseReasonType, TaskResumeMode, TaskRunState } from '../types/ugc';

type HermesRecoverableRunState = Extract<
  TaskRunState,
  'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed'
>;

export interface HermesStructuredRun {
  runState: HermesRecoverableRunState;
  pauseReasonType: TaskPauseReasonType;
  pauseReasonMessage: string;
  resumeMode: TaskResumeMode;
  recoverable: boolean;
  artifactsPreserved: string[];
  costStatus: {
    charged: boolean;
    willChargeAgain: boolean;
  };
}

const VALID_RUN_STATES = new Set<HermesStructuredRun['runState']>([
  'running',
  'waiting_confirmation',
  'interrupted',
  'completed',
  'failed',
]);

const VALID_PAUSE_REASON_TYPES = new Set<TaskPauseReasonType>([
  'confirmation',
  'context_limit',
  'provider_error',
  'missing_input',
  'timeout',
]);

const VALID_RESUME_MODES = new Set<TaskResumeMode>([
  'continue',
  'retry_step',
  'require_input',
  'require_creator_fix',
]);

const FALLBACK_HERMES_RUN: HermesStructuredRun = {
  runState: 'interrupted',
  pauseReasonType: 'provider_error',
  pauseReasonMessage: '执行结果异常，可从上一步恢复',
  resumeMode: 'retry_step',
  recoverable: true,
  artifactsPreserved: [],
  costStatus: {
    charged: false,
    willChargeAgain: false,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRunState(value: unknown): HermesStructuredRun['runState'] {
  return typeof value === 'string' && VALID_RUN_STATES.has(value as HermesStructuredRun['runState'])
    ? (value as HermesStructuredRun['runState'])
    : FALLBACK_HERMES_RUN.runState;
}

function getPauseReasonType(value: unknown): TaskPauseReasonType {
  return typeof value === 'string' && VALID_PAUSE_REASON_TYPES.has(value as TaskPauseReasonType)
    ? (value as TaskPauseReasonType)
    : FALLBACK_HERMES_RUN.pauseReasonType;
}

function getResumeMode(value: unknown): TaskResumeMode {
  return typeof value === 'string' && VALID_RESUME_MODES.has(value as TaskResumeMode)
    ? (value as TaskResumeMode)
    : FALLBACK_HERMES_RUN.resumeMode;
}

export function normalizeHermesRunPayload(payload: unknown): HermesStructuredRun {
  if (!isRecord(payload)) {
    return FALLBACK_HERMES_RUN;
  }

  const costStatus = isRecord(payload.costStatus) ? payload.costStatus : {};

  return {
    runState: getRunState(payload.runState),
    pauseReasonType: getPauseReasonType(payload.pauseReasonType),
    pauseReasonMessage:
      typeof payload.pauseReasonMessage === 'string' && payload.pauseReasonMessage.trim().length > 0
        ? payload.pauseReasonMessage
        : FALLBACK_HERMES_RUN.pauseReasonMessage,
    resumeMode: getResumeMode(payload.resumeMode),
    recoverable: typeof payload.recoverable === 'boolean' ? payload.recoverable : FALLBACK_HERMES_RUN.recoverable,
    artifactsPreserved: Array.isArray(payload.artifactsPreserved)
      ? payload.artifactsPreserved.filter((item): item is string => typeof item === 'string')
      : FALLBACK_HERMES_RUN.artifactsPreserved,
    costStatus: {
      charged: typeof costStatus.charged === 'boolean' ? costStatus.charged : FALLBACK_HERMES_RUN.costStatus.charged,
      willChargeAgain:
        typeof costStatus.willChargeAgain === 'boolean'
          ? costStatus.willChargeAgain
          : FALLBACK_HERMES_RUN.costStatus.willChargeAgain,
    },
  };
}
