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

ESTADO FINAL: COMPLETO hasta Fase 2
