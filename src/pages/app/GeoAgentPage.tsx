import { useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Inbox,
  Target,
} from 'lucide-react';
import { getAgentById } from '../../data/agentsCatalog';
import { isAgentActive, subscribeAgentSlots, getOccupiedSlotCount } from '../../lib/agentSlotStore';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { buildGeoWorkbenchStats } from '../../lib/geoWorkbenchStats';
import GeoTaskFormModal from '../../components/app/geo/GeoTaskFormModal';
import type { AgentEntryState } from '../../types/agentNavigation';
import { DEFAULT_AGENT_RETURN_PATH } from '../../types/agentNavigation';

const WORKFLOW_STEPS = ['关键词挖掘', '词库', '检测', '写文', '发布', '收录'] as const;

const GEO_TEAL = '#14958A';

export default function GeoAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = (location.state as AgentEntryState | null) ?? {};
  const agent = getAgentById(entry.agentId ?? 'geo');
  const agentName = agent?.name ?? 'GEO 智能体';
  const returnPath = entry.from ?? DEFAULT_AGENT_RETURN_PATH;

  const [showForm, setShowForm] = useState(false);
  const [trendRange, setTrendRange] = useState<'7' | '30' | '90'>('30');

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  const tasks = useSyncExternalStore(subscribeTasks, getTasks, () => []);

  const geoActive = isAgentActive('geo');
  const stats = useMemo(() => buildGeoWorkbenchStats(tasks), [tasks]);

  const trendSlice = useMemo(() => {
    const days = trendRange === '7' ? 7 : trendRange === '30' ? 30 : 90;
    return stats.trendData.slice(-days);
  }, [stats.trendData, trendRange]);

  const maxTrend = Math.max(1, ...trendSlice.flatMap((d) => [d.publish, d.indexed]));

  return (
    <div className="min-h-full bg-[#F0F2F5]">
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
        <div className="rounded-2xl border border-black/10 bg-[#F5F6F7] overflow-hidden min-h-[760px] flex">
          <aside className="w-[188px] shrink-0 border-r border-black/8 bg-[#F3F4F5] p-3 hidden lg:flex flex-col">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 text-xs font-bold bg-[#14958A] text-white rounded-md hover:bg-[#128278]"
            >
              + 快速发起
            </button>
            <nav className="mt-4 space-y-0.5 text-[12px]">
              {[
                '工作台',
                '品牌管理',
                'GEO 分析',
                'GEO 监控',
                '积分与账户',
                '内容文件',
                'Hermes 日志',
                '生成 GEO 文案',
              ].map((item, idx) => (
                <button
                  key={item}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    idx === 0 || idx === 7
                      ? 'bg-white text-[#1A1A1A] font-semibold'
                      : 'text-black/50 hover:bg-white/70'
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="h-14 px-5 border-b border-black/8 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(returnPath)}
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md border border-black/10 text-black/55 hover:bg-[#F2F0ED] hover:text-black transition-colors"
                  aria-label="返回"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h1 className="text-sm font-bold text-[#1A1A1A] truncate">{agentName}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Hermes 已连接
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold">工作台</div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1.5 text-[11px] font-bold border border-black/12 rounded-md hover:bg-white"
                >
                  刷新
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HermesCard onDetect={() => setShowForm(true)} />
                <PendingCard stats={stats} onInbox={() => navigate('/app/tasks?agent=geo')} />
              </div>

              <WorkflowBar onStartDetect={() => setShowForm(true)} />

              <section className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-4">
                <h2 className="text-sm font-bold text-black/70 mb-4">指标与趋势</h2>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MetricTile label="累计发布" value={stats.totalPublished} />
                    <MetricTile label="今日发布" value={stats.publishedToday} />
                    <MetricTile label="生成文章" value={stats.articlesGenerated} />
                    <MetricTile
                      label="命中关键词"
                      value={stats.keywordsHit > 0 ? `${stats.keywordsHit}%` : '0'}
                      sub={stats.keywordsHitDelta}
                    />
                  </div>
                  <div className="flex flex-wrap gap-6 justify-center xl:justify-end">
                    <DonutGauge label="平台命中率" value={stats.platformHitRate} color={GEO_TEAL} />
                    <DonutGauge label="品牌提及率" value={stats.brandMentionRate} color="#3B82F6" />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <section className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold">发布与收录趋势</h3>
                      <p className="text-[11px] text-black/40 mt-0.5">近 30 天 · 内容产出 vs 收录命中</p>
                    </div>
                    <div className="flex gap-1 text-[11px]">
                      {(['7', '30', '90'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setTrendRange(r)}
                          className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                            trendRange === r
                              ? 'bg-[#14958A] text-white'
                              : 'text-black/45 hover:bg-[#F2F0ED]'
                          }`}
                        >
                          {r}天
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-black/45 mb-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#14958A]" />
                      发布
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                      收录命中
                    </span>
                  </div>
                  <div className="h-44 flex items-end gap-0.5 px-1">
                    {trendSlice.map((d) => (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                        <div className="w-full flex items-end justify-center gap-px h-36">
                          <div
                            className="w-[42%] rounded-t-sm bg-[#14958A]/80 transition-all"
                            style={{ height: `${(d.publish / maxTrend) * 100}%`, minHeight: d.publish ? 4 : 0 }}
                            title={`发布 ${d.publish}`}
                          />
                          <div
                            className="w-[42%] rounded-t-sm bg-[#60A5FA]/70 transition-all"
                            style={{ height: `${(d.indexed / maxTrend) * 100}%`, minHeight: d.indexed ? 4 : 0 }}
                            title={`收录 ${d.indexed}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-xl border border-black/[0.06] shadow-sm p-4 flex flex-col min-h-[280px]">
                  <h3 className="text-sm font-bold mb-4">AI 平台收录分布</h3>
                  {stats.platformDistribution.length > 0 ? (
                    <div className="flex-1 space-y-3">
                      {stats.platformDistribution.map((p) => (
                        <div key={p.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{p.name}</span>
                            <span className="font-mono text-black/50">{p.pct}%</span>
                          </div>
                          <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#14958A] rounded-full transition-all"
                              style={{ width: `${Math.min(100, p.pct)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => navigate('/app/tasks')}
                        className="mt-auto w-full py-2.5 text-xs font-bold text-[#14958A] border border-[#14958A]/30 rounded-xl hover:bg-[#14958A]/5"
                      >
                        查看检测报告
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#F0F2F5] flex items-center justify-center mb-4">
                        <Target className="w-7 h-7 text-black/20" />
                      </div>
                      <p className="text-sm font-medium text-black/55">暂无收录分布</p>
                      <p className="text-xs text-black/40 mt-1 max-w-[240px] leading-relaxed">
                        创建检测计划后，将按平台展示命中率
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-[#14958A] rounded-xl hover:bg-[#128278]"
                      >
                        去收录排名
                      </button>
                    </div>
                  )}
                </section>
              </div>

              {!geoActive && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
                  <p>
                    <span className="font-bold">GEO 智能体尚未启用。</span>
                    启用后可在此工作台发起检测任务。
                  </p>
                  <Link
                    to="/app/agents/market?enable=geo"
                    className="px-4 py-2 text-xs font-bold bg-amber-900 text-white rounded-lg hover:bg-amber-800"
                  >
                    去启用
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <GeoTaskFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        initialKeywords={entry.prompt ?? ''}
        geoActive={geoActive}
      />
    </div>
  );
}

function HermesCard({ onDetect }: { onDetect: () => void }) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 relative">
      <button
        type="button"
        onClick={onDetect}
        className="absolute top-4 right-4 px-3 py-1 text-[11px] font-bold text-[#14958A] border border-[#14958A]/40 rounded-lg hover:bg-[#14958A]/5"
      >
        检测
      </button>
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-4 h-4 text-black/40" />
        <h2 className="text-sm font-bold">本机 Hermes</h2>
      </div>
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-emerald-700">已连接</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-3 py-2 text-xs font-medium border border-black/10 rounded-lg hover:bg-[#F2F0ED] text-black/60"
        >
          管理本机 Hermes
        </button>
        <Link
          to="/app/tasks?agent=geo"
          className="px-3 py-2 text-xs font-medium border border-black/10 rounded-lg hover:bg-[#F2F0ED] text-black/60"
        >
          查看运行日志
        </Link>
      </div>
    </section>
  );
}

function PendingCard({
  stats,
  onInbox,
}: {
  stats: ReturnType<typeof buildGeoWorkbenchStats>;
  onInbox: () => void;
}) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Inbox className="w-4 h-4 text-black/40" />
        <h2 className="text-sm font-bold">待处理结果</h2>
      </div>
      <p className="text-xs text-black/45 mb-1">
        {stats.pendingCount > 0
          ? `${stats.pendingCount} 个结果待确认`
          : '暂无待确认结果'}
      </p>
      <p className="text-[11px] text-black/40 mb-5">
        今日查询任务：排队 {stats.queuedCount}，执行中 {stats.runningCount}，已完成{' '}
        {stats.completedToday}
      </p>
      <button
        type="button"
        onClick={onInbox}
        className="mt-auto w-full sm:w-auto self-start px-5 py-2.5 text-xs font-bold text-white bg-[#14958A] rounded-xl hover:bg-[#128278]"
      >
        查看结果收件箱
      </button>
    </section>
  );
}

function WorkflowBar({ onStartDetect }: { onStartDetect: () => void }) {
  return (
    <section className="bg-white rounded-2xl border border-black/[0.06] shadow-sm px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-black/55 shrink-0">推荐下一步</span>
        {WORKFLOW_STEPS.map((step, i) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg ${
                step === '检测'
                  ? 'bg-[#14958A]/10 text-[#14958A] font-bold'
                  : 'text-black/45'
              }`}
            >
              {step}
            </span>
            {i < WORKFLOW_STEPS.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-black/25 shrink-0" />
            )}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onStartDetect}
        className="shrink-0 px-5 py-2.5 text-xs font-bold text-white bg-[#14958A] rounded-xl hover:bg-[#128278] flex items-center gap-1.5"
      >
        前往 关键词挖掘
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </section>
  );
}

function MetricTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#F8F9FA] border border-black/[0.04]">
      <p className="text-[11px] text-black/45 mb-2">{label}</p>
      <p className="text-2xl font-bold font-mono text-[#1A1A1A]">{value}</p>
      {sub && <p className="text-[10px] text-black/35 mt-1">{sub}</p>}
    </div>
  );
}

function DonutGauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[120px]">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#F0F2F5" strokeWidth="10" />
          <circle
            cx="48"
            cy="48"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono">
          {value}%
        </span>
      </div>
      <p className="text-[11px] text-black/50 text-center">{label}</p>
    </div>
  );
}
