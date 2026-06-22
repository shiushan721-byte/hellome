import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  WORKFLOW_CATEGORIES,
  WORKFLOW_MARKET_ITEMS,
  filterWorkflowMarketItems,
  type WorkflowCategory,
} from '../../../data/workflowMarket';
import WorkflowMarketCard from './WorkflowMarketCard';

export default function WorkflowMarketSection() {
  const [category, setCategory] = useState<WorkflowCategory>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterWorkflowMarketItems(WORKFLOW_MARKET_ITEMS, category, query),
    [category, query],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {WORKFLOW_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
                  active
                    ? 'bg-[#1A1A1A] text-white font-medium'
                    : 'bg-white text-black/55 hover:text-black/75 border border-black/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工作流"
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white rounded-full border border-black/6 outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-black/40 py-16 text-center">未找到匹配的工作流</p>
      ) : (
        <div
          id="workflow-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full"
        >
          {filtered.map((item) => (
            <WorkflowMarketCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
