// Pruebas del router (correr con: npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../src/router.js';
import { METHOD_PAGES, LEGACY_METHOD_PATHS } from '../src/data/method-pages.js';

test('timer por defecto', () => {
  assert.equal(parseRoute('').view, 'timer');
  assert.equal(parseRoute('#/').view, 'timer');
  assert.equal(parseRoute('#/timer').view, 'timer');
});

test('páginas de métodos ordenadas por puzzle', () => {
  assert.equal(parseRoute('#/metodos').page, 'index');
  assert.equal(parseRoute('#/metodos/').page, 'index');
  assert.deepEqual(
    [parseRoute('#/metodos/2x2').puzzle, parseRoute('#/metodos/3x3').puzzle, parseRoute('#/metodos/4x4').puzzle],
    ['2x2', '3x3', '4x4'],
  );
  assert.equal(parseRoute('#/metodos/3x3/principiante').page, 'beginner');
  assert.equal(parseRoute('#/metodos/3x3/cfop').page, 'cfop');
  assert.equal(parseRoute('#/metodos/3x3/cfop/pll').page, 'pll');
  assert.equal(parseRoute('#/Metodos/3x3/CFOP/PLL').page, 'pll');
  assert.equal(parseRoute('#/metodos/3x3/cfop/oll').page, 'oll');
  assert.equal(parseRoute('#/metodos/3x3/cfop/f2l').page, 'f2l');
  assert.equal(parseRoute('#/metodos/3x3/cfop/cruz').page, 'cross');
  assert.equal(parseRoute('#/metodos/3x3/roux').page, 'roux');
  assert.equal(parseRoute('#/metodos/roux').redirect, '#/metodos/3x3/roux');
  assert.equal(parseRoute('#/metodos/2x2/ortega').page, 'ortega');
  assert.equal(parseRoute('#/metodos/4x4/reduccion').page, 'reduction4');
  assert.equal(parseRoute('#/metodos/4x4/yau').page, 'yau');
  assert.equal(parseRoute('#/metodos/5x5').puzzle, '5x5');
  assert.equal(parseRoute('#/metodos/5x5/reduccion').page, 'reduction5');
  assert.equal(parseRoute('#/metodos/5x5/yau5').page, 'yau5');
  assert.equal(parseRoute('#/metodos/7x7').puzzle, '7x7');
  assert.equal(parseRoute('#/metodos/7x7/reduccion').page, 'reduction7');
  assert.equal(parseRoute('#/metodos/megaminx').puzzle, 'megaminx');
  assert.equal(parseRoute('#/metodos/megaminx/estandar').page, 'megaminxStandard');
  assert.equal(parseRoute('#/metodos/pyraminx').puzzle, 'pyraminx');
  assert.equal(parseRoute('#/metodos/pyraminx/principiante').page, 'pyraminxBeginner');
  assert.equal(parseRoute('#/metodos/pyraminx/avanzados').page, 'pyraminxAdvanced');
  assert.equal(parseRoute('#/metodos/mirror').page, 'mirror');
});

test('migas de pan', () => {
  assert.deepEqual(parseRoute('#/metodos/3x3/cfop/f2l').crumbs, [
    ['Métodos', '#/metodos'],
    ['3x3', '#/metodos/3x3'],
    ['CFOP', '#/metodos/3x3/cfop'],
    ['F2L', '#/metodos/3x3/cfop/f2l'],
  ]);
  assert.deepEqual(parseRoute('#/metodos').crumbs, [['Métodos', '#/metodos']]);
});

test('las rutas viejas redirigen a las nuevas', () => {
  const r = parseRoute('#/metodos/cfop/oll');
  assert.equal(r.redirect, '#/metodos/3x3/cfop/oll');
  assert.equal(r.page, 'oll');
  assert.equal(parseRoute('#/metodos/principiante').redirect, '#/metodos/3x3/principiante');
  assert.equal(parseRoute('#/metodos/cfop').redirect, '#/metodos/3x3/cfop');
  // Todas las rutas viejas apuntan a una página que existe
  for (const [oldPath, newPath] of Object.entries(LEGACY_METHOD_PATHS)) {
    assert.ok(METHOD_PAGES[newPath], `${oldPath} → ${newPath} no existe`);
    assert.equal(parseRoute(`#/metodos/${oldPath}`).notFound, undefined);
  }
});

test('secciones solver, notación y entrenar', () => {
  assert.equal(parseRoute('#/solver').view, 'solver');
  assert.equal(parseRoute('#/solver/3x3').view, 'solver');
  assert.equal(parseRoute('#/solver/3x3').puzzle, '3x3');
  assert.equal(parseRoute('#/notacion').view, 'notation');
  assert.equal(parseRoute('#/notacion/4x4').view, 'notation');
  assert.equal(parseRoute('#/notacion/4x4').puzzle, '4x4');
  assert.equal(parseRoute('#/entrenar').view, 'trainer');
});

test('rutas desconocidas vuelven al timer', () => {
  assert.equal(parseRoute('#/nada').view, 'timer');
  assert.equal(parseRoute('#/nada').notFound, true);
  assert.equal(parseRoute('#/metodos/zz').notFound, true);
});
