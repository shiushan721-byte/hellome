import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import AgentIcon from './agents/AgentIcon';
import { CATEGORIES, getAgentById, type AgentCategory } from '../../data/agentsCatalog';
import { isAgentTabOpen } from '../../lib/workbenchTabs';
import type { EnabledAgentSummary } from '../../types/homeDashboard';

const CARD_MIN_HEIGHT = 180;
const GRID_GAP = 12;
const GRID_COLS = 3;

function gridContentHeight(agentCount: number): number {
  const rows = Math.max(1, Math.ceil(agentCount / GRID_COLS));
  return rows * CARD_MIN_HEIGHT + (rows - 1) * GRID_GAP;
}

interface WorkbenchOpenAgentModalProps {
  agents: EnabledAgentSummary[];
  onOpen: (agentId: string) => void;
  onClose: () => void;
}

function OpenAgentPickerCard({
  agent,
  alreadyOpen,
  onOpen,
}: {
  agent: EnabledAgentSummary;
  alreadyOpen: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-4 border shadow-sm flex flex-col h-[180px] ${
        alreadyOpen ? 'border-black/[0.04] opacity-55' : 'border-black/[0.04]'
      }`}
    >
      <AgentIcon src={agent.iconSrc} alt={agent.name} size="md" className="mb-3" />
      <h3 className="text-sm font-bold text-[#1A1A1A] mb-1.5">{agent.name}</h3>
      <p className="text-xs text-black/45 leading-relaxed line-clamp-2 flex-1 mb-3">{agent.description}</p>
      <button
        type="button"
        disabled={alreadyOpen}
        onClick={onOpen}
        className={`w-full py-2 text-xs font-bold rounded-lg ${
          alreadyOpen
            ? 'bg-black/10 text-black/40 cursor-not-allowed'
            : 'bg-black text-white hover:bg-black/85'
        }`}
      >
        {alreadyOpen ? '已打开' : '打开智能体'}
      </button>
    </div>
  );
}

export default function WorkbenchOpenAgentModal({
  agents,
  onOpen,
  onClose,
}: WorkbenchOpenAgentModalProps) {
  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');

  const listHeight = useMemo(() => gridContentHeight(agents.length), [agents.length]);

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const catalog = getAgentById(agent.agentId);
      const matchCategory = category === 'all' || catalog?.category === category;
      const matchQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        catalog?.creator.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [agents, category, query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-black/8 flex items-center gap-3 bg-white">
          <h3 className="text-sm font-semibold shrink-0">打开智能体</h3>
          <div className="relative flex-1 max-w-[168px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F5F7] rounded-full border border-black/6 outline-none focus:ring-1 focus:ring-black/5"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 shrink-0 rounded-md border border-black/10 hover:bg-[#F2F0ED] flex items-center justify-center ml-auto"
            aria-label="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-4 py-3 bg-[#F5F5F7] border-b border-black/6">
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
        </div>

        <div
          className="p-4 overflow-y-auto bg-[#F5F5F7]"
          style={{ height: `min(${listHeight + 32}px, 60vh)` }}
        >
          {filteredAgents.length === 0 ? (
            <p className="py-8 text-center text-xs text-black/45">未找到匹配的智能体</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredAgents.map((agent) => (
                <OpenAgentPickerCard
                  key={agent.agentId}
                  agent={agent}
                  alreadyOpen={isAgentTabOpen(agent.agentId)}
                  onOpen={() => onOpen(agent.agentId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
