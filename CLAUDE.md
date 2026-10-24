# Cubos Web

Página web de speedcubing: timer, scrambles y guías de métodos para cubos de Rubik.

## Stack
- Vite + JavaScript (sin framework) + CSS.
- Librería `cubing.js` para scrambles (`randomScrambleForEvent`) y visualización (`<twisty-player>`).
- Datos guardados en `localStorage` (no hay servidor).
- Publicada en GitHub Pages: https://leonidaslw2.github.io/cubos-web/ (repo público https://github.com/LeonidasLw2/cubos-web).
  - En local también vive en la subcarpeta: http://localhost:5173/cubos-web/ (dev) y http://localhost:4173/cubos-web/ (`npm run preview`, sirve el build).

## Categorías del timer (IDs WCA de cubing.js)
2x2 `222` · 3x3 `333` · 4x4 `444` · 5x5 `555` · 7x7 `777` · Megaminx `minx` · Pyraminx `pyram`

## Etapas
1. ✅ Timer: categorías, scrambles, barra espaciadora / toque, historial, mejor, ao5, ao12 (regla WCA), +2/DNF, localStorage.
   - La visualización 2D del scramble (`<twisty-player>`) también quedó hecha en esta etapa (las 7 categorías tienen vista 2D).
   - Estadísticas ampliadas: peor, media, cantidad de DNF, mejor ao5/ao12 de la sesión, fecha de cada tiempo.
2. ✅ Inspección de 15 s (reglas WCA: +2 entre 15 y 17 s, DNF después; avisos a los 8 y 12 s) y panel de ajustes.
3. Métodos: principiante, CFOP (cruz, F2L, OLL, PLL) y Roux, con casos animados. Se hace en partes:
   - ✅ 3A: navegación (router con hash `#/timer`, `#/metodos/...`), tarjeta de caso reutilizable, método principiante y PLL (21 casos).
   - ✅ 3B: CFOP cruz (consejos + ejemplos óptimos), F2L (41 casos con la idea de cada uno), OLL (57 casos por forma + OLL en 2 pasos).
   - 3C (pendiente): Roux (hoy aparece como "Próximamente").
4. Entrenador de casos (OLL/PLL/F2L al azar).
5. ✅ Publicar en GitHub Pages (repo público `cubos-web`, deploy automático con GitHub Actions).
6. ✅ PWA: instalable en Android, funciona sin conexión, aviso de versión nueva, almacenamiento persistente y exportar/importar tiempos.

Orden de trabajo (cambió después de la 3B): 5 (publicar) → 6 (PWA) → 3C (Roux) → 4 (entrenador).
Trabajar una etapa a la vez; no adelantar etapas sin que se pida.

## Convenciones
- Código limpio y modular: un módulo JS por responsabilidad (timer, inspección, ajustes, scrambles, estadísticas, almacenamiento, UI).
- `timer.js` es una máquina de estados con tabla de transiciones; `stats.js` e `inspection.js` (reglas) son puros.
- Pruebas con `npm test` (node --test, en `tests/`). Los datos guardados se normalizan al cargar: no romper datos viejos.
- Métodos: los datos van en `src/data/` (sin DOM); `case-card.js` es la tarjeta reutilizable y `methods.js` arma las páginas.
  - Los algoritmos usan notación estándar con la última capa en U; un `(U)` al inicio es el giro previo para ver el caso en la orientación estándar.
  - El cubo se muestra con el amarillo arriba (`z2` como estado final) y máscaras propias de stickering en `src/data/stickering.js`.
  - Todo algoritmo nuevo tiene que pasar `npm run verify-algs` (KPuzzle de cubing.js). Cómo se verifica cada parte:
    - PLL y OLL: contra referencias independientes de la wiki de SpeedSolving (`scripts/pll-reference.js`, `scripts/oll-reference.js`), y todos los casos tienen que ser distintos.
    - F2L: cada caso guarda `corner`/`edge` (dónde está cada pieza) y `pair` (la parte que arma el par); el script comprueba las dos cosas y que los 41 casos sean distintos (= están todos). El slot es siempre el de adelante a la derecha y los algoritmos no usan rotaciones.
    - Cruz: `scripts/lib/cross-solver.js` recorre las 190.080 posiciones de la cruz; los ejemplos tienen que ser óptimos. Las mezclas se hacen con blanco arriba y verde al frente, y se resuelve después de `z2`.
  - Para verificar que el verificador sirve: romper algo a propósito y comprobar que falla.
- Deploy: `.github/workflows/deploy.yml` corre en cada push a `main`: `npm ci` → `npm test` → `npm run verify-algs` → `npm run build` → publica `dist/`. Si un paso falla, no se publica (queda la versión anterior). También se puede lanzar a mano desde la pestaña Actions.
- Build (`vite.config.js`): `base: '/cubos-web/'`. Para que el worker de scrambles de cubing.js funcione en el build:
  - `cubing/scramble` y `cubing/twisty` se importan con `import()` dinámico (nunca estático): su código no puede quedar en el archivo principal, porque el worker lo importaría junto con la interfaz (que usa `document`).
  - `modulePreload: false`, `cssCodeSplit: false` y el ayudante `preload-helper` de Vite en su propio archivo (`codeSplitting.groups`).
  - `setSearchDebug({ prioritizeEsbuildWorkaroundForWorkerInstantiation: true })` evita un 404 al arrancar el worker.
  - Antes de publicar algo que toque cubing.js, probar el build con `npm run build` + `npm run preview` (el servidor de desarrollo no muestra estos problemas).
- PWA (`vite-plugin-pwa`, configurada en `vite.config.js`; registro y aviso en `src/pwa.js`):
  - Manifest con `start_url`, `scope` e `id` = `/cubos-web/`. Íconos propios: `public/icon.svg` y `public/icon-maskable.svg`; los PNG se regeneran con `npm run icons`.
  - El service worker guarda en caché TODO el build (incluidos los workers y archivos de cubing.js). Si se agregan otros tipos de archivo, sumarlos a `globPatterns`.
  - `registerType: 'prompt'`: la página NUNCA se recarga sola. Aparece "Hay una versión nueva — Actualizar"; el aviso se oculta durante inspección/resolución y el botón solo recarga si el timer está quieto (`isTimerIdle` en ui.js).
  - Datos: se pide `navigator.storage.persist()`; en Ajustes, "Exportar/Importar tiempos" (`src/transfer.js`, formato `cubos-web/tiempos` v1). Al importar no se duplican tiempos (mismo id, o mismo tiempo y fecha).
- Comentarios breves en español.
- Diseño oscuro, moderno, con acentos en los 6 colores del cubo. Debe funcionar bien en celular.
- Explicar los cambios en español; el usuario está aprendiendo.
