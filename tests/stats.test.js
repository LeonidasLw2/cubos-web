// Pruebas de stats.js (correr con: npm test)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  averageOf,
  bestAverageOf,
  bestTime,
  worstTime,
  meanTime,
  dnfCount,
  formatTime,
  formatSolve,
  summarize,
  DNF,
} from '../src/stats.js';

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

// Sesión de ejemplo con +2 y DNF. Tiempos efectivos:
//   1: 10   2: +2(11)=13   3: DNF   4: 9   5: 15   6: 12   7: DNF   8: 14
const mixed = solves(10, '+2:11', 'DNF', 9, 15, 12, 'DNF', 14);

test('cantidad de DNF', () => {
  assert.equal(dnfCount(mixed), 2);
  assert.equal(dnfCount(solves(10, 12)), 0);
});

test('peor tiempo ignora DNF y aplica +2', () => {
  assert.equal(worstTime(mixed), 15000);
  assert.equal(worstTime(solves(10, '+2:14.5')), 16500); // el +2 lo vuelve el peor
  assert.equal(worstTime(solves('DNF')), null);
});

test('media general: sin DNF, con +2 sumado', () => {
  // (10 + 13 + 9 + 15 + 12 + 14) / 6 = 73 / 6 = 12.1666… → 12.17
  assert.equal(meanTime(mixed), 12170);
  assert.equal(meanTime(solves('DNF', 'DNF')), null);
  assert.equal(meanTime([]), null);
});

test('mejor ao5 de la sesión recorre todas las ventanas', () => {
  // Ventana 1-5: 10 13 DNF 9 15  → sin 9 y DNF → (10+13+15)/3 = 12.67
  // Ventana 2-6: 13 DNF 9 15 12  → sin 9 y DNF → (12+13+15)/3 = 13.33
  // Ventana 3-7: DNF 9 15 12 DNF → 2 DNF → DNF
  // Ventana 4-8: 9 15 12 DNF 14  → sin 9 y DNF → (12+14+15)/3 = 13.67 (actual)
  assert.equal(averageOf(mixed, 5), 13670);
  assert.equal(bestAverageOf(mixed, 5), 12670);
});

test('mejor ao5: null si faltan tiempos, DNF si todas las ventanas son DNF', () => {
  assert.equal(bestAverageOf(solves(10, 12, 14, 16), 5), null);
  assert.equal(bestAverageOf(solves('DNF', 'DNF', 1, 2, 3), 5), DNF);
});

test('mejor ao12 vs ao12 actual', () => {
  // 1..12 y después 100: la ventana 1-12 da 6.50 y la 2-13 (actual) da 7.50
  const list = solves(...Array.from({ length: 12 }, (_, i) => i + 1), 100);
  assert.equal(averageOf(list, 12), 7500);
  assert.equal(bestAverageOf(list, 12), 6500);
});

test('summarize con +2 y DNF', () => {
  assert.deepEqual(summarize(mixed), {
    count: 8,
    dnfCount: 2,
    best: 9000,
    worst: 15000,
    mean: 12170,
    ao5: 13670,
    ao12: null,
    bestAo5: 12670,
    bestAo12: null,
  });
});

test('summarize sin tiempos', () => {
  assert.deepEqual(summarize([]), {
    count: 0,
    dnfCount: 0,
    best: null,
    worst: null,
    mean: null,
    ao5: null,
    ao12: null,
    bestAo5: null,
    bestAo12: null,
  });
});
