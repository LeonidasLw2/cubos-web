# Crítica completa de Cube Tempo (14/11/2026)

Revisión hecha sobre el **build de producción** (`npm run build` + `npm run preview`), con el estado actual de `main` (31 archivos modificados sin commit), en celular (375×812) y escritorio (1280×800).

## Resumen en 30 segundos

| Área | Nota | En una línea |
|---|---|---|
| Funcionamiento / lógica | **9/10** | Muy sólido: 135 tests, verify-algs, 4 smoke tests en verde. |
| Contenido (métodos) | **9/10** | Lo más valioso de la app: todo verificado matemáticamente. |
| Estética | **7/10** | Oscura, sobria y coherente, pero con demasiadas cosas compitiendo en el Timer y CTAs desparejos. |
| Animaciones | **7/10** | Disciplinadas (transform/opacity, reduced-motion), un par de detalles sueltos. |
| Rendimiento | **6/10** | Firebase (~700 KB) se descarga siempre, aunque nunca inicies sesión. |
| Mantenibilidad | **6/10** | Archivos gigantes, mucha documentación que se contradice, cambios grandes sin commit en `main`. |

**Las 5 cosas que más valen la pena:**
1. No cargar Firebase hasta que haga falta (ganás ~700 KB en el arranque).
2. Hacer commit (o rama) de los 31 archivos modificados antes de seguir.
3. Simplificar el Timer en celular: sacar el link de "Clasificación" y la barra de scroll rápido de esa pantalla.
4. Unificar los botones de acción en Métodos (hoy hay link, botón y botón, cada uno con otro estilo).
5. Poner orden en `CLAUDE.md` / `docs/`: hay reglas que se contradicen entre sí.

---

## 1. Lo que se verificó (y pasó)

| Prueba | Resultado |
|---|---|
| `npm test` | ✅ 135/135 |
| `npm run verify-algs` | ✅ |
| `npm run build` | ✅ (aviso de chunks > 500 KB, esperado por cubing.js y three) |
| `smoke-ui` (10 rutas × 7 tamaños, flujo inspección → +2 → DNF) | ✅ |
| `smoke-timer` (9 tamaños, CLS = 0, offline) | ✅ |
| `smoke-content` | ✅ |
| `smoke-panels` (sheets, foco, entrenador, Mirror) | ✅ |

No se probó: Android físico, teclado virtual real, Lighthouse en esta pasada, VoiceOver/TalkBack.

---

## 2. Puntos fuertes 💪

### Funcionamiento
- **Timer bien diseñado por dentro**: máquina de estados con tabla de transiciones, reglas WCA de inspección puras y testeadas, ao5/ao12 con regla WCA, +2/DNF. Esto es nivel app seria.
- **Los avisos de voz usan el tiempo real**, no el número en pantalla, y compensan la latencia de la voz en Android midiendo cuánto tarda. Detalle que casi nadie hace.
- **Datos que no se rompen**: todo se normaliza al cargar, export/import sin duplicados, `storage.persist()`.
- **PWA de verdad**: funciona offline (incluida la generación de mezclas), nunca se recarga sola en medio de una resolución.
- **Carga diferida bien hecha**: cubing.js, trainer, scanner y Firebase se cargan con `import()` (el problema de Firebase es *cuándo* se llama, ver abajo).

### Contenido
- **Todos los algoritmos están verificados** contra referencias independientes o con un solver (cruz óptima recorriendo 190.080 posiciones, F2L con posición de piezas, CMLL por orientación…). Es el diferencial más fuerte frente a cualquier otra web de métodos.
- Cobertura enorme: 2x2 (Ortega, CLL), 3x3 (principiante, CFOP completo, Roux, ZZ), 4x4 (reducción, Yau, paridades), Mirror.
- El **Entrenador** arma mezclas reales con el solver (no el algoritmo al revés), igual que csTimer.

### Calidad del proceso
- Deploy que **no publica si falla un test** o un algoritmo.
- Pruebas de humo de interfaz que miden CLS, desborde, foco y reduced-motion en muchos tamaños. Muy por encima de lo normal para un proyecto personal.

### Estética
- Paleta disciplinada: casi negro + un solo acento celeste; los colores del cubo solo donde son el cubo. Se ve "instrumento", no juguete.
- Números con `tabular-nums` (el reloj no "baila") y CLS 0 en el Timer.
- Migas de pan claras en Métodos (`Métodos › 3x3 › CFOP › PLL`).
- Las tarjetas de "Grupos de PLL" numeradas son claras y fáciles de tocar.

---

## 3. Puntos débiles y qué hacer 🔧

Ordenados por impacto. **[Alto]** = vale la pena ya; **[Medio]** = mejora notable; **[Bajo]** = pulido.

### 3.1 Rendimiento

> ✅ **Arreglado el 14/11/2026:** el arranque del Timer pasó de ~1,2 MB (31 archivos) a ~520 KB (27 archivos). Firebase se carga al inicio solo si `cubos-web:sync-meta` tiene `hadSession` (o, en datos viejos, `lastSyncAt > 0`); si no, recién al tocar "Iniciar sesión".

**[Alto] Firebase se descarga en cada arranque, aunque no tengas cuenta.**
Medido en el Timer: 31 archivos, ~1,2 MB sin comprimir; de eso, ~690 KB son Firebase (`index.esm-*.js`). La causa está en el final de `initCloudSync` en [cloud-sync.js](../src/cloud-sync.js): si Firebase está configurado, llama a `getFirebaseContext()` siempre, para escuchar `onAuthStateChanged`.
- Arreglo: guardar una marca en `localStorage` cuando alguien inicia sesión (por ejemplo `cubos-web:had-session`) y solo cargar Firebase al arrancar si esa marca existe; si no, cargarlo recién al tocar "Iniciar sesión". Para el 95 % de los usuarios (sin cuenta) el arranque baja a la mitad, y en celular con datos móviles se nota mucho.

**[Medio] El CSS es un solo archivo de 100 KB** (`cssCodeSplit: false`, necesario por el worker de cubing.js). Se puede vivir con esto, pero `methods.css` (1.958 líneas) seguro tiene reglas muertas de los rediseños anteriores. Pasar una herramienta de cobertura de CSS de Chrome (DevTools → Coverage) en las 10 rutas y borrar lo que nunca se usa.

**[Bajo] La PWA precachea 4 MB** (77 archivos). Correcto para offline, pero la primera instalación en celular baja todo eso. Opción: dejar `three` (Mirror) y Firebase fuera del precache y cachearlos en runtime la primera vez que se usan.

### 3.2 Funcionamiento / UX

**[Alto] El Timer en celular tiene demasiadas cosas.** Con el visor plegado está bien, pero:
- El link **"Clasificación de la comunidad"** aparece justo debajo del reloj, y el backend de la clasificación todavía está "pendiente de validación" (`docs/CLASIFICACION.md`). Es una función a medio terminar en la pantalla más importante. → Sacarlo del Timer (ya está en el menú "Más") hasta que funcione de verdad.
- La **barra de scroll rápido** (flechas ↑↓ a la derecha, `quick-scroll.js`, 257 líneas) se superpone al contenido y a las tarjetas en todas las páginas. En el Timer la página es corta y no aporta nada; en Métodos compite con el scroll nativo de Android, que ya tiene arrastre rápido. → Quitarla, o mostrarla solo en páginas muy largas (OLL, F2L) y a partir de cierto scroll.
- Hay un **hueco vacío grande** entre la mezcla y la fila "3D · Cubo · ↻" cuando la mezcla es corta (reserva de espacio para mezclas largas). → Reservar menos alto en 3x3 o alinear los controles arriba.

**[Medio] Métodos: los botones de acción están desparejos.** En la página de PLL hay "Buscar casos ↓" (link subrayado), "Ver casos" (botón píldora) e "Identificar caso" (otro botón en otra línea). Tres estilos para tres acciones parecidas, y en 375 px se parten en dos filas. → Un botón principal ("Ver casos") + uno secundario ("Identificar caso"), mismo alto, misma fila; el link "Buscar" puede ser el buscador mismo arriba de la lista.

**[Medio] "Identificar caso" aparece en la portada de Métodos** al lado de "Guía de notación", sin contexto. Para alguien nuevo no queda claro qué hace (es un escáner por foto). → Darle un subtítulo ("Sacale una foto a tu cubo") o dejarlo solo dentro de PLL/OLL, donde tiene sentido.

**[Medio] El texto de ayuda decide "táctil o teclado" una sola vez al cargar** (`isTouch` en `ui.js`). En una notebook con pantalla táctil, o una tablet con teclado, el texto queda mal y no cambia. → Actualizar `isTouch` según el último evento real (`pointerdown` con `pointerType === 'touch'` vs `keydown`). Son pocas líneas.

**[Medio] El indicador "Local · Sin cuenta" en celular es solo un punto celeste** sin texto. No se entiende qué significa. → O mostrar un ícono de nube tachada, o sacarlo en móvil y dejar el estado dentro de Cuenta.

**[Bajo] Las categorías Megaminx, Pyraminx y Mirror quedan fuera de pantalla en celular** sin ninguna pista de que hay más. → Un degradé en el borde derecho de la fila de categorías.

**[Bajo] Estadísticas vacías muestran "-" en cada celda** (6 celdas con guiones). En una sesión nueva es ruido. → Mostrar solo el estado vacío ("Todavía no hay tiempos") y aparecer las estadísticas con el primer tiempo.

### 3.3 Estética

**[Medio] Dos tipografías cuando la regla dice una.** `DESIGN.md`/`CLAUDE.md` piden "una sola familia, Inter", pero ahora también está Space Grotesk para reloj y títulos. No es malo en sí, pero hay que decidir y dejarlo escrito en un solo lugar. Ojo que el "0.00" en Space Grotesk tiene ceros muy redondos que se parecen a la "O"; en un reloj es aceptable, pero comparalo con Inter 300 lado a lado.

**[Medio] El reloj está dentro de una tarjeta con borde**, cuando la Fase 2 decía "Timer sin tarjeta de fondo". Hoy en celular se ve: tarjeta de categorías, línea, mezcla, línea, controles, línea, tarjeta del reloj. Demasiados bordes y separadores. → Probar el reloj sin borde (solo el número grande sobre el fondo) y menos líneas divisorias; el espacio en blanco ya separa.

**[Medio] El visor 3D con máscara (Métodos) se ve "embarrado"**: los stickers que no importan quedan verde oliva/oscuro en vez de un gris neutro, y cuesta distinguir qué está resaltado. → Usar gris uniforme para lo que no importa, como en las miniaturas 2D.

**[Bajo] Mucho celeste compitiendo**: categoría activa, PB, links, botón activo de la barra, el punto de sincronización y los números de los grupos son todos celestes. Un acento pierde fuerza si está en todos lados. → Reservar el celeste "lleno" para lo activo y el PB; links en blanco subrayado.

**[Bajo] Etiquetas tipo chip** ("Etapa 4 de CFOP", "2-look: 6 algoritmos", "Completo: 21 casos") ocupan dos líneas arriba del título en celular. → Moverlas debajo del título o dejarlas en una sola línea de texto gris ("Etapa 4 · 21 casos · 2-look con 6").

### 3.4 Animaciones

Lo que está bien: solo `transform`/`opacity`, todo respeta `prefers-reduced-motion`, nada se anima con JS mientras corre el timer, CLS 0, el visor no se remonta al plegar.

**[Bajo] El indicador de la pestaña activa (escritorio) salta de ancho.** En [topbar-nav.css](../src/styles/topbar-nav.css) se anima `transform`, pero el `width` cambia de golpe desde JS, así que al pasar de "Timer" a "Notación" la línea se mueve con el ancho equivocado un instante. → Ancho fijo de 1px y animar `transform: translateX() scaleX()`.

**[Bajo] Falta feedback de "listo"** al mantener presionado: es el momento más importante del timer. Verificar en celular real que el cambio de color (rojo → verde, o el que corresponda) es inmediato y bien visible; si no lo es, es lo primero a pulir.

**[Bajo] 24 `@keyframes` en el CSS.** Revisar si todas se usan (algunas pueden ser de rediseños anteriores).

### 3.5 Código y proyecto

**[Alto] 31 archivos modificados sin commit en `main`** (rediseño tipográfico, comunidad, stickerless, íconos…). Si algo se rompe, no hay vuelta atrás fácil, y como `main` publica automáticamente, un push accidental sube todo junto. → Pasarlo a una rama (`git switch -c rediseno-tipografia`) y commitear por partes.

**[Medio] Archivos demasiado grandes**: `methods.js` (1.958 líneas), `methods.css` (1.958), `notation-parser.js` (1.011), `ui.js` (916). La regla del proyecto es "un módulo por responsabilidad" y estos ya no la cumplen. → Partir `methods.js` por tipo de página (portada, página de método, lista de casos) y `ui.js` (timer UI vs. lista de tiempos vs. preview).

**[Medio] La documentación se contradice.** Ejemplos dentro del mismo `CLAUDE.md`:
- "Fase 5: mezcla y topbar visibles en inspección y resolución" vs. "la versión de publicación oculta la mezcla durante inspección y resolución".
- "una sola familia, Inter" vs. "Space Grotesk para el reloj y los títulos".
- "Fase 2: Timer sin tarjeta de fondo" vs. lo que se ve hoy.
Además hay 7 documentos en `docs/` más `DESIGN.md`, `PLAN.md` y `design-explorations/`. → Dejar en `CLAUDE.md` solo **las reglas vigentes**; mover el historial de fases a `docs/HISTORIAL.md`.

**[Medio] Código legado que sigue ocupando lugar**: `solverPrefs`/`DEFAULT_SOLVER_PREFS` y la clave `cubos-web:solver-prefs` quedaron "por compatibilidad" tras borrar el Solver. → Mantener solo la lectura en la normalización y borrar el resto.

**[Bajo] Nombre doble**: la app se llama "Cube Tempo", el repo y la URL `cubos-web`. Para el usuario no importa, pero si algún día querés compartirla, una URL con el nombre ayuda.

---

## 4. Qué sacaría ✂️

| Qué | Por qué |
|---|---|
| Link "Clasificación de la comunidad" en el Timer | Backend sin terminar; ya está en "Más". |
| Barra de scroll rápido (o limitarla a OLL/F2L) | Tapa contenido y duplica el scroll nativo. |
| Grilla de estadísticas vacía con guiones | Ruido en la primera visita. |
| Separadores y bordes de más en el Timer | El espacio ya separa. |
| Restos del Solver (`solverPrefs`) | Código muerto. |
| Historial de fases en `CLAUDE.md` | Confunde qué regla vale. |

## 5. Qué agregaría (solo si te interesa, ninguna es necesaria)

- **Gráfico de evolución** de la sesión más grande (ya existe `sparkline.js`; tocar la sparkline podría abrirlo).
- **Sesiones múltiples** por categoría (ej. "práctica OH", "práctica normal"): es lo primero que extraña un cuber que viene de csTimer.
- **Estadísticas del entrenador más visibles**: "tus 5 PLL más lentos" como sugerencia de qué practicar.

## 6. Prueba en celular real (Samsung SM-S948B, Chrome 157)

La prueba se hizo con el build local (`npm run preview`) abierto en Chrome por USB (`adb reverse`) y manejado con DevTools usando toques reales (`Input.dispatchTouchEvent`). La app se abrió en el navegador y **no instalada**.

| Qué | Resultado |
|---|---|
| Pantalla | 411×776 CSS px, DPR 3,5; sin desborde horizontal en Timer, Métodos, PLL, Entrenar ni Notación. |
| Carga (con service worker) | DOMContentLoaded en 43 ms; 31 archivos, ~640 KB (ya sin Firebase). Consola sin errores. |
| Texto de ayuda | Detecta táctil: "Mantené presionado para empezar la inspección". ✅ |
| Flujo táctil | Mantener 250 ms → `holding` (tarjeta celeste + barra de progreso); a los 500 ms → `ready`; al soltar arranca la inspección (15) a pantalla completa; mantener → `ready` (dígitos celestes); soltar → corre; toque → para (1,68). ✅ |
| Voz | Voces locales en español (España y EE. UU.). "Ocho" pedido a los 8,00 s y empezó a sonar a los 8,07 s; "doce" pedido a los 12,00 s y sonando a los 12,04 s. Latencia medida: 44–73 ms (este celular es rápido). ✅ |
| Cancelar inspección | Vuelve a reposo. ✅ |
| Botón atrás de Android | Entrenar → 3x3 → Métodos → Timer, en orden. ✅ |
| Scroll al volver | OLL con scroll en 1500 px → Timer → atrás: vuelve a OLL exactamente en 1500 px. ✅ |
| Sin conexión | Recarga offline: la interfaz carga y genera una mezcla nueva. ✅ |

**Lo que encontré en el celular:**
- ✅ *Arreglado:* `setWakeLock()` en `ui.js` pide la pantalla prendida al pasar de reposo a inspección/resolución y la suelta al volver a reposo (verificado en el celular).
- **[Alto] No hay Wake Lock.** El código no pide nunca `navigator.wakeLock`. Mientras corre el timer no se toca la pantalla, así que en un 5x5, 7x7 o Megaminx (2–5 minutos) **la pantalla se apaga** con el tiempo de espera de Android (30 s o 1 min por defecto). → Pedir `navigator.wakeLock.request('screen')` al empezar la inspección y soltarlo al terminar. Son unas 10 líneas en `ui.js`, en el mismo lugar donde cambia la fase.
- ✅ *Arreglado:* en táctil ahora dice "Mantené el dedo acá y soltá para empezar. Tocá para parar."
- **[Medio] Entrenar dice "Mantené la barra espaciadora (o el dedo acá)…" también en el teléfono.** El texto está fijo en [trainer.js](../src/trainer.js) (línea ~240); el Timer sí lo adapta con `isTouch`. → Usar la misma detección y mostrar "Mantené el dedo acá y soltá para empezar".
- **[Bajo] El "listo" se distingue solo por el color** (dígitos blancos → celestes, fondo un poco más claro). Se ve, pero con el pulgar encima del número y luz de día es sutil. → Sumar una vibración corta (`navigator.vibrate(15)`) al pasar a `ready`, o un cambio de escala chico del número.
- **[Bajo] Las categorías se ven distinto según la pantalla**: en Timer son una fila con scroll horizontal ("Me…" cortado a la derecha) y en Notación se parten en dos filas. → Elegir una sola forma.
- **[Bajo] Entrenar en celular**: el cubo 3D queda chico dentro de su caja y la mezcla larga ocupa dos líneas apretadas arriba del reloj.
- **[Bajo] Consola con avisos de cubing.js** (`random333Scramble: 75ms`, etc.): son mensajes de tiempo de la librería, no errores; no molestan, pero ensucian la consola.

**No probado:** la app **instalada** en la pantalla de inicio (el "atrás dos veces para salir" solo corre ahí), el teclado virtual, el modo horizontal y la vibración.

## 7. Plan sugerido (en orden)

1. Rama + commit de lo que está sin guardar. *(5 min)*
2. ~~Firebase diferido hasta que haya sesión.~~ ✅ hecho
3. ~~Wake Lock durante inspección y resolución.~~ ✅ hecho
4. ~~Texto táctil en Entrenar~~ ✅ hecho; falta la vibración corta en "listo". *(chico)*
5. Limpiar el Timer móvil: link de clasificación, scroll rápido, estadísticas vacías. *(chico)*
6. Unificar botones de Métodos y gris neutro en las máscaras 3D. *(mediano)*
7. Ordenar `CLAUDE.md`/docs y decidir tipografía. *(mediano)*
8. Partir `methods.js` y `ui.js`. *(grande, sin apuro)*
9. Probar la app **instalada**: "atrás dos veces para salir", teclado virtual y modo horizontal.
