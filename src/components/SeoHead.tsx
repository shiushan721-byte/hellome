import { useEffect } from 'react';
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_NAME,
  SITE_TITLE,
  absoluteSiteUrl,
  type SeoMeta,
} from '../lib/siteSeo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
}

type SeoHeadProps = SeoMeta;

export default function SeoHead({
  title = SITE_TITLE,
  description,
  keywords,
  path,
  image = DEFAULT_OG_IMAGE_PATH,
  noIndex = false,
}: SeoHeadProps) {
  useEffect(() => {
    document.title = title;

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }

    if (keywords) {
      upsertMeta('name', 'keywords', keywords);
    }

    upsertMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow');
    upsertMeta('property', 'og:title', title);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:locale', 'zh_CN');
    upsertMeta('name', 'twitter:card', 'summary_large_image');

    const canonicalPath = path ?? window.location.pathname;
    const canonicalUrl = absoluteSiteUrl(canonicalPath);
    const imageUrl = image.startsWith('http') ? image : absoluteSiteUrl(image);

    upsertLink('canonical', canonicalUrl);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('name', 'twitter:image', imageUrl);
  }, [title, description, keywords, path, image, noIndex]);

  return null;
}
