import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeLearnedMaps } from '../src/learned-store.js';
import { casePreviewSvg, pyraminxSvg, megaminxSvg } from '../src/case-preview.js';
import { UNIFIED_COUNTS, CFOP_BADGE } from '../src/data/methods-metadata.js';

test('cifras unificadas de métodos (2-look OLL=10, 2-look PLL=6, CFOP 2-look=16)', () => {
  assert.equal(UNIFIED_COUNTS.twoLookOll, 10);
  assert.equal(UNIFIED_COUNTS.twoLookPll, 6);
  assert.equal(UNIFIED_COUNTS.twoLookCfop, 16);
  assert.equal(CFOP_BADGE, 'El más usado');
});

test('mergeLearnedMaps: unión sin duplicados y gana updatedAt más reciente', () => {
  const local = {
    '3x3:oll:sune': { learned: true, updatedAt: 100 },
    '3x3:oll:antisune': { learned: true, updatedAt: 300 },
  };
  const remote = {
    '3x3:oll:sune': { learned: false, updatedAt: 200 },
    '3x3:pll:t': { learned: true, updatedAt: 150 },
  };
  const { merged, changedLocal, changedRemote } = mergeLearnedMaps(local, remote);
  assert.equal(merged['3x3:oll:sune'].learned, false);
  assert.equal(merged['3x3:oll:sune'].updatedAt, 200);
  assert.equal(merged['3x3:oll:antisune'].learned, true);
  assert.equal(merged['3x3:pll:t'].learned, true);
  assert.equal(changedLocal, true);
  assert.equal(changedRemote, true);
});

test('casePreviewSvg genera miniaturas 2D-LL e isométricas válidas sin WebGL', () => {
  const ollSvg = casePreviewSvg("R U R' U R U2' R'", { stickering: 'oll', puzzle: '3x3x3' });
  assert.ok(ollSvg.includes('case-svg-2dll'));
  const f2lSvg = casePreviewSvg("R U R'", { stickering: 'f2l', puzzle: '3x3x3' });
  assert.ok(f2lSvg.includes('case-svg-iso'));
  const c2Svg = casePreviewSvg("R U R' U'", { stickering: '2x2-pbl', puzzle: '2x2x2' });
  assert.ok(c2Svg.includes('<svg'));
  const c4Svg = casePreviewSvg("Uw R U' R' Uw'", { stickering: '4x4-edges', puzzle: '4x4x4' });
  assert.ok(c4Svg.includes('<svg'));
  assert.ok(pyraminxSvg().includes('pyraminx-art'));
  assert.ok(megaminxSvg().includes('megaminx-art'));
});
