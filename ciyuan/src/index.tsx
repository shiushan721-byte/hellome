import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-900.css';
import './styles/global.css';

// 词元免登（外部站点带 token 跳转）：渲染前同步读取 URL hash 里的 sso_token 落地登录态，
// 再立即从地址栏清除。用 hash 而非 query：不进服务器访问日志；清除后避免 token 残留/泄露。
// 必须在 React 渲染前执行，确保 AuthProvider 挂载时能读到 localStorage['token']。
(function consumeSsoToken() {
  try {
    const hash = window.location.hash || '';
    const matched = hash.match(/[#&]sso_token=([^&]+)/);
    if (!matched) return;
    const token = decodeURIComponent(matched[1]);
    if (token) {
      localStorage.setItem('token', token);
    }
    const cleanedHash = hash.replace(/([#&])sso_token=[^&]*/, '$1').replace(/[#&]+$/, '');
    const nextUrl =
      window.location.pathname + window.location.search + (cleanedHash && cleanedHash !== '#' ? cleanedHash : '');
    window.history.replaceState(null, '', nextUrl);
  } catch {
    /* 忽略：隐私模式 / localStorage 不可用时不阻断渲染 */
  }
})();

const container = document.getElementById('root')!;

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  import('react-dom/client').then(({ hydrateRoot }) => {
    hydrateRoot(container, app);
  });
} else {
  import('react-dom/client').then(({ createRoot }) => {
    createRoot(container).render(app);
  });
}
