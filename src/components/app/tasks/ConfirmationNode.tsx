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
    <div className="border border-amber-300 bg-amber-50/80 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">{title}</p>
          <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-xs font-bold border border-black/15 hover:bg-white transition-colors"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 transition-colors"
        >
          确认继续
        </button>
      </div>
    </div>
  );
}
