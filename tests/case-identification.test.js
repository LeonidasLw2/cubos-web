import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCaseIndex, identifyCase } from '../src/case-identification.js';
import { CASE_FAMILIES } from '../src/case-families.js';
import { sampleFace } from '../src/case-photo.js';

const index = await buildCaseIndex();
const palette = { U: 'white', D: 'yellow', F: 'orange', R: 'green', B: 'red', L: 'blue' };

function observe(family, faces) {
  return Object.fromEntries(Object.entries(faces).map(([face, cells]) => [
    face, {
      center: CASE_FAMILIES[family].size === 2 && face !== 'U' ? '' : palette[face],
      cells: cells.map((color) => palette[color]),
    },
  ]));
}

for (const [family, variants] of Object.entries(index)) {
  test(`escáner · ${family} reconoce cada estado visible del índice con otro esquema de color`, () => {
    const states = new Map(variants.map((variant) => [JSON.stringify(variant.faces), variant]));
    assert.deepEqual(new Set([...states.values()].map((v) => v.entry?.id)),
      new Set([...CASE_FAMILIES[family].entries.map((entry) => entry.id), undefined]));
    for (const variant of states.values()) {
      const match = identifyCase(index, family, observe(family, variant.faces));
      assert.ok(match.result, JSON.stringify(variant.faces));
      assert.equal(match.result.entry?.id, variant.entry?.id);
    }
  });
}

test('PLL no confirma con solo la cara superior orientada', () => {
  const { U } = observe('pll', index.pll[0].faces);
  const result = identifyCase(index, 'pll', { U });
  assert.ok(result.next && result.next !== 'U');
  assert.ok(new Set(result.candidates.map((variant) => variant.entry?.id)).size > 1);
  assert.equal(result.result, undefined);
});

test('PBL no confunde una capa resuelta con un intercambio en la capa opuesta', () => {
  const variant = index.pbl.find((entry) => entry.entry?.id === 'pbl-adj' && entry.flip);
  const views = observe('pbl', variant.faces);
  const topOnly = Object.fromEntries(Object.entries(views).map(([face, view]) =>
    [face, face === 'U' ? view : { ...view, cells: view.cells.slice(0, 2) }]));
  assert.equal(identifyCase(index, 'pbl', topOnly).result, undefined);
  assert.equal(identifyCase(index, 'pbl', views).result.entry.id, 'pbl-adj');
});

test('4×4 diferencia las dos paridades y rechaza alas contradictorias', () => {
  for (const id of ['oll-parity', 'pll-parity']) {
    const variant = index.parity4.find((entry) => entry.entry?.id === id);
    const views = observe('parity4', variant.faces);
    assert.equal(identifyCase(index, 'parity4', { U: views.U }).result, undefined);
    assert.equal(identifyCase(index, 'parity4', views).result.entry.id, id);
    views.F.cells[1] = views.F.cells[2] === 'white' ? 'orange' : 'white';
    assert.equal(identifyCase(index, 'parity4', views).candidates.length, 0);
  }
});

test('muestreo de foto sintética respeta la cuadrícula de cada tamaño', () => {
  const width = 120, height = 120;
  for (const size of [2, 3, 4]) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const even = (Math.floor(y * size / height) * size + Math.floor(x * size / width)) % 2 === 0;
        data.set(even ? [220, 30, 30, 255] : [20, 160, 70, 255], (y * width + x) * 4);
      }
    }
    const image = { width, height, data };
    const corners = [[0, 0], [119, 0], [119, 119], [0, 119]];
    assert.deepEqual(sampleFace(image, corners, size),
      Array.from({ length: size * size }, (_, i) => i % 2 ? 'green' : 'red'));
    assert.equal(sampleFace(image, [...corners].reverse(), size), null);
  }
});

test('PBL resuelve las 576 permutaciones orientadas, incluida la capa inferior sola', async () => {
  const { KPattern } = await import('cubing/kpuzzle');
  const { cube2x2x2 } = await import('cubing/puzzles');
  const { facelets } = await import('../src/case-identification.js');
  const kpuzzle = await cube2x2x2.kpuzzle();
  const solved = kpuzzle.defaultPattern();
  const rotations = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((a) =>
    ['', 'y', 'y2', "y'"].map((b) => solved.applyAlg(`${a} ${b}`)));
  const permutations = (pieces) => pieces.length
    ? pieces.flatMap((piece) => permutations(pieces.filter((other) => other !== piece)).map((rest) => [piece, ...rest]))
    : [[]];
  for (const top of permutations([0, 1, 2, 3])) {
    for (const bottom of permutations([4, 5, 6, 7])) {
      const state = new KPattern(kpuzzle, { CORNERS: { pieces: [...top, ...bottom], orientation: Array(8).fill(0) } });
      const { result } = identifyCase(index, 'pbl', observe('pbl', facelets(state, 2)));
      assert.ok(result, `${top} | ${bottom}`);
      const moves = [result.flip, result.pre, result.entry?.alg, result.post].filter(Boolean).join(' ');
      assert.ok(rotations.some((rotation) => rotation.isIdentical(state.applyAlg(moves))), moves);
    }
  }
});
