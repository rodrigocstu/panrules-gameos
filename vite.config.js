/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// DUAL-BUILD STRATEGY (EGC-9)
// ─────────────────────────────────────────────────────────────────────────────
// Two build targets share this config file; the Vite CLI flag --base overrides
// the `base` field at build time so no env-var or conditional is needed here:
//
//   npm run build         → `vite build`            → base '/panrules-gameos/'
//                           output: dist/           → GitHub Pages (unchanged)
//
//   npm run build:mobile  → `vite build --base=/ --outDir dist-mobile`
//                           output: dist-mobile/    → Capacitor (capacitor.config.ts webDir)
//
// The VitePWA plugin, workbox precache, and navigateFallback below all derive
// from BASE, so they adapt automatically to whichever base is active.
// ─────────────────────────────────────────────────────────────────────────────
const BASE = '/panrules-gameos/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Minimal installable PWA shell (PNR-3). vite-plugin-pwa derives the SW
    // scope, manifest paths and precache from the Vite `base`, so the app stays
    // correct under GitHub Pages' /panrules-gameos/ sub-path. Icon `src` values
    // are relative and get the base prepended automatically.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // we register explicitly in src/main.jsx
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'PAN-OS Rules — Firewall Simulator',
        short_name: 'PAN-OS Rules',
        description:
          'Simulador educativo de consola NGFW de Palo Alto: configura políticas, NAT y perfiles, haz commit y observa el paquete cruzar las zonas.',
        lang: 'es',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'any',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell so the game launches offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // SPA fallback: any offline navigation resolves to the cached shell,
        // base-prefixed so it works under the Pages sub-path.
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  base: BASE,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
});
