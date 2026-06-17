import { useMemo, useState, useSyncExternalStore, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, Flame, Heart } from 'lucide-react';
import {
  AGENTS,
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
  getActivation,
  getAgentDisplayStatus,
  getCoolingAgents,
  getOccupiedSlotCount,
  getSwapQuota,
  subscribeAgentSlots,
  formatReleaseCountdown,
} from '../../lib/agentSlotStore';
import { isSlotAgent } from '../../types/agentSlots';
import { formatToken } from '../../lib/tokenBilling';
import {
  DeactivateAgentModal,
  EnableAgentModal,
  SlotsFullModal,
} from '../../components/app/agents/AgentSlotModals';
import AgentIcon from '../../components/app/agents/AgentIcon';

const RANK_STYLES = [
  'bg-gradient-to-br from-amber-300 to-yellow-500 text-white',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-orange-300 to-amber-600 text-white',
];

const STATUS_LABEL: Record<string, string> = {
  inactive: '未启用',
  active: '已启用',
  cooling_down: '冷却中',
  unavailable: '套餐不可用',
};

type ModalState =
  | { type: 'enable'; agent: AgentItem }
  | { type: 'deactivate'; agent: AgentItem }
  | { type: 'slots_full'; message: string }
  | null;

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageMode = searchParams.get('mode');
  const pageTab = searchParams.get('tab');
  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  useSyncExternalStore(subscribeAgentSlots, () => getOccupiedSlotCount(), () => 0);
  useSyncExternalStore(subscribeUsage, getUsage, getUsage);

  const usage = getUsage();
  const plan = getPlanEntitlements(usage.planName);
  const occupied = getOccupiedSlotCount();
  const swap = getSwapQuota();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AGENTS.filter((agent) => {
      const matchCategory = category === 'all' || agent.category === category;
      const matchQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.desc.toLowerCase().includes(q) ||
        agent.creator.toLowerCase().includes(q);

      if (pageTab === 'enabled') {
        if (!isSlotAgent(agent.id)) return false;
        if (getAgentDisplayStatus(agent.id, agent.available) !== 'active') return false;
      }
      if (pageMode === 'add') {
        if (!isSlotAgent(agent.id) || !agent.available) return false;
        if (getAgentDisplayStatus(agent.id, true) === 'active') return false;
      }

      return matchCategory && matchQuery;
    });
  }, [category, query, pageMode, pageTab]);

  const handleEnter = (agent: AgentItem) => {
    if (!agent.available) return;
    if (!isSlotAgent(agent.id)) {
      navigate(agent.path);
      return;
    }
    const status = getAgentDisplayStatus(agent.id, true);
    if (status === 'active') return;
    const check = canEnableAgent(agent.id, true);
    if (check.allowed) {
      setModal({ type: 'enable', agent });
    } else if (check.message) {
      setModal({ type: 'slots_full', message: check.message });
    }
  };

  const handleEnable = (agent: AgentItem) => {
    const check = canEnableAgent(agent.id, agent.available);
    if (check.allowed) setModal({ type: 'enable', agent });
    else if (check.message) setModal({ type: 'slots_full', message: check.message });
  };

  const handleDeactivate = (agent: AgentItem) => {
    setModal({ type: 'deactivate', agent });
  };

  const confirmEnable = () => {
    if (modal?.type !== 'enable') return;
    activateAgent(modal.agent.id);
    setModal(null);
  };

  const confirmDeactivate = () => {
    if (modal?.type !== 'deactivate') return;
    deactivateAgent(modal.agent.id);
    setModal(null);
  };

  useEffect(() => {
    const enableId = searchParams.get('enable');
    if (enableId) {
      const agent = getAgentById(enableId);
      if (agent) {
        const check = canEnableAgent(agent.id, agent.available);
        if (check.allowed) setModal({ type: 'enable', agent });
        else if (check.message) setModal({ type: 'slots_full', message: check.message });
      }
    }
    if (pageMode === 'add') {
      requestAnimationFrame(() => {
        document.getElementById('agent-grid')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [searchParams, pageMode]);

  return (
    <div className="min-h-full bg-[#F5F5F7] px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">智能体广场</h1>
            <p className="text-xs text-black/45 mt-1 max-w-xl">
              启用智能体会占用 1 个名额。误点启用可在 10 分钟内无损撤销；正式使用后每月 1 次即时更换，之后停用进入 24 小时冷却。
            </p>
            {pageTab === 'enabled' && (
              <p className="text-xs font-bold text-emerald-700 mt-2">当前查看：已启用智能体</p>
            )}
            {pageMode === 'add' && (
              <p className="text-xs font-bold text-sky-700 mt-2">当前查看：可添加的智能体</p>
            )}
          </div>
          <SlotSummary
            occupied={occupied}
            limit={plan.enabledAgentLimit}
            swap={swap}
            onManage={() => document.getElementById('agent-grid')?.scrollIntoView({ behavior: 'smooth' })}
            onUpgrade={() => navigate('/app/usage')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RANKING_SECTIONS.map((section) => (
            <div key={section.id}>
              <RankingCard section={section} onSelect={handleEnter} />
            </div>
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

        {filtered.length === 0 ? (
          <p className="text-sm text-black/40 py-16 text-center">未找到匹配的智能体</p>
        ) : (
          <div id="agent-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((agent) => (
              <div key={agent.id} className="h-full">
                <AgentCard
                  agent={agent}
                  onEnable={() => handleEnable(agent)}
                  onDeactivate={() => handleDeactivate(agent)}
                />
              </div>
            ))}
          </div>
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
          onConfirm={confirmDeactivate}
          onClose={() => setModal(null)}
          onViewTasks={() => {
            setModal(null);
            navigate('/app/tasks');
          }}
        />
      )}
      {modal?.type === 'slots_full' && (
        <SlotsFullModal
          message={modal.message}
          onClose={() => setModal(null)}
          onUpgrade={() => {
            setModal(null);
            navigate('/app/usage');
          }}
        />
      )}
    </div>
  );
}

function SlotSummary({
  occupied,
  limit,
  swap,
  onManage,
  onUpgrade,
}: {
  occupied: number;
  limit: number;
  swap: { instantSwapUsed: number; instantSwapLimit: number };
  onManage: () => void;
  onUpgrade: () => void;
}) {
  const cooling = getCoolingAgents();
  return (
    <div className="bg-white rounded-xl border border-black/6 px-4 py-3 text-xs space-y-2 min-w-[220px] shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-black/45">可启用智能体</span>
        <span className="font-bold font-mono text-sm">
          {occupied} / {limit}
        </span>
      </div>
      <div className="flex justify-between text-black/40">
        <span>本月即时更换</span>
        <span>
          {swap.instantSwapLimit - swap.instantSwapUsed} / {swap.instantSwapLimit}
        </span>
      </div>
      {cooling.map((a) => {
        const name = getAgentById(a.agentId)?.name ?? a.agentId;
        return (
          <p key={a.agentId} className="text-amber-700 text-[10px]">
            {name} 名额 {formatReleaseCountdown(a.slotReleaseAt!)} 后释放
          </p>
        );
      })}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onManage} className="font-bold text-black/55 hover:text-black">
          管理已启用
        </button>
        {occupied >= limit && (
          <button type="button" onClick={onUpgrade} className="font-bold text-black hover:underline">
            升级套餐
          </button>
        )}
      </div>
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
          <p className="text-xs text-black/40 mt-0.5">{section.subtitle}</p>
        </div>
        <span className="text-3xl select-none" aria-hidden>
          {section.decor}
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((agent, index) => {
          return (
            <li key={agent.id}>
              <button
                type="button"
                onClick={() => onSelect(agent)}
                disabled={!agent.available && !isSlotAgent(agent.id)}
                className="w-full flex items-center gap-3 text-left group disabled:opacity-50"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${RANK_STYLES[index]}`}>
                  {index + 1}
                </span>
                <AgentIcon src={agent.iconSrc} alt={agent.name} size="sm" />
                <span className="text-sm truncate text-black/80 group-hover:text-black">
                  {agent.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AgentCard({
  agent,
  onEnable,
  onDeactivate,
}: {
  agent: AgentItem;
  onEnable: () => void;
  onDeactivate: () => void;
}) {
  const slotEligible = isSlotAgent(agent.id);
  const displayStatus = !agent.available
    ? ('coming_soon' as const)
    : slotEligible
      ? getAgentDisplayStatus(agent.id, true)
      : ('inactive' as const);
  const activation = slotEligible ? getActivation(agent.id) : undefined;

  const badgeText =
    displayStatus === 'coming_soon' || displayStatus === 'unavailable'
      ? agent.badge ?? null
      : STATUS_LABEL[displayStatus];

  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm flex flex-col h-full min-h-[240px]">
      <div className="flex items-start justify-between mb-4">
        <AgentIcon src={agent.iconSrc} alt={agent.name} size="lg" />
        {badgeText && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              displayStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : displayStatus === 'cooling_down'
                  ? 'bg-amber-50 text-amber-700'
                  : displayStatus === 'coming_soon' && agent.badge
                    ? 'bg-black/5 text-black/40'
                    : 'bg-[#F2F0ED] text-black/50'
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{agent.name}</h3>
      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 flex-1 mb-2">{agent.desc}</p>
      <p className="text-[11px] font-mono text-black/35 mb-3">预计 {agent.tokenRange}</p>

      {displayStatus === 'active' && activation && (
        <p className="text-[10px] text-black/40 mb-3">
          本月任务 {activation.completedTaskCount} 个 · 消耗 {formatToken(activation.tokenUsed)} Token
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#F2F0ED] text-[10px] font-bold flex items-center justify-center">
            {agent.creatorAvatar}
          </span>
          <span className="text-xs text-black/45 truncate">{agent.creator}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-black/35">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {agent.heat}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {agent.likes}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        {displayStatus === 'active' && agent.available && (
          <div className="flex flex-col gap-2 w-full">
            <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1.5 text-center">
              已启用，请在工作台首页进入使用
            </p>
            <button
              type="button"
              onClick={onDeactivate}
              className="w-full py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
            >
              停用
            </button>
          </div>
        )}
        {displayStatus === 'inactive' && agent.available && slotEligible && (
          <button
            type="button"
            onClick={onEnable}
            className="w-full py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
          >
            启用智能体
          </button>
        )}
        {displayStatus === 'cooling_down' && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold text-amber-700 bg-amber-50">
            冷却中，名额稍后释放
          </button>
        )}
        {displayStatus === 'inactive' && agent.available && !slotEligible && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold bg-black/10 text-black/40">
            即将开放
          </button>
        )}
        {displayStatus === 'coming_soon' && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold bg-black/10 text-black/40">
            即将开放
          </button>
        )}
        {displayStatus === 'unavailable' && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold text-black/35">
            套餐不可用
          </button>
        )}
      </div>
    </div>
  );
}
