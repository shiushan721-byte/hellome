import type { Task } from '../../../types/workbench';
import type { ShowcaseTaskLike } from './TaskShowcaseStage';

function deriveResultType(task: ShowcaseTaskLike): string {
  const input = task.input;
  if (input && 'effectGoal' in input && input.effectGoal) return input.effectGoal;
  return task.routePlan?.label ?? '视频样片';
}

function deriveDelivery(task: ShowcaseTaskLike): string {
  return task.understanding?.outputGoal ?? '10 秒视频样片';
}

function deriveBudget(task: ShowcaseTaskLike): string {
  if (task.status === 'waiting_confirmation') return '待确认后进入正式生成';
  if (task.recoveryState?.runState === 'interrupted') return '恢复后续跑，不重复从零开始';
  return task.costEstimate ?? '样片阶段执行';
}

function deriveScenario(task: ShowcaseTaskLike): string {
  const input = task.input;
  if (input && 'platform' in input && input.platform) return `${input.platform} 场景`;
  return task.routePlan?.providerHint ?? '通用视频场景';
}

export default function TaskResultSummaryBar({ task }: { task: ShowcaseTaskLike | Task }) {
  const items = [
    { label: '结果类型', value: deriveResultType(task) },
    { label: '交付形式', value: deriveDelivery(task) },
    { label: '成本策略', value: deriveBudget(task) },
    { label: '适用场景', value: deriveScenario(task) },
  ];

  return (
    <section className="rounded-[24px] border border-black/8 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-black/6 bg-[#FCFCFD] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/32">{item.label}</p>
            <p className="mt-2 text-sm font-medium leading-6 text-[#1A1A1A]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
