import type { HermesLogEntry } from '../../../types/workbench';

interface HermesLogPanelProps {
  logs: HermesLogEntry[];
}

const levelColor: Record<HermesLogEntry['level'], string> = {
  info: 'text-black/70',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  error: 'text-red-600',
};

export default function HermesLogPanel({ logs }: HermesLogPanelProps) {
  return (
    <div className="bg-[#F2F0ED]/60 border border-black/8">
      <div className="px-3 py-2 border-b border-black/8 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
          Hz-Hermes 操作日志
        </span>
        <span className="text-[10px] font-mono text-black/35">{logs.length} 条</span>
      </div>
      <div className="max-h-48 overflow-y-auto custom-scrollbar p-3 space-y-1.5 font-mono text-[11px]">
        {logs.length === 0 ? (
          <p className="text-black/35">等待任务启动…</p>
        ) : (
          logs.map((log) => (
            <p key={log.id} className={levelColor[log.level]}>
              <span className="text-black/35">[{log.timestamp}]</span> {log.message}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
