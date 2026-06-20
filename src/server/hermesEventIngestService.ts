import type { Prisma, TaskStatus } from '@prisma/client';
import type { TaskPauseReasonType, TaskResumeMode } from '../types/ugc';
import {
  normalizeHermesRunPayload,
  normalizeHermesTaskEventEnvelope,
  type HermesTaskEventEnvelope,
} from './hermesContract';
import { deriveTaskRunState } from './taskStateMachine';
import { validateExecutionGrantToken, ExecutionGrantError } from './executionGrantService';
import { loadUgcTaskAggregate, persistUgcTaskAggregate, type UgcTaskAggregateRecord } from './ugcTaskService';

export class HermesEventIngestError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'INVALID' | 'GRANT' = 'INVALID',
  ) {
    super(message);
    this.name = 'HermesEventIngestError';
  }
}

const TERMINAL_STATUSES = new Set<TaskStatus>(['completed', 'failed', 'cancelled']);

function eventLevel(eventType: string): 'info' | 'success' | 'warning' | 'error' {
  if (eventType === 'task_completed') return 'success';
  if (eventType === 'task_failed') return 'error';
  if (eventType === 'waiting_confirmation') return 'warning';
  return 'info';
}

function eventMessage(envelope: HermesTaskEventEnvelope): string {
  const payloadMessage =
    typeof envelope.payload.message === 'string' && envelope.payload.message.trim().length > 0
      ? envelope.payload.message
      : undefined;
  if (payloadMessage) return payloadMessage;

  const labels: Record<string, string> = {
    task_received: 'Hermes 已接收任务',
    skill_resolved: 'Skill 版本已解析',
    skill_installed: 'Skill 快照已安装',
    step_started: '步骤已开始',
    step_completed: '步骤已完成',
    waiting_confirmation: '等待用户确认后继续',
    provider_called: '已调用模型 provider',
    provider_usage_reported: '已上报模型用量',
    artifact_created: '产物已创建',
    task_interrupted: '任务中断，可尝试恢复',
    task_failed: '任务执行失败',
    task_completed: '任务已完成',
  };
  return labels[envelope.eventType] ?? `Hermes 事件：${envelope.eventType}`;
}

function mapEventToStatus(eventType: string, currentStatus: TaskStatus): TaskStatus | null {
  switch (eventType) {
    case 'task_received':
    case 'step_started':
    case 'provider_called':
    case 'skill_resolved':
    case 'skill_installed':
      return currentStatus === 'queued' || currentStatus === 'draft' ? 'running' : 'running';
    case 'waiting_confirmation':
      return 'waiting_confirmation';
    case 'task_completed':
      return 'completed';
    case 'task_failed':
      return 'failed';
    default:
      return null;
  }
}

function applyInterruptedEvent(record: UgcTaskAggregateRecord, envelope: HermesTaskEventEnvelope): void {
  const structured = normalizeHermesRunPayload({
    runState: 'interrupted',
    pauseReasonType: envelope.payload.pauseReasonType,
    pauseReasonMessage: envelope.payload.pauseReasonMessage ?? envelope.payload.message,
    resumeMode: envelope.payload.resumeMode,
    recoverable: envelope.payload.recoverable,
    artifactsPreserved: envelope.payload.artifactsPreserved,
    costStatus: {
      charged: envelope.payload.charged,
      willChargeAgain: envelope.payload.willChargeAgain,
    },
  });
  const derived = deriveTaskRunState({
    currentStatus: record.task.status === 'draft' ? 'queued' : record.task.status,
    hermes: structured,
  });
  record.task.status = derived.status;
  record.task.pendingConfirmation = derived.pendingConfirmation;
  record.task.recoveryState = derived.recoveryState;
}

function applyProviderUsage(record: UgcTaskAggregateRecord, envelope: HermesTaskEventEnvelope): void {
  const stepKey = typeof envelope.payload.stepKey === 'string' ? envelope.payload.stepKey : undefined;
  const totalTokens =
    typeof envelope.payload.totalTokens === 'number'
      ? envelope.payload.totalTokens
      : typeof envelope.payload.promptTokens === 'number' || typeof envelope.payload.completionTokens === 'number'
        ? Number(envelope.payload.promptTokens ?? 0) + Number(envelope.payload.completionTokens ?? 0)
        : 0;

  if (totalTokens > 0) {
    record.task.currentTokenUsed = Math.min(
      record.task.estimatedTokenMax,
      (record.task.currentTokenUsed ?? 0) + totalTokens,
    );
    record.task.tokenUsed = record.task.currentTokenUsed;
  }

  if (stepKey && record.task.steps) {
    const stepIndex = record.task.steps.findIndex((_step, index) => {
      const keys = ['understanding', 'script', 'shots', 'assets', 'composite', 'delivery'];
      return keys[index] === stepKey;
    });
    if (stepIndex >= 0 && totalTokens > 0) {
      record.task.steps = record.task.steps.map((step, index) =>
        index === stepIndex ? { ...step, tokenUsed: (step.tokenUsed ?? 0) + totalTokens } : step,
      );
    }
  }

  if (record.executions[0]) {
    record.executions[0] = {
      ...record.executions[0],
      metadata: {
        ...(record.executions[0].metadata ?? {}),
        lastProviderUsage: envelope.payload,
      },
    };
  }
}

function applyStepCompleted(record: UgcTaskAggregateRecord, envelope: HermesTaskEventEnvelope): void {
  const stepKey = typeof envelope.payload.stepKey === 'string' ? envelope.payload.stepKey : undefined;
  const tokenUsed = typeof envelope.payload.tokenUsed === 'number' ? envelope.payload.tokenUsed : 0;
  if (!stepKey || !record.task.steps) return;

  const keys = ['understanding', 'script', 'shots', 'assets', 'composite', 'delivery'];
  const stepIndex = keys.indexOf(stepKey);
  if (stepIndex < 0) return;

  record.task.steps = record.task.steps.map((step, index) => {
    if (index < stepIndex && step.status !== 'failed') {
      return { ...step, status: 'completed' };
    }
    if (index === stepIndex) {
      return { ...step, status: 'completed', tokenUsed: tokenUsed || step.tokenUsed };
    }
    return step;
  });
}

export async function ingestHermesTaskEvent(input: {
  taskId: string;
  envelope: unknown;
  grantToken?: string;
}): Promise<{ taskId: string; eventId: string; status: TaskStatus }> {
  const envelope = normalizeHermesTaskEventEnvelope(input.envelope, input.taskId);
  if (envelope.taskId !== input.taskId) {
    throw new HermesEventIngestError('事件 taskId 与路径参数不一致。', 'INVALID');
  }

  if (input.grantToken) {
    try {
      await validateExecutionGrantToken(input.grantToken, input.taskId);
    } catch (error) {
      if (error instanceof ExecutionGrantError) {
        throw new HermesEventIngestError(error.message, 'GRANT');
      }
      throw error;
    }
  }

  const record = await loadUgcTaskAggregate(input.taskId);
  if (!record) {
    throw new HermesEventIngestError('任务不存在。', 'NOT_FOUND');
  }
  if (TERMINAL_STATUSES.has(record.task.status) && envelope.eventType !== 'task_completed') {
    return { taskId: input.taskId, eventId: envelope.eventId, status: record.task.status };
  }

  const mappedStatus = mapEventToStatus(envelope.eventType, record.task.status);
  if (mappedStatus) {
    record.task.status = mappedStatus;
  }

  if (envelope.eventType === 'task_interrupted') {
    applyInterruptedEvent(record, envelope);
  }

  if (envelope.eventType === 'waiting_confirmation') {
    applyInterruptedEvent(record, {
      ...envelope,
      payload: {
        ...envelope.payload,
        pauseReasonType: envelope.payload.reasonType ?? 'confirmation',
        pauseReasonMessage: envelope.payload.reasonMessage ?? eventMessage(envelope),
        resumeMode: envelope.payload.resumeMode ?? 'continue',
        recoverable: true,
        willChargeAgain: envelope.payload.willChargeAgain ?? true,
      },
    });
  }

  if (envelope.eventType === 'provider_usage_reported') {
    applyProviderUsage(record, envelope);
  }

  if (envelope.eventType === 'step_completed') {
    applyStepCompleted(record, envelope);
  }

  if (envelope.eventType === 'task_completed') {
    record.task.status = 'completed';
    record.completedAt = envelope.createdAt;
    if (typeof envelope.payload.totalTokens === 'number') {
      record.task.tokenUsed = envelope.payload.totalTokens;
      record.task.currentTokenUsed = envelope.payload.totalTokens;
    }
    if (record.executions[0]) {
      record.executions[0] = {
        ...record.executions[0],
        status: 'completed',
        pauseReasonType: undefined,
        pauseReasonMessage: '任务已完成',
        resumeMode: 'continue',
        recoverable: false,
      };
    }
  }

  if (envelope.eventType === 'task_failed') {
    record.task.status = 'failed';
    if (record.executions[0]) {
      record.executions[0] = {
        ...record.executions[0],
        status: 'failed',
        pauseReasonType: (envelope.payload.errorCode as TaskPauseReasonType | undefined) ?? 'provider_error',
        pauseReasonMessage:
          typeof envelope.payload.message === 'string' ? envelope.payload.message : '任务执行失败',
        resumeMode: (envelope.payload.retryable === true ? 'retry_step' : 'require_creator_fix') as TaskResumeMode,
        recoverable: envelope.payload.retryable === true,
      };
    }
  }

  record.events.push({
    id: envelope.eventId,
    type: envelope.eventType,
    level: eventLevel(envelope.eventType),
    message: eventMessage(envelope),
    createdAt: envelope.createdAt,
    metadata: envelope.payload,
  });

  if (record.executions[0]) {
    record.executions[0] = {
      ...record.executions[0],
      requestId: envelope.executionId,
      metadata: {
        ...(record.executions[0].metadata ?? {}),
        lastEventType: envelope.eventType,
        lastEventAt: envelope.createdAt,
        ...(envelope.eventType === 'skill_resolved'
          ? {
              skillChecksum: envelope.payload.checksum,
            }
          : {}),
      },
    };
  }

  await persistUgcTaskAggregate(record);

  return { taskId: input.taskId, eventId: envelope.eventId, status: record.task.status };
}
