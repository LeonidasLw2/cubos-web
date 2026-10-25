// Interfaz: conecta el DOM con el timer, los scrambles, las estadísticas y el almacenamiento.
import { createTimer } from './timer.js';
import {
  inspectionDisplay,
  alertsCrossed,
  voiceSchedule,
  voiceLead,
  ALERTS_MS,
  initVoices,
  announce,
  beep,
  primeAudio,
  stopAnnouncements,
} from './inspection.js';
import { loadSettings, saveSettings } from './settings.js';
import { EVENTS, DEFAULT_EVENT, getEvent, nextScramble } from './scramble.js';
import { summarize, bestTime, effectiveTime, formatTime, formatSolve } from './stats.js';
import {
  loadSolves,
  saveSolves,
  loadSelectedEvent,
  saveSelectedEvent,
  isStoragePersistent,
  loadTrainerData,
  saveTrainerData,
} from './storage.js';
import { buildExport, exportFileName, parseImport, mergeSolves } from './transfer.js';
import { recentTimes, sparkline } from './sparkline.js';
import { cubeSvg } from './cube-art.js';
import { normalizeTrainer, mergeTrainer, countTimes } from './trainer-store.js';

const $ = (id) => document.getElementById(id);

const els = {
  events: $('events'),
  card: $('scramble-card'),
  scramble: $('scramble'),
  newScramble: $('new-scramble'),
  toggleView: $('toggle-view'),
  viewModeBadge: $('view-mode-badge'),
  view: $('scramble-view'),
  timerZone: $('timer-zone'),
  timer: $('timer'),
  hint: $('hint'),
  cancelInspection: $('cancel-inspection'),
  pbBadge: $('pb-badge'),
  pbBurst: $('pb-burst'),
  inspRing: $('insp-ring'),
  solvingIndicator: $('solving-indicator'),
  trend: $('trend'),
  trendChart: $('trend-chart'),
  trendRange: $('trend-range'),
  emptyArt: $('empty-art'),
  emptyHint: $('empty-hint'),
  openSettings: $('open-settings'),
  openSettingsBottom: $('open-settings-bottom'),
  settings: $('settings'),
  settingsForm: $('settings-form'),
  inspectionOptions: $('inspection-options'),
  exportSolves: $('export-solves'),
  importSolves: $('import-solves'),
  importFile: $('import-file'),
  dataStatus: $('data-status'),
  storageStatus: $('storage-status'),
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
  lastResult: '0.00', // lo que vuelve a mostrar el timer al terminar o cancelar
};

let settings = loadSettings();

const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

// ---------- Vista del scramble ----------

// cubing/twisty se carga aparte (import dinámico) para que su código no quede en el
// archivo principal: el worker de scrambles comparte código con él y, si estuviera
// ahí, cargaría también la interfaz. El player se crea recién cuando está definido
// (si se le ponen propiedades antes, no se aplican).
let playerPromise = null;
let currentViewMode = '3D';

function getPlayer() {
  playerPromise ??= import('cubing/twisty').then(() => {
    const player = document.createElement('twisty-player');
    player.controlPanel = 'none';
    player.background = 'none';
    player.hintFacelets = 'none';
    player.experimentalDragInput = 'auto'; // Permite rotar el cubo interactivamente
    els.view.append(player);
    return player;
  });
  return playerPromise;
}

async function updatePlayer() {
  const ev = getEvent(state.event);
  const scramble = state.scramble ?? '';
  els.view.dataset.view = currentViewMode;
  const player = await getPlayer();
  player.puzzle = ev.puzzle;
  player.visualization = currentViewMode;
  player.experimentalSetupAlg = scramble;
  player.alg = '';
  if (els.viewModeBadge) els.viewModeBadge.textContent = currentViewMode;
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
  state.lastResult = '0.00';
  els.timer.textContent = state.lastResult;
  renderSession();
  loadScramble();
}

// ---------- Estadísticas e historial ----------

function renderStats() {
  const s = summarize(state.solves);
  for (const [key, el] of Object.entries(els.stats)) el.textContent = formatTime(s[key]);
  els.count.textContent = String(s.count);
  els.dnf.textContent = String(s.dnfCount);
  renderTrend();
}

// Mini gráfica de los últimos 20 tiempos (los más rápidos, arriba).
function renderTrend() {
  const values = recentTimes(state.solves, 20);
  const g = sparkline(values, 300, 64, 6);
  els.trend.hidden = !g;
  if (!g) return;
  const [bx, by] = g.points[g.best];
  const [lx, ly] = g.points.at(-1);
  els.trendChart.innerHTML = `
    <defs><linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" style="stop-color: var(--c-blue); stop-opacity: 0.35" /><stop offset="1" style="stop-color: var(--c-blue); stop-opacity: 0" />
    </linearGradient></defs>
    <path d="${g.area}" fill="url(#trend-fill)" />
    <path d="${g.line}" class="trend-line" />
    <circle cx="${bx}" cy="${by}" r="3.5" class="trend-best" />
    <circle cx="${lx}" cy="${ly}" r="3" class="trend-last" />`;
  els.trendRange.textContent = `${formatTime(g.min)} – ${formatTime(g.max)}`;
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
    // Penalización puesta por la inspección (si el usuario no la cambió después).
    const auto = solve.autoPenalty !== null && solve.autoPenalty === solve.penalty;
    // DNF por pasarse de 17 s: no hubo resolución, así que no se puede quitar.
    const noSolve = solve.autoPenalty === 'DNF' && solve.time === 0;

    li.innerHTML = `
      <span class="solve-index">${i + 1}</span>
      <div class="solve-main">
        <button class="solve-time" type="button" data-action="toggle" title="Ver scramble"></button>
        ${auto ? `<span class="solve-tag" title="Penalización automática por inspección">${solve.autoPenalty} insp.</span>` : ''}
      </div>
      <div class="solve-actions">
        <button type="button" data-action="plus2" aria-pressed="${solve.penalty === '+2'}" ${noSolve ? 'disabled' : ''}>+2</button>
        <button type="button" data-action="dnf" aria-pressed="${solve.penalty === 'DNF'}" ${noSolve ? 'disabled' : ''}>DNF</button>
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

// Guarda el resultado que entrega el timer ({ time, penalty, autoPenalty }).
function addSolve(result) {
  const previousBest = bestTime(state.solves);
  const solve = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: Math.floor(result.time),
    penalty: result.penalty,
    autoPenalty: result.autoPenalty,
    scramble: state.scramble,
    date: Date.now(),
  };
  state.solves.push(solve);
  state.newSolveId = solve.id;
  state.lastResult = formatSolve(solve);
  commit();
  if (previousBest !== null && effectiveTime(solve) < previousBest) celebratePB();
  loadScramble();
}

function celebratePB() {
  replay(els.timer, 'pb');
  replay(els.pbBadge, 'show');
  replay(els.pbBurst, 'show');
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

// Fase visual: idle (todo visible) · inspection (solo timer y ayuda) · running (solo timer).
function phaseOf(timerState, inspecting) {
  if (timerState === 'running') return 'running';
  return inspecting ? 'inspection' : 'idle';
}

function updateHint(phase = document.body.dataset.phase ?? 'idle') {
  let text;
  if (phase === 'inspection') {
    text = isTouch
      ? 'Mantené el dedo y soltá para arrancar'
      : 'Mantené la barra espaciadora y soltá para arrancar · Esc cancela';
  } else if (settings.inspection) {
    text = isTouch
      ? 'Tocá el tiempo para empezar la inspección'
      : 'Apretá la barra espaciadora para empezar la inspección';
  } else {
    text = isTouch
      ? 'Mantené el dedo sobre el tiempo y soltá para empezar'
      : 'Mantené apretada la barra espaciadora y soltá para empezar';
  }
  els.hint.textContent = text;
  els.emptyHint.textContent = isTouch
    ? 'Tocá el tiempo de arriba para empezar.'
    : 'Apretá la barra espaciadora para empezar.';
}

const timer = createTimer({
  getHoldMs: () => settings.holdMs,
  getInspection: () => settings.inspection,

  onState(s, { inspecting }) {
    const prev = els.timer.dataset.state;
    els.timer.dataset.state = s;
    els.timer.toggleAttribute('data-inspecting', inspecting);
    if (!inspecting) delete els.timer.dataset.level;
    const hidden = s === 'running' && settings.timerDisplay === 'solving';
    els.timer.classList.toggle('solving', hidden);
    els.timerZone.classList.toggle('is-solving', hidden);
    if (!inspecting) delete els.timerZone.dataset.level;

    const phase = phaseOf(s, inspecting);
    document.body.dataset.phase = phase;
    updateHint(phase);

    if (s === 'inspection' && prev === 'primed') {
      // Empieza la inspección (viene de una tecla o toque: se puede activar el audio).
      startAlerts();
      els.timer.textContent = settings.countdown === 'up' ? '0' : '15';
      els.timer.dataset.level = 'normal';
      els.timerZone.dataset.level = 'normal';
      els.inspRing.classList.toggle('up', settings.countdown === 'up');
      replay(els.inspRing, 'run'); // regresivo: el anillo se vacía en 15 s; progresivo: se llena
    } else if (s === 'holding' && !inspecting) {
      els.timer.textContent = '0.00';
    } else if (s === 'running') {
      els.timer.textContent = settings.timerDisplay === 'solving' ? 'Resolviendo...' : '0.00';
    } else if (s === 'idle' || s === 'stopped') {
      els.timer.textContent = state.lastResult; // tiempo recién hecho, o el anterior si se canceló
      if (s === 'stopped' && prev === 'running') replay(els.timer, 'landed'); // el tiempo final "aterriza"
    }
    if (!inspecting) {
      els.inspRing.classList.remove('run');
      stopAnnouncements(); // al arrancar, cancelar o terminar: que no quede ninguna frase pendiente
    }
  },

  onInspectionTick(elapsed) {
    soundAlerts(elapsed);
    const { text, level } = inspectionDisplay(elapsed, settings.countdown);
    if (els.timer.textContent !== text) els.timer.textContent = text;
    els.timer.dataset.level = level;
    if (els.timerZone.dataset.level !== level) els.timerZone.dataset.level = level;
  },

  // Aviso visual: a los 8,0 y 12,0 s exactos. El sonido va aparte (soundAlerts).
  onInspectionAlert() {
    replay(els.timer, 'alert');
  },

  onTick(ms) {
    if (settings.timerDisplay === 'time') els.timer.textContent = formatTime(ms);
  },

  onSolve: addSolve,
});

// ---------- Avisos de sonido de la inspección ----------
// La voz tarda en empezar a hablar (en Android, bastante): se la llama antes, lo
// que tarda en este dispositivo, para que se escuche a los 8 y 12 s justos. Los
// pitidos no tienen demora y suenan en el momento exacto.
let soundCues = [];
let lastSoundAt = 0;

function startAlerts() {
  lastSoundAt = 0;
  if (settings.alerts === 'none') {
    soundCues = [];
    return;
  }
  primeAudio(settings.alerts); // activa el audio y calienta el motor de voz
  soundCues = settings.alerts === 'voice' ? voiceSchedule(voiceLead()) : ALERTS_MS.map((alert) => ({ at: alert, alert }));
}

function soundAlerts(elapsed) {
  const due = alertsCrossed(lastSoundAt, elapsed, soundCues.map((c) => c.at));
  lastSoundAt = elapsed;
  for (const at of due) {
    const { alert } = soundCues.find((c) => c.at === at);
    if (settings.alerts === 'voice') announce(alert);
    else beep(alert >= 12000 ? 2 : 1);
  }
}

// ---------- Teclado y toque ----------

let activeKey = null; // tecla que está "apretando" el timer (una sola a la vez)
let touching = false; // hay un toque nuestro en curso
let timerActive = true; // false cuando se está viendo otra sección (Métodos)

// La navegación avisa si el timer está a la vista. Al salir se cancela la
// inspección y se olvidan las teclas apretadas, sin guardar nada.
export function setTimerActive(active) {
  timerActive = active;
  if (!active) {
    forgetInput();
    timer.cancel();
  }
}

function onKeyDown(e) {
  if (!timerActive || els.settings.open) return; // con el panel abierto, el teclado es del panel
  if (e.repeat) {
    if (e.code === 'Space') e.preventDefault();
    return;
  }
  // Mientras corre, cualquier tecla lo para (también Escape).
  if (timer.state === 'running') {
    e.preventDefault();
    if (activeKey === null) {
      activeKey = e.code;
      timer.press();
    }
    return;
  }
  if (e.code === 'Escape') return timer.cancel();
  if (e.code !== 'Space') return;
  e.preventDefault(); // evita scroll y "clic" en el botón enfocado
  if (activeKey !== null) return;
  document.activeElement?.blur();
  activeKey = 'Space';
  timer.press();
}

function onKeyUp(e) {
  if (e.code !== activeKey) return;
  e.preventDefault();
  activeKey = null;
  timer.release();
}

function onTouchStart(e) {
  if (!timerActive || els.settings.open || e.target.closest('button, dialog, a')) return; // botones y links funcionan normal
  // Inactivo: solo la zona del timer. Inspeccionando o corriendo: toda la pantalla.
  if (timer.state === 'idle' && !els.timerZone.contains(e.target)) return;
  e.preventDefault();
  touching = true;
  timer.press();
}

function onTouchEnd(e) {
  if (!touching) return;
  e.preventDefault();
  touching = false;
  timer.release();
}

function forgetInput() {
  activeKey = null;
  touching = false;
  timer.blur();
}

// ---------- Ajustes ----------

function applySettings() {
  els.card.classList.toggle('no-cube', !settings.showCube);
  updateHint();
}

function fillSettingsForm() {
  const f = els.settingsForm.elements;
  f.inspection.checked = settings.inspection;
  f.alerts.value = settings.alerts;
  f.countdown.value = settings.countdown;
  els.inspectionOptions.disabled = !settings.inspection; // los avisos y el contador son de la inspección
  f.holdMs.value = String(settings.holdMs);
  f.showCube.checked = settings.showCube;
  f.timerDisplay.value = settings.timerDisplay;
}

function onSettingsChange() {
  const f = els.settingsForm.elements;
  settings = {
    inspection: f.inspection.checked,
    alerts: f.alerts.value,
    countdown: f.countdown.value,
    holdMs: Number(f.holdMs.value),
    showCube: f.showCube.checked,
    timerDisplay: f.timerDisplay.value,
  };
  saveSettings(settings);
  els.inspectionOptions.disabled = !settings.inspection;
  applySettings();
}

function openSettings() {
  if (timer.state !== 'idle') return;
  fillSettingsForm();
  els.dataStatus.textContent = '';
  showStorageStatus();
  els.settings.showModal();
}

// ---------- Exportar / importar tiempos ----------

function showDataStatus(text, kind = 'ok') {
  els.dataStatus.textContent = text;
  els.dataStatus.dataset.kind = kind;
}

async function showStorageStatus() {
  const persistent = await isStoragePersistent();
  els.storageStatus.textContent =
    persistent === true
      ? 'Almacenamiento protegido: el navegador no va a borrar tus tiempos.'
      : persistent === false
        ? 'Si el celular se queda sin espacio, el navegador podría borrar los datos de esta página. Instalar la app los protege; igual conviene exportar de vez en cuando.'
        : '';
}

function exportSolves() {
  const trainer = normalizeTrainer(loadTrainerData());
  const data = buildExport(Object.fromEntries(EVENTS.map((ev) => [ev.id, loadSolves(ev.id)])), new Date(), trainer);
  const total = Object.values(data.events).reduce((n, list) => n + list.length, 0) + countTimes(trainer);
  if (!total) return showDataStatus('Todavía no hay tiempos para exportar.', 'error');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName();
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showDataStatus(`Se exportaron ${total} ${total === 1 ? 'tiempo' : 'tiempos'}.`);
}

async function importSolves(file) {
  let parsed;
  try {
    parsed = parseImport(await file.text(), EVENTS.map((ev) => ev.id));
  } catch (err) {
    return showDataStatus(err.message, 'error');
  }
  let added = 0;
  let duplicates = 0;
  let failed = false;
  for (const [eventId, incoming] of Object.entries(parsed.events)) {
    const result = mergeSolves(loadSolves(eventId), incoming);
    added += result.added;
    duplicates += result.duplicates;
    if (result.added && !saveSolves(eventId, result.merged)) failed = true;
  }
  // Tiempos del entrenador de casos (si el archivo los trae).
  if (parsed.trainer) {
    const result = mergeTrainer(normalizeTrainer(loadTrainerData()), parsed.trainer);
    added += result.added;
    duplicates += result.duplicates;
    if (result.added && !saveTrainerData(result.merged)) failed = true;
    if (result.added) window.dispatchEvent(new Event('trainer-data-changed'));
  }
  // La categoría que se está viendo puede haber cambiado.
  state.solves = loadSolves(state.event);
  state.newSolveId = null;
  renderSession();

  if (failed) return showDataStatus('No hay espacio suficiente para guardar todos los tiempos.', 'error');
  const parts = [`Se importaron ${added} ${added === 1 ? 'tiempo' : 'tiempos'}`];
  if (duplicates) parts.push(`${duplicates} ya ${duplicates === 1 ? 'estaba' : 'estaban'}`);
  if (parsed.invalid) parts.push(`${parsed.invalid} con datos inválidos se ignoraron`);
  if (parsed.unknownEvents.length) parts.push(`categorías desconocidas ignoradas: ${parsed.unknownEvents.join(', ')}`);
  showDataStatus(`${parts.join(' · ')}.`, added ? 'ok' : 'info');
}

// La PWA solo puede recargar (para actualizar) si el timer está quieto.
export function isTimerIdle() {
  return timer.state === 'idle' && !els.settings.open;
}

// ---------- Inicio ----------

export function initUI() {
  initVoices(); // elegir la voz en español ya al abrir (en algunos navegadores llega después)
  // Ilustraciones: el cubo del estado vacío y el que late con "ocultar el tiempo".
  els.emptyArt.innerHTML = cubeSvg({ n: 3 });
  els.solvingIndicator.insertAdjacentHTML('afterbegin', cubeSvg({ n: 3, className: 'solving-cube' }));
  renderEvents();
  els.events.addEventListener('click', (e) => {
    const btn = e.target.closest('.event-btn');
    if (btn) selectEvent(btn.dataset.event);
  });
  els.newScramble.addEventListener('click', loadScramble);
  if (els.toggleView) {
    els.toggleView.addEventListener('click', () => {
      currentViewMode = currentViewMode === '3D' ? '2D' : '3D';
      updatePlayer();
    });
  }
  if (els.openSettingsBottom) {
    els.openSettingsBottom.addEventListener('click', openSettings);
  }
  els.solves.addEventListener('click', onSolveAction);
  els.clearSession.addEventListener('click', clearSession);
  els.cancelInspection.addEventListener('click', () => timer.cancel());
  // Al terminar una animación del timer se quita su clase, para que no tape a la siguiente.
  els.timer.addEventListener('animationend', (e) => {
    if (e.animationName === 'alert') els.timer.classList.remove('alert');
    if (e.animationName === 'pb-glow') els.timer.classList.remove('pb');
    if (e.animationName === 'land') els.timer.classList.remove('landed');
  });
  // Igual con el aviso de PB: si quedara la clase, se repetiría al volver a mostrar el timer.
  els.pbBadge.addEventListener('animationend', () => els.pbBadge.classList.remove('show'));
  els.pbBurst.addEventListener('animationend', (e) => {
    if (e.target === els.pbBurst.lastElementChild) els.pbBurst.classList.remove('show');
  });

  els.openSettings.addEventListener('click', openSettings);
  els.settingsForm.addEventListener('change', onSettingsChange);
  els.exportSolves.addEventListener('click', exportSolves);
  els.importSolves.addEventListener('click', () => els.importFile.click());
  els.importFile.addEventListener('change', () => {
    const [file] = els.importFile.files;
    if (file) importSolves(file).finally(() => (els.importFile.value = ''));
  });
  // Clic fuera del panel (en el fondo oscuro) lo cierra.
  els.settings.addEventListener('click', (e) => {
    if (e.target === els.settings) els.settings.close();
  });

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('touchstart', onTouchStart, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: false });
  document.addEventListener('touchcancel', forgetInput);
  window.addEventListener('blur', forgetInput);

  document.body.dataset.phase = 'idle';
  applySettings();
  state.solves = loadSolves(state.event);
  renderSession();
  updatePlayer();
  loadScramble();
}
