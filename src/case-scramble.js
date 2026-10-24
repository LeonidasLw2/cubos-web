// Mezclas del entrenador. Funciona igual en el navegador y en Node (verify-algs):
// los puzzles y el solver se pasan como parámetros.
//
// Mezcla real: se arma el estado del caso (con las partes que no importan al azar),
// se hacen unos giros al azar y el solver de cubing.js encuentra el resto. Así cada
// mezcla es distinta y no es el algoritmo al revés.
import { Alg } from 'cubing/alg';

export const AUFS = ['', 'U', 'U2', "U'"];
const DS = ['', 'D', 'D2', "D'"];
const FACES = ['U', 'D', 'R', 'L', 'F', 'B'];
const OPPOSITE = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };

const body = (alg) => alg.replace(/^\([^)]*\)\s*/, ''); // el "(U2)" del principio es solo para la foto
const invert = (alg) => new Alg(body(alg)).invert().toString();
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// Mezcla simple (el algoritmo al revés y un giro de U): respaldo si el solver falla.
export function caseScramble(alg, auf = '') {
  return tidy(`${invert(alg)} ${auf}`);
}

// Junta giros seguidos de la misma cara (R R → R2, R R' → nada) y escribe U2 en vez de U2'.
export function tidy(text) {
  const moves = [];
  for (const m of text.split(/\s+/).filter(Boolean)) {
    const face = m.replace(/['2]/g, '');
    const amount = m.endsWith("'") && !m.includes('2') ? 3 : m.includes('2') ? 2 : 1;
    // La misma cara justo antes, o dos antes con la opuesta en el medio (U D U → U2 D).
    const prev = moves.at(-1);
    const last =
      prev?.face === face ? prev : prev && OPPOSITE[prev.face] === face && moves.at(-2)?.face === face ? moves.at(-2) : null;
    if (last && /^[UDRLFB]$/.test(face)) {
      last.amount = (last.amount + amount) % 4;
      if (!last.amount) moves.splice(moves.lastIndexOf(last), 1);
    } else moves.push({ face, amount, raw: m });
  }
  return moves
    .map(({ face, amount, raw }) => (/^[UDRLFB]$/.test(face) ? face + ['', '', '2', "'"][amount] : raw))
    .join(' ');
}

// Giros al azar (sin repetir cara ni hacer dos caras opuestas seguidas de más).
function randomMoves(n, rng, faces = FACES) {
  const out = [];
  while (out.length < n) {
    const f = pick(faces, rng);
    const last = out.at(-1)?.[0];
    if (f === last || (out.length > 1 && f === OPPOSITE[last] && out.at(-2)[0] === f)) continue;
    out.push(f + pick(['', "'", '2'], rng));
  }
  return out.join(' ');
}

// Partes del cubo que no importan para cada grupo, al azar.
// pools: { pll: [algs], oll: [algs], pbl: [algs] }
function randomContext(setId, rng, pools) {
  switch (setId) {
    case 'oll': // cualquier permutación de la última capa
      return `${pick(AUFS, rng)} ${pick(['', ...pools.pll], rng)}`;
    case 'f2l': // la última capa cualquiera
      return `${pick(['', ...pools.pll], rng)} ${pick(AUFS, rng)} ${pick(['', ...pools.oll], rng)} ${pick(AUFS, rng)}`;
    case 'cmll': {
      // aristas de LSE al azar, con los centros en su lugar (M … M' se compensa)
      const parts = [];
      for (let i = 0; i < 3; i++) {
        const m = pick(['M', "M'", 'M2'], rng);
        parts.push(`${m} ${pick(['U', "U'", 'U2'], rng)} ${new Alg(m).invert()}`);
      }
      return parts.join(' ');
    }
    case 'oll2': // la cara de abajo hecha pero permutada al azar
      return `${pick(['', ...pools.pbl], rng)} ${pick(DS, rng)}`;
    case 'pbl':
      return `${pick(DS, rng)}`;
    default:
      return pick(AUFS, rng);
  }
}

// Devuelve { scramble, real }: real = false si se usó el respaldo (algoritmo al revés).
// opts: { kpuzzle, solve(pattern) → Promise<Alg>, rng, pools, extraMoves, faces }
// (faces: caras de los giros al azar; en 2x2 se usan R, U y F, como en las mezclas oficiales)
export async function realCaseScramble(setId, alg, { kpuzzle, solve, rng = Math.random, pools, extraMoves = 5, faces = FACES }) {
  const solved = kpuzzle.defaultPattern();
  const setup = tidy(`${randomContext(setId, rng, pools)} ${invert(alg)} ${pick(AUFS, rng)}`);
  const target = solved.applyAlg(setup);
  try {
    const prefix = randomMoves(extraMoves, rng, faces);
    // Estado desde el que el solver tiene que llegar al caso: target, deshecho, y luego el prefijo.
    const from = solved.applyAlg(new Alg(setup).invert()).applyAlg(prefix);
    const rest = (await solve(from)).toString();
    const scramble = tidy(`${prefix} ${rest}`);
    if (sameState(solved.applyAlg(scramble), target)) return { scramble, real: true };
  } catch {
    // sin solver (o falló): respaldo
  }
  return { scramble: tidy(setup), real: false };
}

// Esquinas y aristas iguales (los centros no se mueven con giros de caras).
function sameState(a, b) {
  return ['CORNERS', 'EDGES'].every((orbit) => {
    const x = a.patternData[orbit];
    const y = b.patternData[orbit];
    if (!x) return true;
    return x.pieces.every((p, i) => p === y.pieces[i] && x.orientation[i] === y.orientation[i]);
  });
}
