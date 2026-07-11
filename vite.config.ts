/// <reference types="vitest" />
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Injects the Google Analytics (gtag.js) snippet into <head> at build time,
 * but ONLY when the VITE_GA_ID env var is set. The measurement ID is not
 * committed — it lives in Netlify's environment variables (Site configuration
 * → Environment variables → VITE_GA_ID). Local dev/test builds have no GA.
 */
function injectGoogleAnalytics(): Plugin {
  return {
    name: 'inject-google-analytics',
    transformIndexHtml() {
      const id = process.env.VITE_GA_ID;
      if (!id) return;
      return [
        {
          tag: 'script',
          attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${id}` },
          injectTo: 'head',
        },
        {
          tag: 'script',
          children: [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            "gtag('js', new Date());",
            `gtag('config', '${id}');`,
          ].join('\n'),
          injectTo: 'head',
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), injectGoogleAnalytics()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
  },
});
