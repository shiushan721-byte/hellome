import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import MarketCard from '../../components/app/agents/MarketCard';
import EnabledAgentsPanel from '../../components/app/EnabledAgentsPanel';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { getUsage, subscribeUsage } from '../../lib/usageStore';
import { activateAgent, getOccupiedSlotCount, subscribeAgentSlots } from '../../lib/agentSlotStore';
import { getHermesConnection, subscribeHermesConnection } from '../../lib/hermesConnection';
import ConnectHermesPage from '../ConnectHermesPage';
import { getHomeDashboardData, getOnboardingMarketCards } from '../../lib/homeDashboard';
import {
  getHiddenTabIds,
  getLastOpenedAgentId,
  getTabOrder,
  getVisibleEnabledAgents,
  openAgentTab,
  subscribeWorkbenchTabs,
} from '../../lib/workbenchTabs';
import type { AgentQuotaSnapshot } from '../../types/homeDashboard';
import type { AgentEntryState } from '../../types/agentNavigation';

export default function AppHomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  const workbenchRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => `${getHiddenTabIds().join(',')}|${getTabOrder().join(',')}`,
    () => '',
  );
  const hermes = useSyncExternalStore(subscribeHermesConnection, getHermesConnection, getHermesConnection);

  const dashboard = getHomeDashboardData();
  const { agentQuota, enabledAgents } = dashboard;
  const hasEnabled = enabledAgents.length > 0;
  const requestedAgentId = searchParams.get('agent');

  useEffect(() => {
    if (!requestedAgentId) return;
    if (!enabledAgents.some((agent) => agent.agentId === requestedAgentId)) return;
    openAgentTab(requestedAgentId);
  }, [requestedAgentId, enabledAgents]);

  const visibleAgents = useMemo(
    () => getVisibleEnabledAgents(enabledAgents),
    [enabledAgents, workbenchRevision],
  );

  const showEnabledPanel = enabledAgents.length > 0 && visibleAgents.length === 0;

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
    openAgentTab(agentId);
    navigate(`/app?agent=${agentId}`);
  };

  if (hermes.status !== 'connected') {
    return <ConnectHermesPage embedded />;
  }

  if (!hasEnabled) {
    return (
      <HomeEmptyState
        quota={agentQuota}
        onEnableAgent={(agentId) => {
          const result = activateAgent(agentId);
          if (result.ok) {
            openAgentTab(agentId);
            navigate(`/app?agent=${agentId}`);
          } else {
            navigate(`/app/agents?enable=${agentId}`);
          }
        }}
        onViewMarket={() => navigate('/app/agents')}
      />
    );
  }

  if (showEnabledPanel) {
    return (
      <EnabledAgentsPanel
        agents={enabledAgents}
        slotsRemaining={agentQuota.slotsRemaining}
        onUseAgent={handleUseAgent}
        onViewTasks={(agentId) => navigate(`/app/tasks?agent=${agentId}`)}
        onGoMarket={() => navigate('/app/agents')}
      />
    );
  }

  if (!activeAgentId) {
    return <Navigate to="/app" replace />;
  }

  const state: AgentEntryState = { from: `/app?agent=${activeAgentId}`, agentId: activeAgentId };
  return <Navigate to={`/app/agents/${activeAgentId}`} replace state={state} />;
}

function HomeEmptyState({
  quota,
  onEnableAgent,
  onViewMarket,
}: {
  quota: AgentQuotaSnapshot;
  onEnableAgent: (agentId: string) => void;
  onViewMarket: () => void;
}) {
  const navigate = useNavigate();
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  const cards = getOnboardingMarketCards();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-2xl font-bold font-display">还没有启用智能体</h1>
        <p className="text-sm text-black/50">先去智能体市场启用一个智能体，开始你的第一个任务。</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-center text-xs text-black/45">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <MarketCard
              key={card.id}
              card={card}
              onEnable={() => onEnableAgent(card.id)}
              onEnter={() =>
                navigate(`/app/agents/${card.id}`, {
                  state: { from: '/app', agentId: card.id } satisfies AgentEntryState,
                })
              }
              onDeactivate={() => {}}
              onUpgrade={() => navigate('/app/usage')}
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
