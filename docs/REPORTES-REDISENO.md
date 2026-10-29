# Reportes del rediseño visual v2
MODO DESATENDIDO. Estás en ~/cubos-web, rama rediseno-v2. Leé AGENTS.md, docs/REDISENO-V2.md y docs/REPORTES-REDISENO.md. El último commit es "wip(design): fase 5 - detenido por mezcla oculta": retomá desde ahí.
Diagnóstico de Leo del bloqueo real (confirmado en timer.css): la línea 235, body[data-phase='inspection'] .fadeable:not(.hint), tiene más especificidad que la excepción de la línea 237, body[data-view='timer'] .scramble-card { opacity: 1 }, así que la mezcla queda con opacity 0 en inspección y corriendo. La restricción de la guía dice que el texto de la mezcla siempre es visible.
Autorizado: corregí la especificidad en CSS (por ejemplo excluyendo .scramble-card en la regla de .fadeable o subiendo la especificidad de la excepción). Revisá si .topbar tiene el mismo problema y si hay otras excepciones con el mismo patrón, y decime cuáles encontraste. No toques lógica JS.
Corregí smoke-timer: debe esperar a que terminen las transiciones (Animation.finished o getAnimations) antes de medir opacidad, y debe verificar que el texto de la mezcla es visible (opacity 1) en reposo, inspección, corriendo, resultado, +2 y DNF, en los 9 tamaños (no solo en escritorio). Probá antes que el chequeo falla con el bug y pasa con la corrección. Un intento por cada defecto del chequeo, máximo 2.
Luego retomá la Fase 5: mantené todo lo ya hecho, corré todos los chequeos, Lighthouse móvil con `npx -y lighthouse` (13.6.0) sobre la build real de esta rama y la de main, y comparalos: Accessibility, Best Practices y SEO sin bajar, CLS 0.
La diferencia no intencional que viste en el subtítulo de portada de Métodos (comparte línea con el título): corregila para que quede debajo del título en todos los anchos, o explicá con mediciones por qué no.
Volvé a sacar las capturas "antes | después" con el bug ya corregido y reemplazá las de ~/Desktop/capturas-rediseno-v2/ (mismas reglas: fuera del repo, 7 móviles y 2 escritorio, y ahora agregá una del Timer en inspección a 390×844 para mostrar la mezcla visible).
Dejá escrito que falta la prueba en un Android real y el teclado virtual real. NO hagas merge ni push. Al terminar: "ESTADO FINAL: COMPLETO hasta Fase 5" en docs/REPORTES-REDISENO.md; si algo falla de verdad, "ESTADO FINAL: DETENIDO" y el motivo. No preguntes nada: no hay nadie para responder.
## Fase 1 — cierre (2026-10-29)
- Retirado el verificador de migración CSS autorizado; smoke-ui es el criterio vigente.
- Timer y Entrenador comparten createTimerText: dos spans persistentes, centésimos secundarios, texto completo y .is-long conservados.
- Chrome, 120 fotogramas: actualización media 0,054 ms, máximo 0,40 ms; identidad de ambos spans conservada.
- npm test: 116/116; verify-algs: 357 casos, 428 algoritmos, 3152 comprobaciones; build aprobado.
- Smoke sobre preview: 10 rutas × 7 tamaños, 0 errores de consola y 0 px de desborde; cuatro flujos de teclado aprobados.
- Timer a 360×640: zona y=297–517, navegación desde y=576; cabe sin scroll.
- playwright-core ya estaba instalado: dependencias sin cambios.
- No verificado: Android físico, costo con CPU móvil real y Lighthouse (Fase 5). Sin riesgos bloqueantes medidos.

## Fase 2 — Timer (2026-10-29)
- Dirección A: reloj sin fondo de tarjeta, peso 300, categorías en práctica, sesión con separadores y acento celeste; mezcla legible también al inspeccionar/resolver.
- Escritorio en dos columnas desde 861 px; visor plegable en todos los tamaños, sin mover ni remontar el único player; horizontal con reloj a la izquierda.
- Contrastes medidos: secundario/lienzo 7,93:1; borde táctil/lienzo 3,86:1; chip seleccionado/inactivo 8,00:1.
- A 360×640: zona y=335–565, barra inferior desde y=576; las ocho categorías caben sin scroll con el visor plegado (7×7 y Megaminx compactan el reloj).
- smoke-timer: 9 tamaños (360×640, 360×800, 390×844, 412×915, 667×375, 768×1024, 861×800, 1024×768, 1280×800); CLS=0 tanto vacío como con 12 tiempos.
- Teclado real: inspección, resolución, resultado, +2 y DNF; tiempo oculto real en móvil/escritorio. Textos largos, carga y error se verificaron como fixtures de presentación.
- Foco visible y movimiento reducido comprobados con emulateMedia; plegar/desplegar conserva el player. Recarga sin conexión: interfaz, Inter y generación de mezcla aprobadas.
- smoke-ui: 10 rutas × 7 tamaños, cuatro flujos completos, 0 errores de consola, 0 px de desborde; ahora compara contra el ancho solicitado, sin falsos negativos por viewport ampliado.
- npm test: 116/116; verify-algs: 357 casos, 428 algoritmos, 3152 comprobaciones; build aprobado (conserva aviso de chunks >500 kB).
- Fuente local: 48,25 kB; CSS de producción: 83,38 kB / 16,34 kB gzip. Se reservaron categorías, encabezado, mezcla e ilustración vacía para evitar saltos.
- Decisiones: cubo plegado también en escritorio y encabezado compartido compacto para evitar desbordes; sin cambios de lógica, algoritmos, datos, sincronización ni dependencias.
- No verificado: Android físico, fallos reales del generador y Lighthouse/comparación final con main (Fase 5). Sin capturas; Fases 3–5 pendientes. Sin riesgos bloqueantes medidos.


## Fase 3 — detenida en verificación (2026-10-29)
- Preparadas portadas, árbol, tarjetas, filtros, modal y catálogo de Métodos/Notación con superficies neutras, acento celeste y controles principales de 48 px.
- Migas con enlace subrayado; roles y nombres accesibles agregados; íconos de portada reutilizan SVG existentes. Diagramas y algoritmos conservados.
- npm test: 116/116; verify-algs: 357 casos, 428 algoritmos, 3152 comprobaciones; build aprobado (aviso existente de chunks >500 kB).
- BLOQUEO: el chequeo adicional scripts/smoke-content.mjs falló en línea 38: .notation-seq-error coincide con el aviso de Notación y con #account-auth-error oculto.
- El fallo fue del selector del chequeo agregado en esta fase. No alcanza para certificar todas las interacciones ni demuestra por sí solo un error de la interfaz.
- Se hizo un intento; no se corrigió ni se reintentó después del fallo por la instrucción explícita de Leo de frenar ante un chequeo fallido.
- Fases 4 y 5 no iniciadas; visor de escritorio todavía plegado como en Fase 2. Sin cambios de lógica, datos, sincronización ni dependencias del proyecto.
- No se hicieron capturas ni comparación Lighthouse con main: corresponden a Fase 5. Lighthouse tampoco se encontró en PATH ni en la caché de npm.
- Falta la prueba en Android real. La Fase 3 queda sin aprobar y el árbol se conserva en un commit de trabajo.
- smoke-ui finalizó: 10 rutas × 7 tamaños, cuatro flujos, 0 errores de consola y 0 px de desborde; el chequeo adicional sigue bloqueante.


## Solicitud de reanudación de Leo (texto conservado)

```text
MODO DESATENDIDO. Estás en ~/cubos-web, rama rediseno-v2. Leé AGENTS.md, docs/REDISENO-V2.md y docs/REPORTES-REDISENO.md. El último commit es "wip(design): fase 3 - detenido en verificacion": retomá desde ahí.
Aclaración de reglas, que agregarás a docs/REDISENO-V2.md (sección 8, punto 6) en tu primer commit: si un chequeo falla por un defecto del propio chequeo (falso positivo, selector ambiguo), corregí el chequeo y reintentá; contá un máximo de 2 intentos por problema; frená solo si el fallo persiste o es un fallo real de la interfaz.
Diagnóstico de Leo para el bloqueo actual: en scripts/smoke-content.mjs (línea 38), .notation-seq-error coincide con el aviso de Notación y con #account-auth-error, un <p hidden> del diálogo de Cuenta que comparte la clase. Acotá el selector al contenedor de la página de Notación, sin tocar la interfaz. Corré todo de nuevo y, si pasa, cerrá la Fase 3 con el commit "feat(design): fase 3 - Metodos y Notacion".
Después ejecutá las Fases 4 y 5 en orden, con los mismos chequeos y el mismo formato de reporte, un commit por fase.
(Opcional: borrá esta línea si preferís el cubo plegado en escritorio.) Al empezar la Fase 4, hacé que en escritorio (861 px o más) el visor de la mezcla arranque desplegado; en móvil sigue plegado. Verificá que no se mueva ni se remonte el twisty-player.
Lighthouse no está instalado: en la Fase 5 podés usar `npx -y lighthouse` (ejecución temporal; no lo agregues a package.json). Si no se puede ejecutar, anotalo como NO VERIFICADO y no frenes por eso.
En la Fase 5, guardá las capturas "antes | después" FUERA del repo, en ~/Desktop/capturas-rediseno-v2/, con nombres claros (01-timer-movil.png, etc.). Máximo 8 en 390×844 (Timer, Métodos, Notación, Entrenar, Ajustes, Cuenta, Mirror) más 2 en 1280×800 (Timer y Métodos). "Antes" = main; "después" = esta rama. No las commitees.
Dejá escrito que falta la prueba en un Android real. NO hagas merge ni push. Al terminar, "ESTADO FINAL: COMPLETO hasta Fase 5" en docs/REPORTES-REDISENO.md; si algo falla de verdad, "ESTADO FINAL: DETENIDO en Fase N" y el motivo. No preguntes nada: no hay nadie para responder.
```

## Fase 3 — cierre de Métodos y Notación (2026-10-29)
- Selector de error acotado a #view-notation; interfaz sin cambios durante esta reanudación.
- Corregido otro falso positivo del chequeo: su escenario de 3×3 ahora abre #/notacion/3x3 en lugar de heredar Mirror de la navegación previa.
- Un reintento por cada defecto del chequeo, sin fallos persistentes; aclaración incorporada a sección 8, punto 6 de la guía.
- smoke-content: 5 rutas × 6 anchos (360, 390, 768, 861, 1024, 1280), 0 desborde, 0 errores; búsqueda, aprendido, modal único, notación válida/inválida y reduced-motion aprobados.
- npm test: 116/116; verify-algs: 357 casos, 428 algoritmos, 3152 comprobaciones; build aprobado.
- smoke-ui: 10 rutas × 7 tamaños, cuatro flujos, 0 errores de consola y 0 px de desborde.
- Historial del reporte recuperado del commit; se conserva íntegro el pedido de Leo que estaba sin commit.
- Android físico y comparación visual/Lighthouse pendientes de Fase 5; sin riesgos bloqueantes medidos.

## Fase 4 — Entrenar, Mirror y paneles (2026-10-29)
- Visor del Timer desplegado al iniciar desde 861 px, plegado en móvil; inicialización de presentación con aria-expanded y espacio reservado, sin cambiar el motor del timer.
- Entrenador con zona sin tarjeta, peso 300, acento celeste, foco de teclado y filas táctiles; Mirror conserva geometría, materiales y renderer.
- Ajustes, Cuenta y Más usan capas neutras, controles de 48 px y sheets con safe-area; mensajes de carga/error/sin conexión y actualización conservan sus funciones.
- smoke-panels: 5 tamaños, movimiento normal/reduce, 0 px de hueco inferior en sheets, entrenador real y Mirror único; cuatro plegados sin mutaciones del contenedor ni cambio de player/padre.
- Dos defectos distintos del chequeo corregidos con un reintento cada uno: esperar montaje en lugar de visibilidad en móvil y activar modalidad de teclado antes de evaluar focus-visible.
- smoke-timer: 9 tamaños, CLS=0 vacío/con 12 tiempos; zona 360×640 y=335–565, escritorio 1280×800 y=451–777; flujo y recarga sin conexión aprobados.
- npm test 116/116; verify-algs 357 casos, 428 algoritmos, 3152 comprobaciones; build y smoke-ui (70 combinaciones, cuatro flujos, consola 0, desborde 0 px) aprobados.
- Teclado: foco probado con ventana reducida a 390×420; interactive-widget=resizes-content según [Chrome](https://developer.chrome.com/blog/viewport-resize-behavior/). Teclado virtual real NO verificado.
- Avisos de actualización/sin conexión verificados como fixtures visuales; no se inició sesión ni se tocó sincronización, datos o dependencias.
- Falta Android físico. Sin riesgos bloqueantes medidos; capturas y Lighthouse quedan en Fase 5.

## Fase 5 — detenida por fallo real (2026-10-29)
- Preparado pulido de movimiento: 45 reglas hover protegidas, 0 transiciones fuera de transform/opacity; scroll instantáneo con reduced-motion y documentación v2 en DESIGN.md.
- npm test 116/116; verify-algs 357 casos, 428 algoritmos, 3152 comprobaciones; build aprobado; Inter 48,25 kB, CSS 91,15 kB / 16,65 kB gzip.
- smoke-ui: 70 combinaciones y cuatro flujos aprobados, consola 0 y desborde 0 px. smoke-content aprobado en seis anchos.
- smoke-panels aprobado en cinco tamaños, normal/reduce y hueco inferior 0 px; su espera fija de 550 ms se reemplazó por Animation.finished (un reintento por falso positivo de animación aún en curso).
- BLOQUEO REAL: smoke-timer falló en 1280×800: mezcla oculta durante inspección; Chrome confirmó phase=inspection y opacity=0 tras esperar 600 ms. No se corrigió la interfaz ni se continuó después de confirmarlo.
- Causa: body[data-phase='inspection'] .fadeable:not(.hint) prevalece sobre la excepción de .scramble-card. El chequeo previo podía pasar al medir antes de avanzar la transición.
- CLS=0 medido vacío/con 12 tiempos en nueve tamaños; eso no compensa el fallo de visibilidad. La Fase 5 queda sin aprobar.
- Nueve comparativas fuera del repo, ~/Desktop/capturas-rediseno-v2/: 7 móviles y 2 escritorio; cada panel 390×844 o 1280×800, con franja antes/después. main=55c58ad, build temporal sin alterar la rama.
- Diferencia visual no intencional observada respecto de main: el subtítulo de portada de Métodos comparte línea con el título según el ancho disponible; revisión visual completa pendiente. El resto de cambios de paleta, fuente, tarjetas, categorías y PB son intencionales.
- Lighthouse NO VERIFICADO: CLI temporal 13.6.0 disponible, auditorías no iniciadas por la detención. No se agregaron dependencias al proyecto; la copia temporal de main instaló sus dependencias declaradas para compilar sus fuentes originales.
- Android físico, teclado virtual real y revisión completa de capturas pendientes. Fuentes locales y recarga sin conexión aprobadas en Fase 4. Sin cambios de datos, algoritmos, sincronización ni credenciales; sin merge ni push.


## Fase 5 — cierre y verificación final (2026-10-29)
- Corregida especificidad solo en CSS: .scramble-card y .topbar fallaban en inspección; corriendo ya daban opacity 1. No se encontró otra excepción equivalente; ayuda/sesión/navegación/aviso conservan su atenuación intencional.
- smoke-timer espera Animation.finished en texto/encabezado y ancestros y comprueba opacidad efectiva: falló en 9/9 con el bug y pasó en 9/9 corregido, en reposo/inspección/corriendo/resultado/+2/DNF (54 comprobaciones requeridas). Sin cambios de lógica JS de la app.
- Subtítulo debajo del título por CSS en ocho anchos, separación medida 6,28–7,72 px. No hizo falta reintentar por defectos del chequeo en esta reanudación.
- npm test 116/116; verify-algs 357 casos, 428 algoritmos y 3152 comprobaciones; build aprobado. smoke-ui: 70 combinaciones, cuatro flujos, consola 0, desborde 0 px.
- smoke-content: 5 rutas × 8 anchos; smoke-panels: 5 tamaños, normal/reduce, hueco inferior 0 px, player sin mover/remontar. CLS del Timer 0 en nueve tamaños; recarga sin conexión aprobada.
- Lighthouse 13.6.0 móvil 390×844, DPR 1, throttling simulado, una auditoría secuencial por ruta/versión; builds reales main=55c58ad y rama. Valores P/A11y/BP/SEO antes → después:
- Timer: 96/100/100/100 → 100/100/100/100; CLS 0,09135 → 0.
- Métodos: 79/96/100/100 → 85/100/100/100; CLS 0 → 0.
- Notación: 80/95/100/100 → 86/98/100/100; CLS 0 → 0. Persiste aviso previo heading-order.
- Entrenar: 81/96/100/100 → 86/100/100/100; CLS 0 → 0. Se cumplen A11y/BP/SEO sin bajar y CLS 0 en las cuatro rutas.
- Regeneradas y revisadas 10 comparativas externas: 7 pantallas móviles + inspección (390×844 por panel) y 2 escritorio (1280×800); ~/Desktop/capturas-rediseno-v2/. Informes Lighthouse HTML/JSON y prueba rojo/verde guardados allí; sin capturas en Git.
- Diferencias no intencionales identificadas, corregidas: mezcla/encabezado en inspección y subtítulo inline. No se observaron otras en las 10 comparativas; esto no recorre visualmente cada caso individual. Documentación v2 actualizada; fuentes locales, datos y sincronización conservados.
- Pendientes: Android real y teclado virtual real. Lighthouse es una corrida sintética por ruta/versión; no reemplaza hardware real. Árbol limpio al cierre, sin merge ni push.

ESTADO FINAL: COMPLETO hasta Fase 5
