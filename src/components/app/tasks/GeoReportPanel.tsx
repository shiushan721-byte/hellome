import type { GeoResultData } from '../../../types';

interface GeoReportPanelProps {
  result: GeoResultData;
  brandName?: string;
}

export default function GeoReportPanel({ result, brandName }: GeoReportPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold font-display text-black">AI 可见度报告</h3>
        {brandName && (
          <p className="text-xs text-black/50 mt-1">品牌：{brandName}</p>
        )}
        <p className="text-sm text-black/65 mt-3 leading-relaxed">{result.dynamicAnalysis}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="品牌出现率" value={`${result.visibilityRate}%`} />
        <MetricCard label="AI 推荐率" value={`${result.recommendationRate}%`} />
        <MetricCard label="竞品占位率" value={`${result.competitorShare}%`} />
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3">
          模型表现对比
        </h4>
        <div className="space-y-2">
          {result.visibilityDetails.map((d) => (
            <div key={d.modelName} className="flex items-center gap-3">
              <span className="text-xs text-black/60 w-40 shrink-0 truncate">{d.modelName}</span>
              <div className="flex-1 h-2 bg-[#F2F0ED]">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${Math.min(100, d.score)}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold w-10 text-right">{d.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-2">
          竞品占位分析
        </h4>
        <div className="flex flex-wrap gap-2">
          {result.keyCompetitors.map((c) => (
            <span key={c} className="text-xs px-2 py-1 bg-[#F2F0ED] text-black/70">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-2">
          高价值问题覆盖
        </h4>
        <ul className="space-y-2">
          {result.brandMentions.map((m, i) => (
            <li key={i} className="text-xs text-black/65 leading-relaxed flex gap-2">
              <span
                className={`shrink-0 text-[10px] font-bold uppercase ${
                  m.sentiment === 'positive'
                    ? 'text-emerald-600'
                    : m.sentiment === 'negative'
                      ? 'text-red-500'
                      : 'text-black/40'
                }`}
              >
                {m.sentiment}
              </span>
              <span>{m.context}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-black/50 mb-3">
          优化建议
        </h4>
        <div className="space-y-3">
          {result.actionableSuggestions.map((s, i) => (
            <div key={i} className="border-l-2 border-black pl-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-black">{s.title}</span>
                <PriorityBadge priority={s.priority} />
              </div>
              <p className="text-xs text-black/55 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F2F0ED] p-4 text-center">
      <p className="text-[10px] text-black/45 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold font-display text-black">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors =
    priority === 'High'
      ? 'bg-black text-white'
      : priority === 'Medium'
        ? 'bg-black/15 text-black'
        : 'bg-black/5 text-black/50';
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 uppercase ${colors}`}>
      {priority}
    </span>
  );
}
