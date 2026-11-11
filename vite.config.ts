/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/SpaceNight/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon-180x180.png'],
      manifest: {
        name: 'SpaceNight',
        short_name: 'SpaceNight',
        description:
          'What is in your sky tonight: the Moon, the planets, the Space Station and the weather.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#061236',
        theme_color: '#061236',
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2,webp}'],
        globIgnores: ['assets/draco_*', 'modelos/**', 'data/nasa/**'],
        navigateFallback: 'index.html',
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/nasa/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nasa-datos',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 20 },
            },
          },
          {
            urlPattern: ({ url }) =>
              [
                'eonet.gsfc.nasa.gov',
                'epic.gsfc.nasa.gov',
                'images-api.nasa.gov',
                'images-assets.nasa.gov',
              ].includes(url.hostname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nasa-en-vivo',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 400, maxAgeSeconds: 7 * 86_400 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/preparar.ts'],
  },
});
