// Pruebas del entrenador de casos (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTrainer,
  addTime,
  caseStats,
  countTimes,
  mergeTrainer,
  pickCase,
  emptyTrainer,
  MAX_TIMES_PER_CASE,
} from '../src/trainer-store.js';
import { buildExport, parseImport } from '../src/transfer.js';
import { TRAINER_SETS } from '../src/data/trainer-sets.js';
import { parseRoute } from '../src/router.js';

test('normalizeTrainer: datos vacíos, rotos o con basura', () => {
  assert.deepEqual(normalizeTrainer(null), emptyTrainer());
  assert.deepEqual(normalizeTrainer('hola'), emptyTrainer());
  const data = normalizeTrainer({
    set: 'pll',
    selected: { pll: ['Ua', 3, 'Ub'], oll: 'no' },
    times: { pll: { Ua: [{ time: 1500, date: 10 }, { time: -1 }, { time: 'x' }, { time: 2000 }], Ub: [] } },
  });
  assert.equal(data.set, 'pll');
  assert.deepEqual(data.selected, { pll: ['Ua', 'Ub'] });
  assert.deepEqual(data.times, { pll: { Ua: [{ time: 1500, date: 10 }, { time: 2000, date: null }] } });
});

test('addTime no modifica los datos de entrada y guarda los últimos 100', () => {
  const before = emptyTrainer();
  const after = addTime(before, 'pll', 'Ua', 1234, 1);
  assert.deepEqual(before.times, {});
  assert.deepEqual(after.times.pll.Ua, [{ time: 1234, date: 1 }]);
  let d = after;
  for (let i = 0; i < MAX_TIMES_PER_CASE + 5; i++) d = addTime(d, 'pll', 'Ua', i, i);
  assert.equal(d.times.pll.Ua.length, MAX_TIMES_PER_CASE);
  assert.equal(d.times.pll.Ua.at(-1).time, MAX_TIMES_PER_CASE + 4);
});

test('caseStats: mejor, media y últimos 5', () => {
  assert.deepEqual(caseStats([]), { count: 0, best: null, mean: null, recent: null });
  const list = [1000, 2000, 3000, 4000, 5000, 6000].map((time) => ({ time }));
  assert.deepEqual(caseStats(list), { count: 6, best: 1000, mean: 3500, recent: 4000 });
});

test('mergeTrainer junta sin duplicar y no toca la selección', () => {
  const mine = { set: 'oll', selected: { pll: ['Ua'] }, times: { pll: { Ua: [{ time: 1000, date: 1 }] } } };
  const file = normalizeTrainer({ times: { pll: { Ua: [{ time: 1000, date: 1 }, { time: 900, date: 2 }] }, oll: { 'oll-27': [{ time: 800, date: 3 }] } } });
  const { merged, added, duplicates } = mergeTrainer(mine, file);
  assert.equal(added, 2);
  assert.equal(duplicates, 1);
  assert.equal(merged.set, 'oll');
  assert.deepEqual(merged.selected, { pll: ['Ua'] });
  assert.deepEqual(merged.times.pll.Ua.map((t) => t.time), [1000, 900]);
  assert.equal(countTimes(merged), 3);
  assert.equal(countTimes(mine), 1); // el original no cambió
});

test('pickCase no repite el anterior si hay otro', () => {
  assert.equal(pickCase([], null), null);
  assert.equal(pickCase(['a'], 'a'), 'a');
  for (let i = 0; i < 20; i++) assert.equal(pickCase(['a', 'b'], 'a', Math.random), 'b');
  assert.equal(pickCase(['a', 'b', 'c'], null, () => 0.99), 'c');
});

test('exportar e importar incluye los tiempos del entrenador', () => {
  const trainer = addTime(emptyTrainer(), 'pll', 'Ua', 1500, 5);
  const file = JSON.stringify(buildExport({ 333: [] }, new Date(0), trainer));
  const parsed = parseImport(file, ['333']);
  assert.deepEqual(parsed.trainer.times, { pll: { Ua: [{ time: 1500, date: 5 }] } });
  // Sin tiempos del entrenador no se agrega el campo, y un archivo viejo sigue funcionando.
  assert.equal(buildExport({ 333: [] }, new Date(0), emptyTrainer()).trainer, undefined);
  assert.equal(parseImport(JSON.stringify(buildExport({ 333: [] }, new Date(0))), ['333']).trainer, null);
});

test('grupos del entrenador: casos con id único y algoritmo', () => {
  const counts = Object.fromEntries(TRAINER_SETS.map((s) => [s.id, s.cases.length]));
  assert.deepEqual(counts, { pll: 21, oll: 57, f2l: 41, cmll: 42, oll2: 7, pbl: 5 });
  for (const s of TRAINER_SETS) {
    assert.equal(new Set(s.cases.map((c) => c.id)).size, s.cases.length, s.id);
    for (const c of s.cases) assert.ok(c.name && c.alg, `${s.id} › ${c.id}`);
  }
});

test('ruta del entrenador', () => {
  assert.equal(parseRoute('#/entrenar').view, 'trainer');
});
