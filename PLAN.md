# Plan de Actualización Integral — CubeSolver (`cubos-web`)

Este documento registra el plan de trabajo en fases (A–G) y su estado actual.

## Estado de Fases
- [x] **Fase A:** Barra superior, logo con estética argentina y sistema de diseño.
- [x] **Fase B:** Rediseño de las páginas existentes de Métodos (2x2, 3x3, 4x4).
- [x] **Fase C:** Métodos nuevos por puzzle (5x5, 7x7, Megaminx, Pyraminx + EG y ZZ).
- [x] **Fase D:** Nueva sección de Notación (`#/notacion`) con parser verificable y animaciones.
- [x] **Fase E:** Inicio de sesión (Google / Firebase Auth) y sincronización en la nube (Firestore local-first).
- [x] **Fase F:** Nueva sección Solver (`#/solver`) para 2x2, 3x3, 4x4, 5x5 y Pyraminx con verificación KPuzzle.
- [x] **Fase G:** Revisión final integral, tests, build y reporte.

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
