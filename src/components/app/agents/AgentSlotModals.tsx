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
        你的{planName}套餐可启用 {enabledLimit} 个智能体，当前已启用 {occupiedCount} 个。
        启用后将占用 1 个智能体名额。该智能体内的任务会按实际 Token 消耗计费。
      </p>
      <p className="text-xs text-black/45 leading-relaxed">
        启用后 10 分钟内，若未完成正式任务且消耗低于 1,000 Token，可立即停用并释放名额。
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
  onConfirm,
  onClose,
  onViewTasks,
}: {
  agentName: string;
  check: DeactivateCheckResult;
  onConfirm: () => void;
  onClose: () => void;
  onViewTasks?: () => void;
}) {
  if (check.hasRunningTasks) {
    return (
      <ModalShell title="暂时不能停用" onClose={onClose}>
        <p className="text-sm text-black/60 leading-relaxed">{check.message}</p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold border border-black/15"
          >
            关闭
          </button>
          {onViewTasks && (
            <button
              type="button"
              onClick={onViewTasks}
              className="flex-1 py-2.5 text-xs font-bold bg-black text-white"
            >
              查看任务
            </button>
          )}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={`停用 ${agentName}？`} onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">{check.message}</p>
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
  onUpgrade,
}: {
  message: string;
  onClose: () => void;
  onUpgrade?: () => void;
}) {
  return (
    <ModalShell title="名额已满" onClose={onClose}>
      <p className="text-sm text-black/60 leading-relaxed">{message}</p>
      <p className="text-xs text-black/45">
        如需启用新的智能体，请停用一个已启用智能体或升级套餐。
      </p>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-xs font-bold border border-black/15"
        >
          关闭
        </button>
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

export type { EnableCheckResult, DeactivateCheckResult };
