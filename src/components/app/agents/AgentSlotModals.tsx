import type { DeactivateCheckResult, EnableCheckResult } from '../../types/agentSlots';

interface ModalShellProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

function ModalShell({ title, children, onClose }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md p-6 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-black">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ConsequenceList({ items }: { items: string[] }) {
  return (
    <ul className="text-sm text-black/60 leading-relaxed space-y-1.5 list-disc pl-4">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function EnableAgentModal({
  agentName,
  onConfirm,
  onClose,
}: {
  agentName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title={`启用 ${agentName}？`} onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">
        启用后会出现在我的工作台顶部标签栏。
      </p>
      <p className="text-xs text-black/45 leading-relaxed">
        启用智能体不消耗 Token，只有执行任务时才会按实际用量消耗 Token。
      </p>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
        >
          确认启用
        </button>
      </div>
    </ModalShell>
  );
}

export function DeactivateAgentModal({
  agentName,
  check,
  runningTaskCount = 0,
  onConfirm,
  onClose,
  onViewTasks,
  onCancelTasksAndDeactivate,
}: {
  agentName: string;
  check: DeactivateCheckResult;
  runningTaskCount?: number;
  onConfirm: () => void;
  onClose: () => void;
  onViewTasks?: () => void;
  onCancelTasksAndDeactivate?: () => void;
}) {
  if (check.hasRunningTasks) {
    return (
      <ModalShell title={`${agentName} 当前有执行中的任务`} onClose={onClose}>
        <p className="text-sm text-black/60 leading-relaxed">
          你可以先查看任务，或取消任务后停用。取消任务会按已完成部分结算已消耗 Token。
        </p>
        {runningTaskCount > 0 && (
          <p className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
            当前有 {runningTaskCount} 个任务进行中或等待确认
          </p>
        )}
        <ConsequenceList
          items={[
            '选择「取消任务并停用」将终止未完成任务',
            '已产生的 Token 按实际消耗结算',
            '停用后将从工作台标签栏移除',
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
          >
            取消
          </button>
          {onViewTasks && (
            <button
              type="button"
              onClick={onViewTasks}
              className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
            >
              查看任务
            </button>
          )}
          {onCancelTasksAndDeactivate && (
            <button
              type="button"
              onClick={onCancelTasksAndDeactivate}
              className="flex-1 py-2.5 text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 rounded-lg"
            >
              取消任务并停用
            </button>
          )}
        </div>
      </ModalShell>
    );
  }

  if (!check.allowed) {
    return (
      <ModalShell title="暂时不能停用" onClose={onClose}>
        <p className="text-sm text-black/60 leading-relaxed">{check.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-xs font-bold border border-black/15 rounded-lg"
        >
          知道了
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={`停用 ${agentName}？`} onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">{check.message}</p>
      <ConsequenceList
        items={[
          '历史任务和结果仍可查看',
          '已消耗 Token 不会退回',
          '可随时重新启用',
        ]}
      />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
        >
          确认停用
        </button>
      </div>
    </ModalShell>
  );
}

export function DeactivateSuccessBanner({
  agentName,
  onDismiss,
  onGoMarket,
}: {
  agentName: string;
  onDismiss: () => void;
  onGoMarket?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#F2F0ED] border border-black/10 px-4 py-3 text-sm">
      <p className="text-black/75 font-medium flex-1">
        {agentName} 已停用。历史任务和结果仍可查看。
      </p>
      {onGoMarket && (
        <button
          type="button"
          onClick={onGoMarket}
          className="px-3 py-1.5 text-xs font-bold bg-black text-white rounded-lg"
        >
          去智能体市场
        </button>
      )}
      <button type="button" onClick={onDismiss} className="text-xs text-black/40 hover:text-black">
        关闭
      </button>
    </div>
  );
}

export type { EnableCheckResult, DeactivateCheckResult };
