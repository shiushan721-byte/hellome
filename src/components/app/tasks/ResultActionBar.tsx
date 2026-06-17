import { Copy, Download, RefreshCw, FileText } from 'lucide-react';
import type { GeoResultData } from '../../../types';

interface ResultActionBarProps {
  result?: GeoResultData;
  onRerun?: () => void;
  onCopy?: () => void;
}

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
    <div className="flex flex-wrap gap-2 pt-4 border-t border-black/8">
      <ActionBtn icon={Copy} label="复制摘要" onClick={handleCopy} disabled={!result} />
      <ActionBtn icon={Download} label="导出报告" onClick={handleExport} disabled={!result} />
      <ActionBtn icon={FileText} label="生成 FAQ" disabled />
      <ActionBtn icon={FileText} label="生成 LLMs.txt" disabled />
      <ActionBtn icon={RefreshCw} label="重新运行" onClick={onRerun} />
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Copy;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold border border-black/15 hover:bg-[#F2F0ED] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
