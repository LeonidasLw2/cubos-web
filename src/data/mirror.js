// Modelo geométrico del Mirror Cube (Mirror Blocks). Puro: sin DOM ni cubing.js.
//
// Idea: el mecanismo es un 3x3 normal. En coordenadas del mecanismo el núcleo está en el
// origen y los cortes internos están en ±0,5 en cada eje (la capa del medio mide 1).
// Lo único distinto es el grosor de las capas EXTERIORES: como cambia en cada eje,
// resuelto forma un cubo, pero al girar una capa sus piezas sobresalen o quedan hundidas.
//
// Ejes: x = hacia R, y = hacia U, z = hacia F (como en cubing.js).

// Grosor de las 3 capas de cada eje: [lado negativo, medio, lado positivo].
// Las tres sumas dan 3, así el estado resuelto es un cubo de lado 3.
export const MIRROR_LAYERS = Object.freeze({
  x: Object.freeze([1.45, 1, 0.55]), // L, M, R
  y: Object.freeze([1.3, 1, 0.7]), // D, E, U
  z: Object.freeze([0.65, 1, 1.35]), // B, S, F
});

export const AXES = ['x', 'y', 'z'];
const AXIS_INDEX = { x: 0, y: 1, z: 2 };

// Normal (dirección hacia afuera) de cada cara.
export const FACE_NORMALS = Object.freeze({
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
});

// Orden de las posiciones (slots) de cada órbita en el KPuzzle 3x3 de cubing.js.
// Comprobado en tests/mirror.test.js contra una simulación independiente.
export const SLOT_NAMES = Object.freeze({
  EDGES: ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'],
  CORNERS: ['UFR', 'URB', 'UBL', 'ULF', 'DRF', 'DFL', 'DLB', 'DBR'],
  CENTERS: ['U', 'L', 'F', 'R', 'B', 'D'],
});
export const ORBITS = ['CENTERS', 'EDGES', 'CORNERS'];

// ---------- Álgebra mínima (matrices 3x3 de enteros) ----------

const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const addVec = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export function mulMatVec(m, v) {
  return [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
}

export function mulMat(a, b) {
  return a.map((row) => [0, 1, 2].map((j) => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
}

// Matriz que lleva u1→v1 y u2→v2 (vectores unitarios perpendiculares, alineados a los ejes).
function rotationFromPairs(u1, u2, v1, v2) {
  const u3 = cross(u1, u2);
  const v3 = cross(v1, v2);
  // R = [v1 v2 v3] · [u1 u2 u3]^T
  const out = [];
  for (let i = 0; i < 3; i++) {
    out.push([0, 1, 2].map((j) => v1[i] * u1[j] + v2[i] * u2[j] + v3[i] * u3[j]));
  }
  return out;
}

// Giro de un cuarto de vuelta (o varios) alrededor de un eje, regla de la mano derecha.
export function quarterTurnMatrix(axis, quarterTurns) {
  const q = ((quarterTurns % 4) + 4) % 4;
  const c = [1, 0, -1, 0][q];
  const s = [0, 1, 0, -1][q];
  if (axis === 'x') return [[1, 0, 0], [0, c, -s], [0, s, c]];
  if (axis === 'y') return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

// Rotación "más corta" que lleva la normal a hacia b (para los centros).
function rotationBetweenNormals(a, b) {
  if (a.every((v, i) => v === b[i])) return IDENTITY;
  if (dot(a, b) === -1) {
    // Opuestas: media vuelta alrededor de un eje perpendicular fijo.
    const axis = a[0] !== 0 ? 'y' : 'x';
    return quarterTurnMatrix(axis, 2);
  }
  const n = cross(a, b); // eje del giro de 90°
  const axis = AXES[n.findIndex((v) => v !== 0)];
  const sign = n[AXIS_INDEX[axis]];
  return quarterTurnMatrix(axis, sign);
}

// ---------- Geometría de las capas ----------

// Intervalo que ocupa la capa `coord` (-1, 0 o 1) en el eje dado.
export function layerInterval(axis, coord) {
  const [neg, , pos] = MIRROR_LAYERS[axis];
  if (coord < 0) return [-0.5 - neg, -0.5];
  if (coord > 0) return [0.5, 0.5 + pos];
  return [-0.5, 0.5];
}

// Caja del cubo resuelto y su centro (útil para apuntar la cámara).
export const MIRROR_SOLVED_BOUNDS = Object.freeze(
  Object.fromEntries(AXES.map((a) => [a, [layerInterval(a, -1)[0], layerInterval(a, 1)[1]]])),
);
export const MIRROR_CENTER = Object.freeze(AXES.map((a) => (MIRROR_SOLVED_BOUNDS[a][0] + MIRROR_SOLVED_BOUNDS[a][1]) / 2));

const slotFaces = (name) => name.split('').map((f) => FACE_NORMALS[f]);
const slotCoord = (name) => slotFaces(name).reduce(addVec, [0, 0, 0]);

// Caja de una pieza en su lugar de origen (estado resuelto).
function homeBox(name) {
  const c = slotCoord(name);
  const intervals = AXES.map((a, i) => layerInterval(a, c[i]));
  return {
    center: intervals.map(([lo, hi]) => (lo + hi) / 2),
    dims: intervals.map(([lo, hi]) => hi - lo),
  };
}

// Rotación de una pieza a partir de su lugar actual y su orientación en el KPuzzle.
// Convención de cubing.js (comprobada con los tests): la etiqueta j del slot muestra
// la etiqueta (j + o) mod n de la pieza.
function pieceRotation(orbit, homeName, slotName, orientation) {
  const home = slotFaces(homeName);
  const slot = slotFaces(slotName);
  if (orbit === 'CENTERS') return rotationBetweenNormals(home[0], slot[0]);
  const n = home.length;
  const at = (k) => slot[(((k - orientation) % n) + n) % n];
  return rotationFromPairs(home[0], home[1], at(0), at(1));
}

/**
 * Calcula las 26 piezas del Mirror para un estado del KPuzzle 3x3.
 * patternData: el objeto `pattern.patternData` de cubing.js ({ EDGES, CORNERS, CENTERS }).
 * Devuelve [{ id, orbit, home, slot, coord, rotation, position, dims, min, max }].
 * - coord: posición en la grilla del mecanismo (-1, 0, 1 por eje).
 * - position / dims / min / max: la caja que ocupa la pieza (siempre alineada a los ejes).
 */
export function piecesFromPattern(patternData) {
  const out = [];
  for (const orbit of ORBITS) {
    const names = SLOT_NAMES[orbit];
    const data = patternData?.[orbit];
    for (let s = 0; s < names.length; s++) {
      const p = data?.pieces?.[s] ?? s;
      const o = orbit === 'CENTERS' ? 0 : (data?.orientation?.[s] ?? 0);
      const homeName = names[p];
      const rotation = pieceRotation(orbit, homeName, names[s], o);
      out.push(buildPiece(orbit, p, homeName, names[s], rotation));
    }
  }
  return out;
}

// Arma la caja de una pieza a partir de su rotación (la usan el modelo y los tests).
export function buildPiece(orbit, index, homeName, slotName, rotation) {
  const box = homeBox(homeName);
  const position = mulMatVec(rotation, box.center);
  const absR = rotation.map((row) => row.map(Math.abs));
  const dims = mulMatVec(absR, box.dims);
  return {
    id: `${orbit}:${index}`,
    orbit,
    home: homeName,
    slot: slotName,
    coord: mulMatVec(rotation, slotCoord(homeName)),
    rotation,
    position,
    dims,
    min: position.map((v, i) => v - dims[i] / 2),
    max: position.map((v, i) => v + dims[i] / 2),
  };
}

export function solvedPieces() {
  return piecesFromPattern(null);
}

// ---------- Forma: ¿es un cubo plano? ----------

const round = (v) => {
  const r = Math.round(v * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};

/**
 * Para cada cara (U, D, R, L, F, B), los distintos niveles a los que llegan las caras
 * exteriores de sus piezas. Una cara es plana si tiene un solo nivel.
 */
export function faceLevels(pieces) {
  const out = {};
  for (const [face, normal] of Object.entries(FACE_NORMALS)) {
    const i = normal.findIndex((v) => v !== 0);
    const sign = normal[i];
    const levels = new Set();
    for (const p of pieces) {
      if (p.coord[i] !== sign) continue;
      levels.add(round(sign > 0 ? p.max[i] : p.min[i]));
    }
    out[face] = [...levels].sort((a, b) => a - b);
  }
  return out;
}

// Cubo perfecto: las 6 caras planas y las 3 medidas iguales.
export function isPerfectCube(pieces) {
  const levels = faceLevels(pieces);
  if (Object.values(levels).some((l) => l.length !== 1)) return false;
  const size = AXES.map((_, i) => {
    const lo = Math.min(...pieces.map((p) => p.min[i]));
    const hi = Math.max(...pieces.map((p) => p.max[i]));
    return round(hi - lo);
  });
  return size[0] === size[1] && size[1] === size[2];
}

// ---------- Movimientos → giro de capas ----------

// Para cada letra: eje, capas que gira (-1, 0, 1) y sentido del cuarto de vuelta
// según la regla de la mano derecha (R es horario mirando la cara R = -90° en x).
const MOVE_TABLE = {
  R: { axis: 'x', layers: [1], dir: -1 },
  L: { axis: 'x', layers: [-1], dir: 1 },
  U: { axis: 'y', layers: [1], dir: -1 },
  D: { axis: 'y', layers: [-1], dir: 1 },
  F: { axis: 'z', layers: [1], dir: -1 },
  B: { axis: 'z', layers: [-1], dir: 1 },
  M: { axis: 'x', layers: [0], dir: 1 }, // sigue a L
  E: { axis: 'y', layers: [0], dir: 1 }, // sigue a D
  S: { axis: 'z', layers: [0], dir: -1 }, // sigue a F
  x: { axis: 'x', layers: [-1, 0, 1], dir: -1 },
  y: { axis: 'y', layers: [-1, 0, 1], dir: -1 },
  z: { axis: 'z', layers: [-1, 0, 1], dir: -1 },
};

/**
 * Traduce un movimiento de 3x3 (R, U', F2, Rw, r, M, x2...) al giro de capas.
 * Devuelve { axis, layers, quarterTurns } o null si no es un movimiento válido de 3x3.
 */
export function layerTurnForMove(token) {
  const m = /^([URFDLB])(w?)(\d*)('?)$|^([urfdlb])(\d*)('?)$|^([MESxyz])(\d*)('?)$/.exec(String(token).trim());
  if (!m) return null;
  let family;
  let wide = false;
  let amountStr;
  let prime;
  if (m[1]) [family, wide, amountStr, prime] = [m[1], m[2] === 'w', m[3], m[4]];
  else if (m[5]) [family, wide, amountStr, prime] = [m[5].toUpperCase(), true, m[6], m[7]];
  else [family, amountStr, prime] = [m[8], m[9], m[10]];
  const amount = amountStr ? Number(amountStr) : 1;
  if (!Number.isInteger(amount) || amount < 1 || amount > 3) return null;
  const base = MOVE_TABLE[family];
  const layers = wide ? (base.layers[0] > 0 ? [0, 1] : [-1, 0]) : base.layers;
  return { axis: base.axis, layers, quarterTurns: base.dir * amount * (prime ? -1 : 1) };
}

// ¿La pieza está en una de las capas que gira?
export function pieceInTurn(piece, turn) {
  return turn.layers.includes(piece.coord[AXIS_INDEX[turn.axis]]);
}

// ---------- Red 2D (vista desplegada) ----------

// Cómo se mira cada cara desde afuera: vector "derecha" (u) y "arriba" (v) en pantalla.
export const NET_FACES = Object.freeze({
  U: { u: [1, 0, 0], v: [0, 0, -1], col: 1, row: 0 },
  L: { u: [0, 0, 1], v: [0, 1, 0], col: 0, row: 1 },
  F: { u: [1, 0, 0], v: [0, 1, 0], col: 1, row: 1 },
  R: { u: [0, 0, -1], v: [0, 1, 0], col: 2, row: 1 },
  B: { u: [-1, 0, 0], v: [0, 1, 0], col: 3, row: 1 },
  D: { u: [1, 0, 0], v: [0, 0, 1], col: 1, row: 2 },
});

/**
 * Rectángulos que se ven al mirar cada cara de frente, con las medidas reales de las piezas.
 * Devuelve { U: [{ id, u0, u1, v0, v1, depth }], ... } donde depth es cuánto sobresale (+)
 * o se hunde (-) esa cara respecto del cubo resuelto.
 */
export function faceNet(pieces) {
  const out = {};
  for (const [face, view] of Object.entries(NET_FACES)) {
    const normal = FACE_NORMALS[face];
    const i = normal.findIndex((v) => v !== 0);
    const sign = normal[i];
    const solvedLevel = sign > 0 ? MIRROR_SOLVED_BOUNDS[AXES[i]][1] : -MIRROR_SOLVED_BOUNDS[AXES[i]][0];
    const project = (vec, p) => {
      const j = vec.findIndex((v) => v !== 0);
      const a = p.min[j] * vec[j];
      const b = p.max[j] * vec[j];
      return [Math.min(a, b), Math.max(a, b)];
    };
    out[face] = pieces
      .filter((p) => p.coord[i] === sign)
      .map((p) => {
        const [u0, u1] = project(view.u, p);
        const [v0, v1] = project(view.v, p);
        const level = sign > 0 ? p.max[i] : -p.min[i];
        return { id: p.id, u0, u1, v0, v1, depth: round(level - solvedLevel) };
      });
  }
  return out;
}

// Límites de cada cara resuelta en coordenadas (u, v) de la red.
export function netFaceBounds(face) {
  const view = NET_FACES[face];
  const range = (vec) => {
    const j = vec.findIndex((v) => v !== 0);
    const [lo, hi] = MIRROR_SOLVED_BOUNDS[AXES[j]];
    const a = lo * vec[j];
    const b = hi * vec[j];
    return [Math.min(a, b), Math.max(a, b)];
  };
  return { u: range(view.u), v: range(view.v) };
}
