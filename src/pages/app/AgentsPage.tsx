import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  CATEGORIES,
  getAgentById,
  type AgentCategory,
  type AgentItem,
} from '../../data/agentsCatalog';
import type { MarketMediumBannerConfig, MarketProductSpot } from '../../data/agentsMarketHome';
import { getUsage, subscribeUsage } from '../../lib/usageStore';
import {
  activateAgent,
  canDeactivateAgent,
  canEnableAgent,
  deactivateAgent,
  getOccupiedSlotCount,
  isAgentActive,
  subscribeAgentSlots,
} from '../../lib/agentSlotStore';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import { subscribeHermesConnection } from '../../lib/hermesConnection';
import { getAgentsPageData, getGuestAgentsPageData, agentsTabPath, resolveAgentsTabFromPath } from '../../lib/agentsPageData';
import { cancelRunningTasksForAgent, getRunningTasksForAgent } from '../../lib/taskStore';
import { openAgentTab } from '../../lib/workbenchTabs';
import type { AgentEntryState } from '../../types/agentNavigation';
import type { AgentMarketCard, AgentsTab, MyAgentCard } from '../../types/agentsPage';
import {
  DeactivateAgentModal,
  DeactivateSuccessBanner,
  EnableAgentModal,
} from '../../components/app/agents/AgentSlotModals';
import AgentIcon from '../../components/app/agents/AgentIcon';
import MarketCard from '../../components/app/agents/MarketCard';
import MarketHermesBanner from '../../components/app/agents/MarketHermesBanner';
import MarketHomeBanner from '../../components/app/agents/MarketHomeBanner';
import MarketProductSpots from '../../components/app/agents/MarketProductSpots';
import LoginPromptModal from '../../components/LoginPromptModal';
import {
  buildConnectHermesUrl,
  stashIntent,
  type AgentIntentAction,
} from '../../lib/pendingAgentIntent';
import { Plus } from 'lucide-react';
import { formatToken } from '../../lib/tokenBilling';

const MY_STATUS_LABEL: Record<string, string> = {
  active: '已启用',
};

type ModalState =
  | { type: 'enable'; agent: AgentItem }
  | { type: 'deactivate'; agent: AgentItem }
  | null;

type LoginModalState = {
  agentId?: string;
  action: AgentIntentAction;
} | null;

type AgentsPageProps = {
  variant?: 'public' | 'app';
};

export default function AgentsPage({ variant = 'app' }: AgentsPageProps) {
  const isPublic = variant === 'public';
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveAgentsTabFromPath(location.pathname, searchParams.get('tab'));
  const pageMode = searchParams.get('mode');
  const highlightId = searchParams.get('highlight');

  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [loginModal, setLoginModal] = useState<LoginModalState>(null);
  const [deactivateResult, setDeactivateResult] = useState<{ name: string } | null>(null);

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const hermesConnected = useSyncExternalStore(
    subscribeHermesConnection,
    isHermesConnected,
    isHermesConnected,
  );

  const pageData = isPublic
    ? getGuestAgentsPageData()
    : getAgentsPageData(activeTab);
  const usage = getUsage();

  const promptLogin = (agentId: string | undefined, action: AgentIntentAction) => {
    setLoginModal({ agentId, action });
  };

  const goConnectHermes = (agentId: string | undefined, action: AgentIntentAction) => {
    const intent = {
      agentId,
      action,
      redirect: agentId ? `/app/agents/${agentId}` : '/app/agents',
    };
    stashIntent(intent);
    navigate(buildConnectHermesUrl(intent));
  };

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

  const geoBannerActive = pageData.marketAgents.find((c) => c.id === 'geo')?.status === 'active';
  const lowBalance = usage.tokenBalance < usage.monthlyTokenLimit * usage.lowBalanceThreshold;

  const handleEnable = (agentId: string) => {
    if (isPublic) {
      promptLogin(agentId, 'enable');
      return;
    }
    if (!hermesConnected) {
      goConnectHermes(agentId, 'enable');
      return;
    }
    const agent = getAgentById(agentId);
    if (!agent) return;
    const check = canEnableAgent(agent.id, agent.available);
    if (check.allowed) setModal({ type: 'enable', agent });
  };

  const handleEnter = (agentId: string) => {
    if (isPublic) {
      promptLogin(agentId, 'use');
      return;
    }
    if (!hermesConnected) {
      goConnectHermes(agentId, 'use');
      return;
    }
    if (isAgentActive(agentId)) {
      openAgentTab(agentId);
      navigate(`/app?agent=${agentId}`);
      return;
    }
    const state: AgentEntryState = { from: agentsListPath(), agentId };
    navigate(`/app/agents/${agentId}`, { state });
  };

  const handleHeroAction = () => {
    if (isPublic) {
      promptLogin('geo', 'enable');
      return;
    }
    if (!hermesConnected) {
      goConnectHermes('geo', 'enable');
      return;
    }
    if (lowBalance) {
      navigate('/app/usage');
      return;
    }
    if (geoBannerActive) {
      handleEnter('geo');
      return;
    }
    handleEnable('geo');
  };

  const handleMediumAction = (banner: MarketMediumBannerConfig) => {
    if (banner.displayStatus === 'coming_soon' || banner.displayStatus === 'beta') return;
    if (isPublic) {
      promptLogin(banner.agentId, 'enable');
      return;
    }
    if (!hermesConnected) {
      goConnectHermes(banner.agentId, 'enable');
      return;
    }
    if (lowBalance) {
      navigate('/app/usage');
      return;
    }
    if (isAgentActive(banner.agentId)) {
      handleEnter(banner.agentId);
      return;
    }
    handleEnable(banner.agentId);
  };

  const confirmEnable = () => {
    if (modal?.type !== 'enable') return;
    const agentId = modal.agent.id;
    const result = activateAgent(agentId);
    setModal(null);
    if (result.ok) {
      openAgentTab(agentId);
      navigate(`/app?agent=${agentId}`);
    }
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

  const handleProductSpot = (spot: MarketProductSpot) => {
    const agent = getAgentById(spot.agentId);
    if (!agent?.available) return;
    if (isPublic) {
      promptLogin(spot.agentId, 'use');
      return;
    }
    if (!hermesConnected) {
      goConnectHermes(spot.agentId, 'use');
      return;
    }
    if (lowBalance) {
      navigate('/app/usage');
      return;
    }
    if (isAgentActive(spot.agentId)) {
      handleEnter(spot.agentId);
      return;
    }
    handleEnable(spot.agentId);
  };

  useEffect(() => {
    const enableId = searchParams.get('enable');
    if (!enableId) return;
    const agent = getAgentById(enableId);
    if (agent) {
      const check = canEnableAgent(agent.id, agent.available);
      if (check.allowed) setModal({ type: 'enable', agent });
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

  return (
    <div className="min-h-full bg-[#F5F5F7] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
      <div className="w-full space-y-8">
        {activeTab === 'market' || isPublic ? (
          <>
            {!isPublic && !hermesConnected && (
              <MarketHermesBanner onGoPair={() => goConnectHermes(undefined, 'enter')} />
            )}

            {!isPublic && pageMode === 'add' && (
              <p className="text-xs font-bold text-sky-700">当前查看：可添加的智能体</p>
            )}

            {!isPublic && (
              <div className="space-y-1 text-xs">
                {lowBalance && (
                  <p className="text-amber-700">
                    Token 余额不足，已启用智能体仍会保留。充值后即可继续发起任务。
                  </p>
                )}
              </div>
            )}

            {!isPublic && deactivateResult && (
              <DeactivateSuccessBanner
                agentName={deactivateResult.name}
                onGoMarket={() => {
                  setDeactivateResult(null);
                  setTab('market', { mode: 'add' });
                }}
                onDismiss={() => setDeactivateResult(null)}
              />
            )}

            <MarketHomeBanner
              marketCards={pageData.marketAgents}
              hermesConnected={isPublic ? true : hermesConnected}
              lowBalance={isPublic ? false : lowBalance}
              guestMode={isPublic}
              onHeroAction={handleHeroAction}
              onMediumAction={handleMediumAction}
            />

            <MarketProductSpots
              marketCards={pageData.marketAgents}
              guestMode={isPublic}
              onUseSpot={handleProductSpot}
            />

            <MarketAgentGrid
              category={category}
              setCategory={setCategory}
              query={query}
              setQuery={setQuery}
              cards={filteredMarket}
              hermesConnected={isPublic ? true : hermesConnected}
              guestMode={isPublic}
              onEnable={handleEnable}
              onEnter={handleEnter}
              onDeactivate={handleDeactivate}
              onPair={() => goConnectHermes(undefined, 'enter')}
              onViewDetail={(id) => navigate(isPublic ? `/agents/${id}` : `/app/agents/${id}`)}
            />
          </>
        ) : (
          <MineTab
            agents={pageData.myAgents}
            highlightId={highlightId}
            onEnter={handleEnter}
            onDeactivate={handleDeactivate}
            onViewTasks={() => navigate('/app/tasks')}
            onGoMarket={() => setTab('market')}
            onGoMarketAdd={() => setTab('market', { mode: 'add' })}
          />
        )}
      </div>

      {!isPublic && modal?.type === 'enable' && (
        <EnableAgentModal
          agentName={modal.agent.name}
          onConfirm={confirmEnable}
          onClose={() => setModal(null)}
        />
      )}
      {!isPublic && modal?.type === 'deactivate' && (
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

      {loginModal && (
        <LoginPromptModal
          agentId={loginModal.agentId}
          action={loginModal.action}
          redirect={loginModal.agentId ? `/agents/${loginModal.agentId}` : '/agents'}
          onClose={() => setLoginModal(null)}
        />
      )}
    </div>
  );
}

function MarketAgentGrid({
  category,
  setCategory,
  query,
  setQuery,
  cards,
  hermesConnected,
  guestMode = false,
  onEnable,
  onEnter,
  onDeactivate,
  onPair,
  onViewDetail,
}: {
  category: AgentCategory;
  setCategory: (c: AgentCategory) => void;
  query: string;
  setQuery: (q: string) => void;
  cards: AgentMarketCard[];
  hermesConnected: boolean;
  guestMode?: boolean;
  onEnable: (id: string) => void;
  onEnter: (id: string) => void;
  onDeactivate: (id: string) => void;
  onPair: () => void;
  onViewDetail: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
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
        <div id="agent-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {cards.map((card) => (
            <MarketCard
              key={card.id}
              card={card}
              hermesConnected={hermesConnected}
              guestMode={guestMode}
              onEnable={() => onEnable(card.id)}
              onEnter={() => onEnter(card.id)}
              onDeactivate={() => onDeactivate(card.id)}
              onPair={onPair}
              onViewDetail={() => onViewDetail(card.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MineTab({
  agents,
  highlightId,
  onEnter,
  onDeactivate,
  onViewTasks,
  onGoMarket,
  onGoMarketAdd,
}: {
  agents: MyAgentCard[];
  highlightId: string | null;
  onEnter: (id: string) => void;
  onDeactivate: (id: string) => void;
  onViewTasks: () => void;
  onGoMarket: () => void;
  onGoMarketAdd: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">我的智能体</h1>
      </div>
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
            />
          ))}
          <AddMoreCard onGoMarketAdd={onGoMarketAdd} />
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
}: {
  agent: MyAgentCard;
  highlighted: boolean;
  onEnter: () => void;
  onDeactivate: () => void;
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

      <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-black/[0.04]">
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
      </div>
    </div>
  );
}

function AddMoreCard({ onGoMarketAdd }: { onGoMarketAdd: () => void }) {
  return (
    <div className="rounded-2xl p-5 border border-dashed border-black/15 bg-[#F2F0ED]/50 flex flex-col items-center justify-center text-center min-h-[260px] gap-3">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
        <Plus className="w-5 h-5 text-black/40" />
      </div>
      <p className="text-sm font-bold text-black/70">启用更多智能体</p>
      <p className="text-xs text-black/45 px-4">智能体可随时启用和停用，启用不消耗 Token。</p>
      <button
        type="button"
        onClick={onGoMarketAdd}
        className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
      >
        去智能体市场
      </button>
    </div>
  );
}
