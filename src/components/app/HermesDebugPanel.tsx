import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { clearAllActivationsForDebug } from '../../lib/agentSlotStore';
import {
  applyHermesDebugPreset,
  clearHermesPairing,
  getHermesConnection,
  subscribeHermesConnection,
  type HermesDebugPreset,
} from '../../lib/hermesConnection';

const OPTIONS: Array<{ id: HermesDebugPreset; label: string; desc?: string }> = [
  {
    id: 'first_run_empty',
    label: '模拟首次进入',
    desc: '未配对 + 清空已启用智能体',
  },
  { id: 'not_installed', label: '未安装 Hz-Hermes' },
  { id: 'not_paired', label: '等待配对' },
  { id: 'account_mismatch', label: '账号不一致' },
  { id: 'offline', label: '已配对但离线' },
  { id: 'paired', label: '已配对已连接' },
];

export default function HermesDebugPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  const applyPreset = (preset: HermesDebugPreset) => {
    if (preset === 'first_run_empty') {
      clearHermesPairing();
      clearAllActivationsForDebug();
      applyHermesDebugPreset('not_paired');
      navigate('/app');
      return;
    }
    applyHermesDebugPreset(preset);
    if (preset !== 'paired') {
      navigate('/app');
    }
  };

  return (
    <div className="p-3 border-t border-black/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-left hover:bg-[#F2F0ED] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-black/55">
          <Bug className="w-3.5 h-3.5 text-sky-600" />
          Hz-Hermes 调试
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
                onClick={() => applyPreset(option.id)}
                className="px-2 py-1.5 rounded text-[10px] font-bold bg-[#F2F0ED] text-black/65 hover:bg-black/10 hover:text-black text-left"
              >
                <span>{option.label}</span>
                {option.desc ? (
                  <span className="block font-normal text-black/40 mt-0.5">{option.desc}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
