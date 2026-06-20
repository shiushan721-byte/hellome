import { Prisma } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Task, TaskStep, TaskStatus, HermesLogEntry } from '../types/workbench';
import type {
  TaskExecutionMode,
  TaskPauseReasonType,
  UgcRoutePlan,
  TaskResumeMode,
  TaskRecoveryState,
  UgcSystemUnderstanding,
  UgcTaskArtifact,
  UgcTaskEvent,
  UgcTaskInput,
} from '../types/ugc';
import { normalizeHermesRunPayload, type HermesStructuredRun } from './hermesContract';
import { createExecutionGrant, revokeActiveGrantsForTask } from './executionGrantService';
import { getSkillExperienceConfig, resolvePublishedSkillBinding, resolveSkillRoutePlan } from './skillStudioService';
import { presentUgcTask } from './taskPresenter';
import { deriveTaskRunState } from './taskStateMachine';
import { getPrismaClient } from './db/prisma';
import { isFallbackAllowed } from './db/runtime';

const execFileAsync = promisify(execFile);

const UGC_STEPS = [
  { key: 'understanding', title: '理解需求' },
  { key: 'script', title: '生成脚本' },
  { key: 'shots', title: '规划镜头' },
  { key: 'assets', title: '生成人物 / 产品镜头' },
  { key: 'composite', title: '合成样片' },
  { key: 'delivery', title: '导出交付包' },
] as const;

type TaskAggregate = {
  task: Task;
  input: UgcTaskInput;
  userExternalId: string;
  workspaceSlug: string;
  skillId?: string;
  skillVersionId?: string;
  skillChecksum?: string;
  executionGrantId?: string;
  events: UgcTaskEvent[];
  attempt: number;
  startedAt?: string;
  completedAt?: string;
  executions: Array<{
    id: string;
    mode: TaskExecutionMode;
    recipe: string;
    requestId?: string;
    command?: string;
    stdout?: string;
    stderr?: string;
    status: string;
    pauseReasonType?: TaskPauseReasonType;
    pauseReasonMessage?: string;
    resumeMode?: TaskResumeMode;
    recoverable?: boolean;
    artifactsPreserved?: string[];
    willChargeAgain?: boolean;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
};

type RecoveryPayloadSnapshot = {
  understanding?: UgcSystemUnderstanding;
  routePlan?: UgcRoutePlan;
  pendingConfirmation?: Task['pendingConfirmation'] | null;
  recoveryState?: TaskRecoveryState | null;
};

type CreateTaskPayload = {
  input: UgcTaskInput;
  userExternalId: string;
  displayName?: string;
  email?: string;
  phone?: string;
  workspaceName?: string;
};

type DebugRunPayload = {
  prompt?: string;
  recipe?: string;
};

const terminalStatuses = new Set<TaskStatus>(['completed', 'failed', 'cancelled']);
const activeRuns = new Set<string>();
const memoryStore = new Map<string, TaskAggregate>();

function requirePersistenceFallback(): boolean {
  return !getPrismaClient() && isFallbackAllowed();
}

function nowIso(): string {
  return new Date().toISOString();
}

function formatLogTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildSteps(status: TaskStatus = 'draft'): TaskStep[] {
  return UGC_STEPS.map((step, index) => ({
    id: `ugc-step-${index}`,
    name: step.title,
    status:
      status === 'running' && index === 0
        ? 'active'
        : status === 'completed'
          ? 'completed'
          : 'pending',
  }));
}

function toStoredRecoverySnapshot(task: Task): RecoveryPayloadSnapshot {
  return {
    understanding: task.understanding,
    routePlan: task.routePlan,
    pendingConfirmation: task.pendingConfirmation ?? null,
    recoveryState: task.recoveryState ?? null,
  };
}

function fromStoredRecoverySnapshot(snapshot: RecoveryPayloadSnapshot, task: Task): Task {
  return {
    ...task,
    understanding: snapshot.understanding ?? task.understanding,
    routePlan: snapshot.routePlan ?? task.routePlan,
    pendingConfirmation: snapshot.pendingConfirmation ?? task.pendingConfirmation,
    recoveryState: snapshot.recoveryState ?? task.recoveryState,
  };
}

function getExecutionRecoveryFields(run: HermesStructuredRun) {
  return {
    pauseReasonType: run.pauseReasonType,
    pauseReasonMessage: run.pauseReasonMessage,
    resumeMode: run.resumeMode,
    recoverable: run.recoverable,
    artifactsPreserved: run.artifactsPreserved,
    willChargeAgain: run.costStatus.willChargeAgain,
  };
}

function applyStructuredRunState(record: TaskAggregate, structuredRun: HermesStructuredRun, currentStatus: Exclude<TaskStatus, 'draft'>): void {
  const derived = deriveTaskRunState({
    currentStatus,
    hermes: structuredRun,
  });

  record.task.status = derived.status;
  record.task.pendingConfirmation = derived.pendingConfirmation;
  record.task.recoveryState = derived.recoveryState;

  if (record.executions[0]) {
    record.executions[0] = {
      ...record.executions[0],
      status: structuredRun.runState,
      ...getExecutionRecoveryFields(structuredRun),
      metadata: {
        ...(record.executions[0].metadata ?? {}),
        structuredRunState: structuredRun.runState,
      },
    };
  }
}

function createUnderstanding(input: UgcTaskInput): UgcSystemUnderstanding {
  const platformTone: Record<string, string> = {
    抖音: '节奏更快、首秒抓人、口播更直接',
    小红书: '更像真人种草、注重场景感和真实体验',
    视频号: '兼顾信任感、讲解感和轻转化',
  };

  return {
    targetAudience: '25-35 岁高频刷短视频、愿意看真人试用反馈的消费用户',
    videoStyle: `${input.effectGoal}，${platformTone[input.platform] ?? '先种草再转化'}`,
    coreAngle: input.sellingPoint,
    outputGoal: `${input.platform} 10 秒 9:16 UGC 样片`,
    draftScript: `开场先展示真实使用场景，再用一句“${input.sellingPoint}”打核心记忆点，最后给出轻行动引导。`,
  };
}

function skillLabel(skillId?: string): string {
  if (skillId === 'media-review') return '测评讲解视频';
  if (skillId === 'media-conversion') return '带货转化视频';
  if (skillId === 'media-seeding') return '真人种草视频';
  return 'UGC 视频广告';
}

function buildArtifacts(taskId: string): UgcTaskArtifact[] {
  return [
    {
      id: `${taskId}-video`,
      type: 'video',
      label: '样片视频',
      fileName: 'sample-video.mp4',
      mimeType: 'video/mp4',
    },
    {
      id: `${taskId}-cover`,
      type: 'image',
      label: '封面首帧',
      fileName: 'cover-frame.png',
      mimeType: 'image/png',
    },
    {
      id: `${taskId}-script`,
      type: 'script',
      label: '脚本草案',
      fileName: 'script.md',
      mimeType: 'text/markdown',
    },
    {
      id: `${taskId}-summary`,
      type: 'report',
      label: '交付摘要',
      fileName: 'delivery-summary.pdf',
      mimeType: 'application/pdf',
    },
  ];
}

function cloneAggregate(record: TaskAggregate): TaskAggregate {
  return JSON.parse(JSON.stringify(record)) as TaskAggregate;
}

function toFrontendTask(record: TaskAggregate): Task {
  const logs: HermesLogEntry[] = record.events.map((event) => ({
    id: event.id,
    timestamp: formatLogTimestamp(event.createdAt),
    message: event.message,
    level: event.level,
  }));

  return presentUgcTask({
    ...record.task,
    currentTokenUsed: record.task.currentTokenUsed ?? 0,
    logs,
    input: record.input,
    steps: record.task.steps ?? buildSteps(record.task.status),
    artifacts: record.task.artifacts ?? [],
    completedAt: record.completedAt ?? record.task.completedAt,
  });
}

function buildAggregate(payload: CreateTaskPayload): TaskAggregate {
  const createdAt = nowIso();
  const id = `ugc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const task: Task = {
    id,
    name: `${skillLabel(payload.input.skillId)} · ${payload.input.platform}`,
    agentType: 'media',
    status: 'queued',
    executionMode: 'backend_silent',
    createdAt,
    estimatedTokenMin: 12000,
    estimatedTokenMax: 28000,
    tokenUsed: 0,
    currentTokenUsed: 0,
    costEstimate: '预计 1 次样片生成 + 1 次视频合成',
    input: payload.input,
    steps: buildSteps('queued'),
    logs: [],
    understanding: undefined,
    artifacts: [],
  };

  const initialEvent: UgcTaskEvent = {
    id: `${id}-event-0`,
    type: 'task_created',
    level: 'info',
    message: '任务已创建，等待后端静默执行',
    createdAt,
  };

  return {
    task,
    input: payload.input,
    userExternalId: payload.userExternalId,
    workspaceSlug: slugifyWorkspace(payload.workspaceName ?? '个人空间'),
    events: [initialEvent],
    attempt: 1,
    executions: [
      {
        id: `${id}-exec-0`,
        mode: 'backend_silent',
        recipe: 'Generative-Media-Skills/UGC Video Factory',
        status: 'queued',
        createdAt,
      },
    ],
  };
}

function slugifyWorkspace(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';
}

function updateStep(task: Task, index: number, status: TaskStep['status'], tokenUsed?: number): void {
  task.steps = task.steps.map((step, stepIndex) => {
    if (stepIndex < index && step.status !== 'failed') {
      return {
        ...step,
        status: 'completed',
      };
    }
    if (stepIndex === index) {
      return {
        ...step,
        status,
        tokenUsed: tokenUsed ?? step.tokenUsed,
      };
    }
    return step;
  });
}

function pushEvent(
  record: TaskAggregate,
  type: string,
  level: UgcTaskEvent['level'],
  message: string,
  metadata?: Record<string, unknown>,
): void {
  record.events.push({
    id: `${record.task.id}-event-${record.events.length + 1}`,
    type,
    level,
    message,
    createdAt: nowIso(),
    metadata,
  });
}

function allocateToken(record: TaskAggregate, value: number): void {
  record.task.currentTokenUsed = Math.min(record.task.estimatedTokenMax, value);
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function persist(record: TaskAggregate): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma && !isFallbackAllowed()) {
    throw new Error('数据库不可用，且未启用内存回退。');
  }
  if (!prisma) {
    memoryStore.set(record.task.id, cloneAggregate(record));
    return;
  }

  memoryStore.set(record.task.id, cloneAggregate(record));

  const understandingPayload = toStoredRecoverySnapshot(record.task);
  const payloadJson = understandingPayload as unknown as Prisma.InputJsonValue;
  const taskRecoveryState = record.task.recoveryState;

  const user = await prisma.user.upsert({
    where: { externalId: record.userExternalId },
    update: {},
    create: {
      externalId: record.userExternalId,
      displayName: record.userExternalId,
      email: record.userExternalId.includes('@') ? record.userExternalId : null,
      phone: record.userExternalId.includes('@') ? null : record.userExternalId,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: record.workspaceSlug },
    update: {
      name: record.workspaceSlug,
      ownerId: user.id,
    },
    create: {
      name: record.workspaceSlug,
      slug: record.workspaceSlug,
      ownerId: user.id,
    },
  });

  await prisma.task.upsert({
    where: { id: record.task.id },
    update: {
      name: record.task.name,
      agentType: record.task.agentType,
      status: record.task.status,
      executionMode: record.task.executionMode ?? 'backend_silent',
      completedAt: record.completedAt ? new Date(record.completedAt) : null,
      estimatedTokenMin: record.task.estimatedTokenMin,
      estimatedTokenMax: record.task.estimatedTokenMax,
      tokenUsed: record.task.tokenUsed,
      currentTokenUsed: record.task.currentTokenUsed ?? 0,
      costEstimate: record.task.costEstimate ?? null,
      requiresConfirm: record.task.status === 'waiting_confirmation',
      pauseReasonType: taskRecoveryState?.pauseReasonType ?? null,
      pauseReasonMessage: taskRecoveryState?.pauseReasonMessage ?? null,
      resumeMode: taskRecoveryState?.resumeMode ?? null,
      recoverable: taskRecoveryState?.recoverable ?? false,
      artifactsPreserved: (taskRecoveryState?.artifactsPreserved ?? null) as Prisma.InputJsonValue,
      willChargeAgain: taskRecoveryState?.willChargeAgain ?? null,
      showcaseStage: payloadJson,
      skillId: record.skillId ?? null,
      skillVersionId: record.skillVersionId ?? null,
      executionGrantId: record.executionGrantId ?? null,
      userId: user.id,
      workspaceId: workspace.id,
    },
    create: {
      id: record.task.id,
      name: record.task.name,
      agentType: record.task.agentType,
      status: record.task.status,
      executionMode: record.task.executionMode ?? 'backend_silent',
      createdAt: new Date(record.task.createdAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : null,
      estimatedTokenMin: record.task.estimatedTokenMin,
      estimatedTokenMax: record.task.estimatedTokenMax,
      tokenUsed: record.task.tokenUsed,
      currentTokenUsed: record.task.currentTokenUsed ?? 0,
      costEstimate: record.task.costEstimate ?? null,
      requiresConfirm: record.task.status === 'waiting_confirmation',
      pauseReasonType: taskRecoveryState?.pauseReasonType ?? null,
      pauseReasonMessage: taskRecoveryState?.pauseReasonMessage ?? null,
      resumeMode: taskRecoveryState?.resumeMode ?? null,
      recoverable: taskRecoveryState?.recoverable ?? false,
      artifactsPreserved: (taskRecoveryState?.artifactsPreserved ?? null) as Prisma.InputJsonValue,
      willChargeAgain: taskRecoveryState?.willChargeAgain ?? null,
      showcaseStage: payloadJson,
      skillId: record.skillId ?? null,
      skillVersionId: record.skillVersionId ?? null,
      executionGrantId: record.executionGrantId ?? null,
      userId: user.id,
      workspaceId: workspace.id,
    },
  });

  await prisma.taskInput.upsert({
    where: { taskId: record.task.id },
    update: {
      productImage: record.input.productImageUrl ?? null,
      productName: record.input.productImageName ?? null,
      talentImage: record.input.talentImageUrl ?? null,
      sellingPoint: record.input.sellingPoint,
      platform: record.input.platform,
      effectGoal: record.input.effectGoal,
      referenceUrl: record.input.referenceUrl ?? null,
      payload: {
        ...((payloadJson as Record<string, unknown>) ?? {}),
        skillId: record.input.skillId ?? null,
      } as Prisma.InputJsonValue,
    },
    create: {
      taskId: record.task.id,
      productImage: record.input.productImageUrl ?? null,
      productName: record.input.productImageName ?? null,
      talentImage: record.input.talentImageUrl ?? null,
      sellingPoint: record.input.sellingPoint,
      platform: record.input.platform,
      effectGoal: record.input.effectGoal,
      referenceUrl: record.input.referenceUrl ?? null,
      payload: {
        skillId: record.input.skillId ?? null,
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.taskRun.deleteMany({ where: { taskId: record.task.id } });
  await prisma.taskRun.create({
    data: {
      taskId: record.task.id,
      status: record.task.status,
      mode: record.task.executionMode ?? 'backend_silent',
      attempt: record.attempt,
      startedAt: new Date(record.startedAt ?? record.task.createdAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : null,
    },
  });

  await prisma.taskStep.deleteMany({ where: { taskId: record.task.id } });
  if (record.task.steps.length > 0) {
    await prisma.taskStep.createMany({
      data: record.task.steps.map((step, index) => ({
        taskId: record.task.id,
        key: UGC_STEPS[index]?.key ?? `step_${index}`,
        title: step.name,
        orderIndex: index,
        status: step.status,
        detail: undefined,
        tokenUsed: step.tokenUsed ?? 0,
      })),
    });
  }

  await prisma.taskArtifact.deleteMany({ where: { taskId: record.task.id } });
  if ((record.task.artifacts ?? []).length > 0) {
    await prisma.taskArtifact.createMany({
      data: (record.task.artifacts ?? []).map((artifact) => ({
        taskId: record.task.id,
        type: artifact.type,
        label: artifact.label,
        fileName: artifact.fileName,
        url: artifact.url ?? null,
        mimeType: artifact.mimeType ?? null,
      })),
    });
  }

  await prisma.taskEvent.deleteMany({ where: { taskId: record.task.id } });
  if (record.events.length > 0) {
    await prisma.taskEvent.createMany({
      data: record.events.map((event) => ({
        id: event.id,
        taskId: record.task.id,
        type: event.type,
        level: event.level,
        message: event.message,
        metadata: (event.metadata ?? null) as Prisma.InputJsonValue,
        createdAt: new Date(event.createdAt),
      })),
    });
  }

  await prisma.hermesExecution.deleteMany({ where: { taskId: record.task.id } });
  if (record.executions.length > 0) {
    await prisma.hermesExecution.createMany({
      data: record.executions.map((execution) => ({
        id: execution.id,
        taskId: record.task.id,
        mode: execution.mode,
        recipe: execution.recipe,
        command: execution.command ?? null,
        stdout: execution.stdout ?? null,
        stderr: execution.stderr ?? null,
        status: execution.status,
        pauseReasonType: execution.pauseReasonType ?? null,
        pauseReasonMessage: execution.pauseReasonMessage ?? null,
        resumeMode: execution.resumeMode ?? null,
        recoverable: execution.recoverable ?? false,
        artifactsPreserved: (execution.artifactsPreserved ?? null) as Prisma.InputJsonValue,
        willChargeAgain: execution.willChargeAgain ?? null,
        skillId: record.skillId ?? null,
        skillVersionId: record.skillVersionId ?? null,
        skillChecksum: record.skillChecksum ?? null,
        grantId: record.executionGrantId ?? null,
        metadata: (execution.metadata ?? null) as Prisma.InputJsonValue,
        createdAt: new Date(execution.createdAt),
      })),
    });
  }

  await prisma.usageLedger.deleteMany({ where: { taskId: record.task.id } });
  await prisma.usageLedger.create({
    data: {
      userId: user.id,
      taskId: record.task.id,
      tokenUsed: record.task.tokenUsed,
      videoCost: record.task.costEstimate ?? null,
      status: record.task.status === 'failed' ? 'failed' : 'settled',
    },
  });
}

async function loadAllFromPrisma(): Promise<TaskAggregate[]> {
  const prisma = getPrismaClient();
  if (!prisma) {
    if (!requirePersistenceFallback()) {
      throw new Error('数据库不可用，且未启用内存回退。');
    }
    return Array.from(memoryStore.values()).map(cloneAggregate);
  }

  const rows = await prisma.task.findMany({
    where: { agentType: 'media' },
    include: {
      input: true,
      steps: { orderBy: { orderIndex: 'asc' } },
      artifacts: true,
      events: { orderBy: { createdAt: 'asc' } },
      executions: { orderBy: { createdAt: 'asc' } },
      user: true,
      workspace: true,
      runs: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((row) => {
    const payload = ((row.showcaseStage as RecoveryPayloadSnapshot | null) ??
      (row.input?.payload as RecoveryPayloadSnapshot | null) ??
      {}) as RecoveryPayloadSnapshot;
    const fallbackRecoveryState =
      payload.recoveryState ??
      (row.status === 'running' ||
      row.status === 'waiting_confirmation' ||
      row.status === 'completed' ||
      row.status === 'failed'
        ? {
            runState:
              row.status === 'waiting_confirmation'
                ? 'waiting_confirmation'
                : row.status === 'running'
                  ? 'running'
                  : row.status === 'completed'
                    ? 'completed'
                    : 'failed',
            pauseReasonType: (row.pauseReasonType as TaskPauseReasonType | null) ?? undefined,
            pauseReasonMessage: row.pauseReasonMessage ?? undefined,
            resumeMode: (row.resumeMode as TaskResumeMode | null) ?? undefined,
            recoverable: row.recoverable,
            artifactsPreserved: Array.isArray(row.artifactsPreserved)
              ? row.artifactsPreserved.filter((item): item is string => typeof item === 'string')
              : undefined,
            willChargeAgain: row.willChargeAgain ?? undefined,
          }
        : undefined);

    const input: UgcTaskInput = {
      skillId: row.skillId ?? ((row.input?.payload as { skillId?: string } | null)?.skillId ?? undefined),
      productImageUrl: row.input?.productImage ?? undefined,
      productImageName: row.input?.productName ?? undefined,
      talentImageUrl: row.input?.talentImage ?? undefined,
      talentImageName: row.input?.talentImage ?? undefined,
      sellingPoint: row.input?.sellingPoint ?? '',
      platform: row.input?.platform ?? '抖音',
      effectGoal: row.input?.effectGoal ?? '更像真人种草',
      referenceUrl: row.input?.referenceUrl ?? undefined,
    };

    const task = fromStoredRecoverySnapshot(payload, {
      id: row.id,
      name: row.name,
      agentType: 'media',
      status: row.status,
      executionMode: row.executionMode,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString(),
      estimatedTokenMin: row.estimatedTokenMin,
      estimatedTokenMax: row.estimatedTokenMax,
      tokenUsed: row.tokenUsed,
      currentTokenUsed: row.currentTokenUsed,
      costEstimate: row.costEstimate ?? undefined,
      input,
      steps: row.steps.map((step) => ({
        id: step.id,
        name: step.title,
        status: step.status as TaskStep['status'],
        tokenUsed: step.tokenUsed,
      })),
      logs: [],
      artifacts: row.artifacts.map((artifact) => ({
        id: artifact.id,
        type: artifact.type,
        label: artifact.label,
        fileName: artifact.fileName,
        url: artifact.url ?? undefined,
        mimeType: artifact.mimeType ?? undefined,
      })),
      recoveryState: fallbackRecoveryState,
    });

    return {
      task,
      input,
      userExternalId: row.user.externalId,
      workspaceSlug: row.workspace?.slug ?? 'workspace',
      skillId: row.skillId ?? undefined,
      skillVersionId: row.skillVersionId ?? undefined,
      skillChecksum: row.executions[0]?.skillChecksum ?? undefined,
      executionGrantId: row.executionGrantId ?? undefined,
      events: row.events.map((event) => ({
        id: event.id,
        type: event.type,
        level: event.level as UgcTaskEvent['level'],
        message: event.message,
        createdAt: event.createdAt.toISOString(),
        metadata: event.metadata as Record<string, unknown> | undefined,
      })),
      attempt: row.runs[0]?.attempt ?? 1,
      startedAt: row.runs[0]?.startedAt.toISOString(),
      completedAt: row.runs[0]?.completedAt?.toISOString(),
      executions: row.executions.map((execution) => ({
        id: execution.id,
        mode: execution.mode,
        recipe: execution.recipe,
        command: execution.command ?? undefined,
        stdout: execution.stdout ?? undefined,
        stderr: execution.stderr ?? undefined,
        status: execution.status,
        pauseReasonType: (execution.pauseReasonType as TaskPauseReasonType | null) ?? undefined,
        pauseReasonMessage: execution.pauseReasonMessage ?? undefined,
        resumeMode: (execution.resumeMode as TaskResumeMode | null) ?? undefined,
        recoverable: execution.recoverable,
        artifactsPreserved: Array.isArray(execution.artifactsPreserved)
          ? execution.artifactsPreserved.filter((item): item is string => typeof item === 'string')
          : undefined,
        willChargeAgain: execution.willChargeAgain ?? undefined,
        createdAt: execution.createdAt.toISOString(),
        metadata: execution.metadata as Record<string, unknown> | undefined,
      })),
    };
  });
}

async function loadOne(id: string): Promise<TaskAggregate | null> {
  const all = await loadAllFromPrisma();
  return all.find((item) => item.task.id === id) ?? null;
}

function isMediaTaskId(id: string): boolean {
  return id.startsWith('ugc_') || memoryStore.has(id);
}

async function executeUnderstandingPhase(taskId: string): Promise<void> {
  if (activeRuns.has(taskId)) return;
  activeRuns.add(taskId);

  try {
    const record = await loadOne(taskId);
    if (!record || terminalStatuses.has(record.task.status)) return;

    record.startedAt = nowIso();
    applyStructuredRunState(
      record,
      normalizeHermesRunPayload({
        runState: 'running',
        pauseReasonType: 'provider_error',
        pauseReasonMessage: '正在理解需求并生成执行方案',
        resumeMode: 'retry_step',
        recoverable: true,
        artifactsPreserved: [],
        costStatus: {
          charged: false,
          willChargeAgain: false,
        },
      }),
      'running',
    );
    updateStep(record.task, 0, 'active');
    pushEvent(record, 'task_started', 'info', '后端静默执行已启动，开始理解需求');
    record.executions[0] = {
      ...record.executions[0],
      command: 'hermes --cli --oneshot "<system understanding>"',
    };
    await persist(record);

    await delay(400);
    const step1 = await loadOne(taskId);
    if (!step1) return;
    const skillExperience = await getSkillExperienceConfig(step1.input.skillId ?? 'media-ugc');
    step1.task.understanding = createUnderstanding(step1.input);
    if (step1.task.routePlan) {
      step1.task.costEstimate = `${step1.task.routePlan.label} · ${step1.task.routePlan.providerHint}`;
    }
    allocateToken(step1, 4200);
    updateStep(step1.task, 0, 'completed', 4200);
    pushEvent(step1, 'understanding_ready', 'success', '系统已完成用户意图理解与人设推断');
    if (step1.task.routePlan) {
      pushEvent(step1, 'skill_plan_routed', 'info', `系统已自动选择执行方案：${step1.task.routePlan.label}`);
    }
    await persist(step1);

    await delay(450);
    const step2 = await loadOne(taskId);
    if (!step2) return;
    updateStep(step2.task, 1, 'active');
    pushEvent(step2, 'script_generating', 'info', '正在生成脚本草案与镜头提纲');
    await persist(step2);

    await delay(450);
    const step3 = await loadOne(taskId);
    if (!step3) return;
    allocateToken(step3, 7600);
    updateStep(step3.task, 1, 'completed', 3400);
    updateStep(step3.task, 2, 'completed', 1800);
    applyStructuredRunState(
      step3,
      normalizeHermesRunPayload({
        runState: 'waiting_confirmation',
        pauseReasonType: 'confirmation',
        pauseReasonMessage:
          skillExperience.understandingConfig.confirmationMessage ||
          '系统理解、脚本与镜头规划已完成。接下来会进入高成本的视频生成与合成步骤。',
        resumeMode: 'continue',
        recoverable: true,
        artifactsPreserved: ['script.md'],
        costStatus: {
          charged: false,
          willChargeAgain: false,
        },
      }),
      'running',
    );
    if (step3.task.pendingConfirmation) {
      step3.task.pendingConfirmation.title = '确认进入视频生成';
    }
    pushEvent(step3, 'awaiting_confirmation', 'warning', '等待用户确认后进入高成本视频生成步骤');
    await persist(step3);
  } finally {
    activeRuns.delete(taskId);
  }
}

async function executeRenderPhase(taskId: string): Promise<void> {
  if (activeRuns.has(taskId)) return;
  activeRuns.add(taskId);

  try {
    let record = await loadOne(taskId);
    if (!record || terminalStatuses.has(record.task.status)) return;

    applyStructuredRunState(
      record,
      normalizeHermesRunPayload({
        runState: 'running',
        pauseReasonType: 'provider_error',
        pauseReasonMessage: '正在生成素材镜头与样片合成',
        resumeMode: 'retry_step',
        recoverable: true,
        artifactsPreserved: ['script.md'],
        costStatus: {
          charged: false,
          willChargeAgain: false,
        },
      }),
      'running',
    );
    updateStep(record.task, 3, 'active');
    pushEvent(record, 'render_started', 'info', '开始生成素材镜头与样片合成');
    await persist(record);

    await delay(500);
    record = await loadOne(taskId);
    if (!record) return;
    allocateToken(record, 13800);
    updateStep(record.task, 3, 'completed', 6200);
    updateStep(record.task, 4, 'active');
    pushEvent(record, 'video_rendering', 'info', '样片视频正在合成，准备生成封面与交付摘要');
    await persist(record);

    await delay(500);
    record = await loadOne(taskId);
    if (!record) return;
    allocateToken(record, 19400);
    updateStep(record.task, 4, 'completed', 5600);
    updateStep(record.task, 5, 'active');
    pushEvent(record, 'delivery_packaging', 'info', '正在导出视频、封面、脚本与交付摘要');
    await persist(record);

    await delay(450);
    record = await loadOne(taskId);
    if (!record) return;
    record.task.artifacts = buildArtifacts(record.task.id);
    record.task.tokenUsed = 22600;
    record.task.currentTokenUsed = 22600;
    record.completedAt = nowIso();
    updateStep(record.task, 5, 'completed', 3000);
    applyStructuredRunState(
      record,
      normalizeHermesRunPayload({
        runState: 'completed',
        pauseReasonType: 'provider_error',
        pauseReasonMessage: '任务已完成，可查看交付结果',
        resumeMode: 'continue',
        recoverable: false,
        artifactsPreserved: record.task.artifacts.map((artifact) => artifact.fileName),
        costStatus: {
          charged: true,
          willChargeAgain: false,
        },
      }),
      'running',
    );
    record.executions[0] = {
      ...record.executions[0],
      stdout: 'sample-video.mp4\ncover-frame.png\nscript.md\ndelivery-summary.pdf',
    };
    pushEvent(record, 'task_completed', 'success', 'UGC 样片与交付包已生成完成');
    await persist(record);
  } finally {
    activeRuns.delete(taskId);
  }
}

export async function createUgcTask(payload: CreateTaskPayload): Promise<Task> {
  const skillBinding = await resolvePublishedSkillBinding(payload.input.skillId ?? 'media-ugc');
  const record = buildAggregate(payload);
  record.skillId = skillBinding.skillId;
  record.skillVersionId = skillBinding.skillVersionId;
  record.skillChecksum = skillBinding.checksum;
  record.input.skillId = payload.input.skillId ?? 'media-ugc';
  record.task.routePlan = await resolveSkillRoutePlan(record.input.skillId, payload.input);
  record.task.costEstimate = `${record.task.routePlan.label} · ${record.task.routePlan.providerHint}`;
  record.executions[0] = {
    ...record.executions[0],
    recipe: `${skillBinding.skillSlug}@${skillBinding.versionLabel}`,
    metadata: {
      skillId: skillBinding.skillId,
      skillVersionId: skillBinding.skillVersionId,
      skillChecksum: skillBinding.checksum,
      versionNumber: skillBinding.versionNumber,
    },
  };
  pushEvent(
    record,
    'skill_bound',
    'info',
    `正式任务已绑定已发布 Skill ${skillBinding.versionLabel} (${skillBinding.checksum})`,
    {
      skillId: skillBinding.skillId,
      skillVersionId: skillBinding.skillVersionId,
      checksum: skillBinding.checksum,
    },
  );
  await persist(record);

  const grant = await createExecutionGrant({
    taskId: record.task.id,
    skillId: skillBinding.skillId,
    skillVersionId: skillBinding.skillVersionId,
    tokenBudgetMax: record.task.estimatedTokenMax,
  });
  record.executionGrantId = grant.grantId;
  record.executions[0] = {
    ...record.executions[0],
    metadata: {
      ...(record.executions[0].metadata ?? {}),
      executionGrantId: grant.grantId,
    },
  };
  pushEvent(record, 'execution_grant_issued', 'info', '已为本次任务签发短期 execution grant', {
    grantId: grant.grantId,
    expiresAt: grant.expiresAt,
  });
  await persist(record);

  void executeUnderstandingPhase(record.task.id);
  return toFrontendTask(record);
}

export async function listUgcTasks(): Promise<Task[]> {
  const all = await loadAllFromPrisma();
  return all.map((record) => toFrontendTask(record));
}

export async function getUgcTask(id: string): Promise<(Task & { events: UgcTaskEvent[] }) | null> {
  const record = await loadOne(id);
  if (!record) return null;
  return {
    ...toFrontendTask(record),
    events: record.events,
  };
}

export async function confirmUgcTask(id: string): Promise<Task | null> {
  const record = await loadOne(id);
  if (!record) return null;
  if (record.task.status !== 'waiting_confirmation') {
    return toFrontendTask(record);
  }
  applyStructuredRunState(
    record,
    normalizeHermesRunPayload({
      runState: 'running',
      pauseReasonType: 'provider_error',
      pauseReasonMessage: '已确认，继续进入高成本生成步骤',
      resumeMode: 'retry_step',
      recoverable: true,
      artifactsPreserved: record.task.recoveryState?.artifactsPreserved ?? ['script.md'],
      costStatus: {
        charged: false,
        willChargeAgain: false,
      },
    }),
    'running',
  );
  pushEvent(record, 'confirmation_received', 'success', '用户已确认，继续执行高成本生成步骤');
  await persist(record);
  void executeRenderPhase(id);
  return toFrontendTask(record);
}

export async function retryUgcTask(id: string, nextInput?: Partial<UgcTaskInput>): Promise<Task | null> {
  const record = await loadOne(id);
  if (!record) return null;

  if (nextInput) {
    record.input = {
      ...record.input,
      ...nextInput,
      sellingPoint: nextInput.sellingPoint?.trim() || record.input.sellingPoint,
      platform: nextInput.platform?.trim() || record.input.platform,
      effectGoal: nextInput.effectGoal?.trim() || record.input.effectGoal,
      referenceUrl: nextInput.referenceUrl?.trim() || undefined,
    };
  }
  record.task.routePlan = await resolveSkillRoutePlan(record.input.skillId ?? 'media-ugc', record.input);

  record.task.status = 'queued';
  record.task.tokenUsed = 0;
  record.task.currentTokenUsed = 0;
  record.task.completedAt = undefined;
  record.task.artifacts = [];
  record.task.understanding = undefined;
  record.task.recoveryState = undefined;
  record.task.pendingConfirmation = undefined;
  record.task.input = record.input;
  record.task.steps = buildSteps('queued');
  record.attempt += 1;
  record.executions = [
    {
      id: `${record.task.id}-exec-${record.attempt}`,
      mode: 'backend_silent',
      recipe: 'Generative-Media-Skills/UGC Video Factory',
      status: 'queued',
      createdAt: nowIso(),
    },
  ];
  record.task.costEstimate = `${record.task.routePlan.label} · ${record.task.routePlan.providerHint}`;
  pushEvent(record, 'task_retried', 'info', nextInput ? '任务输入已更新，系统已重新选择执行方案并排队生成' : '任务已重新排队，等待后端静默执行');
  await persist(record);
  void executeUnderstandingPhase(id);
  return toFrontendTask(record);
}

export async function cancelUgcTask(id: string): Promise<Task | null> {
  const record = await loadOne(id);
  if (!record) return null;
  record.task.status = 'cancelled';
  record.task.pendingConfirmation = undefined;
  record.task.recoveryState = undefined;
  await revokeActiveGrantsForTask(id);
  pushEvent(record, 'task_cancelled', 'warning', '任务已取消，未进入高成本视频生成阶段');
  await persist(record);
  return toFrontendTask(record);
}

export async function deleteUgcTask(id: string): Promise<boolean> {
  memoryStore.delete(id);
  const prisma = getPrismaClient();
  if (!prisma) {
    if (!isFallbackAllowed()) {
      throw new Error('数据库不可用，且未启用内存回退。');
    }
    return true;
  }
  await prisma.task.deleteMany({
    where: { id, agentType: 'media' },
  });
  return true;
}

export async function getUgcTaskEvents(id: string): Promise<UgcTaskEvent[]> {
  const task = await getUgcTask(id);
  return task?.events ?? [];
}

export async function runHermesDebug(payload: DebugRunPayload): Promise<{
  available: boolean;
  version: string | null;
  stdout: string;
  stderr: string;
  command: string;
}> {
  try {
    const versionResult = await execFileAsync('hermes', ['--version'], { timeout: 5000 });
    const version = versionResult.stdout.trim() || versionResult.stderr.trim() || null;
    const recipe = payload.recipe ?? 'debug';
    const prompt = payload.prompt?.trim();

    if (!prompt) {
      return {
        available: true,
        version,
        stdout: 'Hermes CLI 已安装，可用于本地调试模式。',
        stderr: '',
        command: 'hermes --version',
      };
    }

    const args = ['--cli', '--oneshot', prompt];
    const result = await execFileAsync('hermes', args, { timeout: 20000 });
    return {
      available: true,
      version,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      command: `hermes --cli --oneshot "<${recipe}>"`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hermes CLI 调试失败';
    return {
      available: false,
      version: null,
      stdout: '',
      stderr: message,
      command: 'hermes --version',
    };
  }
}

export async function getHermesRuntimeStatus(): Promise<{
  cliAvailable: boolean;
  appInstalled: boolean;
  version: string | null;
  recommendedMode: TaskExecutionMode;
  note: string;
}> {
  try {
    const versionResult = await execFileAsync('hermes', ['--version'], { timeout: 5000 });
    return {
      cliAvailable: true,
      appInstalled: true,
      version: versionResult.stdout.trim() || versionResult.stderr.trim() || null,
      recommendedMode: 'backend_silent',
      note: '当前机器已安装 Hermes CLI 与 Hermes.app，适合保留本地调试入口，生产任务建议走后端静默执行。',
    };
  } catch {
    return {
      cliAvailable: false,
      appInstalled: false,
      version: null,
      recommendedMode: 'backend_silent',
      note: '未检测到可调用的 Hermes CLI，生产任务需完全依赖后端静默执行。',
    };
  }
}

export { isMediaTaskId };

export type UgcTaskAggregateRecord = TaskAggregate;

export async function loadUgcTaskAggregate(id: string): Promise<TaskAggregate | null> {
  return loadOne(id);
}

export async function persistUgcTaskAggregate(record: TaskAggregate): Promise<void> {
  await persist(record);
}
