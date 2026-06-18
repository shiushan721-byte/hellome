import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
  findAdjacentVisibleTabId,
  getHiddenTabIds,
  getTabOrder,
  getVisibleRecentAgentIds,
  hideAgentTab,
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
const PREVIEW_DELAY_MS = 600;

interface TabPreview {
  agent: EnabledAgentSummary;
  x: number;
  y: number;
}

export default function WorkbenchTabsBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [openAgentModal, setOpenAgentModal] = useState(false);
  const [showHermesModal, setShowHermesModal] = useState(false);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<TabPreview | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);
  useSyncExternalStore(
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

  const tabRevision = useSyncExternalStore(
    subscribeWorkbenchTabs,
    () => getTabOrder().join(','),
    () => '',
  );

  const recentAgents = useMemo(
    () => sortRecentAgentSummaries(getHomeDashboardData().recentAgents),
    [tabRevision],
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

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const visibleAgents = recentAgents;

  const clearHoverState = () => {
    setHoveredTabId(null);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setPreviewTab(null);
  };

  const openAgent = (agentId: string) => {
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
      navigate(getAgentWorkspacePath(agentId));
    }
  };

  const closeTab = (e: MouseEvent, agentId: string) => {
    e.stopPropagation();
    const openedIds = getTabOrder();
    const nextTabId = findAdjacentVisibleTabId(agentId, openedIds);
    hideAgentTab(agentId);
    clearHoverState();

    if (activeAgentId !== agentId) return;

    if (nextTabId) {
      openAgentTab(nextTabId);
      navigate(getAgentWorkspacePath(nextTabId));
      return;
    }

    navigate('/app');
  };

  const handleTabMouseEnter = (agent: EnabledAgentSummary, e: MouseEvent<HTMLDivElement>) => {
    setHoveredTabId(agent.agentId);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewTab({ agent, x: rect.left + rect.width / 2, y: rect.bottom });
    }, PREVIEW_DELAY_MS);
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

  return (
    <div className="relative">
      <div className="flex items-end w-full h-[46px] bg-[#dee1e6] px-2 pt-2 overflow-hidden select-none">
        <div className="flex flex-1 h-full min-w-0 items-end overflow-hidden relative pr-2">
          {visibleAgents.map((agent, index) => {
            const isActive = agent.agentId === activeAgentId;
            const isHovered = agent.agentId === hoveredTabId;
            const isPrevActiveOrHovered =
              index > 0 &&
              (visibleAgents[index - 1].agentId === activeAgentId ||
                visibleAgents[index - 1].agentId === hoveredTabId);
            const showSeparator = !isActive && !isHovered && !isPrevActiveOrHovered && index !== 0;

            return (
              <div
                key={agent.agentId}
                draggable
                onDragStart={() => setDraggingTabId(agent.agentId)}
                onDragEnd={() => setDraggingTabId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderByDrop(agent.agentId)}
                onMouseEnter={(e) => handleTabMouseEnter(agent, e)}
                onMouseLeave={clearHoverState}
                onClick={() => openAgent(agent.agentId)}
                className={`group relative flex items-center h-[36px] min-w-[60px] max-w-[240px] flex-1 shrink cursor-pointer px-3 rounded-t-[8px] transition-colors duration-150 ease-in-out ${
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
                  <div className="absolute -left-px top-1/2 -translate-y-1/2 w-px h-5 bg-gray-400 opacity-60 pointer-events-none" />
                )}

                <div className="relative shrink-0 w-4 h-4 mr-2">
                  <img
                    src={agent.iconSrc}
                    alt=""
                    className="w-4 h-4 rounded-full object-cover bg-white"
                    loading="lazy"
                  />
                  {agent.latestTask?.status === 'running' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                  )}
                  {agent.latestTask?.status === 'waiting_confirmation' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden text-xs whitespace-nowrap text-ellipsis text-[#3c4043]">
                  {agent.name}
                </div>

                <button
                  type="button"
                  onClick={(e) => closeTab(e, agent.agentId)}
                  aria-label={`关闭 ${agent.name} 标签`}
                  className={`shrink-0 ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-all ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <X size={14} className="text-gray-600" />
                </button>
              </div>
            );
          })}

          <div className="relative shrink-0 flex items-center h-[36px] pl-2">
            {showPlusSeparator && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-5 bg-gray-400 opacity-60 pointer-events-none" />
            )}
            <button
              type="button"
              onClick={() => {
                if (!isHermesConnected()) setShowHermesModal(true);
                else setOpenAgentModal(true);
              }}
              title="打开智能体"
              aria-label="打开智能体"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#d0d4cd] transition-colors"
            >
              <Plus size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {previewTab && (
        <div
          className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 w-[280px] pointer-events-none"
          style={{
            left: Math.max(10, previewTab.x - 140),
            top: previewTab.y + 4,
          }}
        >
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <img
              src={previewTab.agent.iconSrc}
              alt=""
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{previewTab.agent.name}</h3>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{previewTab.agent.description}</p>
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
