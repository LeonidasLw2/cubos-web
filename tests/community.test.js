import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibleBest, publicName } from '../src/community.js';
import { parseImport } from '../src/transfer.js';

test('la vista previa usa el PB del Timer, con penalización y sin DNF ni entradas inválidas', () => {
  const solve = (time, penalty = null) => ({ time, penalty, source: 'timer', scramble: 'R U' });
  assert.equal(eligibleBest([solve(4000, 'DNF'), solve(-1), { time: 600, scramble: 'U' }]), null);
  assert.equal(eligibleBest([solve(10000, '+2'), solve(11500), solve(9000, 'DNF')]), 11500);
  assert.equal(eligibleBest([solve(10000, '+2')]), 12000);
});

test('un respaldo no puede convertir tiempos importados en marcas del Timer', () => {
  const file = JSON.stringify({
    format: 'cubos-web/tiempos', version: 1, events: {
      '333': [{ id: 'importado', time: 10000, scramble: 'R U', source: 'timer' }],
    },
  });
  assert.equal(eligibleBest(parseImport(file, ['333']).events['333']), null);
});

test('el nombre visible admite acentos, normaliza espacios y tiene límite', () => {
  assert.equal(publicName('  Ana   Álvarez '), 'Ana Álvarez');
  assert.equal(publicName(' '), 'Speedcuber');
  assert.equal(Array.from(publicName('🧊'.repeat(33))).length, 32);
});
