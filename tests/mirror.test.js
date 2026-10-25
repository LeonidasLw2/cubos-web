// Pruebas unitarias para el modelo geométrico del Mirror Cube (src/data/mirror.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puzzles } from 'cubing/puzzles';
import { invertSequence } from '../src/notation-parser.js';
import {
  MIRROR_LAYERS,
  MIRROR_CENTER,
  MIRROR_SOLVED_BOUNDS,
  solvedPieces,
  piecesFromPattern,
  faceLevels,
  isPerfectCube,
  layerTurnForMove,
  pieceInTurn,
  faceNet,
  netFaceBounds,
} from '../src/data/mirror.js';

test('el estado resuelto forma un cubo perfecto con caras exteriores planas', () => {
  const pieces = solvedPieces();
  assert.equal(pieces.length, 26, 'Debe haber 26 piezas (8 esquinas + 12 aristas + 6 centros)');

  const levels = faceLevels(pieces);
  for (const [face, faceLevelList] of Object.entries(levels)) {
    assert.equal(
      faceLevelList.length,
      1,
      `La cara ${face} debe ser completamente plana (un solo nivel exterior, pero tiene ${faceLevelList.length})`
    );
  }

  assert.equal(isPerfectCube(pieces), true, 'El estado resuelto debe ser un cubo perfecto');
});

test('las capas tienen grosores distintos en cada eje pero suman 3', () => {
  for (const axis of ['x', 'y', 'z']) {
    const layers = MIRROR_LAYERS[axis];
    assert.equal(layers.length, 3);
    const sum = layers[0] + layers[1] + layers[2];
    assert.ok(Math.abs(sum - 3) < 1e-6, `El eje ${axis} debe sumar 3`);
  }

  // Verificar que los grosores son asimétricos entre sí para que sea un Mirror real
  assert.notEqual(MIRROR_LAYERS.x[0], MIRROR_LAYERS.x[2], 'El eje X debe tener capas asimétricas');
  assert.notEqual(MIRROR_LAYERS.y[0], MIRROR_LAYERS.y[2], 'El eje Y debe tener capas asimétricas');
  assert.notEqual(MIRROR_LAYERS.z[0], MIRROR_LAYERS.z[2], 'El eje Z debe tener capas asimétricas');
  assert.notEqual(MIRROR_LAYERS.x[0], MIRROR_LAYERS.y[0], 'Las caras L y D deben tener grosores distintos');
  assert.notEqual(MIRROR_LAYERS.x[2], MIRROR_LAYERS.z[2], 'Las caras R y F deben tener grosores distintos');
});

test('KPuzzle 3x3: un giro altera la forma y NO forma un cubo plano', async () => {
  const k3 = await puzzles['3x3x3'].kpuzzle();
  const solved = k3.defaultPattern();

  const solvedPiecesFromKPuzzle = piecesFromPattern(solved.patternData);
  assert.equal(isPerfectCube(solvedPiecesFromKPuzzle), true);

  // Un solo giro R debe desalinear las caras exteriores
  const turnedR = solved.applyAlg('R');
  const piecesAfterR = piecesFromPattern(turnedR.patternData);
  assert.equal(isPerfectCube(piecesAfterR), false, 'Después de R no debe ser un cubo plano');

  const levelsAfterR = faceLevels(piecesAfterR);
  assert.ok(
    levelsAfterR.U.length > 1 || levelsAfterR.F.length > 1 || levelsAfterR.B.length > 1,
    'Las caras afectadas por R deben tener múltiples niveles'
  );
});

test('KPuzzle 3x3: aplicar un algoritmo y su inverso vuelve al cubo perfecto', async () => {
  const k3 = await puzzles['3x3x3'].kpuzzle();
  const solved = k3.defaultPattern();

  // Caso 1: R y R'
  const state1 = solved.applyAlg('R').applyAlg("R'");
  assert.equal(isPerfectCube(piecesFromPattern(state1.patternData)), true);

  // Caso 2: Sune y Antisune
  const sune = "R U R' U R U2' R'";
  const antisune = "R U2 R' U' R U' R'";
  const state2 = solved.applyAlg(sune);
  assert.equal(isPerfectCube(piecesFromPattern(state2.patternData)), false);
  const state2Restored = state2.applyAlg(antisune);
  assert.equal(isPerfectCube(piecesFromPattern(state2Restored.patternData)), true);

  // Caso 3: Sexy move repetido 6 veces vuelve al estado original
  let sexy = solved;
  for (let i = 0; i < 6; i++) {
    sexy = sexy.applyAlg("R U R' U'");
  }
  assert.equal(isPerfectCube(piecesFromPattern(sexy.patternData)), true);
});

test('KPuzzle 3x3: mezcla real desordena la forma y desmezclarla la restaura', async () => {
  const k3 = await puzzles['3x3x3'].kpuzzle();
  const solved = k3.defaultPattern();

  const scramble = "D2 B2 F2 L' B2 L D2 R B2 R' D' F2 U B F' D' L' U' R2";
  const unScramble = invertSequence('3x3', scramble);

  const scrambledState = solved.applyAlg(scramble);
  const scrambledPieces = piecesFromPattern(scrambledState.patternData);
  assert.equal(isPerfectCube(scrambledPieces), false, 'La mezcla debe deformar el cubo');

  const restoredState = scrambledState.applyAlg(unScramble);
  const restoredPieces = piecesFromPattern(restoredState.patternData);
  assert.equal(isPerfectCube(restoredPieces), true, 'Deshacer la mezcla debe restaurar el cubo');
});

test('layerTurnForMove traduce correctamente los movimientos WCA de 3x3', () => {
  // Caras simples
  assert.deepEqual(layerTurnForMove('R'), { axis: 'x', layers: [1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove("R'"), { axis: 'x', layers: [1], quarterTurns: 1 });
  assert.deepEqual(layerTurnForMove('R2'), { axis: 'x', layers: [1], quarterTurns: -2 });
  assert.deepEqual(layerTurnForMove("R2'"), { axis: 'x', layers: [1], quarterTurns: 2 });

  assert.deepEqual(layerTurnForMove('U'), { axis: 'y', layers: [1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove('D'), { axis: 'y', layers: [-1], quarterTurns: 1 });
  assert.deepEqual(layerTurnForMove('F'), { axis: 'z', layers: [1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove('B'), { axis: 'z', layers: [-1], quarterTurns: 1 });
  assert.deepEqual(layerTurnForMove('L'), { axis: 'x', layers: [-1], quarterTurns: 1 });

  // Capas medias
  assert.deepEqual(layerTurnForMove('M'), { axis: 'x', layers: [0], quarterTurns: 1 });
  assert.deepEqual(layerTurnForMove('E'), { axis: 'y', layers: [0], quarterTurns: 1 });
  assert.deepEqual(layerTurnForMove('S'), { axis: 'z', layers: [0], quarterTurns: -1 });

  // Rotaciones completas
  assert.deepEqual(layerTurnForMove('x'), { axis: 'x', layers: [-1, 0, 1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove('y'), { axis: 'y', layers: [-1, 0, 1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove('z'), { axis: 'z', layers: [-1, 0, 1], quarterTurns: -1 });

  // Capas dobles (wide)
  assert.deepEqual(layerTurnForMove('Rw'), { axis: 'x', layers: [0, 1], quarterTurns: -1 });
  assert.deepEqual(layerTurnForMove("Lw'"), { axis: 'x', layers: [-1, 0], quarterTurns: -1 });

  // Movimientos inválidos
  assert.equal(layerTurnForMove('invalid'), null);
  assert.equal(layerTurnForMove('3R'), null);
});

test('pieceInTurn determina si una pieza pertenece a la capa en giro', () => {
  const turnR = layerTurnForMove('R');
  const turnU = layerTurnForMove('U');
  const turnM = layerTurnForMove('M');

  assert.equal(pieceInTurn({ coord: [1, 1, 1] }, turnR), true); // esquina UFR está en R
  assert.equal(pieceInTurn({ coord: [-1, 1, 1] }, turnR), false); // esquina UFL no está en R
  assert.equal(pieceInTurn({ coord: [0, 1, 1] }, turnM), true); // arista UF está en capa M
  assert.equal(pieceInTurn({ coord: [1, 1, 1] }, turnM), false); // esquina UFR no está en capa M
  assert.equal(pieceInTurn({ coord: [1, 1, 1] }, turnU), true); // esquina UFR está en U
  assert.equal(pieceInTurn({ coord: [1, -1, 1] }, turnU), false); // esquina DFR no está en U
});

test('faceNet genera la red 2D con las medidas reales y profundidades en 0 cuando está resuelto', () => {
  const pieces = solvedPieces();
  const net = faceNet(pieces);

  for (const face of ['U', 'L', 'F', 'R', 'B', 'D']) {
    const facePieces = net[face];
    assert.equal(facePieces.length, 9, `La cara ${face} debe tener 9 piezas en la vista 2D`);
    for (const p of facePieces) {
      assert.equal(p.depth, 0, `En estado resuelto, la pieza ${p.id} debe tener depth 0 en la cara ${face}`);
      assert.ok(p.u1 > p.u0, 'El ancho de la pieza debe ser positivo');
      assert.ok(p.v1 > p.v0, 'El alto de la pieza debe ser positivo');
    }

    const bounds = netFaceBounds(face);
    assert.ok(bounds.u[1] > bounds.u[0]);
    assert.ok(bounds.v[1] > bounds.v[0]);
  }
});
