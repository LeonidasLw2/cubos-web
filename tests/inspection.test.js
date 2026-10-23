// Pruebas de las reglas de inspección y de los ajustes (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectionPenalty, inspectionDisplay, alertsCrossed } from '../src/inspection.js';
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
    sanitizeSettings({ inspection: false, voice: 'sí', holdMs: 650, showCube: false, timerDisplay: 'solving', extra: 1 }),
    { inspection: false, voice: true, holdMs: 500, showCube: false, timerDisplay: 'solving' },
  );
  assert.equal(sanitizeSettings({ holdMs: 800 }).holdMs, 800);
});
