// Sección Solver (#/solver): editor interactivo 2D + visor 3D sincronizado,
// validador matemático en español, resolución en Web Worker y reproductor paso a paso
// para 2x2, 3x3, 4x4, 5x5 y Pyraminx + modo "Deshacer mezcla".

import {
  SOLVER_PUZZLES,
  getSolverEngine,
  solvePuzzlePattern,
  solveByInvertingScramble,
  invertAlgStr,
} from './solver-engine.js';
import {
  CUBE_FACES,
  PYRAMINX_FACES,
  getPuzzlePalette,
  getOrientationGuide,
  createSolvedStickers,
  createEmptyStickers,
  cloneStickers,
  countStickersByColor,
  patternToStickers,
  validateAndBuildPattern,
} from './solver-validator.js';
import { parseNotationSequence, normalizePuzzleKey } from './notation-parser.js';
import { loadSolverPrefs, saveSolverPrefs } from './cloud-sync.js';
import { loadCustomScrambleInTimer } from './ui.js';
import { nextScramble } from './scramble.js';
import { getPlayer, updatePlayerOptions } from './twisty/playerManager.js';

const FACE_TITLES_CUBE = {
  U: 'U · Arriba (Blanco)',
  L: 'L · Izquierda (Naranja)',
  F: 'F · Frente (Verde)',
  R: 'R · Derecha (Rojo)',
  B: 'B · Atrás (Azul)',
  D: 'D · Abajo (Amarillo)',
};

const FACE_TITLES_PYRAMINX = {
  F: 'F · Frente (Verde)',
  L: 'L · Izquierda (Rojo)',
  R: 'R · Derecha (Azul)',
  D: 'D · Abajo (Amarillo)',
};

// Coordenadas SVG para los 9 triángulos de una cara de Pyraminx (vista △ normal y vista ▽ invertida para D)
function getPyraminxTrianglePoints(idx, inverted = false) {
  // Triángulo equilátero en caja 180 x 156:
  // Fila 0: idx 0 (△)
  // Fila 1: idx 1 (△), 2 (▽), 3 (△)
  // Fila 2: idx 4 (△), 5 (▽), 6 (△), 7 (▽), 8 (△)
  const w = 180;
  const h = 156;
  const dx = w / 6; // 30
  const dy = h / 3; // 52

  const upTri = (cx, topY) => {
    const p1 = `${cx},${topY}`;
    const p2 = `${cx - dx},${topY + dy}`;
    const p3 = `${cx + dx},${topY + dy}`;
    return `${p1} ${p2} ${p3}`;
  };
  const downTri = (cx, topY) => {
    const p1 = `${cx - dx},${topY}`;
    const p2 = `${cx + dx},${topY}`;
    const p3 = `${cx},${topY + dy}`;
    return `${p1} ${p2} ${p3}`;
  };

  if (!inverted) {
    switch (idx) {
      case 0: return upTri(3 * dx, 0);
      case 1: return upTri(2 * dx, dy);
      case 2: return downTri(3 * dx, dy);
      case 3: return upTri(4 * dx, dy);
      case 4: return upTri(1 * dx, 2 * dy);
      case 5: return downTri(2 * dx, 2 * dy);
      case 6: return upTri(3 * dx, 2 * dy);
      case 7: return downTri(4 * dx, 2 * dy);
      case 8: return upTri(5 * dx, 2 * dy);
    }
  } else {
    // En la cara D desplegada debajo de F, la fila 2 (4..8: L — FD — R) queda arriba pegada a F,
    // la fila 1 (1..3) al medio, y la punta B (0) abajo del todo.
    const invUp = (cx, botY) => `${cx},${botY} ${cx - dx},${botY - dy} ${cx + dx},${botY - dy}`;
    const invDown = (cx, botY) => `${cx - dx},${botY} ${cx + dx},${botY} ${cx},${botY - dy}`;
    switch (idx) {
      case 4: return invUp(1 * dx, dy);
      case 5: return invDown(2 * dx, dy);
      case 6: return invUp(3 * dx, dy);
      case 7: return invDown(4 * dx, dy);
      case 8: return invUp(5 * dx, dy);
      case 1: return invUp(2 * dx, 2 * dy);
      case 2: return invDown(3 * dx, 2 * dy);
      case 3: return invUp(4 * dx, 2 * dy);
      case 0: return invUp(3 * dx, 3 * dy);
    }
  }
  return '';
}

const solverState = {
  puzzleKey: '3x3',
  mode: 'paint', // 'paint' | 'undo-scramble'
  netViewMode: 'full', // 'full' | 'single-face' (útil en 4x4 y 5x5 en móvil)
  activeFace: 'F',
  selectedColor: 'U',
  stickers: createSolvedStickers('3x3'),
  undoStack: [],
  redoStack: [],
  validation: { valid: true, errors: [], highlightStickers: [] },
  previewAlg: '', // Algoritmo equivalente al estado actual para el visor 3D
  scrambleInput: '',
  solving: false,
  solveProgress: { stage: 0, totalStages: 1, label: '', percent: 0 },
  solution: null, // { alg, moves, stages, moveDescriptions, baseSetupAlg }
  currentStep: 0, // 0..moves.length
  isPlaying: false,
  stepByStepMode: false,
  vis: '3D',
  prefs: loadSolverPrefs(),
};

let activeSolverPlayer = null;

let activeWorker = null;
let workerJobId = 0;
let playTimer = null;
let keydownBound = false;

function stopPlayback() {
  solverState.isPlaying = false;
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

function cancelWorkerSolve() {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
  solverState.solving = false;
}

function getPuzzleMeta(key) {
  return SOLVER_PUZZLES.find((p) => p.id === key) || SOLVER_PUZZLES[1];
}

function pushUndoSnapshot() {
  solverState.undoStack.push(cloneStickers(solverState.stickers));
  if (solverState.undoStack.length > 60) solverState.undoStack.shift();
  solverState.redoStack = [];
}

export async function renderSolver(container, route) {
  if (!container) return;
  stopPlayback();

  const requestedKey = route?.puzzle ? normalizePuzzleKey(route.puzzle) : solverState.puzzleKey;
  const validKey = SOLVER_PUZZLES.some((p) => p.id === requestedKey) ? requestedKey : '3x3';

  if (validKey !== solverState.puzzleKey) {
    cancelWorkerSolve();
    solverState.puzzleKey = validKey;
    solverState.stickers = createSolvedStickers(validKey);
    solverState.selectedColor = validKey === 'pyraminx' ? 'F' : 'U';
    solverState.activeFace = 'F';
    solverState.netViewMode = validKey === '4x4' || validKey === '5x5' ? 'single-face' : 'full';
    solverState.undoStack = [];
    solverState.redoStack = [];
    solverState.previewAlg = '';
    solverState.solution = null;
    solverState.currentStep = 0;
  }

  solverState.validation = await validateAndBuildPattern(
    solverState.puzzleKey,
    solverState.stickers
  );

  renderSolverDOM(container);
}

function renderSolverDOM(container) {
  const puzzleKey = solverState.puzzleKey;
  const meta = getPuzzleMeta(puzzleKey);
  const palette = getPuzzlePalette(puzzleKey);
  const colorMap = Object.fromEntries(palette.map((c) => [c.id, c]));
  const { summary, unpainted } = countStickersByColor(puzzleKey, solverState.stickers);
  const highlightSet = new Set(solverState.validation.highlightStickers || []);
  const isBigCube = puzzleKey === '4x4' || puzzleKey === '5x5';
  const facesList = puzzleKey === 'pyraminx' ? PYRAMINX_FACES : CUBE_FACES;
  const faceTitles = puzzleKey === 'pyraminx' ? FACE_TITLES_PYRAMINX : FACE_TITLES_CUBE;

  const topHtml = `
      <nav class="breadcrumbs" aria-label="Ruta de navegación">
        <a href="#/timer">Inicio</a>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <a href="#/solver">Solver</a>
        <span class="breadcrumb-sep" aria-hidden="true">/</span>
        <span aria-current="page">${meta.name}</span>
      </nav>

      <header class="solver-hero">
        <div class="solver-hero-text">
          <div class="method-chips">
            <span class="chip chip-accent">Solver verificado con KPuzzle</span>
            <span class="chip">2x2 · 3x3 · 4x4 · 5x5 · Pyraminx</span>
            <span class="chip">Ejecución en Web Worker</span>
          </div>
          <h1>Solver paso a paso · ${meta.name}</h1>
          <p class="solver-lead">
            Pintá las caras de tu ${meta.name} tal como lo tenés en la mano o pegá una mezcla para obtener una solución verificada matemáticamente y reproducirla movimiento por movimiento en 3D.
          </p>
        </div>
      </header>

      <!-- Selector de puzzle (solo los 5 puzzles con solver real) -->
      <div class="solver-puzzle-bar" role="tablist" aria-label="Seleccionar puzzle del Solver">
        ${SOLVER_PUZZLES.map(
          (p) => `
          <a
            href="#/solver/${p.id}"
            role="tab"
            class="solver-puzzle-chip ${p.id === puzzleKey ? 'is-active' : ''}"
            aria-selected="${p.id === puzzleKey ? 'true' : 'false'}"
          >
            <span class="solver-puzzle-name">${p.name}</span>
          </a>
        `
        ).join('')}
      </div>

      <!-- Selector de modo: Pintar estado vs Deshacer mezcla -->
      <div class="solver-mode-tabs" role="tablist" aria-label="Modo de entrada del Solver">
        <button
          type="button"
          role="tab"
          class="solver-mode-btn ${solverState.mode === 'paint' ? 'is-active' : ''}"
          data-mode="paint"
          aria-selected="${solverState.mode === 'paint' ? 'true' : 'false'}"
        >
          🎨 Pintar estado (Editor 2D + 3D)
        </button>
        <button
          type="button"
          role="tab"
          class="solver-mode-btn ${solverState.mode === 'undo-scramble' ? 'is-active' : ''}"
          data-mode="undo-scramble"
          aria-selected="${solverState.mode === 'undo-scramble' ? 'true' : 'false'}"
        >
          ⏪ Deshacer mezcla paso a paso
        </button>
      </div>

      <div class="solver-orientation-banner" role="note">
        <span class="solver-orientation-icon" aria-hidden="true">🧭</span>
        <span>${getOrientationGuide(puzzleKey)}</span>
      </div>
  `;

  const leftHtml =
    solverState.mode === 'paint'
      ? `
            <div class="solver-card-head">
              <div>
                <h2>1. Pintá los stickers de tu ${meta.name}</h2>
                <p class="solver-sub">Elegí un color de la paleta y tocá cada casilla de la red 2D.</p>
              </div>
              <div class="solver-history-btns">
                <button type="button" class="btn-secondary btn-sm" id="solver-undo-btn" ${solverState.undoStack.length === 0 ? 'disabled' : ''} title="Deshacer cambio">
                  ↶ Deshacer
                </button>
                <button type="button" class="btn-secondary btn-sm" id="solver-redo-btn" ${solverState.redoStack.length === 0 ? 'disabled' : ''} title="Rehacer cambio">
                  ↷ Rehacer
                </button>
              </div>
            </div>

            <!-- Paleta de colores con contador de stickers restantes -->
            <div class="solver-palette" role="radiogroup" aria-label="Paleta de colores">
              ${summary
                .map((c) => {
                  const isSelected = solverState.selectedColor === c.id;
                  const statusClass =
                    c.remaining === 0
                      ? 'is-complete'
                      : c.remaining < 0
                        ? 'is-over'
                        : 'is-pending';
                  return `
                  <button
                    type="button"
                    role="radio"
                    aria-checked="${isSelected ? 'true' : 'false'}"
                    class="solver-color-btn ${isSelected ? 'is-selected' : ''} ${statusClass}"
                    data-color="${c.id}"
                  >
                    <span class="solver-color-swatch" style="background:${c.hex};border-color:${c.border}"></span>
                    <span class="solver-color-info">
                      <span class="solver-color-name">${c.name} (${c.face})</span>
                      <span class="solver-color-count">${c.used}/${c.total}</span>
                    </span>
                  </button>
                `;
                })
                .join('')}
            </div>

            <!-- Acciones rápidas sobre el estado -->
            <div class="solver-quick-actions">
              <button type="button" class="btn-secondary btn-sm" id="solver-reset-solved-btn">
                ✓ Resuelto
              </button>
              <button type="button" class="btn-secondary btn-sm" id="solver-clear-btn">
                🧹 Limpiar caras
              </button>
              <button type="button" class="btn-secondary btn-sm" id="solver-random-scramble-btn">
                🎲 Mezcla aleatoria
              </button>
              ${
                isBigCube
                  ? `
                <div class="solver-view-switch" role="group" aria-label="Modo de vista de la red">
                  <button
                    type="button"
                    class="btn-secondary btn-sm ${solverState.netViewMode === 'single-face' ? 'is-active' : ''}"
                    data-net-view="single-face"
                  >
                    🔍 Cara por cara (Móvil)
                  </button>
                  <button
                    type="button"
                    class="btn-secondary btn-sm ${solverState.netViewMode === 'full' ? 'is-active' : ''}"
                    data-net-view="full"
                  >
                    🗺️ Red completa
                  </button>
                </div>
              `
                  : ''
              }
            </div>

            <!-- Cargar desde mezcla escrita -->
            <details class="solver-load-scramble-details">
              <summary>📋 Cargar estado desde una secuencia de mezcla</summary>
              <div class="solver-load-scramble-box">
                <input
                  type="text"
                  id="solver-paste-scramble-input"
                  class="notation-seq-input"
                  placeholder="Pegá una mezcla válida de ${meta.name} (ej. R U R' U')..."
                  value="${escapeAttr(solverState.scrambleInput)}"
                />
                <button type="button" class="btn-secondary btn-sm" id="solver-apply-scramble-btn">
                  Aplicar al editor
                </button>
              </div>
              <p class="solver-paste-feedback" id="solver-paste-feedback" hidden></p>
            </details>

            ${
              isBigCube && solverState.netViewMode === 'single-face'
                ? renderSingleFaceSelector(facesList, faceTitles)
                : ''
            }

            <!-- Red 2D interactiva -->
            <div class="solver-net-wrapper" data-puzzle="${puzzleKey}" data-net-view="${solverState.netViewMode}">
              ${
                puzzleKey === 'pyraminx'
                  ? renderPyraminxNet(solverState.stickers, colorMap, highlightSet)
                  : isBigCube && solverState.netViewMode === 'single-face'
                    ? renderSingleCubeFace(
                        puzzleKey,
                        solverState.activeFace,
                        solverState.stickers[solverState.activeFace],
                        colorMap,
                        highlightSet,
                        faceTitles[solverState.activeFace]
                      )
                    : renderFullCubeNet(puzzleKey, solverState.stickers, colorMap, highlightSet)
              }
            </div>

            <!-- Estado de validación previo a resolver -->
            <div
              class="solver-validation-box ${solverState.validation.valid ? 'is-valid' : 'is-invalid'}"
              id="solver-validation-box"
              role="status"
              aria-live="polite"
            >
              ${
                solverState.validation.valid
                  ? `
                  <div class="solver-val-ok">
                    <span class="solver-val-badge">✓ Estado válido</span>
                    <span>Todas las piezas, orientaciones y paridades son físicamente resolubles.</span>
                  </div>
                `
                  : `
                  <div class="solver-val-err">
                    <span class="solver-val-badge">⚠ Estado imposible o incompleto</span>
                    <ul class="solver-val-list">
                      ${solverState.validation.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}
                    </ul>
                  </div>
                `
              }
            </div>

            <!-- Botón principal de resolución y barra de progreso -->
            <div class="solver-solve-actions">
              <button
                type="button"
                class="btn-primary solver-solve-btn"
                id="solver-solve-btn"
                ${!solverState.validation.valid || solverState.solving ? 'disabled' : ''}
              >
                ${solverState.solving ? 'Calculando solución…' : `✨ Resolver ${meta.name}`}
              </button>
              ${
                solverState.solving
                  ? `
                  <button type="button" class="btn-secondary" id="solver-cancel-btn">
                    Cancelar
                  </button>
                `
                  : ''
              }
            </div>

            <div class="solver-progress-card" id="solver-progress-card" ${solverState.solving ? '' : 'hidden'}>
              <div class="solver-progress-head">
                <span id="solver-progress-label">${escapeHtml(solverState.solveProgress.label || 'Buscando solución…')}</span>
                <span id="solver-progress-pct">${Math.round(solverState.solveProgress.percent || 0)}%</span>
              </div>
              <div class="solver-progress-bar">
                <div class="solver-progress-fill" id="solver-progress-fill" style="width:${Math.round(solverState.solveProgress.percent || 10)}%"></div>
              </div>
            </div>
          `
      : `
            <!-- Modo 2: Deshacer mezcla -->
            <div class="solver-card-head">
              <div>
                <h2>1. Pegá la mezcla a deshacer (${meta.name})</h2>
                <p class="solver-sub">
                  Si aplicaste una mezcla desde el estado resuelto y querés volver a resolver el cubo paso a paso, escribí o pegá la mezcla acá.
                </p>
              </div>
            </div>

            <div class="solver-undo-scramble-form">
              <label for="solver-undo-input" class="solver-label">Secuencia de mezcla (${meta.name})</label>
              <textarea
                id="solver-undo-input"
                class="solver-undo-textarea"
                rows="3"
                placeholder="Ej: R U R' U' F' U2 R..."
              >${escapeHtml(solverState.scrambleInput)}</textarea>
              <div class="solver-quick-actions">
                <button type="button" class="btn-secondary btn-sm" id="solver-undo-random-btn">
                  🎲 Probar con mezcla aleatoria
                </button>
                <button type="button" class="btn-primary" id="solver-undo-generate-btn">
                  ⏪ Generar pasos para deshacer mezcla
                </button>
              </div>
              <div id="solver-undo-feedback" class="solver-validation-box" hidden></div>
            </div>
          `;

  const playerHeadHtml = `
            <div>
              <h2>2. Visor 3D y Reproductor paso a paso</h2>
              <p class="solver-sub">Arrastrá el puzzle 3D para mirarlo desde cualquier ángulo.</p>
            </div>
            <div class="solver-history-btns">
              <button type="button" class="btn-secondary btn-sm" id="solver-vis-btn" title="Cambiar entre vista 3D y red 2D">
                Vista: ${solverState.vis || '3D'}
              </button>
              ${
                solverState.solution && solverState.currentStep === solverState.solution.moves.length
                  ? `<span class="solver-solved-badge">🎉 ¡Resuelto!</span>`
                  : ''
              }
            </div>
  `;

  const solutionHtml = renderSolutionPlayerSection(puzzleKey, meta);
  const existingStage = container.querySelector('#solver-3d-stage');

  if (existingStage && container.querySelector('.solver-page')) {
    const topRegion = container.querySelector('#solver-top-region');
    const leftRegion = container.querySelector('#solver-left-region');
    const headRegion = container.querySelector('#solver-player-head');
    const solRegion = container.querySelector('#solver-solution-region');
    if (topRegion) topRegion.innerHTML = topHtml;
    if (leftRegion) leftRegion.innerHTML = leftHtml;
    if (headRegion) headRegion.innerHTML = playerHeadHtml;
    if (solRegion) solRegion.innerHTML = solutionHtml;
  } else {
    container.innerHTML = `
      <div class="solver-page">
        <div id="solver-top-region">${topHtml}</div>

        <div class="solver-workspace">
          <!-- Columna izquierda: Editor 2D o Entrada de mezcla -->
          <section class="solver-editor-card" id="solver-left-region" aria-label="Configuración del estado del puzzle">
            ${leftHtml}
          </section>

          <!-- Columna derecha: Visor 3D único y Reproductor paso a paso -->
          <section class="solver-player-card" aria-label="Visor 3D y solución paso a paso">
            <div class="solver-card-head" id="solver-player-head">
              ${playerHeadHtml}
            </div>

            <div class="solver-3d-stage" id="solver-3d-stage"></div>

            <div id="solver-solution-region">
              ${solutionHtml}
            </div>
          </section>
        </div>

        <footer class="solver-footer-note">
          <p>
            <strong>Nota sobre 7x7 y Megaminx:</strong> Por su enorme espacio de estados y tiempos de cómputo en dispositivos móviles, 7x7 y Megaminx no tienen solver automático de estado arbitrario; podés aprender sus métodos completos con casos verificados en <a href="#/metodos/7x7">Métodos 7x7</a> y <a href="#/metodos/megaminx">Métodos Megaminx</a>.
          </p>
        </footer>
      </div>
    `;
  }

  mountSolverTwistyPlayer(container);
  bindSolverEvents(container);
}

function renderSingleFaceSelector(facesList, faceTitles) {
  return `
    <div class="solver-face-tabs" role="tablist" aria-label="Elegir cara para pintar">
      ${facesList
        .map(
          (f) => `
        <button
          type="button"
          role="tab"
          class="solver-face-tab ${solverState.activeFace === f ? 'is-active' : ''}"
          data-face-tab="${f}"
          aria-selected="${solverState.activeFace === f ? 'true' : 'false'}"
        >
          ${f}
        </button>
      `
        )
        .join('')}
      <span class="solver-face-current-title">${faceTitles[solverState.activeFace] || solverState.activeFace}</span>
    </div>
  `;
}

function renderSingleCubeFace(puzzleKey, face, faceStickers, colorMap, highlightSet, title) {
  const n = puzzleKey === '4x4' ? 4 : puzzleKey === '5x5' ? 5 : puzzleKey === '2x2' ? 2 : 3;
  const fixedIdx = n % 2 === 1 ? Math.floor((n * n) / 2) : -1;

  return `
    <div class="solver-single-face-wrap">
      <div class="solver-face-header">${escapeHtml(title)}</div>
      <div class="solver-face-grid solver-face-grid-zoom" style="--grid-n:${n}">
        ${faceStickers
          .map((colId, idx) => {
            const c = colorMap[colId];
            const sk = `${face}:${idx}`;
            const isHighlighted = highlightSet.has(sk);
            const isFixed = idx === fixedIdx;
            const bg = c ? c.hex : 'rgba(30,41,59,0.75)';
            const border = c ? c.border : '#475569';
            return `
            <button
              type="button"
              class="solver-sticker-btn ${isHighlighted ? 'is-error' : ''} ${!c ? 'is-empty' : ''} ${isFixed ? 'is-fixed-center' : ''}"
              data-sticker="${sk}"
              style="background:${bg};border-color:${border}"
              aria-label="Cara ${face} casilla ${idx + 1}: ${c ? c.name : 'Sin pintar'}"
              ${isFixed ? 'title="Centro fijo de referencia"' : ''}
            >
              ${isFixed ? `<span class="solver-center-letter">${face}</span>` : ''}
            </button>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function renderFullCubeNet(puzzleKey, stickers, colorMap, highlightSet) {
  const n = puzzleKey === '4x4' ? 4 : puzzleKey === '5x5' ? 5 : puzzleKey === '2x2' ? 2 : 3;
  const fixedIdx = n % 2 === 1 ? Math.floor((n * n) / 2) : -1;

  const renderFaceBlock = (face) => {
    const arr = stickers[face] || [];
    return `
      <div class="solver-net-face" data-face="${face}">
        <span class="solver-net-face-label">${face}</span>
        <div class="solver-face-grid" style="--grid-n:${n}">
          ${arr
            .map((colId, idx) => {
              const c = colorMap[colId];
              const sk = `${face}:${idx}`;
              const isHighlighted = highlightSet.has(sk);
              const isFixed = idx === fixedIdx;
              const bg = c ? c.hex : 'rgba(30,41,59,0.75)';
              const border = c ? c.border : '#475569';
              return `
              <button
                type="button"
                class="solver-sticker-btn ${isHighlighted ? 'is-error' : ''} ${!c ? 'is-empty' : ''} ${isFixed ? 'is-fixed-center' : ''}"
                data-sticker="${sk}"
                style="background:${bg};border-color:${border}"
                aria-label="Cara ${face} casilla ${idx + 1}: ${c ? c.name : 'Sin pintar'}"
              >
                ${isFixed ? `<span class="solver-center-letter">${face}</span>` : ''}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  };

  return `
    <div class="solver-cube-net" data-size="${n}">
      <div class="solver-net-row solver-net-row-top">
        <div class="solver-net-spacer"></div>
        ${renderFaceBlock('U')}
        <div class="solver-net-spacer"></div>
        <div class="solver-net-spacer"></div>
      </div>
      <div class="solver-net-row solver-net-row-mid">
        ${renderFaceBlock('L')}
        ${renderFaceBlock('F')}
        ${renderFaceBlock('R')}
        ${renderFaceBlock('B')}
      </div>
      <div class="solver-net-row solver-net-row-bot">
        <div class="solver-net-spacer"></div>
        ${renderFaceBlock('D')}
        <div class="solver-net-spacer"></div>
        <div class="solver-net-spacer"></div>
      </div>
    </div>
  `;
}

function renderPyraminxNet(stickers, colorMap, highlightSet) {
  const renderPyrFace = (face, label, inverted = false) => {
    const arr = stickers[face] || [];
    return `
      <div class="solver-pyr-face-card" data-face="${face}">
        <span class="solver-net-face-label">${label}</span>
        <svg viewBox="0 0 180 156" class="solver-pyr-svg" role="group" aria-label="Cara ${face}">
          ${arr
            .map((colId, idx) => {
              const c = colorMap[colId];
              const sk = `${face}:${idx}`;
              const isHighlighted = highlightSet.has(sk);
              const fill = c ? c.hex : '#1E293B';
              const stroke = isHighlighted ? '#EF4444' : '#0F172A';
              const strokeW = isHighlighted ? '4.5' : '2.5';
              const pts = getPyraminxTrianglePoints(idx, inverted);
              return `
              <polygon
                points="${pts}"
                fill="${fill}"
                stroke="${stroke}"
                stroke-width="${strokeW}"
                stroke-linejoin="round"
                class="solver-pyr-poly ${isHighlighted ? 'is-error' : ''}"
                data-sticker="${sk}"
                tabindex="0"
                role="button"
                aria-label="Cara ${face} triángulo ${idx + 1}: ${c ? c.name : 'Sin pintar'}"
              />
            `;
            })
            .join('')}
        </svg>
      </div>
    `;
  };

  return `
    <div class="solver-pyraminx-net">
      <div class="solver-pyr-row-top">
        ${renderPyrFace('L', 'L · Izquierda (Rojo)', false)}
        ${renderPyrFace('F', 'F · Frente (Verde)', false)}
        ${renderPyrFace('R', 'R · Derecha (Azul)', false)}
      </div>
      <div class="solver-pyr-row-bot">
        ${renderPyrFace('D', 'D · Abajo (Amarillo)', true)}
      </div>
    </div>
  `;
}

function renderSolutionPlayerSection(puzzleKey, meta) {
  const sol = solverState.solution;
  if (!sol) {
    return `
      <div class="solver-empty-solution">
        <p>
          Configurá el estado del ${meta.name} a la izquierda y presioná <strong>"Resolver ${meta.name}"</strong> para ver la lista de movimientos y reproducir la solución paso a paso.
        </p>
      </div>
    `;
  }

  const totalMoves = sol.moves.length;
  const step = Math.min(Math.max(0, solverState.currentStep), totalMoves);
  const currentMoveObj = step > 0 ? sol.moveDescriptions[step - 1] : null;
  const nextMoveObj = step < totalMoves ? sol.moveDescriptions[step] : null;
  const activeStageTitle =
    nextMoveObj?.stageTitle || currentMoveObj?.stageTitle || sol.stages?.[0]?.title || 'Solución';

  return `
    <div class="solver-solution-panel">
      <div class="solver-solution-summary">
        <div>
          <span class="solver-stage-pill">${escapeHtml(activeStageTitle)}</span>
          <h3>
            ${
              totalMoves === 0
                ? '¡El puzzle ya está resuelto! (0 movimientos)'
                : `Solución en ${totalMoves} ${totalMoves === 1 ? 'movimiento' : 'movimientos'}`
            }
          </h3>
        </div>
        <span class="solver-step-counter">Paso ${step} de ${totalMoves}</span>
      </div>

      <!-- Explicación del movimiento actual / próximo -->
      <div class="solver-move-callout">
        ${
          totalMoves === 0
            ? `<p class="solver-move-explain">El estado ingresado ya se encuentra resuelto.</p>`
            : step === totalMoves
              ? `
              <div class="solver-move-celebrate">
                <strong>🎉 ¡Resuelto! Completaste los ${totalMoves} movimientos.</strong>
                <p>Último giro aplicado: <code>${escapeHtml(currentMoveObj?.token || '')}</code> — ${escapeHtml(currentMoveObj?.explanation || '')}</p>
              </div>
            `
              : `
              <div class="solver-move-next-info">
                <div class="solver-move-token-badge">
                  <span class="solver-move-badge-label">Siguiente giro (#${step + 1})</span>
                  <strong class="solver-move-badge-tok">${escapeHtml(nextMoveObj?.token || '')}</strong>
                  <span class="solver-move-face-tag">Cara ${escapeHtml(nextMoveObj?.face || '')}</span>
                </div>
                <div class="solver-move-text">
                  <p class="solver-move-explain">
                    <strong>${escapeHtml(nextMoveObj?.token || '')}:</strong> ${escapeHtml(nextMoveObj?.explanation || '')}
                  </p>
                  <a href="#/notacion/${puzzleKey}" class="solver-notation-link">
                    ¿Qué significa ${escapeHtml(nextMoveObj?.token || '')}? Ver en Notación →
                  </a>
                </div>
              </div>
            `
        }
      </div>

      <!-- Controles de reproducción -->
      <div class="solver-transport-controls" role="group" aria-label="Controles del reproductor">
        <button type="button" class="btn-secondary btn-sm" id="solver-step-start" ${step === 0 ? 'disabled' : ''} title="Ir al inicio">
          ⏮ Inicio
        </button>
        <button type="button" class="btn-secondary btn-sm" id="solver-step-prev" ${step === 0 ? 'disabled' : ''} title="Paso anterior">
          ◀ Anterior
        </button>
        <button type="button" class="btn-primary solver-play-btn" id="solver-play-toggle" ${totalMoves === 0 ? 'disabled' : ''}>
          ${solverState.isPlaying ? '⏸ Pausar' : step >= totalMoves ? '↻ Repetir' : '▶ Reproducir'}
        </button>
        <button type="button" class="btn-secondary btn-sm" id="solver-step-next" ${step >= totalMoves ? 'disabled' : ''} title="Paso siguiente (o barra espaciadora)">
          Siguiente ▶
        </button>
        <button type="button" class="btn-secondary btn-sm" id="solver-step-end" ${step >= totalMoves ? 'disabled' : ''} title="Ir al final">
          ⏭ Final
        </button>
      </div>

      <!-- Modo Paso a paso + Sliders de Tiempo entre movimientos y Velocidad -->
      <div class="solver-prefs-grid">
        <label class="solver-checkbox-row">
          <input type="checkbox" id="solver-step-by-step-chk" ${solverState.stepByStepMode ? 'checked' : ''} />
          <span>Modo Paso a paso (detener tras cada giro; avanzar con clic o <kbd>Espacio</kbd>)</span>
        </label>

        <div class="solver-sliders-row">
          <div class="solver-slider-field">
            <div class="solver-slider-label-row">
              <label for="solver-delay-slider">Tiempo entre movimientos</label>
              <output id="solver-delay-output">${Number(solverState.prefs.stepDelaySec).toFixed(1)} s</output>
            </div>
            <input
              type="range"
              id="solver-delay-slider"
              min="0"
              max="3"
              step="0.1"
              value="${Number(solverState.prefs.stepDelaySec)}"
            />
          </div>

          <div class="solver-slider-field">
            <div class="solver-slider-label-row">
              <label for="solver-speed-slider">Velocidad de giro 3D</label>
              <output id="solver-speed-output">${Number(solverState.prefs.turnSpeed).toFixed(2)}×</output>
            </div>
            <input
              type="range"
              id="solver-speed-slider"
              min="0.5"
              max="3"
              step="0.25"
              value="${Number(solverState.prefs.turnSpeed)}"
            />
          </div>
        </div>
      </div>

      <!-- Lista de movimientos agrupada por etapas y clickeable -->
      <div class="solver-stages-list">
        ${ renderStagesMoveList(sol, step) }
      </div>

      <!-- Botón Practicar en el Timer -->
      <div class="solver-practice-bar">
        <button type="button" class="btn-secondary" id="solver-practice-timer-btn">
          ⏱ Practicar este estado en el Timer
        </button>
      </div>
    </div>
  `;
}

function renderStagesMoveList(sol, currentStep) {
  let globalIdx = 0;
  return (sol.stages || [])
    .map((st) => {
      const stageMoves = st.alg ? st.alg.trim().split(/\s+/).filter(Boolean) : [];
      if (stageMoves.length === 0 && sol.stages.length > 1) {
        return `
          <div class="solver-stage-block">
            <div class="solver-stage-header">
              <strong>${escapeHtml(st.title)}</strong>
              <span class="solver-stage-count">0 movs (ya resuelto)</span>
            </div>
          </div>
        `;
      }
      const chipsHtml = stageMoves
        .map((tok) => {
          const moveNumber = ++globalIdx;
          const isDone = moveNumber < currentStep;
          const isCurrent = moveNumber === currentStep;
          const isNext = moveNumber === currentStep + 1;
          return `
            <button
              type="button"
              class="solver-move-chip ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''} ${isNext ? 'is-next' : ''}"
              data-step-index="${moveNumber}"
              title="Ir al movimiento #${moveNumber}: ${escapeAttr(tok)}"
            >
              <span class="solver-chip-num">${moveNumber}.</span>
              <span class="solver-chip-tok">${escapeHtml(tok)}</span>
            </button>
          `;
        })
        .join('');

      return `
        <div class="solver-stage-block">
          <div class="solver-stage-header">
            <strong>${escapeHtml(st.title)}</strong>
            <span class="solver-stage-count">${stageMoves.length} movs</span>
          </div>
          <div class="solver-moves-chips">
            ${chipsHtml}
          </div>
        </div>
      `;
    })
    .join('');
}

function mountSolverTwistyPlayer(container) {
  const stage = container.querySelector('#solver-3d-stage');
  if (!stage) return;

  const meta = getPuzzleMeta(solverState.puzzleKey);
  activeSolverPlayer = getPlayer(stage, {
    scope: 'solver',
    puzzle: meta.puzzleId,
    visualization: solverState.vis || '3D',
    tempoScale: Number(solverState.prefs.turnSpeed) || 1,
  });

  syncTwistyPlayerToState(container);
}

function syncTwistyPlayerToState(container) {
  const player = activeSolverPlayer || container.querySelector('#solver-3d-stage twisty-player');
  if (!player) return;

  const tempoScale = Number(solverState.prefs.turnSpeed) || 1;

  if (solverState.solution) {
    const sol = solverState.solution;
    const baseSetup = sol.baseSetupAlg || invertAlgStr(sol.alg);
    const appliedMoves = sol.moves.slice(0, solverState.currentStep).join(' ');
    updatePlayerOptions(player, {
      tempoScale,
      experimentalSetupAlg: baseSetup,
      alg: appliedMoves,
      timestamp: 'end',
    });
    return;
  }

  if (solverState.previewAlg) {
    updatePlayerOptions(player, {
      tempoScale,
      experimentalSetupAlg: '',
      alg: solverState.previewAlg,
      timestamp: 'end',
    });
  } else {
    updatePlayerOptions(player, {
      tempoScale,
      experimentalSetupAlg: '',
      alg: '',
    });
  }
}

async function refreshValidationAndPreview(container) {
  solverState.validation = await validateAndBuildPattern(
    solverState.puzzleKey,
    solverState.stickers
  );

  // Si el estado es válido en 2x2, 3x3 o Pyraminx, actualizamos también el visor 3D en vivo
  if (
    solverState.validation.valid &&
    (solverState.puzzleKey === '2x2' ||
      solverState.puzzleKey === '3x3' ||
      solverState.puzzleKey === 'pyraminx')
  ) {
    try {
      const quick = await solvePuzzlePattern(solverState.puzzleKey, solverState.validation.pattern);
      solverState.previewAlg = invertAlgStr(quick.alg);
    } catch {}
  }

  renderSolverDOM(container);
}

async function startSolving(container) {
  const val = await validateAndBuildPattern(solverState.puzzleKey, solverState.stickers);
  solverState.validation = val;
  if (!val.valid) {
    renderSolverDOM(container);
    return;
  }

  stopPlayback();
  cancelWorkerSolve();
  solverState.solving = true;
  solverState.solveProgress = {
    stage: 0,
    totalStages: solverState.puzzleKey === '4x4' || solverState.puzzleKey === '5x5' ? 3 : 1,
    label: 'Iniciando motor de resolución…',
    percent: 8,
  };
  renderSolverDOM(container);

  const jobId = ++workerJobId;
  const puzzleKey = solverState.puzzleKey;

  const onSolved = (result) => {
    if (jobId !== workerJobId) return;
    solverState.solving = false;
    const baseSetupAlg = invertAlgStr(result.alg);
    solverState.previewAlg = baseSetupAlg;
    solverState.solution = {
      ...result,
      baseSetupAlg,
    };
    solverState.currentStep = 0;
    renderSolverDOM(container);
  };

  const onError = (msg) => {
    if (jobId !== workerJobId) return;
    solverState.solving = false;
    solverState.validation = {
      valid: false,
      errors: [msg || 'No se pudo calcular la solución.'],
      highlightStickers: [],
    };
    renderSolverDOM(container);
  };

  if (typeof Worker !== 'undefined') {
    try {
      activeWorker = new Worker(new URL('./solver-worker.js', import.meta.url), {
        type: 'module',
      });
      activeWorker.addEventListener('message', (ev) => {
        const msg = ev.data || {};
        if (msg.id !== jobId) return;
        if (msg.type === 'progress') {
          solverState.solveProgress = msg;
          const lbl = container.querySelector('#solver-progress-label');
          const pct = container.querySelector('#solver-progress-pct');
          const fill = container.querySelector('#solver-progress-fill');
          if (lbl) lbl.textContent = msg.label || 'Calculando…';
          if (pct) pct.textContent = `${Math.round(msg.percent || 0)}%`;
          if (fill) fill.style.width = `${Math.round(msg.percent || 0)}%`;
        } else if (msg.type === 'result') {
          activeWorker?.terminate();
          activeWorker = null;
          onSolved(msg.result);
        } else if (msg.type === 'error') {
          activeWorker?.terminate();
          activeWorker = null;
          onError(msg.error);
        }
      });
      activeWorker.postMessage({
        id: jobId,
        type: 'solve',
        puzzleKey,
        patternData: val.patternData,
      });
      return;
    } catch {
      activeWorker = null;
    }
  }

  // Fallback directo si Worker no está disponible
  try {
    const res = await solvePuzzlePattern(puzzleKey, val.pattern, {
      onProgress(p) {
        solverState.solveProgress = p;
      },
    });
    onSolved(res);
  } catch (err) {
    onError(err?.message);
  }
}

function stepForward(container, animateMove = true) {
  const sol = solverState.solution;
  if (!sol || solverState.currentStep >= sol.moves.length) {
    stopPlayback();
    return;
  }
  solverState.currentStep++;
  renderSolverDOM(container);

  if (animateMove) {
    const player = container.querySelector('#solver-3d-stage twisty-player');
    if (player) {
      const baseSetup = sol.baseSetupAlg || invertAlgStr(sol.alg);
      const prevMoves = sol.moves.slice(0, solverState.currentStep - 1).join(' ');
      const curMoves = sol.moves.slice(0, solverState.currentStep).join(' ');
      try {
        player.experimentalSetupAlg = prevMoves ? `${baseSetup} ${prevMoves}` : baseSetup;
        player.alg = sol.moves[solverState.currentStep - 1];
        player.timestamp = 0;
        player.play?.();
      } catch {
        syncTwistyPlayerToState(container);
      }
    }
  }
}

function scheduleNextAutoStep(container) {
  if (!solverState.isPlaying || !solverState.solution) return;
  if (solverState.currentStep >= solverState.solution.moves.length) {
    stopPlayback();
    renderSolverDOM(container);
    return;
  }

  const delaySec = Number(solverState.prefs.stepDelaySec) || 0;
  const turnSpeed = Number(solverState.prefs.turnSpeed) || 1;
  const moveDurationMs = Math.round(450 / turnSpeed);
  const totalWaitMs = Math.max(180, moveDurationMs + Math.round(delaySec * 1000));

  playTimer = setTimeout(() => {
    if (!solverState.isPlaying) return;
    stepForward(container, true);
    if (solverState.stepByStepMode || solverState.currentStep >= solverState.solution.moves.length) {
      stopPlayback();
      renderSolverDOM(container);
    } else {
      scheduleNextAutoStep(container);
    }
  }, totalWaitMs);
}

function bindSolverEvents(container) {
  // Cambiar entre vista 3D y 2D en el visor del Solver
  const visBtn = container.querySelector('#solver-vis-btn');
  visBtn?.addEventListener('click', () => {
    solverState.vis = solverState.vis === '2D' ? '3D' : '2D';
    visBtn.textContent = `Vista: ${solverState.vis}`;
    const player = activeSolverPlayer || container.querySelector('#solver-3d-stage twisty-player');
    if (player) {
      updatePlayerOptions(player, { visualization: solverState.vis });
    }
  });

  // Cambiar modo (Pintar vs Deshacer mezcla)
  container.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopPlayback();
      solverState.mode = btn.dataset.mode;
      renderSolverDOM(container);
    });
  });

  // Selección de color en la paleta
  container.querySelectorAll('[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      solverState.selectedColor = btn.dataset.color;
      renderSolverDOM(container);
    });
  });

  // Cambio de vista en 4x4/5x5 (Cara por cara vs Red completa)
  container.querySelectorAll('[data-net-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      solverState.netViewMode = btn.dataset.netView;
      renderSolverDOM(container);
    });
  });

  // Pestañas de cara individual en modo Cara por cara
  container.querySelectorAll('[data-face-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      solverState.activeFace = btn.dataset.faceTab;
      renderSolverDOM(container);
    });
  });

  // Pintar un sticker al hacer clic/tap en la red 2D
  container.querySelectorAll('[data-sticker]').forEach((el) => {
    const paintHandler = async () => {
      const sk = el.dataset.sticker;
      if (!sk) return;
      const [face, idxStr] = sk.split(':');
      const idx = Number(idxStr);
      const n =
        solverState.puzzleKey === '4x4'
          ? 4
          : solverState.puzzleKey === '5x5'
            ? 5
            : solverState.puzzleKey === '2x2'
              ? 2
              : 3;

      // En 3x3 y 5x5 los centros fijos no se cambian para mantener la orientación WCA
      if (
        solverState.puzzleKey !== 'pyraminx' &&
        n % 2 === 1 &&
        idx === Math.floor((n * n) / 2)
      ) {
        return;
      }

      if (solverState.stickers[face]?.[idx] === solverState.selectedColor) return;
      pushUndoSnapshot();
      solverState.stickers[face][idx] = solverState.selectedColor;
      solverState.solution = null;
      await refreshValidationAndPreview(container);
    };

    el.addEventListener('click', paintHandler);
    if (el.tagName.toLowerCase() === 'polygon') {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          paintHandler();
        }
      });
    }
  });

  // Deshacer / Rehacer
  container.querySelector('#solver-undo-btn')?.addEventListener('click', async () => {
    if (!solverState.undoStack.length) return;
    solverState.redoStack.push(cloneStickers(solverState.stickers));
    solverState.stickers = solverState.undoStack.pop();
    solverState.solution = null;
    await refreshValidationAndPreview(container);
  });

  container.querySelector('#solver-redo-btn')?.addEventListener('click', async () => {
    if (!solverState.redoStack.length) return;
    solverState.undoStack.push(cloneStickers(solverState.stickers));
    solverState.stickers = solverState.redoStack.pop();
    solverState.solution = null;
    await refreshValidationAndPreview(container);
  });

  // Estado resuelto
  container.querySelector('#solver-reset-solved-btn')?.addEventListener('click', async () => {
    pushUndoSnapshot();
    solverState.stickers = createSolvedStickers(solverState.puzzleKey);
    solverState.previewAlg = '';
    solverState.solution = null;
    await refreshValidationAndPreview(container);
  });

  // Limpiar caras
  container.querySelector('#solver-clear-btn')?.addEventListener('click', async () => {
    pushUndoSnapshot();
    solverState.stickers = createEmptyStickers(solverState.puzzleKey);
    solverState.previewAlg = '';
    solverState.solution = null;
    await refreshValidationAndPreview(container);
  });

  // Mezcla aleatoria en el modo Pintar
  container.querySelector('#solver-random-scramble-btn')?.addEventListener('click', async () => {
    const meta = getPuzzleMeta(solverState.puzzleKey);
    const scr = await nextScramble(meta.timerEventId);
    const eng = await getSolverEngine();
    const state = eng.solvedPatterns[solverState.puzzleKey].applyAlg(scr);
    pushUndoSnapshot();
    solverState.stickers = await patternToStickers(solverState.puzzleKey, state);
    solverState.scrambleInput = scr;
    solverState.previewAlg = scr;
    solverState.solution = null;
    solverState.validation = await validateAndBuildPattern(
      solverState.puzzleKey,
      solverState.stickers
    );
    renderSolverDOM(container);
  });

  // Aplicar mezcla escrita al editor 2D
  container.querySelector('#solver-apply-scramble-btn')?.addEventListener('click', async () => {
    const input = container.querySelector('#solver-paste-scramble-input');
    const feedback = container.querySelector('#solver-paste-feedback');
    const raw = input?.value || '';
    solverState.scrambleInput = raw;
    const parsed = parseNotationSequence(solverState.puzzleKey, raw);
    if (!parsed.valid) {
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent = parsed.errors[0]?.reason || 'Secuencia inválida.';
      }
      return;
    }
    const eng = await getSolverEngine();
    const state = eng.solvedPatterns[solverState.puzzleKey].applyAlg(parsed.normalizedAlg);
    pushUndoSnapshot();
    solverState.stickers = await patternToStickers(solverState.puzzleKey, state);
    solverState.previewAlg = parsed.normalizedAlg;
    solverState.solution = null;
    solverState.validation = await validateAndBuildPattern(
      solverState.puzzleKey,
      solverState.stickers
    );
    renderSolverDOM(container);
  });

  // Botón Resolver / Cancelar
  container.querySelector('#solver-solve-btn')?.addEventListener('click', () => {
    startSolving(container);
  });
  container.querySelector('#solver-cancel-btn')?.addEventListener('click', () => {
    cancelWorkerSolve();
    renderSolverDOM(container);
  });

  // Modo 2: Deshacer mezcla
  container.querySelector('#solver-undo-random-btn')?.addEventListener('click', async () => {
    const meta = getPuzzleMeta(solverState.puzzleKey);
    const scr = await nextScramble(meta.timerEventId);
    solverState.scrambleInput = scr;
    const res = solveByInvertingScramble(solverState.puzzleKey, scr);
    if (res.valid) {
      solverState.previewAlg = res.scramble;
      solverState.solution = {
        ...res,
        baseSetupAlg: res.scramble,
      };
      solverState.currentStep = 0;
    }
    renderSolverDOM(container);
  });

  container.querySelector('#solver-undo-generate-btn')?.addEventListener('click', () => {
    const textarea = container.querySelector('#solver-undo-input');
    const fb = container.querySelector('#solver-undo-feedback');
    const raw = textarea?.value || '';
    solverState.scrambleInput = raw;
    const res = solveByInvertingScramble(solverState.puzzleKey, raw);
    if (!res.valid) {
      if (fb) {
        fb.hidden = false;
        fb.className = 'solver-validation-box is-invalid';
        fb.innerHTML = `<div class="solver-val-err"><span class="solver-val-badge">⚠ Mezcla inválida</span><ul class="solver-val-list">${res.errors.map((e) => `<li>${escapeHtml(e.reason)}</li>`).join('')}</ul></div>`;
      }
      return;
    }
    solverState.previewAlg = res.scramble;
    solverState.solution = {
      ...res,
      baseSetupAlg: res.scramble,
    };
    solverState.currentStep = 0;
    renderSolverDOM(container);
  });

  // Controles de reproducción
  container.querySelector('#solver-step-start')?.addEventListener('click', () => {
    stopPlayback();
    solverState.currentStep = 0;
    renderSolverDOM(container);
  });

  container.querySelector('#solver-step-prev')?.addEventListener('click', () => {
    stopPlayback();
    if (solverState.currentStep > 0) {
      solverState.currentStep--;
      renderSolverDOM(container);
    }
  });

  container.querySelector('#solver-step-next')?.addEventListener('click', () => {
    stopPlayback();
    stepForward(container, true);
  });

  container.querySelector('#solver-step-end')?.addEventListener('click', () => {
    stopPlayback();
    if (solverState.solution) {
      solverState.currentStep = solverState.solution.moves.length;
      renderSolverDOM(container);
    }
  });

  container.querySelector('#solver-play-toggle')?.addEventListener('click', () => {
    if (!solverState.solution) return;
    if (solverState.isPlaying) {
      stopPlayback();
      renderSolverDOM(container);
      return;
    }
    if (solverState.currentStep >= solverState.solution.moves.length) {
      solverState.currentStep = 0;
    }
    solverState.isPlaying = true;
    renderSolverDOM(container);
    stepForward(container, true);
    if (solverState.stepByStepMode || solverState.currentStep >= solverState.solution.moves.length) {
      stopPlayback();
      renderSolverDOM(container);
    } else {
      scheduleNextAutoStep(container);
    }
  });

  // Clic en cualquier chip de movimiento
  container.querySelectorAll('[data-step-index]').forEach((chip) => {
    chip.addEventListener('click', () => {
      stopPlayback();
      solverState.currentStep = Number(chip.dataset.stepIndex);
      renderSolverDOM(container);
    });
  });

  // Checkbox Modo Paso a paso
  container.querySelector('#solver-step-by-step-chk')?.addEventListener('change', (e) => {
    solverState.stepByStepMode = Boolean(e.target.checked);
    if (solverState.stepByStepMode) stopPlayback();
  });

  // Sliders de tiempo entre movimientos y velocidad de giro
  const delaySlider = container.querySelector('#solver-delay-slider');
  const delayOut = container.querySelector('#solver-delay-output');
  delaySlider?.addEventListener('input', () => {
    const val = Number(delaySlider.value);
    if (delayOut) delayOut.textContent = `${val.toFixed(1)} s`;
    solverState.prefs = saveSolverPrefs({ stepDelaySec: val });
  });

  const speedSlider = container.querySelector('#solver-speed-slider');
  const speedOut = container.querySelector('#solver-speed-output');
  speedSlider?.addEventListener('input', () => {
    const val = Number(speedSlider.value);
    if (speedOut) speedOut.textContent = `${val.toFixed(2)}×`;
    solverState.prefs = saveSolverPrefs({ turnSpeed: val });
    const player = container.querySelector('#solver-3d-stage twisty-player');
    if (player) player.tempoScale = val;
  });

  // Botón Practicar en el Timer
  container.querySelector('#solver-practice-timer-btn')?.addEventListener('click', () => {
    if (!solverState.solution) return;
    stopPlayback();
    const meta = getPuzzleMeta(solverState.puzzleKey);
    const scrambleToPractice =
      solverState.solution.baseSetupAlg || invertAlgStr(solverState.solution.alg);
    if (scrambleToPractice) {
      loadCustomScrambleInTimer(meta.timerEventId, scrambleToPractice);
    }
    window.location.hash = '#/timer';
  });

  // Barra espaciadora para avanzar en el reproductor cuando estamos en la vista Solver
  if (!keydownBound) {
    keydownBound = true;
    window.addEventListener('keydown', (e) => {
      if (document.body.dataset.view !== 'solver') return;
      if (
        e.target &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space' && solverState.solution) {
        e.preventDefault();
        const viewSolver = document.getElementById('view-solver');
        if (viewSolver) {
          stopPlayback();
          stepForward(viewSolver, true);
        }
      }
    });
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}
