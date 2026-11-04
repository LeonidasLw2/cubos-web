import { KPattern } from 'cubing/kpuzzle';
import { Alg } from 'cubing/alg';
import { cube2x2x2, cube3x3x3 } from 'cubing/puzzles';
import { AUFS } from './case-scramble.js';
import { SLOT_NAMES } from './data/mirror.js';
import { CASE_FAMILIES } from './case-families.js';

// Desde arriba, F queda abajo en la imagen. Los costados se leen de frente.
export const FACE_SLOTS = {
  U: ['UBL', 'UB', 'URB', 'UL', 'U', 'UR', 'ULF', 'UF', 'UFR'],
  F: ['ULF', 'UF', 'UFR'],
  R: ['UFR', 'UR', 'URB'],
  B: ['URB', 'UB', 'UBL'],
  L: ['UBL', 'UL', 'ULF'],
};

const BOTTOM = {
  F: ['DFL', 'DRF'], R: ['DRF', 'DBR'], B: ['DBR', 'DLB'], L: ['DLB', 'DFL'],
};

export function facelets(pattern, size = 3) {
  const sticker = (face, slot) => {
    if (slot === 'U') return 'U';
    const orbit = slot.length === 2 ? 'EDGES' : 'CORNERS';
    const names = SLOT_NAMES[orbit];
    const index = names.indexOf(slot);
    const { pieces, orientation } = pattern.patternData[orbit];
    return names[pieces[index]][(slot.indexOf(face) + orientation[index]) % slot.length];
  };
  return Object.fromEntries(Object.entries(FACE_SLOTS).map(([face, slots]) => {
    if (size === 2) {
      const corners = slots.filter((slot) => slot.length === 3);
      return [face, [...corners, ...(BOTTOM[face] ?? [])].map((slot) => sticker(face, slot))];
    }
    const colors = slots.map((slot) => sticker(face, slot));
    if (size === 3) return [face, colors];
    const [a, b, c, d, e, f, g, h, i] = colors;
    return [face, face === 'U' ? [a,b,b,c,d,e,e,f,d,e,e,f,g,h,h,i] : [a,b,b,c]];
  }));
}

const oriented = (faces) => faces.U.every((color) => color === 'U');
const inverseU = (turn) => AUFS[(4 - AUFS.indexOf(turn)) % 4];
const down = (turn) => turn.replace('U', 'D');
const join = (...moves) => moves.filter(Boolean).join(' ');

export async function buildCaseIndex(onlyFamily) {
  const cases = {};
  for (const [id, family] of Object.entries(CASE_FAMILIES)) {
    if (onlyFamily && id !== onlyFamily) continue;
    const { size, mask, entries } = family;
    const c4 = size === 4 ? await import('../scripts/lib/cube4x4.js') : null;
    const solved = c4?.SOLVED4 ?? (await (size === 2 ? cube2x2x2 : cube3x3x3).kpuzzle()).defaultPattern();
    const kp3 = c4 ? await cube3x3x3.kpuzzle() : null;
    const read = (pattern) => {
      if (!c4) return facelets(pattern, size);
      const reduced = c4.as3x3(pattern);
      if (!reduced) throw new Error('Patrón de 4×4 sin reducir');
      const physical = new KPattern(kp3, {
        ...kp3.defaultPattern().patternData,
        CORNERS: reduced.corners,
        EDGES: { pieces: reduced.pieces, orientation: reduced.orientation },
      }).applyAlg('z2');
      const colors = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'F', B: 'B' };
      const faces = facelets(physical, 4);
      for (const [face, cells] of Object.entries(faces)) {
        faces[face] = cells.map((color, i) =>
          face === 'U' && [5, 6, 9, 10].includes(i) ? 'U' : colors[color]);
      }
      return faces;
    };
    cases[id] = [];
    for (const entry of [...entries, null]) {
      const inverse = new Alg(entry?.alg ?? '').invert();
      for (const flip of id === 'pbl' ? ['', 'x2'] : ['']) {
        for (const final of mask ? [''] : AUFS) {
          for (const bottomFinal of id === 'pbl' ? AUFS : ['']) {
            for (const first of AUFS) {
              for (const bottomFirst of id === 'pbl' ? AUFS : ['']) {
                const start = solved.applyAlg(join(final, down(bottomFinal))).applyAlg(inverse)
                  .applyAlg(join(first, down(bottomFirst), flip));
                const pre = join(inverseU(first), down(inverseU(bottomFirst)));
                const post = mask ? '' : join(inverseU(final), down(inverseU(bottomFinal)));
                const end = start.applyAlg(join(flip, pre, entry?.alg, post));
                const lowerSolved = size !== 3 || ['EDGES', 'CORNERS'].every((orbit) =>
                  end.patternData[orbit].pieces.slice(4).every((piece, i) =>
                    piece === i + 4 && end.patternData[orbit].orientation[i + 4] === 0));
                const verified = c4 ? c4.solved4(end) : !mask ? end.isIdentical(solved)
                  : oriented(read(end)) && (size === 2
                    ? end.patternData.CORNERS.orientation.slice(4).every((value) => value === 0)
                    : lowerSolved);
                if (!verified) throw new Error('Algoritmo sin verificar');
                const faces = read(start);
                if (flip) {
                  const rotatedColors = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'R', L: 'L' };
                  for (const face of Object.keys(faces)) faces[face] = faces[face].map((color) => rotatedColors[color]);
                }
                cases[id].push({ entry, faces, flip, pre, post });
              }
            }
          }
        }
      }
    }

    if (c4) {
      const [ollParity, pllParity] = entries;
      const wings = (pattern, names) => Object.fromEntries(names.flatMap((name) =>
        c4.DEDGES[name].map((slot) => [slot, [
          solved.patternData.EDGES.pieces.indexOf(pattern.patternData.EDGES.pieces[slot]),
          pattern.patternData.EDGES.orientation[slot],
        ]])));
      const upperEdges = ['UF', 'UR', 'UB', 'UL'];
      const preserveF2L = (pattern) => {
        const relative = c4.as3x3(pattern);
        // as3x3 vuelve al marco z2 del verificador. La capa física de abajo queda en los primeros índices.
        return relative && relative.pieces.every((piece, i) => (i >= 4 && i < 8) || (piece === i && relative.orientation[i] === 0)) &&
          relative.corners.pieces.slice(0, 4).every((piece, i) => piece === i && relative.corners.orientation[i] === 0);
      };
      const addParity = (entry, pattern, remaining, orient = '') => {
        for (const first of AUFS) {
          const start = pattern.applyAlg(first);
          const pre = join(inverseU(first), orient);
          const end = start.applyAlg(join(pre, entry.alg));
          const parity = c4.parities(end);
          if (!preserveF2L(end) || parity.oll || parity.pll || (remaining === 'PLL' && !oriented(read(end)))) {
            throw new Error('Paridad sin verificar');
          }
          cases[id].push({ entry, faces: read(start), pre, post: '', remaining });
        }
      };

      for (const [i, face] of upperEdges.entries()) {
        const adjacent = upperEdges[(i + 1) % upperEdges.length];
        const swap = c4.withWings({
          ...wings(solved.applyAlg('U'), [face]),
          ...wings(solved.applyAlg("U'"), [adjacent]),
        });
        addParity(pllParity, swap, 'PLL');
      }

      const flip = (turn) => solved.applyAlg(turn).applyAlg(new Alg(ollParity.alg).invert()).applyAlg(inverseU(turn));
      const flips = AUFS.map((turn) => wings(flip(turn), upperEdges));
      for (const omitted of AUFS.keys()) {
        const flipped = Object.assign({}, ...flips.filter((_, i) => i !== omitted).map((changes) =>
          Object.fromEntries(Object.entries(changes).filter(([slot, [from]]) => Number(slot) !== from))));
        const pattern = c4.withWings(flipped);
        const orient = AUFS.find((turn) => read(pattern.applyAlg(turn)).U[13] !== 'U');
        addParity(ollParity, pattern, 'OLL', orient);
      }
    }
  }
  return cases;
}

function matches(family, candidate, observations) {
  const colors = new Map();
  const bind = (face, color) => {
    if (!color) return true;
    if (colors.has(face)) return colors.get(face) === color;
    if ([...colors.values()].includes(color)) return false;
    colors.set(face, color);
    return true;
  };
  for (const [face, { center }] of Object.entries(observations)) {
    if (!bind(face, center)) return false;
  }
  const seenBySlot = new Map();
  for (const [face, { cells }] of Object.entries(observations)) {
    for (const [i, color] of cells.entries()) {
      if (!color) continue;
      const expected = candidate.faces[face][i];
      if (CASE_FAMILIES[family].mask) {
        if ((expected === 'U') !== (color === colors.get('U'))) return false;
        const slots = CASE_FAMILIES[family].size === 2
          ? [...FACE_SLOTS[face].filter((slot) => slot.length === 3), ...(BOTTOM[face] ?? [])]
          : FACE_SLOTS[face];
        const slot = slots[i];
        const seen = seenBySlot.get(slot) ?? new Set();
        if (seen.has(color)) return false;
        seen.add(color);
        seenBySlot.set(slot, seen);
      } else if (!bind(expected, color)) return false;
    }
  }
  return true;
}

export function identifyCase(index, family, observations) {
  if (!observations.U?.center) return { next: 'U', candidates: [] };
  const candidates = index[family].filter((candidate) => matches(family, candidate, observations));
  if (!candidates.length) return { candidates };
  const distinct = new Map(candidates.map((c) => [JSON.stringify([c.entry?.id, c.flip, c.pre, c.post, c.remaining]), c]));
  // Varias soluciones equivalentes sirven si describen exactamente el mismo estado observable.
  const signature = (c) => JSON.stringify(Object.values(c.faces).flat().map(
    (color) => CASE_FAMILIES[family].mask ? color === 'U' : color));
  const complete = Object.entries(candidates[0].faces).every(([face, cells]) =>
    cells.every((_, i) => observations[face]?.cells[i]));
  const sameCase = candidates.every((c) => c.entry?.id === candidates[0].entry?.id);
  const equivalent = sameCase && (complete || candidates.every((c) => signature(c) === signature(candidates[0])));
  if ((family !== 'parity4' || complete) && (distinct.size === 1 || equivalent)) {
    return { result: candidates[0], candidates };
  }
  const scores = Object.keys(FACE_SLOTS).map((face) => {
    const patterns = new Set(candidates.map((candidate) => candidate.faces[face].map((color, i) =>
      observations[face]?.cells[i] ? '' : CASE_FAMILIES[family].mask ? Number(color === 'U') : color).join('')));
    const missing = candidates[0].faces[face].filter((_, i) => !observations[face]?.cells[i]).length;
    return { face, score: missing ? patterns.size + (CASE_FAMILIES[family].size > 2 && !observations[face]?.center ? 1 : 0) : 0 };
  });
  scores.sort((a, b) => b.score - a.score);
  return { candidates, next: scores[0].score ? scores[0].face : null };
}
