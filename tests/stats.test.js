// Pruebas de stats.js (correr con: npm test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageOf, bestTime, formatTime, formatSolve, summarize, DNF } from '../src/stats.js';

// Crea solves a partir de segundos; 'DNF' o '+2:12.00' para penalizaciones.
function solves(...items) {
  return items.map((item, i) => {
    if (item === 'DNF') return { id: String(i), time: 10000, penalty: 'DNF' };
    if (typeof item === 'string' && item.startsWith('+2:')) {
      return { id: String(i), time: Number(item.slice(3)) * 1000, penalty: '+2' };
    }
    return { id: String(i), time: item * 1000, penalty: null };
  });
}

test('formatTime', () => {
  assert.equal(formatTime(0), '0.00');
  assert.equal(formatTime(12340), '12.34');
  assert.equal(formatTime(12349), '12.34'); // trunca, no redondea
  assert.equal(formatTime(65230), '1:05.23');
  assert.equal(formatTime(600000), '10:00.00');
  assert.equal(formatTime(DNF), 'DNF');
  assert.equal(formatTime(null), '-');
});

test('formatSolve muestra penalizaciones', () => {
  const [plain, plus2, dnf] = solves(12.34, '+2:10.00', 'DNF');
  assert.equal(formatSolve(plain), '12.34');
  assert.equal(formatSolve(plus2), '12.00+');
  assert.equal(formatSolve(dnf), 'DNF(10.00)');
});

test('ao5 normal: descarta mejor y peor', () => {
  // 10, 12, 14, 16, 30 → se descartan 10 y 30 → (12+14+16)/3 = 14.00
  assert.equal(averageOf(solves(10, 12, 14, 16, 30), 5), 14000);
});

test('ao5 con redondeo a centésimas', () => {
  // 11.11, 12.22, 13.33 contados → 12.22
  assert.equal(averageOf(solves(9, 11.11, 12.22, 13.33, 20), 5), 12220);
  // 10.00, 10.00, 10.01 → 10.00333 → 10.00
  assert.equal(averageOf(solves(1, 10, 10, 10.01, 50), 5), 10000);
});

test('ao5 con 1 DNF: el DNF cuenta como el peor y se descarta', () => {
  // DNF, 10, 12, 14, 16 → se descartan 10 y DNF → (12+14+16)/3 = 14.00
  assert.equal(averageOf(solves('DNF', 10, 12, 14, 16), 5), 14000);
});

test('ao5 con 2 DNF es DNF', () => {
  assert.equal(averageOf(solves('DNF', 10, 12, 'DNF', 16), 5), DNF);
});

test('ao5 con +2 suma 2 segundos', () => {
  // 10, 12, +2(11)=13, 14, 20 → (12+13+14)/3 = 13.00
  assert.equal(averageOf(solves(10, 12, '+2:11', 14, 20), 5), 13000);
});

test('ao5 usa solo los últimos 5', () => {
  // Los 2 primeros (DNF y 1) no entran en la ventana
  assert.equal(averageOf(solves('DNF', 1, 10, 12, 14, 16, 30), 5), 14000);
});

test('ao5 con menos de 5 tiempos es null', () => {
  assert.equal(averageOf(solves(10, 12, 14, 16), 5), null);
});

test('ao12 normal', () => {
  // 1..12 segundos → se descartan 1 y 12 → promedio de 2..11 = 6.50
  const list = solves(...Array.from({ length: 12 }, (_, i) => i + 1));
  assert.equal(averageOf(list, 12), 6500);
});

test('ao12 con 1 DNF y con 2 DNF', () => {
  const one = solves(5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 'DNF');
  // se descartan 5 y DNF → promedio de 6..15 = 10.50
  assert.equal(averageOf(one, 12), 10500);

  const two = solves(5, 'DNF', 7, 8, 9, 10, 11, 12, 13, 14, 15, 'DNF');
  assert.equal(averageOf(two, 12), DNF);
});

test('mejor tiempo ignora DNF y aplica +2', () => {
  assert.equal(bestTime(solves('DNF', 12, '+2:9', 11.5)), 11000);
  assert.equal(bestTime(solves('DNF', 'DNF')), null);
  assert.equal(bestTime([]), null);
});

test('summarize', () => {
  const s = summarize(solves(10, 12, 14, 16, 30));
  assert.deepEqual(s, { count: 5, best: 10000, ao5: 14000, ao12: null });
});
