// Entrenador de casos: muestra un caso al azar del grupo elegido (PLL, OLL…), con
// su mezcla, y toma el tiempo de la resolución. Guarda los tiempos de cada caso.
import { TRAINER_SETS, findSet } from './data/trainer-sets.js';
import { caseScramble, realCaseScramble, AUFS } from './case-scramble.js';
import { DISPLAY_SETUP, STICKERING } from './data/stickering.js';
import { createTimer } from './timer.js';
import { createTimerText } from './timer-text.js';
import { loadSettings } from './settings.js';
import { cubeSvg } from './cube-art.js';
import { formatTime } from './stats.js';
import { loadTrainerData, saveTrainerData } from './storage.js';
import { normalizeTrainer, addTime, caseStats, pickCase } from './trainer-store.js';
import { getPlayer, destroyScopePlayer } from './twisty/playerManager.js';

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const fmt = (ms) => (ms === null ? '-' : formatTime(ms));
// Solución sin el giro previo "(U2)": la mezcla ya termina con su propio giro de U.
const solutionOf = (c) => c.alg.replace(/^\([^)]*\)\s*/, '');

let data;
let set;
let current = null; // { case, scramble }
let active = false; // la vista del entrenador está a la vista
let els = null;
let updateTimerText = null;
let player = null;
let discard = false;
let upcoming = null; // { setId, caseId, promise }: la mezcla siguiente, preparada de antemano
let shown = 0; // número del caso a la vista (para ignorar mezclas que llegan tarde)

// Solver de cubing.js (corre en un worker). Se carga la primera vez que hace falta.
let tools = null;
const loadTools = () =>
  (tools ??= Promise.all([import('cubing/search'), import('cubing/puzzles')]).then(async ([search, puzzles]) => ({
    '3x3x3': { kpuzzle: await puzzles.cube3x3x3.kpuzzle(), solve: search.experimentalSolve3x3x3IgnoringCenters },
    '2x2x2': { kpuzzle: await puzzles.cube2x2x2.kpuzzle(), solve: search.experimentalSolve2x2x2, faces: ['R', 'U', 'F'] },
  })));
const algsOf = (id) => TRAINER_SETS.find((s) => s.id === id).cases.map((c) => c.alg);
const POOLS = { pll: algsOf('pll'), oll: algsOf('oll'), pbl: algsOf('pbl') };

// Mezcla real (con el solver); si algo falla, el algoritmo al revés con un giro de U.
async function makeScramble(s, c) {
  try {
    return (await realCaseScramble(s.id, c.alg, { ...(await loadTools())[s.puzzle], pools: POOLS })).scramble;
  } catch {
    return caseScramble(c.alg, AUFS[Math.floor(Math.random() * 4)]);
  }
}
const prepare = (s, caseId) => ({ setId: s.id, caseId, promise: makeScramble(s, s.cases.find((x) => x.id === caseId)) });

let hasPendingSave = false;
const save = () => {
  const saved = saveTrainerData(data);
  hasPendingSave = !saved;
  document.getElementById('trainer-save-status').textContent = saved
    ? ''
    : 'Cambios sin guardar. Exportá tus tiempos desde Ajustes antes de cerrar.';
  return saved;
};
export const getPendingTrainerData = () => hasPendingSave ? data : null;
const selectedIds = () => {
  const all = set.cases.map((c) => c.id);
  const chosen = data.selected[set.id];
  return chosen ? all.filter((id) => chosen.includes(id)) : all;
};

const timer = createTimer({
  getInspection: () => false,
  getHoldMs: () => 300,
  onState(state) {
    els.pad.dataset.state = state;
    const concealTime = state === 'running' && loadSettings().timerDisplay === 'solving';
    els.pad.classList.toggle('is-solving', concealTime);
    els.status.textContent = concealTime ? 'Resolviendo' : '';
    if (state === 'running') document.body.dataset.phase = 'running';
    else if (document.body.dataset.phase === 'running') delete document.body.dataset.phase;
    if (state === 'holding' || state === 'ready') updateTimerText(formatTime(0));
  },
  onTick(ms) {
    if (!els.pad.classList.contains('is-solving')) updateTimerText(formatTime(ms));
  },
  onSolve({ time }) {
    if (discard) return; // se cambió de sección con el tiempo corriendo: no se guarda
    updateTimerText(formatTime(time));
    data = addTime(data, set.id, current.case.id, Math.round(time));
    save();
    showLast(current, time);
    renderCases();
    nextCase();
  },
});

export const isTrainerIdle = () => timer.state === 'idle' || timer.state === 'stopped';

// ---------- Dibujo ----------

function renderSets() {
  els.sets.innerHTML = TRAINER_SETS.map(
    (s) => `<button type="button" class="event-btn" data-set="${s.id}" aria-pressed="${s.id === set.id}">${escape(s.title)}</button>`,
  ).join('');
}

function showCase() {
  const { case: c, scramble } = current;
  els.scramble.textContent = scramble;
  els.solution.hidden = true;
  els.solution.innerHTML = `<strong>${escape(c.name)}</strong>${c.nickname ? ` <small>${escape(c.nickname)}</small>` : ''} · <code>${escape(solutionOf(c))}</code>`;
  els.reveal.hidden = false;
  if (!active || !els.cube) return;
  player = getPlayer(els.cube, {
    scope: 'trainer',
    puzzle: set.puzzle,
    visualization: '3D',
    experimentalStickeringMaskOrbits: STICKERING[set.stickering],
    experimentalSetupAlg: `${DISPLAY_SETUP} ${scramble}`,
    alg: '',
  });
}

async function nextCase(caseId) {
  const turn = ++shown;
  const ids = selectedIds();
  // Si ya había una mezcla preparada para un caso que sigue elegido, se usa esa.
  const ready = upcoming && upcoming.setId === set.id && ids.includes(upcoming.caseId) && upcoming.caseId !== current?.case.id;
  const next = caseId ? prepare(set, caseId) : ready ? upcoming : (() => { const id = pickCase(ids, current?.case.id); return id && prepare(set, id); })();
  upcoming = null;
  if (!next) {
    current = null;
    els.empty.hidden = false;
    els.practice.hidden = true;
    return;
  }
  els.empty.hidden = true;
  els.practice.hidden = false;
  current = { case: set.cases.find((x) => x.id === next.caseId), scramble: null };
  els.scramble.textContent = 'Generando mezcla…';
  const scramble = await next.promise;
  if (turn !== shown) return; // mientras tanto se pidió otro caso
  current.scramble = scramble;
  showCase();
  // Preparar la siguiente mientras se resuelve esta.
  const after = pickCase(ids, current.case.id);
  if (after) upcoming = prepare(set, after);
}

function showLast({ case: c }, time) {
  els.last.hidden = false;
  els.last.innerHTML = `Último: <strong>${escape(c.name)}</strong> en <strong>${formatTime(time)}</strong> · <code>${escape(solutionOf(c))}</code>`;
}

function renderCases() {
  const focusedCase = els.list.contains(document.activeElement) ? document.activeElement.dataset.case : null;
  const chosen = new Set(selectedIds());
  els.count.textContent = `${chosen.size} de ${set.cases.length} elegidos`;
  els.list.innerHTML = set.cases
    .map((c) => {
      const st = caseStats(data.times[set.id]?.[c.id]);
      return `<label class="trainer-row">
        <input type="checkbox" data-case="${escape(c.id)}" ${chosen.has(c.id) ? 'checked' : ''} />
        <span class="trainer-row-name">${escape(c.name)}${c.nickname ? ` <small>${escape(c.nickname)}</small>` : ''}</span>
        <span class="trainer-row-n" title="Veces">${st.count}</span>
        <span title="Mejor">${fmt(st.best)}</span>
        <span title="Media de los últimos 5">${fmt(st.recent)}</span>
      </label>`;
    })
    .join('');
  if (focusedCase) [...els.list.querySelectorAll('input')].find((input) => input.dataset.case === focusedCase)?.focus({ preventScroll: true });
}

function selectSet(id, caseId) {
  if (!isTrainerIdle()) return;
  set = findSet(id);
  data = { ...data, set: set.id };
  save();
  current = null;
  els.last.hidden = true;
  renderSets();
  renderCases();
  nextCase(caseId);
}

export function openTrainerCase(group, caseId) {
  if (TRAINER_SETS.some((entry) => entry.id === group && entry.cases.some((c) => c.id === caseId))) {
    selectSet(group, caseId);
  }
}

function setSelection(ids) {
  data = { ...data, selected: { ...data.selected, [set.id]: ids } };
  save();
  renderCases();
  // Si el caso actual quedó afuera (o no había ninguno), elegir otro.
  if (!current || !ids.includes(current.case.id)) nextCase();
}

// ---------- Teclado y toque ----------

let trainerKey = null;

function onKeyDown(e) {
  if (!active || e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (e.target.closest?.('button, a, input, select, textarea, summary, [tabindex], [contenteditable]') && !els.pad.contains(e.target)) return;
  if (e.key === 'Escape' && timer.state !== 'running') {
    trainerKey = null;
    timer.blur();
    timer.cancel();
  } else if (!trainerKey && (timer.state === 'running' || (e.code === 'Space' && current?.scramble))) {
    e.preventDefault();
    trainerKey = e.code;
    timer.press();
  }
}

function onKeyUp(e) {
  if (!active || e.code !== trainerKey) return;
  trainerKey = null;
  timer.release();
}

// ---------- Inicio ----------

export function renderTrainer(container) {
  if (!hasPendingSave) data = normalizeTrainer(loadTrainerData());
  set = findSet(data.set);
  container.innerHTML = `<div class="methods-page trainer-page">
    <header class="page-head">
      <h2>Entrenador de casos</h2>
      <p>Elegí un grupo. Hacé la mezcla con amarillo arriba y verde al frente.</p>
    </header>
    <nav class="events trainer-sets" aria-label="Grupo de casos"></nav>
    <section class="trainer-practice">
      <div class="trainer-cube" role="region" aria-label="Caso a resolver"></div>
      <div class="trainer-side">
        <p class="trainer-scramble-label">Mezcla</p>
        <p class="scramble trainer-scramble"></p>
        <div class="trainer-pad" role="button" tabindex="0" aria-label="Tocá y mantené para empezar; tocá para parar">
          <div class="timer trainer-time" role="timer">0.00</div>
          <div class="solving-indicator" aria-hidden="true">${cubeSvg({ className: 'solving-cube', animateTop: true })}<span>Resolviendo</span></div>
          <span class="visually-hidden trainer-attempt-status" role="status"></span>
          <p class="hint">Mantené la barra espaciadora (o el dedo acá) y soltá para empezar. Cualquier tecla o toque lo para.</p>
        </div>
        <div class="trainer-actions">
          <button type="button" class="data-btn" data-action="reveal">Ver solución</button>
          <button type="button" class="data-btn" data-action="next">Otro caso</button>
        </div>
        <p class="trainer-solution" hidden></p>
        <p class="trainer-last" hidden></p>
      </div>
    </section>
    <p id="trainer-save-status" class="save-status" role="status"></p>
    <p class="trainer-empty" hidden>No hay casos elegidos. Marcá al menos uno en la lista de abajo.</p>
    <section class="method-step trainer-cases">
      <h3>Casos <small class="trainer-count"></small></h3>
      <div class="trainer-bulk">
        <button type="button" class="text-btn" data-action="all">Todos</button>
        <button type="button" class="text-btn" data-action="none">Ninguno</button>
      </div>
      <div class="trainer-row trainer-row-head" aria-hidden="true"><span></span><span>Caso</span><span>Veces</span><span>Mejor</span><span>Últ. 5</span></div>
      <div class="trainer-list"></div>
    </section>
  </div>`;
  const q = (sel) => container.querySelector(sel);
  els = {
    sets: q('.trainer-sets'),
    practice: q('.trainer-practice'),
    empty: q('.trainer-empty'),
    cube: q('.trainer-cube'),
    scramble: q('.trainer-scramble'),
    pad: q('.trainer-pad'),
    time: q('.trainer-time'),
    status: q('.trainer-attempt-status'),
    reveal: q('[data-action="reveal"]'),
    solution: q('.trainer-solution'),
    last: q('.trainer-last'),
    count: q('.trainer-count'),
    list: q('.trainer-list'),
  };
  updateTimerText = createTimerText(els.time);
  player = null;

  els.sets.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set]');
    if (btn) selectSet(btn.dataset.set);
  });
  container.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action || !isTrainerIdle()) return;
    if (action === 'reveal') {
      els.solution.hidden = false;
      els.reveal.hidden = true;
    } else if (action === 'next') nextCase();
    else if (action === 'all') setSelection(set.cases.map((c) => c.id));
    else if (action === 'none') setSelection([]);
  });
  els.list.addEventListener('change', (e) => {
    const box = e.target.closest('[data-case]');
    if (!box) return;
    if (!isTrainerIdle()) {
      box.checked = selectedIds().includes(box.dataset.case);
      return;
    }
    const ids = new Set(selectedIds());
    if (box.checked) ids.add(box.dataset.case);
    else ids.delete(box.dataset.case);
    setSelection(set.cases.map((c) => c.id).filter((id) => ids.has(id)));
  });

  // Toque: apoyar el dedo en la zona del tiempo.
  els.pad.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.button !== 0 || !current?.scramble) return;
    e.preventDefault();
    els.pad.setPointerCapture(e.pointerId);
    timer.press();
  });
  els.pad.addEventListener('pointerup', (event) => { if (event.isPrimary) timer.release(); });
  els.pad.addEventListener('lostpointercapture', () => timer.blur());

  renderSets();
  renderCases();
  nextCase();
}

// Se llama una sola vez: el teclado y los datos importados.
let listening = false;
export function setTrainerActive(on) {
  active = on;
  if (!on) {
    // Al salir se corta todo sin guardar (también un tiempo que estaba corriendo).
    discard = true;
    if (timer.state === 'running') timer.press();
    timer.blur();
    timer.cancel();
    discard = false;
    trainerKey = null;
    if (els) updateTimerText(formatTime(0));
    player = null;
    destroyScopePlayer('trainer');
  } else if (els && current?.scramble) {
    showCase();
  }
  if (listening) return;
  listening = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  const forgetInput = () => { trainerKey = null; timer.blur(); };
  window.addEventListener('blur', forgetInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) forgetInput(); });
  // Importar tiempos desde Ajustes puede traer tiempos del entrenador.
  window.addEventListener('trainer-data-changed', () => {
    if (!hasPendingSave) data = normalizeTrainer(loadTrainerData());
    if (els) renderCases();
  });
}
