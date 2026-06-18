import { getAgentById } from '../../../data/agentsCatalog';
import {
  MARKET_HERO_BANNER,
  MARKET_MEDIUM_BANNERS,
  type MarketMediumBannerConfig,
} from '../../../data/agentsMarketHome';
import type { AgentMarketCard } from '../../../types/agentsPage';

interface MarketHomeBannerProps {
  marketCards: AgentMarketCard[];
  lowBalance?: boolean;
  guestMode?: boolean;
  onHeroAction: () => void;
  onMediumAction: (banner: MarketMediumBannerConfig) => void;
}

function heroCtaLabel(lowBalance: boolean, guestMode: boolean): string {
  if (guestMode) return '使用智能体';
  if (lowBalance) return '充值算力';
  return '使用智能体';
}

function mediumCtaLabel(
  banner: MarketMediumBannerConfig,
  lowBalance: boolean,
  guestMode: boolean,
): string {
  if (banner.displayStatus === 'coming_soon') return '即将开放';
  if (banner.displayStatus === 'beta') return '申请内测';
  if (guestMode) return '使用智能体';
  if (lowBalance) return '充值算力';
  return '使用智能体';
}

function isMediumDisabled(banner: MarketMediumBannerConfig): boolean {
  return banner.displayStatus === 'coming_soon' || banner.displayStatus === 'beta';
}

export default function MarketHomeBanner({
  marketCards,
  lowBalance = false,
  guestMode = false,
  onHeroAction,
  onMediumAction,
}: MarketHomeBannerProps) {
  const heroAgent = getAgentById(MARKET_HERO_BANNER.agentId);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-2.5 lg:gap-3 w-full auto-rows-[minmax(180px,auto)] lg:auto-rows-[200px]">
      <article
        className="sm:col-span-2 lg:col-span-4 h-[200px] rounded-lg overflow-hidden relative bg-[#141414] group cursor-pointer"
        onClick={onHeroAction}
        onKeyDown={(e) => e.key === 'Enter' && onHeroAction()}
        role="button"
        tabIndex={0}
      >
        {heroAgent && (
          <img
            src={heroAgent.iconSrc}
            alt=""
            className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 lg:w-40 lg:h-40 object-contain opacity-35 translate-x-2"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
        <div className="relative z-10 h-full flex flex-col justify-between px-4 pt-3 pb-4 lg:px-5 lg:pt-3.5 lg:pb-5 text-white">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
              {MARKET_HERO_BANNER.eyebrow}
            </p>
            <h2 className="text-lg lg:text-xl font-bold leading-tight">{MARKET_HERO_BANNER.title}</h2>
            <p className="text-xs text-white/75 line-clamp-2">{MARKET_HERO_BANNER.subtitle}</p>
            <p className="hidden sm:block text-[11px] text-white/50">{MARKET_HERO_BANNER.tags[0]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-white/45">{MARKET_HERO_BANNER.tokenHint}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHeroAction();
              }}
              className="px-3 py-1.5 text-[11px] font-bold bg-white text-black hover:bg-white/90 rounded-md"
            >
              {heroCtaLabel(lowBalance, guestMode)}
            </button>
          </div>
        </div>
      </article>

      {MARKET_MEDIUM_BANNERS.map((banner) => {
        const agent = getAgentById(banner.agentId);
        const disabled = isMediumDisabled(banner);

        return (
          <article
            key={banner.id}
            className={`sm:col-span-1 lg:col-span-2 h-[200px] rounded-lg overflow-hidden relative bg-gradient-to-br ${banner.gradient} ${
              disabled ? 'opacity-90' : 'group cursor-pointer'
            }`}
            onClick={() => !disabled && onMediumAction(banner)}
            onKeyDown={(e) => e.key === 'Enter' && !disabled && onMediumAction(banner)}
            role={disabled ? undefined : 'button'}
            tabIndex={disabled ? undefined : 0}
          >
            {agent && (
              <img
                src={agent.iconSrc}
                alt=""
                className="absolute right-2 bottom-2 w-14 h-14 object-contain opacity-30"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 h-full flex flex-col justify-between p-3.5 lg:p-4 text-white">
              <div className="space-y-1 min-w-0 pr-10">
                <h3 className="text-sm font-bold leading-snug">{banner.title}</h3>
                <p className="text-[11px] text-white/70 line-clamp-2 hidden sm:block">{banner.subtitle}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) onMediumAction(banner);
                }}
                className={`self-start px-2.5 py-1 text-[10px] font-bold rounded-md ${
                  disabled
                    ? 'bg-white/15 text-white/55 cursor-not-allowed'
                    : 'bg-white/90 text-black hover:bg-white'
                }`}
              >
                {mediumCtaLabel(banner, lowBalance, guestMode)}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
