// Pruebas de las reglas de inspección y de los ajustes (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectionPenalty,
  inspectionDisplay,
  alertsCrossed,
  voiceSchedule,
  estimateLead,
  MAX_VOICE_LEAD_MS,
} from '../src/inspection.js';
import { sanitizeSettings, DEFAULT_SETTINGS } from '../src/settings.js';

test('penalización de inspección', () => {
  assert.equal(inspectionPenalty(0), null);
  assert.equal(inspectionPenalty(15000), null);
  assert.equal(inspectionPenalty(15001), '+2');
  assert.equal(inspectionPenalty(16900), '+2');
  assert.equal(inspectionPenalty(17000), '+2');
  assert.equal(inspectionPenalty(17001), 'DNF');
});

test('lo que muestra la inspección', () => {
  assert.deepEqual(inspectionDisplay(0), { text: '15', level: 'normal' });
  assert.deepEqual(inspectionDisplay(7999), { text: '8', level: 'normal' });
  assert.deepEqual(inspectionDisplay(8000), { text: '7', level: 'warn' });
  assert.deepEqual(inspectionDisplay(12000), { text: '3', level: 'danger' });
  assert.deepEqual(inspectionDisplay(14999), { text: '1', level: 'danger' });
  assert.deepEqual(inspectionDisplay(15500), { text: '+2', level: 'danger' });
  assert.deepEqual(inspectionDisplay(17500), { text: 'DNF', level: 'danger' });
});

test('avisos de 8 y 12 s', () => {
  assert.deepEqual(alertsCrossed(7990, 8000), [8000]);
  assert.deepEqual(alertsCrossed(8000, 8010), []); // no se repite
  assert.deepEqual(alertsCrossed(11000, 12500), [12000]);
  assert.deepEqual(alertsCrossed(1000, 13000), [8000, 12000]); // pestaña en segundo plano
});

test('ajustes: valores por defecto y datos inválidos', () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings({}), DEFAULT_SETTINGS);
  assert.equal(DEFAULT_SETTINGS.inspection, true);
  assert.deepEqual(
    sanitizeSettings({ inspection: false, alerts: 'gritos', countdown: 'x', holdMs: 650, showCube: false, timerDisplay: 'solving', extra: 1 }),
    { inspection: false, alerts: 'voice', countdown: 'down', holdMs: 500, showCube: false, timerDisplay: 'solving' },
  );
  assert.equal(sanitizeSettings({ alerts: 'beep', countdown: 'up' }).alerts, 'beep');
  assert.equal(sanitizeSettings({ countdown: 'up' }).countdown, 'up');
  assert.equal(sanitizeSettings({ holdMs: 800 }).holdMs, 800);
});

test('ajustes viejos: "voice" (sí/no) pasa a los avisos nuevos', () => {
  assert.equal(sanitizeSettings({ voice: true }).alerts, 'voice');
  assert.equal(sanitizeSettings({ voice: false }).alerts, 'none');
  assert.equal(sanitizeSettings({ voice: false, alerts: 'beep' }).alerts, 'beep'); // manda el nuevo
});

test('contador progresivo: muestra los segundos que pasaron (8 a los 8 s, 12 a los 12 s)', () => {
  assert.equal(inspectionDisplay(0, 'up').text, '0');
  assert.equal(inspectionDisplay(7999, 'up').text, '7');
  assert.equal(inspectionDisplay(8000, 'up').text, '8');
  assert.equal(inspectionDisplay(12000, 'up').text, '12');
  assert.equal(inspectionDisplay(15000, 'up').text, '15');
  assert.equal(inspectionDisplay(15001, 'up').text, '+2');
  assert.equal(inspectionDisplay(17001, 'up').text, 'DNF');
  // regresivo: a los 8 s muestra 7, a los 12 s muestra 3 (y los colores cambian ahí mismo)
  assert.deepEqual(inspectionDisplay(8000, 'down'), { text: '7', level: 'warn' });
  assert.deepEqual(inspectionDisplay(12000, 'down'), { text: '3', level: 'danger' });
  assert.equal(inspectionDisplay(15000, 'down').text, '0');
});

test('voz adelantada: se llama antes para que se escuche a los 8 y 12 s', () => {
  assert.deepEqual(voiceSchedule(0), [{ at: 8000, alert: 8000 }, { at: 12000, alert: 12000 }]);
  assert.deepEqual(voiceSchedule(600), [{ at: 7400, alert: 8000 }, { at: 11400, alert: 12000 }]);
  assert.deepEqual(voiceSchedule(-50).map((c) => c.at), [8000, 12000]); // nunca después
  assert.deepEqual(voiceSchedule(99999).map((c) => c.at), [8000 - MAX_VOICE_LEAD_MS, 12000 - MAX_VOICE_LEAD_MS]);
  // Con lecturas cada 10 ms, cada llamada se dispara una sola vez y en su momento.
  const cues = voiceSchedule(600).map((c) => c.at);
  const fired = [];
  for (let t = 10, prev = 0; t <= 17000; prev = t, t += 10) fired.push(...alertsCrossed(prev, t, cues).map((at) => [at, t]));
  assert.deepEqual(fired, [[7400, 7400], [11400, 11400]]);
});

test('retraso de la voz: mediana de las mediciones, con tope', () => {
  assert.equal(estimateLead([]), 0);
  assert.equal(estimateLead([300]), 300);
  assert.equal(estimateLead([300, 2900, 320]), 320); // una medición rara no manda
  assert.equal(estimateLead([300, 400]), 350);
  assert.equal(estimateLead([5000, 6000, 7000]), MAX_VOICE_LEAD_MS);
  assert.equal(estimateLead([NaN, -5, 200]), 200);
});
