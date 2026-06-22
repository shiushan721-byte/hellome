import { Flame, Heart } from 'lucide-react';
import type { AgentMarketCard } from '../../../types/agentsPage';
import AgentIcon from './AgentIcon';
import { getVideoAgentProfile } from '../../../config/videoAgentProfiles';

interface MarketCardProps {
  card: AgentMarketCard;
  lowBalance?: boolean;
  guestMode?: boolean;
  onEnter: () => void;
  onViewDetail?: () => void;
}

function primaryCtaLabel(card: AgentMarketCard, lowBalance: boolean): string {
  if (card.status === 'coming_soon') return '即将开放';
  if (card.badge === 'beta' || card.badge === '内测') return '申请内测';
  if (lowBalance) return '充值算力';
  const profile = getVideoAgentProfile(card.id);
  if (profile) return profile.marketEntryLabel;
  return '使用智能体';
}

export default function MarketCard({
  card,
  lowBalance = false,
  guestMode = false,
  onEnter,
  onViewDetail,
}: MarketCardProps) {
  const isComingSoon = card.status === 'coming_soon';
  const isBeta = card.badge === 'beta' || card.badge === '内测';
  const ctaLabel = primaryCtaLabel(card, !guestMode && lowBalance);
  const disabled = isComingSoon || isBeta;

  return (
    <div
      id={`market-card-${card.id}`}
      className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-sm flex flex-col h-full min-h-[240px]"
    >
      <div className="flex items-start justify-between mb-4">
        <AgentIcon src={card.iconSrc} alt={card.name} size="lg" />
      </div>

      <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{card.name}</h3>
      <p className="text-sm text-black/45 leading-relaxed line-clamp-2 flex-1 mb-2">{card.description}</p>
      <p className="text-[11px] font-mono mb-3 min-h-[17px]" aria-hidden="true" />

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

      <div className="mt-auto space-y-2">
        {disabled ? (
          <button type="button" disabled className="w-full py-2 text-xs font-bold bg-black/10 text-black/40 rounded-lg">
            {ctaLabel}
          </button>
        ) : guestMode ? (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={onEnter}
              className="flex-1 py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
            >
              使用智能体
            </button>
            <button
              type="button"
              onClick={onViewDetail ?? onEnter}
              className="flex-1 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED] rounded-lg"
            >
              查看详情
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEnter}
            className="w-full py-2 text-xs font-bold bg-black text-white hover:bg-black/85 rounded-lg"
          >
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
