import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSolverEngine,
  solvePuzzlePattern,
  solveByInvertingScramble,
} from '../src/solver-engine.js';
import {
  createSolvedStickers,
  createEmptyStickers,
  patternToStickers,
  validateAndBuildPattern,
} from '../src/solver-validator.js';

function randomScramble(moves, len, seedStart = 1) {
  let seed = seedStart;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  const out = [];
  for (let i = 0; i < len; i++) {
    out.push(moves[nextRand() % moves.length]);
  }
  return out.join(' ');
}

test('resuelve 50 estados aleatorios de 2x2 y verifica con KPuzzle', async () => {
  const eng = await getSolverEngine();
  const solved = eng.solvedPatterns['2x2'];
  const moves = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'L', "L'", 'D', "D'", 'B', "B'"];

  for (let i = 0; i < 50; i++) {
    const scr = randomScramble(moves, 16, 1000 + i);
    const state = solved.applyAlg(scr);
    const stickers = await patternToStickers('2x2', state);
    const val = await validateAndBuildPattern('2x2', stickers);
    assert.equal(val.valid, true, `2x2 #${i} inválido: ${val.errors.join('; ')}`);

    const res = await solvePuzzlePattern('2x2', val.pattern);
    const after = val.pattern.applyAlg(res.alg);
    const isSolved = eng.ROTATIONS.some((rot) => after.applyAlg(rot).isIdentical(solved));
    assert.equal(isSolved, true, `2x2 #${i} no quedó resuelto con "${res.alg}"`);
  }
});

test('resuelve 50 estados aleatorios de 3x3 y verifica con KPuzzle', async () => {
  const eng = await getSolverEngine();
  const solved = eng.solvedPatterns['3x3'];
  const moves = [
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'L', "L'", 'L2',
    'R', "R'", 'R2',
    'F', "F'", 'F2',
    'B', "B'", 'B2',
  ];

  for (let i = 0; i < 50; i++) {
    const scr = randomScramble(moves, 22, 2000 + i);
    const state = solved.applyAlg(scr);
    const stickers = await patternToStickers('3x3', state);
    const val = await validateAndBuildPattern('3x3', stickers);
    assert.equal(val.valid, true, `3x3 #${i} inválido: ${val.errors.join('; ')}`);

    const res = await solvePuzzlePattern('3x3', val.pattern);
    const after = val.pattern.applyAlg(res.alg);
    assert.equal(after.isIdentical(solved), true, `3x3 #${i} no quedó resuelto`);
  }
});

test('resuelve 50 estados aleatorios de 4x4 (con paridades OLL/PLL) y verifica con KPuzzle', async () => {
  const eng = await getSolverEngine();
  const solved = eng.solvedPatterns['4x4'];
  const moves = [
    'U', "U'", 'U2', 'D', "D'", 'D2',
    'L', "L'", 'L2', 'R', "R'", 'R2',
    'F', "F'", 'F2', 'B', "B'", 'B2',
    'Uw', "Uw'", 'Uw2', 'Dw', "Dw'",
    'Lw', "Lw'", 'Rw', "Rw'", 'Rw2',
    'Fw', "Fw'", 'Bw', "Bw'",
  ];

  for (let i = 0; i < 50; i++) {
    const scr = randomScramble(moves, 30, 3000 + i);
    const state = solved.applyAlg(scr);
    const stickers = await patternToStickers('4x4', state);
    const val = await validateAndBuildPattern('4x4', stickers);
    assert.equal(val.valid, true, `4x4 #${i} inválido: ${val.errors.join('; ')}`);

    const res = await solvePuzzlePattern('4x4', val.pattern);
    const after = val.pattern.applyAlg(res.alg);
    assert.equal(after.isIdentical(solved), true, `4x4 #${i} no quedó resuelto`);
    assert.equal(res.stages.length, 3);
  }
});

test('resuelve 50 estados aleatorios de 5x5 y verifica con KPuzzle', async () => {
  const eng = await getSolverEngine();
  const solved = eng.solvedPatterns['5x5'];
  const moves = [
    'U', "U'", 'U2', 'D', "D'", 'D2',
    'L', "L'", 'L2', 'R', "R'", 'R2',
    'F', "F'", 'F2', 'B', "B'", 'B2',
    'Uw', "Uw'", 'Uw2', 'Dw', "Dw'", 'Dw2',
    'Lw', "Lw'", 'Lw2', 'Rw', "Rw'", 'Rw2',
    'Fw', "Fw'", 'Fw2', 'Bw', "Bw'", 'Bw2',
  ];

  for (let i = 0; i < 50; i++) {
    const scr = randomScramble(moves, 32, 4000 + i);
    const state = solved.applyAlg(scr);
    const stickers = await patternToStickers('5x5', state);
    const val = await validateAndBuildPattern('5x5', stickers);
    assert.equal(val.valid, true, `5x5 #${i} inválido: ${val.errors.join('; ')}`);

    const res = await solvePuzzlePattern('5x5', val.pattern);
    const after = val.pattern.applyAlg(res.alg);
    assert.equal(after.isIdentical(solved), true, `5x5 #${i} no quedó resuelto`);
    assert.equal(res.stages.length, 3);
  }
});

test('resuelve 50 estados aleatorios de Pyraminx y verifica con KPuzzle', async () => {
  const eng = await getSolverEngine();
  const solved = eng.solvedPatterns.pyraminx;
  const moves = [
    'U', "U'", 'L', "L'", 'R', "R'", 'B', "B'",
    'u', "u'", 'l', "l'", 'r', "r'", 'b', "b'",
  ];

  for (let i = 0; i < 50; i++) {
    const scr = randomScramble(moves, 14, 5000 + i);
    const state = solved.applyAlg(scr);
    const stickers = await patternToStickers('pyraminx', state);
    const val = await validateAndBuildPattern('pyraminx', stickers);
    assert.equal(val.valid, true, `Pyraminx #${i} inválido: ${val.errors.join('; ')}`);
    assert.equal(val.pattern.isIdentical(state), true, `Pyraminx #${i} pattern reconstruido difiere del original`);

    const res = await solvePuzzlePattern('pyraminx', val.pattern);
    const after = val.pattern.applyAlg(res.alg);
    assert.equal(after.isIdentical(solved), true, `Pyraminx #${i} no quedó resuelto con "${res.alg}" (scramble: "${scr}")`);
  }
});

test('detecta y rechaza estados imposibles con mensajes específicos en español', async () => {
  const empty3 = createEmptyStickers('3x3');
  const rEmpty = await validateAndBuildPattern('3x3', empty3);
  assert.equal(rEmpty.valid, false);
  assert.match(rEmpty.errors[0], /stickers por pintar/i);

  const badCount = createSolvedStickers('3x3');
  badCount.R[0] = 'L';
  badCount.R[1] = 'L';
  const rCount = await validateAndBuildPattern('3x3', badCount);
  assert.equal(rCount.valid, false);
  assert.match(rCount.errors[0], /Conteo de colores inválido/i);
  assert.match(rCount.errors[0], /rojos/i);
  assert.match(rCount.errors[0], /naranjas/i);

  const twistedCorner = createSolvedStickers('3x3');
  twistedCorner.U[8] = 'R';
  twistedCorner.R[0] = 'F';
  twistedCorner.F[2] = 'U';
  const rTwist = await validateAndBuildPattern('3x3', twistedCorner);
  assert.equal(rTwist.valid, false);
  assert.match(rTwist.errors[0], /Orientación de esquinas imposible/i);
  assert.ok(rTwist.highlightStickers.length > 0);

  const mirrorCorner = createSolvedStickers('3x3');
  mirrorCorner.R[0] = 'F';
  mirrorCorner.F[2] = 'R';
  const rMirror = await validateAndBuildPattern('3x3', mirrorCorner);
  assert.equal(rMirror.valid, false);
  assert.match(rMirror.errors[0], /colores invertidos/i);

  const flippedEdge = createSolvedStickers('3x3');
  flippedEdge.U[7] = 'F';
  flippedEdge.F[1] = 'U';
  const rFlip = await validateAndBuildPattern('3x3', flippedEdge);
  assert.equal(rFlip.valid, false);
  assert.match(rFlip.errors[0], /Orientación de aristas imposible/i);

  const swappedEdges = createSolvedStickers('3x3');
  swappedEdges.F[1] = 'B';
  swappedEdges.B[1] = 'F';
  const rSwap = await validateAndBuildPattern('3x3', swappedEdges);
  assert.equal(rSwap.valid, false);
  assert.match(rSwap.errors[0], /Paridad de permutación inválida/i);

  const pyrFlip = createSolvedStickers('pyraminx');
  pyrFlip.F[6] = 'D';
  pyrFlip.D[6] = 'F';
  const rPyrFlip = await validateAndBuildPattern('pyraminx', pyrFlip);
  assert.equal(rPyrFlip.valid, false);
  assert.match(rPyrFlip.errors[0], /Orientación de aristas imposible/i);

  const pyrSwap = createSolvedStickers('pyraminx');
  pyrSwap.F[1] = 'R';
  pyrSwap.L[3] = 'F';
  pyrSwap.R[1] = 'F';
  pyrSwap.F[3] = 'L';
  const rPyrSwap = await validateAndBuildPattern('pyraminx', pyrSwap);
  assert.equal(rPyrSwap.valid, false);
  assert.match(rPyrSwap.errors[0], /Paridad de permutación inválida en Pyraminx/i);
});

test('invierte mezclas paso a paso en el modo "Deshacer mezcla"', () => {
  const res = solveByInvertingScramble('4x4', "R U R' Uw2 F'");
  assert.equal(res.valid, true);
  assert.equal(res.alg, "F Uw2 R U' R'");
  assert.equal(res.moveDescriptions.length, 5);

  const bad = solveByInvertingScramble('2x2', 'R U 3Rw');
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.length > 0);
});
