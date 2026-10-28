# CubeSolver (`cubos-web`)

Aplicación web progresiva (PWA) y móvil de speedcubing con cronómetro WCA, guías completas de métodos verificadas matemáticamente, guía animada de notación, entrenador de casos y sincronización opcional en la nube.

## Secciones principales

1. **Timer (`#/timer`):**
   - Cronómetro WCA con inspección configurable (avisos a los 8 s y 12 s, +2 y DNF automáticos, retardo de mantener pulsado configurable en escritorio y móvil).
   - Mezclas oficiales con vista 2D/3D para **3x3, 2x2, 4x4, 5x5, 7x7, Megaminx y Pyraminx**.
   - Estadísticas en vivo (`Mejor`, `Media`, `Ao5`, `Ao12`, gráfico de tendencia) y exportación/importación JSON.
2. **Métodos (`#/metodos`):**
   - Guías tipo presentación con progreso de casos aprendidos, miniaturas SVG 2D (2D-LL e isométricas) y visor 3D compartido bajo demanda:
     - **2x2:** Principiante, Ortega, CLL (42 casos) y referencia EG.
     - **3x3:** Principiante (7 pasos), CFOP (Cruz, F2L 41 casos, OLL 57 casos + 10 de 2-look, PLL 21 casos + 6 de 2-look), Roux (FB, SB, CMLL 42 casos, LSE) y referencia ZZ.
     - **4x4:** Reducción (centros, aristas, 3x3 y paridades OLL/PLL) y Yau.
     - **5x5:** Reducción (centros, aristas por freeslice, 3x3 y paridad de aristas) y Yau5.
     - **7x7:** Reducción por barras de $1\times 5$, emparejamiento de aristas (midges, wings internas y externas) y paridades.
     - **Megaminx:** Método estándar en 6 etapas (Estrella, Primera cara, F2L, S2L, Resto de caras, Última capa en 4 pasos).
     - **Pyraminx:** Principiante, Keyhole, L4E, Top-First y 1-Flip.
3. **Notación (`#/notacion`):**
   - Guía interactiva para los 7 puzzles con variantes normal / `'` / `2` / `++` / `--`, animación 3D y probador de secuencias en vivo con validación en español.
4. **Entrenar (`#/entrenar`):**
   - Entrenador de algoritmos por grupo (`PLL`, `OLL`, `F2L`, `CMLL`, `OLL 2x2`, `PBL`) con estadísticas por caso.
5. **Cuenta y Sincronización (`src/cloud-sync.js`):**
   - Arquitectura *local-first*: la app funciona al 100% sin cuenta usando `localStorage`.
   - Inicio de sesión opcional con Google (Firebase Auth + Cloud Firestore) con fusión por unión sin pérdida de tiempos, soporte offline y borrado con *tombstones*. Ver instrucciones en [`SETUP-NUBE.md`](./SETUP-NUBE.md).

## Comandos de desarrollo y verificación

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Ejecutar todos los tests unitarios (timer, inspección, router, métodos, notación, sync)
npm test

# Verificar matemáticamente todos los algoritmos de métodos y entrenador con KPuzzle
npm run verify-algs

# Build de producción (PWA)
npm run build
```

## Licencias y atribuciones de terceros

- **[`cubing` (`cubing.js`)](https://js.cubing.net/)** — por Lucas Garron y colaboradores. Licenciado bajo **GPL-3.0-or-later / MPL-2.0** (ver `node_modules/cubing/LICENSE.md`). Utilizado para representación matemática `KPuzzle`/`KPattern`, generación de mezclas y visualización 3D (`<twisty-player>`).
- **[`firebase` (Firebase JS SDK)](https://firebase.google.com/)** — por Google LLC. Licenciado bajo **Apache-2.0**. Utilizado de forma opcional y con carga diferida para autenticación con Google y sincronización en Cloud Firestore.
- **[`@fontsource-variable/space-grotesk`](https://fontsource.org/fonts/space-grotesk)** — por Florian Karsten. Licenciado bajo **SIL Open Font License 1.1 (OFL-1.1)**.
- **[`@fontsource-variable/jetbrains-mono`](https://fontsource.org/fonts/jetbrains-mono)** — por JetBrains s.r.o. Licenciado bajo **SIL Open Font License 1.1 (OFL-1.1)**.
- **[`vite`](https://vite.dev/) y [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)** — Licenciados bajo **MIT**.
