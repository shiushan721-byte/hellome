import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Flame, Heart, Plus } from 'lucide-react';
import {
  CATEGORIES,
  RANKING_SECTIONS,
  getAgentById,
  type AgentCategory,
  type AgentItem,
} from '../../data/agentsCatalog';
import { getUsage, subscribeUsage } from '../../lib/usageStore';
import { getPlanEntitlements } from '../../lib/planEntitlements';
import {
  activateAgent,
  canDeactivateAgent,
  canEnableAgent,
  deactivateAgent,
  getActiveAgents,
  getOccupiedSlotCount,
  subscribeAgentSlots,
} from '../../lib/agentSlotStore';
import { formatToken } from '../../lib/tokenBilling';
import { getAgentsPageData, normalizeAgentsTab } from '../../lib/agentsPageData';
import { cancelRunningTasksForAgent, getRunningTasksForAgent } from '../../lib/taskStore';
import type { AgentMarketCard, AgentsTab, MyAgentCard } from '../../types/agentsPage';
import {
  DeactivateAgentModal,
  DeactivateSuccessBanner,
  EnableAgentModal,
  EnableSuccessBanner,
  SlotsFullModal,
} from '../../components/app/agents/AgentSlotModals';
import AgentIcon from '../../components/app/agents/AgentIcon';

const RANK_STYLES = [
  'bg-gradient-to-br from-amber-300 to-yellow-500 text-white',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-orange-300 to-amber-600 text-white',
];

const MY_STATUS_LABEL: Record<string, string> = {
  active: '已启用',
  readonly: '只读',
};

type ModalState =
  | { type: 'enable'; agent: AgentItem }
  | { type: 'deactivate'; agent: AgentItem }
  | { type: 'slots_full'; message: string }
  | null;

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = normalizeAgentsTab(searchParams.get('tab'));
  const pageMode = searchParams.get('mode');
  const highlightId = searchParams.get('highlight');

  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [successAgent, setSuccessAgent] = useState<{ id: string; name: string } | null>(null);
  const [deactivateResult, setDeactivateResult] = useState<{ name: string } | null>(null);

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);

  const pageData = getAgentsPageData(searchParams.get('tab'));
  const { quota } = pageData;
  const usage = getUsage();
  const plan = getPlanEntitlements(usage.planName);

  const setTab = (tab: AgentsTab, extra?: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => next.set(k, v));
    } else {
      next.delete('highlight');
      next.delete('mode');
    }
    setSearchParams(next, { replace: true });
  };

  const filteredMarket = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pageData.marketAgents.filter((card) => {
      const matchCategory = category === 'all' || card.category === category;
      const matchQuery =
        !q ||
        card.name.toLowerCase().includes(q) ||
        card.description.toLowerCase().includes(q) ||
        card.creator.toLowerCase().includes(q);
      if (pageMode === 'add') {
        if (card.status !== 'inactive' && card.status !== 'quota_full') return false;
      }
      return matchCategory && matchQuery;
    });
  }, [pageData.marketAgents, category, query, pageMode]);

  const handleEnable = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (!agent) return;
    const check = canEnableAgent(agent.id, agent.available);
    if (check.allowed) setModal({ type: 'enable', agent });
    else if (check.message) setModal({ type: 'slots_full', message: check.message });
  };

  const confirmEnable = () => {
    if (modal?.type !== 'enable') return;
    const result = activateAgent(modal.agent.id);
    if (result.ok) {
      setSuccessAgent({ id: modal.agent.id, name: modal.agent.name });
    }
    setModal(null);
  };

  const handleDeactivate = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (agent) setModal({ type: 'deactivate', agent });
  };

  const finishDeactivate = (agent: AgentItem) => {
    const result = deactivateAgent(agent.id);
    if (result.ok) {
      setDeactivateResult({ name: agent.name });
    }
    setModal(null);
  };

  const handleEnter = (agentId: string) => {
    navigate(`/app/agents/${agentId}`);
  };

  useEffect(() => {
    const enableId = searchParams.get('enable');
    if (!enableId) return;
    const agent = getAgentById(enableId);
    if (agent) {
      const check = canEnableAgent(agent.id, agent.available);
      if (check.allowed) setModal({ type: 'enable', agent });
      else if (check.message) setModal({ type: 'slots_full', message: check.message });
    }
    const next = new URLSearchParams(searchParams);
    next.delete('enable');
    if (!next.get('tab')) next.set('tab', 'market');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when ?enable= appears
  }, [searchParams.get('enable')]);

  useEffect(() => {
    if (pageMode === 'add' && activeTab === 'market') {
      requestAnimationFrame(() => {
        document.getElementById('agent-grid')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [pageMode, activeTab]);

  useEffect(() => {
    if (!highlightId) return;
    requestAnimationFrame(() => {
      document.getElementById(`agent-card-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [highlightId, activeTab]);

  const confirmDeactivate = () => {
    if (modal?.type !== 'deactivate') return;
    finishDeactivate(modal.agent);
  };

  const confirmDeactivateWithCancel = () => {
    if (modal?.type !== 'deactivate') return;
    cancelRunningTasksForAgent(modal.agent.id);
    finishDeactivate(modal.agent);
  };

  const lowBalance = usage.tokenBalance < usage.monthlyTokenLimit * usage.lowBalanceThreshold;

  const slotsBanner = quota.slotsRemaining > 0
    ? `你还可以启用 ${quota.slotsRemaining} 个智能体。`
    : '智能体名额已满。如需启用新的智能体，请在「我的智能体」中停用一个，或升级套餐。';

  return (
    <div className="min-h-full bg-[#F5F5F7] px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <PageTab active={activeTab === 'market'} onClick={() => setTab('market')}>
              智能体市场
            </PageTab>
            <PageTab active={activeTab === 'mine'} onClick={() => setTab('mine')}>
              我的智能体
            </PageTab>
          </div>
          <p className="text-xs text-black/45 max-w-2xl">
            套餐限制可同时启用的智能体数量。你可以随时停用并更换智能体；任务执行按实际 Token 消耗计费。
          </p>
        </div>

        <QuotaBar quota={quota} onUpgrade={() => navigate('/app/usage')} />

        <div className="space-y-1 text-xs">
          {quota.slotsRemaining > 0 ? (
            <p className="text-emerald-700">{slotsBanner}</p>
          ) : (
            <p className="text-amber-800">{slotsBanner}</p>
          )}
          {lowBalance && (
            <p className="text-amber-700">
              Token 余额不足，已启用智能体仍会保留。充值后即可继续发起任务。
            </p>
          )}
        </div>

        {deactivateResult && (
          <DeactivateSuccessBanner
            agentName={deactivateResult.name}
            onGoMarket={() => {
              setDeactivateResult(null);
              setTab('market', { mode: 'add' });
            }}
            onDismiss={() => setDeactivateResult(null)}
          />
        )}

        {successAgent && (
          <EnableSuccessBanner
            agentName={successAgent.name}
            onViewMine={() => {
              setTab('mine', { highlight: successAgent.id });
              setSuccessAgent(null);
            }}
            onDismiss={() => setSuccessAgent(null)}
          />
        )}

        {activeTab === 'market' ? (
          <MarketTab
            category={category}
            setCategory={setCategory}
            query={query}
            setQuery={setQuery}
            pageMode={pageMode}
            cards={filteredMarket}
            onEnable={handleEnable}
            onEnter={handleEnter}
            onDeactivate={handleDeactivate}
            onGoMine={() => setTab('mine')}
            onUpgrade={() => navigate('/app/usage')}
            onRankingSelect={(agent) => {
              if (!agent.available) return;
              const card = pageData.marketAgents.find((c) => c.id === agent.id);
              if (card?.status === 'active') return;
              if (card?.status === 'inactive') handleEnable(agent.id);
              else if (card?.status === 'quota_full') setTab('mine');
            }}
          />
        ) : (
          <MineTab
            agents={pageData.myAgents}
            quota={quota}
            highlightId={highlightId}
            onEnter={handleEnter}
            onDeactivate={handleDeactivate}
            onViewTasks={() => navigate('/app/tasks')}
            onGoMarket={() => setTab('market')}
            onGoMarketAdd={() => setTab('market', { mode: 'add' })}
            onUpgrade={() => navigate('/app/usage')}
          />
        )}
      </div>

      {modal?.type === 'enable' && (
        <EnableAgentModal
          agentName={modal.agent.name}
          planName={usage.planName}
          enabledLimit={plan.enabledAgentLimit}
          occupiedCount={getActiveAgents().length}
          onConfirm={confirmEnable}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'deactivate' && (
        <DeactivateAgentModal
          agentName={modal.agent.name}
          check={canDeactivateAgent(modal.agent.id)}
          runningTaskCount={getRunningTasksForAgent(modal.agent.id).length}
          onConfirm={confirmDeactivate}
          onClose={() => setModal(null)}
          onViewTasks={() => {
            setModal(null);
            navigate(`/app/tasks?agent=${modal.agent.id}`);
          }}
          onCancelTasksAndDeactivate={confirmDeactivateWithCancel}
        />
      )}
      {modal?.type === 'slots_full' && (
        <SlotsFullModal
          message={modal.message}
          onClose={() => setModal(null)}
          onViewMine={() => {
            setModal(null);
            setTab('mine');
          }}
          onUpgrade={() => {
            setModal(null);
            navigate('/app/usage');
          }}
        />
      )}
    </div>
  );
}

function PageTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`transition-colors ${
        active
          ? 'text-2xl font-bold text-[#1A1A1A]'
          : 'text-lg font-medium text-black/35 hover:text-black/55'
      }`}
    >
      {children}
    </button>
  );
}

function QuotaBar({
  quota,
  onUpgrade,
}: {
  quota: ReturnType<typeof getAgentsPageData>['quota'];
  onUpgrade: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-black/6 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs shadow-sm">
      <div>
        <span className="text-black/45">已启用智能体 </span>
        <span className="font-bold font-mono">
          {quota.enabledCount} / {quota.enabledLimit}
        </span>
      </div>
      <div>
        <span className="text-black/45">剩余 Token </span>
        <span className="font-bold font-mono">{formatToken(quota.tokenBalance)}</span>
      </div>
      <div>
        <span className="text-black/45">当前套餐 </span>
        <span className="font-medium">{quota.planName}</span>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="ml-auto px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-black/85"
      >
        升级套餐
      </button>
    </div>
  );
}

function MarketTab({
  category,
  setCategory,
  query,
  setQuery,
  pageMode,
  cards,
  onEnable,
  onEnter,
  onDeactivate,
  onGoMine,
  onUpgrade,
  onRankingSelect,
}: {
  category: AgentCategory;
  setCategory: (c: AgentCategory) => void;
  query: string;
  setQuery: (q: string) => void;
  pageMode: string | null;
  cards: AgentMarketCard[];
  onEnable: (id: string) => void;
  onEnter: (id: string) => void;
  onDeactivate: (id: string) => void;
  onGoMine: () => void;
  onUpgrade: () => void;
  onRankingSelect: (agent: AgentItem) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-black/45">选择适合你的智能体启用，启用后即可发起任务。</p>
      {pageMode === 'add' && (
        <p className="text-xs font-bold text-sky-700">当前查看：可添加的智能体</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RANKING_SECTIONS.map((section) => (
          <RankingCard key={section.id} section={section} onSelect={onRankingSelect} />
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 px-4 py-2 text-sm rounded-xl transition-colors ${
                category === cat.id
                  ? 'bg-white text-[#1A1A1A] font-medium shadow-sm'
                  : 'text-black/45 hover:text-black/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            type="button"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-black/30 hover:bg-white hover:text-black/50"
            aria-label="更多分类"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索智能体"
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white rounded-full border border-black/6 outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
          />
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-black/40 py-16 text-center">未找到匹配的智能体</p>
      ) : (
        <div id="agent-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <MarketCard
              key={card.id}
              card={card}
              onEnable={() => onEnable(card.id)}
              onEnter={() => onEnter(card.id)}
              onDeactivate={() => onDeactivate(card.id)}
              onGoMine={onGoMine}
              onUpgrade={onUpgrade}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MineTab({
  agents,
  quota,
  highlightId,
  onEnter,
  onDeactivate,
  onViewTasks,
  onGoMarket,
  onGoMarketAdd,
  onUpgrade,
}: {
  agents: MyAgentCard[];
  quota: ReturnType<typeof getAgentsPageData>['quota'];
  highlightId: string | null;
  onEnter: (id: string) => void;
  onDeactivate: (id: string) => void;
  onViewTasks: () => void;
  onGoMarket: () => void;
  onGoMarketAdd: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-black/45">
        这些是你当前已启用的智能体，可直接进入使用或停用更换。停用后立即释放名额，已消耗 Token 不会退回。
      </p>

      {agents.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-lg font-bold text-black/70">你还没有启用任何智能体</p>
          <p className="text-sm text-black/45">去智能体市场选择一个智能体，开始第一个任务。</p>
          <button
            type="button"
            onClick={onGoMarket}
            className="px-5 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            去智能体市场
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <MyAgentCardView
              key={agent.id}
              agent={agent}
              highlighted={highlightId === agent.id}
              onEnter={() => onEnter(agent.id)}
              onDeactivate={() => onDeactivate(agent.id)}
              onViewTasks={onViewTasks}
              onUpgrade={onUpgrade}
            />
          ))}
          <AddMoreCard quota={quota} onGoMarketAdd={onGoMarketAdd} onUpgrade={onUpgrade} />
        </div>
      )}
    </div>
  );
}

function MarketCard({
  card,
  onEnable,
  onEnter,
  onDeactivate,
  onGoMine,
  onUpgrade,
}: {
  card: AgentMarketCard;
  onEnable: () => void;
  onEnter: () => void;
  onDeactivate: () => void;
  onGoMine: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm flex flex-col h-full min-h-[240px]">
      <div className="flex items-start justify-between mb-4">
        <AgentIcon src={card.iconSrc} alt={card.name} size="lg" />
        {card.status === 'active' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            已启用
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{card.name}</h3>
      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 flex-1 mb-2">{card.description}</p>
      <p className="text-[11px] font-mono text-black/35 mb-3">预计 {card.tokenRange}</p>

      <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#F2F0ED] text-[10px] font-bold flex items-center justify-center">
            {card.creatorAvatar}
          </span>
          <span className="text-xs text-black/45 truncate">{card.creator}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-black/35">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {card.heat}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {card.likes}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        {card.status === 'active' && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={onDeactivate}
              className="flex-1 py-2 text-xs font-bold border border-amber-300/80 text-amber-900 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors"
            >
              停用
            </button>
            <button
              type="button"
              onClick={onEnter}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
            >
              使用智能体
            </button>
          </div>
        )}
        {card.status === 'inactive' && (
          <button
            type="button"
            onClick={onEnable}
            className="w-full py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            启用智能体
          </button>
        )}
        {card.status === 'quota_full' && (
          <button
            type="button"
            onClick={onGoMine}
            className="w-full py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
          >
            去我的智能体
          </button>
        )}
        {card.status === 'coming_soon' && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold bg-black/10 text-black/40">
            即将开放
          </button>
        )}
        {card.status === 'plan_unavailable' && (
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
          >
            升级套餐
          </button>
        )}
      </div>
    </div>
  );
}

function MyAgentCardView({
  agent,
  highlighted,
  onEnter,
  onDeactivate,
  onViewTasks,
  onUpgrade,
}: {
  agent: MyAgentCard;
  highlighted: boolean;
  onEnter: () => void;
  onDeactivate: () => void;
  onViewTasks: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div
      id={`agent-card-${agent.id}`}
      className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col h-full min-h-[260px] ${
        highlighted ? 'border-black ring-2 ring-black/10' : 'border-black/[0.04]'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#1A1A1A]">{agent.name}</h3>
          <span
            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              agent.status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-black/5 text-black/50'
            }`}
          >
            {MY_STATUS_LABEL[agent.status]}
          </span>
        </div>
      </div>

      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

      {agent.status === 'active' && (
        <div className="text-[11px] text-black/45 space-y-1 mb-3">
          <p>本月任务：{agent.monthlyTaskCount} 个</p>
          <p>本月消耗：{formatToken(agent.monthlyTokenUsed)} Token</p>
          {agent.latestTask && (
            <p className="truncate">
              最近任务：{agent.latestTask.name}，{agent.latestTask.statusLabel}
            </p>
          )}
          {agent.hasRunningTasks && (
            <p className="text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-1 mt-1">
              有进行中的任务，点击停用可查看处理方式
            </p>
          )}
        </div>
      )}

      {agent.status === 'readonly' && (
        <p className="text-[11px] text-black/45 mb-3">
          当前套餐不再包含该智能体名额。历史任务和结果仍可查看。
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-black/[0.04]">
        {agent.status === 'active' && (
          <>
            <button
              type="button"
              onClick={onEnter}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
            >
              进入使用
            </button>
            <button
              type="button"
              onClick={onDeactivate}
              className="flex-1 py-2 text-xs font-bold border border-amber-300/80 text-amber-900 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors"
            >
              停用
            </button>
          </>
        )}
        {agent.status === 'readonly' && (
          <>
            <button
              type="button"
              onClick={onViewTasks}
              className="flex-1 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
            >
              查看历史任务
            </button>
            <button
              type="button"
              onClick={onUpgrade}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
            >
              升级套餐
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AddMoreCard({
  quota,
  onGoMarketAdd,
  onUpgrade,
}: {
  quota: ReturnType<typeof getAgentsPageData>['quota'];
  onGoMarketAdd: () => void;
  onUpgrade: () => void;
}) {
  const full = quota.slotsRemaining === 0;

  return (
    <div className="rounded-2xl p-5 border border-dashed border-black/15 bg-[#F2F0ED]/50 flex flex-col items-center justify-center text-center min-h-[260px] gap-3">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
        <Plus className="w-5 h-5 text-black/40" />
      </div>
      {full ? (
        <>
          <p className="text-sm font-bold text-black/70">智能体名额已满</p>
          <p className="text-xs text-black/45 px-4">
            停用一个已启用智能体，或升级套餐获得更多名额。
          </p>
          <button
            type="button"
            onClick={onUpgrade}
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            升级套餐
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-bold text-black/70">添加更多智能体</p>
          <p className="text-xs text-black/45">你还可以启用 {quota.slotsRemaining} 个智能体。</p>
          <button
            type="button"
            onClick={onGoMarketAdd}
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            去智能体市场
          </button>
        </>
      )}
    </div>
  );
}

function RankingCard({
  section,
  onSelect,
}: {
  section: (typeof RANKING_SECTIONS)[number];
  onSelect: (agent: AgentItem) => void;
}) {
  const items = section.agentIds
    .map((id) => getAgentById(id))
    .filter((a): a is AgentItem => Boolean(a));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${section.gradient} border border-white/60 shadow-sm p-5 min-h-[220px]`}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#1A1A1A]">{section.title}</h2>
        </div>
        <span className="text-3xl select-none" aria-hidden>
          {section.decor}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((agent, index) => (
          <li key={agent.id}>
            <button
              type="button"
              onClick={() => onSelect(agent)}
              className="w-full flex items-center gap-3 text-left group"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${RANK_STYLES[index]}`}
              >
                {index + 1}
              </span>
              <AgentIcon src={agent.iconSrc} alt={agent.name} size="sm" />
              <span className="text-sm truncate text-black/80 group-hover:text-black">{agent.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
