// Configuración de Vite.
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// En GitHub Pages la página vive en una subcarpeta: https://<usuario>.github.io/cubos-web/
const BASE = '/cubos-web/';
// Mismo color que el fondo de la página (--bg en style.css).
const BACKGROUND = '#090b10';

export default defineConfig({
  // Vite antepone esta ruta a todos los archivos (JS, CSS, workers de cubing.js, íconos).
  // También se usa en desarrollo, así lo local se comporta igual que lo publicado.
  base: BASE,
  // cubing.js genera los scrambles en un worker que es un módulo ES (usa import).
  // Por defecto Vite arma los workers como "iife" y en el build no arrancan.
  worker: {
    format: 'es',
  },
  build: {
    // El "preload" de Vite usa document para precargar archivos, y el worker de
    // cubing.js importa módulos con ese mecanismo: dentro de un worker no hay
    // document y falla. Sin preload, los archivos se cargan igual (apenas más tarde).
    modulePreload: false,
    // Un solo archivo CSS (la página tiene una sola hoja de estilos). Así ningún
    // import dinámico "depende" de CSS y Vite no necesita ese ayudante de preload.
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // El ayudante que usa Vite para los import dinámicos va en su propio
          // archivo. Si queda en el principal, el worker lo importa desde ahí y
          // arrastra toda la interfaz (que usa document) → el worker falla.
          groups: [{ name: 'vite-helpers', test: /preload-helper/ }],
        },
      },
    },
  },
  plugins: [
    // PWA: manifest (para instalarla) + service worker (para usarla sin conexión).
    VitePWA({
      // Cuando hay una versión nueva, el service worker espera y avisa: la página
      // nunca se recarga sola. El aviso y el registro los maneja src/pwa.js.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: BASE,
        name: 'CubeSolver',
        short_name: 'CubeSolver',
        description: 'Timer de speedcubing, entrenador de casos, notación 3D y guías de métodos con casos animados.',
        lang: 'es',
        dir: 'ltr',
        // start_url y scope tienen que coincidir con la subcarpeta, si no Android no la instala bien.
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'any',
        theme_color: BACKGROUND,
        background_color: BACKGROUND,
        categories: ['games', 'sports', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Se guarda en caché TODO el build: la interfaz, los íconos y todos los
        // archivos de cubing.js (workers de scrambles, puzzles, animación 3D, wasm).
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,wasm,woff2}'],
        // Algunos archivos de cubing.js pasan el límite por defecto (2 MB).
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Sin conexión, cualquier navegación dentro de la app abre index.html (rutas con #).
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
