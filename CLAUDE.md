# Cubos Web

Página web de speedcubing: timer, scrambles y guías de métodos para cubos de Rubik.

## Stack
- Vite + JavaScript (sin framework) + CSS.
- Librería `cubing.js` para scrambles (`randomScrambleForEvent`) y visualización (`<twisty-player>`).
- Datos guardados en `localStorage` (no hay servidor).
- Se publicará en GitHub Pages.

## Categorías del timer (IDs WCA de cubing.js)
2x2 `222` · 3x3 `333` · 4x4 `444` · 5x5 `555` · 7x7 `777` · Megaminx `minx` · Pyraminx `pyram`

## Etapas
1. Timer: categorías, scrambles, barra espaciadora / toque, historial, mejor, ao5, ao12 (regla WCA), +2/DNF, localStorage.
2. Visualización del scramble e inspección de 15 s.
3. Métodos: principiante, CFOP (cruz, F2L, OLL, PLL) y Roux, con casos animados.
4. Entrenador de casos (OLL/PLL/F2L al azar).
5. Deploy en GitHub Pages.

Trabajar una etapa a la vez; no adelantar etapas sin que se pida.

## Convenciones
- Código limpio y modular: un módulo JS por responsabilidad (timer, scrambles, estadísticas, almacenamiento, UI).
- Comentarios breves en español.
- Diseño oscuro, moderno, con acentos en los 6 colores del cubo. Debe funcionar bien en celular.
- Explicar los cambios en español; el usuario está aprendiendo.
