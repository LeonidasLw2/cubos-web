// Pruebas del router (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../src/router.js';

test('timer por defecto', () => {
  assert.equal(parseRoute('').view, 'timer');
  assert.equal(parseRoute('#/').view, 'timer');
  assert.equal(parseRoute('#/timer').view, 'timer');
});

test('páginas de métodos', () => {
  assert.equal(parseRoute('#/metodos').page, 'index');
  assert.equal(parseRoute('#/metodos/').page, 'index');
  assert.equal(parseRoute('#/metodos/principiante').page, 'beginner');
  assert.equal(parseRoute('#/metodos/cfop').page, 'cfop');
  assert.equal(parseRoute('#/metodos/cfop/pll').page, 'pll');
  assert.equal(parseRoute('#/Metodos/CFOP/PLL').page, 'pll');
});

test('partes sin hacer: "Próximamente"', () => {
  assert.deepEqual(parseRoute('#/metodos/roux'), { view: 'methods', path: 'metodos/roux', page: 'soon', title: 'Roux' });
  assert.equal(parseRoute('#/metodos/cfop/oll').page, 'soon');
  assert.equal(parseRoute('#/metodos/cfop/f2l').page, 'soon');
});

test('rutas desconocidas vuelven al timer', () => {
  assert.equal(parseRoute('#/nada').view, 'timer');
  assert.equal(parseRoute('#/nada').notFound, true);
  assert.equal(parseRoute('#/metodos/zz').notFound, true);
});
