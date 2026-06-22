import { Zap } from 'lucide-react';
import type { WorkflowMarketItem } from '../../../data/workflowMarket';

interface WorkflowMarketCardProps {
  item: WorkflowMarketItem;
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function WorkflowMarketCard({ item }: WorkflowMarketCardProps) {
  return (
    <article className="group relative bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden flex flex-col h-full">
      <button
        type="button"
        onClick={() => openExternal(item.href)}
        className="block w-full text-left"
      >
        <div
          className={`relative aspect-[4/3] bg-gradient-to-br ${item.coverGradient} flex items-center justify-center overflow-hidden`}
        >
          <span className="text-3xl font-bold text-black/15 font-display select-none">
            {item.coverLabel}
          </span>
        </div>
      </button>

      <div className="p-3.5 flex flex-col flex-1">
        <button
          type="button"
          onClick={() => openExternal(item.href)}
          className="text-left"
        >
          <h3 className="text-sm font-bold text-[#1A1A1A] leading-snug line-clamp-2 min-h-[2.5rem]">
            {item.title}
          </h3>
        </button>

        <div className="flex items-center justify-between gap-2 mt-2.5 text-[11px] text-black/40">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-5 h-5 rounded-full shrink-0 text-[9px] font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: item.author.avatarBg }}
            >
              {item.author.avatarLabel}
            </span>
            <span className="truncate">{item.author.name}</span>
          </div>
          <span className="shrink-0">{item.publishedAt}</span>
        </div>

        <div className="mt-auto pt-3 flex items-center gap-1 text-sm font-bold text-[#1A1A1A] group-hover:opacity-0 transition-opacity">
          <Zap className="w-3.5 h-3.5 text-[#7C6AE8] fill-[#7C6AE8]" />
          <span>{item.pricePerRun}/次</span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none group-hover:pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openExternal(item.cloneHref);
          }}
          className="flex-1 h-9 rounded-full bg-[#3861FB] text-white text-xs font-bold hover:bg-[#2f52d9]"
        >
          制作同款
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openExternal(item.href);
          }}
          className="flex-1 h-9 rounded-full bg-[#3861FB] text-white text-xs font-bold hover:bg-[#2f52d9]"
        >
          体验
        </button>
      </div>
    </article>
  );
}
