// Máquina de estados del cronómetro. No sabe nada del DOM: la UI le avisa
// press / release / cancel / blur y el timer responde por callbacks.
import { inspectionPenalty, alertsCrossed, PLUS2_LIMIT_MS } from './inspection.js';

// Estados:
//   idle        inactivo
//   primed      tecla apretada estando inactivo; al soltar empieza la inspección
//   inspection  cuenta regresiva de 15 s
//   holding     manteniendo apretado hasta cumplir holdMs (la inspección sigue contando)
//   ready       listo (verde): al soltar arranca
//   running     corriendo
//   stopped     detenido: espera que se suelte la tecla para volver a inactivo
//
// Flujo con inspección:  idle → primed → inspection → holding → ready → running → stopped → idle
// Flujo sin inspección:  idle → holding → ready → running → stopped → idle

// Estados en los que hace falta el bucle de cuadros (para contar o mostrar tiempo).
const ACTIVE = new Set(['inspection', 'holding', 'ready', 'running']);

// Próximo cuadro. Si el navegador no pinta (pestaña o ventana oculta), el
// setTimeout de respaldo hace que las reglas (avisos, 17 s, mantener) sigan andando.
function nextFrame(cb) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(handle.raf);
    clearTimeout(handle.timeout);
    cb();
  };
  const handle = { raf: requestAnimationFrame(run), timeout: setTimeout(run, 100) };
  return handle;
}

function cancelNextFrame(handle) {
  cancelAnimationFrame(handle.raf);
  clearTimeout(handle.timeout);
}

export function createTimer({
  getHoldMs = () => 500,
  getInspection = () => true,
  onState,
  onTick,
  onInspectionTick,
  onInspectionAlert,
  onSolve,
  // Reloj y cuadros inyectables para poder probarlo con un reloj falso.
  now = () => performance.now(),
  requestFrame = nextFrame,
  cancelFrame = cancelNextFrame,
} = {}) {
  let state = 'idle';
  let keyDown = false; // evita press/release duplicados (teclas repetidas, varios dedos)
  let inspectionStart = null; // null = no hay inspección en curso
  let lastInspection = 0; // última lectura, para detectar los avisos de 8 y 12 s
  let holdStart = 0;
  let holdMs = 500;
  let startedAt = 0;
  let penalty = null; // penalización de inspección del solve en curso
  let frame = null;

  const inspecting = () => inspectionStart !== null;

  // Volver atrás si se suelta o se pierde el foco antes de estar listo.
  const back = () => (inspecting() ? 'inspection' : 'idle');

  // Pasaron más de 17 s sin arrancar: DNF automático, sin resolución.
  function inspectionDNF() {
    onSolve?.({ time: 0, penalty: 'DNF', autoPenalty: 'DNF' });
    return keyDown ? 'stopped' : 'idle';
  }

  // Tabla de transiciones: evento → acción que devuelve el próximo estado.
  // Un evento que no figura en el estado actual se ignora.
  const transitions = {
    idle: {
      press: () => (getInspection() ? 'primed' : 'holding'),
    },
    primed: {
      release: () => {
        inspectionStart = now();
        lastInspection = 0;
        return 'inspection';
      },
      cancel: () => 'idle',
      blur: () => 'idle',
    },
    inspection: {
      press: () => 'holding',
      cancel: () => 'idle',
      expire: inspectionDNF,
    },
    holding: {
      holdDone: () => 'ready',
      release: back,
      cancel: () => 'idle',
      blur: back,
      expire: inspectionDNF,
    },
    ready: {
      release: () => {
        penalty = inspecting() ? inspectionPenalty(now() - inspectionStart) : null;
        if (penalty === 'DNF') return inspectionDNF(); // por si el bucle no llegó a verlo
        startedAt = now();
        return 'running';
      },
      cancel: () => 'idle',
      blur: back,
      expire: inspectionDNF,
    },
    running: {
      press: () => {
        onSolve?.({ time: now() - startedAt, penalty, autoPenalty: penalty });
        return 'stopped';
      },
    },
    stopped: {
      release: () => 'idle',
      blur: () => 'idle',
    },
  };

  function setState(next) {
    // Al salir de la inspección (arrancar, cancelar o DNF) se descarta su inicio.
    if (!['inspection', 'holding', 'ready'].includes(next)) inspectionStart = null;
    if (next === 'holding') {
      holdStart = now();
      holdMs = getHoldMs();
    }
    state = next;
    onState?.(state, { inspecting: inspecting() });

    if (ACTIVE.has(state) && frame === null) frame = requestFrame(loop);
    if (!ACTIVE.has(state) && frame !== null) {
      cancelFrame(frame);
      frame = null;
    }
  }

  function dispatch(event) {
    const action = transitions[state][event];
    if (action) setState(action());
  }

  function loop() {
    frame = null;
    const t = now();
    if (state === 'holding' && t - holdStart >= holdMs) dispatch('holdDone');
    if (inspecting()) {
      const elapsed = t - inspectionStart;
      for (const ms of alertsCrossed(lastInspection, elapsed)) onInspectionAlert?.(ms);
      lastInspection = elapsed;
      if (elapsed > PLUS2_LIMIT_MS) dispatch('expire');
      else onInspectionTick?.(elapsed);
    }
    if (state === 'running') onTick?.(t - startedAt);
    if (ACTIVE.has(state) && frame === null) frame = requestFrame(loop);
  }

  return {
    // Apretar (barra espaciadora o dedo). Un segundo press sin release se ignora.
    press() {
      if (keyDown) return;
      keyDown = true;
      dispatch('press');
    },
    // Soltar. Un release sin press previo se ignora.
    release() {
      if (!keyDown) return;
      keyDown = false;
      dispatch('release');
    },
    // Escape: cancela la inspección o la espera, sin guardar nada.
    cancel() {
      dispatch('cancel');
    },
    // La ventana perdió el foco: el keyup no va a llegar, así que se olvida la tecla.
    blur() {
      keyDown = false;
      dispatch('blur');
    },
    get state() {
      return state;
    },
    get inspecting() {
      return inspecting();
    },
  };
}
