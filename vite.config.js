// Configuración de Vite.
import { defineConfig } from 'vite';

export default defineConfig({
  // En GitHub Pages la página vive en una subcarpeta: https://<usuario>.github.io/cubos-web/
  // Vite antepone esta ruta a todos los archivos (JS, CSS, workers de cubing.js, favicon).
  // También se usa en desarrollo, así lo local se comporta igual que lo publicado.
  base: '/cubos-web/',
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
});
