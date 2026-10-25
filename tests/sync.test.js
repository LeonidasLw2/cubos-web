import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIREBASE_CONFIG, isFirebaseConfigured } from '../src/firebase-config.js';
import {
  normalizeSolveRecord,
  mergeSolveRecords,
  activeSolvesFromRecords,
  getIncrementalChanges,
  mergeSettingsMeta,
  sanitizeSolverPrefs,
  DEFAULT_SOLVER_PREFS,
} from '../src/cloud-sync.js';

test('firebase-config vacío por defecto devuelve Sincronización no configurada sin romper', () => {
  assert.equal(isFirebaseConfigured(FIREBASE_CONFIG), false);
  assert.equal(isFirebaseConfigured({ apiKey: '', projectId: '', authDomain: '' }), false);
  assert.equal(isFirebaseConfigured({ apiKey: 'TU_API_KEY', projectId: 'TU_PROJECT_ID', authDomain: 'x.firebaseapp.com' }), false);
  assert.equal(
    isFirebaseConfigured({
      apiKey: 'AIzaSyD1234567890abcdef',
      projectId: 'cubesolver-prod',
      authDomain: 'cubesolver-prod.firebaseapp.com',
    }),
    true,
  );
});

test('mergeSolveRecords: unión por id, gana updatedAt más reciente y nunca pierde tiempos', () => {
  const local = [
    { id: 's1', puzzle: '333', time: 11200, penalty: null, scramble: 'R U', date: 1000, updatedAt: 1000 },
    { id: 's2', puzzle: '333', time: 9800, penalty: null, scramble: 'F R', date: 2000, updatedAt: 2000 },
  ];
  const remote = [
    // s1 fue penalizado con +2 más tarde en otro dispositivo (updatedAt: 1500 > 1000)
    { id: 's1', puzzle: '333', time: 11200, penalty: '+2', scramble: 'R U', date: 1000, updatedAt: 1500 },
    // s3 existe solo en la nube
    { id: 's3', puzzle: '333', time: 10500, penalty: null, scramble: 'U2', date: 1500, updatedAt: 1500 },
  ];

  const merged = mergeSolveRecords(local, remote, '333');
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((r) => r.id),
    ['s1', 's3', 's2'], // orden cronológico por date: 1000, 1500, 2000
  );
  const s1 = merged.find((r) => r.id === 's1');
  assert.equal(s1.penalty, '+2');
  assert.equal(s1.updatedAt, 1500);
});

test('tombstones: borrar un tiempo en un dispositivo impide que reviva desde otro', () => {
  const deviceAOld = [
    { id: 'solve-a', puzzle: '333', time: 12340, penalty: null, date: 1000, updatedAt: 1000, deleted: false },
    { id: 'solve-b', puzzle: '333', time: 13450, penalty: null, date: 2000, updatedAt: 2000, deleted: false },
  ];
  // En el dispositivo B se borró solve-a en t=3000 (tombstone)
  const deviceBWithTombstone = [
    { id: 'solve-a', puzzle: '333', time: 12340, penalty: null, date: 1000, updatedAt: 3000, deleted: true },
    { id: 'solve-b', puzzle: '333', time: 13450, penalty: null, date: 2000, updatedAt: 2000, deleted: false },
  ];

  const merged = mergeSolveRecords(deviceAOld, deviceBWithTombstone, '333');
  assert.equal(merged.length, 2); // conserva el tombstone para propagarlo
  const tomb = merged.find((r) => r.id === 'solve-a');
  assert.equal(tomb.deleted, true);
  assert.equal(tomb.updatedAt, 3000);

  // La lista activa que ve el usuario solo contiene solve-b
  const active = activeSolvesFromRecords(merged);
  assert.deepEqual(
    active.map((r) => r.id),
    ['solve-b'],
  );
});

test('sincronización incremental: solo envía registros con updatedAt > lastSyncAt', () => {
  const records = [
    normalizeSolveRecord({ id: '1', time: 9000, date: 100, updatedAt: 100 }),
    normalizeSolveRecord({ id: '2', time: 9500, date: 200, updatedAt: 500 }),
    normalizeSolveRecord({ id: '3', time: 8900, date: 300, updatedAt: 900, deleted: true }),
  ];
  const changes = getIncrementalChanges(records, 400);
  assert.deepEqual(
    changes.map((r) => r.id),
    ['2', '3'],
  );
});

test('mergeSettingsMeta y preferencias del solver (delay 0–3 s, paso 0.1 s, defecto 1 s)', () => {
  assert.deepEqual(sanitizeSolverPrefs(null), DEFAULT_SOLVER_PREFS);
  assert.equal(DEFAULT_SOLVER_PREFS.stepDelaySec, 1.0);
  assert.equal(sanitizeSolverPrefs({ stepDelaySec: 2.34 }).stepDelaySec, 2.3);
  assert.equal(sanitizeSolverPrefs({ stepDelaySec: 9 }).stepDelaySec, 3);
  assert.equal(sanitizeSolverPrefs({ stepDelaySec: -2 }).stepDelaySec, 0);

  const localMeta = { settings: { holdMs: 300 }, solverPrefs: { stepDelaySec: 0.8, turnSpeed: 1.5 }, updatedAt: 1000 };
  const remoteMeta = { settings: { holdMs: 800 }, solverPrefs: { stepDelaySec: 1.4, turnSpeed: 2.0 }, updatedAt: 2000 };
  const merged = mergeSettingsMeta(localMeta, remoteMeta);
  assert.equal(merged.updatedAt, 2000);
  assert.equal(merged.settings.holdMs, 800);
  assert.equal(merged.solverPrefs.stepDelaySec, 1.4);
});
