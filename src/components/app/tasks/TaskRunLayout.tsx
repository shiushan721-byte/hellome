import type { ReactNode } from 'react';
import type { Task } from '../../../types/workbench';
import { getUserRole } from '../../../lib/auth';
import TaskTimeline from './TaskTimeline';
import HermesLogPanel from './HermesLogPanel';
import GeoReportPanel from './GeoReportPanel';
import UgcDeliveryPanel from './UgcDeliveryPanel';
import ResultActionBar from './ResultActionBar';
import TaskStatusBadge, { formatDuration } from './TaskStatusBadge';
import ConfirmationNode from './ConfirmationNode';
import { formatToken, formatTokenRange } from '../../../lib/tokenBilling';
import { buildMediaDeliveryView, deriveMediaTaskStage } from '../../../lib/mediaTaskPresentation';

interface TaskRunLayoutProps {
  task: Task;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRerun?: () => void;
  onPrimaryAction?: () => void;
  onReviseAndRerun?: (input: {
    sellingPoint: string;
    platform: string;
    effectGoal: string;
    referenceUrl?: string;
  }) => void;
  copyHint?: string;
}

export default function TaskRunLayout({
  task,
  onConfirm,
  onCancel,
  onRerun,
  onPrimaryAction,
  onReviseAndRerun,
  copyHint,
}: TaskRunLayoutProps) {
  const role = getUserRole();
  const isPowerUser = role === 'creator' || role === 'admin';
  const activeStep = task.steps.find((s) => s.status === 'active');
  const isUgcTask = task.agentType === 'media';
  const mediaStage = isUgcTask ? deriveMediaTaskStage(task) : null;
  const mediaDelivery = isUgcTask ? buildMediaDeliveryView(task) : null;
  const geoBrandName =
    task.agentType === 'geo' && task.input && 'brandName' in task.input
      ? task.input.brandName
      : undefined;
  const headerSubtitle = isUgcTask ? '视频智能体任务' : '任务详情';
  const currentUsed =
    task.status === 'running' || task.status === 'waiting_confirmation'
      ? formatToken(task.currentTokenUsed ?? 0)
      : null;
  const budgetStatus = task.pendingConfirmation
    ? '未冻结正式生成预算'
    : task.recoveryState?.runState === 'interrupted'
      ? '中断待恢复'
      : task.status === 'completed'
      ? '预算已结算'
      : task.status === 'failed'
        ? '执行中断，待人工处理'
        : '执行中';

  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F7] px-4 pb-6 pt-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="space-y-5">
        <section className="rounded-[28px] border border-black/[0.05] bg-white px-5 py-5 shadow-sm sm:px-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-[11px] text-black/35">
                  <span>{task.id}</span>
                </div>
                <h1 className="mt-3 truncate text-[28px] font-semibold leading-none tracking-tight text-[#1A1A1A]">
                  {task.name}
                </h1>
                <p className="mt-2 text-sm leading-7 text-black/48">{headerSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isPowerUser ? (
                  <StatusPill label={task.executionMode === 'local_debug' ? '本地调试' : '后端执行'} />
                ) : null}
                {task.pendingConfirmation ? (
                  <StatusPill label="待确认" tone="warning" />
                ) : null}
                <TaskStatusBadge status={task.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <SummaryCard
                eyebrow="任务"
                title={`${isUgcTask ? '视频任务执行' : '任务执行'} · ${task.id}`}
                description={
                  task.pendingConfirmation
                    ? '等待确认'
                    : activeStep?.name
                      ? isUgcTask
                        ? `当前正在推进：${deriveMediaStageLabel(task)}`
                        : `当前正在执行：${activeStep.name}`
                      : task.status === 'completed'
                        ? '已完成'
                        : '准备中'
                }
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SummaryCard
                  eyebrow={isUgcTask ? '状态' : '运行'}
                  title={
                    isUgcTask
                      ? mediaStage === 'waiting_confirmation'
                        ? '等待确认'
                        : mediaStage === 'completed'
                          ? '正式交付完成'
                          : mediaStage === 'recoverable_error' || mediaStage === 'failed'
                            ? '执行中断'
                            : '推进中'
                      : task.executionMode === 'local_debug'
                      ? '本地调试'
                      : '后端执行'
                  }
                  compact
                />
                <SummaryCard
                  eyebrow="预算"
                  title={budgetStatus}
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <aside className="space-y-4">
            <LayoutPanel eyebrow="Left" title={isUgcTask ? '任务进度' : '步骤'}>
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-black/45">预计消耗</span>
                    <span className="font-mono font-semibold text-[#1A1A1A]">
                      {formatTokenRange({ min: task.estimatedTokenMin, max: task.estimatedTokenMax })} Token
                    </span>
                  </div>
                  {currentUsed ? (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-black/45">当前已消耗</span>
                      <span className="font-mono font-semibold text-[#1A1A1A]">{currentUsed} Token</span>
                    </div>
                  ) : null}
                  {task.status === 'completed' ? (
                    <>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-black/45">实际消耗</span>
                        <span className="font-mono font-semibold text-[#1A1A1A]">{formatToken(task.tokenUsed)} Token</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-black/45">
                        <span>完成耗时</span>
                        <span>{formatDuration(task.durationMs)}</span>
                      </div>
                    </>
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
                    {isUgcTask ? '当前阶段' : '当前步骤'}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#1A1A1A]">
                    {isUgcTask
                      ? deriveMediaStageLabel(task)
                      : activeStep?.name || (task.status === 'completed' ? '全部步骤已完成' : '准备中…')}
                  </p>
                </div>

                <TaskTimeline steps={task.steps} />
              </div>
            </LayoutPanel>
          </aside>

          <main className="space-y-4">
            <LayoutPanel eyebrow="Center" title={isUgcTask ? '结果舞台' : '结果'}>
              {isUgcTask ? (
                <UgcDeliveryPanel
                  task={task}
                  onPrimaryAction={onPrimaryAction}
                  onReviseAndRerun={onReviseAndRerun}
                />
              ) : task.result ? (
                <>
                  {task.status === 'completed' && (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs">
                      <p>
                        <span className="text-black/50">实际消耗 </span>
                        <span className="font-mono font-bold">{formatToken(task.tokenUsed)} Token</span>
                        <span className="text-black/40">
                          {' '}
                          · 预估 {formatTokenRange({ min: task.estimatedTokenMin, max: task.estimatedTokenMax })}
                        </span>
                      </p>
                    </div>
                  )}
                  <GeoReportPanel result={task.result} brandName={geoBrandName} />
                  <ResultActionBar result={task.result} onRerun={onRerun} />
                  {copyHint ? <p className="mt-2 text-[10px] text-emerald-600">{copyHint}</p> : null}
                </>
              ) : task.status === 'running' || task.status === 'waiting_confirmation' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <p className="text-sm text-black/50">执行中</p>
                </div>
              ) : (
                <p className="text-sm text-black/45">暂无结果</p>
              )}
            </LayoutPanel>
          </main>

          <aside className="space-y-4">
            <LayoutPanel eyebrow="Right" title={isUgcTask ? '补充说明' : '状态与日志'}>
              <div className="space-y-4">
                {task.recoveryState?.runState === 'interrupted' ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-amber-700">待恢复</p>
                    <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                      {task.recoveryState.pauseReasonMessage ?? '执行中断，可从上一步恢复'}
                    </p>
                    {task.recoveryState.artifactsPreserved?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.recoveryState.artifactsPreserved.map((artifact) => (
                          <span
                            key={artifact}
                            className="rounded-full bg-white/80 px-3 py-1 text-[11px] text-amber-800"
                          >
                            {artifact}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {onPrimaryAction && task.recoveryState.recoverable ? (
                      <button
                        type="button"
                        onClick={onPrimaryAction}
                        className="mt-4 h-10 rounded-xl bg-[#9A3412] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#7C2D12]"
                      >
                        从这里继续
                      </button>
                    ) : null}
                  </div>
                ) : task.pendingConfirmation ? (
                  <ConfirmationNode
                    title={task.pendingConfirmation.title}
                    message={task.pendingConfirmation.message}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                  />
                ) : (
                  <div className="rounded-2xl border border-black/[0.06] bg-[#FCFCFD] p-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-black/35">当前状态</p>
                    <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                      {task.status === 'completed'
                        ? '无需确认'
                        : task.status === 'failed'
                          ? '任务失败'
                          : '执行中'}
                    </p>
                    {mediaDelivery ? (
                      <p className="mt-2 text-sm leading-6 text-black/50">{mediaDelivery.statusBody}</p>
                    ) : null}
                  </div>
                )}

                {task.status === 'failed' && task.recoveryState?.runState !== 'interrupted' ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    执行失败，请重试。
                  </div>
                ) : null}

                <div className="rounded-2xl border border-[#F4D6A0] bg-[#FFF8EA] p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#A16207]">成本</p>
                  <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">{task.costEstimate ?? '处理中'}</p>
                </div>

                {(!isUgcTask || isPowerUser) && task.logs.length > 0 ? <HermesLogPanel logs={task.logs} /> : null}
              </div>
            </LayoutPanel>
          </aside>
        </section>
      </div>
    </div>
  );
}

function LayoutPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-black/[0.05] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-[#1A1A1A]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryCard({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[#FCFCFD] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/35">{eyebrow}</p>
      <p className={`mt-2 font-semibold text-[#1A1A1A] ${compact ? 'text-base' : 'text-lg'}`}>{title}</p>
      {description ? <p className="mt-2 text-sm leading-6 text-black/48">{description}</p> : null}
    </div>
  );
}

function StatusPill({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs ${
        tone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-[#F2F0ED] text-black/50'
      }`}
    >
      {label}
    </span>
  );
}

function deriveMediaStageLabel(task: Task): string {
  const stage = deriveMediaTaskStage(task);
  if (stage === 'recoverable_error') return '等待继续';
  if (stage === 'waiting_confirmation') return '等待你确认后继续';
  if (stage === 'completed') return '正式样片与交付已完成';
  if (stage === 'failed') return '任务执行失败';
  if (stage === 'queued') return '已接收，准备整理结果方向';
  if (stage === 'understanding') return '正在理解这次任务';
  if (stage === 'route_planning') return '正在整理表达方向';
  if (stage === 'rendering_video') return '正在生成正式样片';
  return '正在整理交付附件';
}
