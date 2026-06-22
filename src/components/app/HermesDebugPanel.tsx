import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bug, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import { canAccessAdmin } from '../../lib/auth';
import { useLoginModal } from '../../context/LoginModalProvider';
import {
  applyHermesDebugPreset,
  getHermesConnection,
  subscribeHermesConnection,
  type HermesConnectionStatus,
  type HermesDebugPreset,
} from '../../lib/hermesConnection';

export type HermesDisplayPreset =
  | 'not_installed'
  | 'not_paired'
  | 'offline'
  | 'paired'
  | 'me_running';

export const HERMES_DISPLAY_OPTIONS: Array<{
  id: HermesDisplayPreset;
  label: string;
  preset: HermesDebugPreset;
}> = [
  { id: 'not_installed', label: '未下载', preset: 'not_installed' },
  { id: 'not_paired', label: '未配对', preset: 'not_paired' },
  { id: 'offline', label: '未连接', preset: 'offline' },
  { id: 'paired', label: '已连接', preset: 'paired' },
  { id: 'me_running', label: 'Me运行中', preset: 'me_running' },
];

export function formatHermesTopbarLabel(status: HermesConnectionStatus): string {
  switch (status) {
    case 'capability_missing':
      return '未下载';
    case 'not_paired':
    case 'pairing':
      return '未配对';
    case 'offline':
    case 'account_mismatch':
    case 'version_unsupported':
      return '未连接';
    case 'connected':
      return '已连接';
    case 'me_running':
      return 'Me运行中';
    default:
      return '未配对';
  }
}

export function resolveHermesDisplayPreset(status: HermesConnectionStatus): HermesDisplayPreset {
  switch (status) {
    case 'capability_missing':
      return 'not_installed';
    case 'not_paired':
    case 'pairing':
      return 'not_paired';
    case 'offline':
    case 'account_mismatch':
    case 'version_unsupported':
      return 'offline';
    case 'connected':
      return 'paired';
    case 'me_running':
      return 'me_running';
    default:
      return 'not_paired';
  }
}

function useDebugActions() {
  const navigate = useNavigate();

  const applyPreset = (preset: HermesDebugPreset) => {
    applyHermesDebugPreset(preset);
    if (preset !== 'paired' && preset !== 'me_running') {
      navigate('/app');
    }
  };

  return { applyPreset };
}

function DisplayOptionList({
  activeId,
  onSelect,
}: {
  activeId: HermesDisplayPreset;
  onSelect: (preset: HermesDebugPreset) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-1">
      {HERMES_DISPLAY_OPTIONS.map((option) => {
        const selected = activeId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.preset)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition-colors ${
              selected
                ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-300'
                : 'bg-[#F2F0ED] text-black/70 hover:bg-black/10 hover:text-black'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function AdminEntryButton({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const { openLogin } = useLoginModal();
  const isAdmin = canAccessAdmin();

  const handleOpenAdmin = () => {
    if (isAdmin) {
      navigate('/admin/dashboard');
      onDone?.();
      return;
    }
    openLogin({ redirect: '/admin/dashboard' });
    onDone?.();
  };

  return (
    <div className="pt-2 border-t border-[#f0f0f0] space-y-1.5">
      <p className="text-[10px] text-black/40">开发工具</p>
      <button
        type="button"
        onClick={handleOpenAdmin}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-100 text-violet-900 hover:bg-violet-200 transition-colors"
      >
        <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
        进入 Boss Admin
      </button>
      {!isAdmin ? (
        <p className="text-[10px] text-black/35 leading-relaxed">管理员账号：13800138000</p>
      ) : null}
    </div>
  );
}

export function HermesDebugDock({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const { applyPreset } = useDebugActions();
  const activeId = resolveHermesDisplayPreset(snapshot.status);

  if (collapsed) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title="Hz-Hermes 调试"
          aria-label="Hz-Hermes 调试"
          aria-expanded={open}
          className="flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-[#444444] hover:bg-[#f7f7f8] hover:text-[#111111] transition-colors"
        >
          <Bug className="w-5 h-5 text-sky-600" />
        </button>
        {open ? (
          <div className="absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-xl border border-[#f0f0f0] bg-white p-2 shadow-lg space-y-2">
            <DisplayOptionList activeId={activeId} onSelect={(preset) => {
              applyPreset(preset);
              setOpen(false);
            }} />
            <AdminEntryButton onDone={() => setOpen(false)} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#f0f0f0] bg-[#fafafa] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#f2f2f4] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold text-black/55">
          <Bug className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          Hz-Hermes 调试
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-black/35 shrink-0" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-black/35 shrink-0" />
        )}
      </button>

      {open ? (
        <div className="px-3 pb-3 space-y-2 border-t border-[#f0f0f0]">
          <p className="text-[10px] text-black/40 pt-2 leading-relaxed">
            仅本地调试，不会连接真实 Hz-Hermes。
          </p>
          <DisplayOptionList activeId={activeId} onSelect={applyPreset} />
          <AdminEntryButton />
        </div>
      ) : null}
    </div>
  );
}

export default function HermesDebugPanel() {
  const snapshot = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const { applyPreset } = useDebugActions();
  const activeId = resolveHermesDisplayPreset(snapshot.status);

  return (
    <div className="p-3 border-t border-black/8">
      <p className="flex items-center gap-2 text-[11px] font-bold text-black/55 mb-2">
        <Bug className="w-3.5 h-3.5 text-sky-600" />
        Hz-Hermes 调试
      </p>
      <DisplayOptionList activeId={activeId} onSelect={applyPreset} />
    </div>
  );
}
