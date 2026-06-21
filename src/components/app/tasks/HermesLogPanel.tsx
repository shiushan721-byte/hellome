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
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#FCFCFD]">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-black/50">
          执行详情
        </span>
        <span className="text-[10px] font-mono text-black/35">{logs.length} 条</span>
      </div>
      <div className="max-h-64 space-y-1.5 overflow-y-auto p-4 font-mono text-[11px] custom-scrollbar">
        {logs.length === 0 ? (
          <p className="text-black/35">任务启动后，这里会记录关键执行信息。</p>
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
