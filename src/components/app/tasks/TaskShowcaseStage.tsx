import { AlertTriangle, CheckCircle2, Film, PlayCircle, Sparkles } from 'lucide-react';
import type { Task } from '../../../types/workbench';

export type ShowcaseTaskLike = Pick<
  Task,
  'status' | 'recoveryState' | 'pendingConfirmation' | 'understanding' | 'routePlan' | 'artifacts' | 'costEstimate'
> &
  Partial<Pick<Task, 'name' | 'input'>>;

export interface TaskShowcaseViewModel {
  statusLabel: string;
  headline: string;
  body: string;
  primaryActionLabel?: string;
  accentClassName: string;
  badgeToneClassName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroMeta: string;
  tags: string[];
}

function resolvePrimaryActionLabel(task: ShowcaseTaskLike): string | undefined {
  if (task.recoveryState?.runState === 'interrupted') {
    if (task.recoveryState.resumeMode === 'continue') return '从这里继续';
    if (task.recoveryState.resumeMode === 'retry_step') return '重试当前阶段';
    if (task.recoveryState.resumeMode === 'require_input') return '补充信息后继续';
    if (task.recoveryState.resumeMode === 'require_creator_fix') return '转交工坊处理';
    return '查看恢复方案';
  }

  if (task.status === 'waiting_confirmation') {
    return task.pendingConfirmation?.action ?? '确认继续';
  }

  if (task.status === 'completed') return '查看交付';
  if (task.status === 'running') return '查看进度';
  if (task.status === 'queued') return '查看进度';
  return undefined;
}

function deriveTags(task: ShowcaseTaskLike): string[] {
  const tags = new Set<string>();
  const input = task.input;

  if (input && 'effectGoal' in input && input.effectGoal) tags.add(input.effectGoal);
  if (input && 'platform' in input && input.platform) tags.add(input.platform);
  if (task.understanding?.outputGoal) tags.add(task.understanding.outputGoal);

  if (tags.size === 0) {
    tags.add('视频智能体');
    tags.add('样片交付');
  }

  return Array.from(tags).slice(0, 3);
}

export function buildTaskShowcaseViewModel(task: ShowcaseTaskLike): TaskShowcaseViewModel {
  const tags = deriveTags(task);

  if (task.recoveryState?.runState === 'interrupted') {
    return {
      statusLabel: '待恢复',
      headline: '任务已中断待恢复',
      body: task.recoveryState.pauseReasonMessage ?? '执行中断，可从上一步恢复',
      primaryActionLabel: resolvePrimaryActionLabel(task),
      accentClassName:
        'bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,#3B2318_0%,#7C2D12_54%,#F59E0B_100%)]',
      badgeToneClassName: 'border-amber-200 bg-amber-50 text-amber-700',
      heroEyebrow: '恢复模式',
      heroTitle: task.routePlan?.label ?? '继续当前任务',
      heroMeta: task.recoveryState.artifactsPreserved?.length
        ? `已保留 ${task.recoveryState.artifactsPreserved.length} 项中间结果`
        : '可保留中间结果后继续推进',
      tags,
    };
  }

  if (task.status === 'waiting_confirmation') {
    return {
      statusLabel: '待确认',
      headline: task.pendingConfirmation?.title ?? '等待确认',
      body: task.pendingConfirmation?.message ?? '请确认后继续',
      primaryActionLabel: resolvePrimaryActionLabel(task),
      accentClassName:
        'bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.28),transparent_36%),linear-gradient(180deg,#163B3A_0%,#0F766E_54%,#5EEAD4_100%)]',
      badgeToneClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      heroEyebrow: '确认节点',
      heroTitle: task.understanding?.coreAngle ?? task.routePlan?.label ?? '确认后进入正式生成',
      heroMeta: task.costEstimate ?? '进入下一阶段前需要你确认',
      tags,
    };
  }

  if (task.status === 'completed') {
    return {
      statusLabel: '已完成',
      headline: '结果已整理完成',
      body: task.understanding?.outputGoal ?? '样片与交付文件已准备完成',
      primaryActionLabel: resolvePrimaryActionLabel(task),
      accentClassName:
        'bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.28),transparent_36%),linear-gradient(180deg,#111214_0%,#1A1A1A_38%,#50535A_100%)]',
      badgeToneClassName: 'border-black/10 bg-white/90 text-black/70',
      heroEyebrow: '交付完成',
      heroTitle: task.understanding?.coreAngle ?? task.routePlan?.label ?? '样片已生成',
      heroMeta: task.artifacts?.length ? `已整理 ${task.artifacts.length} 项交付物` : '可继续查看与下载交付',
      tags,
    };
  }

  return {
    statusLabel: task.status === 'running' ? '生成中' : '待开始',
    headline: '结果正在路上',
    body:
      task.status === 'running'
        ? task.routePlan?.reason ?? 'Hermes 正在组织执行方案并推进样片生成'
        : '已接收需求，正在组织执行方案',
    primaryActionLabel: resolvePrimaryActionLabel(task),
    accentClassName:
      'bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.34),transparent_36%),linear-gradient(180deg,#0F172A_0%,#334155_52%,#94A3B8_100%)]',
    badgeToneClassName: 'border-slate-200 bg-slate-50 text-slate-700',
    heroEyebrow: '结果方向',
    heroTitle: task.understanding?.coreAngle ?? task.routePlan?.label ?? '视频智能体正在组织结果',
    heroMeta: task.understanding?.videoStyle ?? task.routePlan?.providerHint ?? '先给你稳定的结果方向，再进入正式执行',
    tags,
  };
}

export default function TaskShowcaseStage({
  task,
  onPrimaryAction,
  primaryActionLabel,
}: {
  task: ShowcaseTaskLike;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}) {
  const viewModel = buildTaskShowcaseViewModel(task);
  const actionLabel = primaryActionLabel ?? viewModel.primaryActionLabel;
  const isRecovery = task.recoveryState?.runState === 'interrupted';
  const isCompleted = task.status === 'completed';

  return (
    <section className="rounded-[28px] border border-black/8 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/35">
          <Film className="h-3.5 w-3.5" />
          展示舞台
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${viewModel.badgeToneClassName}`}
        >
          {viewModel.statusLabel}
        </span>
      </div>

      <div className={`mt-4 overflow-hidden rounded-[24px] p-4 text-white shadow-[0_20px_50px_rgba(0,0,0,0.16)] ${viewModel.accentClassName}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/72">{viewModel.heroEyebrow}</p>
            <p className="mt-2 max-w-[18rem] text-xl font-semibold leading-8">{viewModel.heroTitle}</p>
          </div>
          <div className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[11px] text-white/82 backdrop-blur">
            {isCompleted ? '已交付' : isRecovery ? '可恢复' : '推进中'}
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="max-w-[20rem] text-sm leading-6 text-white/78">{viewModel.heroMeta}</p>
            <div className="flex flex-wrap gap-2">
              {viewModel.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[11px] text-white/82 backdrop-blur"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden rounded-full border border-white/18 bg-white/10 p-4 text-white/82 shadow-sm backdrop-blur sm:flex">
            {isRecovery ? <AlertTriangle className="h-5 w-5" /> : isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-[24px] border border-black/8 bg-[#FCFCFD] p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-[#1A1A1A]">{viewModel.headline}</p>
          <p className="mt-2 max-w-[34rem] text-sm leading-6 text-black/52">{viewModel.body}</p>
        </div>
        {actionLabel && onPrimaryAction ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors ${
              isRecovery
                ? 'bg-[#9A3412] text-white hover:bg-[#7C2D12]'
                : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            {actionLabel}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-2 text-xs text-black/45">
            <Sparkles className="h-3.5 w-3.5" />
            {isCompleted ? '结果已落位' : '结果感优先'}
          </div>
        )}
      </div>
    </section>
  );
}
