// Tarjeta de caso reutilizable + Visor 3D único compartido (<twisty-player>).
//
// Regla de rendimiento y arquitectura:
// - Cada tarjeta muestra una miniatura 2D en SVG (2D-LL para última capa, isométrica con stickering para el resto),
//   evitando crear decenas de contextos WebGL.
// - Existe UN SOLO <twisty-player> compartido por página: vive en el Hero de la página y pasa al modal
//   interactivo cuando el usuario toca "Ver animación" en cualquier tarjeta.
import { DISPLAY_SETUP, STICKERING } from './data/stickering.js';
import { casePreviewSvg } from './case-preview.js';
import { isCaseLearned, toggleCaseLearned } from './learned-store.js';

const ICONS = {
  restart: '<path d="M4 5v14M20 5 9 12l11 7z" />',
  back: '<path d="M19 5v14l-9-7zM6 5v14" />',
  play: '<path d="M7 5v14l12-7z" />',
  pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" />',
  step: '<path d="M5 5v14l9-7zM18 5v14" />',
  check: '<polyline points="20 6 9 17 4 12" />',
};

const icon = (name) =>
  `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const escape = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Separa el giro previo "(U2)" del resto para mostrarlo más tenue. Si hay "pair"
// (F2L), marca la parte que arma el par y la que lo inserta.
export function algHTML(alg, pair = '') {
  const match = String(alg ?? '').match(/^\((U2?'?)\)\s*(.*)$/);
  const pre = match
    ? `<span class="pre-auf" title="Giro previo para ver el caso como en la imagen">(${match[1]})</span> `
    : '';
  const body = match ? match[2] : String(alg ?? '');
  if (!pair || !body.startsWith(pair)) return pre + escape(body);
  const rest = body.slice(pair.length).trim();
  return `${pre}<span class="alg-pair" title="Arma el par">${escape(pair)}</span> <span class="alg-insert" title="Inserta el par">${escape(rest)}</span>`;
}

export function getCaseKey(data, stickering = 'default', puzzle = '3x3x3') {
  const idPart = data.id ?? data.name ?? data.alg;
  return `${puzzle}:${stickering}:${idPart}`.toLowerCase().replace(/\s+/g, '-');
}

// ---------- Único <twisty-player> compartido por página ----------

let twistyPromise = null;
let sharedPlayer = null;
let heroHost = null;
let heroConfig = null;
let modalEl = null;
let activeModalState = null;

function ensureTwistyPlayer() {
  twistyPromise ??= import('cubing/twisty').then(() => {
    const p = document.createElement('twisty-player');
    p.controlPanel = 'none';
    p.background = 'none';
    p.hintFacelets = 'none';
    p.experimentalDragInput = 'auto';
    p.tempoScale = 1.3;
    sharedPlayer = p;
    return p;
  });
  return twistyPromise;
}

function applyPlayerConfig(player, { puzzle = '3x3x3', stickering = '', alg = '', anchor = 'end', setupAlg = DISPLAY_SETUP, visualization = '3D' }) {
  player.puzzle = puzzle;
  player.visualization = visualization;
  // En Pyraminx y Megaminx no hace falta z2
  const needsZ2 = puzzle.includes('x');
  player.experimentalSetupAlg = needsZ2 ? setupAlg : '';
  player.experimentalSetupAnchor = anchor;
  if (stickering && STICKERING[stickering]) {
    player.experimentalStickeringMaskOrbits = STICKERING[stickering];
  } else {
    player.experimentalStickeringMaskOrbits = undefined;
    player.experimentalStickering = 'full';
  }
  player.alg = alg;
  player.jumpToStart?.();
}

// Monta el único <twisty-player> en el Hero de la página actual.
export async function mountHeroPlayer(container, config) {
  heroHost = container;
  heroConfig = config;
  const player = await ensureTwistyPlayer();
  if (heroHost !== container) return;
  if (modalEl?.open) return; // si el modal está abierto, vuelve al cerrarse
  applyPlayerConfig(player, { ...config, visualization: '3D' });
  container.innerHTML = '';
  container.append(player);
}

function ensureCaseModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement('dialog');
  modalEl.className = 'settings case-modal';
  modalEl.setAttribute('aria-labelledby', 'case-modal-title');
  modalEl.innerHTML = `
    <div class="case-modal-inner">
      <div class="settings-head">
        <div>
          <span class="case-modal-badge" id="case-modal-badge">Animación 3D</span>
          <h2 id="case-modal-title">Caso</h2>
        </div>
        <button class="icon-btn" type="button" id="case-modal-close" aria-label="Cerrar">✕</button>
      </div>
      <p class="case-modal-desc" id="case-modal-desc"></p>
      <div class="case-modal-stage-wrap">
        <div class="case-modal-stage" id="case-modal-stage"></div>
        <div class="case-modal-toolbar">
          <button type="button" class="chip-btn" id="case-modal-vis" title="Alternar vista 3D / 2D">Vista: 3D</button>
          <button type="button" class="chip-btn" id="case-modal-speed" title="Cambiar velocidad">Velocidad: 1.3×</button>
        </div>
      </div>
      <div class="case-controls case-modal-controls" role="group" aria-label="Controles de la animación">
        <button type="button" data-modal-cmd="restart" title="Ir al inicio" aria-label="Ir al inicio">${icon('restart')}</button>
        <button type="button" data-modal-cmd="back" title="Paso anterior" aria-label="Paso anterior">${icon('back')}</button>
        <button type="button" data-modal-cmd="play" class="play" id="case-modal-play" title="Reproducir" aria-label="Reproducir">${icon('play')}</button>
        <button type="button" data-modal-cmd="step" title="Paso siguiente" aria-label="Paso siguiente">${icon('step')}</button>
      </div>
      <div class="case-modal-algs" id="case-modal-algs"></div>
    </div>
  `;
  document.body.append(modalEl);

  const closeBtn = modalEl.querySelector('#case-modal-close');
  const playBtn = modalEl.querySelector('#case-modal-play');
  const visBtn = modalEl.querySelector('#case-modal-vis');
  const speedBtn = modalEl.querySelector('#case-modal-speed');
  const algsBox = modalEl.querySelector('#case-modal-algs');

  closeBtn.addEventListener('click', () => modalEl.close());
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) modalEl.close();
  });

  modalEl.addEventListener('close', () => {
    sharedPlayer?.pause?.();
    if (heroHost && heroConfig && sharedPlayer) {
      applyPlayerConfig(sharedPlayer, { ...heroConfig, visualization: '3D' });
      heroHost.innerHTML = '';
      heroHost.append(sharedPlayer);
    }
  });

  modalEl.addEventListener('click', (e) => {
    const cmdBtn = e.target.closest('[data-modal-cmd]');
    if (!cmdBtn || !sharedPlayer) return;
    const cmd = cmdBtn.dataset.modalCmd;
    const animation = sharedPlayer.controller?.animationController;
    switch (cmd) {
      case 'restart':
        sharedPlayer.jumpToStart();
        break;
      case 'play':
        sharedPlayer.togglePlay();
        break;
      case 'step':
        sharedPlayer.pause();
        animation?.play({ direction: 1, untilBoundary: 'move' });
        break;
      case 'back':
        sharedPlayer.pause();
        animation?.play({ direction: -1, untilBoundary: 'move' });
        break;
    }
  });

  visBtn.addEventListener('click', () => {
    if (!sharedPlayer || !activeModalState) return;
    activeModalState.vis = activeModalState.vis === '3D' ? '2D' : '3D';
    sharedPlayer.visualization = activeModalState.vis;
    visBtn.textContent = `Vista: ${activeModalState.vis}`;
  });

  const speeds = [0.7, 1.0, 1.3, 1.8];
  let speedIdx = 2;
  speedBtn.addEventListener('click', () => {
    if (!sharedPlayer) return;
    speedIdx = (speedIdx + 1) % speeds.length;
    sharedPlayer.tempoScale = speeds[speedIdx];
    speedBtn.textContent = `Velocidad: ${speeds[speedIdx]}×`;
  });

  algsBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.case-alg');
    if (!btn || !sharedPlayer || !activeModalState) return;
    const idx = Number(btn.dataset.algIndex);
    for (const b of algsBox.querySelectorAll('.case-alg')) {
      b.classList.toggle('is-active', Number(b.dataset.algIndex) === idx);
    }
    sharedPlayer.alg = activeModalState.algs[idx];
    sharedPlayer.jumpToStart();
    sharedPlayer.play();
  });

  ensureTwistyPlayer().then((player) => {
    player.experimentalModel?.playingInfo?.addFreshListener((info) => {
      playBtn.innerHTML = icon(info.playing ? 'pause' : 'play');
      playBtn.title = info.playing ? 'Pausar' : 'Reproducir';
      playBtn.setAttribute('aria-label', playBtn.title);
    });
  });

  return modalEl;
}

export async function openSharedCaseModal(data, { stickering = '', puzzle = '3x3x3', initialAlgIndex = 0 } = {}) {
  const modal = ensureCaseModal();
  const titleEl = modal.querySelector('#case-modal-title');
  const descEl = modal.querySelector('#case-modal-desc');
  const stageEl = modal.querySelector('#case-modal-stage');
  const algsEl = modal.querySelector('#case-modal-algs');
  const visBtn = modal.querySelector('#case-modal-vis');

  const algs = [data.alg, ...(data.alts ?? [])];
  activeModalState = { data, stickering, puzzle, algs, vis: '3D' };
  visBtn.textContent = 'Vista: 3D';

  titleEl.innerHTML = `${escape(data.name)}${data.nickname ? ` <small>${escape(data.nickname)}</small>` : ''}`;
  const descParts = [data.description, data.idea ? `Idea: ${data.idea}` : ''].filter(Boolean);
  descEl.textContent = descParts.join(' · ');
  descEl.hidden = descParts.length === 0;

  algsEl.innerHTML = algs
    .map(
      (alg, i) => `
      <button type="button" class="case-alg ${i === initialAlgIndex ? 'is-active' : ''}" data-alg-index="${i}">
        <span class="alg-tag">${i === 0 ? 'Principal' : `Alt ${i}`}</span>
        <code>${algHTML(alg, i === 0 ? data.pair : '')}</code>
      </button>`,
    )
    .join('');

  if (!modal.open) modal.showModal();

  const player = await ensureTwistyPlayer();
  applyPlayerConfig(player, {
    puzzle,
    stickering,
    alg: algs[initialAlgIndex] ?? data.alg,
    visualization: '3D',
  });
  stageEl.innerHTML = '';
  stageEl.append(player);
  setTimeout(() => player.play?.(), 120);
}

// ---------- Tarjeta de caso (2D SVG + Algoritmos + Ver animación + Aprendido) ----------

export function createCaseCard(data, { stickering = '', index = 0, puzzle = '3x3x3', groupId = '' } = {}) {
  const caseKey = getCaseKey(data, stickering, puzzle);
  const learned = isCaseLearned(caseKey);

  const card = document.createElement('article');
  card.className = `case-card${learned ? ' is-learned' : ''}`;
  card.dataset.caseKey = caseKey;
  card.dataset.learned = learned ? 'true' : 'false';
  if (groupId) card.dataset.group = groupId;
  card.dataset.search = `${data.name ?? ''} ${data.nickname ?? ''} ${data.description ?? ''} ${data.alg ?? ''}`.toLowerCase();
  card.style.setProperty('--i', String(index));

  const previewHtml = casePreviewSvg(data.alg, { stickering, puzzle });

  card.innerHTML = `
    <header class="case-head">
      <div class="case-title-row">
        <h4 class="case-name">${escape(data.name)}${data.nickname ? ` <small>${escape(data.nickname)}</small>` : ''}</h4>
        <button
          type="button"
          class="learned-btn${learned ? ' is-learned' : ''}"
          data-action="toggle-learned"
          aria-pressed="${learned}"
          title="${learned ? 'Caso aprendido (tocar para desmarcar)' : 'Marcar como aprendido'}"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS.check}</svg>
          <span>${learned ? 'Aprendido' : 'Aprender'}</span>
        </button>
      </div>
      ${data.description ? '<p class="case-desc"></p>' : ''}
      ${data.idea ? '<p class="case-idea"><strong>Idea:</strong> <span></span></p>' : ''}
    </header>

    <div class="case-thumb-row">
      <div class="case-thumb" role="img" aria-label="Vista previa 2D de ${escape(data.name)}">
        ${previewHtml}
      </div>
      <div class="case-main-actions">
        <button type="button" class="case-alg is-active" data-alg-index="0" title="Ver animación con este algoritmo">
          ${algHTML(data.alg, data.pair)}
        </button>
        ${
          data.pair
            ? '<p class="alg-legend"><span class="alg-pair">arma el par</span> <span class="alg-insert">lo inserta</span></p>'
            : ''
        }
        <button type="button" class="watch-anim-btn" data-action="watch">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">${ICONS.play}</svg>
          <span>Ver animación 3D</span>
        </button>
      </div>
    </div>

    ${
      data.alts?.length
        ? `<details class="case-alts">
            <summary>${data.alts.length === 1 ? '1 algoritmo alternativo' : `${data.alts.length} algoritmos alternativos`}</summary>
            ${data.alts.map((alt, i) => `<button type="button" class="case-alg" data-alg-index="${i + 1}">${algHTML(alt)}</button>`).join('')}
          </details>`
        : ''
    }
  `;

  if (data.description) card.querySelector('.case-desc').textContent = data.description;
  if (data.idea) card.querySelector('.case-idea span').textContent = data.idea;

  const learnedBtn = card.querySelector('[data-action="toggle-learned"]');

  function syncLearnedUI(state) {
    card.classList.toggle('is-learned', state);
    card.dataset.learned = state ? 'true' : 'false';
    learnedBtn.classList.toggle('is-learned', state);
    learnedBtn.setAttribute('aria-pressed', String(state));
    learnedBtn.title = state ? 'Caso aprendido (tocar para desmarcar)' : 'Marcar como aprendido';
    learnedBtn.querySelector('span').textContent = state ? 'Aprendido' : 'Aprender';
  }

  card.addEventListener('click', (e) => {
    const learnTrigger = e.target.closest('[data-action="toggle-learned"]');
    if (learnTrigger) {
      const next = toggleCaseLearned(caseKey);
      syncLearnedUI(next);
      return;
    }
    const watchTrigger = e.target.closest('[data-action="watch"]');
    if (watchTrigger) {
      openSharedCaseModal(data, { stickering, puzzle, initialAlgIndex: 0 });
      return;
    }
    const thumbTrigger = e.target.closest('.case-thumb');
    if (thumbTrigger) {
      openSharedCaseModal(data, { stickering, puzzle, initialAlgIndex: 0 });
      return;
    }
    const algBtn = e.target.closest('.case-alg');
    if (algBtn) {
      const idx = Number(algBtn.dataset.algIndex) || 0;
      openSharedCaseModal(data, { stickering, puzzle, initialAlgIndex: idx });
    }
  });

  return card;
}
