import { useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AgentIcon from '../../components/app/agents/AgentIcon';
import { getTasks, subscribeTasks, duplicateTask } from '../../lib/taskStore';
import { getUsage, subscribeUsage } from '../../lib/usageStore';
import {
  getOccupiedSlotCount,
  isAgentActive,
  subscribeAgentSlots,
} from '../../lib/agentSlotStore';
import {
  getHomeDashboardData,
  getOnboardingAgents,
  isLowBalanceUsage,
  matchPromptToAgent,
  statusLabel,
} from '../../lib/homeDashboard';
import type { EnabledAgentSummary, PromptMatchResult } from '../../types/homeDashboard';
import type { AgentQuotaSnapshot } from '../../types/homeDashboard';
import type { RecommendedAction } from '../../types/homeDashboard';
import type { Task } from '../../types/workbench';
import { runGeoTask } from '../../lib/geoTaskRunner';
import { formatToken, formatTokenRange } from '../../lib/tokenBilling';
import TaskStatusBadge, { agentLabel, formatTime } from '../../components/app/tasks/TaskStatusBadge';
import { getAgentById } from '../../data/agentsCatalog';

export default function AppHomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [promptHint, setPromptHint] = useState<PromptMatchResult | null>(null);

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);

  const dashboard = getHomeDashboardData();
  const { usage, agentQuota, enabledAgents, recentTasks, recommendedActions } = dashboard;
  const lowBalance = isLowBalanceUsage();
  const hasEnabled = enabledAgents.length > 0;

  const enterAgent = (agentId: string, state?: { prompt?: string }) => {
    const agent = getAgentById(agentId);
    if (!agent?.available || !isAgentActive(agentId)) {
      navigate(agentQuota.slotsRemaining > 0 ? '/app/agents?tab=market&mode=add' : '/app/agents?tab=mine');
      return;
    }
    navigate(`/app/agents/${agentId}`, state ? { state } : undefined);
  };

  const handlePromptSubmit = () => {
    const match = matchPromptToAgent(prompt);
    setPromptHint(match);
    if (match.type === 'match') {
      enterAgent(match.agentId, { prompt });
    }
  };

  if (!hasEnabled) {
    return (
      <HomeEmptyState
        quota={agentQuota}
        onEnableGeo={() => navigate('/app/agents?enable=geo')}
        onViewAll={() => navigate('/app/agents?tab=market')}
      />
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* 自然语言任务输入 */}
      <section className="space-y-3">
        <h1 className="text-2xl font-bold font-display text-black">
          今天想让哪个智能体开始工作？
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setPromptHint(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
            placeholder="描述你的目标，系统会从已启用智能体中推荐合适的执行方式"
            className="flex-1 py-3.5 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
          />
          <button
            type="button"
            onClick={handlePromptSubmit}
            className="px-5 py-3.5 text-xs font-bold bg-black text-white hover:bg-black/85 flex items-center justify-center gap-1.5 shrink-0"
          >
            开始
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {promptHint && <PromptHint hint={promptHint} quota={agentQuota} navigate={navigate} />}
      </section>

      {/* 已启用智能体 + 名额 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">已启用智能体</h2>
            <p className="text-[11px] text-black/40 mt-0.5">这些智能体当前可直接发起任务</p>
          </div>
          <div className="space-y-3">
            {enabledAgents.map((agent) => (
              <EnabledAgentCard
                key={agent.agentId}
                agent={agent}
                onStart={(p) => enterAgent(agent.agentId, p ? { prompt: p } : undefined)}
                onViewLatest={(taskId) => navigate(`/app/tasks/${taskId}`)}
                onHistory={() => navigate(`/app/tasks?agent=${agent.agentId}`)}
                onManage={() => navigate('/app/agents?tab=mine')}
              />
            ))}
          </div>
          {enabledAgents.length === 1 && enabledAgents[0].monthlyTaskCount === 0 && (
            <p className="text-xs text-black/45 bg-[#F2F0ED] px-3 py-2">
              你已经启用了 {enabledAgents[0].name}。从一个任务开始：
              <button
                type="button"
                onClick={() =>
                  enterAgent(
                    enabledAgents[0].agentId,
                    enabledAgents[0].templates[0]?.prompt
                      ? { prompt: enabledAgents[0].templates[0].prompt }
                      : undefined,
                  )
                }
                className="font-bold text-black ml-1 underline"
              >
                {enabledAgents[0].templates[0]?.title ?? '开始新任务'}
              </button>
            </p>
          )}
        </section>

        <AgentQuotaCard quota={agentQuota} navigate={navigate} />
      </div>

      {/* 最近任务 + Token */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">最近任务</h2>
          <RecentTasksList tasks={recentTasks} navigate={navigate} />
        </section>
        <TokenUsageCard usage={usage} lowBalance={lowBalance} navigate={navigate} />
      </div>

      {/* 推荐下一步 */}
      {recommendedActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">推荐下一步</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendedActions.map((action) => (
              <RecommendedActionCard
                key={action.id}
                action={action}
                onRun={() => {
                  if (action.requiresActivation) {
                    navigate('/app/agents?tab=market&mode=add');
                  } else {
                    enterAgent(action.agentId);
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 名额已满提示 */}
      {agentQuota.slotsRemaining === 0 && dashboard.addableAgentIds.length === 0 && enabledAgents.length > 0 && (
        <section className="text-xs bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
          <p className="font-bold text-amber-900">你的智能体名额已满</p>
          <p className="text-amber-800">
            当前已启用：{enabledAgents.map((a) => a.name).join('、')}。如需添加新的智能体，可以停用一个已启用智能体，或升级套餐。
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => navigate('/app/agents?tab=mine')}
              className="px-3 py-1.5 font-bold bg-black text-white"
            >
              我的智能体
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/usage')}
              className="px-3 py-1.5 font-bold border border-amber-300"
            >
              升级套餐
            </button>
          </div>
        </section>
      )}

      {/* 可添加智能体（弱化） */}
      {agentQuota.slotsRemaining > 0 && dashboard.addableAgentIds.length > 0 && (
        <section className="space-y-3 pt-2 border-t border-black/8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black/40">可添加智能体</h2>
          <div className="flex flex-wrap gap-2">
            {dashboard.addableAgentIds.map((id) => {
              const agent = getAgentById(id);
              if (!agent) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(`/app/agents?enable=${id}`)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-[#F2F0ED] hover:bg-[#E8E6E3] transition-colors"
                >
                  <AgentIcon src={agent.iconSrc} alt={agent.name} size="sm" />
                  {agent.name}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function PromptHint({
  hint,
  quota,
  navigate,
}: {
  hint: PromptMatchResult;
  quota: AgentQuotaSnapshot;
  navigate: (path: string) => void;
}) {
  if (hint.type === 'no_match') {
    return (
      <p className="text-xs text-black/50 bg-[#F2F0ED] px-3 py-2">
        未匹配到合适的已启用智能体。
        <button type="button" onClick={() => navigate('/app/agents?tab=market&mode=add')} className="font-bold underline ml-1">
          去智能体市场添加
        </button>
      </p>
    );
  }
  if (hint.type === 'needs_enable') {
    return (
      <div className="text-xs bg-amber-50 border border-amber-200 px-3 py-2 space-y-2">
        <p>
          这个任务适合「{hint.agentName}」，但你还没有启用它。当前可启用智能体：{quota.enabledCount} /{' '}
          {quota.enabledLimit}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/app/agents?enable=${hint.agentId}`)}
            className="px-3 py-1.5 font-bold bg-black text-white"
          >
            启用{hint.agentName}
          </button>
          <button type="button" onClick={() => navigate('/app/agents?tab=market')} className="px-3 py-1.5 font-bold border border-black/15">
            去智能体市场
          </button>
        </div>
      </div>
    );
  }
  if (hint.type === 'slots_full') {
    return (
      <div className="text-xs bg-amber-50 border border-amber-200 px-3 py-2 space-y-2">
        <p>
          这个任务适合「{hint.agentName}」，但你的智能体名额已满。请停用一个已启用智能体，或升级套餐。
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/app/agents?tab=mine')} className="px-3 py-1.5 font-bold bg-black text-white">
            我的智能体
          </button>
          <button type="button" onClick={() => navigate('/app/usage')} className="px-3 py-1.5 font-bold border border-black/15">
            升级套餐
          </button>
        </div>
      </div>
    );
  }
  return null;
}

function EnabledAgentCard({
  agent,
  onStart,
  onViewLatest,
  onHistory,
  onManage,
}: {
  agent: EnabledAgentSummary;
  onStart: (prompt?: string) => void;
  onViewLatest: (taskId: string) => void;
  onHistory: () => void;
  onManage: () => void;
}) {
  return (
    <div className="bg-white border border-black/8 p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">{agent.name}</h3>
          <p className="text-sm text-black/45 mt-1 leading-relaxed">{agent.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-black/50">
        <div>
          <p className="text-black/35 uppercase tracking-wider text-[10px]">本月任务</p>
          <p className="font-mono font-bold text-sm text-black mt-0.5">{agent.monthlyTaskCount}</p>
        </div>
        <div>
          <p className="text-black/35 uppercase tracking-wider text-[10px]">本月消耗</p>
          <p className="font-mono font-bold text-sm text-black mt-0.5">{formatToken(agent.monthlyTokenUsed)}</p>
        </div>
        {agent.latestTask && (
          <div className="col-span-2 sm:col-span-1">
            <p className="text-black/35 uppercase tracking-wider text-[10px]">最近任务</p>
            <p className="text-xs text-black/60 mt-0.5 truncate">
              {agent.latestTask.name}，{statusLabel(agent.latestTask.status)}
            </p>
          </div>
        )}
      </div>

      {agent.templates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onStart(t.prompt)}
              className="px-2.5 py-1 text-[10px] font-medium bg-[#F2F0ED] hover:bg-[#E8E6E3]"
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => onStart()}
          className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
        >
          进入
        </button>
        {agent.latestTask && (
          <button
            type="button"
            onClick={() => onViewLatest(agent.latestTask!.id)}
            className="px-4 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
          >
            查看最近结果
          </button>
        )}
        <button
          type="button"
          onClick={onHistory}
          className="px-4 py-2 text-xs font-bold text-black/50 hover:text-black"
        >
          任务历史
        </button>
        <button
          type="button"
          onClick={onManage}
          className="ml-auto px-3 py-2 text-[10px] font-bold text-black/40 hover:text-black"
        >
          我的智能体 →
        </button>
      </div>
    </div>
  );
}

function AgentQuotaCard({
  quota,
  navigate,
}: {
  quota: AgentQuotaSnapshot;
  navigate: (path: string) => void;
}) {
  const full = quota.enabledCount >= quota.enabledLimit;

  return (
    <section className="bg-[#F2F0ED] p-5 space-y-4 h-fit">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">智能体名额</h2>
        <p className="text-3xl font-bold font-mono mt-2">
          {quota.enabledCount}
          <span className="text-lg text-black/40"> / {quota.enabledLimit}</span>
        </p>
      </div>

      <div className="space-y-1 text-[11px] text-black/50">
        <p>当前套餐：{quota.planName}</p>
        <p>可同时启用 {quota.enabledLimit} 个智能体</p>
      </div>

      {!full && quota.slotsRemaining > 0 && (
        <p className="text-xs text-black/55">你还可以启用 {quota.slotsRemaining} 个智能体。</p>
      )}
      {full && (
        <p className="text-xs text-amber-800">
          智能体名额已满。如需使用新的智能体，请停用一个已启用智能体或升级套餐。
        </p>
      )}

      <p className="text-[11px] text-black/45 leading-relaxed">
        智能体可以随时停用并释放名额。停用不删除历史任务和结果，已消耗 Token 不会退回。
      </p>

      <div className="flex flex-col gap-2">
        {!full && (
          <button
            type="button"
            onClick={() => navigate('/app/agents?tab=market&mode=add')}
            className="w-full py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            添加智能体
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/app/agents?tab=mine')}
          className="w-full py-2.5 text-xs font-bold border border-black/15 hover:bg-white/60"
        >
          我的智能体
        </button>
        <button
          type="button"
          onClick={() => navigate('/app/agents?tab=market')}
          className="w-full py-2.5 text-xs font-bold border border-black/15 hover:bg-white/60"
        >
          智能体市场
        </button>
        {full && (
          <button
            type="button"
            onClick={() => navigate('/app/usage')}
            className="w-full py-2.5 text-xs font-bold border border-black/15 hover:bg-white/60"
          >
            升级套餐
          </button>
        )}
      </div>
    </section>
  );
}

function TokenUsageCard({
  usage,
  lowBalance,
  navigate,
}: {
  usage: { tokenBalance: number; monthlyTokenUsed: number; monthlyTokenLimit: number };
  lowBalance: boolean;
  navigate: (path: string) => void;
}) {
  const pct =
    usage.monthlyTokenLimit > 0
      ? Math.min(100, Math.round((usage.monthlyTokenUsed / usage.monthlyTokenLimit) * 100))
      : 0;

  return (
    <section className="bg-white border border-black/8 p-5 space-y-4 h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wider text-black/45">Token 用量</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-black/45 text-xs">剩余 Token</span>
          <span className="font-mono font-bold">{formatToken(usage.tokenBalance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/45 text-xs">本月已用</span>
          <span className="font-mono">{formatToken(usage.monthlyTokenUsed)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-black/45 text-xs">本月额度</span>
          <span className="font-mono">{formatToken(usage.monthlyTokenLimit)}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-black/40 mb-1">
          <span>使用进度</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-[#F2F0ED] rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {lowBalance && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1.5">
          剩余 Token 低于 10%，建议及时充值，避免任务中断。
        </p>
      )}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/app/usage')}
          className="w-full py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
        >
          查看用量
        </button>
        <button
          type="button"
          onClick={() => navigate('/app/usage')}
          className="w-full py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
        >
          充值 Token
        </button>
      </div>
    </section>
  );
}

function RecentTasksList({
  tasks,
  navigate,
}: {
  tasks: Task[];
  navigate: (path: string) => void;
}) {
  const [rerunError, setRerunError] = useState('');

  const handleRerun = (task: Task) => {
    if (!isAgentActive(task.agentType)) {
      setRerunError(`该任务所属智能体已停用，重新运行前需要重新启用。`);
      return;
    }
    setRerunError('');
    const dup = duplicateTask(task.id);
    if (dup && task.agentType === 'geo') {
      runGeoTask(dup.id);
      navigate(`/app/tasks/${dup.id}`);
    }
  };

  if (tasks.length === 0) {
    return <p className="text-sm text-black/40 py-6">暂无任务记录</p>;
  }

  return (
    <div className="space-y-2">
      {rerunError && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">{rerunError}</p>
      )}
      <ul className="divide-y divide-black/8 border border-black/8 bg-white">
        {tasks.map((task) => {
          const inactive = !isAgentActive(task.agentType);
          const canContinue = task.status === 'waiting_confirmation' || task.status === 'running';
          return (
            <li key={task.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.name}</p>
                <p className="text-[11px] text-black/40 mt-0.5">
                  {agentLabel(task.agentType)} · {formatTime(task.completedAt ?? task.createdAt)} ·{' '}
                  {task.tokenUsed > 0
                    ? `${formatToken(task.tokenUsed)} Token`
                    : formatTokenRange({ min: task.estimatedTokenMin, max: task.estimatedTokenMax })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TaskStatusBadge status={task.status} />
                {canContinue && (
                  <button
                    type="button"
                    disabled={inactive}
                    title={inactive ? '需重新启用智能体' : undefined}
                    onClick={() => navigate(`/app/tasks/${task.id}`)}
                    className="px-2 py-1 text-[10px] font-bold border border-black/15 disabled:opacity-40"
                  >
                    继续
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/app/tasks/${task.id}`)}
                  className="px-2 py-1 text-[10px] font-bold border border-black/15"
                >
                  查看结果
                </button>
                {task.agentType === 'geo' && task.status === 'completed' && (
                  <button
                    type="button"
                    disabled={inactive}
                    title={inactive ? '需重新启用智能体' : undefined}
                    onClick={() => handleRerun(task)}
                    className="px-2 py-1 text-[10px] font-bold border border-black/15 disabled:opacity-40"
                  >
                    重新运行
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecommendedActionCard({
  action,
  onRun,
}: {
  action: RecommendedAction;
  onRun: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRun}
      className="text-left p-4 border border-black/8 hover:border-black/20 bg-white transition-colors"
    >
      <p className="text-sm font-medium leading-snug">{action.title}</p>
      <p className="text-[10px] text-black/40 mt-2 font-mono">
        约 {formatTokenRange({ min: action.estimatedTokenMin, max: action.estimatedTokenMax })} Token
      </p>
      {action.requiresActivation && (
        <p className="text-[10px] text-amber-700 mt-1">需要启用对应智能体</p>
      )}
    </button>
  );
}

function HomeEmptyState({
  quota,
  onEnableGeo,
  onViewAll,
}: {
  quota: AgentQuotaSnapshot;
  onEnableGeo: () => void;
  onViewAll: () => void;
}) {
  const onboarding = getOnboardingAgents();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-2xl font-bold font-display">欢迎来到 HelloMe</h1>
        <p className="text-sm text-black/50">先启用一个智能体，开始你的第一个任务。</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-center text-xs text-black/45">
        <div className="bg-[#F2F0ED] p-4">
          <p className="text-[10px] uppercase tracking-wider text-black/35 mb-1">当前套餐</p>
          <p className="font-bold text-black">{quota.planName}</p>
        </div>
        <div className="bg-[#F2F0ED] p-4">
          <p className="text-[10px] uppercase tracking-wider text-black/35 mb-1">可启用智能体</p>
          <p className="font-bold font-mono text-black">
            {quota.enabledCount} / {quota.enabledLimit}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 text-center">推荐启用</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {onboarding.map((agent) => {
            if (!agent) return null;
            const isGeo = agent.id === 'geo';
            return (
              <div key={agent.id} className="border border-black/8 p-4 text-center space-y-3">
                <AgentIcon src={agent.iconSrc} alt={agent.name} size="md" className="mx-auto" />
                <p className="text-sm font-bold">{agent.name}</p>
                <p className="text-[11px] text-black/45 line-clamp-2">{agent.desc}</p>
                {isGeo ? (
                  <button
                    type="button"
                    onClick={onEnableGeo}
                    className="w-full py-2 text-xs font-bold bg-black text-white"
                  >
                    启用 GEO 智能体
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!agent.available}
                    onClick={onViewAll}
                    className="w-full py-2 text-xs font-bold border border-black/15 disabled:opacity-40"
                  >
                    {agent.available ? '去广场启用' : '即将开放'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex justify-center gap-3">
        <button type="button" onClick={onEnableGeo} className="px-5 py-3 text-xs font-bold bg-black text-white">
          启用 GEO 智能体
        </button>
        <button type="button" onClick={onViewAll} className="px-5 py-3 text-xs font-bold border border-black/15">
          查看全部智能体
        </button>
      </div>
    </div>
  );
}
