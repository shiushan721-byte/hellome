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
  planName,
  enabledLimit,
  occupiedCount,
  onConfirm,
  onClose,
}: {
  agentName: string;
  planName: string;
  enabledLimit: number;
  occupiedCount: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title={`启用 ${agentName}？`} onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">
        你的{planName}套餐可同时启用 {enabledLimit} 个智能体，当前已启用 {occupiedCount} 个。
        启用后将占用 1 个智能体名额。该智能体内的任务会按实际 Token 消耗计费。
      </p>
      <p className="text-xs text-black/45 leading-relaxed">
        你可以随时在「我的智能体」中停用并更换智能体。停用不会删除历史任务和结果，已消耗 Token 不会退回。
      </p>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85"
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
      <ModalShell title="该智能体还有进行中的任务" onClose={onClose}>
        <p className="text-sm text-black/60 leading-relaxed">{check.message}</p>
        {runningTaskCount > 0 && (
          <p className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
            当前有 {runningTaskCount} 个任务进行中或等待确认
          </p>
        )}
        <ConsequenceList
          items={[
            '选择「取消任务并停用」将终止未完成任务',
            '已产生的 Token 按实际消耗结算',
            '停用后立即释放智能体名额',
          ]}
        />
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
          >
            取消
          </button>
          {onViewTasks && (
            <button
              type="button"
              onClick={onViewTasks}
              className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
            >
              查看任务
            </button>
          )}
          {onCancelTasksAndDeactivate && (
            <button
              type="button"
              onClick={onCancelTasksAndDeactivate}
              className="flex-1 py-2.5 text-xs font-bold bg-amber-700 text-white hover:bg-amber-800"
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
          className="w-full py-2.5 text-xs font-bold border border-black/15"
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
          '停用后立即释放名额',
          '历史任务和结果仍可查看',
          '已消耗 Token 不会退回',
        ]}
      />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85"
        >
          确认停用
        </button>
      </div>
    </ModalShell>
  );
}

export function SlotsFullModal({
  message,
  onClose,
  onViewMine,
  onUpgrade,
}: {
  message: string;
  onClose: () => void;
  onViewMine?: () => void;
  onUpgrade?: () => void;
}) {
  return (
    <ModalShell title="智能体名额已满" onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">
        {message ||
          '你的当前套餐可同时启用的智能体名额已全部使用。如需启用新的智能体，请在「我的智能体」中停用一个已启用智能体，或升级套餐。'}
      </p>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15"
        >
          关闭
        </button>
        {onViewMine && (
          <button
            type="button"
            onClick={onViewMine}
            className="flex-1 py-2.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
          >
            去我的智能体
          </button>
        )}
        {onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="flex-1 py-2.5 text-xs font-bold bg-black text-white"
          >
            升级套餐
          </button>
        )}
      </div>
    </ModalShell>
  );
}

export function EnableSuccessBanner({
  agentName,
  onViewMine,
  onDismiss,
}: {
  agentName: string;
  onViewMine: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm">
      <p className="text-emerald-800 font-medium flex-1">{agentName} 已启用</p>
      <button
        type="button"
        onClick={onViewMine}
        className="px-3 py-1.5 text-xs font-bold bg-black text-white"
      >
        查看我的智能体
      </button>
      <button type="button" onClick={onDismiss} className="text-xs text-black/40 hover:text-black">
        关闭
      </button>
    </div>
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
        {agentName} 已停用，名额已立即释放。历史任务和结果仍可查看。
      </p>
      {onGoMarket && (
        <button
          type="button"
          onClick={onGoMarket}
          className="px-3 py-1.5 text-xs font-bold bg-black text-white"
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
