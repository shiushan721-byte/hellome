import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Flame, Heart } from 'lucide-react';
import {
  AGENTS,
  CATEGORIES,
  RANKING_SECTIONS,
  getAgentById,
  type AgentCategory,
  type AgentItem,
} from '../../data/agentsCatalog';

const RANK_STYLES = [
  'bg-gradient-to-br from-amber-300 to-yellow-500 text-white',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-orange-300 to-amber-600 text-white',
];

export default function AgentsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<AgentCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AGENTS.filter((agent) => {
      const matchCategory = category === 'all' || agent.category === category;
      const matchQuery =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.desc.toLowerCase().includes(q) ||
        agent.creator.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [category, query]);

  const openAgent = (agent: AgentItem) => {
    if (agent.available) navigate(agent.path);
  };

  return (
    <div className="min-h-full bg-[#F5F5F7] px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">智能体广场</h1>

        {/* Top ranking cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RANKING_SECTIONS.map((section) => (
            <div key={section.id}>
              <RankingCard section={section} onSelect={openAgent} />
            </div>
          ))}
        </div>

        {/* Category + search */}
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

        {/* Agent grid */}
        {filtered.length === 0 ? (
          <p className="text-sm text-black/40 py-16 text-center">未找到匹配的智能体</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((agent) => (
              <div key={agent.id} className="h-full">
                <AgentCard agent={agent} onClick={() => openAgent(agent)} />
              </div>
            ))}
          </div>
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
          const Icon = agent.icon;
          return (
            <li key={agent.id}>
              <button
                type="button"
                onClick={() => onSelect(agent)}
                disabled={!agent.available}
                className="w-full flex items-center gap-3 text-left group disabled:cursor-default"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${RANK_STYLES[index]}`}
                >
                  {index + 1}
                </span>
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${agent.iconBg}`}
                >
                  <Icon className={`w-4 h-4 ${agent.iconColor}`} />
                </span>
                <span
                  className={`text-sm truncate ${
                    agent.available
                      ? 'text-black/80 group-hover:text-black'
                      : 'text-black/50'
                  }`}
                >
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

function AgentCard({ agent, onClick }: { agent: AgentItem; onClick: () => void }) {
  const Icon = agent.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!agent.available}
      className="w-full text-left bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:hover:translate-y-0 disabled:hover:shadow-sm disabled:cursor-default flex flex-col h-full min-h-[200px]"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${agent.iconBg}`}
        >
          <Icon className={`w-7 h-7 ${agent.iconColor}`} />
        </div>
        {agent.badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              agent.available
                ? 'bg-black text-white'
                : 'bg-black/5 text-black/40'
            }`}
          >
            {agent.badge}
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{agent.name}</h3>
      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 flex-1 mb-2">
        {agent.desc}
      </p>
      <p className="text-[11px] font-mono text-black/35 mb-4">预计 {agent.tokenRange}</p>

      <div className="flex items-center justify-between pt-4 border-t border-black/[0.04]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#F2F0ED] text-[10px] font-bold flex items-center justify-center text-black/55 shrink-0">
            {agent.creatorAvatar}
          </span>
          <span className="text-xs text-black/45 truncate">{agent.creator}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-black/35 shrink-0">
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
    </button>
  );
}
