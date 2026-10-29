# CubeSolver (`cubos-web`) — instrucciones para agentes

Web/PWA de speedcubing de Leo: timer, scrambles, métodos de resolución y entrenador de casos.

## Antes de hacer cualquier cosa
1. Leé **`CLAUDE.md`**. Es la fuente de verdad del stack, las convenciones, la verificación de algoritmos, el build, la PWA y el deploy. Seguilo al pie de la letra.
2. Leé **`PLAN.md`**. Ahí está el plan por fases (A–G) y qué está hecho. Trabajá solo en la fase que se pida y no adelantes fases.
3. Revisá el estado del repo (`git status`, `git pull`). El proyecto se edita también con Claude Code y desde otra computadora, así que no asumas que el último cambio es tuyo.

Si este archivo contradice a `CLAUDE.md` o `PLAN.md`, valen esos dos. Si al terminar una tarea cambia el estado del proyecto, actualizá `CLAUDE.md` y `PLAN.md` (no este archivo).

## Reglas clave (resumen; el detalle está en CLAUDE.md)
- Vite + JavaScript sin framework + `cubing.js`. Datos en `localStorage`; no hay servidor propio.
- `cubing/scramble` y `cubing/twisty` se importan **siempre con `import()` dinámico**. Si cambiás algo que toque cubing.js, probá con `npm run build` + `npm run preview`, no solo con `npm run dev`.
- Todo algoritmo nuevo tiene que pasar `npm run verify-algs`. **No inventes algoritmos**: si no podés verificar uno, decilo.
- Antes de dar algo por terminado: `npm test` y `npm run verify-algs`. El deploy a GitHub Pages corre en cada push a `main` y se frena si alguno falla.
- No rompas los datos guardados de versiones anteriores (se normalizan al cargar).
- Comentarios breves en español. Explicá los cambios en español, porque el usuario está aprendiendo.
- Antes de cambios grandes, de borrar archivos o de hacer push, explicá el plan y pedí confirmación.

## Rediseño visual v2 (rama `rediseno-v2`)
Si la rama actual es `rediseno-v2`, o te piden trabajar en el rediseño visual, leé **`docs/REDISENO-V2.md`** además de `CLAUDE.md` y `DESIGN.md`. Ese archivo manda para ese trabajo: define las fases pendientes, las restricciones y los dos modos de ejecución.
Para esa rama valen estas excepciones a las reglas de arriba:
- No hagas `git pull` (la rama no tiene remoto) y nunca hagas push ni merge.
- El trabajo se organiza en las fases del rediseño (2 a 5), no en las fases A–G de `PLAN.md`.
- "Pedí confirmación antes de cambios grandes" se cumple así: en el modo con pausas, frená al final de cada fase y esperá el "Confirmado" de Leo; en el modo desatendido (solo si el prompt dice "MODO DESATENDIDO") no hay nadie para confirmar, así que seguí el protocolo de `docs/REDISENO-V2.md` y respetá sus prohibiciones absolutas.
