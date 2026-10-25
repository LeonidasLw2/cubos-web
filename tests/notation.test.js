import { test } from 'node:test';
import assert from 'node:assert/strict';
import { puzzles } from 'cubing/puzzles';
import {
  PUZZLE_NOTATION_SPECS,
  validateMoveToken,
  parseNotationSequence,
  invertSequence,
  describeMove,
} from '../src/notation-parser.js';

test('catálogo de notación cubre los 8 puzzles y todos sus movimientos son válidos en KPuzzle', async () => {
  const expectedPuzzles = ['2x2', '3x3', '4x4', '5x5', '7x7', 'pyraminx', 'megaminx', 'mirror'];
  assert.deepEqual(Object.keys(PUZZLE_NOTATION_SPECS), expectedPuzzles);

  for (const key of expectedPuzzles) {
    const spec = PUZZLE_NOTATION_SPECS[key];
    const kpId = spec.puzzleId === 'mirror' ? '3x3x3' : spec.puzzleId;
    const kp = await puzzles[kpId].kpuzzle();
    const solved = kp.defaultPattern();

    for (const group of spec.groups) {
      assert.ok(group.moves.length > 0, `grupo vacío ${group.id} en ${key}`);
      for (const m of group.moves) {
        for (const v of m.variants) {
          const token = `${m.base}${v}`;
          const check = validateMoveToken(key, token);
          assert.equal(check.valid, true, `token ${token} debería ser válido en ${key}: ${check.reason}`);
          assert.doesNotThrow(() => {
            solved.applyAlg(check.canonical);
          }, `KPuzzle de ${kpId} falló al aplicar "${check.canonical}"`);
        }
      }
    }

    // Verificar también las secuencias de ejemplo
    for (const sample of spec.sampleSequences) {
      const parsed = parseNotationSequence(key, sample.alg);
      assert.equal(parsed.valid, true, `secuencia de ejemplo inválida en ${key}: ${sample.alg}`);
      const after = solved.applyAlg(parsed.normalizedAlg).applyAlg(parsed.inverseAlg);
      assert.equal(after.isIdentical(solved), true, `la inversa no deshace ${sample.alg} en ${key}`);
    }
  }
});

test('validaciones específicas por puzzle y mensajes de error en español', () => {
  // 2x2
  assert.equal(validateMoveToken('2x2', "R'").valid, true);
  assert.equal(validateMoveToken('2x2', 'x2').valid, true);
  const m2 = validateMoveToken('2x2', 'M');
  assert.equal(m2.valid, false);
  assert.match(m2.reason, /no tiene capa central/i);
  assert.equal(validateMoveToken('2x2', 'Rw').valid, false);

  // 3x3
  assert.equal(validateMoveToken('3x3', 'Uw').valid, true);
  assert.equal(validateMoveToken('3x3', "r'").valid, true);
  assert.equal(validateMoveToken('3x3', 'M2').valid, true);
  assert.equal(validateMoveToken('3x3', '2R').valid, false);

  // Mirror
  assert.equal(validateMoveToken('mirror', 'Uw').valid, true);
  assert.equal(validateMoveToken('mirror', "r'").valid, true);
  assert.equal(validateMoveToken('mirror', 'M2').valid, true);
  assert.equal(validateMoveToken('mirror', '2R').valid, false);
  assert.match(validateMoveToken('mirror', '2R').reason, /requiere un cubo de 4x4 o más/);

  // 4x4
  assert.equal(validateMoveToken('4x4', '2R2').valid, true);
  assert.equal(validateMoveToken('4x4', "Uw'").valid, true);
  assert.equal(validateMoveToken('4x4', 'M').valid, false);
  assert.equal(validateMoveToken('4x4', '3Rw').valid, false);

  // 5x5 y 7x7
  assert.equal(validateMoveToken('5x5', '3Rw').valid, true);
  assert.equal(validateMoveToken('5x5', '3R').valid, true);
  assert.equal(validateMoveToken('5x5', '4R').valid, false);
  assert.equal(validateMoveToken('7x7', '4R').valid, true);
  assert.equal(validateMoveToken('7x7', "3Uw'").valid, true);

  // Pyraminx
  assert.equal(validateMoveToken('pyraminx', "U'").valid, true);
  assert.equal(validateMoveToken('pyraminx', "r'").valid, true);
  const py2 = validateMoveToken('pyraminx', 'U2');
  assert.equal(py2.valid, false);
  assert.match(py2.reason, /120°/);
  assert.equal(validateMoveToken('pyraminx', 'F').valid, false);

  // Megaminx
  assert.equal(validateMoveToken('megaminx', 'R++').valid, true);
  assert.equal(validateMoveToken('megaminx', 'D--').valid, true);
  assert.equal(validateMoveToken('megaminx', "BL2'").valid, true);
  assert.equal(validateMoveToken('megaminx', 'U++').valid, false);
});

test('invertSequence y describeMove funcionan correctamente', () => {
  assert.equal(invertSequence('3x3', "R U R' U2 F"), "F' U2 R U' R'");
  assert.equal(invertSequence('megaminx', "R++ D-- U'"), 'U D++ R--');
  assert.equal(invertSequence('pyraminx', "R' L R L' u"), "u' L R' L' R");

  const descM = describeMove('3x3', 'M');
  assert.match(descM.description, /sigue el sentido de L/);
  const descE = describeMove('3x3', 'E');
  assert.match(descE.description, /sigue el sentido de D/);
  const descS = describeMove('3x3', 'S');
  assert.match(descS.description, /sigue el sentido de F/);
});
