import type { Task } from '../../../types/workbench';

export interface TaskRailStage {
  label: string;
  state: 'completed' | 'active' | 'pending' | 'warning' | 'error';
}

function resolveCursor(task: Pick<Task, 'status' | 'steps' | 'recoveryState'>): number {
  const activeIndex = task.steps.findIndex((step) => step.status === 'active');

  if (task.status === 'queued') return 0;
  if (task.status === 'waiting_confirmation') return 2;
  if (task.recoveryState?.runState === 'interrupted') {
    if (activeIndex >= 5) return 4;
    if (activeIndex >= 3) return 3;
    if (activeIndex >= 0) return 1;
    return 1;
  }
  if (task.status === 'completed') return 5;
  if (activeIndex >= 5) return 4;
  if (activeIndex >= 3) return 3;
  if (activeIndex >= 0) return 1;
  if (task.status === 'running') return 1;
  return 0;
}

export function buildTaskStages(task: Pick<Task, 'status' | 'steps' | 'recoveryState'>): TaskRailStage[] {
  const labels = ['已接收', '方案规划', '确认节点', '视频生成', '整理交付', '已完成'];
  const cursor = resolveCursor(task);
  const interrupted = task.recoveryState?.runState === 'interrupted';
  const waitingConfirmation = task.status === 'waiting_confirmation';

  return labels.map((label, index) => {
    if (task.status === 'completed') {
      return {
        label,
        state: index <= cursor ? 'completed' : 'pending',
      };
    }

    if (index < cursor) return { label, state: 'completed' };
    if (index > cursor) return { label, state: 'pending' };
    if (interrupted) return { label, state: 'error' };
    if (waitingConfirmation) return { label, state: 'warning' };
    return { label, state: 'active' };
  });
}

const stateClassName: Record<TaskRailStage['state'], string> = {
  completed: 'border-black/10 bg-black text-white',
  active: 'border-black bg-black text-white',
  pending: 'border-black/8 bg-[#F7F7F8] text-black/40',
  warning: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  error: 'border-amber-300 bg-amber-50 text-amber-700',
};

export default function TaskStageRail({ stages }: { stages: TaskRailStage[] }) {
  return (
    <section className="rounded-[24px] border border-black/8 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage) => (
          <span
            key={stage.label}
            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${stateClassName[stage.state]}`}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </section>
  );
}
