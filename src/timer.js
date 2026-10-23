// Máquina de estados del cronómetro. No sabe nada del DOM: la UI le avisa
// cuándo se aprieta/suelta y el timer avisa por callbacks.
//
// idle ──press──▶ holding ──(holdMs)──▶ ready ──release──▶ running ──press/stop──▶ idle
//                    └──release antes de tiempo──▶ idle

export function createTimer({ holdMs = 500, onState, onTick, onStop }) {
  let state = 'idle';
  let holdTimer = null;
  let startedAt = 0;
  let frame = null;

  function setState(next) {
    state = next;
    onState?.(state);
  }

  function tick() {
    onTick?.(performance.now() - startedAt);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    startedAt = performance.now();
    setState('running');
    tick();
  }

  function stop() {
    if (state !== 'running') return;
    const elapsed = performance.now() - startedAt;
    cancelAnimationFrame(frame);
    setState('idle');
    onStop?.(elapsed);
  }

  // Mantener apretado: empieza la espera (rojo) y a los holdMs queda listo (verde).
  function press() {
    if (state === 'running') return stop();
    if (state !== 'idle') return;
    setState('holding');
    holdTimer = setTimeout(() => setState('ready'), holdMs);
  }

  // Soltar: si estaba listo, arranca; si se soltó antes, se cancela.
  function release() {
    if (state === 'ready') return start();
    if (state === 'holding') cancel();
  }

  function cancel() {
    clearTimeout(holdTimer);
    if (state === 'holding' || state === 'ready') setState('idle');
  }

  return {
    press,
    release,
    stop,
    cancel,
    get state() {
      return state;
    },
  };
}
