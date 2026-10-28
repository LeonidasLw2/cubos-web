# Cubos Web

Página web de speedcubing: timer, scrambles y guías de métodos para cubos de Rubik.

## Stack
- Vite + JavaScript (sin framework) + CSS.
- Librería `cubing.js` para scrambles (`randomScrambleForEvent`) y visualización (`<twisty-player>`).
- Datos guardados en `localStorage` (no hay servidor).
- Publicada en GitHub Pages: https://leonidaslw2.github.io/cubos-web/ (repo público https://github.com/LeonidasLw2/cubos-web).
  - En local también vive en la subcarpeta: http://localhost:5173/cubos-web/ (dev) y http://localhost:4173/cubos-web/ (`npm run preview`, sirve el build).

## Categorías del timer (IDs WCA de cubing.js + eventos adicionales)
2x2 `222` · 3x3 `333` · 4x4 `444` · 5x5 `555` · 7x7 `777` · Megaminx `minx` · Pyraminx `pyram` · Mirror Cube `mirror` (no oficial WCA, genera mezclas con scrambler de 3x3)

## Etapas
1. ✅ Timer: categorías, scrambles, barra espaciadora / toque, historial, mejor, ao5, ao12 (regla WCA), +2/DNF, localStorage.
   - La visualización 2D del scramble (`<twisty-player>`) también quedó hecha en esta etapa (las 7 categorías tienen vista 2D).
   - Estadísticas ampliadas: peor, media, cantidad de DNF, mejor ao5/ao12 de la sesión, fecha de cada tiempo.
2. ✅ Inspección de 15 s (reglas WCA: +2 entre 15 y 17 s, DNF después; avisos a los 8 y 12 s) y panel de ajustes.
3. ✅ Métodos, ordenados por puzzle (`#/metodos/2x2|3x3|4x4/...`), con casos animados:
   - ✅ 3A: navegación (router con hash), tarjeta de caso reutilizable, método principiante y PLL (21 casos).
   - ✅ 3B: CFOP cruz (consejos + ejemplos óptimos), F2L (41 casos con la idea de cada uno), OLL (57 casos por forma + OLL en 2 pasos).
   - ✅ 3C: Roux (bloques con ejemplos, CMLL 42 casos, LSE) y comparación CFOP vs Roux.
   - ✅ 2x2: principiante, Ortega (primera cara, OLL 7, PBL 5) y CLL (42); EG solo se menciona.
   - ✅ 4x4: notación, reducción (centros, aristas, 3x3, paridad de OLL y de PLL) y Yau.
4. ✅ Entrenador de casos (`#/entrenar`): PLL, OLL, F2L, CMLL, OLL 2x2 y PBL; caso al azar con su mezcla, timer y tiempos por caso.
5. ✅ Publicar en GitHub Pages (repo público `cubos-web`, deploy automático con GitHub Actions).
6. ✅ PWA: instalable en Android, funciona sin conexión, aviso de versión nueva, almacenamiento persistente y exportar/importar tiempos.
- ✅ Navegación: botones Atrás/Adelante propios (`nav-history.js`, con número de entrada en `history.state`), scroll restaurado y, en la app instalada, "atrás dos veces para salir". Migas de pan en Métodos; las rutas viejas (`#/metodos/cfop/...`) redirigen.
7. ✅ Mirror Cube 3x3 (Mirror Blocks): modelo geométrico sin DOM con grosores asimétricos por capa (`src/data/mirror.js`), visor Three.js (`src/twisty/mirrorViewer.js`) con materiales metálicos plateado y dorado + red desplegada 2D en SVG, categoría independiente `mirror` en Timer, guía de principiante adaptada por alturas y rasantes en `#/metodos/mirror` con botón "Ver con colores", catálogo interactivo de notación en `#/notacion/mirror` (la sección Solver, incluido el modo "Deshacer mezcla" del Mirror, se eliminó: ver la etapa 8).

8. ✅ Se eliminó por completo la sección Solver (`#/solver`, su motor, validador, worker, estilos y tests). Las rutas `#/solver/*` redirigen al Timer. La navegación queda en 4 ítems: móvil Timer, Métodos, Entrenar y Más (Notación, Ajustes y Cuenta van en "Más"); escritorio Timer, Métodos, Notación y Entrenar. Los datos guardados no se tocan (la clave `cubos-web:solver-prefs` y `solverPrefs` en `cloud-sync.js` quedan por compatibilidad). No confundir con el solver de cubing.js que usan el Entrenador (`case-scramble.js`) y `scripts/lib/cross-solver.js`.

Todas las etapas pedidas están hechas. Trabajar una etapa a la vez; no adelantar etapas sin que se pida.

## Convenciones
- Código limpio y modular: un módulo JS por responsabilidad (timer, inspección, ajustes, scrambles, estadísticas, almacenamiento, UI).
- `timer.js` es una máquina de estados con tabla de transiciones; `stats.js` e `inspection.js` (reglas) son puros.
- Pruebas con `npm test` (node --test, en `tests/`). Los datos guardados se normalizan al cargar: no romper datos viejos.
- Métodos: los datos van en `src/data/` (sin DOM); `case-card.js` es la tarjeta reutilizable y `methods.js` arma las páginas.
  - El árbol de páginas está en `src/data/method-pages.js` (clave = ruta después de `#/metodos/`); las migas salen de la clave. Una página nueva: agregarla ahí y en `PAGES` de `methods.js`.
  - La tarjeta recibe `puzzle` ('2x2x2', '3x3x3' o '4x4x4'). Máscaras de 2x2 y 4x4 también en `stickering.js` (4x4: `mask4`, alas blancas/del medio/amarillas).
  - Los algoritmos usan notación estándar con la última capa en U; un `(U)` al inicio es el giro previo para ver el caso en la orientación estándar.
  - El cubo se muestra con el amarillo arriba (`z2` como estado final) y máscaras propias de stickering en `src/data/stickering.js`.
  - Todo algoritmo nuevo tiene que pasar `npm run verify-algs` (KPuzzle de cubing.js). Cómo se verifica cada parte:
    - PLL y OLL: contra referencias independientes de la wiki de SpeedSolving (`scripts/pll-reference.js`, `scripts/oll-reference.js`), y todos los casos tienen que ser distintos.
    - F2L: cada caso guarda `corner`/`edge` (dónde está cada pieza) y `pair` (la parte que arma el par); el script comprueba las dos cosas y que los 41 casos sean distintos (= están todos). El slot es siempre el de adelante a la derecha y los algoritmos no usan rotaciones.
    - Cruz: `scripts/lib/cross-solver.js` recorre las 190.080 posiciones de la cruz; los ejemplos tienen que ser óptimos. Las mezclas se hacen con blanco arriba y verde al frente, y se resuelve después de `z2`.
    - Roux: bloques y LSE con condiciones del paso (qué tiene que estar armado antes y después); CMLL agrupado comparando la orientación de esquinas con OLL 21-27, 42 casos distintos.
    - 2x2: KPuzzle de 2x2 (cualquier rotación del cubo cuenta como resuelto); CLL 42 distintos, OLL 7 grupos, PBL 5 tipos.
    - 4x4 (`scripts/lib/cube4x4.js`): los 4 centros de un color son iguales, así que se compara por colores; las parejas de alas se calculan solas. Las paridades se prueban contra casos armados a mano y viendo el 4x4 reducido como un 3x3 (orientación y paridad de permutación).
    - Entrenador: `src/case-scramble.js` arma mezclas reales (estado del caso con las partes que no importan al azar + 5 giros al azar + el solver de cubing.js). verify-algs genera una por caso y comprueba que lleve al caso (con los 4 giros de U) y que haya salido del solver. El respaldo (algoritmo al revés) también se comprueba.
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
  - El archivo exportado puede traer `trainer` (tiempos del entrenador, `src/trainer-store.js`); las versiones viejas lo ignoran, por eso sigue siendo v1.
- Entrenador: `trainer.js` (interfaz, se carga recién al abrir la pestaña) usa `createTimer` sin inspección; `trainer-store.js` es puro (normalizar, agregar, estadísticas, juntar). Guarda en `cubos-web:trainer`.
- Inspección y avisos (`inspection.js`): el momento de cada aviso sale del tiempo real transcurrido (performance.now() en el bucle del timer), nunca del número en pantalla. Regresivo: a los 8 s muestra 7; progresivo: muestra 8 (ajuste "Contador"). Avisos: voz / pitidos / ninguno.
  - La voz tarda en arrancar (en Android, mucho): se elige una voz local en español al abrir la app, se "calienta" con una frase muda al empezar la inspección, las frases son cortas ("ocho", "doce"), y se llama antes lo que tarda en este dispositivo (mediana de las últimas mediciones de onstart, guardadas en `cubos-web:voice-latency`, tope 1,5 s). El aviso visual sigue a los 8,0 y 12,0 s exactos.
- Diseño: fuentes propias en `src/fonts.css` (Space Grotesk para títulos, JetBrains Mono para tiempos, solo "latin"; la PWA las guarda en caché). `cube-art.js` dibuja cubos isométricos en SVG (portadas, estado vacío, "Resolviendo"). `sparkline.js` (puro) arma la mini gráfica. Las animaciones son solo CSS (el anillo de la inspección también): nada que trabe el hilo principal mientras corre el timer.
- CSS (rediseño visual, rama `rediseno-visual`; criterios en `DESIGN.md`): `src/style.css` ya no existe, se divide en `src/styles/` (tokens, base, components, topbar-nav, timer, methods, notation, trainer, dialogs y `overrides.css`). El orden de los imports en `main.js` importa: `overrides.css` va al final (pantalla táctil de 48 px, `prefers-reduced-motion`, espacio de la barra inferior y modo horizontal) para ganarle a los demás.
  - `node scripts/check-css-migration.js` compara contra el `style.css` original (commit 25a2087) y falla si falta algún selector, `@keyframes` o `@media`. Lo que se borre a propósito va en `BORRADOS` dentro del script, con su motivo (ya están ahí los selectores de `solver.css`, por la eliminación del Solver).
  - Celular: barra inferior de 64 px + área segura (`--bottom-nav-height`), áreas táctiles de 48 px, sheets con handle de 32×4 px y 28 px de esquina, `100dvh`. En ≤600 px el cubo de la mezcla va plegado (`#toggle-preview`); en horizontal (`orientation: landscape` + `max-height: 500px`) el timer va a la izquierda y se oculta la vista 2D.
  - El tamaño del tiempo grande lo decide `showTimerText()` en `ui.js` (clase `.is-long` para más de 7 caracteres o DNF) al cambiar de estado, nunca en el bucle del timer.
  - Solo animar `transform` y `opacity` (los skeletons usan opacidad); `backdrop-filter` solo en header, barra inferior y sheets.
- Comentarios breves en español.
- Diseño oscuro, moderno, con acentos en los 6 colores del cubo. Debe funcionar bien en celular.
- Explicar los cambios en español; el usuario está aprendiendo.

## Uso eficiente del agente (ahorrar cupo)
- No leer `node_modules/`, `dist/`, `package-lock.json` ni imágenes, salvo que se pida.
- Buscar con grep antes de abrir archivos; leer solo las partes necesarias, sobre todo en los archivos largos (`style.css`, `methods.js`).
- No sacar capturas del navegador salvo en la revisión final o si se pide.
- Si un comando o test falla 2 veces seguidas por lo mismo, frenar y explicar el problema en vez de reintentar.
- Respuestas finales breves: qué cambió y qué tiene que probar el usuario.
