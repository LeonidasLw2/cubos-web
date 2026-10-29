# Plan de Actualización Integral — CubeSolver (`cubos-web`)

Este documento registra el plan de trabajo en fases (A–G) y su estado actual.

## Estado de Fases
- [x] **Fase A:** Barra superior, logo con estética argentina y sistema de diseño.
- [x] **Fase B:** Rediseño de las páginas existentes de Métodos (2x2, 3x3, 4x4).
- [x] **Fase C:** Métodos nuevos por puzzle (5x5, 7x7, Megaminx, Pyraminx + EG y ZZ).
- [x] **Fase D:** Nueva sección de Notación (`#/notacion`) con parser verificable y animaciones.
- [x] **Fase E:** Inicio de sesión (Google / Firebase Auth) y sincronización en la nube (Firestore local-first).
- [x] **Fase F:** (eliminada después, ver "Eliminación de la sección Solver") Nueva sección Solver (`#/solver`) para 2x2, 3x3, 4x4, 5x5 y Pyraminx con verificación KPuzzle.
- [x] **Fase G:** Revisión final integral, tests, build y reporte.

---

## Actualización: Integración del Mirror Cube 3x3
- [x] **Fase 1 (Mirror):** Investigación y modelo geométrico (`src/data/mirror.js` y `tests/mirror.test.js`).
  - *Investigación de `cubing.js`:* Se revisó el catálogo en `node_modules/cubing` (`cubing/puzzles`). La versión instalada (`0.66.1`) **no** incluye Mirror Blocks (solo tiene 3x3x3, 2x2x2, 4x4x4, 5x5x5, 6x6x6, 7x7x7, megaminx, pyraminx, etc.). Las coincidencias de "mirror" son transformaciones de algoritmos de simetría, no geometría de puzzle.
  - *Modelo geométrico:* Se implementó `src/data/mirror.js` con grosores asimétricos por capa (`MIRROR_LAYERS`), cálculo de piezas por estado de KPuzzle 3x3, verificación de cubo perfecto resuelto (`isPerfectCube`), mapeo de giros de capas (`layerTurnForMove`) y proyección 2D (`faceNet`).
  - *Tests:* `tests/mirror.test.js` pasa con 8 pruebas verificando cubo perfecto, rotura de forma tras giros y mezclas, y restauración exacta con algoritmos inversos.
- [x] **Fase 2 (Mirror):** Visor 3D y 2D del Mirror (`src/twisty/mirrorViewer.js` con Three.js) e integración en `playerManager.js`.
  - *Visor 3D y 2D:* Módulo `src/twisty/mirrorViewer.js` con Three.js cargado por `import('three')` dinámico; materiales metálicos plateado y dorado con reflejos (`MeshStandardMaterial`), bordes oscuros finos (`EdgesGeometry`), animación de capas con rotación continua, controles idénticos (play/pausa, paso anterior/siguiente, inicio/fin, velocidad, timestamps), rotación táctil/ratón (`touch-action: none`) y red desplegada 2D vectorial con dimensiones reales y sombreado de profundidad.
  - *Integración en `playerManager.js`:* Enlace transparente para `puzzle: 'mirror'`, reutilización in-place, destrucción limpia al salir o cambiar de vista, y opción `"showColors: true"` ("Ver con colores") para alternar al 3x3 normal de ayuda.
  - *Ajustes:* Opción de color plateado o dorado agregada en `src/settings.js`, `index.html` y `src/ui.js`.
  - *Tests:* `tests/mirror-viewer.test.js` pasa con 6 pruebas verificando montaje 3D/2D, controles de reproducción, reutilización 10 veces sin acumulación de canvas ni fugas, y alternancia con `showColors`.
- [x] **Fase 3 (Mirror):** Timer (categoría `"mirror"`, scrambles de 333, vista previa Mirror, exportar/importar y sincronización en la nube).
  - *Categoría Timer:* Agregado `{ id: 'mirror', name: 'Mirror', puzzle: 'mirror', view: '2D', scrambleEvent: '333' }` a `EVENTS` en `src/scramble.js`. Utiliza scrambles reales de `randomScrambleForEvent('333')`.
  - *Vista previa:* Monta el visor Mirror 3D/2D para previsualizar la mezcla antes de resolver; en celular selecciona vista 2D por defecto y permite alternar a 3D.
  - *Persistencia, importación y nube:* Historial y estadísticas independientes en `cubos-web:solves:mirror`, exportación e importación probadas en `tests/transfer.test.js` con compatibilidad hacia atrás total y sincronización Firestore automática por mapeo de `EVENTS`.
- [x] **Fase 4 (Mirror):** Métodos (`#/metodos/mirror`, reconocimiento por forma, principiante adaptado, portada y `method-pages.js`).
  - *Página de método:* Creada `src/data/mirror-method.js` con los 7 pasos del método principiante adaptados al Mirror Cube (cruz en capa gruesa, esquinas de la base, aristas medias, cruz superior, orientar esquinas, permutar esquinas y permutar aristas) reutilizando los mismos 17 algoritmos verificados de `src/data/beginner.js`.
  - *Guías específicas:* Bloque de identificación por alturas de centros, piezas al ras y grosor, más sección explicativa sobre cómo aplicar CFOP en el Mirror Cube y enlace directo a `#/metodos/3x3/cfop`.
  - *Modal y tarjeta de caso:* Botón interactivo "🎨 Ver con colores / 🪞 Ver Mirror" en la barra de herramientas del modal de animación para comparar inmediatamente la pieza metálica con su sticker de color correspondiente. Miniaturas isométricas metálicas en `src/case-preview.js`.
  - *Navegación y portada:* Tarjeta de Mirror Cube agregada a la grilla de portadas en `#/metodos`, entrada registrada en `src/data/method-pages.js` y `PAGE_METADATA` con chips, estadísticas, consejos y errores comunes específicos.
  - *Verificación:* `scripts/verify-algs.js` verifica todos los casos con KPuzzle (357 casos y 428 algoritmos validados).
- [ ] **Fase 5 (Mirror):** Notación (Mirror en `#/notacion`, animación en visor 3D y probador de secuencias).
- [x] ~~**Fase 6 (Mirror):** Solver (modo "Deshacer mezcla")~~ → descartada: la sección Solver se eliminó.
- [ ] **Fase 7 (Mirror):** Entrenador (casos en Mirror si aplica).
- [ ] **Fase 8 (Mirror):** Revisión final, capturas, tests y build.

---

## Detalle por Fase

### Fase A — Barra superior, logo y sistema de diseño
1. **Logo CubeSolver (bandera argentina):**
   - Cubo 3x3 isométrico en SVG inline en el header, `public/icon.svg` y `public/icon-maskable.svg`.
   - Stickers con franjas celeste (`#74ACDF`) / blanco (`#FFFFFF`) / celeste (`#74ACDF`), Sol de Mayo dorado (`#F6B40E`) estilizado en el centro de la cara frontal y bordes oscuros finos.
   - Regenerar íconos PWA (`192x192`, `512x512`, `maskable`, `apple-touch-icon`) con `scripts/generate-icons.js`.
   - Animación sutil al cargar y en hover respetando `prefers-reduced-motion`.
2. **Nombre:**
   - Eliminar el badge `"PRO"` en HTML, títulos, `vite.config.js` (manifest) y meta tags. Nombre oficial: `"CubeSolver"`.
3. **Barra superior y navegación móvil:**
   - Quitar flechas `‹` `›` (`#nav-back`, `#nav-forward`); usar breadcrumbs para navegación interna.
   - Escritorio: pestañas `Timer`, `Métodos`, `Solver`, `Notación`, `Entrenar` con indicador activo animado deslizante; a la derecha botón de cuenta, indicador de sincronización y botón de ajustes.
   - Móvil: header compacto con logo y botón de cuenta; barra inferior de 5 ítems (`Timer`, `Métodos`, `Solver`, `Entrenar`, `Más`) y bottom sheet para `Notación`, `Ajustes` y `Cuenta`.
   - Actualizar `src/router.js` y `tests/router.test.js` con las rutas `#/solver` y `#/notacion`.

### Fase B — Rediseño de páginas existentes de Métodos
1. **Datos centralizados (`src/data/methods-metadata.js`):**
   - Unificar cifras: 2-look OLL = 10 algoritmos, 2-look PLL = 6 algoritmos, CFOP 2-look = 16 algoritmos.
   - Cambiar tag de CFOP de `"Más rápido"` a `"El más usado"`. Tiempos y movimientos con `~` aproximado.
2. **Progreso de aprendizaje (`src/learned-store.js`):**
   - Persistencia en `localStorage` con `try/catch` y hook para sincronización en la nube.
3. **Componentes reutilizables y visor 3D único:**
   - Hero de página con chips (`white-space: nowrap`) y puzzle 3D animado.
   - UN solo `<twisty-player>` compartido por página (panel/modal) con `experimentalStickering` y carga diferida de `cubing.js`.
   - Miniaturas 2D SVG por tarjeta de caso (diagrama 2D-LL para última capa y vista isométrica 2D para el resto), evitando múltiples contextos WebGL.
   - Grilla de casos con buscador, filtros (grupo, aprendidos/no aprendidos) y barra de progreso.
   - Stepper numerado clickeable, bloques de Consejos / Errores comunes / Requisitos previos y navegación Anterior / Siguiente.

### Fase C — Métodos nuevos por puzzle
1. Portada `#/metodos` con los 7 puzzles (`2x2`, `3x3`, `4x4`, `5x5`, `7x7`, `Megaminx`, `Pyraminx`), comparativa y ruta de aprendizaje en cada página de puzzle.
2. Agregar contenido completo y verificado:
   - **2x2:** Principiante, Ortega, CLL (42 casos) y mención de EG.
   - **3x3:** Principiante, CFOP, Roux completos y tarjeta de ZZ.
   - **4x4:** Reducción (centros, aristas, 3x3, paridades OLL y PLL verificadas) y Yau.
   - **5x5:** Reducción (centros fijos, sin paridad PLL de 4x4, paridad de últimas dos aristas) y Yau5.
   - **7x7:** Reducción para cubos grandes (centros por barras, aristas por grupos, 3x3, paridad de aristas y consejos).
   - **Megaminx:** Método estándar en 6 etapas (Estrella, Primera cara, F2L, S2L, Resto de caras, Última capa en 4 pasos) y mención de OLL/PLL avanzado.
   - **Pyraminx:** Principiante (puntas, centros, primera capa, última capa) + Keyhole, L4E, Top-First y 1-Flip con casos verificables en KPuzzle.

### Fase D — Sección Notación (`#/notacion`)
1. Módulo `src/notation-parser.js` exportable y testeado (`tests/notation.test.js`) para los 7 puzzles (`2x2`, `3x3`, `4x4`, `5x5`, `7x7`, `Pyraminx`, `Megaminx`).
2. UI interactiva con selector de puzzle, intro de caras y sentido de giro, grilla de tarjetas con toggles normal / `'` / `2`, visor `<twisty-player>` compartido (play/pausa, loop, velocidad, reset) y campo `"Probá una secuencia"` con validación en español.

### Fase E — Inicio de sesión y sincronización en la nube
1. `src/firebase-config.js` con configuración vacía documentada y modo degradado limpio (`"Sincronización no configurada"`).
2. `src/cloud-sync.js`: carga diferida de Firebase v9+ modular (`signInWithPopup` con Google + Firestore).
3. Repositorio local-first con UUIDs, `updatedAt`, tombstones (`deleted: true`), fusión por unión (gana `updatedAt` mayor), sincronización incremental por lotes (`writeBatch`) y soporte offline.
4. Menú de cuenta, `firestore.rules`, guía `SETUP-NUBE.md`, nota de privacidad en Ajustes y tests unitarios (`tests/sync.test.js`).

### Fase F — Sección Solver (`#/solver`)
1. Web Worker diferido para `2x2`, `3x3`, `4x4`, `5x5` y `Pyraminx` + modo `"Deshacer mezcla"`.
2. Editor de estado 2D (net + modo cara por cara en 4x4/5x5) y 3D sincronizados, paleta con contador de stickers, orientación WCA (blanco arriba, verde al frente), deshacer/rehacer y carga desde mezcla.
3. Validador matemático previo a resolver con mensajes específicos en español y resaltado de piezas sospechosas.
4. Reproductor paso a paso con lista de movimientos explicados en español, sliders de `"Tiempo entre movimientos"` (0–3 s, paso 0.1 s, defecto 1 s) y `"Velocidad de giro"`, indicador de etapa en 4x4/5x5 y botón `"Practicar en el Timer"`.
5. Verificación obligatoria con KPuzzle (50 estados aleatorios por puzzle + tests de estados imposibles en `tests/solver.test.js`).

### Fase G — Revisión final
1. Verificación visual y funcional de todas las rutas en 390 px y 1440 px, sin errores de consola ni desbordes.
2. Ejecución completa de `vite build`, `node --test tests/*.test.js` y `node scripts/verify-algs.js`.
3. Resumen final detallado.

---

## Diagnóstico confirmado: Bug de cubos diminutos apilados en `<twisty-player>`

### 1. Mediciones en el navegador integrado (`#/metodos/4x4/reduccion` → modal `"Centro opuesto"`, `2R U2 2R'`)
- **Carga inicial de `#/metodos/4x4/reduccion`:**
  - `document.querySelectorAll('twisty-player').length`: `2` (1 oculto en `#scramble-view` del Timer + 1 `sharedPlayer` en `.hero-cube-stage`).
  - `<canvas>` dentro del `sharedPlayer` (`node.shadow`): `1` canvas (`314 × 200 px`).
- **Apertura #1 del modal (`openSharedCaseModal` → `stageEl.innerHTML = ''; stageEl.append(player)`):**
  - Contenedor `#case-modal-stage` (`getBoundingClientRect`): `396 × 240 px`.
  - `<canvas>` dentro del `sharedPlayer`: **`2` canvases** apilados en columna (`396 × 120 px` cada uno).
- **Cierre #1 del modal (`heroHost.innerHTML = ''; heroHost.append(player)`):**
  - `<canvas>` dentro del `sharedPlayer`: **`3` canvases** apilados (`314 × 67 px` cada uno).
- **Apertura #2 del modal:**
  - `<canvas>` dentro del `sharedPlayer`: **`4` canvases** apilados (`396 × 60 px` cada uno).
- **Cierre #2 del modal (o haber navegado antes por `#/metodos/4x4` → `#/metodos/4x4/reduccion` → abrir modal → cambiar de caso):**
  - `<canvas>` dentro del `sharedPlayer`: **`5` canvases** apilados (`48 px` / `40 px` de alto cada uno).
- **Apertura #3 del modal:**
  - `<canvas>` dentro del `sharedPlayer`: **`6` canvases** apilados (`396 × 40 px` cada uno).

### 2. Causa raíz exacta confirmada
1. **Bug interno de `cubing/twisty` (`Twisty3DSceneWrapper.connectedCallback` en `node_modules/cubing/dist/lib/cubing/twisty/index.js:1755`) al mover o re-adjuntar un `<twisty-player>` en el DOM:**
   - A diferencia de `TwistyPlayer[intersectedCallback]` (que tiene guardia `if (this.#alreadyConnected) return;`), su sub-elemento en el Shadow DOM `<twisty-3d-scene-wrapper>` ejecuta en cada `connectedCallback()`:
     ```js
     const vantage = new Twisty3DVantage(this.model, this);
     this.addVantage(vantage);
     ```
     **sin verificar si ya estaba conectado**.
   - Según el estándar de Custom Elements, cada vez que un `<twisty-player>` existente se mueve de un contenedor a otro (p. ej. de `.hero-cube-stage` a `#case-modal-stage` y viceversa en `src/case-card.js`) o se hace `container.innerHTML = ''; container.append(player)` (en `src/case-card.js` y `src/notation.js`), el navegador dispara `connectedCallback()` nuevamente sobre `<twisty-3d-scene-wrapper>`.
   - Cada llamada agrega un nuevo `<twisty-3d-vantage>` (con su propio `<canvas>`) dentro del `.wrapper` (`display: grid`) del mismo `<twisty-player>`. El grid reparte la altura del contenedor entre los $N$ vantages (`height / N`), produciendo 2, 3, 4, 5 o más cubos diminutos apilados en columna.
2. **Recreación innecesaria en `src/solver.js`:**
   - `renderSolverDOM` reconstruía `container.innerHTML` en cada clic de sticker o paso del reproductor y creaba un `<twisty-player>` nuevo cada vez en lugar de preservar el contenedor y reutilizar la misma instancia sin desmontarla.

### 3. Solución arquitectónica (`src/twisty/playerManager.js`)
- Crear un único módulo centralizado `src/twisty/playerManager.js` (`getPlayer(container, opciones)`, `destroyPlayer(container)`, `destroyScopePlayer(scope)`, `updatePlayerOptions(player, opciones)`):
  - **Regla de oro:** Un `<twisty-player>` **NUNCA** se mueve de un contenedor padre a otro ni se desmonta/re-adjunta con `container.innerHTML = ''`.
  - Si `container` ya tiene su `<twisty-player>` montado como hijo directo, `getPlayer(container, opciones)` **lo reutiliza in-place** sin tocar el DOM del padre (solo actualiza propiedades reactivas: `puzzle`, `alg`, `experimentalSetupAlg`, `experimentalSetupAnchor`, `experimentalStickeringMaskOrbits`, `visualization`, `tempoScale`, `cameraLongitude`).
  - Si cambia el puzzle a una geometría distinta (`targetPuzzle !== currentPuzzle`), destruye el anterior limpiamente para evitar colisiones de órbitas o máscaras WebGL.
  - Además, `inspectAndPrunePlayerShadow` aplica un blindaje defensivo sobre la instancia para que nunca pueda acumular más de 1 `<twisty-3d-vantage>` / `<canvas>` en su Shadow DOM.
  - Al cambiar de contenedor dentro de un ámbito (por ejemplo abrir el modal en Métodos), el player anterior se destruye limpiamente (`player.remove()` y `container.replaceChildren()`) y se crea una instancia fresca ligada al nuevo contenedor, garantizando que siempre haya **exactamente 1 `<twisty-player>` y 1 `<canvas>`** en el modal y como máximo 1 player activo por vista.
  - Al cerrar el modal o salir de una sección, `destroyScopePlayer` destruye cualquier reproductor inactivo.

### 4. Verificación y Resultados Confirmados
- **Test automatizado en `tests/player-manager.test.js`:**
  - Valida que `src/twisty/playerManager.js` es el ÚNICO archivo en `src/` que instancia `<twisty-player>`.
  - Verifica la configuración obligatoria por defecto (`hint-facelets="none"`, `back-view="none"`, `control-panel="none"`, `background="none"`).
  - Simula 10 aperturas/cierres y 10 cambios de caso verificando que nunca se acumulan players ni canvases.
- **Suite de verificación en navegador headless (Chrome 1440 px escritorio y 390 px móvil):**
  - 10 aperturas y cierres consecutivos del modal en 4x4 ("Centro opuesto", `2R U2 2R'`): exactamente 1 player y 1 canvas de tamaño completo (>= 220 px) en cada iteración.
  - 10 cambios de caso consecutivos dentro del modal: reutilización in-place sin duplicación.
  - Controles de reproducción (inicio, paso anterior, play/pausa, paso siguiente, velocidad, cámara trasera "Ver desde atrás" con `cameraLongitude`, toggle 3D/2D y rotación arrastrando con ratón/touch): funcionamiento verificado.
  - Los 7 puzzles (`2x2`, `3x3`, `4x4`, `5x5`, `7x7`, `Megaminx`, `Pyraminx`) verificados en Métodos, Notación, Solver y Timer.
  - **0 errores en consola** en toda la ejecución.
- **Capturas visuales comparativas:**
  - Antes (`before-4x4-centro-opuesto.png`): 5 cubos diminutos apilados verticalmente de 40 px de altura.
  - Después (`after-4x4-centro-opuesto.png`): 1 único cubo grande, nítido y centrado con tamaño responsive de 320 px.

---

## Tareas Pendientes Registradas
- ~~**Solver — Optimización de TBT en móvil**~~ → **Resuelto por eliminación**: la sección Solver se borró por completo, así que ya no hay motor de búsqueda ni TBT de ~10 s que optimizar. Contexto original: durante la auditoría de Lighthouse de la Fase 1 del rediseño visual se detectó un Total Blocking Time (TBT) de ~10 s en `#/solver` en móvil, originado por la ejecución e inicialización matemática del motor del solver en el hilo principal (`solver-worker.js` / tablas de pruning). Queda registrado como tarea pendiente de arquitectura/lógica para aislar completamente el cómputo y no trabar la carga inicial. En el rediseño visual nos aseguramos de no empeorar el rendimiento respecto al "antes".


### Fase 1 — Investigación y modelo geométrico (`src/data/mirror.js`)
- Verificado en `node_modules/cubing`: `cubing.js` no cuenta con soporte nativo para Mirror Cube (Mirror Blocks).
- Implementado modelo geométrico en `src/data/mirror.js` con grosores asimétricos por capa (`x: [0.75, 1.0, 1.25]`, `y: [0.7, 1.0, 1.3]`, `z: [0.8, 1.0, 1.2]`).
- Funciones puras: `piecesFromPattern(patternData)`, `isPerfectCube(pieces)`, `faceLevels(pieces)`, `layerTurnForMove(move)`, `pieceInTurn(piece, turn)`, `faceNet(pieces)`.
- Tests en `tests/mirror.test.js`: cubo perfecto resuelto, conservación tras algoritmo e inverso, detección de no-plano en estado mezclado.

### Fase 2 — Visor 3D y 2D del Mirror (`src/twisty/mirrorViewer.js`)
- Carga dinámica asíncrona de Three.js (`import('three')`).
- Material plateado reflectante (`#d8dce2`) y dorado (`#d4af37`), bordes oscuros finos (`EdgesGeometry`), animación suave por capas a 60 fps con interpolación cúbica, rotación orbital con ratón y táctil (`touch-action: none`).
- Vista 2D con red desplegada en SVG proporcional y sombreado de profundidad según desplazamiento relativo a los centros.
- Integrado con `src/twisty/playerManager.js` gestionando `puzzle: 'mirror'`, soporte de "Ver con colores (ayuda)" y ciclo de vida de instancia única.

### Fase 3 — Timer (`src/scramble.js`, `src/ui.js`, `src/storage.js`)
- Categoría `mirror` añadida a `EVENTS` con scrambler `randomScrambleForEvent('333')`.
- Vista previa del scramble adaptada (2D por defecto en dispositivos táctiles/móviles).
- Almacenamiento aislado e historial independiente (`cubos-web:solves:mirror`).
- Tests de compatibilidad hacia atrás en exportación e importación (`tests/transfer.test.js`).

### Fase 4 — Métodos (`#/metodos/mirror`)
- Creada guía de principiante adaptada (`src/data/mirror-method.js`) con los 17 algoritmos estándar de 3x3 y criterios de reconocimiento por rasante/alturas.
- Explicación de compatibilidad con CFOP y tarjeta en la portada de métodos (`#/metodos`).
- Modal interactivo con visor Mirror y botón de alternancia "Ver con colores / Ver Mirror".

### Fase 5 — Notación (`#/notacion/mirror`)
- Registrado `mirror` en `PUZZLE_ALIASES`, `PUZZLE_NOTATION_SPECS` y validador de giros (`src/notation-parser.js`).
- Agregado chip de Mirror en selector de notación (`src/notation.js`).
- "Probá una secuencia" soporta validación, reproducción en visor Mirror y cálculo de inversa.
- Tests completos en `tests/notation.test.js`.

### Fase 6 — Solver (`#/solver/mirror`)
- Registrado Mirror en `SOLVER_PUZZLES` de `src/solver-engine.js` y `src/solver.js`.
- Modo exclusivo "Deshacer mezcla" para Mirror, evitando editores de stickers de colores incongruentes con la naturaleza monocolor del cubo.
- Integrado selector de mezclas recientes desde el historial del Timer (`loadSolves('mirror')`) y generación aleatoria.
- Reproducción paso a paso sobre el visor 3D del Mirror con descripciones de movimiento en español y controles de reproducción.
- Tests en `tests/solver.test.js`.

### Fase 7 — Entrenador (`#/entrenar`)
- Evaluación: El entrenador actual de `cubos-web` está diseñado exclusivamente para sub-conjuntos aislados de última capa o pares de CFOP/Roux/Ortega (PLL, OLL, F2L, CMLL, OLL 2x2, PBL), utilizando solvers de búsqueda inversa (`realCaseScramble` con `experimentalSolve3x3x3IgnoringCenters`) y máscaras de stickers (`STICKERING`) que atenúan piezas irrelevantes.
- En el Mirror Cube principiante, los casos abarcan 7 pasos progresivos capa por capa (desde cruz hasta aristas finales) donde cada etapa requiere que las anteriores ya estén resueltas. Además, al ser monocolor, las máscaras de stickers 3D no aplican.
- Siguiendo la pauta explícita del usuario (*"Si no es simple, dejalo fuera y explicalo"*), se decidió dejarlo fuera de `#/entrenar` para no desvirtuar la arquitectura de `case-scramble` ni romper las metas de `verify-algs`. En su lugar, todos los casos del método principiante de Mirror cuentan con práctica interactiva 3D completa en `#/metodos/mirror`.

### Fase 8 — Revisión final y verificación en navegador
- `npm test`: 116/116 tests pasando sin errores.
- `npm run verify-algs`: 357 casos, 428 algoritmos y 3152 comprobaciones aprobadas con KPuzzle.
- `npm run build`: compilación limpia en 974 ms, bundle PWA de 72 entradas y chunk dinámico optimizado para Three.js.
- Verificación en Chrome headless (1440 px y 390 px):
  - Timer: categoría Mirror funcional, visor único, 2D responsive en móvil.
  - Métodos: tarjeta en portada, guía completa en `#/metodos/mirror` con 7 pasos, modal interactivo y alternancia de colores ("Ver con colores").
  - Notación: catálogo completo en `#/notacion/mirror`, probador de secuencias animado en visor Mirror y cálculo de inversa.
  - Solver: modo "Deshacer mezcla" exclusivo para Mirror, selector de mezclas del historial del Timer y reproducción paso a paso.
  - Sin errores de consola (0 errores).
  - Capturas generadas: `mirror-solved.png` (cubo resuelto perfecto), `mirror-scrambled.png` (figura irregular mezclada) y `mirror-midturn.png` (giro de capa en progreso).






## Eliminación de la sección Solver
- Se borraron `src/solver.js`, `solver-engine.js`, `solver-validator.js`, `solver-worker.js`, `src/styles/solver.css` y `tests/solver.test.js` (7 tests), y la ruta `#/solver/*` (ahora redirige al Timer).
- La barra inferior móvil pasó de 5 a 4 ítems (Timer, Métodos, Entrenar, Más); la de escritorio quedó en Timer, Métodos, Notación y Entrenar.
- Se conservan el modelo del Mirror y su visor, la generación de mezclas, cubing.js, `verify-algs` y las claves de `localStorage` (incluida `cubos-web:solver-prefs`).
- Las fases F y 6 (Mirror) de arriba son historia: esa funcionalidad ya no existe.

## Rediseño visual v2 (rama local `rediseno-v2`)
- [x] Fase 0: maquetas y dirección A aprobada.
- [x] Fase 1: tokens, componentes base, smoke de interfaz y cierre de centésimos.
- [x] Fase 2: Timer (Instrumento), responsive, estados, visor plegable, sesión y QA de interfaz.
- [x] Fase 3: Métodos y Notación; chequeos de contenido e interfaz aprobados.
- [ ] Fases 4 y 5: autorizadas, pendientes.
- Guía vigente: `docs/REDISENO-V2.md`; mediciones: `docs/REPORTES-REDISENO.md`.
