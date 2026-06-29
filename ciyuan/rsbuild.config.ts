import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig(({ envMode }) => {
  const { publicVars, parsed } = loadEnv({
    prefixes: ['VITE_', 'PUBLIC_'],
    mode: envMode,
  });

  return {
    plugins: [pluginReact(), pluginSvgr(), pluginSass()],
    dev: {
      hmr: true,
      liveReload: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: parsed.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    source: {
      define: publicVars,
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    output: {
      assetPrefix: parsed.VITE_CDN_URL || '/',
      overrideBrowserslist: [
        'Chrome >= 63',
        'iOS >= 12',
        'Android >= 5',
        'not dead',
      ],
      polyfill: 'usage',
    },
    html: {
      template: './public/index.html',
    },
  };
});
