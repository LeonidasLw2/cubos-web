// Interfaz: conecta el DOM con el timer, los scrambles, las estadísticas y el almacenamiento.
import 'cubing/twisty';
import { createTimer } from './timer.js';
import { EVENTS, DEFAULT_EVENT, getEvent, nextScramble } from './scramble.js';
import { summarize, bestTime, effectiveTime, formatTime, formatSolve } from './stats.js';
import { loadSolves, saveSolves, loadSelectedEvent, saveSelectedEvent } from './storage.js';

const $ = (id) => document.getElementById(id);

const els = {
  events: $('events'),
  card: $('scramble-card'),
  scramble: $('scramble'),
  newScramble: $('new-scramble'),
  view: $('scramble-view'),
  timerZone: $('timer-zone'),
  timer: $('timer'),
  hint: $('hint'),
  pbBadge: $('pb-badge'),
  stats: {
    best: $('stat-best'),
    worst: $('stat-worst'),
    mean: $('stat-mean'),
    ao5: $('stat-ao5'),
    ao12: $('stat-ao12'),
    bestAo5: $('stat-best-ao5'),
    bestAo12: $('stat-best-ao12'),
  },
  count: $('stat-count'),
  dnf: $('stat-dnf'),
  solves: $('solves'),
  empty: $('empty'),
  clearSession: $('clear-session'),
};

const state = {
  event: getEvent(loadSelectedEvent(DEFAULT_EVENT)).id,
  solves: [],
  scramble: null, // scramble actual (null mientras se genera)
  requestId: 0, // para descartar scrambles que llegan tarde
  newSolveId: null, // para animar la entrada del último tiempo
};

const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

// ---------- Vista del scramble ----------

const player = document.createElement('twisty-player');
player.controlPanel = 'none';
player.background = 'none';
player.hintFacelets = 'none';
player.experimentalDragInput = 'none';
els.view.append(player);

function updatePlayer() {
  const ev = getEvent(state.event);
  player.puzzle = ev.puzzle;
  player.visualization = ev.view;
  player.experimentalSetupAlg = state.scramble ?? '';
  player.alg = '';
  els.view.dataset.view = ev.view;
}

// Reinicia una animación CSS (quitar la clase, forzar reflow y volver a ponerla).
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

// ---------- Scrambles ----------

async function loadScramble() {
  const id = ++state.requestId;
  state.scramble = null;
  els.scramble.textContent = 'Generando scramble...';
  els.scramble.classList.add('loading');
  els.card.classList.remove('long');
  try {
    const scramble = await nextScramble(state.event);
    if (id !== state.requestId) return; // llegó tarde: ya se pidió otro
    state.scramble = scramble;
    els.scramble.textContent = scramble;
    // Scrambles largos (5x5, 7x7, megaminx): texto arriba y cubo abajo.
    els.card.classList.toggle('long', scramble.length > 120);
  } catch (err) {
    if (id !== state.requestId) return;
    console.error(err);
    els.scramble.textContent = 'No se pudo generar el scramble. Tocá ↻ para reintentar.';
  }
  els.scramble.classList.remove('loading');
  updatePlayer();
  replay(els.scramble, 'fade-in');
  replay(els.view, 'fade-in');
}

// ---------- Categorías ----------

function renderEvents() {
  els.events.replaceChildren(
    ...EVENTS.map((ev) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'event-btn';
      btn.textContent = ev.name;
      btn.dataset.event = ev.id;
      btn.setAttribute('aria-pressed', String(ev.id === state.event));
      return btn;
    }),
  );
}

function selectEvent(eventId) {
  if (eventId === state.event) return;
  state.event = eventId;
  saveSelectedEvent(eventId);
  state.solves = loadSolves(eventId);
  state.newSolveId = null;
  for (const btn of els.events.children) {
    btn.setAttribute('aria-pressed', String(btn.dataset.event === eventId));
  }
  els.timer.textContent = '0.00';
  renderSession();
  loadScramble();
}

// ---------- Estadísticas e historial ----------

function renderStats() {
  const s = summarize(state.solves);
  for (const [key, el] of Object.entries(els.stats)) el.textContent = formatTime(s[key]);
  els.count.textContent = String(s.count);
  els.dnf.textContent = String(s.dnfCount);
}

// Fecha y hora corta del solve: "23/10/26, 15:40".
const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });
const fullDateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'full', timeStyle: 'medium' });

function renderSolves() {
  const best = bestTime(state.solves);
  const items = [];
  // El más reciente arriba.
  for (let i = state.solves.length - 1; i >= 0; i--) {
    const solve = state.solves[i];
    const li = document.createElement('li');
    li.className = 'solve';
    li.dataset.id = solve.id;
    if (solve.id === state.newSolveId) li.classList.add('enter');
    if (best !== null && effectiveTime(solve) === best) li.classList.add('is-best');
    if (solve.penalty === 'DNF') li.classList.add('is-dnf');

    li.innerHTML = `
      <span class="solve-index">${i + 1}</span>
      <button class="solve-time" type="button" data-action="toggle" title="Ver scramble"></button>
      <div class="solve-actions">
        <button type="button" data-action="plus2" aria-pressed="${solve.penalty === '+2'}">+2</button>
        <button type="button" data-action="dnf" aria-pressed="${solve.penalty === 'DNF'}">DNF</button>
        <button type="button" data-action="delete" class="danger" aria-label="Borrar tiempo">✕</button>
      </div>
      <div class="solve-meta">
        <time class="solve-date"></time>
        <p class="solve-scramble"></p>
      </div>`;
    li.querySelector('.solve-time').textContent = formatSolve(solve);
    li.querySelector('.solve-scramble').textContent = solve.scramble || '(sin scramble)';
    const time = li.querySelector('.solve-date');
    if (solve.date !== null) {
      const date = new Date(solve.date);
      time.dateTime = date.toISOString();
      time.textContent = dateFormat.format(date);
      time.title = fullDateFormat.format(date);
    } else {
      time.textContent = '—';
      time.title = 'Sin fecha';
    }
    items.push(li);
  }
  els.solves.replaceChildren(...items);
  els.empty.hidden = state.solves.length > 0;
  els.clearSession.disabled = state.solves.length === 0;
}

function renderSession() {
  renderStats();
  renderSolves();
}

function commit() {
  saveSolves(state.event, state.solves);
  renderSession();
}

function addSolve(ms) {
  const previousBest = bestTime(state.solves);
  const solve = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: Math.floor(ms),
    penalty: null,
    scramble: state.scramble,
    date: Date.now(),
  };
  state.solves.push(solve);
  state.newSolveId = solve.id;
  commit();
  if (previousBest !== null && solve.time < previousBest) celebratePB();
  loadScramble();
}

function celebratePB() {
  replay(els.timer, 'pb');
  replay(els.pbBadge, 'show');
}

function onSolveAction(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const li = btn.closest('.solve');
  const solve = state.solves.find((s) => s.id === li.dataset.id);
  if (!solve) return;
  state.newSolveId = null;

  switch (btn.dataset.action) {
    case 'toggle':
      li.classList.toggle('expanded');
      return;
    case 'plus2':
      solve.penalty = solve.penalty === '+2' ? null : '+2';
      break;
    case 'dnf':
      solve.penalty = solve.penalty === 'DNF' ? null : 'DNF';
      break;
    case 'delete':
      if (!confirm(`¿Borrar el tiempo ${formatSolve(solve)}?`)) return;
      state.solves = state.solves.filter((s) => s !== solve);
      break;
  }
  commit();
}

function clearSession() {
  const name = getEvent(state.event).name;
  if (!confirm(`¿Borrar los ${state.solves.length} tiempos de ${name}? No se puede deshacer.`)) return;
  state.solves = [];
  state.newSolveId = null;
  commit();
}

// ---------- Timer ----------

const timer = createTimer({
  holdMs: 500,
  onState(s) {
    els.timer.dataset.state = s;
    document.body.classList.toggle('running', s === 'running');
    if (s === 'holding') els.timer.textContent = '0.00';
  },
  onTick(ms) {
    els.timer.textContent = formatTime(ms);
  },
  onStop(ms) {
    els.timer.textContent = formatTime(ms);
    addSolve(ms);
  },
});

function onKeyDown(e) {
  // Mientras corre, cualquier tecla lo para.
  if (timer.state === 'running') {
    e.preventDefault();
    timer.stop();
    return;
  }
  if (e.code === 'Escape') return timer.cancel();
  if (e.code !== 'Space') return;
  e.preventDefault(); // evita scroll y "clic" en el botón enfocado
  if (e.repeat) return;
  document.activeElement?.blur();
  timer.press();
}

function onKeyUp(e) {
  if (e.code !== 'Space') return;
  e.preventDefault();
  timer.release();
}

function onTouchStart(e) {
  if (timer.state === 'running') {
    e.preventDefault();
    timer.stop();
    return;
  }
  // Solo arranca tocando la zona del timer (no botones ni la lista).
  if (!els.timerZone.contains(e.target) || e.target.closest('button')) return;
  e.preventDefault();
  timer.press();
}

function onTouchEnd(e) {
  if (timer.state === 'holding' || timer.state === 'ready') {
    e.preventDefault();
    timer.release();
  }
}

// ---------- Inicio ----------

export function initUI() {
  els.hint.textContent = isTouch
    ? 'Mantené el dedo sobre el tiempo y soltá para empezar'
    : 'Mantené apretada la barra espaciadora y soltá para empezar';

  renderEvents();
  els.events.addEventListener('click', (e) => {
    const btn = e.target.closest('.event-btn');
    if (btn) selectEvent(btn.dataset.event);
  });
  els.newScramble.addEventListener('click', loadScramble);
  els.solves.addEventListener('click', onSolveAction);
  els.clearSession.addEventListener('click', clearSession);

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: false });
  document.addEventListener('touchcancel', () => timer.cancel());
  window.addEventListener('blur', () => timer.cancel());

  state.solves = loadSolves(state.event);
  renderSession();
  updatePlayer();
  loadScramble();
}
