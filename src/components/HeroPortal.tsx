import { useMemo } from 'react';
import type { HomeHeroAdConfig } from '../types/homePageConfig';
import type { HomeActionContext } from '../lib/homePageActions';
import { executeHomeButtonAction } from '../lib/homePageActions';
import {
  HERO_AD_SLOT_IDS,
  getHeroAdAspectRatio,
  heroAdHasImage,
  isPrimaryHeroAdSlot,
} from '../lib/homeHeroAds';

type HeroPortalProps = {
  ads?: HomeHeroAdConfig[];
  actionContext: HomeActionContext;
};

function HeroAdTile({
  ad,
  actionContext,
  className = '',
  loading = 'lazy',
}: {
  ad: HomeHeroAdConfig;
  actionContext: HomeActionContext;
  className?: string;
  loading?: 'eager' | 'lazy';
}) {
  const handleClick = () => {
    const primary = ad.primaryButton ?? { label: '', action: 'login' as const };
    executeHomeButtonAction(primary.action, actionContext, {
      agentId: primary.agentId,
      target: primary.target,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative w-full overflow-hidden rounded-xl bg-[#F2F0ED] border border-black/[0.06] shadow-sm transition-transform hover:scale-[1.01] ${className}`}
      style={{ aspectRatio: String(getHeroAdAspectRatio(ad)) }}
      aria-label={ad.name}
    >
      <img
        src={ad.media?.url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading={loading}
      />
    </button>
  );
}

export default function HeroPortal({ ads = [], actionContext }: HeroPortalProps) {
  const slotAds = useMemo(() => {
    const active = ads.filter((ad) => ad.enabled && heroAdHasImage(ad));
    return HERO_AD_SLOT_IDS.map((slotId) => active.find((ad) => ad.id === slotId) ?? null);
  }, [ads]);

  const primaryAd = slotAds[0];
  const secondaryAds = slotAds.slice(1).filter((ad): ad is HomeHeroAdConfig => Boolean(ad));
  const hasAnyAd = Boolean(primaryAd) || secondaryAds.length > 0;

  if (!hasAnyAd) {
    return (
      <div className="w-full" id="hero-portal-view">
        <div className="w-full max-w-3xl mx-auto text-center space-y-4 px-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-black">
            让智能体完成复杂任务
          </h1>
          <p className="text-sm text-black/55">选择场景，输入目标。过程看得见，结果可交付。</p>
          <button
            type="button"
            onClick={() => executeHomeButtonAction('login', actionContext)}
            className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-wide hover:bg-black/85 transition-all"
            id="hero-use-btn"
          >
            立即使用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto" id="hero-portal-view">
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] gap-3 items-stretch">
        {primaryAd ? (
          <HeroAdTile ad={primaryAd} actionContext={actionContext} loading="eager" className="h-full" />
        ) : (
          <div aria-hidden className="rounded-xl bg-transparent" />
        )}
        {secondaryAds.length > 0 ? (
          <div className="flex flex-col gap-3 min-h-0 h-full justify-center">
            {secondaryAds.map((ad) => (
              <HeroAdTile key={ad.id} ad={ad} actionContext={actionContext} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar">
        {[primaryAd, ...secondaryAds].filter((ad): ad is HomeHeroAdConfig => Boolean(ad)).map((ad, index) => (
          <HeroAdTile
            key={ad.id}
            ad={ad}
            actionContext={actionContext}
            loading={index === 0 ? 'eager' : 'lazy'}
            className={`shrink-0 snap-start ${
              isPrimaryHeroAdSlot(ad) ? 'w-[min(88vw,520px)]' : 'w-[min(42vw,200px)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
