// Solver de la cruz (en la cara D) para la verificación.
// Recorre TODOS los estados posibles de las 4 aristas de la cruz (búsqueda en
// anchura desde la cruz armada) y guarda a cuántos movimientos está cada uno.
// Así se puede saber la solución óptima de cualquier cruz y el máximo posible.
import { Alg } from 'cubing/alg';

const CROSS = [4, 5, 6, 7]; // DF DR DB DL
const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
const MOVES = FACES.flatMap((f) => [f, `${f}'`, `${f}2`]);

// Estado: para cada arista de la cruz, posición (0-11) y orientación (0-1) → número 0-23.
const encode = (slots) => slots.reduce((acc, s) => acc * 24 + s, 0);

export async function createCrossSolver(kpuzzle) {
  // Tabla de cada movimiento: a dónde va la arista que está en cada posición.
  const tables = MOVES.map((move) => {
    const t = kpuzzle.moveToTransformation(move).transformationData.EDGES;
    const to = new Array(12);
    const flip = new Array(12);
    for (let i = 0; i < 12; i++) {
      to[t.permutation[i]] = i; // la pieza de la posición permutation[i] termina en i
      flip[t.permutation[i]] = t.orientationDelta[i];
    }
    return { to, flip };
  });

  const apply = (slots, m) =>
    slots.map((s) => {
      const pos = s >> 1;
      const ori = s & 1;
      return tables[m].to[pos] * 2 + ((ori + tables[m].flip[pos]) % 2);
    });

  // Búsqueda en anchura desde la cruz resuelta.
  const dist = new Int8Array(24 ** 4).fill(-1);
  const solved = CROSS.map((p) => p * 2);
  dist[encode(solved)] = 0;
  let frontier = [solved];
  let depth = 0;
  let count = 1;
  while (frontier.length) {
    const next = [];
    for (const slots of frontier) {
      for (let m = 0; m < MOVES.length; m++) {
        const n = apply(slots, m);
        const code = encode(n);
        if (dist[code] === -1) {
          dist[code] = depth + 1;
          next.push(n);
        }
      }
    }
    if (next.length) depth++;
    count += next.length;
    frontier = next;
  }

  // Estado de la cruz en un patrón de KPuzzle.
  function stateOf(pattern) {
    const e = pattern.patternData.EDGES;
    return CROSS.map((piece) => {
      const pos = e.pieces.indexOf(piece);
      return pos * 2 + e.orientation[pos];
    });
  }

  return {
    maxDepth: depth,
    states: count,
    // Movimientos óptimos para armar la cruz del patrón.
    optimal: (pattern) => dist[encode(stateOf(pattern))],
    isSolved: (pattern) => dist[encode(stateOf(pattern))] === 0,
    // Una solución óptima (sigue la tabla bajando de a un movimiento).
    solve(pattern, prefer = MOVES) {
      let slots = stateOf(pattern);
      const out = [];
      while (dist[encode(slots)] > 0) {
        const d = dist[encode(slots)];
        const m = prefer.map((name) => MOVES.indexOf(name)).find((i) => dist[encode(apply(slots, i))] === d - 1);
        out.push(MOVES[m]);
        slots = apply(slots, m);
      }
      return new Alg(out.join(' ')).toString();
    },
  };
}
