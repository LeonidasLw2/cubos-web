// Herramientas para revisar estados del 4x4 con el KPuzzle de cubing.js.
//
// En el KPuzzle de 4x4 hay 8 esquinas, 24 "alas" (cada arista doble del 4x4 son
// dos alas) y 24 centros. Los 4 centros de un mismo color valen lo mismo (el
// estado guarda el color, no la pieza), así que comparar estados ya compara por
// colores visibles. Las alas sí son piezas distintas.
//
// Todo se mira como se ve en la página: amarillo arriba (después de z2).
import { Alg } from 'cubing/alg';
import { KPattern } from 'cubing/kpuzzle';
import { cube3x3x3, puzzles } from 'cubing/puzzles';

export const kp4 = await puzzles['4x4x4'].kpuzzle();
const DEFAULT = kp4.defaultPattern();
export const SOLVED4 = DEFAULT.applyAlg('z2'); // resuelto, con el amarillo arriba

const OUTER = ['U', 'D', 'L', 'R', 'F', 'B'];
const slotPerm = (move) => DEFAULT.applyAlg(move).patternData.EDGES.pieces;

// Parejas de alas: las que ningún giro de cara exterior separa nunca.
// Se calculan probando qué partición en pares se mantiene con los 6 giros.
function wingPairs() {
  const perms = OUTER.map(slotPerm);
  for (let b = 1; b < 24; b++) {
    const pair = new Map();
    const stack = [[0, b]];
    let ok = true;
    while (stack.length && ok) {
      const [x, y] = stack.pop();
      if (pair.has(x) || pair.has(y)) {
        ok = pair.get(x) === y;
        continue;
      }
      pair.set(x, y).set(y, x);
      for (const p of perms) stack.push([p.indexOf(x), p.indexOf(y)]);
    }
    if (ok && pair.size === 24) return pair;
  }
  throw new Error('no se encontraron las parejas de alas');
}
export const PARTNER = wingPairs();

// Nombre de cada arista doble según qué caras la mueven. Los lugares del KPuzzle
// son fijos en el espacio: girar el cubo entero (z2) cambia qué pieza hay en cada
// lugar, no el nombre del lugar.
const ORDER = 'UDFBRL';
export const DEDGES = {}; // 'UF' → [ala, ala] (lugares)
for (const [a, b] of PARTNER) {
  if (a > b) continue;
  const faces = OUTER.filter((m) => slotPerm(m)[a] !== a);
  const name = faces.sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).join('');
  DEDGES[name] = [a, b];
}

// Centros por cara (lugares 4f..4f+3; caras U L F R B D).
const FACE_INDEX = { U: 0, L: 1, F: 2, R: 3, B: 4, D: 5 };
const orbit = (p, name) => p.patternData[name];

export const centerDone = (p, face) => {
  const f = FACE_INDEX[face];
  return [0, 1, 2, 3].every((k) => orbit(p, 'CENTERS').pieces[4 * f + k] === orbit(SOLVED4, 'CENTERS').pieces[4 * f + k]);
};
export const centersDone = (p, faces = 'ULFRBD') => [...faces].every((f) => centerDone(p, f));
// Cuántos centros de una cara tienen el color de esa cara.
export const centerCount = (p, face) => {
  const f = FACE_INDEX[face];
  return [0, 1, 2, 3].filter((k) => orbit(p, 'CENTERS').pieces[4 * f + k] === orbit(SOLVED4, 'CENTERS').pieces[4 * f + k]).length;
};

// Cuántos centros del color de la cara `color` hay en la cara `face`.
export const colorCount = (p, face, color) => {
  const target = orbit(SOLVED4, 'CENTERS').pieces[4 * FACE_INDEX[color]];
  return [0, 1, 2, 3].filter((k) => orbit(p, 'CENTERS').pieces[4 * FACE_INDEX[face] + k] === target).length;
};

const wingOk = (p, s) =>
  orbit(p, 'EDGES').pieces[s] === orbit(SOLVED4, 'EDGES').pieces[s] &&
  orbit(p, 'EDGES').orientation[s] === orbit(SOLVED4, 'EDGES').orientation[s];
// Arista doble en su lugar y bien orientada.
export const dedgeDone = (p, name) => DEDGES[name].every((s) => wingOk(p, s));
// ¿Las dos alas que están en ese lugar son pareja? (arista "emparejada")
export const dedgePaired = (p, name) => {
  const [a, b] = DEDGES[name];
  const e = orbit(p, 'EDGES').pieces;
  return PARTNER.get(e[a]) === e[b];
};
export const unpaired = (p) => Object.keys(DEDGES).filter((n) => !dedgePaired(p, n)).sort();
export const unpairedCount = (p) => unpaired(p).length;
// ¿Las dos mitades de la arista que va en `name` están separadas (en lugares distintos)?
export const dedgeSplit = (p, name) => {
  const e = orbit(p, 'EDGES').pieces;
  const [sa, sb] = DEDGES[name].map((s) => e.indexOf(orbit(SOLVED4, 'EDGES').pieces[s]));
  return PARTNER.get(sa) !== sb;
};

// Arma un estado a mano: resuelto, salvo las alas indicadas ({ lugar: [pieza de qué lugar, orientación] }).
export function withWings(changes) {
  const data = JSON.parse(JSON.stringify(SOLVED4.patternData));
  const solved = orbit(SOLVED4, 'EDGES');
  for (const [slot, [from, ori]] of Object.entries(changes)) {
    data.EDGES.pieces[slot] = solved.pieces[from];
    data.EDGES.orientation[slot] = ori;
  }
  return new KPattern(kp4, data);
}
export const reduced = (p) => centersDone(p) && unpairedCount(p) === 0;

// Estado que muestra la tarjeta: el que el algoritmo resuelve.
export const shown4 = (alg) => SOLVED4.applyAlg(new Alg(alg).invert());

const ROTATIONS = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((a) => ['', 'y', 'y2', "y'"].map((b) => `${a} ${b}`.trim()));
const AUFS = ['', 'U', 'U2', "U'"];
// Resuelto (por colores), admitiendo un giro final de U y el cubo girado entero.
export const solved4 = (p, { auf = false } = {}) =>
  (auf ? AUFS : ['']).some((u) => ROTATIONS.some((r) => {
    const alg = `${u} ${r}`.trim();
    return (alg ? p.applyAlg(alg) : p).isIdentical(SOLVED4);
  }));

// ---------- Paridad: ver el 4x4 reducido como un 3x3 ----------
//
// Con los centros hechos y las aristas emparejadas, el 4x4 "es" un 3x3. Para
// saber si ese 3x3 es posible (sin paridad) se traduce cada arista doble a la
// arista del 3x3: qué pieza es y si está dada vuelta. La tabla de traducción se
// arma haciendo los mismos giros exteriores en un 4x4 y en un 3x3 a la vez.
const kp3 = await cube3x3x3.kpuzzle();
const SOLVED3 = kp3.defaultPattern();
const EDGE3 = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
const edge3Index = (name) => EDGE3.findIndex((e) => [...e].sort().join('') === [...name].sort().join(''));
const SLOT_TO_EDGE3 = new Map(Object.entries(DEDGES).flatMap(([n, [a, b]]) => [[a, edge3Index(n)], [b, edge3Index(n)]]));

const TABLE = new Map(); // "lugar,ala,orientación" → [pieza del 3x3, orientación del 3x3]
{
  const moves = OUTER.flatMap((f) => [f, `${f}'`, `${f}2`]);
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let run = 0; run < 400; run++) {
    let a = DEFAULT;
    let b = SOLVED3;
    for (let i = 0; i < 25; i++) {
      const m = moves[Math.floor(rand() * moves.length)];
      a = a.applyAlg(m);
      b = b.applyAlg(m);
      const e4 = orbit(a, 'EDGES');
      const e3 = orbit(b, 'EDGES');
      for (let s = 0; s < 24; s++) {
        const k = SLOT_TO_EDGE3.get(s);
        TABLE.set(`${s},${e4.pieces[s]},${e4.orientation[s]}`, [e3.pieces[k], e3.orientation[k]]);
      }
    }
  }
}

const parity = (perm) => {
  const seen = new Set();
  let swaps = 0;
  for (let i = 0; i < perm.length; i++) {
    let j = i;
    let len = 0;
    while (!seen.has(j)) {
      seen.add(j);
      j = perm[j];
      len++;
    }
    if (len) swaps += len - 1;
  }
  return swaps % 2;
};

// Devuelve el 3x3 equivalente de un 4x4 reducido (en el marco del KPuzzle), o null.
export function as3x3(p) {
  if (!reduced(p)) return null;
  const q = p.applyAlg('z2'); // de vuelta al marco del KPuzzle (blanco arriba)
  const e4 = orbit(q, 'EDGES');
  const pieces = Array(12);
  const orientation = Array(12);
  for (const [a, b] of Object.values(DEDGES)) {
    // Las dos alas tienen que decir lo mismo (si no, el estado no es posible).
    const [hitA, hitB] = [a, b].map((s) => TABLE.get(`${s},${e4.pieces[s]},${e4.orientation[s]}`));
    if (!hitA || !hitB || hitA.join() !== hitB.join()) return null;
    [pieces[SLOT_TO_EDGE3.get(a)], orientation[SLOT_TO_EDGE3.get(a)]] = hitA;
  }
  return { pieces, orientation, corners: orbit(q, 'CORNERS') };
}

// Qué paridades tiene un 4x4 reducido: { oll, pll } (true = la tiene).
export function parities(p) {
  const c = as3x3(p);
  if (!c) return null;
  const flips = c.orientation.reduce((n, o) => n + o, 0) % 2;
  return { oll: flips === 1, pll: parity(c.pieces) !== parity(c.corners.pieces) };
}

// ¿La tabla está completa? (cada ala en cada lugar, con su orientación posible)
export const tableSize = TABLE.size;
