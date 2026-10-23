// Verifica TODOS los algoritmos de los métodos con el KPuzzle de cubing.js.
// Uso: npm run verify-algs
//
// Para cada caso: se parte del caso, se aplica el algoritmo y se comprueba que
// el objetivo del paso queda resuelto, admitiendo un giro final de U (AUF).
//   · PLL: el caso sale de una referencia independiente (pll-reference.js).
//   · OLL: la cara de arriba queda toda amarilla y el caso coincide exactamente
//     con los de otros algoritmos de la wiki (oll-reference.js); los 57 son distintos.
//   · F2L: el par queda en su lugar sin tocar la cruz ni los otros slots; el caso
//     coincide con la descripción (corner/edge), la parte "pair" arma de verdad el
//     par, y los 41 casos son distintos (y por lo tanto están todos).
//   · Cruz: desde la mezcla oficial, la solución arma la cruz y es óptima.
//   · Principiante: el caso es el que muestra la tarjeta (el inverso del
//     algoritmo), y se comprueba de forma independiente que coincide con la
//     descripción (dónde está la pieza y hacia dónde mira el blanco) y que el
//     algoritmo no rompe lo armado en los pasos anteriores.
import { Alg } from 'cubing/alg';
import { cube3x3x3 } from 'cubing/puzzles';
import { BEGINNER } from '../src/data/beginner.js';
import { PLL } from '../src/data/pll.js';
import { OLL, OLL_2LOOK } from '../src/data/oll.js';
import { F2L } from '../src/data/f2l.js';
import { CROSS as CROSS_PAGE } from '../src/data/cross.js';
import { PLL_REFERENCE } from './pll-reference.js';
import { OLL_REFERENCE } from './oll-reference.js';
import { createCrossSolver } from './lib/cross-solver.js';

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

const crossOk = (p) => CROSS.every((i) => edgeOk(p, i));
const f2l = (p) => crossOk(p) && FIRST_CORNERS.every((i) => cornerOk(p, i)) && MIDDLE.every((i) => edgeOk(p, i));
// Slot de los casos de F2L: esquina DRF (4) + arista FR (8). Los otros tres no se pueden tocar.
const SLOT = [4, 8];
const OTHER_SLOTS = [
  [5, 9], // DFL + FL
  [6, 11], // DLB + BL
  [7, 10], // DBR + BR
];
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
  oll: {
    before: [['F2L', f2l]],
    goal: [['F2L', f2l], ['cara de arriba toda del mismo color', llOriented]],
  },
  eoll: {
    before: [['F2L', f2l]],
    goal: [['F2L', f2l], ['aristas de arriba orientadas', llEdgesOriented]],
  },
  f2l: {
    before: [['cruz y los otros tres slots', (p) => crossOk(p) && OTHER_SLOTS.every(([c, e]) => cornerOk(p, c) && edgeOk(p, e))]],
    goal: [['par en su lugar, sin tocar la cruz ni los otros slots', f2l]],
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
  'eo-line': [llOrientedEdges(['UR', 'UL'])],
  'eo-l': [llOrientedEdges(['UF', 'UR'])],
  'eo-dot': [llOrientedEdges([])],
};

// ---------- OLL y F2L: identidad de los casos ----------

// Orientación de la última capa por posición (lo que se ve en la imagen del caso).
const llOrientation = (p) =>
  LL.map((i) => orbit(p, 'EDGES').orientation[i]).join('') + '/' + LL.map((i) => orbit(p, 'CORNERS').orientation[i]).join('');
const shownCase = (alg) => SOLVED.applyAlg(new Alg(alg).invert());
const turnU = (p, k) => (k ? p.applyAlg(AUFS[k]) : p);

// Clave de un caso que no depende de un giro de U (para ver que no se repitan).
const ollKey = (alg) => AUFS.map((_, k) => llOrientation(turnU(shownCase(alg), k))).sort()[0];

// Posición del par del slot: [esquina, blanco hacia], [arista, color del frente hacia].
function pairOf(p) {
  const c = locate(p, CORNERS[SLOT[0]]);
  const e = locate(p, EDGES[SLOT[1]]);
  return { corner: [c.at, c.facing], edge: [e.at, e.facing] };
}
const pairText = ({ corner, edge }) => `esquina ${corner.join('/')} · arista ${edge.join('/')}`;
const f2lKey = (alg) => {
  // Las piezas que están arriba giran con U; el slot no.
  const p = shownCase(alg);
  return AUFS.map((_, k) => pairText(pairOf(turnU(p, k)))).sort()[0];
};

// ¿El par está armado y listo para entrar? = un AUF y una inserción de 3 movimientos lo resuelven.
const INSERTS = ["R U' R'", "F' U F", "R U R'", "F' U' F", "R U2 R'", "F' U2 F"];
const pairReady = (p) =>
  AUFS.some((auf) => INSERTS.some((ins) => STEPS.f2l.goal.every(([, cond]) => cond(p.applyAlg(`${auf} ${ins}`)))));

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

// extra: comprobaciones propias del caso, como [descripción del problema, ¿está bien?].
function runCase(section, stepId, c, { reference, extra = [] } = {}) {
  const algs = [c.alg, ...(c.alts ?? [])];
  const okAlgs = algs.map((alg, i) => verifyAlg(`${section} › ${c.name}${i ? ` (alternativa ${i})` : ''}`, stepId, alg, reference));
  let ok = okAlgs.every(Boolean);
  for (const [name, cond] of EXPECT[c.id] ?? []) {
    ok = check(`${section} › ${c.name}`, cond(shownCase(c.alg)), `no coincide con la descripción: ${name}`) && ok;
  }
  for (const [problem, good] of extra) ok = check(`${section} › ${c.name}`, good, problem) && ok;
  results.push({ section, name: c.name, algs: algs.length, ok });
}

// Que todos los casos de una lista sean distintos entre sí.
function checkDistinct(section, cases, keyOf) {
  const seen = new Map();
  for (const c of cases) {
    const key = keyOf(c.alg);
    check(`${section} › ${c.name}`, !seen.has(key), `es el mismo caso que ${seen.get(key)}`);
    seen.set(key, c.name);
  }
}

for (const step of BEGINNER.steps) {
  for (const c of step.cases) runCase(`Principiante · ${step.title}`, step.id, c);
}

// ---------- CFOP: cruz ----------

// La mezcla se hace con el blanco arriba y después se gira el cubo con z2.
// Un movimiento hecho después de z2 equivale, en la orientación original, a su
// "espejo": U↔D y R↔L (F y B no cambian). Con eso se ve la mezcla con el blanco
// abajo (cara D, donde el solver arma la cruz).
const afterZ2 = (alg) => alg.replace(/[UDRL]/g, (f) => ({ U: 'D', D: 'U', R: 'L', L: 'R' })[f]);

const crossSolver = await createCrossSolver(kpuzzle);
check('Cruz', crossSolver.maxDepth === 8, `la cruz más difícil necesita ${crossSolver.maxDepth} movimientos, no 8`);
for (const ex of CROSS_PAGE.examples) {
  const label = `Cruz › ${ex.name}`;
  const scrambled = SOLVED.applyAlg(afterZ2(ex.scramble));
  const alg = parse(ex.alg);
  const length = alg ? [...alg.childAlgNodes()].length : 0;
  const optimal = crossSolver.optimal(scrambled);
  // Comprobación directa en la orientación original: la cruz BLANCA (arriba antes de z2) queda armada.
  const original = alg && SOLVED.applyAlg(ex.scramble).applyAlg(afterZ2(ex.alg));
  const whiteCross = alg && range(0, 4).every((i) => edgeOk(original, i));
  let ok = check(label, alg !== null, `no se puede leer "${ex.alg}"`);
  ok = ok && check(label, crossSolver.isSolved(scrambled.applyAlg(alg)), 'desde la mezcla no arma la cruz');
  ok = ok && check(label, whiteCross, 'la cruz que arma no es la blanca');
  ok = ok && check(label, length === optimal, `usa ${length} movimientos y la óptima es de ${optimal}`);
  ok = ok && check(label, length <= 8, `usa ${length} movimientos (más de 8)`);
  ok = ok && check(label, ex.name.includes(`${length} movimientos`), `el título no dice "${length} movimientos"`);
  results.push({ section: 'CFOP · Cruz', name: ex.name, algs: 1, ok });
}

// ---------- CFOP: F2L ----------

const f2lCases = F2L.groups.flatMap((g) => g.cases);
f2lCases.forEach((c, i) => {
  c.name = `Caso ${i + 1}`;
  const actual = pairOf(shownCase(c.alg));
  const expected = { corner: c.corner, edge: c.edge };
  const pairOk = c.alg.startsWith(c.pair) && (c.pair === '' || /\s/.test(c.alg[c.pair.length]));
  runCase('CFOP · F2L', 'f2l', c, {
    extra: [
      [`no coincide con la descripción: dice ${pairText(expected)} y es ${pairText(actual)}`, pairText(expected) === pairText(actual)],
      [`"pair" no es el comienzo del algoritmo: ${c.pair}`, pairOk],
      [
        `después de "${c.pair}" el par todavía no está armado`,
        pairOk && pairReady(shownCase(c.alg).applyAlg(c.pair)) && STEPS.f2l.before[0][1](shownCase(c.alg).applyAlg(c.pair)),
      ],
    ],
  });
});
check('F2L', f2lCases.length === 41, `hay ${f2lCases.length} casos en vez de 41`);
checkDistinct('F2L', f2lCases, f2lKey);

// ---------- CFOP: OLL ----------

const ollCases = OLL.groups.flatMap((g) => g.cases);
for (const c of ollCases) {
  c.name = `OLL ${c.number}`;
  const refs = (OLL_REFERENCE[c.number] ?? []).filter((r) => r !== c.alg);
  const mine = llOrientation(shownCase(c.alg));
  const extra = [[`no tiene referencia`, OLL_REFERENCE[c.number] !== undefined]];
  for (const alg of [c.alg, ...(c.alts ?? [])]) {
    extra.push([`"${alg}" no es el mismo caso que el algoritmo principal`, llOrientation(shownCase(alg)) === mine]);
  }
  for (const ref of refs) {
    const theirs = llOrientation(shownCase(ref));
    const k = [1, 2, 3].find((n) => llOrientation(turnU(shownCase(ref), n)) === mine);
    extra.push([
      k ? `con la referencia "${ref}" difiere en un giro previo (${AUFS[k]})` : `no es el mismo caso que la referencia "${ref}"`,
      theirs === mine,
    ]);
  }
  runCase('CFOP · OLL', 'oll', c, { extra });
}
check('OLL', ollCases.length === 57, `hay ${ollCases.length} casos en vez de 57`);
checkDistinct('OLL', ollCases, ollKey);

for (const c of OLL_2LOOK.edges.cases) runCase('CFOP · OLL en 2 pasos', 'eoll', c);
for (const id of OLL_2LOOK.corners.caseIds) {
  check('OLL en 2 pasos', ollCases.some((c) => c.id === id), `no existe el caso ${id}`);
}

// ---------- CFOP: PLL ----------

const pllCases = PLL.groups.flatMap((g) => g.cases);
for (const c of pllCases) {
  check(`PLL › ${c.name}`, PLL_REFERENCE[c.id] !== undefined, 'no tiene referencia');
  runCase('CFOP · PLL', 'pll', c, { reference: PLL_REFERENCE[c.id] });
}
check('PLL', pllCases.length === 21, `hay ${pllCases.length} casos en vez de 21`);
checkDistinct('PLL', pllCases, pllKey);

// ---------- Resultado ----------

// Una línea por sección, con todos sus casos (✔ o ✖).
const sections = new Map();
for (const r of results) {
  if (!sections.has(r.section)) sections.set(r.section, []);
  sections.get(r.section).push(r);
}
for (const [section, list] of sections) {
  const okCount = list.filter((r) => r.ok).length;
  console.log(`\n${list.every((r) => r.ok) ? '✔' : '✖'} ${section} — ${okCount}/${list.length} casos`);
  const items = list.map((r) => `${r.ok ? '✔' : '✖'} ${r.name}${r.algs > 1 ? ` (${r.algs})` : ''}`);
  for (let i = 0; i < items.length; i += 6) console.log(`    ${items.slice(i, i + 6).join('   ')}`);
}
console.log(`\nCruz: ${crossSolver.states} posiciones recorridas; la más difícil se arma en ${crossSolver.maxDepth} movimientos.`);

const totalAlgs = results.reduce((n, r) => n + r.algs, 0);
console.log(`\n${results.length} casos · ${totalAlgs} algoritmos · ${checks} comprobaciones`);
if (failures.length) {
  console.log(`\n✖ ${failures.length} problema(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('✔ Todos los algoritmos son correctos.');
