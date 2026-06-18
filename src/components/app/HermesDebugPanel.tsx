import { useState, useSyncExternalStore } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import {
  applyHermesDebugPreset,
  getHermesConnection,
  subscribeHermesConnection,
  type HermesDebugPreset,
} from '../../lib/hermesConnection';

const OPTIONS: Array<{ id: HermesDebugPreset; label: string }> = [
  { id: 'not_installed', label: '未安装 Hermes' },
  { id: 'not_paired', label: '未配对 Hermes' },
  { id: 'paired', label: '已配对 Hermes' },
];

export default function HermesDebugPanel() {
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  return (
    <div className="p-3 border-t border-black/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-left hover:bg-[#F2F0ED] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-black/55">
          <Bug className="w-3.5 h-3.5 text-sky-600" />
          Hermes 调试
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-black/35" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-black/35" />
        )}
      </button>

      {open ? (
        <div className="mt-2 space-y-2 px-1">
          <p className="text-[10px] text-black/45">当前状态：{snapshot.status}</p>
          <div className="grid grid-cols-1 gap-1">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => applyHermesDebugPreset(option.id)}
                className="px-2 py-1.5 rounded text-[10px] font-bold bg-[#F2F0ED] text-black/65 hover:bg-black/10 hover:text-black text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
