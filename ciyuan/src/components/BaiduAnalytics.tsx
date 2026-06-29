import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    _hmt?: any[];
  }
}

/**
 * 百度统计 SPA PV 上报。
 * - 路由 / 查询参数变化时自动上报 _trackPageview
 * - 首次进入时记录推广参数（utm_*、from、channel 等）为事件，便于在百度统计后台分维度查看
 * - 仅在已加载 hm.js（即生产域名）的情况下生效
 */
export default function BaiduAnalytics() {
  const location = useLocation();
  const reportedPromo = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(window._hmt)) return; // 非生产域名未加载

    const fullPath = location.pathname + location.search + location.hash;
    window._hmt.push(['_trackPageview', fullPath]);

    // 首次进入页面时，把推广参数作为事件单独上报一次，方便后台分组统计
    if (!reportedPromo.current) {
      reportedPromo.current = true;
      const params = new URLSearchParams(location.search);
      const promoKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'from', 'channel', 'source'];
      promoKeys.forEach((key) => {
        const value = params.get(key);
        if (value) {
          // _trackEvent: 类别, 动作, 标签, 值
          window._hmt!.push(['_trackEvent', 'promo', key, value]);
        }
      });
    }
  }, [location.pathname, location.search, location.hash]);

  return null;
}
