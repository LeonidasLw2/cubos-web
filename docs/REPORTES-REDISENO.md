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
