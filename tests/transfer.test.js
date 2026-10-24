// Pruebas de exportar/importar tiempos (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExport, exportFileName, parseImport, mergeSolves, EXPORT_FORMAT } from '../src/transfer.js';

const EVENTS = ['222', '333', '444', '555', '777', 'minx', 'pyram'];
const solve = (id, time, date, extra = {}) => ({ id, time, penalty: null, autoPenalty: null, scramble: 'R U', date, ...extra });

test('exportar: formato, solo categorías con tiempos y nombre de archivo', () => {
  const data = buildExport({ 333: [solve('a', 10000, 1)], 222: [] }, new Date('2026-10-24T10:00:00Z'));
  assert.equal(data.format, EXPORT_FORMAT);
  assert.equal(data.version, 1);
  assert.deepEqual(Object.keys(data.events), ['333']);
  assert.equal(exportFileName(new Date(2026, 9, 4)), 'cubos-web-tiempos-2026-10-04.json');
});

test('exportar e importar ida y vuelta', () => {
  const original = { 333: [solve('a', 10000, 1), solve('b', 12000, 2, { penalty: '+2' })], minx: [solve('c', 60000, 3)] };
  const text = JSON.stringify(buildExport(original));
  const { events, invalid, unknownEvents } = parseImport(text, EVENTS);
  assert.deepEqual(events, original);
  assert.equal(invalid, 0);
  assert.deepEqual(unknownEvents, []);
});

test('importar: archivos inválidos dan un mensaje claro', () => {
  assert.throws(() => parseImport('no es json', EVENTS), /JSON válido/);
  assert.throws(() => parseImport('{"hola": 1}', EVENTS), /no es una exportación/);
  assert.throws(() => parseImport(JSON.stringify({ format: EXPORT_FORMAT, version: 99, events: {} }), EVENTS), /más nueva/);
  assert.throws(() => parseImport(JSON.stringify({ format: EXPORT_FORMAT, version: 1 }), EVENTS), /no tiene tiempos/);
  assert.throws(
    () => parseImport(JSON.stringify({ format: EXPORT_FORMAT, version: 1, events: { 333: 'x' } }), EVENTS),
    /formato esperado/,
  );
});

test('importar: descarta tiempos rotos y categorías desconocidas', () => {
  const text = JSON.stringify({
    format: EXPORT_FORMAT,
    version: 1,
    events: { 333: [solve('a', 10000, 1), { time: 'rápido' }, { time: -5 }, null], skewb: [solve('z', 5000, 1)] },
  });
  const { events, invalid, unknownEvents } = parseImport(text, EVENTS);
  assert.equal(events['333'].length, 1);
  assert.equal(invalid, 3);
  assert.deepEqual(unknownEvents, ['skewb']);
});

test('combinar: no duplica (mismo id, o mismo tiempo y fecha) y queda en orden', () => {
  const existing = [solve('a', 10000, 100), solve('b', 11000, 300)];
  const incoming = [
    solve('a', 10000, 100), // mismo id
    solve('otro-id', 11000, 300), // mismo tiempo y fecha
    solve('c', 9000, 200), // nuevo, va en el medio
    solve('c', 9000, 200), // repetido dentro del mismo archivo
    solve('d', 8000, null), // nuevo sin fecha: va primero
  ];
  const { merged, added, duplicates } = mergeSolves(existing, incoming);
  assert.equal(added, 2);
  assert.equal(duplicates, 3);
  assert.deepEqual(merged.map((s) => s.id), ['d', 'a', 'c', 'b']);
});

test('combinar dos veces el mismo archivo no agrega nada', () => {
  const incoming = [solve('a', 10000, 1), solve('b', 12000, 2)];
  const first = mergeSolves([], incoming);
  const second = mergeSolves(first.merged, incoming);
  assert.equal(second.added, 0);
  assert.equal(second.duplicates, 2);
});
