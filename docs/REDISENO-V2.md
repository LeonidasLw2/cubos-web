# Rediseño visual v2 — guía para agentes (Claude Code, Codex u otro)

Rama de trabajo: `rediseno-v2` (solo local). **Nunca push, nunca merge, nunca tocar `main`.**
Escrito el 2026-10-29 a partir del prompt original de Leo. Si algo de acá choca con lo que medís o ves en el código, no lo fuerces: anotalo en el reporte.

## 1. Objetivo
Rediseñar desde cero la interfaz visual de CubeSolver para que se vea elegante, refinada y profesional, con la calidad de las mejores apps de Apple, en web de escritorio, web móvil y PWA instalada en Android. Es un REDISEÑO VISUAL: la lógica, los datos, las rutas y las funciones no cambian.
"Calidad Apple" significa principios, no copia: claridad, jerarquía por tamaño y peso, mucho aire, paleta contenida, profundidad sutil, movimiento con resorte. No clones pantallas, controles ni marcas de Apple. No uses la tipografía San Francisco.

## 2. Cómo retomar (hacelo SIEMPRE primero)
1. `git branch --show-current` tiene que decir `rediseno-v2`. Si no, frená y avisá.
2. `git status` y `git log --oneline -8`. Si hay cambios sin commitear de una fase anterior, revisalos y TERMINÁ esa fase antes de empezar otra (pasan los chequeos → commiteá).
3. Leé `CLAUDE.md`, `DESIGN.md`, este archivo y `docs/REPORTES-REDISENO.md` (si existe).
4. Estado conocido al escribir esto: Fase 0 hecha (maquetas, commit `54a3643`). La Fase 1 la hizo Claude Code (commit `72eace9`): tokens de la dirección A, Inter local (licencia OFL en `public/licenses/`), componentes base y `scripts/smoke-ui.mjs`. Quedan tres pendientes de la Fase 1 que SOLO hacés si el prompt de Leo los autoriza expresamente: (a) retirar `scripts/check-css-migration.js` y sus menciones en `CLAUDE.md` (queda reemplazado por `smoke-ui`); (b) partir los centésimos del timer en un `<span>` gris (ver sección 4); (c) agregar `playwright-core` como devDependency para poder correr `smoke-ui`. Lo que el prompt no autorice, no lo hagas.
5. Esta rama no tiene remoto: NO hagas `git pull` ni `git push`.
6. Fases pendientes: las de la sección 6. Una por vez, en orden.

## 3. Producto y marca
Timer de speedcubing: inspección WCA de 15 s, mezclas con cubing.js, historial y estadísticas (ao5, ao12), guías de Métodos con casos animados (`<twisty-player>`), Notación, Entrenador de casos, Mirror Cube, cuenta con Google con sincronización, PWA que funciona sin conexión.
Usuarios: cuberos, sobre todo en celular, con el pulgar y mirando poco la pantalla mientras resuelven. Lo principal: el timer se lee de un vistazo y es imposible tocarlo mal.
Marca: CubeSolver; logo = cubo con la bandera argentina (conservarlo; si se refina, que siga reconocible).
Navegación: móvil con barra inferior de 4 ítems (Timer, Métodos, Entrenar, Más); escritorio con pestañas arriba (Timer, Métodos, Notación, Entrenar). El aviso de actualización de la PWA va ARRIBA, no abajo.
Rutas: `#/timer`, `#/metodos/...`, `#/notacion/...` (incluida mirror), `#/entrenar`, y los sheets/diálogos de Ajustes y Cuenta. No existe sección Solver (se eliminó).

## 4. Dirección elegida: A "Instrumento" (+ ajustes de Leo)
Referencia visual: `design-explorations/a-timer.html` (maqueta aprobada, commit `54a3643`; leé su CSS para los valores). La fuente de verdad de los valores finales es `src/styles/tokens.css`.
- Concepto: el timer es un instrumento de precisión. Los números flotan sobre el fondo, sin tarjeta; la jerarquía sale del tamaño y del peso.
- Paleta: grafito neutro + UN acento, el celeste `#74acdf` (celeste de la bandera). **Ajuste de Leo: fondo más oscuro que la maqueta, cercano al negro** (aprovecha OLED en Android) sin perder las capas de profundidad. Los 6 colores del cubo solo donde representan el cubo.
- Tipografía: Inter variable empaquetada localmente (OFL, licencia en `public/licenses/`), una sola familia. **Dígitos del timer con peso mínimo 300 (nunca 200)**, cifras tabulares (`font-variant-numeric: tabular-nums`), centésimos en gris secundario. Para los centésimos hay que partir el texto en dos `<span>` en `ui.js` (3 puntos de escritura, incluido el bucle del timer) y en `trainer.js`: hacelo con UN solo helper que crea los spans una sola vez y por fotograma solo actualiza el `textContent` de cada uno (sin crear nodos); no cambies la lógica de `.is-long` ni lo que lee un lector de pantalla; medí el costo por fotograma. Solo si el prompt de Leo lo autoriza.
- Forma: radios 10, 16 y 24 px, chips en píldora. Squircle (`corner-shape`) SOLO con `@supports`, nunca como dependencia.
- Movimiento: resorte con `linear()`, solo `transform` y `opacity`. Al apretar el timer, los dígitos se tiñen de acento y una barra se estira debajo.
- Zona táctil del timer: **grande y evidente aunque no tenga tarjeta** (por ejemplo un fondo o borde apenas visible que se ilumina al apretar), mínimo 48 px, visible en reposo y apretado.
- Íconos: un único set coherente en SVG inline, solo los usados (Lucide o Phosphor). Nada de emojis como íconos.
- Evitar: neón, degradados recargados, vidrio en todos lados, tarjetas idénticas para todo, dos acentos compitiendo, "azul marino con celeste y brillo".
- Contrastes de referencia de la maqueta (recalcular con los tokens finales): texto 17,95:1, secundario 7,61:1, chip activo vs inactivo 6,90:1.
- Android: respetá sus convenciones (gesto de atrás, barra de estado integrada con `theme-color` coherente, áreas táctiles de 48 px). Que no se sienta una app de iOS pegada en Android.

## 5. Restricciones no negociables
Lógica y datos
- No toques lógica JS. Si cambiás markup, conservá todos los ids, data-attributes y clases que usa el JS (hacé grep antes de renombrar: `data-state`, `.is-long`, `aria-expanded`, `#toggle-preview`, etc.).
- No cambies claves ni formato de `localStorage`, ni `cloud-sync.js`, `firebase-config.js` ni `firestore.rules`.
- Un solo `<twisty-player>` por contenedor; NUNCA lo muevas ni lo re-adjuntes (bug de cubing.js que duplica canvas). `display:none` sí es seguro.
- El texto de la mezcla siempre visible. A 360×640 en vertical, el timer y su zona táctil completos SIN scroll.
Android y táctil
- Deslizar hacia abajo en el timer NO debe disparar el pull-to-refresh de Chrome Android ni el zoom: revisá `overscroll-behavior`, `touch-action`, `user-select` y `-webkit-tap-highlight-color` (grep primero: puede estar resuelto).
- Probá además 360×800 y 412×915. Safe-area (`env(safe-area-inset-*)`) en todo lo fijo.
Rendimiento y accesibilidad
- CLS = 0 en el Timer: reservá el alto de todo lo que llega tarde (categorías, mezcla, estadísticas) y las fuentes con fallback de métricas parecidas.
- Animá solo `transform` y `opacity`. `backdrop-filter` solo en header, barra inferior y sheets. Nada que trabe el hilo principal mientras corre el timer.
- `prefers-reduced-motion` respetado y probado con Playwright (`page.emulateMedia({ reducedMotion: 'reduce' })`), no inyectando reglas.
- Contraste calculado, no estimado: texto 4,5:1; componentes de UI y estado seleccionado 3:1 contra su vecino no seleccionado. `tests/design-tokens.test.js` cubre los tokens. No escribas "supera AAA" salvo que dé ≥7:1.
- `:hover` solo dentro de `@media (hover: hover)`. `:focus-visible` visible en todo lo interactivo. Estados definidos: normal, hover, focus, active, disabled, cargando, error, vacío, sin conexión.
- Cero desborde horizontal en todas las rutas y anchos: medí `scrollWidth`; no uses `overflow-x:hidden` para esconderlo.
PWA y archivos
- Todo funciona sin conexión: fuentes e íconos empaquetados localmente (subset latin). Presupuesto: máximo 120 KB de fuentes nuevas. Prohibido cargar fuentes o recursos desde un CDN.
- Si cambiás `theme-color`, `background_color` o íconos, hacelo coherente en `index.html`, `vite.config.js` y `public/` (los PNG con `npm run icons`).
Alcance
- Solo tema oscuro. Escritorio real a partir de 861 px: layout pensado para pantalla ancha, no el móvil estirado, con ancho máximo cómodo; la barra espaciadora sigue funcionando. Revisá también tablet (768 a 1024 px) y celular horizontal (667×375).

## 6. Fases pendientes
**Fase 2 — Timer.** Todos los estados (reposo, inspección, corriendo, resultado, +2, DNF, generando mezcla, error) en vertical, horizontal, tablet y escritorio. Categorías, mezcla con vista plegable, estadísticas, historial, anillo de inspección, mini gráfica. Es la pantalla que define el producto: dedicale el mayor esfuerzo.
**Fase 3 — Métodos y Notación.** Portadas, árbol de páginas, tarjetas de caso, migas de pan (con color de enlace y subrayado), catálogo de notación, Mirror (guía y notación).
**Fase 4 — Entrenar, Mirror, Ajustes y Cuenta.** Entrenador, sheets de Ajustes y Cuenta (con teclado abierto), menú Más, estados vacíos, mensajes de sin conexión y de actualización.
**Fase 5 — Pulido y verificación final.**
- Movimiento y microinteracciones coherentes en toda la app.
- Lighthouse móvil sobre la build real (`npm run build` + `npm run preview`) comparado con `main`: Accessibility, Best Practices y SEO sin bajar; CLS 0; Performance sin empeorar.
- reduced-motion real; sheets sin hueco inferior con la animación terminada.
- Máximo 8 capturas "antes | después" a 390×844, solo de las pantallas principales (guardalas fuera del repo).
- Actualizá `DESIGN.md` (v2) y `CLAUDE.md` (convenciones de CSS y diseño) sin borrar lo que no cambió. La dirección A tiene que quedar descrita en detalle en `DESIGN.md` (paleta, tipografía, formas, movimiento, timer) para que cualquier agente pueda seguirla.
- Listá cualquier diferencia no intencional respecto de `main`.
- Dejá constancia de que falta la prueba en un Android real (Leo la hace antes de cualquier merge).

## 7. Chequeos al cerrar cada fase
`npm test` · `npm run verify-algs` · `npm run build` · `node scripts/smoke-ui.mjs` (recorre 10 rutas en 7 tamaños, de 360×640 a 1280×800, y ejercita el flujo del timer con teclado; tarda más de 2 minutos). Cómo correrlo: `npm run build`, luego `npm run preview` en segundo plano (puerto 4173; cerralo al terminar) y después el script. Usa `playwright-core` con el Google Chrome instalado en la Mac (`channel: 'chrome'`). Si `playwright-core` falta en `node_modules` y el prompt de Leo autorizó agregarlo, instalalo con `npm i -D playwright-core` (no descarga navegadores). Si aun así `smoke-ui` NO se puede ejecutar, es un BLOQUEO: no sigas diseñando a ciegas; frená (en modo desatendido: `ESTADO FINAL: DETENIDO`, con el motivo). No cubre el flujo táctil: eso lo prueba Leo en su Android. Todos tienen que pasar y el smoke tiene que dar 0 errores de consola y 0 px de desborde. Después: commit con mensaje `feat(design): fase N - ...`.

## 8. Modos de ejecución
**Modo A — con pausas (valor por defecto).** Al terminar cada fase: chequeos, commit, resumen de máximo 15 líneas y PAUSA hasta que Leo escriba "Confirmado, seguí con la Fase N".
**Modo B — desatendido.** Solo si el prompt de Leo dice explícitamente "MODO DESATENDIDO". Leo no está; nadie va a contestar preguntas. Reglas:
1. Ejecutá las fases pendientes en orden. No preguntes: ante una decisión ambigua elegí la opción más conservadora y más fiel a la maqueta A, y anotala en el reporte.
2. Antes de empezar cada fase, el árbol de trabajo tiene que estar limpio (todo commiteado).
3. Dentro de cada fase, commiteá seguido con prefijo `wip(design): ...` en puntos estables, para que un corte por cupo no pierda trabajo.
4. Al cerrar cada fase: chequeos de la sección 7 y commit final `feat(design): fase N - ...`. Agregá el reporte (formato de la sección 10) a `docs/REPORTES-REDISENO.md` y commiteálo.
5. Pasá a la fase siguiente SOLO si todos los chequeos pasan y el reporte no tiene riesgos bloqueantes. Si no: frená, escribí en el reporte qué falló y qué intentaste, y no sigas.
6. Máximo 2 intentos por el mismo problema. Si no se resuelve, dejá nota en el reporte y frená (o seguí con otra tarea de la fase que no dependa de eso, si existe).
7. Pocas capturas: ninguna salvo las de la Fase 5. No leas `node_modules`, `dist` ni `package-lock.json`; usá grep antes de abrir archivos.
8. Al terminar todo, o al frenar, escribí al final de `docs/REPORTES-REDISENO.md` una línea `ESTADO FINAL: COMPLETO` o `ESTADO FINAL: DETENIDO en Fase N por <motivo>`, con el árbol de trabajo limpio.

## 9. Prohibiciones absolutas (en cualquier modo)
- `git push`, `git merge`, `git pull`, cambiar de rama, tocar `main`, borrar ramas, reescribir historia (`rebase`, `reset --hard`, `commit --amend` sobre commits ajenos).
- Tocar sincronización en la nube, Firebase, reglas de Firestore o credenciales. No pegues ni imprimas tokens o claves.
- Agregar o quitar dependencias en `package.json` (la Fase 1 ya dejó Inter local), salvo `playwright-core` como devDependency si el prompt de Leo lo autorizó. Nada de paquetes globales.
- Borrar datos del usuario o cambiar el formato de `localStorage`.
- Cargar recursos externos (CDN) en la app.
- Inventar algoritmos: todo algoritmo nuevo pasa `verify-algs` (en este rediseño no se espera tocar ninguno).

## 10. Formato de cada reporte
Qué hiciste, números medidos (no adjetivos), qué NO verificaste y riesgos. No escribas "visualmente idéntico" ni "sin regresiones" sin medición. Máximo 15 líneas por fase.
