import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import MarketCard from '../../components/app/agents/MarketCard';
import HermesActionModal from '../../components/app/HermesActionModal';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { getUsage, isLowBalance, subscribeUsage } from '../../lib/usageStore';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import { getHomeDashboardData, getOnboardingMarketCards } from '../../lib/homeDashboard';
import {
  getLastOpenedAgentId,
  getVisibleRecentAgentIds,
  openAgentTab,
  sortRecentAgentSummaries,
  subscribeWorkbenchTabs,
} from '../../lib/workbenchTabs';
import type { AgentEntryState } from '../../types/agentNavigation';
import { formatToken } from '../../lib/tokenBilling';
import { getAgentById } from '../../data/agentsCatalog';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import { replayPendingIntent } from '../../lib/pendingAgentIntent';
import { tryUseAgent } from '../../lib/useAgentAccess';

export default function AppHomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showHermesModal, setShowHermesModal] = useState(false);

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const workbenchRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => getVisibleRecentAgentIds().join(','),
    () => '',
  );
  const hermes = useSyncExternalStore(subscribeHermesConnection, getHermesConnection, getHermesConnection);

  const dashboard = getHomeDashboardData();
  const { agentQuota, recentAgents } = dashboard;
  const requestedAgentId = searchParams.get('agent');
  const lowBalance = isLowBalance(getUsage());

  const visibleAgents = useMemo(
    () => sortRecentAgentSummaries(recentAgents),
    [recentAgents, workbenchRevision],
  );

  useEffect(() => {
    if (!requestedAgentId) return;
    const agent = getAgentById(requestedAgentId);
    if (!agent?.available) return;

    const result = tryUseAgent(requestedAgentId, { lowBalance });
    if (result.reason === 'hermes') {
      setShowHermesModal(true);
      return;
    }
    if (result.reason === 'recharge') {
      navigate('/app/usage');
    }
  }, [requestedAgentId, lowBalance, navigate]);

  const defaultAgentId = useMemo(() => {
    const waiting = visibleAgents.find((agent) => agent.latestTask?.status === 'waiting_confirmation');
    if (waiting?.agentId) return waiting.agentId;

    const lastOpened = getLastOpenedAgentId();
    if (lastOpened && visibleAgents.some((agent) => agent.agentId === lastOpened)) return lastOpened;

    return visibleAgents[0]?.agentId ?? null;
  }, [visibleAgents]);

  const activeAgentId =
    (requestedAgentId && visibleAgents.some((agent) => agent.agentId === requestedAgentId)
      ? requestedAgentId
      : null) ?? defaultAgentId;

  const handleUseAgent = (agentId: string) => {
    const result = tryUseAgent(agentId, { lowBalance });
    if (result.reason === 'hermes') {
      setShowHermesModal(true);
      return;
    }
    if (result.reason === 'recharge') {
      navigate('/app/usage');
      return;
    }
    if (result.ok) {
      navigate(`/app?agent=${agentId}`);
    }
  };

  if (
    requestedAgentId &&
    getAgentById(requestedAgentId)?.available &&
    isHermesConnected() &&
    !lowBalance
  ) {
    openAgentTab(requestedAgentId);
    const state: AgentEntryState = { from: `/app?agent=${requestedAgentId}`, agentId: requestedAgentId };
    return <Navigate to={`/app/agents/${requestedAgentId}`} replace state={state} />;
  }

  if (activeAgentId && isHermesConnected() && !lowBalance) {
    const state: AgentEntryState = { from: `/app?agent=${activeAgentId}`, agentId: activeAgentId };
    return <Navigate to={`/app/agents/${activeAgentId}`} replace state={state} />;
  }

  return (
    <>
      <HomeEmptyState
        quota={agentQuota}
        onUseAgent={handleUseAgent}
        onViewMarket={() => navigate('/app/agents')}
      />

      {showHermesModal && (
        <HermesActionModal
          variant="pairing"
          status={hermes.status}
          onClose={() => setShowHermesModal(false)}
          onOpenHermes={() => refreshHermesConnection()}
          onPairedComplete={() => {
            if (isHermesConnected()) {
              setShowHermesModal(false);
              const target = replayPendingIntent();
              navigate(target);
            }
          }}
        />
      )}
    </>
  );
}

function HomeEmptyState({
  quota,
  onUseAgent,
  onViewMarket,
}: {
  quota: { tokenBalance: number };
  onUseAgent: (agentId: string) => void;
  onViewMarket: () => void;
}) {
  const cards = getOnboardingMarketCards();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-2xl font-bold font-display">选择一个智能体开始</h1>
        <p className="text-sm text-black/50">所有已开放智能体都可以直接使用，任务开始前会展示预计 Token 消耗。</p>
      </section>

      <div className="flex justify-center">
        <div className="bg-[#F2F0ED] px-6 py-4 text-center text-xs rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-black/35 mb-1">剩余 Token</p>
          <p className="font-bold font-mono text-lg text-black">{formatToken(quota.tokenBalance)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black/45 text-center">推荐使用</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <MarketCard
              key={card.id}
              card={card}
              onEnter={() => onUseAgent(card.id)}
            />
          ))}
        </div>
      </section>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onViewMarket}
          className="px-5 py-3 text-xs font-bold border border-black/15 hover:bg-black/[0.02] rounded-lg"
        >
          去智能体市场
        </button>
      </div>
    </div>
  );
}
