// Sección interactiva de Notación (#/notacion) con visor <twisty-player> único compartido,
// selector para los 7 puzzles, grilla de tarjetas con botones de variante y probador de secuencias en vivo.
import {
  PUZZLE_NOTATION_SPECS,
  normalizePuzzleKey,
  parseNotationSequence,
  describeMove,
} from './notation-parser.js';

const PUZZLE_ORDER = ['2x2', '3x3', '4x4', '5x5', '7x7', 'pyraminx', 'megaminx'];

let sharedPlayer = null;
let cubingReadyPromise = null;
let loopTimer = null;
let isLooping = false;
let currentTempo = 1.2;
let activeAlg = 'R';
let activePuzzleKey = '3x3';

function ensureTwistyLoaded() {
  if (!cubingReadyPromise) {
    cubingReadyPromise = import('cubing/twisty');
  }
  return cubingReadyPromise;
}

function getOrCreateNotationPlayer(puzzleId) {
  if (!sharedPlayer) {
    sharedPlayer = document.createElement('twisty-player');
    sharedPlayer.background = 'none';
    sharedPlayer.controlPanel = 'none';
    sharedPlayer.hintFacelets = 'none';
    sharedPlayer.experimentalDragInput = 'auto';
  }
  sharedPlayer.puzzle = puzzleId;
  sharedPlayer.tempoScale = currentTempo;
  return sharedPlayer;
}

function stopLoopTimer() {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
}

function playSequenceOnViewer(alg, { fromSolved = true, autoPlay = true } = {}) {
  stopLoopTimer();
  activeAlg = alg || '';
  if (!sharedPlayer) return;
  try {
    if (fromSolved) {
      sharedPlayer.experimentalSetupAlg = '';
    } else {
      // Empieza en el estado inverso para que la secuencia resuelva el puzzle
      sharedPlayer.experimentalSetupAnchor = 'end';
    }
    sharedPlayer.experimentalSetupAnchor = fromSolved ? 'start' : 'end';
    sharedPlayer.alg = activeAlg;
    sharedPlayer.tempoScale = currentTempo;
    sharedPlayer.timestamp = 0;
    if (autoPlay && activeAlg) {
      requestAnimationFrame(() => {
        try {
          sharedPlayer.play();
        } catch {
          // Ignorar en entornos sin WebGL
        }
      });
      if (isLooping) {
        const moveCount = Math.max(1, activeAlg.trim().split(/\s+/).length);
        const periodMs = Math.max(1300, Math.round((moveCount * 950) / currentTempo) + 600);
        loopTimer = setInterval(() => {
          if (!sharedPlayer || !document.body.contains(sharedPlayer)) {
            stopLoopTimer();
            return;
          }
          try {
            sharedPlayer.timestamp = 0;
            sharedPlayer.play();
          } catch {
            // Ignorar
          }
        }, periodMs);
      }
    }
  } catch {
    // Ignorar errores de carga inicial
  }
}

export function renderNotation(container, route = {}) {
  stopLoopTimer();
  const initialKey = normalizePuzzleKey(route.puzzle || route.params?.puzzle || activePuzzleKey || '3x3');
  activePuzzleKey = PUZZLE_ORDER.includes(initialKey) ? initialKey : '3x3';
  const spec = PUZZLE_NOTATION_SPECS[activePuzzleKey];
  const initialMove = route.params?.move || spec.groups[0]?.moves[0]?.base || 'R';
  activeAlg = initialMove;

  container.innerHTML = '';

  const page = document.createElement('div');
  page.className = 'methods-page notation-page';

  // 1. Header y chips de los 7 puzzles
  const header = document.createElement('header');
  header.className = 'notation-header';
  header.innerHTML = `
    <div class="notation-header-top">
      <div>
        <span class="methods-kicker">Guía interactiva 3D</span>
        <h1 class="methods-hero-title">Notación WCA y Movimientos</h1>
        <p class="methods-hero-desc">
          Tocá cualquier movimiento o variante para ver cómo gira en el modelo 3D interactivo, o escribí tu propia secuencia para validarla y animarla en tiempo real.
        </p>
      </div>
    </div>
    <div class="notation-puzzle-chips" role="tablist" aria-label="Elegir puzzle">
      ${PUZZLE_ORDER.map((key) => {
        const p = PUZZLE_NOTATION_SPECS[key];
        const active = key === activePuzzleKey;
        return `<a href="#/notacion/${key}" class="notation-puzzle-chip ${active ? 'is-active' : ''}" role="tab" aria-selected="${active}" data-puzzle-chip="${key}">
          <span>${p.name}</span>
        </a>`;
      }).join('')}
    </div>
  `;
  page.appendChild(header);

  // 2. Layout de dos columnas en escritorio (contenido a la izquierda, visor 3D sticky a la derecha; en móvil visor arriba sticky)
  const layout = document.createElement('div');
  layout.className = 'notation-layout';

  // Columna del visor 3D compartido
  const viewerAside = document.createElement('aside');
  viewerAside.className = 'notation-viewer-aside';
  const moveDesc = describeMove(activePuzzleKey, activeAlg);
  viewerAside.innerHTML = `
    <div class="notation-viewer-card">
      <div class="notation-viewer-top">
        <div>
          <span class="notation-viewer-badge" id="notation-active-badge">${activeAlg}</span>
          <h2 class="notation-viewer-title" id="notation-active-title">${moveDesc.title}</h2>
        </div>
        <span class="notation-puzzle-tag">${spec.name}</span>
      </div>
      <p class="notation-viewer-desc" id="notation-active-desc">${moveDesc.description}</p>
      <div class="notation-stage-box" id="notation-stage-box" aria-label="Visor 3D de notación">
        <div class="notation-stage-hint">Arrastrá con el mouse o el dedo para rotar la vista</div>
      </div>
      <div class="notation-controls">
        <button type="button" class="btn-secondary btn-sm" id="notation-btn-play" title="Reproducir giro">
          ▶ Reproducir
        </button>
        <button type="button" class="btn-secondary btn-sm" id="notation-btn-pause" title="Pausar animación">
          ⏸ Pausa
        </button>
        <button type="button" class="btn-secondary btn-sm" id="notation-btn-reset" title="Reiniciar al estado resuelto">
          ↺ Reiniciar
        </button>
        <button type="button" class="btn-secondary btn-sm ${isLooping ? 'is-active' : ''}" id="notation-btn-loop" aria-pressed="${isLooping}" title="Repetir en bucle">
          🔁 Loop
        </button>
      </div>
      <div class="notation-speed-row">
        <label for="notation-speed-select">Velocidad de giro:</label>
        <div class="notation-speed-pills" role="group" aria-label="Velocidad de animación">
          ${[
            { label: '0.5×', val: 0.6 },
            { label: '1×', val: 1.2 },
            { label: '1.5×', val: 1.8 },
            { label: '2×', val: 2.5 },
          ]
            .map(
              (s) =>
                `<button type="button" class="notation-speed-btn ${Math.abs(currentTempo - s.val) < 0.1 ? 'is-active' : ''}" data-tempo="${s.val}">${s.label}</button>`,
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  // Columna principal: Intro + Probador de secuencia + Grilla de tarjetas de movimientos
  const mainCol = document.createElement('div');
  mainCol.className = 'notation-main-col';

  // 2a. Intro del puzzle y regla de sentido horario
  const introCard = document.createElement('section');
  introCard.className = 'notation-intro-card';
  introCard.innerHTML = `
    <div class="notation-intro-grid">
      <div class="notation-intro-block">
        <h3>📖 ¿Cómo se lee la notación de ${spec.name}?</h3>
        <p>${spec.intro}</p>
      </div>
      <div class="notation-intro-block is-accent">
        <h3>🧭 ¿Qué significa "sentido horario"?</h3>
        <p>${spec.clockwiseRule}</p>
        ${spec.diagramNote ? `<p class="notation-diagram-note"><strong>Nota visual:</strong> ${spec.diagramNote}</p>` : ''}
      </div>
    </div>
  `;
  mainCol.appendChild(introCard);

  // 2b. Probá una secuencia en vivo
  const testerSection = document.createElement('section');
  testerSection.className = 'notation-tester-card';
  testerSection.innerHTML = `
    <div class="notation-tester-head">
      <div>
        <h3>🧪 Probá una secuencia en ${spec.name}</h3>
        <p>Escribí cualquier combinación de giros separados por espacio. Se valida en vivo para ${spec.name} y se anima en el visor 3D.</p>
      </div>
    </div>
    <div class="notation-tester-input-row">
      <input
        type="text"
        id="notation-seq-input"
        class="notation-seq-input"
        placeholder="Ej.: ${spec.sampleSequences[0]?.alg || "R U R' U'"}"
        value="${spec.sampleSequences[0]?.alg || "R U R' U'"}"
        autocomplete="off"
        spellcheck="false"
        aria-label="Escribir secuencia de movimientos"
      />
      <button type="button" class="btn-primary" id="notation-seq-play-btn">
        ▶ Animar secuencia
      </button>
    </div>
    <div class="notation-sample-row">
      <span class="notation-sample-label">Ejemplos rápidos:</span>
      ${spec.sampleSequences
        .map(
          (s) =>
            `<button type="button" class="notation-sample-chip" data-sample-alg="${s.alg}">${s.label}: <code>${s.alg}</code></button>`,
        )
        .join('')}
    </div>
    <div id="notation-seq-feedback" class="notation-seq-feedback" aria-live="polite"></div>
  `;
  mainCol.appendChild(testerSection);

  // 2c. Grilla de movimientos agrupados
  for (const group of spec.groups) {
    const groupSec = document.createElement('section');
    groupSec.className = 'notation-group-section';
    groupSec.innerHTML = `
      <header class="notation-group-head">
        <h3>${group.title}</h3>
        <p>${group.subtitle}</p>
      </header>
      <div class="notation-moves-grid">
        ${group.moves
          .map((m) => {
            const firstToken = `${m.base}${m.variants[0]}`;
            return `
              <article class="notation-move-card ${firstToken === activeAlg ? 'is-selected' : ''}" data-move-card="${m.base}">
                <div class="notation-move-card-top">
                  <div>
                    <h4 class="notation-move-label">${m.label}</h4>
                    ${m.follows ? `<span class="notation-follows-pill">${m.follows}</span>` : ''}
                  </div>
                </div>
                <p class="notation-move-meaning">${m.meaning}</p>
                <div class="notation-variant-btns" role="group" aria-label="Variantes de ${m.base}">
                  ${m.variants
                    .map((v) => {
                      const token = `${m.base}${v}`;
                      const tag =
                        v === ''
                          ? 'Horario'
                          : v === "'"
                            ? 'Antihorario'
                            : v === '2'
                              ? 'Doble (180°)'
                              : v === "2'"
                                ? 'Doble (-144°)'
                                : v === '++'
                                  ? '+144° (++)'
                                  : '-144° (--)';
                      return `<button type="button" class="notation-variant-btn ${token === activeAlg ? 'is-active' : ''}" data-move-token="${token}">
                        <code>${token}</code>
                        <span>${tag}</span>
                      </button>`;
                    })
                    .join('')}
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    `;
    mainCol.appendChild(groupSec);
  }

  layout.appendChild(mainCol);
  layout.appendChild(viewerAside);
  page.appendChild(layout);
  container.appendChild(page);

  // Montar el único <twisty-player> compartido
  const stageBox = page.querySelector('#notation-stage-box');
  ensureTwistyLoaded()
    .then(() => {
      if (!document.body.contains(stageBox)) return;
      const player = getOrCreateNotationPlayer(spec.puzzleId);
      if (player.parentElement !== stageBox) {
        stageBox.prepend(player);
      }
      playSequenceOnViewer(activeAlg, { fromSolved: true, autoPlay: true });
    })
    .catch(() => {});

  // Helper para seleccionar y animar un movimiento o secuencia en el visor
  const badgeEl = page.querySelector('#notation-active-badge');
  const titleEl = page.querySelector('#notation-active-title');
  const descEl = page.querySelector('#notation-active-desc');

  function selectAndPlayMove(token, customTitle = null, customDesc = null) {
    activeAlg = token;
    badgeEl.textContent = token;
    if (customTitle && customDesc) {
      titleEl.textContent = customTitle;
      descEl.textContent = customDesc;
    } else {
      const info = describeMove(activePuzzleKey, token);
      titleEl.textContent = info.title;
      descEl.textContent = info.description;
    }

    for (const btn of page.querySelectorAll('[data-move-token]')) {
      btn.classList.toggle('is-active', btn.dataset.moveToken === token);
    }
    for (const card of page.querySelectorAll('[data-move-card]')) {
      const hasActive = card.querySelector(`[data-move-token="${CSS.escape(token)}"]`);
      card.classList.toggle('is-selected', Boolean(hasActive));
    }

    playSequenceOnViewer(token, { fromSolved: true, autoPlay: true });
  }

  // Eventos de tarjetas y botones de variante
  page.addEventListener('click', (e) => {
    const varBtn = e.target.closest('[data-move-token]');
    if (varBtn) {
      selectAndPlayMove(varBtn.dataset.moveToken);
      return;
    }
    const card = e.target.closest('[data-move-card]');
    if (card && !e.target.closest('button')) {
      const firstBtn = card.querySelector('[data-move-token]');
      if (firstBtn) selectAndPlayMove(firstBtn.dataset.moveToken);
    }
  });

  // Controles del reproductor 3D
  page.querySelector('#notation-btn-play')?.addEventListener('click', () => {
    playSequenceOnViewer(activeAlg, { fromSolved: true, autoPlay: true });
  });
  page.querySelector('#notation-btn-pause')?.addEventListener('click', () => {
    stopLoopTimer();
    try {
      sharedPlayer?.pause();
    } catch {
      // Ignorar
    }
  });
  page.querySelector('#notation-btn-reset')?.addEventListener('click', () => {
    stopLoopTimer();
    if (sharedPlayer) {
      try {
        sharedPlayer.pause();
        sharedPlayer.timestamp = 0;
      } catch {
        // Ignorar
      }
    }
  });
  const loopBtn = page.querySelector('#notation-btn-loop');
  loopBtn?.addEventListener('click', () => {
    isLooping = !isLooping;
    loopBtn.classList.toggle('is-active', isLooping);
    loopBtn.setAttribute('aria-pressed', String(isLooping));
    if (isLooping) {
      playSequenceOnViewer(activeAlg, { fromSolved: true, autoPlay: true });
    } else {
      stopLoopTimer();
    }
  });

  for (const speedBtn of page.querySelectorAll('[data-tempo]')) {
    speedBtn.addEventListener('click', () => {
      currentTempo = Number(speedBtn.dataset.tempo) || 1.2;
      for (const b of page.querySelectorAll('[data-tempo]')) {
        b.classList.toggle('is-active', b === speedBtn);
      }
      if (sharedPlayer) sharedPlayer.tempoScale = currentTempo;
      if (isLooping) playSequenceOnViewer(activeAlg, { fromSolved: true, autoPlay: true });
    });
  }

  // Probador de secuencia en vivo
  const seqInput = page.querySelector('#notation-seq-input');
  const seqFeedback = page.querySelector('#notation-seq-feedback');
  const seqPlayBtn = page.querySelector('#notation-seq-play-btn');

  function updateSequenceValidation({ animate = false } = {}) {
    const raw = seqInput.value;
    const result = parseNotationSequence(activePuzzleKey, raw);
    if (result.empty) {
      seqFeedback.innerHTML = `<p class="notation-seq-hint">Escribí uno o más movimientos separados por espacio (por ejemplo <code>${spec.sampleSequences[0]?.alg || "R U R' U'"}</code>).</p>`;
      return;
    }
    if (!result.valid) {
      seqFeedback.innerHTML = `
        <div class="notation-seq-error" role="alert">
          <strong>Secuencia inválida para ${spec.name}:</strong>
          <ul>${result.errors.map((err) => `<li>${err}</li>`).join('')}</ul>
        </div>
      `;
      return;
    }

    seqFeedback.innerHTML = `
      <div class="notation-seq-valid">
        <div class="notation-seq-meta">
          <span class="notation-seq-ok">✔ Secuencia válida (${result.tokens.length} ${result.tokens.length === 1 ? 'movimiento' : 'movimientos'})</span>
          <span class="notation-seq-inv">Secuencia inversa: <code>${result.inverseAlg}</code></span>
        </div>
        <div class="notation-seq-steps">
          ${result.descriptions
            .map(
              (d, idx) =>
                `<button type="button" class="notation-step-pill" data-step-token="${d.token}" title="${d.description}">
                  <span class="step-num">${idx + 1}.</span> <code>${d.token}</code>
                </button>`,
            )
            .join('')}
        </div>
      </div>
    `;

    for (const pill of seqFeedback.querySelectorAll('[data-step-token]')) {
      pill.addEventListener('click', () => {
        selectAndPlayMove(pill.dataset.stepToken);
      });
    }

    if (animate) {
      selectAndPlayMove(
        result.normalizedAlg,
        `Secuencia (${result.tokens.length} movs)`,
        `Animando: ${result.tokens.join(' ')} en ${spec.name}.`,
      );
    }
  }

  seqInput?.addEventListener('input', () => updateSequenceValidation({ animate: false }));
  seqInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      updateSequenceValidation({ animate: true });
    }
  });
  seqPlayBtn?.addEventListener('click', () => updateSequenceValidation({ animate: true }));

  for (const sampleBtn of page.querySelectorAll('[data-sample-alg]')) {
    sampleBtn.addEventListener('click', () => {
      seqInput.value = sampleBtn.dataset.sampleAlg;
      updateSequenceValidation({ animate: true });
    });
  }

  updateSequenceValidation({ animate: false });
}
