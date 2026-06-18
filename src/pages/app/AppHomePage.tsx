import { useMemo, useSyncExternalStore } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AgentIcon from '../../components/app/agents/AgentIcon';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { getUsage, subscribeUsage } from '../../lib/usageStore';
import { getOccupiedSlotCount, subscribeAgentSlots } from '../../lib/agentSlotStore';
import { getHomeDashboardData, getOnboardingAgents } from '../../lib/homeDashboard';
import type { AgentQuotaSnapshot } from '../../types/homeDashboard';
import type { AgentEntryState } from '../../types/agentNavigation';

const WORKBENCH_LAST_AGENT_KEY = 'hellome_workbench_last_agent';
const WORKBENCH_HIDDEN_TABS_KEY = 'hellome_workbench_hidden_tabs';
const WORKBENCH_TAB_ORDER_KEY = 'hellome_workbench_tab_order';
const WORKBENCH_PINNED_TABS_KEY = 'hellome_workbench_pinned_tabs';

export default function AppHomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);

  const dashboard = getHomeDashboardData();
  const { agentQuota, enabledAgents } = dashboard;
  const hasEnabled = enabledAgents.length > 0;
  const requestedAgentId = searchParams.get('agent');
  const visibleAgents = useMemo(() => {
    const hidden = readStringArray(WORKBENCH_HIDDEN_TABS_KEY);
    const order = readStringArray(WORKBENCH_TAB_ORDER_KEY);
    const pinned = new Set(readStringArray(WORKBENCH_PINNED_TABS_KEY));
    const orderMap = new Map(order.map((id, idx) => [id, idx]));
    return enabledAgents
      .filter((a) => !hidden.includes(a.agentId))
      .sort((a, b) => {
        const pinDiff = Number(pinned.has(b.agentId)) - Number(pinned.has(a.agentId));
        if (pinDiff !== 0) return pinDiff;
        const aIdx = orderMap.get(a.agentId) ?? Number.MAX_SAFE_INTEGER;
        const bIdx = orderMap.get(b.agentId) ?? Number.MAX_SAFE_INTEGER;
        return aIdx - bIdx;
      });
  }, [enabledAgents]);

  const defaultAgentId = useMemo(() => {
    const waiting = visibleAgents.find((a) => a.latestTask?.status === 'waiting_confirmation');
    if (waiting?.agentId) return waiting.agentId;

    const lastOpened = localStorage.getItem(WORKBENCH_LAST_AGENT_KEY);
    if (lastOpened && visibleAgents.some((a) => a.agentId === lastOpened)) return lastOpened;

    return visibleAgents[0]?.agentId ?? null;
  }, [visibleAgents]);

  const activeAgentId =
    (requestedAgentId && visibleAgents.some((a) => a.agentId === requestedAgentId) ? requestedAgentId : null) ??
    defaultAgentId;

  if (!hasEnabled) {
    return (
      <HomeEmptyState
        quota={agentQuota}
        onEnableGeo={() => navigate('/app/agents?enable=geo')}
        onViewAll={() => navigate('/app/agents')}
      />
    );
  }

  if (!activeAgentId) {
    return <Navigate to="/app/agents" replace />;
  }

  const state: AgentEntryState = { from: `/app?agent=${activeAgentId}`, agentId: activeAgentId };
  localStorage.setItem(WORKBENCH_LAST_AGENT_KEY, activeAgentId);
  return <Navigate to={`/app/agents/${activeAgentId}`} replace state={state} />;
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
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-8">
      <section className="text-center space-y-3 pt-8">
        <h1 className="text-2xl font-bold font-display">我的工作台还没有智能体</h1>
        <p className="text-sm text-black/50">先启用一个智能体，开始你的第一个任务。</p>
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
                    {agent.available ? '去市场启用' : '即将开放'}
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
          去智能体市场
        </button>
      </div>
    </div>
  );
}

function readStringArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
