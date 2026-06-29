export const SITE_NAME = 'HelloMe';

export const SITE_TITLE = 'Hello, Me.懂世界，更懂 Me。';

export const SITE_DESCRIPTION =
  'HelloMe 是面向普通用户的智能体任务平台。Hello, Me。懂世界，更懂 Me。把时间还给生活，把未来交给 HelloMe。';

export const SITE_KEYWORDS =
  'HelloMe, 智能体, AI 智能体, 智能体市场, Hz-Hermes, GEO 智能体, AI 搜索优化, 内容创作, 视频生成, 销售获客, 自动化任务, 个人智能引擎';

export const SITE_TAGLINE = '把时间还给生活，把未来交给 HelloMe。';

export const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

export type SeoMeta = {
  title?: string;
  description?: string;
  keywords?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL;
  if (fromEnv?.trim()) {
    return fromEnv.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export function absoluteSiteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const origin = getSiteOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}

export const HOME_SEO: SeoMeta = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  path: '/welcome',
};

export const AGENTS_MARKET_SEO: SeoMeta = {
  title: `智能体市场 - ${SITE_NAME}`,
  description:
    '浏览 GEO 营销、内容创作、视频生成、销售获客等 AI 智能体，按需发起任务，由 Hz-Hermes 帮你自动执行与交付。',
  keywords: SITE_KEYWORDS,
  path: '/agents',
};

export function buildAgentDetailSeo(agent: { id: string; name: string; desc: string }): SeoMeta {
  return {
    title: `${agent.name} - ${SITE_NAME} 智能体`,
    description: `${agent.desc} 在 HelloMe 一键发起任务，${SITE_TAGLINE}`,
    keywords: `${agent.name}, ${SITE_KEYWORDS}`,
    path: `/agents/${agent.id}`,
  };
}

export function resolveSeoForPath(pathname: string): SeoMeta {
  if (pathname.startsWith('/admin') || pathname.startsWith('/app') || pathname.startsWith('/connect-hermes')) {
    return { title: SITE_TITLE, noIndex: true, path: pathname };
  }
  if (pathname === '/welcome') return HOME_SEO;
  if (pathname === '/agents') return AGENTS_MARKET_SEO;
  if (pathname === '/' || pathname === '/login') {
    return { ...AGENTS_MARKET_SEO, path: pathname === '/' ? '/agents' : pathname };
  }
  return {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    path: pathname,
  };
}

export function buildHomeJsonLd(origin: string) {
  const siteUrl = origin || absoluteSiteUrl('/');
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
      description: SITE_DESCRIPTION,
      inLanguage: 'zh-CN',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description: SITE_DESCRIPTION,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'CNY',
        availability: 'https://schema.org/InStock',
      },
    },
  ];
}
