import { Link } from 'react-router-dom';
import {
  MARKET_HERO_BANNER,
  MARKET_MEDIUM_BANNERS,
  resolveMarketBannerHref,
  type MarketBannerSlot,
} from '../../../data/agentsMarketHome';

interface MarketHomeBannerProps {
  guestMode?: boolean;
}

function BannerSlot({
  banner,
  className,
  guestMode,
}: {
  banner: MarketBannerSlot;
  className: string;
  guestMode: boolean;
}) {
  const image = (
    <img
      src={banner.imageSrc}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: banner.imagePosition ?? 'center' }}
      loading="lazy"
    />
  );

  if (!banner.href) {
    return <div className={className}>{image}</div>;
  }

  const href = resolveMarketBannerHref(banner.href, guestMode);
  const external = /^https?:\/\//i.test(href);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${className} cursor-pointer`}
        aria-label="广告位"
      >
        {image}
      </a>
    );
  }

  return (
    <Link to={href} className={`${className} cursor-pointer`} aria-label="广告位">
      {image}
    </Link>
  );
}

export default function MarketHomeBanner({ guestMode = false }: MarketHomeBannerProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-2.5 lg:gap-3 w-full auto-rows-[minmax(180px,auto)] lg:auto-rows-[200px]">
      <BannerSlot
        banner={MARKET_HERO_BANNER}
        guestMode={guestMode}
        className="sm:col-span-2 lg:col-span-4 h-[200px] rounded-lg overflow-hidden relative bg-[#141414] block"
      />

      {MARKET_MEDIUM_BANNERS.map((banner) => (
        <BannerSlot
          key={banner.id}
          banner={banner}
          guestMode={guestMode}
          className="sm:col-span-1 lg:col-span-2 h-[200px] rounded-lg overflow-hidden relative bg-[#141414] block"
        />
      ))}
    </section>
  );
}
