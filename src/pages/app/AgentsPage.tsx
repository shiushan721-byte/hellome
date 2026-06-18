import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Plus } from 'lucide-react';
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
  isAgentActive,
  subscribeAgentSlots,
} from '../../lib/agentSlotStore';
import { formatToken } from '../../lib/tokenBilling';
import { getAgentsPageData, agentsTabPath, resolveAgentsTabFromPath } from '../../lib/agentsPageData';
import { cancelRunningTasksForAgent, getRunningTasksForAgent } from '../../lib/taskStore';
import { openAgentTab } from '../../lib/workbenchTabs';
import type { AgentEntryState } from '../../types/agentNavigation';
import type { AgentMarketCard, AgentsTab, MyAgentCard } from '../../types/agentsPage';
import {
  DeactivateAgentModal,
  DeactivateSuccessBanner,
  EnableAgentModal,
  EnableSuccessBanner,
  SlotsFullModal,
} from '../../components/app/agents/AgentSlotModals';
import AgentIcon from '../../components/app/agents/AgentIcon';
import MarketCard from '../../components/app/agents/MarketCard';

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveAgentsTabFromPath(location.pathname, searchParams.get('tab'));
  const pageMode = searchParams.get('mode');
  const highlightId = searchParams.get('highlight');

  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [successAgent, setSuccessAgent] = useState<{ id: string; name: string } | null>(null);
  const [deactivateResult, setDeactivateResult] = useState<{ name: string } | null>(null);

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);

  const pageData = getAgentsPageData(activeTab);
  const { quota } = pageData;
  const usage = getUsage();
  const plan = getPlanEntitlements(usage.planName);

  const setTab = (tab: AgentsTab, extra?: Record<string, string>) => {
    const next = new URLSearchParams();
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => next.set(k, v));
    }
    const qs = next.toString();
    navigate(qs ? `${agentsTabPath(tab)}?${qs}` : agentsTabPath(tab), { replace: true });
  };

  const agentsListPath = (tab: AgentsTab = activeTab) => {
    const next = new URLSearchParams();
    if (pageMode && tab === 'market') next.set('mode', pageMode);
    if (highlightId && tab === 'mine') next.set('highlight', highlightId);
    const qs = next.toString();
    return qs ? `${agentsTabPath(tab)}?${qs}` : agentsTabPath(tab);
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
        if (card.status !== 'inactive') return false;
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
    if (isAgentActive(agentId)) {
      openAgentTab(agentId);
      navigate(`/app?agent=${agentId}`);
      return;
    }
    const state: AgentEntryState = { from: agentsListPath(), agentId };
    navigate(`/app/agents/${agentId}`, { state });
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

  return (
    <div className="min-h-full bg-[#F5F5F7] px-6 lg:px-8 py-6 lg:py-8">
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {activeTab === 'market' ? '智能体市场' : '我的智能体'}
          </h1>
        </div>

        <QuotaBar quota={quota} onUpgrade={() => navigate('/app/usage')} />

        <div className="space-y-1 text-xs">
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
            onUpgrade={() => navigate('/app/usage')}
            onRankingSelect={(agent) => {
              if (!agent.available) return;
              const card = pageData.marketAgents.find((c) => c.id === agent.id);
              if (card?.status === 'active') return;
              if (card?.status === 'inactive') handleEnable(agent.id);
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
        className="ml-auto px-3 py-1.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
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
  onUpgrade: () => void;
  onRankingSelect: (agent: AgentItem) => void;
}) {
  return (
    <div className="space-y-6">
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
      {agents.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-lg font-bold text-black/70">你还没有启用任何智能体</p>
          <p className="text-sm text-black/45">去智能体市场选择一个智能体，开始第一个任务。</p>
          <button
            type="button"
            onClick={onGoMarket}
            className="px-5 py-2.5 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
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
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
            >
              使用智能体
            </button>
            <button
              type="button"
              onClick={onDeactivate}
              className="flex-1 py-2 text-xs font-bold border border-amber-300/80 text-amber-900 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors rounded-lg"
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
              className="flex-1 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
            >
              查看历史任务
            </button>
            <button
              type="button"
              onClick={onUpgrade}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
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
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
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
            className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
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
        {items.map((agent) => (
          <li key={agent.id}>
            <button
              type="button"
              onClick={() => onSelect(agent)}
              className="w-full flex items-center gap-3 text-left group"
            >
              <AgentIcon src={agent.iconSrc} alt={agent.name} size="sm" />
              <span className="text-sm truncate text-black/80 group-hover:text-black">{agent.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
