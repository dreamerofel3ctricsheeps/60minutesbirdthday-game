import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';
const r = (p) => resolve(import.meta.dirname, p);

export default defineConfig({
  root: r('application/src'),
  publicDir: 'public',        // iconos PWA (icon-*.png, apple-touch-icon.png)
  base: '/',
  resolve: { alias: { '@': r('application/src') } },
  build: { outDir: r('dist'), emptyOutDir: true, target: 'es2020' },
  server: { host: true, port: 5173 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '1 Minuto para la Fiesta',
        short_name: '1 Minuto',
        description: 'Prepara la fiesta sorpresa antes de que lleguen: un juego de fiesta.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#120f1b',
        background_color: '#120f1b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precarga el app-shell (JS/CSS/HTML + iconos). Los assets de runtime
        // (sheets/audio/date/img) se copian DESPUÉS del build, así que no están
        // al generar el SW: se cachean en runtime al jugar (CacheFirst).
        globPatterns: ['**/*.{js,css,html,webmanifest,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'game-assets',
            expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
});
