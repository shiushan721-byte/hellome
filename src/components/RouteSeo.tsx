import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SeoHead from './SeoHead';
import { resolveSeoForPath } from '../lib/siteSeo';

/** 按路由自动设置公开页的默认 SEO；详情页可在页面内覆盖 */
export default function RouteSeo() {
  const { pathname } = useLocation();
  const meta = useMemo(() => resolveSeoForPath(pathname), [pathname]);
  return <SeoHead {...meta} />;
}
