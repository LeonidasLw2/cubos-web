// Pruebas de la mini gráfica de evolución (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recentTimes, sparkline } from '../src/sparkline.js';

const solve = (time, penalty = null) => ({ time, penalty });

test('recentTimes: últimos n, sin DNF y con el +2 sumado', () => {
  const solves = [solve(10000), solve(9000, 'DNF'), solve(11000, '+2'), solve(12000)];
  assert.deepEqual(recentTimes(solves), [10000, 13000, 12000]);
  assert.deepEqual(recentTimes(solves, 2), [13000, 12000]);
  assert.deepEqual(recentTimes([]), []);
});

test('sparkline: el más rápido arriba, el más lento abajo', () => {
  assert.equal(sparkline([1000], 100, 50), null);
  const g = sparkline([2000, 1000, 3000], 100, 50, 0);
  assert.deepEqual(g.points, [[0, 25], [50, 0], [100, 50]]);
  assert.equal(g.best, 1);
  assert.equal(g.line, 'M0 25 L50 0 L100 50');
  assert.ok(g.area.endsWith('Z'));
});

test('sparkline: todos iguales no divide por cero', () => {
  const g = sparkline([1500, 1500], 100, 50, 0);
  assert.deepEqual(g.points, [[0, 0], [100, 0]]);
});
