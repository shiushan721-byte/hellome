import type { TaskPauseReasonType, TaskRecoveryState, TaskResumeMode, TaskRunState } from '../types/ugc';
import type { TaskStatus } from '../types/workbench';
import type { HermesStructuredRun } from './hermesContract';

type DeriveableCurrentStatus = Exclude<TaskStatus, 'draft'>;

export interface DeriveTaskRunStateInput {
  currentStatus: DeriveableCurrentStatus;
  hermes: Pick<HermesStructuredRun, 'runState' | 'pauseReasonType' | 'recoverable' | 'resumeMode'> &
    Partial<Pick<HermesStructuredRun, 'pauseReasonMessage' | 'artifactsPreserved' | 'costStatus'>>;
}

export interface DerivedTaskRunState {
  status: DeriveableCurrentStatus;
  pendingConfirmation?: {
    title: string;
    message: string;
    action: string;
  };
  recoveryState?: TaskRecoveryState;
}

function buildRecoveryState(input: {
  runState: Extract<TaskRunState, 'running' | 'waiting_confirmation' | 'interrupted' | 'completed' | 'failed'>;
  pauseReasonType?: TaskPauseReasonType;
  pauseReasonMessage?: string;
  resumeMode?: TaskResumeMode;
  recoverable?: boolean;
  artifactsPreserved?: string[];
  willChargeAgain?: boolean;
}): TaskRecoveryState {
  return {
    runState: input.runState,
    pauseReasonType: input.pauseReasonType,
    pauseReasonMessage: input.pauseReasonMessage,
    resumeMode: input.resumeMode,
    recoverable: input.recoverable,
    artifactsPreserved: input.artifactsPreserved,
    willChargeAgain: input.willChargeAgain,
  };
}

export function deriveTaskRunState(input: DeriveTaskRunStateInput): DerivedTaskRunState {
  const willChargeAgain = input.hermes.costStatus?.willChargeAgain;

  if (input.hermes.runState === 'waiting_confirmation') {
    return {
      status: 'waiting_confirmation',
      pendingConfirmation: {
        title: '等待确认',
        message: input.hermes.pauseReasonMessage || '当前步骤需要你确认后继续。',
        action: '确认继续',
      },
      recoveryState: buildRecoveryState({
        runState: 'waiting_confirmation',
        pauseReasonType: input.hermes.pauseReasonType,
        pauseReasonMessage: input.hermes.pauseReasonMessage,
        resumeMode: input.hermes.resumeMode,
        recoverable: input.hermes.recoverable,
        artifactsPreserved: input.hermes.artifactsPreserved,
        willChargeAgain,
      }),
    };
  }

  if (input.hermes.runState === 'interrupted') {
    return {
      status: 'failed',
      recoveryState: buildRecoveryState({
        runState: 'interrupted',
        pauseReasonType: input.hermes.pauseReasonType,
        pauseReasonMessage: input.hermes.pauseReasonMessage,
        resumeMode: input.hermes.resumeMode,
        recoverable: input.hermes.recoverable,
        artifactsPreserved: input.hermes.artifactsPreserved,
        willChargeAgain,
      }),
    };
  }

  if (input.hermes.runState === 'completed') {
    return {
      status: 'completed',
      recoveryState: buildRecoveryState({
        runState: 'completed',
        artifactsPreserved: input.hermes.artifactsPreserved,
        willChargeAgain,
      }),
    };
  }

  if (input.hermes.runState === 'failed') {
    return {
      status: 'failed',
      recoveryState: buildRecoveryState({
        runState: 'failed',
        pauseReasonType: input.hermes.pauseReasonType,
        pauseReasonMessage: input.hermes.pauseReasonMessage,
        resumeMode: input.hermes.resumeMode,
        recoverable: input.hermes.recoverable,
        artifactsPreserved: input.hermes.artifactsPreserved,
        willChargeAgain,
      }),
    };
  }

  if (input.hermes.runState === 'running') {
    return {
      status: 'running',
      recoveryState: buildRecoveryState({
        runState: 'running',
        pauseReasonType: input.hermes.pauseReasonType,
        pauseReasonMessage: input.hermes.pauseReasonMessage,
        resumeMode: input.hermes.resumeMode,
        recoverable: input.hermes.recoverable,
        artifactsPreserved: input.hermes.artifactsPreserved,
        willChargeAgain,
      }),
    };
  }

  return {
    status: input.currentStatus,
  };
}
