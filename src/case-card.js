// Tarjeta de caso reutilizable: nombre, cubo animado, controles y algoritmos.
// El <twisty-player> se crea recién cuando la tarjeta aparece en pantalla.
import 'cubing/twisty';
import { DISPLAY_SETUP, STICKERING } from './data/stickering.js';

const ICONS = {
  restart: '<path d="M4 5v14M20 5 9 12l11 7z" />',
  back: '<path d="M19 5v14l-9-7zM6 5v14" />',
  play: '<path d="M7 5v14l12-7z" />',
  pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z" />',
  step: '<path d="M5 5v14l9-7zM18 5v14" />',
};

const icon = (name) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">${ICONS[name]}</svg>`;

const escape = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// Separa el giro previo "(U2)" del resto para mostrarlo más tenue. Si hay "pair"
// (F2L), marca la parte que arma el par y la que lo inserta.
function algHTML(alg, pair = '') {
  const match = alg.match(/^\((U2?'?)\)\s*(.*)$/);
  const pre = match
    ? `<span class="pre-auf" title="Giro previo para ver el caso como en la imagen">(${match[1]})</span> `
    : '';
  const body = match ? match[2] : alg;
  if (!pair || !body.startsWith(pair)) return pre + escape(body);
  const rest = body.slice(pair.length).trim();
  return `${pre}<span class="alg-pair" title="Arma el par">${escape(pair)}</span> <span class="alg-insert" title="Inserta el par">${escape(rest)}</span>`;
}

// Crea los players solo cuando la tarjeta está cerca de verse (ahorra memoria).
const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            entry.target.mountPlayer?.();
          }
        },
        { rootMargin: '300px 0px' },
      )
    : null;

// data: { name, nickname?, description?, idea?, alg, pair?, alts? } · stickering: clave de STICKERING
export function createCaseCard(data, { stickering, index = 0 }) {
  const card = document.createElement('article');
  card.className = 'case-card';
  card.style.setProperty('--i', String(index)); // escalona la animación de entrada
  card.innerHTML = `
    <header class="case-head">
      <h4 class="case-name">${escape(data.name)}${data.nickname ? ` <small>${escape(data.nickname)}</small>` : ''}</h4>
      ${data.description ? '<p class="case-desc"></p>' : ''}
      ${data.idea ? '<p class="case-idea"><strong>Idea:</strong> <span></span></p>' : ''}
    </header>
    <div class="case-cube" aria-label="Animación del caso"></div>
    <div class="case-controls" role="group" aria-label="Controles de la animación">
      <button type="button" data-cmd="restart" title="Reiniciar" aria-label="Reiniciar">${icon('restart')}</button>
      <button type="button" data-cmd="back" title="Paso atrás" aria-label="Paso atrás">${icon('back')}</button>
      <button type="button" data-cmd="play" class="play" title="Reproducir" aria-label="Reproducir">${icon('play')}</button>
      <button type="button" data-cmd="step" title="Paso adelante" aria-label="Paso adelante">${icon('step')}</button>
    </div>
    <button type="button" class="case-alg is-active" data-alg-index="0">${algHTML(data.alg, data.pair)}</button>
    ${
      data.pair
        ? '<p class="alg-legend"><span class="alg-pair">arma el par</span> <span class="alg-insert">lo inserta</span></p>'
        : ''
    }
    ${
      data.alts?.length
        ? `<details class="case-alts">
            <summary>${data.alts.length === 1 ? '1 alternativa' : `${data.alts.length} alternativas`}</summary>
            ${data.alts.map((alt, i) => `<button type="button" class="case-alg" data-alg-index="${i + 1}">${algHTML(alt)}</button>`).join('')}
          </details>`
        : ''
    }`;
  if (data.description) card.querySelector('.case-desc').textContent = data.description;
  if (data.idea) card.querySelector('.case-idea span').textContent = data.idea;

  const algs = [data.alg, ...(data.alts ?? [])];
  const cube = card.querySelector('.case-cube');
  const playBtn = card.querySelector('[data-cmd="play"]');
  let player = null;

  function setPlaying(playing) {
    playBtn.innerHTML = icon(playing ? 'pause' : 'play');
    playBtn.title = playing ? 'Pausar' : 'Reproducir';
    playBtn.setAttribute('aria-label', playBtn.title);
    card.classList.toggle('is-playing', playing);
  }

  card.mountPlayer = () => {
    if (player) return;
    player = document.createElement('twisty-player');
    player.puzzle = '3x3x3';
    player.controlPanel = 'none';
    player.background = 'none';
    player.experimentalSetupAlg = DISPLAY_SETUP;
    player.experimentalSetupAnchor = 'end'; // el cubo empieza en el caso y termina resuelto
    player.experimentalStickeringMaskOrbits = STICKERING[stickering];
    player.tempoScale = 1.4;
    player.alg = data.alg;
    cube.append(player);
    // Mantiene el botón de reproducir sincronizado con el player.
    player.experimentalModel.playingInfo.addFreshListener((info) => setPlaying(info.playing));
  };

  function command(cmd) {
    card.mountPlayer();
    const animation = player.controller.animationController;
    switch (cmd) {
      case 'restart':
        player.jumpToStart();
        break;
      case 'play':
        player.togglePlay();
        break;
      case 'step':
        player.pause();
        animation.play({ direction: 1, untilBoundary: 'move' });
        break;
      case 'back':
        player.pause();
        animation.play({ direction: -1, untilBoundary: 'move' });
        break;
    }
  }

  function selectAlg(i) {
    card.mountPlayer();
    for (const btn of card.querySelectorAll('.case-alg')) {
      btn.classList.toggle('is-active', Number(btn.dataset.algIndex) === i);
    }
    player.alg = algs[i];
    player.jumpToStart();
  }

  card.addEventListener('click', (e) => {
    const cmd = e.target.closest('[data-cmd]');
    if (cmd) return command(cmd.dataset.cmd);
    const algBtn = e.target.closest('.case-alg');
    if (algBtn) selectAlg(Number(algBtn.dataset.algIndex));
  });

  if (observer) observer.observe(card);
  else card.mountPlayer();
  return card;
}
