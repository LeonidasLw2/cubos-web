# Reportes del rediseño visual v2

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
