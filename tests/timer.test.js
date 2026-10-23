// Pruebas de la máquina de estados del timer con un reloj falso (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer } from '../src/timer.js';

// Crea un timer con reloj falso. advance(ms) mueve el reloj de a 10 ms y ejecuta
// los cuadros pendientes, como haría el navegador con requestAnimationFrame.
function setup({ inspection = true, holdMs = 500 } = {}) {
  let t = 0;
  let pending = null;
  const solves = [];
  const alerts = [];
  const timer = createTimer({
    getHoldMs: () => holdMs,
    getInspection: () => inspection,
    now: () => t,
    requestFrame: (cb) => {
      pending = cb;
      return 1;
    },
    cancelFrame: () => {
      pending = null;
    },
    onSolve: (s) => solves.push(s),
    onInspectionAlert: (ms) => alerts.push(ms),
  });
  function advance(ms) {
    const end = t + ms;
    while (t < end) {
      t = Math.min(end, t + 10);
      const cb = pending;
      pending = null;
      cb?.();
    }
  }
  return { timer, solves, alerts, advance };
}

// Inspecciona y suelta para arrancar exactamente a los `ms` de inspección.
function startAfterInspection(ctx, ms, holdMs = 500) {
  ctx.timer.press();
  ctx.timer.release(); // empieza la inspección
  ctx.advance(ms - holdMs);
  ctx.timer.press(); // mantener apretado
  ctx.advance(holdMs);
  ctx.timer.release(); // arranca (si no hubo DNF)
}

// Resuelve en `ms` y para.
function solveFor(ctx, ms) {
  ctx.advance(ms);
  ctx.timer.press();
  ctx.timer.release();
}

test('flujo completo con inspección', () => {
  const ctx = setup();
  const { timer } = ctx;
  assert.equal(timer.state, 'idle');
  timer.press();
  assert.equal(timer.state, 'primed');
  timer.release();
  assert.equal(timer.state, 'inspection');
  ctx.advance(3000);
  timer.press();
  assert.equal(timer.state, 'holding');
  ctx.advance(490);
  assert.equal(timer.state, 'holding');
  ctx.advance(10);
  assert.equal(timer.state, 'ready');
  timer.release();
  assert.equal(timer.state, 'running');
  ctx.advance(12340);
  timer.press();
  assert.equal(timer.state, 'stopped');
  timer.release();
  assert.equal(timer.state, 'idle'); // soltar después de parar NO arranca otra inspección
  assert.deepEqual(ctx.solves, [{ time: 12340, penalty: null, autoPenalty: null }]);
});

test('arrancar justo a los 15 s: sin penalización', () => {
  const ctx = setup();
  startAfterInspection(ctx, 15000);
  assert.equal(ctx.timer.state, 'running');
  solveFor(ctx, 10000);
  assert.equal(ctx.solves[0].penalty, null);
});

test('arrancar a los 15,01 s: +2', () => {
  const ctx = setup();
  startAfterInspection(ctx, 15010);
  solveFor(ctx, 10000);
  assert.deepEqual(ctx.solves[0], { time: 10000, penalty: '+2', autoPenalty: '+2' });
});

test('arrancar a los 16,9 s: +2', () => {
  const ctx = setup();
  startAfterInspection(ctx, 16900);
  assert.equal(ctx.timer.state, 'running');
  solveFor(ctx, 10000);
  assert.equal(ctx.solves[0].penalty, '+2');
});

test('arrancar justo a los 17 s: todavía +2', () => {
  const ctx = setup();
  startAfterInspection(ctx, 17000);
  assert.equal(ctx.timer.state, 'running');
  solveFor(ctx, 10000);
  assert.equal(ctx.solves[0].penalty, '+2');
});

test('pasarse de 17 s sin tocar nada: DNF automático', () => {
  const ctx = setup();
  ctx.timer.press();
  ctx.timer.release();
  ctx.advance(17000);
  assert.equal(ctx.timer.state, 'inspection');
  ctx.advance(10);
  assert.equal(ctx.timer.state, 'idle');
  assert.deepEqual(ctx.solves, [{ time: 0, penalty: 'DNF', autoPenalty: 'DNF' }]);
  assert.deepEqual(ctx.alerts, [8000, 12000]);
});

test('pasarse de 17 s mientras se mantiene apretado: DNF y no arranca al soltar', () => {
  const ctx = setup();
  startAfterInspection(ctx, 17500); // el DNF llega mientras está en ready
  assert.equal(ctx.timer.state, 'idle'); // el release solo cerró el "stopped"
  assert.equal(ctx.solves.length, 1);
  assert.equal(ctx.solves[0].penalty, 'DNF');
});

test('Escape cancela la inspección sin guardar nada', () => {
  const ctx = setup();
  ctx.timer.press();
  ctx.timer.release();
  ctx.advance(5000);
  ctx.timer.cancel();
  assert.equal(ctx.timer.state, 'idle');
  ctx.advance(20000); // ya no cuenta: no hay DNF ni avisos
  assert.deepEqual(ctx.solves, []);
  assert.deepEqual(ctx.alerts, []);
});

test('Escape mientras se mantiene apretado: al soltar no pasa nada', () => {
  const ctx = setup();
  ctx.timer.press();
  ctx.timer.release();
  ctx.timer.press();
  ctx.advance(600); // ready
  ctx.timer.cancel();
  assert.equal(ctx.timer.state, 'idle');
  ctx.timer.release();
  assert.equal(ctx.timer.state, 'idle');
  ctx.timer.press(); // y se puede volver a empezar normalmente
  assert.equal(ctx.timer.state, 'primed');
});

test('teclas repetidas: varios press o release seguidos no rompen nada', () => {
  const ctx = setup();
  const { timer } = ctx;
  timer.press();
  timer.press();
  timer.press();
  assert.equal(timer.state, 'primed');
  timer.release();
  timer.release();
  timer.release();
  assert.equal(timer.state, 'inspection'); // un solo release cuenta
  timer.press();
  timer.press();
  ctx.advance(500);
  timer.release();
  timer.release();
  assert.equal(timer.state, 'running');
  ctx.advance(1000);
  timer.press();
  timer.press();
  timer.release();
  timer.release();
  assert.equal(timer.state, 'idle');
  assert.equal(ctx.solves.length, 1);
});

test('soltar antes de tiempo vuelve a la inspección, que sigue contando', () => {
  const ctx = setup();
  ctx.timer.press();
  ctx.timer.release();
  ctx.advance(9000);
  ctx.timer.press();
  ctx.advance(200);
  ctx.timer.release();
  assert.equal(ctx.timer.state, 'inspection');
  assert.deepEqual(ctx.alerts, [8000]);
});

test('perder el foco mientras se mantiene apretado vuelve atrás', () => {
  const ctx = setup();
  ctx.timer.press();
  ctx.timer.release();
  ctx.timer.press();
  ctx.advance(600);
  ctx.timer.blur();
  assert.equal(ctx.timer.state, 'inspection');
  ctx.timer.release(); // el keyup perdido no hace nada
  assert.equal(ctx.timer.state, 'inspection');
});

test('cancelar o liberar en estados donde no corresponde se ignora', () => {
  const ctx = setup();
  ctx.timer.release();
  ctx.timer.cancel();
  assert.equal(ctx.timer.state, 'idle');
  startAfterInspection(ctx, 2000);
  ctx.timer.cancel(); // Escape mientras corre: no cancela (lo para la UI como cualquier tecla)
  assert.equal(ctx.timer.state, 'running');
});

test('sin inspección: mantener y soltar arranca directo', () => {
  const ctx = setup({ inspection: false });
  ctx.timer.press();
  assert.equal(ctx.timer.state, 'holding');
  ctx.advance(300);
  ctx.timer.release();
  assert.equal(ctx.timer.state, 'idle'); // soltó antes de 0,5 s
  ctx.timer.press();
  ctx.advance(500);
  ctx.timer.release();
  assert.equal(ctx.timer.state, 'running');
  solveFor(ctx, 1234);
  assert.deepEqual(ctx.solves, [{ time: 1234, penalty: null, autoPenalty: null }]);
});

test('respeta el tiempo de mantener configurado (0,3 y 0,8 s)', () => {
  for (const holdMs of [300, 800]) {
    const ctx = setup({ inspection: false, holdMs });
    ctx.timer.press();
    ctx.advance(holdMs - 10);
    assert.equal(ctx.timer.state, 'holding');
    ctx.advance(10);
    assert.equal(ctx.timer.state, 'ready');
  }
});
