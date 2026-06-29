import type express from 'express';
import { listMarketOnlineAgentSlugs } from '../data/marketAgentSeed';

function resolveSiteOrigin(req: express.Request): string {
  const fromEnv = (process.env.APP_URL || process.env.VITE_SITE_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const host = req.get('host');
  if (!host) return '';
  return `${req.protocol}://${host}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapXml(origin: string): string {
  const paths = ['/welcome', '/agents', ...listMarketOnlineAgentSlugs().map((slug) => `/agents/${slug}`)];
  const urls = paths
    .map((pathname) => {
      const loc = xmlEscape(`${origin}${pathname}`);
      const priority = pathname === '/welcome' ? '1.0' : pathname === '/agents' ? '0.9' : '0.7';
      const changefreq = pathname === '/welcome' ? 'weekly' : 'monthly';
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function registerSiteSeoRoutes(app: express.Express): void {
  app.get('/robots.txt', (req, res) => {
    const origin = resolveSiteOrigin(req);
    const sitemapLine = origin ? `Sitemap: ${origin}/sitemap.xml` : 'Sitemap: /sitemap.xml';
    res
      .type('text/plain')
      .send(
        `User-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /admin/\nDisallow: /connect-hermes\n\n${sitemapLine}\n`,
      );
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveSiteOrigin(req);
    if (!origin) {
      res.status(503).type('text/plain').send('Sitemap unavailable: set APP_URL');
      return;
    }
    res.type('application/xml').send(buildSitemapXml(origin));
  });
}
