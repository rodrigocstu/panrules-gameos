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

// CSP de la WebView móvil / Pages (EGC-10, invariante ZT §4.4). Se inyecta SÓLO en el
// build (`apply: 'build'`) para no romper el preámbulo inline de React Fast Refresh en
// `npm run dev`; el index.html publicado (dist/ y dist-mobile/) sí lleva la cabecera.
// `script-src 'self'` es el núcleo anti-XSS (sin scripts inline); `style-src 'unsafe-inline'`
// habilita los estilos inline de los componentes; `connect-src` permite el backend HTTPS,
// el esquema capacitor:// nativo y http://localhost en desarrollo nativo (CORS architecture §4).
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self' https: capacitor: http://localhost",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-ancestors 'none'",
].join('; ');

function cspMeta() {
  return {
    name: 'egc-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    cspMeta(),
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
