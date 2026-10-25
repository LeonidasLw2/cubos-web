// Mapeo bidireccional entre el editor 2D de stickers y KPattern (cubing/kpuzzle),
// y validador matemático de estados previo a la resolución para 2x2, 3x3, 4x4, 5x5 y Pyraminx.

import { KPattern } from 'cubing/kpuzzle';
import { getSolverEngine } from './solver-engine.js';
import { normalizePuzzleKey } from './notation-parser.js';

export const CUBE_FACES = ['U', 'L', 'F', 'R', 'B', 'D'];
export const PYRAMINX_FACES = ['F', 'L', 'R', 'D'];

export const CUBE_COLORS = [
  { id: 'U', face: 'U', name: 'Blanco', namePlural: 'blancos', hex: '#FFFFFF', border: '#CBD5E1' },
  { id: 'L', face: 'L', name: 'Naranja', namePlural: 'naranjas', hex: '#F97316', border: '#C2410C' },
  { id: 'F', face: 'F', name: 'Verde', namePlural: 'verdes', hex: '#22C55E', border: '#15803D' },
  { id: 'R', face: 'R', name: 'Rojo', namePlural: 'rojos', hex: '#EF4444', border: '#B91C1C' },
  { id: 'B', face: 'B', name: 'Azul', namePlural: 'azules', hex: '#3B82F6', border: '#1D4ED8' },
  { id: 'D', face: 'D', name: 'Amarillo', namePlural: 'amarillos', hex: '#EAB308', border: '#A16207' },
];

export const PYRAMINX_COLORS = [
  { id: 'F', face: 'F', name: 'Verde', namePlural: 'verdes', hex: '#22C55E', border: '#15803D' },
  { id: 'L', face: 'L', name: 'Rojo', namePlural: 'rojos', hex: '#EF4444', border: '#B91C1C' },
  { id: 'R', face: 'R', name: 'Azul', namePlural: 'azules', hex: '#3B82F6', border: '#1D4ED8' },
  { id: 'D', face: 'D', name: 'Amarillo', namePlural: 'amarillos', hex: '#EAB308', border: '#A16207' },
];

const OPPOSITE_CUBE_FACES = {
  U: 'D',
  D: 'U',
  L: 'R',
  R: 'L',
  F: 'B',
  B: 'F',
};

export function getPuzzleDimension(puzzleKey) {
  const key = normalizePuzzleKey(puzzleKey);
  if (key === '2x2') return 2;
  if (key === '3x3') return 3;
  if (key === '4x4') return 4;
  if (key === '5x5') return 5;
  return 3;
}

export function getPuzzlePalette(puzzleKey) {
  const key = normalizePuzzleKey(puzzleKey);
  if (key === 'pyraminx') {
    return PYRAMINX_COLORS.map((c) => ({ ...c, total: 9 }));
  }
  const n = getPuzzleDimension(key);
  const total = n * n;
  return CUBE_COLORS.map((c) => ({ ...c, total }));
}

export function getOrientationGuide(puzzleKey) {
  const key = normalizePuzzleKey(puzzleKey);
  if (key === 'pyraminx') {
    return 'Orientación estándar WCA: Verde al frente (F) · Amarillo abajo (D) · Rojo a la izquierda (L) · Azul a la derecha (R)';
  }
  return 'Orientación estándar WCA: Blanco arriba (U) · Verde al frente (F) · Rojo a la derecha (R)';
}

export function createSolvedStickers(puzzleKey) {
  const key = normalizePuzzleKey(puzzleKey);
  if (key === 'pyraminx') {
    const res = {};
    for (const f of PYRAMINX_FACES) res[f] = new Array(9).fill(f);
    return res;
  }
  const n = getPuzzleDimension(key);
  const res = {};
  for (const f of CUBE_FACES) res[f] = new Array(n * n).fill(f);
  return res;
}

export function createEmptyStickers(puzzleKey) {
  const key = normalizePuzzleKey(puzzleKey);
  if (key === 'pyraminx') {
    const res = {};
    for (const f of PYRAMINX_FACES) res[f] = new Array(9).fill(null);
    return res;
  }
  const n = getPuzzleDimension(key);
  const res = {};
  for (const f of CUBE_FACES) {
    res[f] = new Array(n * n).fill(null);
    // En 3x3 y 5x5 dejamos el centro fijo pintado como guía de orientación
    if (n % 2 === 1) {
      const centerIdx = Math.floor((n * n) / 2);
      res[f][centerIdx] = f;
    }
  }
  return res;
}

export function cloneStickers(stickers) {
  const copy = {};
  for (const [k, arr] of Object.entries(stickers || {})) {
    copy[k] = Array.isArray(arr) ? arr.slice() : [];
  }
  return copy;
}

export function countStickersByColor(puzzleKey, stickers) {
  const palette = getPuzzlePalette(puzzleKey);
  const counts = {};
  for (const c of palette) counts[c.id] = 0;
  let unpainted = 0;

  for (const arr of Object.values(stickers || {})) {
    if (!Array.isArray(arr)) continue;
    for (const val of arr) {
      if (val && counts[val] !== undefined) counts[val]++;
      else unpainted++;
    }
  }

  const summary = palette.map((c) => ({
    ...c,
    used: counts[c.id] || 0,
    remaining: c.total - (counts[c.id] || 0),
  }));

  return { counts, unpainted, summary };
}

// ============================================================================
// Geometría 3D y tablas de correspondencia con KPuzzle
// ============================================================================

function getFaceletXYZ(face, r, c, N) {
  switch (face) {
    case 'U':
      return { x: c, y: N - 1, z: r };
    case 'D':
      return { x: c, y: 0, z: N - 1 - r };
    case 'F':
      return { x: c, y: N - 1 - r, z: N - 1 };
    case 'B':
      return { x: N - 1 - c, y: N - 1 - r, z: 0 };
    case 'L':
      return { x: 0, y: N - 1 - r, z: c };
    case 'R':
      return { x: N - 1, y: N - 1 - r, z: N - 1 - c };
  }
}

function getCornerFaces(x, y, z, N) {
  const isU = y === N - 1;
  const isR = x === N - 1;
  const isF = z === N - 1;
  if (isU && isF && isR) return ['U', 'R', 'F']; // 0: UFR
  if (isU && !isF && isR) return ['U', 'B', 'R']; // 1: URB
  if (isU && !isF && !isR) return ['U', 'L', 'B']; // 2: UBL
  if (isU && isF && !isR) return ['U', 'F', 'L']; // 3: ULF
  if (!isU && isF && isR) return ['D', 'F', 'R']; // 4: DRF
  if (!isU && isF && !isR) return ['D', 'L', 'F']; // 5: DFL
  if (!isU && !isF && !isR) return ['D', 'B', 'L']; // 6: DLB
  return ['D', 'R', 'B']; // 7: DBR
}

const PYRAMINX_TOPOLOGY = {
  // CORNERS (centros axiales, 4 piezas) y CORNERS2 (puntas, 4 piezas):
  // 0 = U (F, L, R), 1 = B (L, D, R), 2 = R (F, R, D), 3 = L (F, D, L)
  CORNERS: [
    { name: 'U', faces: ['F', 'L', 'R'], stickers: ['F:2', 'L:2', 'R:2'] },
    { name: 'B', faces: ['L', 'D', 'R'], stickers: ['L:5', 'D:2', 'R:7'] },
    { name: 'R', faces: ['F', 'R', 'D'], stickers: ['F:7', 'R:5', 'D:7'] },
    { name: 'L', faces: ['F', 'D', 'L'], stickers: ['F:5', 'D:5', 'L:7'] },
  ],
  CORNERS2: [
    { name: 'U', faces: ['F', 'L', 'R'], stickers: ['F:0', 'L:0', 'R:0'] },
    { name: 'B', faces: ['L', 'D', 'R'], stickers: ['L:4', 'D:0', 'R:8'] },
    { name: 'R', faces: ['F', 'R', 'D'], stickers: ['F:8', 'R:4', 'D:8'] },
    { name: 'L', faces: ['F', 'D', 'L'], stickers: ['F:4', 'D:4', 'L:8'] },
  ],
  // EDGES (6 aristas): orden exacto (ori=0, ori=1) verificado con KPuzzle
  EDGES: [
    { name: 'FL', faces: ['F', 'L'], stickers: ['F:1', 'L:3'] }, // 0
    { name: 'LR', faces: ['L', 'R'], stickers: ['L:1', 'R:3'] }, // 1 (arista trasera superior U-B)
    { name: 'FD', faces: ['F', 'D'], stickers: ['F:6', 'D:6'] }, // 2
    { name: 'RD', faces: ['D', 'R'], stickers: ['D:3', 'R:6'] }, // 3
    { name: 'LD', faces: ['L', 'D'], stickers: ['L:6', 'D:1'] }, // 4
    { name: 'FR', faces: ['R', 'F'], stickers: ['R:1', 'F:3'] }, // 5
  ],
};

let mappingCachePromise = null;

function makeDistinctPattern(kp) {
  const def = kp.defaultPattern();
  const patternData = {};
  for (const o of kp.definition.orbits) {
    patternData[o.orbitName] = {
      pieces: Array.from({ length: o.numPieces }, (_, i) => i),
      orientation: new Array(o.numPieces).fill(0),
      orientationMod: def.patternData[o.orbitName].orientationMod,
    };
  }
  return new KPattern(kp, patternData);
}

export async function getStickerMappings() {
  if (mappingCachePromise) return mappingCachePromise;

  mappingCachePromise = (async () => {
    const engine = await getSolverEngine();
    const maps = {};

    for (const [key, N] of [
      ['2x2', 2],
      ['3x3', 3],
      ['4x4', 4],
      ['5x5', 5],
    ]) {
      const kp = engine.kpuzzles[key];
      const base = makeDistinctPattern(kp);
      const moves =
        N === 2
          ? ['U', 'D', 'L', 'R', 'F', 'B']
          : ['U', '2U', 'D', '2D', 'L', '2L', 'R', '2R', 'F', '2F', 'B', '2B'];

      const movedBy = {};
      for (const m of moves) {
        const next = base.applyMove(m);
        movedBy[m] = {};
        for (const o of kp.definition.orbits) {
          const pd = next.patternData[o.orbitName];
          const set = new Set();
          for (let i = 0; i < o.numPieces; i++) {
            if (pd.pieces[i] !== i || pd.orientation[i] !== 0) set.add(i);
          }
          movedBy[m][o.orbitName] = set;
        }
      }

      const coordToSlot = new Map();
      for (const o of kp.definition.orbits) {
        if (o.orbitName === 'CENTERS' && N === 3) {
          coordToSlot.set('1,2,1', { orbit: 'CENTERS', slot: 0 });
          coordToSlot.set('0,1,1', { orbit: 'CENTERS', slot: 1 });
          coordToSlot.set('1,1,2', { orbit: 'CENTERS', slot: 2 });
          coordToSlot.set('2,1,1', { orbit: 'CENTERS', slot: 3 });
          coordToSlot.set('1,1,0', { orbit: 'CENTERS', slot: 4 });
          coordToSlot.set('1,0,1', { orbit: 'CENTERS', slot: 5 });
          continue;
        }
        if (o.orbitName === 'CENTERS3' && N === 5) {
          coordToSlot.set('2,4,2', { orbit: 'CENTERS3', slot: 0 });
          coordToSlot.set('0,2,2', { orbit: 'CENTERS3', slot: 1 });
          coordToSlot.set('2,2,4', { orbit: 'CENTERS3', slot: 2 });
          coordToSlot.set('4,2,2', { orbit: 'CENTERS3', slot: 3 });
          coordToSlot.set('2,2,0', { orbit: 'CENTERS3', slot: 4 });
          coordToSlot.set('2,0,2', { orbit: 'CENTERS3', slot: 5 });
          continue;
        }
        for (let s = 0; s < o.numPieces; s++) {
          let x = Math.floor(N / 2);
          if (movedBy['L'][o.orbitName].has(s)) x = 0;
          else if (N >= 4 && movedBy['2L'][o.orbitName].has(s)) x = 1;
          else if (N >= 4 && movedBy['2R'][o.orbitName].has(s)) x = N - 2;
          else if (movedBy['R'][o.orbitName].has(s)) x = N - 1;

          let y = Math.floor(N / 2);
          if (movedBy['D'][o.orbitName].has(s)) y = 0;
          else if (N >= 4 && movedBy['2D'][o.orbitName].has(s)) y = 1;
          else if (N >= 4 && movedBy['2U'][o.orbitName].has(s)) y = N - 2;
          else if (movedBy['U'][o.orbitName].has(s)) y = N - 1;

          let z = Math.floor(N / 2);
          if (movedBy['B'][o.orbitName].has(s)) z = 0;
          else if (N >= 4 && movedBy['2B'][o.orbitName].has(s)) z = 1;
          else if (N >= 4 && movedBy['2F'][o.orbitName].has(s)) z = N - 2;
          else if (movedBy['F'][o.orbitName].has(s)) z = N - 1;

          coordToSlot.set(`${x},${y},${z}`, { orbit: o.orbitName, slot: s });
        }
      }

      const orbits = {};
      for (const o of kp.definition.orbits) {
        orbits[o.orbitName] = Array.from({ length: o.numPieces }, (_, slot) => ({
          slot,
          faces: [],
          stickers: [],
          name: '',
        }));
      }

      for (const f of CUBE_FACES) {
        for (let r = 0; r < N; r++) {
          for (let c = 0; c < N; c++) {
            const { x, y, z } = getFaceletXYZ(f, r, c, N);
            const info = coordToSlot.get(`${x},${y},${z}`);
            const entry = orbits[info.orbit][info.slot];
            const stickerKey = `${f}:${r * N + c}`;

            if (info.orbit === 'CORNERS') {
              const cf = getCornerFaces(x, y, z, N);
              const ori = cf.indexOf(f);
              entry.faces[ori] = f;
              entry.stickers[ori] = stickerKey;
              entry.name = cf.join('');
            } else if (info.orbit.startsWith('EDGES')) {
              const outer = [];
              if (y === N - 1) outer.push('U');
              if (y === 0) outer.push('D');
              if (z === N - 1) outer.push('F');
              if (z === 0) outer.push('B');
              if (x === 0) outer.push('L');
              if (x === N - 1) outer.push('R');
              const ori = outer.indexOf(f);
              entry.faces[ori] = f;
              entry.stickers[ori] = stickerKey;
              entry.name = outer.join('');
            } else {
              entry.faces[0] = f;
              entry.stickers[0] = stickerKey;
              entry.name = f;
            }
          }
        }
      }

      // En 4x4 y 5x5, cada wing (EDGES) pertenece a una de dos familias quirales (paridad de slot)
      // Verificamos a cuál de las dos posiciones de cada dedge corresponde cada slot
      if (N >= 4) {
        const wingFamilies = [
          new Set([0]),
          new Set([1]),
        ];
        // Clausura transitiva bajo los movimientos del cubo para separar si hubiera órbitas
        // (En realidad las 24 wings forman una sola órbita de 24 posiciones; cada par de colores (A,B)
        // aparece exactamente en 2 slots: uno con (ori0=A, ori1=B) y otro con la quiralidad opuesta).
        // Para distinguir las 2 wings de una misma arista (ej. UF izquierda vs UF derecha),
        // verificamos qué par ordenado de stickers3D o qué movimiento lleva el slot solved a este slot.
        // Es más simple aún: en una arista (ej. UF), el slot 8 está en x=1 (cerca de L) y el slot 2 está en x=2/3 (cerca de R).
        // Bajo cualquier movimiento válido del cubo, una wing en un slot `dst` con orientación `ori`
        // tiene una quiralidad 3D fija dada por el producto mixto de sus dos normales y el vector hacia el centro de la arista!
        for (let s = 0; s < 24; s++) {
          const entry = orbits.EDGES[s];
          const [f0, idx0] = entry.stickers[0].split(':');
          const r0 = Math.floor(Number(idx0) / N);
          const c0 = Number(idx0) % N;
          const { x, y, z } = getFaceletXYZ(f0, r0, c0, N);
          // Vector desde el centro del cubo ( (N-1)/2 )
          const cx = x - (N - 1) / 2;
          const cy = y - (N - 1) / 2;
          const cz = z - (N - 1) / 2;
          const NORM = {
            U: [0, 1, 0],
            D: [0, -1, 0],
            R: [1, 0, 0],
            L: [-1, 0, 0],
            F: [0, 0, 1],
            B: [0, 0, -1],
          };
          const n0 = NORM[entry.faces[0]];
          const n1 = NORM[entry.faces[1]];
          // Producto vectorial n0 x n1
          const cross = [
            n0[1] * n1[2] - n0[2] * n1[1],
            n0[2] * n1[0] - n0[0] * n1[2],
            n0[0] * n1[1] - n0[1] * n1[0],
          ];
          const dot = cross[0] * cx + cross[1] * cy + cross[2] * cz;
          entry.chirality = dot > 0 ? 1 : -1;
        }
      }

      maps[key] = { N, kp, solved: engine.solvedPatterns[key], orbits };
    }

    maps.pyraminx = {
      N: 3,
      kp: engine.kpuzzles.pyraminx,
      solved: engine.solvedPatterns.pyraminx,
      orbits: PYRAMINX_TOPOLOGY,
    };

    return maps;
  })();

  return mappingCachePromise;
}

/**
 * Convierte cualquier KPattern válido de 2x2, 3x3, 4x4, 5x5 o Pyraminx a mapa de stickers 2D.
 */
export async function patternToStickers(puzzleKey, pattern) {
  const key = normalizePuzzleKey(puzzleKey);
  const maps = await getStickerMappings();
  const map = maps[key];
  if (!map) throw new Error(`Puzzle no soportado: ${key}`);

  const stickers = createSolvedStickers(key);

  for (const [orbitName, slots] of Object.entries(map.orbits)) {
    const pd = pattern.patternData[orbitName];
    const solvedPd = map.solved.patternData[orbitName];
    if (!pd) continue;

    for (let dstSlot = 0; dstSlot < slots.length; dstSlot++) {
      const dstInfo = slots[dstSlot];
      const rawPiece = pd.pieces[dstSlot];
      const oriDelta = pd.orientation[dstSlot] || 0;

      // En 4x4 y 5x5, solvedPd.pieces en CENTERS/CENTERS2 es [0,0,0,0, 4,4,4,4, ...],
      // por lo que `rawPiece` es un índice de slot representativo cuya cara es `slots[rawPiece].faces[0]`.
      const srcInfo = slots[rawPiece] || slots[solvedPd.pieces.indexOf(rawPiece)];
      const numOri = dstInfo.stickers.length;

      for (let k = 0; k < numOri; k++) {
        const dstStickerKey = dstInfo.stickers[(k + oriDelta) % numOri];
        const color = srcInfo.faces[k];
        const [face, idxStr] = dstStickerKey.split(':');
        stickers[face][Number(idxStr)] = color;
      }
    }
  }

  return stickers;
}

function permParity(arr) {
  const visited = new Uint8Array(arr.length);
  let swaps = 0;
  for (let i = 0; i < arr.length; i++) {
    if (visited[i]) continue;
    let len = 0;
    let cur = i;
    while (!visited[cur]) {
      visited[cur] = 1;
      cur = arr[cur];
      len++;
    }
    if (len > 1) swaps += len - 1;
  }
  return swaps % 2;
}

function readSticker(stickers, stickerKey) {
  const [f, idx] = stickerKey.split(':');
  return stickers?.[f]?.[Number(idx)] || null;
}

/**
 * Valida exhaustivamente un mapa de stickers 2D y construye su KPattern si es válido.
 * Devuelve `{ valid, pattern, patternData, errors, highlightStickers }`.
 */
export async function validateAndBuildPattern(puzzleKey, stickers) {
  const key = normalizePuzzleKey(puzzleKey);
  const maps = await getStickerMappings();
  const map = maps[key];
  if (!map) {
    return {
      valid: false,
      pattern: null,
      errors: [`El puzzle "${key}" no está soportado en el Solver.`],
      highlightStickers: [],
    };
  }

  const errors = [];
  const highlightSet = new Set();
  const addHighlight = (keys) => {
    for (const k of keys) if (k) highlightSet.add(k);
  };

  // 1. Verificar que no haya casillas sin pintar y que el conteo por color sea exacto
  const { unpainted, summary } = countStickersByColor(key, stickers);
  if (unpainted > 0) {
    for (const [f, arr] of Object.entries(stickers || {})) {
      arr.forEach((val, idx) => {
        if (!val) highlightSet.add(`${f}:${idx}`);
      });
    }
    return {
      valid: false,
      pattern: null,
      errors: [
        unpainted === 1
          ? 'Falta 1 sticker por pintar. Completá todas las caras antes de resolver.'
          : `Faltan ${unpainted} stickers por pintar. Completá todas las caras antes de resolver.`,
      ],
      highlightStickers: [...highlightSet],
    };
  }

  const missingParts = [];
  const extraParts = [];
  for (const item of summary) {
    if (item.remaining > 0) {
      missingParts.push(
        `${item.remaining === 1 ? 'falta 1 sticker' : `faltan ${item.remaining} stickers`} ${item.namePlural}`
      );
    } else if (item.remaining < 0) {
      const extra = -item.remaining;
      extraParts.push(
        `${extra === 1 ? 'sobra 1 sticker' : `sobran ${extra} stickers`} ${item.namePlural}`
      );
    }
  }
  if (missingParts.length > 0 || extraParts.length > 0) {
    const details = [...missingParts, ...extraParts].join(' y ');
    return {
      valid: false,
      pattern: null,
      errors: [`Conteo de colores inválido: ${details}.`],
      highlightStickers: [],
    };
  }

  // 2. Caso Pyraminx
  if (key === 'pyraminx') {
    const patternData = {
      CORNERS: { pieces: [0, 1, 2, 3], orientation: [0, 0, 0, 0] },
      CORNERS2: { pieces: [0, 1, 2, 3], orientation: [0, 0, 0, 0] },
      EDGES: { pieces: new Array(6).fill(-1), orientation: new Array(6).fill(0) },
    };

    // Validar los 4 centros axiales (CORNERS) y las 4 puntas (CORNERS2)
    for (const [orbitName, label] of [
      ['CORNERS', 'El centro axial del vértice'],
      ['CORNERS2', 'La punta del vértice'],
    ]) {
      const slots = map.orbits[orbitName];
      for (let s = 0; s < 4; s++) {
        const info = slots[s];
        const actual = info.stickers.map((sk) => readSticker(stickers, sk));
        // Buscar qué rotación cíclica de `info.faces` coincide con `actual`
        let matchedOri = -1;
        for (let ori = 0; ori < 3; ori++) {
          if (
            actual[ori] === info.faces[0] &&
            actual[(ori + 1) % 3] === info.faces[1] &&
            actual[(ori + 2) % 3] === info.faces[2]
          ) {
            matchedOri = ori;
            break;
          }
        }
        if (matchedOri === -1) {
          addHighlight(info.stickers);
          const sameSet =
            new Set(actual).size === 3 && info.faces.every((f) => actual.includes(f));
          if (sameSet) {
            errors.push(`${label} ${info.name} tiene los colores invertidos (orden imposible).`);
          } else {
            errors.push(`${label} ${info.name} tiene una combinación de colores imposible.`);
          }
        } else {
          patternData[orbitName].orientation[s] = matchedOri;
        }
      }
    }

    // Validar las 6 aristas (EDGES)
    const edgeSlots = map.orbits.EDGES;
    const edgeUsed = new Array(6).fill(false);
    for (let s = 0; s < 6; s++) {
      const dstInfo = edgeSlots[s];
      const c0 = readSticker(stickers, dstInfo.stickers[0]);
      const c1 = readSticker(stickers, dstInfo.stickers[1]);

      if (c0 === c1) {
        addHighlight(dstInfo.stickers);
        errors.push(`La arista ${dstInfo.name} tiene el mismo color repetido en ambos lados.`);
        continue;
      }

      let foundPiece = -1;
      let foundOri = 0;
      for (let p = 0; p < 6; p++) {
        const pf = edgeSlots[p].faces;
        if (c0 === pf[0] && c1 === pf[1]) {
          foundPiece = p;
          foundOri = 0;
          break;
        }
        if (c1 === pf[0] && c0 === pf[1]) {
          foundPiece = p;
          foundOri = 1;
          break;
        }
      }

      if (foundPiece === -1) {
        addHighlight(dstInfo.stickers);
        errors.push(`La arista en posición ${dstInfo.name} tiene colores inválidos.`);
      } else if (edgeUsed[foundPiece]) {
        addHighlight(dstInfo.stickers);
        errors.push(`La arista ${edgeSlots[foundPiece].name} está duplicada.`);
      } else {
        edgeUsed[foundPiece] = true;
        patternData.EDGES.pieces[s] = foundPiece;
        patternData.EDGES.orientation[s] = foundOri;
      }
    }

    if (errors.length > 0) {
      return { valid: false, pattern: null, errors, highlightStickers: [...highlightSet] };
    }

    // Paridad de orientación de aristas (suma mod 2 === 0)
    const eoSum = patternData.EDGES.orientation.reduce((a, b) => a + b, 0);
    if (eoSum % 2 !== 0) {
      const flippedSlot = patternData.EDGES.orientation.findIndex((o) => o === 1);
      addHighlight(edgeSlots[flippedSlot >= 0 ? flippedSlot : 0].stickers);
      return {
        valid: false,
        pattern: null,
        errors: ['Orientación de aristas imposible: hay una arista volteada individualmente.'],
        highlightStickers: [...highlightSet],
      };
    }

    // Paridad de permutación de aristas en Pyraminx (siempre par: parity === 0)
    if (permParity(patternData.EDGES.pieces) !== 0) {
      addHighlight([...edgeSlots[0].stickers, ...edgeSlots[1].stickers]);
      return {
        valid: false,
        pattern: null,
        errors: [
          'Paridad de permutación inválida en Pyraminx: hay dos aristas intercambiadas entre sí.',
        ],
        highlightStickers: [...highlightSet],
      };
    }

    const pattern = new KPattern(map.kp, patternData);
    return { valid: true, pattern, patternData, errors: [], highlightStickers: [] };
  }

  // 3. Caso Cubos (2x2, 3x3, 4x4, 5x5)
  const N = map.N;
  const solvedData = map.solved.patternData;
  const patternData = {};
  for (const o of map.kp.definition.orbits) {
    patternData[o.orbitName] = {
      pieces: solvedData[o.orbitName].pieces.slice(),
      orientation: new Array(o.numPieces).fill(0),
    };
    if (solvedData[o.orbitName].orientationMod) {
      patternData[o.orbitName].orientationMod = solvedData[o.orbitName].orientationMod.slice();
    }
  }

  // 3a. Validar centros fijos en 3x3 y 5x5
  if (N === 3 || N === 5) {
    const centerOrbit = N === 3 ? 'CENTERS' : 'CENTERS3';
    const slots = map.orbits[centerOrbit];
    for (let s = 0; s < 6; s++) {
      const c = readSticker(stickers, slots[s].stickers[0]);
      if (c !== slots[s].faces[0]) {
        addHighlight(slots[s].stickers);
        errors.push(
          `El centro fijo de la cara ${slots[s].faces[0]} debe mantenerse en su color estándar (${CUBE_COLORS.find((x) => x.id === slots[s].faces[0])?.name}).`
        );
      }
    }
    if (errors.length > 0) {
      return { valid: false, pattern: null, errors, highlightStickers: [...highlightSet] };
    }
  }

  // 3b. Validar y construir CENTERS / CENTERS2 móviles en 4x4 y 5x5
  if (N >= 4) {
    const centerOrbits = N === 4 ? ['CENTERS'] : ['CENTERS', 'CENTERS2'];
    for (const orbitName of centerOrbits) {
      const slots = map.orbits[orbitName];
      const faceToCenterVal = {};
      for (let s = 0; s < 24; s++) {
        const f = slots[s].faces[0];
        if (faceToCenterVal[f] === undefined) {
          faceToCenterVal[f] = solvedData[orbitName].pieces[s];
        }
      }
      const countsByFace = { U: 0, L: 0, F: 0, R: 0, B: 0, D: 0 };
      for (let s = 0; s < 24; s++) {
        const c = readSticker(stickers, slots[s].stickers[0]);
        countsByFace[c] = (countsByFace[c] || 0) + 1;
        patternData[orbitName].pieces[s] = faceToCenterVal[c];
        patternData[orbitName].orientation[s] = 0;
      }
      // Cada órbita de centros debe tener exactamente 4 stickers de cada color
      for (const f of CUBE_FACES) {
        if (countsByFace[f] !== 4) {
          const kind =
            N === 4 ? 'centros' : orbitName === 'CENTERS' ? 'centros-T (cruz)' : 'centros-X (esquinas de centro)';
          const colName = CUBE_COLORS.find((x) => x.id === f)?.namePlural || f;
          errors.push(
            `Distribución de ${kind} inválida: hay ${countsByFace[f]} stickers ${colName} en esa órbita y debe haber exactamente 4.`
          );
        }
      }
    }
  }

  // 3c. Validar las 8 esquinas (CORNERS)
  const cornerSlots = map.orbits.CORNERS;
  const cornerUsed = new Array(8).fill(false);
  for (let s = 0; s < 8; s++) {
    const dstInfo = cornerSlots[s];
    const actual = dstInfo.stickers.map((sk) => readSticker(stickers, sk));

    // Verificar colores repetidos u opuestos en la misma esquina
    if (new Set(actual).size < 3) {
      addHighlight(dstInfo.stickers);
      errors.push(`La esquina ${dstInfo.name} tiene colores repetidos en la misma pieza.`);
      continue;
    }
    if (
      OPPOSITE_CUBE_FACES[actual[0]] === actual[1] ||
      OPPOSITE_CUBE_FACES[actual[0]] === actual[2] ||
      OPPOSITE_CUBE_FACES[actual[1]] === actual[2]
    ) {
      addHighlight(dstInfo.stickers);
      errors.push(
        `La esquina ${dstInfo.name} combina dos colores de caras opuestas (combinación imposible).`
      );
      continue;
    }

    // Buscar qué pieza de esquina (0..7) y qué orientación (0..2) coincide
    let foundPiece = -1;
    let foundOri = -1;
    let sameSetPiece = -1;
    for (let p = 0; p < 8; p++) {
      const pf = cornerSlots[p].faces;
      if (pf.every((f) => actual.includes(f))) {
        sameSetPiece = p;
        for (let ori = 0; ori < 3; ori++) {
          if (
            actual[ori] === pf[0] &&
            actual[(ori + 1) % 3] === pf[1] &&
            actual[(ori + 2) % 3] === pf[2]
          ) {
            foundPiece = p;
            foundOri = ori;
            break;
          }
        }
      }
    }

    if (foundPiece === -1) {
      addHighlight(dstInfo.stickers);
      if (sameSetPiece !== -1) {
        errors.push(
          `La esquina ${dstInfo.name} tiene los colores invertidos (orden imposible en un cubo real).`
        );
      } else {
        errors.push(`La esquina ${dstInfo.name} tiene una combinación de colores imposible.`);
      }
    } else if (cornerUsed[foundPiece]) {
      addHighlight(dstInfo.stickers);
      errors.push(`La esquina ${cornerSlots[foundPiece].name} está duplicada.`);
    } else {
      cornerUsed[foundPiece] = true;
      patternData.CORNERS.pieces[s] = foundPiece;
      patternData.CORNERS.orientation[s] = foundOri;
    }
  }

  // 3d. Validar aristas centrales (EDGES en 3x3, EDGES2 midges en 5x5)
  if (N === 3 || N === 5) {
    const edgeOrbit = N === 3 ? 'EDGES' : 'EDGES2';
    const edgeSlots = map.orbits[edgeOrbit];
    const edgeUsed = new Array(12).fill(false);
    const label = N === 3 ? 'La arista' : 'La arista central (midge)';

    for (let s = 0; s < 12; s++) {
      const dstInfo = edgeSlots[s];
      const c0 = readSticker(stickers, dstInfo.stickers[0]);
      const c1 = readSticker(stickers, dstInfo.stickers[1]);

      if (c0 === c1 || OPPOSITE_CUBE_FACES[c0] === c1) {
        addHighlight(dstInfo.stickers);
        errors.push(
          `${label} ${dstInfo.name} tiene una combinación de colores imposible (${c0 === c1 ? 'mismo color repetido' : 'colores opuestos'}).`
        );
        continue;
      }

      let foundPiece = -1;
      let foundOri = 0;
      for (let p = 0; p < 12; p++) {
        const pf = edgeSlots[p].faces;
        if (c0 === pf[0] && c1 === pf[1]) {
          foundPiece = p;
          foundOri = 0;
          break;
        }
        if (c1 === pf[0] && c0 === pf[1]) {
          foundPiece = p;
          foundOri = 1;
          break;
        }
      }

      if (foundPiece === -1) {
        addHighlight(dstInfo.stickers);
        errors.push(`${label} ${dstInfo.name} tiene colores inválidos.`);
      } else if (edgeUsed[foundPiece]) {
        addHighlight(dstInfo.stickers);
        errors.push(`${label} ${edgeSlots[foundPiece].name} está duplicada.`);
      } else {
        edgeUsed[foundPiece] = true;
        patternData[edgeOrbit].pieces[s] = foundPiece;
        patternData[edgeOrbit].orientation[s] = foundOri;
      }
    }
  }

  // 3e. Validar las 24 alas (wings: EDGES en 4x4 y 5x5)
  if (N >= 4) {
    const wingSlots = map.orbits.EDGES;
    const wingUsed = new Array(24).fill(false);

    for (let s = 0; s < 24; s++) {
      const dstInfo = wingSlots[s];
      const c0 = readSticker(stickers, dstInfo.stickers[0]);
      const c1 = readSticker(stickers, dstInfo.stickers[1]);

      if (c0 === c1 || OPPOSITE_CUBE_FACES[c0] === c1) {
        addHighlight(dstInfo.stickers);
        errors.push(
          `Un ala (wing) de la arista ${dstInfo.name} combina colores imposibles (${c0 === c1 ? 'mismo color' : 'colores opuestos'}).`
        );
        continue;
      }

      // En 4x4/5x5, cuando una pieza wing `p` va al slot `s` con orientación `ori`:
      // - si ori === 0, la quiralidad de `p` es igual a la de `s` (`p.chirality === dstInfo.chirality`)
      // - si ori === 1, los dos stickers se intercambian, por lo que `p.chirality === -dstInfo.chirality`!
      let foundPiece = -1;
      let foundOri = 0;
      for (let p = 0; p < 24; p++) {
        const pf = wingSlots[p].faces;
        const pChir = wingSlots[p].chirality;
        if (c0 === pf[0] && c1 === pf[1] && pChir === dstInfo.chirality) {
          foundPiece = p;
          foundOri = 0;
          break;
        }
        if (c1 === pf[0] && c0 === pf[1] && pChir === -dstInfo.chirality) {
          foundPiece = p;
          foundOri = 1;
          break;
        }
      }

      if (foundPiece === -1) {
        addHighlight(dstInfo.stickers);
        errors.push(`Un ala (wing) en la arista ${dstInfo.name} tiene colores inválidos.`);
      } else if (wingUsed[foundPiece]) {
        addHighlight(dstInfo.stickers);
        errors.push(
          `Hay un ala (wing) duplicada o invertida con los colores ${wingSlots[foundPiece].name}.`
        );
      } else {
        wingUsed[foundPiece] = true;
        patternData.EDGES.pieces[s] = foundPiece;
        patternData.EDGES.orientation[s] = foundOri;
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, pattern: null, errors, highlightStickers: [...highlightSet] };
  }

  // 4. Verificaciones de paridad de orientación y permutación
  // 4a. Suma de orientaciones de esquinas mod 3 === 0 (aplica a 2x2, 3x3, 4x4 y 5x5)
  const coSum = patternData.CORNERS.orientation.reduce((a, b) => a + b, 0);
  if (coSum % 3 !== 0) {
    const twistedIdx = patternData.CORNERS.orientation.findIndex((o) => o !== 0);
    addHighlight(cornerSlots[twistedIdx >= 0 ? twistedIdx : 0].stickers);
    return {
      valid: false,
      pattern: null,
      errors: [
        'Orientación de esquinas imposible: hay una esquina girada individualmente (la suma de giros debe ser múltiplo de 3).',
      ],
      highlightStickers: [...highlightSet],
    };
  }

  // 4b. Suma de orientaciones de aristas mod 2 === 0 (aplica a 3x3 EDGES y 5x5 EDGES2 midges)
  if (N === 3 || N === 5) {
    const edgeOrbit = N === 3 ? 'EDGES' : 'EDGES2';
    const edgeSlots = map.orbits[edgeOrbit];
    const eoSum = patternData[edgeOrbit].orientation.reduce((a, b) => a + b, 0);
    if (eoSum % 2 !== 0) {
      const flippedIdx = patternData[edgeOrbit].orientation.findIndex((o) => o !== 0);
      addHighlight(edgeSlots[flippedIdx >= 0 ? flippedIdx : 0].stickers);
      return {
        valid: false,
        pattern: null,
        errors: ['Orientación de aristas imposible: hay una arista volteada individualmente.'],
        highlightStickers: [...highlightSet],
      };
    }

    // 4c. Paridad de permutación entre esquinas y aristas centrales (3x3 y 5x5)
    const cpParity = permParity(patternData.CORNERS.pieces);
    const epParity = permParity(patternData[edgeOrbit].pieces);
    if (cpParity !== epParity) {
      addHighlight([...cornerSlots[0].stickers, ...edgeSlots[0].stickers]);
      return {
        valid: false,
        pattern: null,
        errors: [
          'Paridad de permutación inválida: hay dos piezas intercambiadas entre sí (dos aristas o dos esquinas intercambiadas).',
        ],
        highlightStickers: [...highlightSet],
      };
    }
  }

  const pattern = new KPattern(map.kp, patternData);
  return { valid: true, pattern, patternData, errors: [], highlightStickers: [] };
}

export const stickersToPatternAndValidate = validateAndBuildPattern;
