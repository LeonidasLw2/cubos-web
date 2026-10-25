// Motores de resolución matemática para 2x2, 3x3, 4x4, 5x5 y Pyraminx + modo "Deshacer mezcla".
// Implementados en JS puro sobre KPuzzle (cubing/puzzles) para ejecutarse tanto en Web Worker
// como en Node.js (tests/solver.test.js) sin depender de sub-workers anidados.

import { Alg } from 'cubing/alg';
import { KPattern } from 'cubing/kpuzzle';
import { puzzles } from 'cubing/puzzles';
import { normalizePuzzleKey, parseNotationSequence, describeMove } from './notation-parser.js';

export const SOLVER_PUZZLES = [
  { id: '2x2', puzzleId: '2x2x2', timerEventId: '222', name: '2x2', size: 2 },
  { id: '3x3', puzzleId: '3x3x3', timerEventId: '333', name: '3x3', size: 3 },
  { id: '4x4', puzzleId: '4x4x4', timerEventId: '444', name: '4x4', size: 4 },
  { id: '5x5', puzzleId: '5x5x5', timerEventId: '555', name: '5x5', size: 5 },
  { id: 'pyraminx', puzzleId: 'pyraminx', timerEventId: 'pyram', name: 'Pyraminx', size: 3 },
];

let engineCachePromise = null;

export function invertAlgStr(str) {
  if (!str || !str.trim()) return '';
  return new Alg(str).invert().toString();
}

/**
 * Simplifica movimientos consecutivos sobre la misma capa (ej. "R R'" -> "", "U U" -> "U2").
 */
export function simplifyAlg(algStr, puzzleKey = '3x3') {
  const key = normalizePuzzleKey(puzzleKey);
  const tokens = String(algStr || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!tokens.length) return '';

  const modulus = key === 'pyraminx' ? 3 : key === 'megaminx' ? 5 : 4;
  const parseTok = (tok) => {
    if (tok.endsWith("2'")) return { base: tok.slice(0, -2), amount: modulus - 2 };
    if (tok.endsWith('2')) return { base: tok.slice(0, -1), amount: 2 };
    if (tok.endsWith("'")) return { base: tok.slice(0, -1), amount: modulus - 1 };
    return { base: tok, amount: 1 };
  };
  const formatTok = (base, amt) => {
    const a = ((amt % modulus) + modulus) % modulus;
    if (a === 0) return null;
    if (a === 1) return base;
    if (modulus === 3 && a === 2) return `${base}'`;
    if (modulus === 4 && a === 2) return `${base}2`;
    if (modulus === 4 && a === 3) return `${base}'`;
    if (modulus === 5 && a === 2) return `${base}2`;
    if (modulus === 5 && a === 3) return `${base}2'`;
    if (modulus === 5 && a === 4) return `${base}'`;
    return base;
  };

  const stack = [];
  for (const t of tokens) {
    if (t.endsWith('++') || t.endsWith('--')) {
      stack.push({ raw: t });
      continue;
    }
    const parsed = parseTok(t);
    const prev = stack.at(-1);
    if (prev && !prev.raw && prev.base === parsed.base) {
      prev.amount = (prev.amount + parsed.amount) % modulus;
      if (prev.amount === 0) stack.pop();
    } else {
      stack.push(parsed);
    }
  }

  return stack
    .map((item) => (item.raw ? item.raw : formatTok(item.base, item.amount)))
    .filter(Boolean)
    .join(' ');
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

const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
function getPermCoord(arr, n) {
  let idx = 0;
  for (let i = 0; i < n - 1; i++) {
    let smaller = 0;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[i]) smaller++;
    }
    idx += smaller * FACT[n - 1 - i];
  }
  return idx;
}

function setPermCoord(idx, n, offset = 0) {
  const avail = Array.from({ length: n }, (_, i) => i + offset);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const f = FACT[n - 1 - i];
    const pos = (idx / f) | 0;
    idx %= f;
    out[i] = avail[pos];
    avail.splice(pos, 1);
  }
  return out;
}

function buildPruning1D(size, moveTable, nMoves) {
  const dist = new Int8Array(size).fill(-1);
  dist[0] = 0;
  const q = new Int32Array(size);
  let head = 0;
  let tail = 0;
  q[tail++] = 0;
  while (head < tail) {
    const cur = q[head++];
    const d = dist[cur];
    const row = moveTable[cur];
    for (let m = 0; m < nMoves; m++) {
      const next = row[m];
      if (dist[next] === -1) {
        dist[next] = d + 1;
        q[tail++] = next;
      }
    }
  }
  return dist;
}

function buildPruning2D(sizeA, sizeB, moveA, moveB, startA, startB, allowedMoves) {
  const total = sizeA * sizeB;
  const dist = new Int8Array(total).fill(-1);
  const start = startA * sizeB + startB;
  dist[start] = 0;
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  while (head < tail) {
    const cur = queue[head++];
    const d = dist[cur];
    const a = (cur / sizeB) | 0;
    const b = cur % sizeB;
    const rowA = moveA[a];
    const rowB = moveB[b];
    for (let i = 0; i < allowedMoves.length; i++) {
      const m = allowedMoves[i];
      const next = rowA[m] * sizeB + rowB[m];
      if (dist[next] === -1) {
        dist[next] = d + 1;
        queue[tail++] = next;
      }
    }
  }
  return dist;
}

/**
 * Inicializa (una sola vez) las tablas de poda y ciclos para los 5 puzzles.
 */
export async function getSolverEngine() {
  if (engineCachePromise) return engineCachePromise;
  engineCachePromise = (async () => {
    const [kp2, kp3, kp4, kp5, kpPyr] = await Promise.all([
      puzzles['2x2x2'].kpuzzle(),
      puzzles['3x3x3'].kpuzzle(),
      puzzles['4x4x4'].kpuzzle(),
      puzzles['5x5x5'].kpuzzle(),
      puzzles['pyraminx'].kpuzzle(),
    ]);

    const SOLVED2 = kp2.defaultPattern();
    const SOLVED3 = kp3.defaultPattern();
    const SOLVED4 = kp4.defaultPattern();
    const SOLVED5 = kp5.defaultPattern();
    const SOLVED_PYR = kpPyr.defaultPattern();

    const ROTATIONS = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((a) => ['', 'y', 'y2', "y'"].map((b) => `${a} ${b}`.trim()));
    const FACE_LETTERS = ['U', 'L', 'F', 'R', 'B', 'D'];
    const ROTATION_FACE_MAPS = ROTATIONS.map((rot) => {
      const map = {};
      for (const f of FACE_LETTERS) {
        const conj = rot ? `${rot} ${f} ${invertAlgStr(rot)}` : f;
        const targetPat = SOLVED5.applyAlg(conj);
        const match = FACE_LETTERS.find((cand) => SOLVED5.applyAlg(cand).isIdentical(targetPat));
        map[f] = match;
      }
      return map;
    });

    function remapAlgFaces(algStr, faceMap) {
      return algStr
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((tok) => tok.replace(/[UDRLFB]/g, (ch) => faceMap[ch] || ch))
        .join(' ');
    }

    // ---------- Motor 3x3 (Kociemba 2 fases) ----------
    const MOVES_3X3 = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
    const G1_MOVE_INDICES = [0, 1, 2, 3, 4, 5, 8, 11, 14, 17];

    const MOVE_CORNERS_P = [];
    const MOVE_CORNERS_O = [];
    const MOVE_EDGES_P = [];
    const MOVE_EDGES_O = [];

    for (const m of MOVES_3X3) {
      const pat = SOLVED3.applyAlg(m);
      MOVE_CORNERS_P.push(Uint8Array.from(pat.patternData.CORNERS.pieces));
      MOVE_CORNERS_O.push(Uint8Array.from(pat.patternData.CORNERS.orientation));
      MOVE_EDGES_P.push(Uint8Array.from(pat.patternData.EDGES.pieces));
      MOVE_EDGES_O.push(Uint8Array.from(pat.patternData.EDGES.orientation));
    }

    const C_NK = Array.from({ length: 13 }, () => new Uint16Array(5));
    for (let n = 0; n <= 12; n++) {
      C_NK[n][0] = 1;
      for (let k = 1; k <= 4 && k <= n; k++) C_NK[n][k] = C_NK[n - 1][k - 1] + C_NK[n - 1][k];
    }

    const getTwistCoord = (co) => {
      let res = 0;
      for (let i = 0; i < 7; i++) res = res * 3 + co[i];
      return res;
    };
    const setTwistCoord = (coord) => {
      const co = new Uint8Array(8);
      let sum = 0;
      for (let i = 6; i >= 0; i--) {
        co[i] = coord % 3;
        sum += co[i];
        coord = (coord / 3) | 0;
      }
      co[7] = (3 - (sum % 3)) % 3;
      return co;
    };
    const getFlipCoord = (eo) => {
      let res = 0;
      for (let i = 0; i < 11; i++) res = (res << 1) | eo[i];
      return res;
    };
    const setFlipCoord = (coord) => {
      const eo = new Uint8Array(12);
      let sum = 0;
      for (let i = 10; i >= 0; i--) {
        eo[i] = coord & 1;
        sum ^= eo[i];
        coord >>= 1;
      }
      eo[11] = sum;
      return eo;
    };
    const getSliceCoord = (ep) => {
      let idx = 0;
      let k = 4;
      for (let i = 11; i >= 0; i--) {
        if (ep[i] >= 8) {
          idx += C_NK[i][k];
          k--;
        }
      }
      return idx;
    };
    const setSliceCoord = (idx) => {
      const ep = new Uint8Array(12);
      let k = 4;
      let slicePiece = 11;
      let otherPiece = 7;
      for (let i = 11; i >= 0; i--) {
        if (k > 0 && idx >= C_NK[i][k]) {
          idx -= C_NK[i][k];
          ep[i] = slicePiece--;
          k--;
        } else {
          ep[i] = otherPiece--;
        }
      }
      return ep;
    };

    const SOLVED_SLICE = getSliceCoord(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));

    const twistMove = Array.from({ length: 2187 }, () => new Uint16Array(18));
    for (let t = 0; t < 2187; t++) {
      const co = setTwistCoord(t);
      for (let m = 0; m < 18; m++) {
        const nextCo = new Uint8Array(8);
        const mcp = MOVE_CORNERS_P[m];
        const mco = MOVE_CORNERS_O[m];
        for (let i = 0; i < 8; i++) nextCo[i] = (co[mcp[i]] + mco[i]) % 3;
        twistMove[t][m] = getTwistCoord(nextCo);
      }
    }

    const flipMove = Array.from({ length: 2048 }, () => new Uint16Array(18));
    for (let f = 0; f < 2048; f++) {
      const eo = setFlipCoord(f);
      for (let m = 0; m < 18; m++) {
        const nextEo = new Uint8Array(12);
        const mep = MOVE_EDGES_P[m];
        const meo = MOVE_EDGES_O[m];
        for (let i = 0; i < 12; i++) nextEo[i] = (eo[mep[i]] + meo[i]) & 1;
        flipMove[f][m] = getFlipCoord(nextEo);
      }
    }

    const sliceMove = Array.from({ length: 495 }, () => new Uint16Array(18));
    for (let s = 0; s < 495; s++) {
      const ep = setSliceCoord(s);
      for (let m = 0; m < 18; m++) {
        const nextEp = new Uint8Array(12);
        const mep = MOVE_EDGES_P[m];
        for (let i = 0; i < 12; i++) nextEp[i] = ep[mep[i]];
        sliceMove[s][m] = getSliceCoord(nextEp);
      }
    }

    const ALL_18 = Array.from({ length: 18 }, (_, i) => i);
    const prunTwistSlice = buildPruning2D(2187, 495, twistMove, sliceMove, 0, SOLVED_SLICE, ALL_18);
    const prunFlipSlice = buildPruning2D(2048, 495, flipMove, sliceMove, 0, SOLVED_SLICE, ALL_18);

    const cPermMove = Array.from({ length: 40320 }, () => new Uint16Array(10));
    for (let c = 0; c < 40320; c++) {
      const cp = setPermCoord(c, 8, 0);
      for (let gi = 0; gi < 10; gi++) {
        const m = G1_MOVE_INDICES[gi];
        const mcp = MOVE_CORNERS_P[m];
        const next = new Uint8Array(8);
        for (let i = 0; i < 8; i++) next[i] = cp[mcp[i]];
        cPermMove[c][gi] = getPermCoord(next, 8);
      }
    }

    const udPermMove = Array.from({ length: 40320 }, () => new Uint16Array(10));
    for (let u = 0; u < 40320; u++) {
      const udp = setPermCoord(u, 8, 0);
      for (let gi = 0; gi < 10; gi++) {
        const m = G1_MOVE_INDICES[gi];
        const mep = MOVE_EDGES_P[m];
        const next = new Uint8Array(8);
        for (let i = 0; i < 8; i++) next[i] = udp[mep[i]];
        udPermMove[u][gi] = getPermCoord(next, 8);
      }
    }

    const ePermMove = Array.from({ length: 24 }, () => new Uint8Array(10));
    for (let e = 0; e < 24; e++) {
      const ep4 = setPermCoord(e, 4, 8);
      for (let gi = 0; gi < 10; gi++) {
        const m = G1_MOVE_INDICES[gi];
        const mep = MOVE_EDGES_P[m];
        const next = new Uint8Array(4);
        for (let i = 0; i < 4; i++) next[i] = ep4[mep[i + 8] - 8];
        ePermMove[e][gi] = getPermCoord(next, 4);
      }
    }

    const ALL_10 = Array.from({ length: 10 }, (_, i) => i);
    const prunCornerSlice = buildPruning2D(40320, 24, cPermMove, ePermMove, 0, 0, ALL_10);
    const prunUDSlice = buildPruning2D(40320, 24, udPermMove, ePermMove, 0, 0, ALL_10);

    function applyMove3x3State(state, mIdx) {
      const cp = new Uint8Array(8);
      const co = new Uint8Array(8);
      const ep = new Uint8Array(12);
      const eo = new Uint8Array(12);
      const mcp = MOVE_CORNERS_P[mIdx];
      const mco = MOVE_CORNERS_O[mIdx];
      const mep = MOVE_EDGES_P[mIdx];
      const meo = MOVE_EDGES_O[mIdx];
      for (let i = 0; i < 8; i++) {
        const src = mcp[i];
        cp[i] = state.cp[src];
        co[i] = (state.co[src] + mco[i]) % 3;
      }
      for (let i = 0; i < 12; i++) {
        const src = mep[i];
        ep[i] = state.ep[src];
        eo[i] = (state.eo[src] + meo[i]) & 1;
      }
      return { cp, co, ep, eo };
    }

    function solve3x3Pattern(pattern) {
      let curPat = pattern;
      let initRot = '';
      if (curPat.patternData.CENTERS) {
        const r = ROTATIONS.find((rot) =>
          (rot ? curPat.applyAlg(rot) : curPat).patternData.CENTERS.pieces.every((v, i) => v === i),
        );
        if (r) {
          initRot = r;
          curPat = curPat.applyAlg(r);
        }
      }

      const initState = {
        cp: Uint8Array.from(curPat.patternData.CORNERS.pieces),
        co: Uint8Array.from(curPat.patternData.CORNERS.orientation),
        ep: Uint8Array.from(curPat.patternData.EDGES.pieces),
        eo: Uint8Array.from(curPat.patternData.EDGES.orientation),
      };

      const t0 = getTwistCoord(initState.co);
      const f0 = getFlipCoord(initState.eo);
      const s0 = getSliceCoord(initState.ep);

      const p1Path = [];
      let p2Path = null;

      function searchPhase2(cp, udp, ep4) {
        const minD = Math.max(prunCornerSlice[cp * 24 + ep4], prunUDSlice[udp * 24 + ep4]);
        for (let maxD = minD; maxD <= 18; maxD++) {
          const path = [];
          function dfs2(c, u, e, depth, lastFace) {
            const h = Math.max(prunCornerSlice[c * 24 + e], prunUDSlice[u * 24 + e]);
            if (h > depth) return false;
            if (depth === 0) return c === 0 && u === 0 && e === 0;
            for (let gi = 0; gi < 10; gi++) {
              const m = G1_MOVE_INDICES[gi];
              const face = (m / 3) | 0;
              if (face === lastFace) continue;
              if (lastFace !== -1 && (face >> 1) === (lastFace >> 1) && face < lastFace) continue;
              path.push(m);
              if (dfs2(cPermMove[c][gi], udPermMove[u][gi], ePermMove[e][gi], depth - 1, face)) return true;
              path.pop();
            }
            return false;
          }
          if (dfs2(cp, udp, ep4, maxD, -1)) return path;
        }
        return null;
      }

      const minD1 = Math.max(prunTwistSlice[t0 * 495 + s0], prunFlipSlice[f0 * 495 + s0]);
      for (let maxD1 = minD1; maxD1 <= 12; maxD1++) {
        function dfs1(t, f, s, depth, lastFace) {
          const h = Math.max(prunTwistSlice[t * 495 + s], prunFlipSlice[f * 495 + s]);
          if (h > depth) return false;
          if (depth === 0) {
            if (t !== 0 || f !== 0 || s !== SOLVED_SLICE) return false;
            let st = initState;
            for (const m of p1Path) st = applyMove3x3State(st, m);
            const cp = getPermCoord(st.cp, 8);
            const udp = getPermCoord(st.ep.subarray(0, 8), 8);
            const ep4 = getPermCoord(st.ep.subarray(8, 12), 4);
            const res2 = searchPhase2(cp, udp, ep4);
            if (res2) {
              p2Path = res2;
              return true;
            }
            return false;
          }
          for (let m = 0; m < 18; m++) {
            const face = (m / 3) | 0;
            if (face === lastFace) continue;
            if (lastFace !== -1 && (face >> 1) === (lastFace >> 1) && face < lastFace) continue;
            p1Path.push(m);
            if (dfs1(twistMove[t][m], flipMove[f][m], sliceMove[s][m], depth - 1, face)) return true;
            p1Path.pop();
          }
          return false;
        }
        if (dfs1(t0, f0, s0, maxD1, -1)) break;
      }

      const rawMoves = [...p1Path, ...(p2Path || [])].map((m) => MOVES_3X3[m]).join(' ');
      const full = [initRot, rawMoves].filter(Boolean).join(' ');
      return simplifyAlg(full, '3x3');
    }

    // ---------- Motor 2x2 (IDA* óptimo HTM <= 11 movimientos) ----------
    const FIXED_CORNER_2X2 = [0, 1, 2, 3, 4, 5, 6, 7].find(
      (i) =>
        SOLVED2.applyAlg('U').patternData.CORNERS.pieces[i] === i &&
        SOLVED2.applyAlg('R').patternData.CORNERS.pieces[i] === i &&
        SOLVED2.applyAlg('F').patternData.CORNERS.pieces[i] === i,
    );
    const MOVABLE_2X2 = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== FIXED_CORNER_2X2);
    const MOVES_2X2_URF = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2'];

    const MOVE2_P = [];
    const MOVE2_O = [];
    for (const m of MOVES_2X2_URF) {
      const pat = SOLVED2.applyAlg(m).patternData.CORNERS;
      MOVE2_P.push(Uint8Array.from(MOVABLE_2X2.map((slot) => MOVABLE_2X2.indexOf(pat.pieces[slot]))));
      MOVE2_O.push(Uint8Array.from(MOVABLE_2X2.map((slot) => pat.orientation[slot])));
    }

    const get2x2OriCoord = (co7) => {
      let res = 0;
      for (let i = 0; i < 6; i++) res = res * 3 + co7[i];
      return res;
    };
    const set2x2OriCoord = (coord) => {
      const co7 = new Uint8Array(7);
      let sum = 0;
      for (let i = 5; i >= 0; i--) {
        co7[i] = coord % 3;
        sum += co7[i];
        coord = (coord / 3) | 0;
      }
      co7[6] = (3 - (sum % 3)) % 3;
      return co7;
    };

    const move2PermTable = Array.from({ length: 5040 }, () => new Uint16Array(9));
    for (let p = 0; p < 5040; p++) {
      const cp = setPermCoord(p, 7, 0);
      for (let m = 0; m < 9; m++) {
        const mp = MOVE2_P[m];
        const next = new Uint8Array(7);
        for (let i = 0; i < 7; i++) next[i] = cp[mp[i]];
        move2PermTable[p][m] = getPermCoord(next, 7);
      }
    }

    const move2OriTable = Array.from({ length: 729 }, () => new Uint16Array(9));
    for (let o = 0; o < 729; o++) {
      const co = set2x2OriCoord(o);
      for (let m = 0; m < 9; m++) {
        const mp = MOVE2_P[m];
        const mo = MOVE2_O[m];
        const next = new Uint8Array(7);
        for (let i = 0; i < 7; i++) next[i] = (co[mp[i]] + mo[i]) % 3;
        move2OriTable[o][m] = get2x2OriCoord(next);
      }
    }

    const prun2Perm = buildPruning1D(5040, move2PermTable, 9);
    const prun2Ori = buildPruning1D(729, move2OriTable, 9);

    function solve2x2Pattern(pattern) {
      let rotIdx = ROTATIONS.findIndex((r) => {
        const q = r ? pattern.applyAlg(r) : pattern;
        return (
          q.patternData.CORNERS.pieces[FIXED_CORNER_2X2] === FIXED_CORNER_2X2 &&
          q.patternData.CORNERS.orientation[FIXED_CORNER_2X2] === 0
        );
      });
      if (rotIdx === -1) rotIdx = 0;
      const rot = ROTATIONS[rotIdx];
      const rotatedPat = rot ? pattern.applyAlg(rot) : pattern;

      const cp7 = Uint8Array.from(MOVABLE_2X2.map((slot) => MOVABLE_2X2.indexOf(rotatedPat.patternData.CORNERS.pieces[slot])));
      const co7 = Uint8Array.from(MOVABLE_2X2.map((slot) => rotatedPat.patternData.CORNERS.orientation[slot]));
      const p0 = getPermCoord(cp7, 7);
      const o0 = get2x2OriCoord(co7);

      const path = [];
      const minD = Math.max(prun2Perm[p0], prun2Ori[o0]);
      for (let maxD = minD; maxD <= 11; maxD++) {
        function dfs(p, o, depth, lastFace) {
          const h = Math.max(prun2Perm[p], prun2Ori[o]);
          if (h > depth) return false;
          if (depth === 0) return p === 0 && o === 0;
          for (let m = 0; m < 9; m++) {
            const face = (m / 3) | 0;
            if (face === lastFace) continue;
            path.push(m);
            if (dfs(move2PermTable[p][m], move2OriTable[o][m], depth - 1, face)) return true;
            path.pop();
          }
          return false;
        }
        if (dfs(p0, o0, maxD, -1)) break;
      }

      const urfAlg = path.map((m) => MOVES_2X2_URF[m]).join(' ');
      if (!rot) return simplifyAlg(urfAlg, '2x2');
      const faceMap = ROTATION_FACE_MAPS[rotIdx];
      return simplifyAlg(urfAlg ? remapAlgFaces(urfAlg, faceMap) : '', '2x2');
    }

    // ---------- Motor Pyraminx (IDA* óptimo) ----------
    const PYR_BODY_MOVES = ['U', "U'", 'R', "R'", 'L', "L'", 'B', "B'"];
    const PYR_TIP_MOVES = ['u', "u'", 'r', "r'", 'l', "l'", 'b', "b'"];

    const PYR_MOVE_CO = [];
    const PYR_MOVE_EP = [];
    const PYR_MOVE_EO = [];
    for (const m of PYR_BODY_MOVES) {
      const pat = SOLVED_PYR.applyAlg(m).patternData;
      PYR_MOVE_CO.push(Uint8Array.from(pat.CORNERS.orientation));
      PYR_MOVE_EP.push(Uint8Array.from(pat.EDGES.pieces));
      PYR_MOVE_EO.push(Uint8Array.from(pat.EDGES.orientation));
    }

    const getPyrCenterCoord = (co4) => ((co4[0] * 3 + co4[1]) * 3 + co4[2]) * 3 + co4[3];
    const setPyrCenterCoord = (c) => {
      const co4 = new Uint8Array(4);
      for (let i = 3; i >= 0; i--) {
        co4[i] = c % 3;
        c = (c / 3) | 0;
      }
      return co4;
    };
    const getPyrEdgeOriCoord = (eo6) => {
      let res = 0;
      for (let i = 0; i < 5; i++) res = (res << 1) | eo6[i];
      return res;
    };
    const setPyrEdgeOriCoord = (c) => {
      const eo6 = new Uint8Array(6);
      let sum = 0;
      for (let i = 4; i >= 0; i--) {
        eo6[i] = c & 1;
        sum ^= eo6[i];
        c >>= 1;
      }
      eo6[5] = sum;
      return eo6;
    };

    const pyrCenterMove = Array.from({ length: 81 }, () => new Uint8Array(8));
    for (let c = 0; c < 81; c++) {
      const co = setPyrCenterCoord(c);
      for (let m = 0; m < 8; m++) {
        const mco = PYR_MOVE_CO[m];
        const next = new Uint8Array(4);
        for (let i = 0; i < 4; i++) next[i] = (co[i] + mco[i]) % 3;
        pyrCenterMove[c][m] = getPyrCenterCoord(next);
      }
    }

    const pyrEOriMove = Array.from({ length: 32 }, () => new Uint8Array(8));
    for (let eoIdx = 0; eoIdx < 32; eoIdx++) {
      const eo = setPyrEdgeOriCoord(eoIdx);
      for (let m = 0; m < 8; m++) {
        const mep = PYR_MOVE_EP[m];
        const meo = PYR_MOVE_EO[m];
        const next = new Uint8Array(6);
        for (let i = 0; i < 6; i++) next[i] = (eo[mep[i]] + meo[i]) & 1;
        pyrEOriMove[eoIdx][m] = getPyrEdgeOriCoord(next);
      }
    }

    const pyrEPermMove = Array.from({ length: 720 }, () => new Uint16Array(8));
    for (let epIdx = 0; epIdx < 720; epIdx++) {
      const ep = setPermCoord(epIdx, 6, 0);
      for (let m = 0; m < 8; m++) {
        const mep = PYR_MOVE_EP[m];
        const next = new Uint8Array(6);
        for (let i = 0; i < 6; i++) next[i] = ep[mep[i]];
        pyrEPermMove[epIdx][m] = getPermCoord(next, 6);
      }
    }

    const ALL_8 = [0, 1, 2, 3, 4, 5, 6, 7];
    const prunPyrCenterEOri = buildPruning2D(81, 32, pyrCenterMove, pyrEOriMove, 0, 0, ALL_8);
    const prunPyrCenterEPerm = buildPruning2D(81, 720, pyrCenterMove, pyrEPermMove, 0, 0, ALL_8);

    function solvePyraminxPattern(pattern) {
      const c0 = getPyrCenterCoord(pattern.patternData.CORNERS.orientation);
      const eo0 = getPyrEdgeOriCoord(pattern.patternData.EDGES.orientation);
      const ep0 = getPermCoord(pattern.patternData.EDGES.pieces, 6);

      const path = [];
      const minD = Math.max(prunPyrCenterEOri[c0 * 32 + eo0], prunPyrCenterEPerm[c0 * 720 + ep0]);
      for (let maxD = minD; maxD <= 12; maxD++) {
        function dfs(c, eo, ep, depth, lastAxis) {
          const h = Math.max(prunPyrCenterEOri[c * 32 + eo], prunPyrCenterEPerm[c * 720 + ep]);
          if (h > depth) return false;
          if (depth === 0) return c === 0 && eo === 0 && ep === 0;
          for (let m = 0; m < 8; m++) {
            const axis = m >> 1;
            if (axis === lastAxis) continue;
            path.push(m);
            if (dfs(pyrCenterMove[c][m], pyrEOriMove[eo][m], pyrEPermMove[ep][m], depth - 1, axis)) return true;
            path.pop();
          }
          return false;
        }
        if (dfs(c0, eo0, ep0, maxD, -1)) break;
      }

      const bodyMoves = path.map((m) => PYR_BODY_MOVES[m]);
      let cur = bodyMoves.length ? pattern.applyAlg(bodyMoves.join(' ')) : pattern;

      const tipMoves = [];
      for (const m of PYR_TIP_MOVES) {
        const after = cur.applyAlg(m);
        const beforeSolved = cur.patternData.CORNERS2.orientation.filter((o) => o === 0).length;
        const afterSolved = after.patternData.CORNERS2.orientation.filter((o) => o === 0).length;
        if (afterSolved > beforeSolved) {
          cur = after;
          tipMoves.push(m);
        }
      }

      return simplifyAlg([...bodyMoves, ...tipMoves].join(' '), 'pyraminx');
    }

    // ---------- Motores 4x4 y 5x5 (Reducción en 3 etapas verificada con KPuzzle) ----------
    const OUTER_MOVES = ['', 'U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];

    function buildPure3Cycles(kp, orbitName, baseComms) {
      const data = JSON.parse(JSON.stringify(kp.defaultPattern().patternData));
      data[orbitName].pieces = Array.from({ length: 24 }, (_, i) => i);
      const basePat = new KPattern(kp, data);

      const cycles = [];
      const seen = new Set();

      for (const comm of baseComms) {
        for (const inv of [comm, invertAlgStr(comm)]) {
          for (const faceMap of ROTATION_FACE_MAPS) {
            const mappedComm = remapAlgFaces(inv, faceMap);
            for (const m1 of OUTER_MOVES) {
              for (const m2 of ['', 'U', "U'", 'U2', 'F', "F'", 'F2', 'R', "R'", 'R2']) {
                const s = remapAlgFaces(`${m1} ${m2}`.trim(), faceMap);
                const fullAlg = s ? `${s} ${mappedComm} ${invertAlgStr(s)}` : mappedComm;
                const after = basePat.applyAlg(fullAlg).patternData[orbitName].pieces;
                const changed = [];
                for (let i = 0; i < 24; i++) {
                  if (after[i] !== i) changed.push(i);
                }
                if (changed.length === 3) {
                  const a = changed[0];
                  const b = after.indexOf(a);
                  const c = after.indexOf(b);
                  const key = `${a},${b},${c}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    seen.add(`${b},${c},${a}`);
                    seen.add(`${c},${a},${b}`);
                    cycles.push({ a, b, c, alg: fullAlg });
                    cycles.push({ a: b, b: c, c: a, alg: fullAlg });
                    cycles.push({ a: c, b: a, c: b, alg: fullAlg });
                  }
                }
              }
            }
          }
        }
      }
      return cycles;
    }

    const cyclesX = buildPure3Cycles(kp5, 'CENTERS2', [
      "2R U' 2L' U 2R' U' 2L U",
      "2R2 U' 2L2 U 2R2 U' 2L2 U",
    ]);
    const cyclesT = buildPure3Cycles(kp5, 'CENTERS', [
      "3R U' 2L' U 3R' U' 2L U",
      "3R2 U' 2L2 U 3R2 U' 2L2 U",
    ]);
    const cyclesWings = buildPure3Cycles(kp5, 'EDGES', [
      "2R U' L' U 2R' U' L U",
      "2R U2 L' U2 2R' U2 L U2",
      "2R' F R F' 2R F R' F'",
      "2R D' L' D 2R' D' L D",
    ]);

    function solveCenterOrbit(pattern, orbitName, targetPieces, cycles) {
      let cur = pattern;
      const moves = [];
      let guard = 0;
      while (guard++ < 35) {
        const pieces = cur.patternData[orbitName].pieces;
        let wrongCount = 0;
        for (let i = 0; i < 24; i++) if (pieces[i] !== targetPieces[i]) wrongCount++;
        if (wrongCount === 0) break;

        let bestCycle = null;
        let bestGain = -99;
        for (const cyc of cycles) {
          const { a, b, c } = cyc;
          const beforeOk =
            (pieces[a] === targetPieces[a] ? 1 : 0) +
            (pieces[b] === targetPieces[b] ? 1 : 0) +
            (pieces[c] === targetPieces[c] ? 1 : 0);
          const afterOk =
            (pieces[c] === targetPieces[a] ? 1 : 0) +
            (pieces[a] === targetPieces[b] ? 1 : 0) +
            (pieces[b] === targetPieces[c] ? 1 : 0);
          const gain = afterOk - beforeOk;
          if (gain > bestGain) {
            bestGain = gain;
            bestCycle = cyc;
            if (gain === 3) break;
          }
        }
        if (!bestCycle || bestGain <= 0) break;
        cur = cur.applyAlg(bestCycle.alg);
        moves.push(bestCycle.alg);
      }
      return { pattern: cur, alg: moves.join(' ') };
    }

    const WING_PARITY_ALG = "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2";

    function solveWingsOrbit(pattern, targetPieces, cycles) {
      let cur = pattern;
      const moves = [];

      const relPerm = cur.patternData.EDGES.pieces.map((p) => targetPieces.indexOf(p));
      if (permParity(relPerm) !== 0) {
        cur = cur.applyAlg(WING_PARITY_ALG);
        moves.push(WING_PARITY_ALG);
      }

      let guard = 0;
      while (guard++ < 40) {
        const pieces = cur.patternData.EDGES.pieces;
        const wrong = [];
        for (let i = 0; i < 24; i++) if (pieces[i] !== targetPieces[i]) wrong.push(i);
        if (wrong.length === 0) break;

        let bestCycle = null;
        let bestGain = 0;
        for (const cyc of cycles) {
          const { a, b, c } = cyc;
          const beforeOk =
            (pieces[a] === targetPieces[a] ? 1 : 0) +
            (pieces[b] === targetPieces[b] ? 1 : 0) +
            (pieces[c] === targetPieces[c] ? 1 : 0);
          const afterOk =
            (pieces[c] === targetPieces[a] ? 1 : 0) +
            (pieces[a] === targetPieces[b] ? 1 : 0) +
            (pieces[b] === targetPieces[c] ? 1 : 0);
          const gain = afterOk - beforeOk;
          if (gain > bestGain) {
            bestGain = gain;
            bestCycle = cyc;
            if (gain === 3) break;
          }
        }

        if (!bestCycle) {
          let foundPair = null;
          const cand1List = cycles.filter((c) => wrong.includes(c.a));
          for (const cyc1 of cand1List) {
            const p1 = pieces.slice();
            p1[cyc1.b] = pieces[cyc1.a];
            p1[cyc1.c] = pieces[cyc1.b];
            p1[cyc1.a] = pieces[cyc1.c];
            let w1 = 0;
            for (let i = 0; i < 24; i++) if (p1[i] !== targetPieces[i]) w1++;
            const needGain2 = w1 - wrong.length + 1;
            for (const cyc2 of cycles) {
              const { a, b, c } = cyc2;
              const bOk =
                (p1[a] === targetPieces[a] ? 1 : 0) +
                (p1[b] === targetPieces[b] ? 1 : 0) +
                (p1[c] === targetPieces[c] ? 1 : 0);
              const aOk =
                (p1[c] === targetPieces[a] ? 1 : 0) +
                (p1[a] === targetPieces[b] ? 1 : 0) +
                (p1[b] === targetPieces[c] ? 1 : 0);
              if (aOk - bOk >= needGain2) {
                foundPair = [cyc1, cyc2];
                break;
              }
            }
            if (foundPair) break;
          }
          if (foundPair) {
            cur = cur.applyAlg(foundPair[0].alg).applyAlg(foundPair[1].alg);
            moves.push(foundPair[0].alg, foundPair[1].alg);
            continue;
          }
        }

        if (!bestCycle) break;
        cur = cur.applyAlg(bestCycle.alg);
        moves.push(bestCycle.alg);
      }
      return { pattern: cur, alg: moves.join(' ') };
    }

    // Mapeo entre 5x5 EDGES2 (midges) y 3x3 EDGES
    const MIDGE5_TO_EDGE3_SLOT = new Uint8Array(12);
    for (let s5 = 0; s5 < 12; s5++) {
      const movedBy5 = ['U', 'D', 'R', 'L', 'F', 'B']
        .filter((f) => SOLVED5.applyAlg(f).patternData.EDGES2.pieces[s5] !== s5)
        .join('');
      const s3 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].find(
        (k) =>
          ['U', 'D', 'R', 'L', 'F', 'B'].filter((f) => SOLVED3.applyAlg(f).patternData.EDGES.pieces[k] !== k).join('') ===
          movedBy5,
      );
      MIDGE5_TO_EDGE3_SLOT[s5] = s3;
    }

    const MIDGE5_ORI_XOR = new Map();
    {
      let a5 = SOLVED5;
      let a3 = SOLVED3;
      for (let i = 0; i < 200; i++) {
        const m = MOVES_3X3[i % 18];
        a5 = a5.applyAlg(m);
        a3 = a3.applyAlg(m);
        for (let s5 = 0; s5 < 12; s5++) {
          const s3 = MIDGE5_TO_EDGE3_SLOT[s5];
          const p5 = a5.patternData.EDGES2.pieces[s5];
          const o5 = a5.patternData.EDGES2.orientation[s5];
          const o3 = a3.patternData.EDGES.orientation[s3];
          MIDGE5_ORI_XOR.set(`${s5},${p5}`, o5 ^ o3);
        }
      }
    }

    function midge5ToEdge3PatternData(edges2) {
      const pieces = new Array(12);
      const orientation = new Array(12);
      for (let s5 = 0; s5 < 12; s5++) {
        const s3 = MIDGE5_TO_EDGE3_SLOT[s5];
        const p5 = edges2.pieces[s5];
        const o5 = edges2.orientation[s5];
        pieces[s3] = MIDGE5_TO_EDGE3_SLOT[p5];
        orientation[s3] = o5 ^ (MIDGE5_ORI_XOR.get(`${s5},${p5}`) ?? 0);
      }
      return { pieces, orientation };
    }

    function solve4x4Pattern(pattern, onProgress) {
      onProgress?.({ stage: 1, totalStages: 3, label: 'Etapa 1/3: Centros', percent: 15 });
      const resC = solveCenterOrbit(pattern, 'CENTERS', SOLVED4.patternData.CENTERS.pieces, cyclesX);
      const stage1Alg = simplifyAlg(resC.alg, '4x4');
      const pAfterCenters = resC.pattern;

      onProgress?.({ stage: 2, totalStages: 3, label: 'Etapa 2/3: Aristas y Paridad', percent: 55 });
      const cpParity = permParity(pAfterCenters.patternData.CORNERS.pieces);
      const synthEdgesPieces = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      if (cpParity !== 0) {
        synthEdgesPieces[0] = 1;
        synthEdgesPieces[1] = 0;
      }
      const pat3 = new KPattern(kp3, {
        CORNERS: JSON.parse(JSON.stringify(pAfterCenters.patternData.CORNERS)),
        EDGES: { pieces: synthEdgesPieces, orientation: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        CENTERS: JSON.parse(JSON.stringify(SOLVED3.patternData.CENTERS)),
      });
      const alg3x3 = solve3x3Pattern(pat3);
      const targetBefore3x3 = alg3x3
        ? SOLVED4.applyAlg(invertAlgStr(alg3x3)).patternData.EDGES.pieces
        : SOLVED4.patternData.EDGES.pieces;
      const resWings = solveWingsOrbit(pAfterCenters, targetBefore3x3, cyclesWings);
      const stage2Alg = simplifyAlg(resWings.alg, '4x4');

      onProgress?.({ stage: 3, totalStages: 3, label: 'Etapa 3/3: Etapa 3x3', percent: 90 });
      const stage3Alg = simplifyAlg(alg3x3, '4x4');
      const fullAlg = [stage1Alg, stage2Alg, stage3Alg].filter(Boolean).join(' ');
      onProgress?.({ stage: 3, totalStages: 3, label: '¡Solución completada!', percent: 100 });

      return {
        alg: fullAlg,
        stages: [
          { id: 'centers', title: 'Etapa 1/3: Centros', alg: stage1Alg },
          { id: 'edges', title: 'Etapa 2/3: Aristas y Paridad', alg: stage2Alg },
          { id: 'stage3x3', title: 'Etapa 3/3: Etapa 3x3', alg: stage3Alg },
        ],
      };
    }

    function solve5x5Pattern(pattern, onProgress) {
      onProgress?.({ stage: 1, totalStages: 3, label: 'Etapa 1/3: Centros', percent: 15 });
      let p = pattern;
      const stage1Parts = [];
      const rot = ROTATIONS.find((r) => (r ? p.applyAlg(r) : p).patternData.CENTERS3.pieces.every((v, i) => v === i));
      if (rot) {
        p = p.applyAlg(rot);
        stage1Parts.push(rot);
      }
      const resX = solveCenterOrbit(p, 'CENTERS2', SOLVED5.patternData.CENTERS2.pieces, cyclesX);
      if (resX.alg) stage1Parts.push(resX.alg);
      const resT = solveCenterOrbit(resX.pattern, 'CENTERS', SOLVED5.patternData.CENTERS.pieces, cyclesT);
      if (resT.alg) stage1Parts.push(resT.alg);
      const stage1Alg = simplifyAlg(stage1Parts.join(' '), '5x5');
      const pAfterCenters = resT.pattern;

      onProgress?.({ stage: 2, totalStages: 3, label: 'Etapa 2/3: Aristas y Paridad', percent: 55 });
      const pat3 = new KPattern(kp3, {
        CORNERS: JSON.parse(JSON.stringify(pAfterCenters.patternData.CORNERS)),
        EDGES: midge5ToEdge3PatternData(pAfterCenters.patternData.EDGES2),
        CENTERS: JSON.parse(JSON.stringify(SOLVED3.patternData.CENTERS)),
      });
      const alg3x3 = solve3x3Pattern(pat3);
      const targetBefore3x3 = alg3x3
        ? SOLVED5.applyAlg(invertAlgStr(alg3x3)).patternData.EDGES.pieces
        : SOLVED5.patternData.EDGES.pieces;
      const resWings = solveWingsOrbit(pAfterCenters, targetBefore3x3, cyclesWings);
      const stage2Alg = simplifyAlg(resWings.alg, '5x5');

      onProgress?.({ stage: 3, totalStages: 3, label: 'Etapa 3/3: Etapa 3x3', percent: 90 });
      const stage3Alg = simplifyAlg(alg3x3, '5x5');
      const fullAlg = [stage1Alg, stage2Alg, stage3Alg].filter(Boolean).join(' ');
      onProgress?.({ stage: 3, totalStages: 3, label: '¡Solución completada!', percent: 100 });

      return {
        alg: fullAlg,
        stages: [
          { id: 'centers', title: 'Etapa 1/3: Centros', alg: stage1Alg },
          { id: 'edges', title: 'Etapa 2/3: Aristas y Paridad', alg: stage2Alg },
          { id: 'stage3x3', title: 'Etapa 3/3: Etapa 3x3', alg: stage3Alg },
        ],
      };
    }

    return {
      kpuzzles: { '2x2': kp2, '3x3': kp3, '4x4': kp4, '5x5': kp5, pyraminx: kpPyr },
      solvedPatterns: { '2x2': SOLVED2, '3x3': SOLVED3, '4x4': SOLVED4, '5x5': SOLVED5, pyraminx: SOLVED_PYR },
      ROTATIONS,
      solve2x2Pattern,
      solve3x3Pattern,
      solve4x4Pattern,
      solve5x5Pattern,
      solvePyraminxPattern,
    };
  })();

  return engineCachePromise;
}

/**
 * Resuelve cualquier KPattern válido de 2x2, 3x3, 4x4, 5x5 o Pyraminx y devuelve
 * `{ alg, moves, stages, moveDescriptions }`.
 */
export async function solvePuzzlePattern(puzzleKey, pattern, { onProgress } = {}) {
  const key = normalizePuzzleKey(puzzleKey);
  const engine = await getSolverEngine();

  let alg = '';
  let stages = [];

  if (key === '2x2') {
    onProgress?.({ stage: 1, totalStages: 1, label: 'Buscando solución óptima HTM (≤ 11 movs)…', percent: 40 });
    alg = engine.solve2x2Pattern(pattern);
    stages = [{ id: 'optimal', title: 'Solución directa óptima', alg }];
    onProgress?.({ stage: 1, totalStages: 1, label: '¡Listo!', percent: 100 });
  } else if (key === '3x3') {
    onProgress?.({ stage: 1, totalStages: 1, label: 'Ejecutando Kociemba de dos fases…', percent: 40 });
    alg = engine.solve3x3Pattern(pattern);
    stages = [{ id: 'kociemba', title: 'Resolución en dos fases (Kociemba)', alg }];
    onProgress?.({ stage: 1, totalStages: 1, label: '¡Listo!', percent: 100 });
  } else if (key === '4x4') {
    const res = engine.solve4x4Pattern(pattern, onProgress);
    alg = res.alg;
    stages = res.stages;
  } else if (key === '5x5') {
    const res = engine.solve5x5Pattern(pattern, onProgress);
    alg = res.alg;
    stages = res.stages;
  } else if (key === 'pyraminx') {
    onProgress?.({ stage: 1, totalStages: 1, label: 'Buscando solución óptima IDA*…', percent: 40 });
    alg = engine.solvePyraminxPattern(pattern);
    stages = [{ id: 'optimal', title: 'Solución óptima (Cuerpo + Puntas)', alg }];
    onProgress?.({ stage: 1, totalStages: 1, label: '¡Listo!', percent: 100 });
  } else {
    throw new Error(`El puzzle "${key}" no está soportado en el Solver.`);
  }

  const moves = alg ? alg.trim().split(/\s+/).filter(Boolean) : [];
  // Asignar etapa a cada movimiento individual para el reproductor paso a paso
  const moveStages = [];
  for (const st of stages) {
    const stMoves = st.alg ? st.alg.trim().split(/\s+/).filter(Boolean) : [];
    for (const m of stMoves) {
      moveStages.push({ token: m, stageId: st.id, stageTitle: st.title, ...describeMove(key, m) });
    }
  }

  return {
    puzzle: key,
    alg,
    moves,
    stages,
    moveDescriptions: moveStages,
  };
}

/**
 * Modo "Deshacer mezcla": valida la mezcla para el puzzle e invierte paso a paso la secuencia.
 */
export function solveByInvertingScramble(puzzleKey, scrambleText) {
  const key = normalizePuzzleKey(puzzleKey);
  const parsed = parseNotationSequence(key, scrambleText);
  if (!parsed.valid) {
    return {
      valid: false,
      errors: parsed.errors,
    };
  }
  const alg = parsed.inverseAlg;
  const moves = alg ? alg.trim().split(/\s+/).filter(Boolean) : [];
  const moveDescriptions = moves.map((m) => ({
    token: m,
    stageId: 'undo',
    stageTitle: 'Deshacer mezcla paso a paso',
    ...describeMove(key, m),
  }));

  return {
    valid: true,
    puzzle: key,
    scramble: parsed.normalizedAlg,
    alg,
    moves,
    stages: [{ id: 'undo', title: 'Deshacer mezcla paso a paso', alg }],
    moveDescriptions,
  };
}
