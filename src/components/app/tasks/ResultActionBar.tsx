import { Copy, Download, RefreshCw, FileText } from 'lucide-react';
import type { GeoResultData } from '../../../types';

interface ResultActionBarProps {
  result?: GeoResultData;
  onRerun?: () => void;
  onCopy?: () => void;
}

const EXTRA_ACTIONS = [
  { icon: FileText, label: '生成 FAQ', hint: '约 3,000-8,000 Token', disabled: true },
  { icon: FileText, label: '生成 LLMs.txt', hint: '约 2,000-6,000 Token', disabled: true },
  { icon: FileText, label: '生成官网文案', hint: '约 5,000-15,000 Token', disabled: true },
];

export default function ResultActionBar({ result, onRerun, onCopy }: ResultActionBarProps) {
  const handleCopy = () => {
    if (!result) return;
    const text = [
      `品牌出现率: ${result.visibilityRate}%`,
      `AI 推荐率: ${result.recommendationRate}%`,
      `竞品占位率: ${result.competitorShare}%`,
      '',
      result.dynamicAnalysis,
      '',
      '优化建议:',
      ...result.actionableSuggestions.map((s) => `- [${s.priority}] ${s.title}: ${s.description}`),
    ].join('\n');
    navigator.clipboard.writeText(text);
    onCopy?.();
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geo-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-4 border-t border-black/8 space-y-3">
      <div className="flex flex-wrap gap-2">
        <ActionBtn icon={Copy} label="复制摘要" onClick={handleCopy} disabled={!result} />
        <ActionBtn
          icon={Download}
          label="导出报告"
          hint="0-1,000 Token"
          onClick={handleExport}
          disabled={!result}
        />
        {EXTRA_ACTIONS.map((a) => (
          <div key={a.label}>
            <ActionBtn icon={a.icon} label={a.label} hint={a.hint} disabled={a.disabled} />
          </div>
        ))}
        <ActionBtn icon={RefreshCw} label="重新运行" hint="按新任务预估" onClick={onRerun} />
      </div>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: typeof Copy;
  label: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex flex-col items-start gap-0.5 px-3 py-1.5 text-[11px] font-bold border border-black/15 hover:bg-[#F2F0ED] disabled:opacity-35 disabled:cursor-not-allowed transition-colors text-left"
    >
      <span className="inline-flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
      </span>
      {hint && <span className="text-[9px] font-normal text-black/40 pl-5">{hint}</span>}
    </button>
  );
}
