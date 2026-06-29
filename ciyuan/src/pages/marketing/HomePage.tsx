import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import Galaxy from './components/Galaxy';
import { HeroBuildTitle } from './components/HeroBuildTitle';
// import CompareSection from './components/CompareSection';
// import FaqSection from './components/FaqSection';
// import PerformanceSection from './components/PerformanceSection';
// import { HermesAnnouncementModal } from './components/HermesAnnouncementModal';
import { RevealItem, SURFACE_LAYOUT_UNLOCK_EVENT } from './components/RevealItem.tsx';
import { useLocale, useT } from './i18n/LocaleProvider';

/** 同排卡片 RevealItem 阶梯间隔（ms），略大则从左到右联动更疏、更有层次 */
const REVEAL_STAGGER_STEP_MS = 100;
/** 收尾区主按钮相对标题块再晚一点入场 */
const REVEAL_CTA_AFTER_TITLE_MS = 160;

// /** Hermes 弹窗：关闭后至少经过该间隔，下次进入首页（含刷新）才再自动弹出 */
// const HERMES_MODAL_COOLDOWN_MS = 10 * 60 * 1000;
// const HERMES_MODAL_LAST_DISMISSED_KEY = 'token-factory-hermes-dismissed-at';
const PRODUCT_SHORT_DRAMA_URL = 'https://shortdrama.agentsyun.com/';
const AGENT_HERMES_URL = 'https://hermes.agentsyun.com/';

const SITE_URL = typeof VITE_SITE_URL !== 'undefined' ? VITE_SITE_URL : '';
const FEATURED_MODEL_PIC_BASE = '/marketing-assets/models-media';
const CONTACT_WECHAT_QR_SRC = '/contact-wechat-qr1.png';

function subscribeMinWidthLg(onChange: () => void) {
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function useMinWidthLg(): boolean {
  return useSyncExternalStore(
    subscribeMinWidthLg,
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true,
  );
}

// function readHermesShouldOpenOnLoad(): boolean {
//   if (typeof window === 'undefined') return true;
//   try {
//     const raw = window.localStorage.getItem(HERMES_MODAL_LAST_DISMISSED_KEY);
//     if (raw == null || raw === '') return true;
//     const ts = Number.parseInt(raw, 10);
//     if (!Number.isFinite(ts)) return true;
//     return Date.now() - ts >= HERMES_MODAL_COOLDOWN_MS;
//   } catch {
//     return true;
//   }
// }

function HeroGalaxyBackdrop({ pointerAnchorRef }: { pointerAnchorRef?: RefObject<HTMLElement | null> }) {
  return (
    <div className="absolute inset-0 z-0 h-full min-h-full bg-[#000000]">
      {/** 纯黑底；`pointerRoot` 解决首屏叠层挡掉 ctn 的 mousemove */}
      <Galaxy
        className="h-full min-h-full w-full"
        pointerRoot="window"
        density={1.5}
        rayScale={0.42}
        raySharp={2800}
        starPointScale={1.5}
        pointerLerp={0.2}
        pointerAnchorRef={pointerAnchorRef}
        pointerIdleReturnMs={2000}
      />
    </div>
  );
}

function ClosingGalaxyBackdrop() {
  return (
    <div className="absolute inset-0 z-0 h-full min-h-full w-full bg-[#000000]">
      <Galaxy
        className="h-full min-h-full w-full"
        pointerRoot="window"
        density={1.5}
        rayScale={0.42}
        raySharp={2800}
        starPointScale={1.5}
        pointerLerp={0.2}
        pointerIdleReturnMs={2000}
      />
    </div>
  );
}

const featuredModelImageMap: Record<string, string> = {
  'Qwen3.6-Plus': `${FEATURED_MODEL_PIC_BASE}/Qwen.png`,
  'DeepSeek-V4.0': `${FEATURED_MODEL_PIC_BASE}/DeepSeek.png`,
  'Kimi K2.5': `${FEATURED_MODEL_PIC_BASE}/KIMI.png`,
  'GLM-5.1': `${FEATURED_MODEL_PIC_BASE}/GLM.png`,
  'MiniMax-M2.7': `${FEATURED_MODEL_PIC_BASE}/MiniMax.png`,
  'Doubao-Seed-2.0-pro': `${FEATURED_MODEL_PIC_BASE}/Seed-pro.png`,
  'Doubao-Seed-2.0-lite': `${FEATURED_MODEL_PIC_BASE}/Seed-Lite.png`,
  'Doubao-Seed-2.0-mini': `${FEATURED_MODEL_PIC_BASE}/Seed-Mini.png`,
};

const featuredModelAltMap: Record<string, string> = {
  'Qwen3.6-Plus': 'Qwen3.6-Plus 通义千问大语言模型',
  'DeepSeek-V4.0': 'DeepSeek-V4.0 编程与数学推理模型',
  'Kimi K2.5': 'Kimi K2.5 月之暗面长文本大语言模型',
  'GLM-5.1': 'GLM-5.1 智谱 AI 大语言模型',
  'MiniMax-M2.7': 'MiniMax-M2.7 多模态大语言模型',
  'Doubao-Seed-2.0-pro': 'Doubao-Seed-2.0-pro 豆包 Seed 旗舰模型',
  'Doubao-Seed-2.0-lite': 'Doubao-Seed-2.0-lite 豆包 Seed 轻量模型',
  'Doubao-Seed-2.0-mini': 'Doubao-Seed-2.0-mini 豆包 Seed 迷你模型',
};

type CapabilityIconKey = 'code' | 'chat' | 'agent' | 'search' | 'multimodal' | 'rag';
type Translate = (path: string) => string;

function buildCapabilityCards(t: Translate): Array<{ title: string; description: string; icon: CapabilityIconKey }> {
  return [
    { title: t('capabilities.code.title'), description: t('capabilities.code.desc'), icon: 'code' },
    { title: t('capabilities.chat.title'), description: t('capabilities.chat.desc'), icon: 'chat' },
    { title: t('capabilities.agent.title'), description: t('capabilities.agent.desc'), icon: 'agent' },
    { title: t('capabilities.search.title'), description: t('capabilities.search.desc'), icon: 'search' },
    { title: t('capabilities.multimodal.title'), description: t('capabilities.multimodal.desc'), icon: 'multimodal' },
    { title: t('capabilities.rag.title'), description: t('capabilities.rag.desc'), icon: 'rag' },
  ];
}

type ProductTheme = 'api' | 'tune' | 'speed' | 'deploy' | 'shortDrama' | 'dramaAgent' | 'hermesAgent';

type ProductCardData = {
  id: string;
  title: string;
  collapsedTitle: string;
  description: string;
  action: string;
  actionHref?: string;
  theme: ProductTheme;
  /** 展开态（当前宽卡）主图 */
  image: string;
  /** 未展开窄卡：默认复用主图，通过 CSS 灰阶处理 */
  imageCollapsed: string;
  mediaType?: 'image' | 'video' | 'solid';
  mediaPlayback?: 'active' | 'hover';
};

function buildProductCards(t: Translate): ProductCardData[] {
  return [
    {
      id: 'api',
      title: t('products.api.title'),
      collapsedTitle: t('products.api.collapsed'),
      description: t('products.api.desc'),
      action: t('products.api.action'),
      actionHref: `${SITE_URL}/hub/models`,
      theme: 'api',
      image: '/marketing-assets/product/1.jpg',
      imageCollapsed: '/marketing-assets/product/1.jpg',
    },
    {
      id: 'tune',
      title: t('products.tune.title'),
      collapsedTitle: t('products.tune.collapsed'),
      description: t('products.tune.desc'),
      action: t('products.tune.action'),
      theme: 'tune',
      image: '/marketing-assets/product/2.jpg',
      imageCollapsed: '/marketing-assets/product/2.jpg',
    },
    {
      id: 'speed',
      title: t('products.speed.title'),
      collapsedTitle: t('products.speed.collapsed'),
      description: t('products.speed.desc'),
      action: t('products.speed.action'),
      theme: 'speed',
      image: '/marketing-assets/product/3.jpg',
      imageCollapsed: '/marketing-assets/product/3.jpg',
    },
    {
      id: 'deploy',
      title: t('products.deploy.title'),
      collapsedTitle: t('products.deploy.collapsed'),
      description: t('products.deploy.desc'),
      action: t('products.deploy.action'),
      theme: 'deploy',
      image: '/marketing-assets/product/4.jpg',
      imageCollapsed: '/marketing-assets/product/4.jpg',
    },
    {
      id: 'shortDrama',
      title: t('products.shortDrama.title'),
      collapsedTitle: t('products.shortDrama.collapsed'),
      description: t('products.shortDrama.desc'),
      action: t('products.shortDrama.action'),
      theme: 'shortDrama',
      image: '/marketing-assets/product/5.jpg',
      imageCollapsed: '/marketing-assets/product/5.jpg',
    },
  ];
}

function buildAgentCards(t: Translate): ProductCardData[] {
  return [
    {
      id: 'dramaAgent',
      title: t('agentMatrix.drama.title'),
      collapsedTitle: t('agentMatrix.drama.title'),
      description: t('agentMatrix.drama.desc'),
      action: t('agentMatrix.drama.action'),
      actionHref: PRODUCT_SHORT_DRAMA_URL,
      theme: 'dramaAgent',
      image: '/marketing-assets/product/5.webm',
      imageCollapsed: '/marketing-assets/product/5.webm',
      mediaType: 'video',
      mediaPlayback: 'hover',
    },
    {
      id: 'hermesAgent',
      title: t('agentMatrix.hermes.title'),
      collapsedTitle: t('agentMatrix.hermes.title'),
      description: t('agentMatrix.hermes.desc'),
      action: t('agentMatrix.hermes.action'),
      actionHref: AGENT_HERMES_URL,
      theme: 'hermesAgent',
      image: '/marketing-assets/hermes-bg.jpg',
      imageCollapsed: '/marketing-assets/hermes-bg.jpg',
    },
  ];
}

type HeroMetricDef = {
  id: string;
  label: string;
  target: number;
  format: (n: number) => string;
};

function buildHeroMetrics(t: Translate, locale: string): HeroMetricDef[] {
  const zh = locale === 'zh';
  return [
    {
      id: 'tokens',
      target: 3,
      label: t('home.metrics.tokens'),
      format: (n) => `${Math.round(n)}T Tokens`,
    },
    {
      id: 'users',
      target: 1,
      label: t('home.metrics.users'),
      format: (n) => (zh ? `${Math.round(n)}W+ 用户` : `${Math.round(n * 10)}K+ Users`),
    },
    {
      id: 'models',
      target: 100,
      label: t('home.metrics.models'),
      format: (n) => (zh ? `${Math.round(n)}+ 模型` : `${Math.round(n)}+ Models`),
    },
  ];
}

/** 单列滚动时长；`STAGGER` 做轻微左→右错峰 */
const HERO_METRIC_COUNT_MS = 880;
const HERO_METRIC_STAGGER_MS = [0, 100, 200] as const;

function easeOutQuart(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 4;
}

function HeroMetrics({
  metrics,
  heroEnterClass,
  hermesModalOpen,
}: {
  metrics: HeroMetricDef[];
  heroEnterClass: string;
  hermesModalOpen: boolean;
}) {
  const { locale } = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState<number[]>(() => metrics.map(() => 0));
  const rafRef = useRef(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setInView(true);
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    if (hermesModalOpen) {
      setDisplay(metrics.map((m) => m.target));
      return;
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(metrics.map((m) => m.target));
      return;
    }

    setDisplay(metrics.map(() => 0));
    const start = performance.now();
    const stagger = HERO_METRIC_STAGGER_MS;
    const duration = HERO_METRIC_COUNT_MS;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const now = performance.now();
      const next = metrics.map((m, i) => {
        const delay = stagger[Math.min(i, stagger.length - 1)]!;
        const raw = (now - start - delay) / duration;
        const u = raw <= 0 ? 0 : Math.min(1, raw);
        return m.target * easeOutQuart(u);
      });
      setDisplay(next);
      const done = next.every((v, i) => Math.abs(v - metrics[i]!.target) < 0.01);
      if (!done) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [inView, hermesModalOpen, metrics]);

  /** 等分 grid 会把三列拉满全宽，改间距几乎无感；改为按内容宽度聚中。中英文行宽差大，不设死列宽，副标题允许换行。 */
  const rowGap =
    locale === 'en'
      ? 'sm:gap-x-8 sm:gap-y-4 md:gap-x-10 md:gap-y-3'
      : 'sm:gap-x-9 sm:gap-y-4 md:gap-x-11 md:gap-y-3';

  return (
    <div
      ref={wrapRef}
      className={`${heroEnterClass} mt-10 flex w-full flex-col items-stretch gap-10 border-t border-white/10 pt-16 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center ${rowGap}`}
    >
      {metrics.map((metric, index) => (
        <div
          key={metric.id}
          className={`flex min-w-0 w-full flex-col items-center self-center px-4 py-2.5 text-center sm:w-auto sm:max-w-none sm:flex-none sm:self-start ${
            locale === 'zh' ? 'sm:px-6 md:px-9' : 'sm:px-5 md:px-7'
          }`}
        >
          <div className="w-full max-w-full text-center">
            <div className="text-stat font-semibold tracking-[-0.04em] text-white tabular-nums [overflow-wrap:anywhere]">
              {metric.format(display[index] ?? 0)}
            </div>
          </div>
          <p className="mt-2.5 w-full max-w-full text-balance text-2xs leading-snug text-white/65 sm:text-sm sm:leading-6 [overflow-wrap:anywhere]">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}

type FeaturedMsgKey = 'qwen' | 'deepseek' | 'kimi' | 'glm' | 'minimax' | 'doubaoPro' | 'doubaoLite' | 'doubaoMini';

const featuredModelStatic: Array<{
  name: string;
  provider: string;
  category: string;
  inputPrice: string;
  outputPrice: string;
  context: string;
  msgKey: FeaturedMsgKey;
}> = [
  { name: 'Qwen3.6-Plus', provider: 'Qwen', category: 'text-generation', inputPrice: '¥2.0', outputPrice: '¥12.0', context: '128k', msgKey: 'qwen' },
  { name: 'DeepSeek-V4.0', provider: 'DeepSeek', category: 'text-generation', inputPrice: '¥2.0', outputPrice: '¥3.0', context: '128k', msgKey: 'deepseek' },
  { name: 'Kimi K2.5', provider: 'Moonshot', category: 'text-generation', inputPrice: '¥4.0', outputPrice: '¥21.0', context: '256k', msgKey: 'kimi' },
  { name: 'GLM-5.1', provider: 'GLM', category: 'text-generation', inputPrice: '¥6.0', outputPrice: '¥24.0', context: '128k', msgKey: 'glm' },
  { name: 'MiniMax-M2.7', provider: 'MiniMax', category: 'text-generation', inputPrice: '¥2.1', outputPrice: '¥8.4', context: '256k', msgKey: 'minimax' },
  { name: 'Doubao-Seed-2.0-pro', provider: 'Doubao', category: 'text-generation', inputPrice: '¥3.2', outputPrice: '¥16.0', context: '256k', msgKey: 'doubaoPro' },
  { name: 'Doubao-Seed-2.0-lite', provider: 'Doubao', category: 'text-generation', inputPrice: '¥0.6', outputPrice: '¥3.6', context: '128k', msgKey: 'doubaoLite' },
  { name: 'Doubao-Seed-2.0-mini', provider: 'Doubao', category: 'text-generation', inputPrice: '¥0.2', outputPrice: '¥2.0', context: '256k', msgKey: 'doubaoMini' },
];

function buildFeaturedModels(t: Translate) {
  return featuredModelStatic.map((row) => ({
    ...row,
    badge: t(`featured.${row.msgKey}.badge`),
    description: t(`featured.${row.msgKey}.desc`),
  }));
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 text-center">
      <h2 className="text-section font-semibold tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-4xl sm:leading-[1.25]">
        {title}
      </h2>
      <p className="text-base leading-[1.4] text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function CapabilityCardIcon({ icon }: { icon: CapabilityIconKey }) {
  const svgBase = {
    viewBox: '0 0 24 24',
    'aria-hidden': true as const,
    className: 'h-8 w-8 shrink-0 text-[var(--color-primary)]',
  };

  switch (icon) {
    case 'code':
      return (
        <svg {...svgBase}>
          <path pathLength={1} d="M9.5 16L5 12l4.5-4" className="capability-icon-stroke" />
          <path pathLength={1} d="M14.5 8L19 12l-4.5 4" className="capability-icon-stroke capability-icon-stroke--delay-1" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...svgBase}>
          <path
            pathLength={1}
            d="M6.25 10.25c0-1.65 1.35-3 3-3h5.5c1.65 0 3 1.35 3 3v3.75c0 1.65-1.35 3-3 3h-2.65l-3.6 2.4V16h-.75c-1.65 0-3-1.35-3-3v-2.75z"
            className="capability-icon-stroke"
          />
        </svg>
      );
    case 'agent':
      return (
        <svg {...svgBase}>
          <circle cx="12" cy="9.5" r="2.25" pathLength={1} className="capability-icon-stroke" />
          <path
            pathLength={1}
            d="M12 11.85L7.15 17.1M12 11.85L16.85 17.1M12 11.85V5.15"
            className="capability-icon-stroke capability-icon-stroke--delay-1"
          />
          <circle cx="7.15" cy="17.1" r="1.15" pathLength={1} className="capability-icon-stroke capability-icon-stroke--delay-2" />
          <circle cx="16.85" cy="17.1" r="1.15" pathLength={1} className="capability-icon-stroke capability-icon-stroke--delay-2" />
          <circle cx="12" cy="5.15" r="1.15" pathLength={1} className="capability-icon-stroke capability-icon-stroke--delay-2" />
        </svg>
      );
    case 'search':
      return (
        <svg {...svgBase}>
          <circle cx="10.25" cy="10.25" r="4" pathLength={1} className="capability-icon-stroke" />
          <path pathLength={1} d="M15.35 15.35L20 20" className="capability-icon-stroke capability-icon-stroke--delay-1" />
        </svg>
      );
    case 'multimodal':
      return (
        <svg {...svgBase}>
          <path pathLength={1} d="M4 7.25h9v10.5H4z" className="capability-icon-stroke" />
          <path
            pathLength={1}
            d="M14.75 8.25H21M14.75 12H20M14.75 15.75H21"
            className="capability-icon-stroke capability-icon-stroke--delay-1"
          />
        </svg>
      );
    case 'rag':
      return (
        <svg {...svgBase}>
          <path
            pathLength={1}
            d="M7 4.5h10a.5.5 0 01.5.5V19a.5.5 0 01-.5.5H7a.5.5 0 01-.5-.5V5a.5.5 0 01.5-.5z"
            className="capability-icon-stroke"
          />
          <path pathLength={1} d="M9.25 8.5h5.5M9.25 11.5H15M9.25 14.5h4" className="capability-icon-stroke capability-icon-stroke--delay-1" />
        </svg>
      );
    default: {
      const _exhaustive: never = icon;
      return _exhaustive;
    }
  }
}

function ProductVisual({
  image,
  imageCollapsed,
  imageAlt,
  mediaType = 'image',
  active,
  playing = active,
  zoomed,
  hoverZoom = false,
}: {
  image: string;
  imageCollapsed: string;
  imageAlt?: string;
  mediaType?: 'image' | 'video' | 'solid';
  active: boolean;
  playing?: boolean;
  zoomed: boolean;
  hoverZoom?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRadius = 'rounded-[10px]';
  const imgBase =
    'pointer-events-none absolute inset-0 h-full w-full object-cover backface-hidden transform-gpu transition-[opacity_280ms_ease-out,transform_720ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none';
  const hoverScale =
    'group-hover/product-card:scale-[1.08] group-focus-within/product-card:scale-[1.08] motion-reduce:group-hover/product-card:scale-100 motion-reduce:group-focus-within/product-card:scale-100';
  const scale = zoomed
    ? 'scale-[1.08] motion-reduce:scale-100'
    : hoverZoom
      ? `scale-100 ${hoverScale} motion-reduce:scale-100`
      : 'scale-100 motion-reduce:scale-100';
  const zoomLayer = zoomed || hoverZoom ? 'will-change-transform' : '';

  useEffect(() => {
    if (mediaType !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
    if (Number.isFinite(video.duration)) {
      video.currentTime = 0;
    }
  }, [mediaType, playing]);

  if (mediaType === 'solid') {
    return (
      <div className={`relative z-0 h-full overflow-hidden bg-black ${shellRadius}`} aria-hidden>
        <div className={`absolute inset-0 bg-black ${zoomLayer} ${scale}`} />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className={`relative z-0 h-full overflow-hidden ${shellRadius}`}>
        <video
          ref={videoRef}
          src={image}
          className={`${imgBase} opacity-100 ${zoomLayer} ${scale} ${
            active || playing ? 'grayscale-0' : 'grayscale'
          }`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <div className={`relative z-0 h-full overflow-hidden ${shellRadius}`}>
      <img
        src={imageCollapsed}
        alt=""
        className={`${imgBase} ${zoomLayer} ${scale} grayscale ${active ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden={active}
      />
      <img
        src={image}
        alt={imageAlt ?? ''}
        className={`${imgBase} ${zoomLayer} ${scale} grayscale-0 ${active ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!active}
      />
    </div>
  );
}

function ProductCard({
  card,
  active,
  zoomed,
  rowInteractive,
  onActivate,
  onDeactivate,
  onOpenContactModal,
}: {
  card: ProductCardData;
  active: boolean;
  zoomed: boolean;
  rowInteractive: boolean;
  onActivate: () => void;
  onDeactivate?: () => void;
  onOpenContactModal: () => void;
}) {
  const [mediaHovered, setMediaHovered] = useState(false);
  const mediaPlaying = card.mediaPlayback === 'hover' ? mediaHovered : active;
  const titleClassName = active ? 'text-xl leading-[36px]' : 'text-lg leading-[1.4]';
  const actionButtonClassName =
    'inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 !text-sm !font-medium leading-normal text-[var(--color-text-primary)] shadow-[var(--shadow-soft)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#f8f9ff] hover:shadow-[0_18px_36px_rgba(15,23,42,0.14)] active:translate-y-0 active:shadow-[var(--shadow-soft)] motion-reduce:transition-none motion-reduce:hover:translate-y-0';
  const actionLinkTextClassName =
    '!text-[var(--color-text-primary)] visited:!text-[var(--color-text-primary)] hover:!text-[var(--color-text-primary)] active:!text-[var(--color-text-primary)] focus-visible:!text-[var(--color-text-primary)]';
  const productActionControlClassName = `${actionButtonClassName} ${actionLinkTextClassName}`;
  const productActionLabelStyle = {
    color: 'var(--color-text-primary)',
    WebkitTextFillColor: 'var(--color-text-primary)',
  } as const;

  const rowHandlers = rowInteractive
    ? {
        onMouseEnter: () => {
          setMediaHovered(true);
          onActivate();
        },
        onMouseLeave: () => {
          setMediaHovered(false);
          onDeactivate?.();
        },
        onPointerEnter: onActivate,
        onFocus: onActivate,
        onClick: () => onActivate(),
      }
    : {
        onMouseEnter: () => {
          setMediaHovered(true);
          onActivate();
        },
        onMouseLeave: () => {
          setMediaHovered(false);
          onDeactivate?.();
        },
      };

  return (
    <article className="h-full min-h-0 w-full">
      <div
        className={`group/product-card relative h-full min-h-0 w-full overflow-hidden rounded-[10px] bg-[var(--color-bg-muted)] ${
          rowInteractive ? 'cursor-pointer' : 'cursor-default'
        }`}
        {...rowHandlers}
        tabIndex={rowInteractive ? 0 : undefined}
      >
        <div className="relative h-full min-h-0 w-full">
          <ProductVisual
            image={card.image}
            imageCollapsed={card.imageCollapsed}
            imageAlt={card.title}
            mediaType={card.mediaType}
            active={active}
            playing={mediaPlaying}
            zoomed={zoomed}
            hoverZoom={card.id === 'hermesAgent'}
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-black/20" aria-hidden />

          <div
            className={`pointer-events-none absolute inset-x-10 top-12 bottom-12 z-20 flex flex-col justify-end text-white transition-opacity duration-200 ease-out ${
              active ? 'opacity-100 delay-75' : 'opacity-0'
            }`}
          >
            <div className={`w-full ${active ? 'pointer-events-auto' : ''}`}>
              <h3 className={`font-medium tracking-[-0.04em] text-white transition-none ${titleClassName}`}>
                {card.title}
              </h3>
              <p className="mt-1.5 min-h-[80px] text-sm leading-[20px] text-white/80 transition-none">
                {card.description}
              </p>
              <div className="mt-0">
                {card.actionHref ? (
                  <a
                    href={card.actionHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`${productActionControlClassName} cursor-pointer no-underline`}
                    style={productActionLabelStyle}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {card.action}
                  </a>
                ) : (
                  <button
                    type="button"
                    className={`${productActionControlClassName} cursor-pointer border-0`}
                    style={productActionLabelStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenContactModal();
                    }}
                  >
                    {card.action}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            className={`pointer-events-none absolute inset-x-6 bottom-8 z-10 text-white transition-opacity duration-150 ease-out ${
              active ? 'opacity-0' : 'opacity-100 delay-75'
            }`}
          >
            <h3 className="text-lg font-medium leading-[1.4] tracking-[-0.02em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
              {card.collapsedTitle}
            </h3>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeaturedModelCard({
  name,
  provider,
  inputPrice,
  outputPrice,
  description,
}: ReturnType<typeof buildFeaturedModels>[number]) {
  const t = useT();
  const imageSrc = featuredModelImageMap[name];

  return (
    <article
      tabIndex={0}
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-[rgba(17,24,39,0.06)] bg-white text-[var(--color-text-primary)] outline-none will-change-auto backface-hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:duration-300 hover:will-change-transform hover:-translate-y-1.5 hover:shadow-[0_24px_34px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-within:duration-300 focus-within:will-change-transform focus-within:-translate-y-1.5 focus-within:shadow-[0_24px_34px_rgba(15,23,42,0.12)] motion-reduce:will-change-auto motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none motion-reduce:focus-within:translate-y-0 motion-reduce:focus-within:shadow-none"
    >
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden rounded-t-[10px] bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={featuredModelAltMap[name] ?? `${name} ${provider} 大语言模型`}
            loading="lazy"
            className="h-full w-full origin-center object-cover will-change-auto backface-hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:duration-300 group-hover:will-change-transform group-hover:scale-[1.06] group-focus-within:duration-300 group-focus-within:will-change-transform group-focus-within:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:will-change-auto motion-reduce:group-focus-within:scale-100 motion-reduce:group-focus-within:will-change-auto"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(102,115,255,0.24),transparent_42%),linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] px-6 text-center">
            <div className="space-y-3">
              <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-white/45">{provider}</p>
              <p className="text-2xl font-semibold leading-[1.15] tracking-[-0.04em] text-white">{name}</p>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,31,0.04)_0%,rgba(8,15,31,0.18)_100%)]" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-visible bg-white shadow-[0_-1px_0_rgba(17,24,39,0.04)]">
        <div className="relative z-[2] flex shrink-0 flex-col bg-white px-6 pt-6 will-change-auto backface-hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:duration-300 group-hover:will-change-transform group-hover:-translate-y-[88px] group-hover:-mb-[88px] group-focus-within:duration-300 group-focus-within:will-change-transform group-focus-within:-translate-y-[88px] group-focus-within:-mb-[88px] motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:mb-0 motion-reduce:group-hover:will-change-auto motion-reduce:group-focus-within:translate-y-0 motion-reduce:group-focus-within:mb-0 motion-reduce:group-focus-within:will-change-auto">
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-[rgba(17,24,39,0.38)]">
            {provider}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--color-text-primary)]">
            {name}
          </h3>
          <div
            className="mt-2 min-h-0 h-[2.75rem] overflow-x-hidden overflow-y-hidden group-hover:h-[calc(2.75rem+88px)] group-hover:overflow-y-auto group-focus-within:h-[calc(2.75rem+88px)] group-focus-within:overflow-y-auto motion-reduce:group-hover:h-[2.75rem] motion-reduce:group-hover:overflow-y-hidden motion-reduce:group-focus-within:h-[2.75rem] motion-reduce:group-focus-within:overflow-y-hidden"
            title={description}
          >
            <p className="text-sm leading-[20px] text-[var(--color-text-secondary)] line-clamp-2 group-hover:line-clamp-none group-focus-within:line-clamp-none motion-reduce:group-hover:line-clamp-2 motion-reduce:group-focus-within:line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="relative z-[1] mt-5 shrink-0 bg-white pb-6">
          <div
            className="mx-6 border-t border-[rgba(17,24,39,0.08)]"
            aria-hidden
          />
          <div className="px-6 pt-5">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs leading-[1.3] text-[var(--color-text-secondary)]">{t('home.pricing.input')}</p>
                <p className="mt-2 text-xl font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--color-text-primary)]">
                  <span className="mr-0.5 align-[0.08em] text-sm font-medium text-[rgba(17,24,39,0.72)]">¥</span>
                  {inputPrice.replace('¥', '')}
                  <span className="ml-1 text-caption font-medium tracking-normal text-[rgba(17,24,39,0.42)]">
                    {t('home.pricing.perMillion')}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs leading-[1.3] text-[var(--color-text-secondary)]">{t('home.pricing.output')}</p>
                <p className="mt-2 text-xl font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--color-text-primary)]">
                  <span className="mr-0.5 align-[0.08em] text-sm font-medium text-[rgba(17,24,39,0.72)]">¥</span>
                  {outputPrice.replace('¥', '')}
                  <span className="ml-1 text-caption font-medium tracking-normal text-[rgba(17,24,39,0.42)]">
                    {t('home.pricing.perMillion')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function ContactUsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
        role="presentation"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        className="relative z-[1] w-full max-w-[400px] rounded-xl border-0 bg-white px-8 pb-8 pt-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.12)] outline-none ring-0"
      >
        <button
          type="button"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent text-[var(--color-text-secondary)] transition-colors hover:bg-[rgba(17,24,39,0.06)] hover:text-[var(--color-text-primary)]"
          onClick={onClose}
          aria-label={t('home.close')}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h2 id="contact-modal-title" className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
          {t('home.contactTitle')}
        </h2>
        <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{t('home.contactHours')}</p>
        <div className="mt-5 flex justify-center">
          <img
            src={CONTACT_WECHAT_QR_SRC}
            alt={t('home.contactQrAlt')}
            className="h-[220px] w-[220px] max-w-full border-0 object-contain outline-none ring-0"
            width={220}
            height={220}
          />
        </div>
        <p className="mt-5 text-xs text-[var(--color-text-placeholder)]">{t('home.contactHint')}</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const t = useT();
  const { locale } = useLocale();
  const capabilityCards = useMemo(() => buildCapabilityCards(t), [t]);
  const productCards = useMemo(() => buildProductCards(t), [t]);
  const agentCards = useMemo(() => buildAgentCards(t), [t]);
  const heroMetrics = useMemo(() => buildHeroMetrics(t, locale), [t, locale]);
  const featuredModels = useMemo(() => buildFeaturedModels(t), [t]);

  const [activeProductId, setActiveProductId] = useState('api');
  const [zoomedProductId, setZoomedProductId] = useState<string | null>(null);
  const [zoomedAgentId, setZoomedAgentId] = useState<string | null>(null);
  const isLgDesktop = useMinWidthLg();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hermesModalOpen] = useState(false);
  const closeContactModal = useCallback(() => {
    setContactModalOpen(false);
  }, []);
  // const closeHermesModal = useCallback(() => {
  //   setHermesModalOpen(false);
  //   try {
  //     window.localStorage.setItem(HERMES_MODAL_LAST_DISMISSED_KEY, String(Date.now()));
  //   } catch {
  //     // 无痕模式等
  //   }
  // }, []);

  /** Hermes 全屏时冻结首屏入场：避免动画在遮罩背后播完；弹窗全关后刷新 IO + 画布尺寸 */
  const heroEnter = useCallback(
    (step: 1 | 2 | 3 | 4 | 5) =>
      hermesModalOpen ? 'hero-enter-frozen' : `hero-enter hero-enter--${step}`,
    [hermesModalOpen],
  );

  useLayoutEffect(() => {
    if (hermesModalOpen || contactModalOpen) return;
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(SURFACE_LAYOUT_UNLOCK_EVENT));
      window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(id);
  }, [hermesModalOpen, contactModalOpen]);

  const scrollToCapabilities = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('capabilities')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const heroTitleAnchorRef = useRef<HTMLHeadingElement>(null);

  return (
    <div>
      <section
        id="hero"
        className="relative isolate -mt-[var(--header-height)] overflow-hidden bg-[#000000] pt-[var(--header-height)]"
      >
        <HeroGalaxyBackdrop pointerAnchorRef={heroTitleAnchorRef} />
        <div className="relative z-10 mx-auto flex h-[calc(100vh-var(--header-height))] w-full max-w-[1316px] items-center justify-center overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 pointer-events-none [&_*]:pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <div className="flex w-full max-w-4xl flex-col items-center space-y-7 text-center -translate-y-[min(2.75rem,4.5vh)] sm:-translate-y-[min(3.25rem,5vh)]">
            <div
              className={`${heroEnter(1)} inline-flex shrink-0 select-none items-center rounded-full border border-white/12 bg-white/6 px-4 py-1.5 text-2xs font-medium normal-case tracking-normal [word-spacing:0] whitespace-nowrap text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-sm`}
            >
              {t('home.heroBadge')}
            </div>

            <div className={`${heroEnter(2)} flex w-full max-w-full flex-col items-center space-y-4 mb-10`}>
              <h1
                ref={heroTitleAnchorRef}
                className="relative flex h-[96px] w-full flex-col items-center text-hero-sm font-bold leading-[1.08] tracking-[-0.06em] text-white [word-spacing:0.16em] sm:[word-spacing:0.18em] lg:[word-spacing:0.2em] sm:text-hero-md lg:text-7xl"
              >
                <HeroBuildTitle animationEnabled={!hermesModalOpen} locale={locale} />
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-[1.55] text-white/72">
                {t('home.heroSub')}
              </p>
            </div>

            <div className={`${heroEnter(3)} mb-[28px] flex w-full max-w-[340px] justify-center sm:max-w-[360px]`}>
              <a
                href={`${SITE_URL}/hub/keys`}
                target="_blank"
                rel="noreferrer"
                className="mb-[28px] pointer-events-auto inline-flex w-full min-w-0 items-center justify-center rounded-lg bg-[var(--color-primary)] px-3.5 py-3.5 text-sm font-medium leading-none !text-white no-underline transition-[transform,background-color] duration-200 ease-out hover:-translate-y-1 hover:bg-[#555ED9] hover:!text-white active:translate-y-0 active:bg-[#4448C9] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto sm:min-w-[200px]"
                style={{ color: '#fff', WebkitTextFillColor: '#fff' }}
              >
                {t('home.ctaKeys')}
              </a>
            </div>

            <HeroMetrics metrics={heroMetrics} heroEnterClass={heroEnter(4)} hermesModalOpen={hermesModalOpen} />
          </div>

          <div
            className={`${heroEnter(5)} pointer-events-none absolute inset-x-0 bottom-7 flex justify-center sm:bottom-8`}
          >
            <button
              type="button"
              onClick={scrollToCapabilities}
              aria-label={t('home.scrollCapabilities')}
              className="pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,0.04)] bg-white/[0.09] text-white/78 shadow-[0_8px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-[transform,box-shadow,border-color,background-color,color] duration-200 ease-out hover:-translate-y-1 hover:border-white/28 hover:bg-white/[0.14] hover:text-white hover:shadow-[0_12px_36px_rgba(102,115,255,0.22)] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="hero-scroll-arrow inline-flex">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    d="M12 5v12m0 0-5-5m5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section id="capabilities" className="bg-[var(--color-bg)]">
        <div className="mx-auto w-full max-w-[1316px] px-4 py-32 sm:px-6 lg:px-8 lg:py-32">
          <RevealItem>
            <SectionHeading title={t('home.capabilitiesTitle')} description={t('home.capabilitiesDesc')} />
          </RevealItem>

          <div className="mt-12 grid grid-cols-1 auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {capabilityCards.map((card, index) => (
              <RevealItem
                key={card.icon}
                fill
                className="min-h-0"
                delayMs={index * REVEAL_STAGGER_STEP_MS}
              >
                <article
                  tabIndex={0}
                  className="group relative flex h-full min-h-0 w-full flex-col rounded-[10px] border border-[rgba(17,24,39,0.06)] bg-white p-6 outline-none will-change-transform backface-hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_34px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-within:duration-300 focus-within:-translate-y-1.5 focus-within:shadow-[0_24px_34px_rgba(15,23,42,0.12)] motion-reduce:will-change-auto motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none motion-reduce:focus-within:translate-y-0 motion-reduce:focus-within:shadow-none"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(102,115,255,0.08)]">
                    <CapabilityCardIcon icon={card.icon} />
                  </div>
                  <h3 className="text-lg font-medium leading-8 text-[var(--color-text-primary)]">{card.title}</h3>
                  <p className="mt-1.5 h-fit min-h-0 text-sm leading-[1.6] text-[var(--color-text-secondary)]">
                    {card.description}
                  </p>
                </article>
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="bg-[var(--color-bg-muted)]">
        <div className="mx-auto w-full max-w-[1316px] px-4 py-32 sm:px-6 lg:px-8 lg:py-32">
          <RevealItem>
            <SectionHeading title={t('home.productsTitle')} description={t('home.productsDesc')} />
          </RevealItem>

          <div
            className="mt-12 max-lg:grid max-lg:grid-cols-1 max-lg:gap-6 md:max-lg:grid-cols-2 lg:flex lg:min-h-[440px] lg:flex-row lg:gap-6 lg:overflow-hidden"
            onMouseLeave={() => setZoomedProductId(null)}
          >
            {productCards.map((card, index) => {
              const active = isLgDesktop ? card.id === activeProductId : true;
              const zoomed = isLgDesktop && card.id === zoomedProductId;
              return (
                <RevealItem
                  key={card.id}
                  fill
                  delayMs={index * REVEAL_STAGGER_STEP_MS}
                  className={`h-auto w-full shrink-0 max-lg:min-h-0 max-lg:basis-auto max-lg:transition-none lg:h-[420px] lg:min-w-0 lg:transition-[flex-basis] lg:duration-300 lg:ease-out ${
                    card.id === activeProductId
                      ? 'lg:basis-[calc((100%_-_6rem)*0.4)]'
                      : 'lg:basis-[calc((100%_-_6rem)*0.15)]'
                  }`}
                >
                  <ProductCard
                    card={card}
                    active={active}
                    zoomed={zoomed}
                    rowInteractive={isLgDesktop}
                    onActivate={() => {
                      setActiveProductId(card.id);
                      setZoomedProductId(card.id);
                    }}
                    onOpenContactModal={() => setContactModalOpen(true)}
                  />
                </RevealItem>
              );
            })}
          </div>
        </div>
      </section>

      <section id="agent-matrix" className="bg-[var(--color-bg)]">
        <div className="mx-auto w-full max-w-[1316px] px-4 py-32 sm:px-6 lg:px-8 lg:py-32">
          <RevealItem>
            <SectionHeading title={t('home.agentMatrixTitle')} description={t('home.agentMatrixDesc')} />
          </RevealItem>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:min-h-[440px]">
            {agentCards.map((card, index) => {
              return (
                <RevealItem
                  key={card.id}
                  fill
                  delayMs={index * REVEAL_STAGGER_STEP_MS}
                  className="h-auto w-full max-lg:min-h-0 lg:h-[420px] lg:min-w-0"
                >
                  <ProductCard
                    card={card}
                    active
                    zoomed={card.id === 'hermesAgent' && card.id === zoomedAgentId}
                    rowInteractive={false}
                    onActivate={() => {
                      if (card.id === 'hermesAgent') setZoomedAgentId(card.id);
                    }}
                    onDeactivate={() => setZoomedAgentId((current) => (current === card.id ? null : current))}
                    onOpenContactModal={() => setContactModalOpen(true)}
                  />
                </RevealItem>
              );
            })}
          </div>
        </div>
      </section>

      <section id="featured-models" className="bg-[var(--color-bg-muted)]">
        <div className="mx-auto w-full max-w-[1316px] px-4 py-32 sm:px-6 lg:px-8 lg:py-32">
          <RevealItem>
            <SectionHeading title={t('home.featuredTitle')} description={t('home.featuredDesc')} />
          </RevealItem>

          <div className="mt-12 grid min-h-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-h-0">
            {featuredModels.map((model, index) => (
              <RevealItem key={model.name} fill className="min-h-0 h-full" delayMs={index * REVEAL_STAGGER_STEP_MS}>
                <FeaturedModelCard {...model} />
              </RevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* <CompareSection /> */}
      {/* <PerformanceSection /> */}
      {/* <FaqSection /> */}

      <section id="closing-cta" className="relative isolate overflow-hidden bg-[#000000]">
        <ClosingGalaxyBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-[1316px] px-4 py-32 sm:px-6 lg:px-8 lg:py-32 pointer-events-none [&_*]:pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
          <RevealItem>
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-display-sm font-semibold tracking-[-0.05em] text-white sm:text-display-md">
                {t('home.closingTitle')}
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.65] text-white/70">{t('home.closingSub')}</p>
            </div>
          </RevealItem>
          <RevealItem className="mt-10 flex justify-center" delayMs={REVEAL_CTA_AFTER_TITLE_MS}>
            <a
              href={`${SITE_URL}/hub/keys`}
              target="_blank"
              rel="noreferrer"
              className="pointer-events-auto inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-6 py-3.5 text-sm font-medium leading-none !text-white no-underline transition-[transform,background-color] duration-200 ease-out hover:-translate-y-1 hover:bg-[#555ED9] hover:!text-white active:translate-y-0 active:bg-[#4448C9] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              style={{ color: '#fff', WebkitTextFillColor: '#fff' }}
            >
              {t('home.ctaKeys')}
            </a>
          </RevealItem>
        </div>
      </section>

      <ContactUsModal open={contactModalOpen} onClose={closeContactModal} />
      {/* <HermesAnnouncementModal open={hermesModalOpen} onClose={closeHermesModal} /> */}
    </div>
  );
}
