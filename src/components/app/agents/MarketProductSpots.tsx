import {
  MARKET_PRODUCT_SECTION,
  MARKET_PRODUCT_SPOTS,
  type MarketProductSpot,
  type MarketSpotDisplayStatus,
} from '../../../data/agentsMarketHome';
import type { AgentMarketCard } from '../../../types/agentsPage';

interface MarketProductSpotsProps {
  marketCards: AgentMarketCard[];
  guestMode?: boolean;
  onUseSpot: (spot: MarketProductSpot) => void;
}

const MAX_VISIBLE_SPOTS = 6;

type ResolvedSpotStatus = 'active' | MarketSpotDisplayStatus;

const STATUS_STYLE: Record<ResolvedSpotStatus, { border: string; bg: string }> = {
  active: { border: 'border-emerald-200', bg: 'bg-emerald-50/40' },
  open: { border: 'border-sky-200', bg: 'bg-white' },
  recommended: { border: 'border-sky-200', bg: 'bg-white' },
  coming_soon: { border: 'border-black/10', bg: 'bg-white' },
  beta: { border: 'border-amber-200', bg: 'bg-white' },
};

function resolveSpotStatus(spot: MarketProductSpot, cards: AgentMarketCard[]): ResolvedSpotStatus {
  const card = cards.find((c) => c.id === spot.agentId);
  if (card?.status === 'active') return 'active';
  return spot.displayStatus;
}

function isSpotClickable(status: ResolvedSpotStatus, guestMode: boolean): boolean {
  if (guestMode) {
    return status === 'open' || status === 'recommended';
  }
  return status === 'active' || status === 'open' || status === 'recommended';
}

export default function MarketProductSpots({
  marketCards,
  guestMode = false,
  onUseSpot,
}: MarketProductSpotsProps) {
  const visibleSpots = MARKET_PRODUCT_SPOTS.slice(0, MAX_VISIBLE_SPOTS);

  return (
    <section className="space-y-3 mt-1 w-full">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <h2 className="text-[15px] font-semibold text-[#1A1A1A]">{MARKET_PRODUCT_SECTION.title}</h2>
        <span className="hidden sm:inline text-[11px] px-2.5 py-0.5 rounded-full bg-[#F2F0ED] text-black/50">
          {MARKET_PRODUCT_SECTION.subtitle}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full">
        {visibleSpots.map((spot) => {
          const Icon = spot.icon;
          const status = resolveSpotStatus(spot, marketCards);
          const style = STATUS_STYLE[status];
          const clickable = isSpotClickable(status, guestMode);

          return (
            <button
              key={spot.id}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (!clickable) return;
                onUseSpot(spot);
              }}
              className={`w-full min-w-0 h-[60px] text-left rounded-md border px-2.5 sm:px-3 py-2.5 flex items-center gap-2 sm:gap-2.5 transition-all ${
                style.border
              } ${style.bg} ${
                clickable
                  ? 'hover:-translate-y-0.5 hover:shadow-sm hover:border-black/15 cursor-pointer active:translate-y-0 active:shadow-none'
                  : 'opacity-75 cursor-default'
              }`}
            >
              <div className="w-8 h-8 rounded-md bg-[#F2F0ED] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-black/55" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#1A1A1A] truncate block">{spot.title}</span>
                <p className="text-[10px] text-black/45 truncate mt-0.5 hidden sm:block">{spot.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
