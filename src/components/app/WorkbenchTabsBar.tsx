import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FolderOpen, X } from 'lucide-react';
import { getHomeDashboardData } from '../../lib/homeDashboard';
import { getOccupiedSlotCount, subscribeAgentSlots } from '../../lib/agentSlotStore';
import { getTasks, subscribeTasks } from '../../lib/taskStore';
import { useSyncExternalStore } from 'react';
import {
  getHermesConnection,
  refreshHermesConnection,
  subscribeHermesConnection,
} from '../../lib/hermesConnection';
import HermesActionModal from './HermesActionModal';

const HIDDEN_KEY = 'hellome_workbench_hidden_tabs';
const ORDER_KEY = 'hellome_workbench_tab_order';

export default function WorkbenchTabsBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hiddenTabs, setHiddenTabs] = useState<string[]>([]);
  const [orderedTabs, setOrderedTabs] = useState<string[]>([]);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [openAgentModal, setOpenAgentModal] = useState(false);
  const [showHermesModal, setShowHermesModal] = useState(false);

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const hermes = useSyncExternalStore(
    subscribeHermesConnection,
    getHermesConnection,
    getHermesConnection,
  );

  const activeAgentId = useMemo(() => {
    const m = location.pathname.match(/^\/app\/agents\/([^/]+)$/);
    return m?.[1] ?? null;
  }, [location.pathname]);

  const enabledAgents = getHomeDashboardData().enabledAgents;
  const enabledIds = useMemo(() => new Set(enabledAgents.map((a) => a.agentId)), [enabledAgents]);

  useEffect(() => {
    const load = (key: string): string[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as string[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    setHiddenTabs(load(HIDDEN_KEY));
    setOrderedTabs(load(ORDER_KEY));
  }, []);

  const save = (key: string, next: string[]) => {
    localStorage.setItem(key, JSON.stringify(next));
  };

  const visibleAgents = useMemo(() => {
    const orderMap = new Map(orderedTabs.map((id, idx) => [id, idx]));
    return enabledAgents
      .filter((a) => !hiddenTabs.includes(a.agentId))
      .sort((a, b) => {
        const aIdx = orderMap.get(a.agentId) ?? Number.MAX_SAFE_INTEGER;
        const bIdx = orderMap.get(b.agentId) ?? Number.MAX_SAFE_INTEGER;
        return aIdx - bIdx;
      });
  }, [enabledAgents, hiddenTabs, orderedTabs]);

  useEffect(() => {
    const nextHidden = hiddenTabs.filter((id) => enabledIds.has(id));
    if (nextHidden.length !== hiddenTabs.length) {
      setHiddenTabs(nextHidden);
      save(HIDDEN_KEY, nextHidden);
    }
    const nextOrder = orderedTabs.filter((id) => enabledIds.has(id));
    if (nextOrder.length !== orderedTabs.length) {
      setOrderedTabs(nextOrder);
      save(ORDER_KEY, nextOrder);
    }
  }, [enabledIds, hiddenTabs, orderedTabs]);

  const openAgent = (agentId: string) => {
    if (hermes.status !== 'connected') {
      setShowHermesModal(true);
      return;
    }
    navigate(`/app/agents/${agentId}`);
  };

  const hideTab = (agentId: string) => {
    const next = Array.from(new Set([...hiddenTabs, agentId]));
    setHiddenTabs(next);
    save(HIDDEN_KEY, next);
    if (activeAgentId === agentId) navigate('/app');
  };

  const restoreTab = (agentId: string) => {
    const next = hiddenTabs.filter((id) => id !== agentId);
    setHiddenTabs(next);
    save(HIDDEN_KEY, next);
    openAgent(agentId);
  };

  const reorderByDrop = (targetId: string) => {
    if (!draggingTabId || draggingTabId === targetId) return;
    const visibleIds = visibleAgents.map((a) => a.agentId);
    const sourceIndex = visibleIds.indexOf(draggingTabId);
    const targetIndex = visibleIds.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextVisible = [...visibleIds];
    nextVisible.splice(sourceIndex, 1);
    nextVisible.splice(targetIndex, 0, draggingTabId);
    const leftovers = enabledAgents.map((a) => a.agentId).filter((id) => !nextVisible.includes(id));
    const nextOrder = [...nextVisible, ...leftovers];
    setOrderedTabs(nextOrder);
    save(ORDER_KEY, nextOrder);
  };

  return (
    <div className="border-b border-black/8 bg-[#FDFCFB] px-4 py-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {visibleAgents.map((agent) => {
          const active = agent.agentId === activeAgentId;
          return (
            <div
              key={agent.agentId}
              draggable
              onDragStart={() => setDraggingTabId(agent.agentId)}
              onDragEnd={() => setDraggingTabId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorderByDrop(agent.agentId)}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 border rounded-t-md text-xs ${
                active
                  ? 'bg-white border-black/30 text-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.75)]'
                  : 'bg-[#F2F0ED] border-black/15 text-black/65 hover:bg-white'
              }`}
            >
              {agent.latestTask?.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              {agent.latestTask?.status === 'waiting_confirmation' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
              <button type="button" onClick={() => openAgent(agent.agentId)} className="max-w-[150px] truncate text-left">
                {agent.name}
              </button>
              <button type="button" onClick={() => hideTab(agent.agentId)} className="text-black/35 hover:text-black/65">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => {
            if (hermes.status !== 'connected') setShowHermesModal(true);
            else setOpenAgentModal(true);
          }}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs border border-black/15 rounded-t-md bg-[#F2F0ED] hover:bg-white"
        >
          <FolderOpen className="w-3.5 h-3.5 text-black/55" />
          打开智能体
        </button>
      </div>

      {openAgentModal && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-black/10 rounded-2xl shadow-xl">
            <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
              <h3 className="text-sm font-semibold">打开智能体</h3>
              <button
                type="button"
                onClick={() => setOpenAgentModal(false)}
                className="w-7 h-7 rounded-md border border-black/10 hover:bg-[#F2F0ED] flex items-center justify-center"
                aria-label="关闭"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 max-h-[60vh] overflow-auto space-y-1.5">
              {enabledAgents.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-black/45">暂无已启用智能体</p>
              ) : (
                enabledAgents.map((agent) => {
                  const hidden = hiddenTabs.includes(agent.agentId);
                  const alreadyOpen = !hidden;
                  return (
                    <button
                      key={agent.agentId}
                      type="button"
                      disabled={alreadyOpen}
                      onClick={() => {
                        if (hidden) restoreTab(agent.agentId);
                        setOpenAgentModal(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm ${
                        alreadyOpen
                          ? 'border-black/8 bg-[#F5F4F2] text-black/35 cursor-not-allowed'
                          : 'border-black/10 hover:bg-[#F6F5F3]'
                      }`}
                    >
                      <span className="truncate pr-3">{agent.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {showHermesModal && (
        <HermesActionModal
          status={hermes.status}
          onClose={() => setShowHermesModal(false)}
          onOpenHermes={refreshHermesConnection}
          onGoPair={() => {
            setShowHermesModal(false);
            navigate('/connect-hermes');
          }}
        />
      )}
    </div>
  );
}
