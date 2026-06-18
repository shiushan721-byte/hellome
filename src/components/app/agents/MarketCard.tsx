import { Flame, Heart } from 'lucide-react';
import type { AgentMarketCard } from '../../../types/agentsPage';
import AgentIcon from './AgentIcon';

interface MarketCardProps {
  card: AgentMarketCard;
  onEnable: () => void;
  onEnter: () => void;
  onDeactivate: () => void;
  onUpgrade: () => void;
}

export default function MarketCard({
  card,
  onEnable,
  onEnter,
  onDeactivate,
  onUpgrade,
}: MarketCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm flex flex-col h-full min-h-[240px]">
      <div className="flex items-start justify-between mb-4">
        <AgentIcon src={card.iconSrc} alt={card.name} size="lg" />
        {card.status === 'active' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            已启用
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{card.name}</h3>
      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 flex-1 mb-2">{card.description}</p>
      <p className="text-[11px] font-mono text-black/35 mb-3">预计 {card.tokenRange}</p>

      <div className="flex items-center justify-between pt-3 border-t border-black/[0.04] mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-full bg-[#F2F0ED] text-[10px] font-bold flex items-center justify-center">
            {card.creatorAvatar}
          </span>
          <span className="text-xs text-black/45 truncate">{card.creator}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-black/35">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {card.heat}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {card.likes}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        {card.status === 'active' && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={onDeactivate}
              className="flex-1 py-2 text-xs font-bold border border-amber-300/80 text-amber-900 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-400 transition-colors rounded-lg"
            >
              停用
            </button>
            <button
              type="button"
              onClick={onEnter}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
            >
              使用智能体
            </button>
          </div>
        )}
        {card.status === 'inactive' && (
          <button
            type="button"
            onClick={onEnable}
            className="w-full py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
          >
            启用智能体
          </button>
        )}
        {card.status === 'coming_soon' && (
          <button type="button" disabled className="w-full py-2 text-xs font-bold bg-black/10 text-black/40 rounded-lg">
            即将开放
          </button>
        )}
        {card.status === 'plan_unavailable' && (
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
          >
            升级套餐
          </button>
        )}
      </div>
    </div>
  );
}
