import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { clearAllActivationsForDebug } from '../../lib/agentSlotStore';
import {
  applyHermesDebugPreset,
  clearHermesPairing,
  getHermesConnection,
  subscribeHermesConnection,
  type HermesConnectionStatus,
  type HermesDebugPreset,
} from '../../lib/hermesConnection';
import { clearWorkbenchTabs } from '../../lib/workbenchTabs';

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

const STATUS_LABELS: Record<HermesConnectionStatus, string> = {
  connected: '已连接',
  offline: '离线',
  not_paired: '未配对',
  pairing: '配对中',
  account_mismatch: '账号不一致',
  version_unsupported: '版本不支持',
  capability_missing: '未安装',
};

export function formatHermesStatusLabel(status: HermesConnectionStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function useDebugActions() {
  const navigate = useNavigate();

  const applyPreset = (preset: HermesDebugPreset, onApplied?: () => void) => {
    if (preset === 'first_run_empty') {
      clearHermesPairing();
      clearWorkbenchTabs();
      clearAllActivationsForDebug();
      applyHermesDebugPreset('not_paired');
      navigate('/app');
      onApplied?.();
      return;
    }
    applyHermesDebugPreset(preset);
    if (preset !== 'paired') {
      navigate('/app');
    }
    onApplied?.();
  };

  return { applyPreset };
}

function DebugOptionList({
  snapshotStatus,
  onSelect,
}: {
  snapshotStatus: HermesConnectionStatus;
  onSelect: (preset: HermesDebugPreset) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-black/50">
        当前模拟状态：<span className="font-bold text-black/70">{formatHermesStatusLabel(snapshotStatus)}</span>
      </p>
      <p className="text-[10px] text-black/40 leading-relaxed">
        仅本地调试，不会连接真实 Hz-Hermes 客户端。
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className="px-3 py-2 rounded-lg text-[11px] font-bold bg-[#F2F0ED] text-black/70 hover:bg-black/10 hover:text-black text-left transition-colors"
          >
            <span>{option.label}</span>
            {option.desc ? (
              <span className="block font-normal text-black/40 mt-0.5">{option.desc}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function usePopoverPosition(anchorRef: RefObject<HTMLElement | null>, open: boolean) {
  const [style, setStyle] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setStyle({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, open]);

  return style;
}

export function HermesDebugPopover({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = usePopoverPosition(anchorRef, open);
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const { applyPreset } = useDebugActions();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorRef, onClose, open]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[80] w-[min(320px,calc(100vw-24px))] rounded-xl border border-black/10 bg-white shadow-xl p-4"
      style={{ top: position.top, right: position.right }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="flex items-center gap-2 text-xs font-bold text-black/70">
          <Bug className="w-4 h-4 text-sky-600" />
          Hz-Hermes 调试面板
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-md border border-black/10 text-black/45 hover:bg-[#F2F0ED] text-sm leading-none"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <DebugOptionList
        snapshotStatus={snapshot.status}
        onSelect={(preset) => applyPreset(preset, onClose)}
      />
    </div>,
    document.body,
  );
}

export default function HermesDebugPanel() {
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const { applyPreset } = useDebugActions();

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
        <div className="mt-2 px-1">
          <DebugOptionList
            snapshotStatus={snapshot.status}
            onSelect={(preset) => applyPreset(preset)}
          />
        </div>
      ) : null}
    </div>
  );
}
