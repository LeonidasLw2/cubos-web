# Documento de Diseño — CubeSolver (`DESIGN.md`)

Este documento consolida la investigación visual de la **Fase 1**, el análisis de tendencias modernas, la auditoría del estado actual de la aplicación y la especificación detallada del sistema de diseño para la modernización estética y experiencia nativa en Android.

---

## 1. Investigación Visual y Referencias

Para esta investigación se utilizó el navegador integrado (`puppeteer-core` sobre Google Chrome headless a 1440×900 px y 390×844 px táctil móvil) para capturar y medir propiedades CSS reales (tipografías, escalas, colores, bordes, sombras, transiciones y navegación) en tres categorías clave:

### A. Productos Web de Referencia en Diseño
- **Linear (`linear.app`)**:
  - *Evidencia medida*: Fondo oscuro profundo `rgb(8, 9, 10)`, tipografía variable con tracking negativo (`letter-spacing: -0.02em` en títulos), bordes sutiles de 1px a muy baja opacidad (`rgba(255, 255, 255, 0.08)`), esquinas redondeadas compactas de 8px y píldoras (`9999px`) en navegación, microinteracciones ultra rápidas (`100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`).
  - *Tendencia*: Estética de herramienta profesional de alto rendimiento (*craftsmanship*), sin sombras difusas pesadas ni degradados invasivos; jerarquía creada mediante contraste tonal de superficies.
- **Vercel (`vercel.com`)**:
  - *Evidencia medida*: Fondo negro absoluto `rgb(0, 0, 0)`, fuente tipográfica monoespaciada/grotesca propia (`GeistSans`), tarjetas planas con bordes de 1px a 12–15% de blanco, barras fijas de 64px de alto con transición suave de opacidad.
  - *Tendencia*: Minimalismo técnico, foco extremo en el contenido y la legibilidad, líneas rectas equilibradas con radios sutiles.
- **Raycast (`raycast.com`)**:
  - *Evidencia medida*: Fondo `rgb(7, 8, 10)`, botones con textura física sutil mediante `inset shadow` (`0px -1px 0.4px rgba(0, 0, 0, 0.2)`) y bordes dobles refinados, esquinas de 8px a 12px, feedback visual inmediato al presionar (`:active`).
  - *Tendencia*: Diseño inspirado en hardware de precisión, acabados mate y profundidad táctil tangible.
- **Stripe (`stripe.com`)** y **Arc (`arc.net`)**:
  - *Evidencia medida*: Uso quirúrgico del color en acentos funcionales, estructuras en bloques limpios y degradados de acento muy controlados que no saturan el fondo.

### B. Sistemas de Diseño Oficiales
- **Material Design 3 Expressive (Android)**:
  - *Especificaciones oficiales*:
    - **Navigation Bar (barra inferior)**: Altura estándar de 80dp (cómoda para el pulgar), indicador de destino activo en forma de píldora redondeada (`border-radius: 9999px` o 16dp, 64×32dp) con color de acento o tonalidad contrastante, ícono con feedback claro y etiqueta tipográfica abajo (12sp–14sp).
    - **Área táctil mínima**: Mínimo estricto de **48×48 dp/px** para cualquier botón o control táctil en móvil.
    - **Bottom Sheets (hojas inferiores)**: Esquinas superiores pronunciadas (`extra-large`: radio de 28dp), barra de arrastre (*drag handle*) centrada de 32×4dp con radio de 2dp, anclaje seguro al fondo respetando `env(safe-area-inset-bottom)`.
    - **Escala de formas M3**: None (0), Extra-small (4dp), Small (8dp), Medium (12dp), Large (16dp), Extra-large (28dp), Full/Pill (9999dp).
    - **Motion**: Curva de aceleración *Emphasized Decelerate* (`cubic-bezier(0.2, 0, 0, 1)`) para componentes que entran a pantalla y duraciones entre 150ms y 250ms.
- **Apple Human Interface Guidelines (HIG)**:
  - *Especificaciones oficiales*: Respeto obligatorio de áreas seguras (`safe-area-inset-top`, `safe-area-inset-bottom`), contraste en modo oscuro con fondos semánticos elevados (fondos base vs secundarios), adaptabilidad fluida sin layouts rígidos, eliminación de dependencia de estados hover.

### C. Apps y Sitios de Speedcubing y Timers
- **csTimer (`cstimer.net`)**:
  - *Qué esperan los speedcubers*: El tiempo gigante como rey absoluto de la pantalla, tipografía digital/monoespaciada de lectura instantánea a distancia, mezcla (*scramble*) centrada y legible para inspección, estadísticas clave al alcance de la vista (ao5, ao12, PB), nada de retraso al soltar la barra o el toque.
  - *Qué está mal resuelto*: Estética anticuada de los años 2000, paleta de colores desaturada o discordante, menúes desplegables microscópicos de 20px no aptos para celular, cero adaptación moderna a pantallas táctiles.
- **CubeDesk (`cubedesk.io`)**:
  - *Aciertos*: Pantalla oscura limpia, tiempo centrado y grande, estadísticas en tarjetas rectangulares ordenadas en grilla inferior, lista de resoluciones con estado vacío minimalista.
  - *Puntos a mejorar*: Fondo negro plano sin suficiente jerarquía tonal, botones que se pierden por falta de contraste en móvil.
- **SpeedCubeDB (`speedcubedb.com`) y J Perm (`jperm.net`)**:
  - *Aciertos*: Catálogos de algoritmos claros con etiquetas de reconocimiento (faros, barras, orientación).
  - *Puntos a mejorar*: Densidad excesiva en pantallas angostas, navegación móvil compleja.

---

## 2. Decisiones para CubeSolver: Qué Tomamos y Qué Descartamos

| Elemento | Qué tomamos y por qué | Qué descartamos y por qué |
| :--- | :--- | :--- |
| **Navegación Móvil** | **Barra inferior Material 3 Expressive**: Altura cómoda de 80px, indicador activo en forma de píldora celeste suave, etiquetas legibles de 11–12px, área táctil de 48×48px y respeto de `env(safe-area-inset-bottom)`. | Descartamos barras inferiores comprimidas de menos de 56px o con íconos flotantes sin texto, porque en Android dificultan el toque con el pulgar. |
| **Superficies y Bordes** | **Bordes sutiles de 1px (`rgba(255, 255, 255, 0.08)` a `0.14`)** combinados con elevación tonal progresiva (`#090b10` → `#121620` → `#1b202c`) inspirados en Linear y Raycast. | Descartamos sombras difusas oscuras gigantes (skeuomorfismo viejo) que empastan el diseño y no aportan contraste real. |
| **Rendimiento (`backdrop-filter`)** | **Restricción estricta de blur a solo 3 elementos estructurales fijos**: el header sticky superior, la barra de navegación inferior móvil y los Bottom Sheets modales. | **Descartamos por completo el blur en tarjetas, listas, scrollbars o previsualizaciones** (se auditaron 20 usos en el CSS actual). En celulares Android de gama media, el blur repetido destruye los FPS y calienta el equipo. |
| **Diálogos y Modales** | **Bottom Sheets nativos en celular (≤640px)**: Se abren desde abajo, con radio superior de 28px (M3 Extra-Large), *drag handle* visual de 32×4px y cierre natural al deslizar o tocar fuera. | Descartamos ventanas modales centradas que ocupan el centro en móvil y obligan a estirar el dedo a la esquina superior para cerrar con una cruz chica. |
| **Timer / Modo Foco** | **Modo Zen / Foco estricto**: Al mantener pulsado, durante inspección y mientras corre el tiempo, la pantalla se despeja completamente de elementos secundarios. Tiempo grande, centrado y legible. CERO animaciones JavaScript. | Descartamos cualquier animación que toque el hilo principal mientras corre el reloj (regla de oro de `CLAUDE.md`). |
| **Interacciones Táctiles** | **Feedback reactivo visible `:active`**: `transform: scale(0.96)` inmediato con curvas de deceleración rápidas. Estados `:focus-visible` accesibles con anillo celeste. | Descartamos cualquier comportamiento que dependa de `:hover` para mostrar información o activar botones (en celular no existe hover). |

---

## 3. Dirección de Diseño Propuesta

### A. Paleta de Colores y Tokens de Superficie (Dark Mode First)
La identidad mantiene el modo oscuro de alto contraste y los acentos patrios del logo de CubeSolver (celeste `#74ACDF` y sol `#F6B40E`), sumados a los 6 colores oficiales del cubo de Rubik utilizados con precisión semántica.

```css
:root {
  /* Fondos y Superficies con Elevación Tonal */
  --bg-canvas: #090b10;          /* Fondo global de la aplicación */
  --surface-1: #121620;          /* Tarjetas base, paneles principales */
  --surface-2: #1b202c;          /* Tarjetas elevadas, chips inactivos, inputs */
  --surface-3: #242b3b;          /* Estados hover, elementos activos, botones secundarios */
  --surface-sheet: #121620;      /* Fondo sólido para Bottom Sheets en móvil */

  /* Bordes de precisión de 1px */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.14);
  --border-strong: rgba(255, 255, 255, 0.22);
  --border-focus: #74acdf;

  /* Texto verificado WCAG AA / AAA (contraste medido con script) */
  --text-primary: #f1f5f9;       /* Contraste 17.9:1 contra bg (Supera AAA) */
  --text-secondary: #94a3b8;     /* Contraste 7.6:1 contra bg (Supera AAA) */
  --text-tertiary: #64748b;      /* Contraste 4.6:1 (Apto etiquetas secundarias AA) */
  --text-disabled: #475569;

  /* Identidad y Acentos (Argentina + Cubo) */
  --c-celeste: #74acdf;          /* Acento primario de marca, tabs activas, foco */
  --c-celeste-subtle: rgba(116, 172, 223, 0.14); /* Fondo de píldora activa M3 */
  --c-sol: #f6b40e;              /* Acento secundario, medallas PB, avisos */
  --c-sol-subtle: rgba(246, 180, 14, 0.15);

  /* 6 Colores del Cubo (ajustados para brillo armonioso en fondo oscuro) */
  --c-cube-white: #f8fafc;
  --c-cube-yellow: #fbbf24;
  --c-cube-green: #34d399;
  --c-cube-blue: #38bdf8;
  --c-cube-red: #f87171;
  --c-cube-orange: #fb923c;
}
```

### B. Tipografía y Escala Fluida
Conservamos las fuentes locales empaquetadas en caché PWA:
- **Títulos e Identidad**: `'Space Grotesk'` (carácter geométrico, moderno, legible).
- **Timer, Mezclas y Algoritmos**: `'JetBrains Mono'` (monoespaciada técnica con altura-x amplia y cifras tabulares perfectas).
- **Cuerpo y UI**: `system-ui, -apple-system, Roboto, sans-serif` (nativa de Android/iOS para rendimiento instantáneo).

```css
:root {
  /* Escala Fluida con clamp() */
  --font-timer: clamp(4.25rem, 18vw, 8rem);
  --font-display: clamp(1.75rem, 4vw, 2.75rem);
  --font-h1: clamp(1.4rem, 3vw, 2.25rem);
  --font-h2: clamp(1.2rem, 2.2vw, 1.65rem);
  --font-h3: clamp(1.05rem, 1.6vw, 1.25rem);
  --font-body: clamp(0.9rem, 1.2vw, 1rem);
  --font-sm: 0.875rem;          /* 14px */
  --font-xs: 0.75rem;           /* 12px */
  --font-mono-alg: clamp(0.95rem, 1.4vw, 1.15rem);
}
```

### C. Escala de Espaciado (Múltiplos de 4/8 px)
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;             /* Target táctil mínimo recomendado por M3 */
}
```

### D. Radios de Borde (Sistema Material 3 Expressive)
```css
:root {
  --radius-xs: 6px;              /* Tags pequeños, mini-badges */
  --radius-sm: 10px;             /* Botones estándar, inputs */
  --radius-md: 14px;             /* Tarjetas compactas, chips */
  --radius-lg: 18px;             /* Tarjetas principales, contenedores */
  --radius-xl: 24px;             /* Modales y héroes */
  --radius-sheet: 28px 28px 0 0; /* Bottom Sheets estilo nativo Android M3 */
  --radius-pill: 9999px;         /* Píldoras de navegación activa M3, tags redondeados */
}
```

### E. Sombras y Profundidad
```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.6);
  --shadow-sheet: 0 -10px 32px rgba(0, 0, 0, 0.75);
}
```

### F. Curvas de Animación y Duraciones
```css
:root {
  --ease-m3: cubic-bezier(0.2, 0, 0, 1);       /* M3 Emphasized Decelerate */
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
  --duration-quick: 150ms;                     /* Microinteracciones, hover, active */
  --duration-medium: 220ms;                    /* Despliegues de sheets y diálogos */
  --duration-enter: 280ms;                     /* Transición de vistas */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-quick: 0ms;
    --duration-medium: 0ms;
    --duration-enter: 0ms;
  }
}
```

---

## 4. Auditoría del Estado Actual ("Antes")

Se capturaron y auditaron todas las rutas a **390 px (móvil)** y **1440 px (escritorio)**, con el servidor `npm run preview` sirviendo el build real. Las imágenes están archivadas en `.gemini/antigravity/brain/.../antes/`:

### A. Diagnóstico de Problemas Detectados en el "Antes"
1. **Desborde horizontal en Móvil (`overflowX = 174px` en `#/solver` a 390 px)**:
   - El editor del Solver sobresale 174 px por el ancho fijo de la paleta y la tabla 2D. Provoca desplazamiento horizontal no deseado al pintar caras en celular.
2. **Barra inferior móvil desactualizada**:
   - Mide 64 px y tiene padding inconsistente; carece del indicador en píldora con acento de Material 3 y no da suficiente holgura en pantallas con barra de gestos de Android.
3. **Falta de consistencia en el código CSS (`style.css` > 5700 líneas)**:
   - Se detectaron 45 tamaños de fuente sueltos en rem/px, 34 colores hex dispersos, 122 variantes de `rgba`, 31 estilos de `box-shadow` y 20 usos de `backdrop-filter`.
   - Múltiples clases definen sus propios botones e inputs con radios y paddings dispares.
4. **Accesibilidad (Lighthouse)**:
   - Fallo en `label-content-name-mismatch` en el botón de cuenta (`aria-label="Cuenta y sincronización"` vs texto visible `"Iniciar sesión"`).
   - Uso de `aria-label` en `<div>` sin rol (`.hero-cube-stage`, `.trainer-cube`, `.notation-stage-box`).
   - Salto de orden de encabezados en Notación (`<h3>` sin un `<h2>` previo).
5. **Rendimiento móvil (Lighthouse Baseline)**:
   - **Timer**: Performance 91 / A11y 100 / BP 100 / LCP 3011 ms / TBT 113 ms / CLS 0.000.
   - **Métodos**: Performance 80 / A11y 96 / BP 100 / LCP 5047 ms / TBT 86 ms / CLS 0.000.
   - **Notación**: Performance 81 / A11y 95 / BP 100 / LCP 5004 ms / TBT 73 ms / CLS 0.000.
   - **Entrenar**: Performance 84 / A11y 96 / BP 100 / LCP 4368 ms / TBT 23 ms / CLS 0.000.
   - **Solver**: Performance 52 / A11y 100 / BP 100 / LCP 4418 ms / TBT 9972 ms / CLS 0.000 (el worker y motor de búsqueda de soluciones del 3x3/4x4/5x5 en el solver consumen CPU al inicializar; es lógica de cómputo, no CSS).

---

## 5. Plan de Ejecución para las Siguientes Fases

### Fase 2 — Sistema de Diseño y Modularización CSS
1. **Separación de `style.css` en módulos limpios** bajo `src/styles/` (respetando `cssCodeSplit: false` e importados desde `main.js`):
   - `src/styles/tokens.css` (variables `:root`, colores, tipografía, espacios, radios, sombras, curvas).
   - `src/styles/base.css` (reset moderno, `box-sizing`, `100dvh`, background base sin gradientes pesados).
   - `src/styles/components.css` (botones primario/secundario/fantasma, chips, inputs, badges, cards, tabs, bottom sheets, toast, skeletons).
   - `src/styles/topbar-nav.css` (header de escritorio y barra inferior nativa Android M3 con píldora).
   - `src/styles/timer.css` (pantalla del cronómetro, modo foco, inspección, estadísticas y scramble).
   - `src/styles/methods.css` (portada de métodos, selector de puzzles, visualizador de casos, stepper y tarjetas).
   - `src/styles/solver.css` (editor 2D/3D responsive sin overflow, paleta, selector y reproductor).
   - `src/styles/notation.css` (selector de giros, visualizador 3D interactivo y probador de secuencias).
   - `src/styles/trainer.css` (entrenador de casos, grilla de filtros, pad táctil y estadísticas).
2. **Corrección de accesibilidad en HTML**:
   - Ajustar `aria-label` de `account-btn` para coincidir con el texto visible.
   - Asignar roles válidos (`role="region"` / `role="img"`) o reemplazar `aria-label` en divs de visor 3D.
   - Corregir jerarquía de encabezados (`h1` -> `h2` -> `h3`).

### Fase 3 — Celular Primero (Android Native Feel)
1. **Barra inferior M3 Expressive**:
   - Altura de 80 px, íconos estilizados con indicador activo en píldora celeste tenue (`--c-celeste-subtle`).
   - Respeto total de `env(safe-area-inset-bottom)` y `100dvh` para evitar que la barra del navegador tape botones.
2. **Bottom Sheets táctiles**:
   - Para Ajustes, Cuenta y el menú "Más".
   - Drag handle visible de 32×4 px con esquinas de 28 px.
3. **Solver y Timer responsive**:
   - Eliminar el overflow de 174 px en el Solver mediante grillas `flex-wrap` y celdas táctiles elásticas.
   - Modo horizontal (landscape) optimizado para Timer y Solver.

### Fase 4 — Aplicar a Todas las Pantallas
1. Modernización visual de Timer, Métodos, Solver, Notación, Entrenar, Ajustes y Cuenta con la nueva paleta y componentes base.
2. Modo foco estricto en el Timer sin efectos pesados ni JS en el hilo principal.
3. Estados vacíos con cubos isométricos vectoriales y feedback de carga con esqueletos sutiles.

### Fase 5 — Revisión Final y Métricas
1. Capturas "después" en 360, 390, 768 y 1440 px comparadas contra el "antes".
2. Medición Lighthouse: Performance y Accessibility deben mantenerse o subir.
3. `npm test` y `npm run verify-algs` al 100%.

---

## 6. Alertas de Seguridad en Investigación
Durante el escaneo automatizado de las referencias web no se encontró ninguna instrucción maliciosa ni inyección de prompt dirigida a asistentes IA. Las coincidencias de palabras clave correspondieron únicamente a textos comerciales de productos (asistente de Raycast y enlaces de soporte de Apple).
