// Verifica TODOS los algoritmos de los métodos con el KPuzzle de cubing.js.
// Uso: npm run verify-algs
//
// Para cada caso: se parte del caso, se aplica el algoritmo y se comprueba que
// el objetivo del paso queda resuelto, admitiendo un giro final de U (AUF).
//   · PLL: el caso sale de una referencia independiente (pll-reference.js).
//   · Principiante: el caso es el que muestra la tarjeta (el inverso del
//     algoritmo), y se comprueba de forma independiente que coincide con la
//     descripción (dónde está la pieza y hacia dónde mira el blanco) y que el
//     algoritmo no rompe lo armado en los pasos anteriores.
import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import { BEGINNER } from '../src/data/beginner.js';
import { PLL } from '../src/data/pll.js';
import { PLL_REFERENCE } from './pll-reference.js';

const kpuzzle = await cube3x3x3.kpuzzle();
const SOLVED = kpuzzle.defaultPattern();
const AUFS = ['', 'U', 'U2', "U'"];

// Numeración de piezas del 3x3 en cubing.js (posición = índice).
const EDGES = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
const CORNERS = ['UFR', 'URB', 'UBL', 'ULF', 'DRF', 'DFL', 'DLB', 'DBR'];
const range = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
const LL = range(0, 4);
const CROSS = range(4, 8);
const FIRST_CORNERS = range(4, 8);
const MIDDLE = range(8, 12);

// ---------- Lectura del estado ----------

const orbit = (p, name) => p.patternData[name];
const edgeOk = (p, i) => orbit(p, 'EDGES').pieces[i] === i && orbit(p, 'EDGES').orientation[i] === 0;
const cornerOk = (p, i) => orbit(p, 'CORNERS').pieces[i] === i && orbit(p, 'CORNERS').orientation[i] === 0;
const centersOk = (p) => orbit(p, 'CENTERS').pieces.every((piece, i) => piece === i);
const count = (list, fn) => list.filter(fn).length;

// Dónde está una pieza y hacia qué cara mira su sticker principal
// (el blanco en las piezas de la primera capa; el del frente en FR/FL).
function locate(p, name) {
  const isEdge = EDGES.includes(name);
  const names = isEdge ? EDGES : CORNERS;
  const o = orbit(p, isEdge ? 'EDGES' : 'CORNERS');
  const pos = o.pieces.indexOf(names.indexOf(name));
  const ori = o.orientation[pos];
  const facelet = isEdge ? ori : (3 - ori) % 3;
  return { at: names[pos], facing: names[pos][facelet] };
}

// Dos piezas de la última capa están bien "entre sí" (como los faros) si las dos
// están orientadas y desplazadas la misma cantidad de lugares desde su casa.
// (Las posiciones 0-3 de aristas y esquinas siguen el orden en que gira U.)
function sameShift(p, orbitName, a, b) {
  const o = orbit(p, orbitName);
  const shift = (i) => (o.pieces[i] - i + 4) % 4;
  return o.orientation[a] === 0 && o.orientation[b] === 0 && shift(a) === shift(b);
}

// Algún AUF final cumple la condición.
const withAUF = (p, cond) => AUFS.some((auf) => cond(auf ? p.applyAlg(auf) : p));

// ---------- Condiciones de cada paso ----------

const f2l = (p) => CROSS.every((i) => edgeOk(p, i)) && FIRST_CORNERS.every((i) => cornerOk(p, i)) && MIDDLE.every((i) => edgeOk(p, i));
const llEdgesOriented = (p) => LL.every((i) => orbit(p, 'EDGES').orientation[i] === 0);
const llOriented = (p) => llEdgesOriented(p) && LL.every((i) => orbit(p, 'CORNERS').orientation[i] === 0);
const llCornersPlaced = (p) => withAUF(p, (q) => LL.every((i) => cornerOk(q, i)));
const solvedAUF = (p) => withAUF(p, (q) => q.isIdentical(SOLVED));

// before: lo que ya tiene que estar armado en el caso (el algoritmo no lo puede romper).
// goal: lo que tiene que quedar armado después del algoritmo (+ AUF).
const STEPS = {
  cross: {
    before: [['3 aristas de la cruz armadas', (p) => count(CROSS, (i) => edgeOk(p, i)) >= 3]],
    goal: [['cruz', (p) => CROSS.every((i) => edgeOk(p, i))]],
  },
  'first-layer': {
    before: [
      ['cruz', (p) => CROSS.every((i) => edgeOk(p, i))],
      ['3 esquinas abajo armadas', (p) => count(FIRST_CORNERS, (i) => cornerOk(p, i)) >= 3],
    ],
    goal: [['primera capa', (p) => CROSS.every((i) => edgeOk(p, i)) && FIRST_CORNERS.every((i) => cornerOk(p, i))]],
  },
  'second-layer': {
    before: [
      ['primera capa', (p) => CROSS.every((i) => edgeOk(p, i)) && FIRST_CORNERS.every((i) => cornerOk(p, i))],
      ['3 aristas del medio armadas', (p) => count(MIDDLE, (i) => edgeOk(p, i)) >= 3],
    ],
    goal: [['dos primeras capas (F2L)', f2l]],
  },
  'yellow-cross': {
    before: [['F2L', f2l]],
    goal: [['F2L', f2l], ['cruz amarilla', llEdgesOriented]],
  },
  'yellow-face': {
    before: [['F2L', f2l], ['cruz amarilla', llEdgesOriented]],
    goal: [['F2L', f2l], ['cara amarilla', llOriented]],
  },
  'll-corners': {
    before: [['F2L', f2l], ['cara amarilla', llOriented]],
    goal: [['F2L', f2l], ['cara amarilla', llOriented], ['esquinas en su lugar', llCornersPlaced]],
  },
  'll-edges': {
    before: [['F2L', f2l], ['cara amarilla', llOriented], ['esquinas en su lugar', llCornersPlaced]],
    goal: [['cubo resuelto', solvedAUF]],
  },
  pll: {
    before: [['F2L', f2l], ['última capa orientada (OLL)', llOriented]],
    goal: [['cubo resuelto', solvedAUF]],
  },
};

// ---------- Descripciones de los casos del principiante ----------

const isAt = (piece, at, facing) => [
  `${piece} en ${at} mirando a ${facing}`,
  (p) => {
    const l = locate(p, piece);
    return l.at === at && l.facing === facing;
  },
];
const llOrientedEdges = (list) => [
  `aristas amarillas arriba: ${list.join(', ') || 'ninguna'}`,
  (p) => LL.filter((i) => orbit(p, 'EDGES').orientation[i] === 0).map((i) => EDGES[i]).join() === list.join(),
];
const llOrientedCorners = (list) => [
  `esquinas amarillas arriba: ${list.join(', ')}`,
  (p) => LL.filter((i) => orbit(p, 'CORNERS').orientation[i] === 0).map((i) => CORNERS[i]).join() === list.join(),
];

const EXPECT = {
  'cross-up': [isAt('DF', 'UF', 'U')],
  'cross-front': [isAt('DF', 'UF', 'F')],
  'cross-middle': [isAt('DF', 'FR', 'R')],
  'cross-flipped': [isAt('DF', 'DF', 'F')],
  'fl-right': [isAt('DRF', 'UFR', 'R')],
  'fl-front': [isAt('DRF', 'UFR', 'F')],
  'fl-up': [isAt('DRF', 'UFR', 'U')],
  'sl-right': [isAt('FR', 'UF', 'F')],
  'sl-left': [isAt('FL', 'UF', 'F')],
  'yc-line': [llOrientedEdges(['UR', 'UL'])],
  'yc-l': [llOrientedEdges(['UB', 'UL'])],
  'yc-dot': [llOrientedEdges([])],
  'yf-sune': [llOrientedCorners(['ULF'])],
  'yf-antisune': [llOrientedCorners(['URB'])],
  'llc-headlights': [['faros atrás (las 2 esquinas de atrás bien entre sí)', (p) => sameShift(p, 'CORNERS', 1, 2)]],
  'lle-left': [
    ['barra atrás (esquinas y arista de atrás en su lugar)', (p) => LL.every((i) => cornerOk(p, i)) && edgeOk(p, 2)],
    ['la arista del frente va a la izquierda', (p) => orbit(p, 'EDGES').pieces[0] === 3],
  ],
  'lle-right': [
    ['barra atrás (esquinas y arista de atrás en su lugar)', (p) => LL.every((i) => cornerOk(p, i)) && edgeOk(p, 2)],
    ['la arista del frente va a la derecha', (p) => orbit(p, 'EDGES').pieces[0] === 1],
  ],
};

// ---------- Verificación ----------

const failures = [];
let checks = 0;

function check(label, ok, detail = '') {
  checks++;
  if (!ok) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

function parse(alg) {
  try {
    return new Alg(alg);
  } catch (err) {
    return null;
  }
}

// Comprueba un algoritmo dentro de su paso. reference: caso independiente (PLL).
function verifyAlg(label, stepId, algText, reference) {
  const step = STEPS[stepId];
  const alg = parse(algText);
  if (!check(label, alg !== null, `no se puede leer "${algText}"`)) return false;

  // El algoritmo no puede dejar el cubo rotado ni mover los centros.
  const effect = SOLVED.applyAlg(alg);
  if (!check(label, centersOk(effect), 'deja los centros movidos (rotación neta)')) return false;

  // Caso que muestra la tarjeta: el estado que el algoritmo resuelve.
  const shown = SOLVED.applyAlg(alg.invert());
  let ok = true;
  for (const [name, cond] of step.before) ok = check(label, cond(shown), `el caso no tiene armado: ${name}`) && ok;
  ok = check(label, !step.goal.every(([, cond]) => cond(shown)), 'el caso ya está resuelto') && ok;

  // Partiendo del caso de referencia (o del que se muestra), aplicar y comprobar.
  const start = reference ? SOLVED.applyAlg(new Alg(reference).invert()) : shown;
  const end = start.applyAlg(alg);
  for (const [name, cond] of step.goal) {
    if (cond(end) || !reference) {
      ok = check(label, withAUF(end, cond), `no queda resuelto: ${name}`) && ok;
      continue;
    }
    // Para ayudar a corregir: ¿lo resuelve con un giro previo de U?
    const pre = AUFS.slice(1).find((auf) => cond(start.applyAlg(auf).applyAlg(alg)));
    ok = check(label, false, pre ? `resuelve el caso de referencia solo con un (${pre}) antes` : 'no resuelve el caso de referencia (¿otro caso?)') && ok;
  }
  return ok;
}

// Clave de un caso de PLL que no depende del AUF de antes ni del de después.
function pllKey(algText) {
  const t = kpuzzle.algToTransformation(new Alg(algText).invert());
  const keys = [];
  for (const pre of AUFS) {
    for (const post of AUFS) {
      const p = SOLVED.applyAlg(pre).applyTransformation(t).applyAlg(post);
      keys.push(JSON.stringify([p.patternData.EDGES, p.patternData.CORNERS]));
    }
  }
  return keys.sort()[0];
}

const results = [];

function runCase(section, stepId, c, reference) {
  const algs = [c.alg, ...(c.alts ?? [])];
  const okAlgs = algs.map((alg, i) => verifyAlg(`${section} › ${c.name}${i ? ` (alternativa ${i})` : ''}`, stepId, alg, reference));
  let ok = okAlgs.every(Boolean);
  for (const [name, cond] of EXPECT[c.id] ?? []) {
    const shown = SOLVED.applyAlg(new Alg(c.alg).invert());
    ok = check(`${section} › ${c.name}`, cond(shown), `no coincide con la descripción: ${name}`) && ok;
  }
  results.push({ section, name: c.name, algs: algs.length, ok });
}

for (const step of BEGINNER.steps) {
  for (const c of step.cases) runCase(`Principiante · ${step.title}`, step.id, c);
}

const pllCases = PLL.groups.flatMap((g) => g.cases);
for (const c of pllCases) {
  check(`PLL › ${c.name}`, PLL_REFERENCE[c.id] !== undefined, 'no tiene referencia');
  runCase('PLL', 'pll', c, PLL_REFERENCE[c.id]);
}
check('PLL', pllCases.length === 21, `hay ${pllCases.length} casos en vez de 21`);
const keys = new Map();
for (const c of pllCases) {
  const key = pllKey(c.alg);
  check(`PLL › ${c.name}`, !keys.has(key), `es el mismo caso que ${keys.get(key)}`);
  keys.set(key, c.name);
}

// ---------- Resultado ----------

let lastSection = '';
for (const r of results) {
  if (r.section !== lastSection) {
    console.log(`\n${r.section}`);
    lastSection = r.section;
  }
  console.log(`  ${r.ok ? '✔' : '✖'} ${r.name}${r.algs > 1 ? ` (${r.algs} algoritmos)` : ''}`);
}

const totalAlgs = results.reduce((n, r) => n + r.algs, 0);
console.log(`\n${results.length} casos · ${totalAlgs} algoritmos · ${checks} comprobaciones`);
if (failures.length) {
  console.log(`\n✖ ${failures.length} problema(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('✔ Todos los algoritmos son correctos.');
