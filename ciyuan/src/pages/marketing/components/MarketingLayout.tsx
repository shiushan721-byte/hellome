import type { CSSProperties } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FloatingGroupChat } from './FloatingGroupChat';
import { LangToggle } from './LangToggle';
import { useLocale, useT } from '../i18n/LocaleProvider';
import { useAuth } from '../../../context/AuthContext';

const ABOUT_US_URL = 'https://www.huizhihuyuai.com/';
const siteLogoSrc = '/logo.svg';
const agentNavItems = [
  { id: 'shortDrama', labelZh: '汇影漫剧', labelEn: 'Huiying Manju', href: 'https://shortdrama.agentsyun.com/' },
  { id: 'hermes', labelZh: '汇智爱马仕助手', labelEn: 'Hz-Hermes Assistant', href: 'https://hermes.agentsyun.com/' },
  { id: 'commerce', labelZh: 'AI电商', labelEn: 'AI E-commerce', href: 'https://www.hysai.fit/' },
  { id: 'geo', labelZh: '汇智GEO助手', labelEn: 'Hz-GEO Assistant', href: 'https://geo.agentsyun.com/' },
  // { id: 'opcNanjing', labelZh: 'OPC南京专区', labelEn: 'OPC Nanjing Zone', href: 'https://opc.agentsyun.com/' },
] as const;

type FooterContactIconKey = 'phone' | 'mail' | 'location';

const footerContactItems: Array<{ icon: FooterContactIconKey; text: string }> = [
  { icon: 'phone', text: '400-998-5285' },
  { icon: 'mail', text: 'kongyihui@huizhizhineng.cn' },
  { icon: 'location', text: '南京市雨花台区软件大道178号软件谷产业基地C座3F' },
];

type HomeNavSectionId = 'hero' | 'capabilities' | 'products' | 'agent-matrix';

const navTabLink =
  'nav-tab-link pointer-events-auto inline-flex items-center py-2 text-sm font-normal transition-colors duration-150 ease-in';

function headerHeightPx(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height').trim();
  const remMatch = raw.match(/^([\d.]+)rem$/i);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = raw.match(/^([\d.]+)px$/i);
  if (pxMatch) return parseFloat(pxMatch[1]);
  return 92;
}

function isMarketingHomePath(pathname: string): boolean {
  return (
    pathname === '/marketing' ||
    pathname === '/marketing/' ||
    pathname.endsWith('/marketing') ||
    pathname.endsWith('/marketing/')
  );
}

function useNavPastHero() {
  const { pathname } = useLocation();
  const [solid, setSolid] = useState(false);

  const update = useCallback(() => {
    const hero = document.getElementById('hero');
    if (!hero) {
      setSolid(false);
      return;
    }
    const { bottom } = hero.getBoundingClientRect();
    setSolid(bottom <= headerHeightPx() + 4);
  }, []);

  useEffect(() => {
    update();
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const id = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname, update]);

  return solid;
}

function FooterContactIcon({ icon }: { icon: FooterContactIconKey }) {
  const svgBase = {
    viewBox: '0 0 16 16',
    'aria-hidden': true as const,
    className: 'h-3 w-3 shrink-0',
  };

  switch (icon) {
    case 'phone':
      return (
        <svg {...svgBase}>
          <path
            d="M5.15 2.35 6.28 4.9c.18.4.08.86-.25 1.15l-.72.64a7.7 7.7 0 0 0 3.98 3.98l.64-.72c.29-.33.75-.43 1.15-.25l2.55 1.13c.45.2.69.69.57 1.17l-.34 1.34c-.12.47-.54.8-1.03.8A10.92 10.92 0 0 1 1.86 3.17c0-.49.33-.91.8-1.03L4 1.8c.48-.12.97.12 1.17.55Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg {...svgBase}>
          <path
            d="M2.4 4.25h11.2v7.5H2.4z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
          <path
            d="m2.75 4.7 5.25 4 5.25-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      );
    case 'location':
      return (
        <svg {...svgBase}>
          <path
            d="M12.2 6.7c0 3.15-4.2 7-4.2 7s-4.2-3.85-4.2-7a4.2 4.2 0 0 1 8.4 0Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
          <circle cx="8" cy="6.7" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      );
    default: {
      const _exhaustive: never = icon;
      return _exhaustive;
    }
  }
}

function NavLogoMark({ solidNav }: { solidNav: boolean }) {
  if (solidNav) {
    return (
      <span
        role="img"
        aria-label="Token Factory"
        className="inline-block h-[26px] w-[26px] shrink-0 bg-[var(--color-primary)]"
        style={{
          maskImage: `url("${siteLogoSrc}")`,
          WebkitMaskImage: `url("${siteLogoSrc}")`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }
  return (
    <img
      src={siteLogoSrc}
      alt="Agent云 Token 工场"
      className="h-[26px] w-[26px] shrink-0 object-contain brightness-0 invert"
    />
  );
}

function useHomeNavActiveSection(): HomeNavSectionId {
  const { pathname } = useLocation();
  const [active, setActive] = useState<HomeNavSectionId>('hero');

  const update = useCallback(() => {
    if (!isMarketingHomePath(pathname)) return;
    const header = headerHeightPx();
    const scrollLine = window.scrollY + header + 2;
    const order: HomeNavSectionId[] = ['hero', 'capabilities', 'products', 'agent-matrix'];
    let next: HomeNavSectionId = 'hero';
    for (const id of order) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (scrollLine >= top) next = id;
    }
    setActive((prev) => (prev === next ? prev : next));
  }, [pathname]);

  useEffect(() => {
    if (!isMarketingHomePath(pathname)) return;
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('hashchange', update);
    };
  }, [pathname, update]);

  return isMarketingHomePath(pathname) ? active : 'hero';
}

function navTabClassName(solidNav: boolean, current: boolean) {
  return [
    navTabLink,
    current ? 'nav-tab-link--current' : '',
    current
      ? solidNav
        ? '!text-[var(--color-text-primary)] !font-medium'
        : '!text-white !font-medium'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function scrollToHomeDefaultPosition() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  const { pathname, search, hash } = window.location;
  if (hash) {
    window.history.replaceState(null, '', `${pathname}${search}`);
  }
}

/** 顶栏锚点：平滑滚动到对应区块并补偿固定顶栏高度（原生锚点跳转既不平滑又会被顶栏遮住） */
function scrollToHomeSection(id: HomeNavSectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerHeightPx());
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}#${id}`);
}

function NavMenuArrowIcon({ direction }: { direction: 'down' | 'external' }) {
  if (direction === 'external') {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M5 4h7v7M12 4 4 12"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4.5 4.5h7M5.75 7.5h4.5M7 10.5h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      ) : (
        <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function MarketingLayout() {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const { isLogin } = useAuth();
  const location = useLocation();
  const solidNav = useNavPastHero();
  const activeSection = useHomeNavActiveSection();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navWrapRef = useRef<HTMLDivElement>(null);
  const agentTriggerRef = useRef<HTMLDivElement>(null);
  const navPopoverRef = useRef<HTMLDivElement>(null);
  const navCloseTimerRef = useRef<number | null>(null);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [navPopoverX, setNavPopoverX] = useState(0);
  const brandName = locale === 'zh' ? '词元(Token)工场' : 'TOKEN FACTORY';

  const sectionNavItems: {
    label: string;
    href: string;
    id: HomeNavSectionId;
    hasDropdown?: boolean;
  }[] = [
    { label: t('nav.capabilities'), href: '#capabilities', id: 'capabilities' },
    { label: t('nav.products'), href: '#products', id: 'products' },
    { label: t('nav.agentMatrix'), href: '#agent-matrix', id: 'agent-matrix', hasDropdown: true },
  ];

  const agentNavLinks = agentNavItems.map((item) => ({
    id: item.id,
    label: locale === 'zh' ? item.labelZh : item.labelEn,
    href: item.href,
    external: true,
  }));

  const setNavPopoverHovering = useCallback((hovering: boolean) => {
    document.documentElement.classList.toggle('product-nav-popover-hovering', hovering);
  }, []);

  const updateNavPopoverPosition = useCallback(() => {
    const wrap = navWrapRef.current;
    const trigger = agentTriggerRef.current;
    if (!wrap || !trigger) return;
    const wrapRect = wrap.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    setNavPopoverX(triggerRect.left + triggerRect.width / 2 - wrapRect.left);
  }, []);

  const clearNavCloseTimer = useCallback(() => {
    if (navCloseTimerRef.current == null) return;
    window.clearTimeout(navCloseTimerRef.current);
    navCloseTimerRef.current = null;
  }, []);

  const openAgentDropdown = useCallback(() => {
    clearNavCloseTimer();
    updateNavPopoverPosition();
    setAgentDropdownOpen(true);
  }, [clearNavCloseTimer, updateNavPopoverPosition]);

  const closeNavDropdown = useCallback(() => {
    clearNavCloseTimer();
    setAgentDropdownOpen(false);
    setNavPopoverHovering(false);
  }, [clearNavCloseTimer, setNavPopoverHovering]);

  const scheduleNavDropdownClose = useCallback(() => {
    clearNavCloseTimer();
    navCloseTimerRef.current = window.setTimeout(() => {
      setAgentDropdownOpen(false);
      setNavPopoverHovering(false);
      navCloseTimerRef.current = null;
    }, 90);
  }, [clearNavCloseTimer, setNavPopoverHovering]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!agentDropdownOpen) return;
    updateNavPopoverPosition();
    const onLayout = () => {
      if (agentDropdownOpen) updateNavPopoverPosition();
    };
    window.addEventListener('resize', onLayout);
    window.addEventListener('scroll', onLayout, { passive: true });
    return () => {
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout);
    };
  }, [agentDropdownOpen, updateNavPopoverPosition]);

  useEffect(() => {
    const popover = navPopoverRef.current;
    if (!popover) return;
    const preventPageScroll = (event: WheelEvent) => {
      event.preventDefault();
    };
    popover.addEventListener('wheel', preventPageScroll, { passive: false });
    return () => {
      popover.removeEventListener('wheel', preventPageScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearNavCloseTimer();
      setNavPopoverHovering(false);
    };
  }, [clearNavCloseTimer, setNavPopoverHovering]);

  const navPopoverPositionStyle = {
    '--product-popover-x': `${navPopoverX}px`,
  } as CSSProperties;

  /** 深色顶栏下导航下拉：毛玻璃（与 Token工场官网 DevTools 一致） */
  const navPopoverGlassStyle: CSSProperties = {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    willChange: 'backdrop-filter, opacity, transform',
    transition:
      'opacity 0.18s ease-out, transform 0.18s ease-out, background-color 0.3s ease-out, border-color 0.3s ease-out, box-shadow 0.3s ease-out',
  };

  const ctaTo = isLogin ? '/hub/keys' : '/login';
  const ctaLabel = isLogin ? t('nav.workspace') : t('nav.login');

  return (
    <div className="marketing-page min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="fixed left-0 right-0 top-0 z-50 w-full bg-transparent">
        {/** 无全宽底条：仅胶囊浮在内容上；首页 hero 负边距上拉使星空顶到视口 */}
        <div
          ref={navWrapRef}
          className="relative mx-auto w-full max-w-[1316px] px-4 pt-6 pb-3 sm:px-6 lg:px-8"
          onBlur={(event) => {
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              closeNavDropdown();
            }
          }}
        >
          <div
            className={`floating-nav-shell grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border pl-4 pr-[10px] sm:gap-5 sm:pl-5 sm:pr-[10px] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out ${
              solidNav
                ? 'floating-nav-shell--solid border-[rgba(17,24,39,0.08)] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]'
                : 'border-white/[0.08] bg-white/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl backdrop-saturate-150'
            }`}
          >
            <div className="flex min-w-0 items-center justify-self-start">
              <NavLink to="/marketing" className="flex shrink-0 items-center gap-2.5">
                <NavLogoMark solidNav={solidNav} />
                <span
                  className={`text-sm font-black [font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif] sm:text-[15px] ${
                    solidNav ? 'text-[var(--color-text-primary)]' : 'text-white'
                  }`}
                >
                  {brandName}
                </span>
              </NavLink>
            </div>

            <div className="flex min-w-0 items-center justify-center justify-self-center">
              <nav className="hidden min-w-0 items-center justify-center gap-4 md:flex lg:gap-5">
                <NavLink
                  to="/marketing"
                  end
                  className={() => navTabClassName(solidNav, activeSection === 'hero')}
                  onClick={scrollToHomeDefaultPosition}
                >
                  {t('nav.home')}
                </NavLink>
                {sectionNavItems.map((item) =>
                  item.hasDropdown ? (
                    <div
                      ref={agentTriggerRef}
                      key={item.href}
                      className="product-nav-trigger relative"
                      onMouseEnter={openAgentDropdown}
                      onMouseLeave={scheduleNavDropdownClose}
                      onFocus={openAgentDropdown}
                    >
                      <a
                        href={item.href}
                        className={navTabClassName(solidNav, activeSection === item.id)}
                        aria-haspopup="true"
                        onClick={(event) => {
                          event.preventDefault();
                          scrollToHomeSection(item.id);
                        }}
                      >
                        {item.label}
                      </a>
                    </div>
                  ) : (
                    <a
                      key={item.href}
                      href={item.href}
                      className={navTabClassName(solidNav, activeSection === item.id)}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToHomeSection(item.id);
                      }}
                    >
                      {item.label}
                    </a>
                  ),
                )}
                <a href={ABOUT_US_URL} target="_blank" rel="noreferrer" className={navTabLink}>
                  {t('nav.about')}
                </a>
              </nav>
            </div>

            <div className="flex shrink-0 items-center justify-self-end gap-1 sm:gap-4">
              <LangToggle
                locale={locale}
                setLocale={setLocale}
                label={t('lang.menuAria')}
                variant={solidNav ? 'onLight' : 'onDark'}
              />
              <NavLink
                to={ctaTo}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-[background-color,transform,border-color] duration-150 ease-out active:scale-[0.98] sm:px-5 ${
                  solidNav
                    ? 'border border-[rgba(17,24,39,0.1)] bg-white text-neutral-900 hover:bg-neutral-50'
                    : 'border border-transparent bg-white text-neutral-900 hover:bg-white/95'
                }`}
              >
                {ctaLabel}
              </NavLink>
              <button
                type="button"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors md:hidden ${
                  solidNav
                    ? 'text-neutral-700 hover:bg-neutral-100'
                    : 'text-white/85 hover:bg-white/10'
                }`}
                aria-expanded={mobileNavOpen}
                aria-controls="site-mobile-nav"
                aria-label={mobileNavOpen ? t('nav.closeMenuAria') : t('nav.openMenuAria')}
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                <HamburgerIcon open={mobileNavOpen} />
              </button>
            </div>
          </div>

          <div
            ref={navPopoverRef}
            className={`product-nav-popover ${agentDropdownOpen ? 'product-nav-popover--open' : ''} ${
              solidNav ? 'product-nav-popover--solid' : ''
            }`}
            style={{
              ...navPopoverPositionStyle,
              ...(solidNav ? undefined : navPopoverGlassStyle),
            }}
            onMouseEnter={() => {
              clearNavCloseTimer();
              setNavPopoverHovering(true);
            }}
            onMouseLeave={closeNavDropdown}
            onWheel={(event) => event.preventDefault()}
          >
            <div className="product-nav-popover__content grid gap-1.5 p-2">
              {agentNavLinks.map((entry) => (
                <a
                  key={entry.id}
                  href={entry.href}
                  target={entry.external ? '_blank' : undefined}
                  rel={entry.external ? 'noreferrer' : undefined}
                  className={`product-nav-popover__item ${
                    entry.external ? 'product-nav-popover__item--external' : ''
                  }`}
                  onClick={closeNavDropdown}
                >
                  <span className="product-nav-popover__title">{entry.label}</span>
                  {entry.external ? (
                    <span className="product-nav-popover__icon">
                      <NavMenuArrowIcon direction="external" />
                    </span>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[48] bg-black/45 backdrop-blur-[2px] md:hidden"
              aria-label={t('nav.closeMenuAria')}
              onClick={() => setMobileNavOpen(false)}
            />
            <div
              id="site-mobile-nav"
              className="fixed left-4 right-4 top-[calc(var(--header-height)+0.5rem)] z-[49] max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white py-2 shadow-[0_20px_50px_rgba(15,23,42,0.14)] md:hidden divide-y divide-[var(--color-border)]"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.menuDialogAria')}
            >
              <NavLink
                to="/marketing"
                end
                className="block px-5 py-3.5 text-center text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                onClick={() => {
                  scrollToHomeDefaultPosition();
                  setMobileNavOpen(false);
                }}
              >
                {t('nav.home')}
              </NavLink>
              {sectionNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block px-5 py-3.5 text-center text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                  onClick={(event) => {
                    event.preventDefault();
                    setMobileNavOpen(false);
                    // 等菜单关闭、body 解除 overflow:hidden 后再滚动，否则会被锁定裁掉
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToHomeSection(item.id)));
                  }}
                >
                  {item.label}
                </a>
              ))}
              <a
                href={ABOUT_US_URL}
                target="_blank"
                rel="noreferrer"
                className="block px-5 py-3.5 text-center text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('nav.about')}
              </a>
            </div>
          </>
        ) : null}
      </header>

      <main className="pt-[var(--header-height)]">
        <Outlet />
      </main>

      <FloatingGroupChat />

      <footer className="marketing-footer border-t border-[rgba(17,24,39,0.06)] bg-[var(--color-bg)]">
        <div className="mx-auto flex w-full max-w-[1316px] flex-col px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <div className="flex items-center gap-2.5">
              <img src={siteLogoSrc} alt="Agent云 Token 工场" className="h-[26px] w-[26px] shrink-0 object-contain" />
              <span className="text-[15px] font-black tracking-normal text-[var(--color-text-primary)]">
                {brandName}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4 border-t border-[var(--color-border)] pt-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-3 text-xs leading-4 text-[var(--color-text-secondary)]">
              {footerContactItems.map((item) => (
                <div key={item.icon} className="flex min-w-0 items-start gap-1">
                  <span className="flex h-4 w-4 shrink-0 items-start justify-center py-0.5 text-[var(--color-text-secondary)]">
                    <FooterContactIcon icon={item.icon} />
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-4 text-[var(--color-text-secondary)] lg:justify-end">
              <span>{t('footer.copyright')}</span>
              <span className="h-3 w-px shrink-0 bg-[var(--color-text-secondary)]/30" aria-hidden />
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-text-secondary)] no-underline transition-colors hover:text-[var(--color-text-primary)] hover:underline"
              >
                {t('footer.icp')}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
