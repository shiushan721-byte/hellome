import type { Task } from '../../../types/workbench';
import TaskTimeline from './TaskTimeline';
import HermesLogPanel from './HermesLogPanel';
import GeoReportPanel from './GeoReportPanel';
import ResultActionBar from './ResultActionBar';
import TaskStatusBadge from './TaskStatusBadge';
import ConfirmationNode from './ConfirmationNode';

interface TaskRunLayoutProps {
  task: Task;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRerun?: () => void;
  copyHint?: string;
}

export default function TaskRunLayout({
  task,
  onConfirm,
  onCancel,
  onRerun,
  copyHint,
}: TaskRunLayoutProps) {
  const activeStep = task.steps.find((s) => s.status === 'active');

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-black truncate">{task.name}</h1>
          <p className="text-xs text-black/45 mt-0.5">Hermes 任务执行看板</p>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        {/* Left: execution process */}
        <div className="border-b lg:border-b-0 lg:border-r border-black/8 p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-2">
              当前步骤
            </h2>
            <p className="text-sm font-medium text-black">
              {activeStep?.name || (task.status === 'completed' ? '全部步骤已完成' : '准备中…')}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-3">
              步骤时间线
            </h2>
            <TaskTimeline steps={task.steps} />
          </div>

          <HermesLogPanel logs={task.logs} />

          {task.pendingConfirmation && (
            <ConfirmationNode
              title={task.pendingConfirmation.title}
              message={task.pendingConfirmation.message}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          )}

          {task.status === 'failed' && (
            <div className="p-3 bg-red-50 text-red-700 text-xs">
              任务执行失败，请检查输入后重新运行。
            </div>
          )}
        </div>

        {/* Right: results */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-4">
            结果交付
          </h2>

          {task.result ? (
            <>
              <GeoReportPanel result={task.result} brandName={task.input?.brandName} />
              <ResultActionBar result={task.result} onRerun={onRerun} />
              {copyHint && (
                <p className="text-[10px] text-emerald-600 mt-2">{copyHint}</p>
              )}
            </>
          ) : task.status === 'running' || task.status === 'waiting_confirmation' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-black/50">Hermes 正在执行任务，结果将在此展示</p>
            </div>
          ) : (
            <p className="text-sm text-black/45">暂无结果</p>
          )}
        </div>
      </div>
    </div>
  );
}
