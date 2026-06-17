import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, PenLine, Users } from 'lucide-react';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { getUsage, getLedger } from '../../lib/usageStore';
import { formatToken, estimateStandardGeoTaskCount } from '../../lib/tokenBilling';
import TaskStatusBadge, { agentLabel, formatTime } from '../../components/app/tasks/TaskStatusBadge';
import { useSyncExternalStore } from 'react';

const templates = [
  { label: '检测品牌 AI 可见度', agent: 'geo', prompt: '检测品牌在 AI 搜索里的可见度' },
  { label: '生成 GEO 优化建议', agent: 'geo', prompt: '生成 GEO 优化建议' },
  { label: '写公众号文章', agent: 'media', prompt: '写一篇公众号文章' },
  { label: '分析客户网站', agent: 'sales', prompt: '分析客户网站' },
  { label: '生成销售私信', agent: 'sales', prompt: '生成销售私信' },
];

export default function AppHomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const tasks = useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const usage = getUsage();
  const recent = tasks.slice(0, 5);
  const estTasks = estimateStandardGeoTaskCount(usage.tokenBalance);
  const last7d = getLedger()
    .filter((e) => Date.now() - new Date(e.time).getTime() < 7 * 86400000)
    .reduce((sum, e) => sum + e.tokenUsed, 0);

  const handleStart = () => {
    navigate('/app/agents/geo', { state: { prompt } });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold font-display text-black">
          今天想让智能体完成什么？
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="帮我检测某品牌在 AI 搜索里的可见度…"
            className="flex-1 py-3.5 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/app/agents')}
              className="px-4 py-3.5 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
            >
              推荐智能体
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="px-5 py-3.5 text-xs font-bold bg-black text-white hover:bg-black/85 flex items-center gap-1.5"
            >
              开始任务
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-3">常用任务</h2>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => {
                if (t.agent === 'geo') navigate('/app/agents/geo');
                else navigate('/app/agents');
              }}
              className="px-3 py-2 text-xs font-medium bg-[#F2F0ED] hover:bg-[#E8E6E3] transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-3">最近任务</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-black/40 py-6">暂无任务，从上方开始第一个吧</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/tasks/${task.id}`)}
                    className="w-full text-left p-3 bg-white border border-black/8 hover:border-black/20 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.name}</p>
                      <p className="text-[11px] text-black/40 mt-0.5">
                        {agentLabel(task.agentType)} · {formatTime(task.createdAt)}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 mb-3">用量概览</h2>
          <div className="grid grid-cols-2 gap-3">
            <UsageCard label="剩余 Token" value={formatToken(usage.tokenBalance)} />
            <UsageCard label="本月已用" value={formatToken(usage.monthlyTokenUsed)} />
            <UsageCard label="本月总额度" value={formatToken(usage.monthlyTokenLimit)} />
            <UsageCard label="近 7 天消耗" value={formatToken(last7d)} />
          </div>
          <p className="text-[11px] text-black/40 mt-3">
            预计还可完成约 {estTasks} 次标准 GEO 检测（仅供参考，实际以任务复杂度为准）
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/usage')}
            className="mt-3 text-xs font-bold text-black/50 hover:text-black"
          >
            查看用量详情 →
          </button>
        </section>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AgentShortcut icon={Compass} title="GEO 智能体" desc="约 8,000-30,000 Token" to="/app/agents/geo" />
        <AgentShortcut icon={PenLine} title="自媒体智能体" desc="即将开放" to="/app/agents" disabled />
        <AgentShortcut icon={Users} title="销售获客智能体" desc="即将开放" to="/app/agents" disabled />
      </section>
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F2F0ED] p-4">
      <p className="text-[10px] text-black/45 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold font-display mt-1">{value}</p>
    </div>
  );
}

function AgentShortcut({
  icon: Icon,
  title,
  desc,
  to,
  disabled,
}: {
  icon: typeof Compass;
  title: string;
  desc: string;
  to: string;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => navigate(to)}
      className="text-left p-4 border border-black/8 hover:border-black/20 disabled:opacity-45 transition-colors"
    >
      <Icon className="w-5 h-5 mb-2 text-black/60" />
      <p className="text-sm font-bold">{title}</p>
      <p className="text-xs text-black/45 mt-0.5">{desc}</p>
    </button>
  );
}
