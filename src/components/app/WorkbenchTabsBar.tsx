import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { getHomeDashboardData } from '../../lib/homeDashboard';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { useSyncExternalStore } from 'react';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import {
  closeAgentTab,
  findAdjacentVisibleTabId,
  getHiddenTabIds,
  getTabOrder,
  openAgentTab,
  pruneWorkbenchTabs,
  setTabOrder,
  sortRecentAgentSummaries,
  subscribeWorkbenchTabs,
} from '../../lib/workbenchTabs';
import type { EnabledAgentSummary } from '../../types/homeDashboard';
import HermesActionModal from './HermesActionModal';
import WorkbenchOpenAgentModal from './WorkbenchOpenAgentModal';
import { AGENTS } from '../../data/agentsCatalog';
import { isHermesConnected } from '../../lib/firstRunOnboarding';
import { replayPendingIntent } from '../../lib/pendingAgentIntent';
import { getAgentWorkspacePath } from '../../lib/openAgentWorkspace';
import { tryUseAgent } from '../../lib/useAgentAccess';
import { isLowBalance, getUsage, subscribeUsage } from '../../lib/usageStore';

const TAB_ACTIVE_BG = '#FDFCFB';
interface WorkbenchTabsBarProps {
  variant?: 'chrome' | 'topbar';
}

export default function WorkbenchTabsBar({ variant = 'chrome' }: WorkbenchTabsBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [openAgentModal, setOpenAgentModal] = useState(false);
  const [showHermesModal, setShowHermesModal] = useState(false);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  const workbenchRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => `${getHiddenTabIds().join(',')}|${getTabOrder().join(',')}`,
    () => '',
  );
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );
  const lowBalance = isLowBalance(getUsage());

  const activeAgentId = useMemo(() => {
    if (location.pathname === '/app') {
      return new URLSearchParams(location.search).get('agent');
    }
    const match = location.pathname.match(/^\/app\/agents\/([^/]+)$/);
    return match?.[1] ?? null;
  }, [location.pathname, location.search]);

  const recentAgents = useMemo(
    () => sortRecentAgentSummaries(getHomeDashboardData().recentAgents),
    [workbenchRevision],
  );

  const availableAgents = useMemo<EnabledAgentSummary[]>(
    () =>
      AGENTS.filter((agent) => agent.available).map((agent) => {
        const existing = recentAgents.find((item) => item.agentId === agent.id);
        return (
          existing ?? {
            agentId: agent.id,
            name: agent.name,
            description: agent.desc,
            path: agent.path,
            iconSrc: agent.iconSrc,
            monthlyTaskCount: 0,
            monthlyTokenUsed: 0,
            templates: [],
          }
        );
      }),
    [recentAgents],
  );

  const availableIds = useMemo(
    () => new Set(AGENTS.filter((a) => a.available).map((a) => a.id)),
    [],
  );

  useEffect(() => {
    pruneWorkbenchTabs(availableIds);
  }, [availableIds]);

  const visibleAgents = recentAgents;

  const clearHoverState = () => {
    setHoveredTabId(null);
  };

  const openAgent = (agentId: string) => {
    const result = tryUseAgent(agentId, { lowBalance });
    if (result.reason === 'hermes') {
      setShowHermesModal(true);
      return;
    }
    if (result.reason === 'recharge') {
      navigate('/app/usage/recharge');
      return;
    }
    if (result.ok) {
      navigate(getAgentWorkspacePath(agentId));
    }
  };

  const closeTab = (e: MouseEvent, agentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const nextTabId = findAdjacentVisibleTabId(agentId);
    closeAgentTab(agentId);
    clearHoverState();

    if (activeAgentId !== agentId) return;

    if (nextTabId) {
      openAgentTab(nextTabId);
      navigate(getAgentWorkspacePath(nextTabId));
      return;
    }

    navigate('/app', { replace: true });
  };

  const reorderByDrop = (targetId: string) => {
    if (!draggingTabId || draggingTabId === targetId) return;
    const visibleIds = visibleAgents.map((agent) => agent.agentId);
    const sourceIndex = visibleIds.indexOf(draggingTabId);
    const targetIndex = visibleIds.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextVisible = [...visibleIds];
    nextVisible.splice(sourceIndex, 1);
    nextVisible.splice(targetIndex, 0, draggingTabId);
    const leftovers = getTabOrder().filter((id) => !nextVisible.includes(id));
    setTabOrder([...nextVisible, ...leftovers]);
  };

  if (visibleAgents.length === 0) {
    return null;
  }

  const lastAgent = visibleAgents[visibleAgents.length - 1];
  const lastTabIsActive = lastAgent.agentId === activeAgentId;
  const lastTabIsHovered = lastAgent.agentId === hoveredTabId;
  const showPlusSeparator = !lastTabIsActive && !lastTabIsHovered;

  const tabList = (
    <>
      {visibleAgents.map((agent, index) => {
        const isActive = agent.agentId === activeAgentId;
        const isHovered = agent.agentId === hoveredTabId;
        const isPrevActiveOrHovered =
          index > 0 &&
          (visibleAgents[index - 1].agentId === activeAgentId ||
            visibleAgents[index - 1].agentId === hoveredTabId);
        const showSeparator = !isActive && !isHovered && !isPrevActiveOrHovered && index !== 0;

        const tabHeightClass = variant === 'topbar' ? 'h-full' : 'h-[36px]';
        const tabTextClass = variant === 'topbar' ? 'text-[13px]' : 'text-xs';

        return (
          <div
            key={agent.agentId}
            draggable
            onDragStart={() => setDraggingTabId(agent.agentId)}
            onDragEnd={() => setDraggingTabId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => reorderByDrop(agent.agentId)}
            onMouseEnter={() => setHoveredTabId(agent.agentId)}
            onMouseLeave={clearHoverState}
            onClick={() => openAgent(agent.agentId)}
            className={`group relative flex items-center ${tabHeightClass} min-w-[60px] max-w-[220px] flex-1 shrink cursor-pointer px-2.5 rounded-t-[8px] transition-colors duration-150 ease-in-out ${
              isActive ? 'z-20' : isHovered ? 'z-10 bg-[#ebeced]' : 'z-0 bg-transparent hover:bg-[#ebeced]'
            }`}
            style={isActive ? { backgroundColor: TAB_ACTIVE_BG } : undefined}
          >
            {isActive && (
              <>
                <div
                  className="absolute -left-2 bottom-0 w-2 h-2 rounded-br-[8px] pointer-events-none"
                  style={{ boxShadow: `4px 0 0 0 ${TAB_ACTIVE_BG}` }}
                />
                <div
                  className="absolute -right-2 bottom-0 w-2 h-2 rounded-bl-[8px] pointer-events-none"
                  style={{ boxShadow: `-4px 0 0 0 ${TAB_ACTIVE_BG}` }}
                />
              </>
            )}

            {showSeparator && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-400/60 pointer-events-none" />
            )}

            <div className="relative shrink-0 w-[18px] h-[18px] mr-1.5">
              <img
                src={agent.iconSrc}
                alt=""
                className="w-[18px] h-[18px] rounded-full object-cover bg-white"
                loading="lazy"
              />
              {agent.latestTask?.status === 'running' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
              )}
              {agent.latestTask?.status === 'waiting_confirmation' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white" />
              )}
            </div>

            <div className={`flex-1 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis text-[#3c4043] leading-none ${tabTextClass}`}>
              {agent.name}
            </div>

            <button
              type="button"
              onClick={(e) => closeTab(e, agent.agentId)}
              aria-label={`关闭 ${agent.name} 标签`}
              className={`shrink-0 ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <X size={13} className="text-gray-600" />
            </button>
          </div>
        );
      })}

      <div className="relative shrink-0 flex items-center h-full pl-1.5">
        {showPlusSeparator && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-4 bg-gray-400/60 pointer-events-none" />
        )}
        <button
          type="button"
          onClick={() => {
            if (!isHermesConnected()) setShowHermesModal(true);
            else setOpenAgentModal(true);
          }}
          title="打开智能体"
          aria-label="打开智能体"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#d0d4cd] transition-colors"
        >
          <Plus size={18} className="text-gray-600" />
        </button>
      </div>
    </>
  );

  const topbarTabStrip = (
    <div className="flex items-stretch w-full h-full pl-1 pr-0 overflow-hidden select-none">
      <div className="flex flex-1 h-full min-w-0 items-start overflow-x-auto custom-scrollbar relative pr-4">
        {tabList}
      </div>
    </div>
  );

  return (
    <div className={variant === 'topbar' ? 'min-w-0 w-full h-full flex items-stretch overflow-hidden' : 'relative'}>
      {variant === 'topbar' ? topbarTabStrip : (
        <div className="flex items-end w-full h-[46px] bg-[#dee1e6] px-2 pt-2 overflow-hidden select-none">
          <div className="flex flex-1 h-full min-w-0 items-end overflow-hidden relative pr-2">
            {tabList}
          </div>
        </div>
      )}

      {openAgentModal && (
        <WorkbenchOpenAgentModal
          agents={availableAgents}
          onOpen={(agentId) => {
            openAgent(agentId);
            setOpenAgentModal(false);
          }}
          onClose={() => setOpenAgentModal(false)}
        />
      )}

      {showHermesModal && (
        <HermesActionModal
          variant="pairing"
          status={hermes.status}
          onClose={() => setShowHermesModal(false)}
          onOpenHermes={() => refreshHermesConnection()}
          onPairedComplete={() => {
            if (isHermesConnected()) {
              setShowHermesModal(false);
              navigate(replayPendingIntent());
            }
          }}
        />
      )}
    </div>
  );
}
