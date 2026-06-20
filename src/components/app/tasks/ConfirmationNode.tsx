import { Shield } from 'lucide-react';

interface ConfirmationNodeProps {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function ConfirmationNode({
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmationNodeProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50/85 p-4 shadow-[0_12px_30px_rgba(245,158,11,0.08)]">
      <div className="inline-flex rounded-full bg-[#FCE7B2] px-3 py-1 text-[11px] font-semibold text-amber-800">
        Pending Approval
      </div>
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div>
          <p className="text-sm font-bold text-amber-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/80">{message}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-black/15 py-2 text-xs font-bold transition-colors hover:bg-white"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-black py-2 text-xs font-bold text-white transition-colors hover:bg-black/85"
        >
          确认继续
        </button>
      </div>
    </div>
  );
}
