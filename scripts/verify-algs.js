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
import { cube2x2x2, cube3x3x3, puzzles } from 'cubing/puzzles';
import { BEGINNER } from '../src/data/beginner.js';
import { PLL } from '../src/data/pll.js';
import { OLL, OLL_2LOOK } from '../src/data/oll.js';
import { F2L } from '../src/data/f2l.js';
import { CROSS as CROSS_PAGE } from '../src/data/cross.js';
import { ROUX } from '../src/data/roux.js';
import { BEGINNER_2X2, ORTEGA, CLL } from '../src/data/cube2x2.js';
import { CUBE4X4, REDUCTION, YAU } from '../src/data/cube4x4.js';
import { CUBE5X5, REDUCTION_5X5, YAU5 } from '../src/data/cube5x5.js';
import { CUBE7X7, REDUCTION_7X7 } from '../src/data/cube7x7.js';
import { MEGAMINX, MEGAMINX_STANDARD } from '../src/data/megaminx.js';
import { PYRAMINX, PYRAMINX_BEGINNER, PYRAMINX_ADVANCED } from '../src/data/pyraminx.js';
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

// ---------- Roux ----------
// Bloques de Roux (en el cubo sin rotar): primero a la izquierda, segundo a la derecha.
const ROUX_PARTS = {
  dl: (p) => edgeOk(p, 7),
  fbFront: (p) => edgeOk(p, 9) && cornerOk(p, 5),
  fbBack: (p) => edgeOk(p, 11) && cornerOk(p, 6),
  dr: (p) => edgeOk(p, 5),
  sbFront: (p) => edgeOk(p, 8) && cornerOk(p, 4),
  sbBack: (p) => edgeOk(p, 10) && cornerOk(p, 7),
};
const rlCenters = (p) => orbit(p, 'CENTERS').pieces[1] === 1 && orbit(p, 'CENTERS').pieces[3] === 3;
const firstBlock = (p) => ['dl', 'fbFront', 'fbBack'].every((k) => ROUX_PARTS[k](p));
const bothBlocks = (p) => Object.values(ROUX_PARTS).every((ok) => ok(p)) && rlCenters(p);
const llCornersAUF = (p) => withAUF(p, (q) => LL.every((i) => cornerOk(q, i)));
const LSE_EDGES = [0, 1, 2, 3, 4, 6]; // UF UR UB UL DF DB
const MSLICE = ['', 'M', 'M2', "M'"];
const facingOf = (p, piece) => locate(p, EDGES[piece]).facing;
const uCenterOnAxis = (p) => [0, 5].includes(orbit(p, 'CENTERS').pieces.indexOf(0));
// EO: con el centro de arriba en U o D (alineando M), las 6 aristas miran arriba/abajo.
const lseAligned = (p) => MSLICE.map((m) => (m ? p.applyAlg(m) : p)).find(uCenterOnAxis);
const badEdges = (p) => LSE_EDGES.filter((i) => !'UD'.includes(facingOf(lseAligned(p), i))).length;
const eoDone = (p) => MSLICE.some((m) => {
  const q = m ? p.applyAlg(m) : p;
  return uCenterOnAxis(q) && LSE_EDGES.every((i) => 'UD'.includes(facingOf(q, i)));
});
const centersHome = (q) => orbit(q, 'CENTERS').pieces.every((x, i) => x === i);
const withUM = (p, cond) => AUFS.some((u) => MSLICE.some((m) => cond(p.applyAlg(`${u} ${m}`))));
const ulurDone = (p) => withUM(p, (q) => centersHome(q) && edgeOk(q, 1) && edgeOk(q, 3));
const lseDone = (p) => withUM(p, (q) => q.isIdentical(SOLVED));

// Bloques: antes/después según before/goal del caso, sin rotar el cubo.
for (const stage of ROUX.stages) {
  for (const c of stage.cases) {
    const label = `Roux › ${stage.title} › ${c.name}`;
    const alg = parse(c.alg);
    let ok = check(label, alg !== null, `no se puede leer "${c.alg}"`);
    if (ok) {
      const shown = shownCase(c.alg);
      const end = shown.applyAlg(alg);
      const needFirst = stage.id === 'sb';
      ok = check(label, rlCenters(SOLVED.applyAlg(alg)), 'mueve los centros de los costados') && ok;
      ok = check(label, c.before.every((k) => ROUX_PARTS[k](shown)), `el caso no tiene armado: ${c.before.join(', ')}`) && ok;
      ok = check(label, !c.goal.every((k) => ROUX_PARTS[k](shown)), 'el caso ya está resuelto') && ok;
      ok = check(label, c.goal.every((k) => ROUX_PARTS[k](end)), `no queda armado: ${c.goal.join(', ')}`) && ok;
      if (needFirst) ok = check(label, firstBlock(end), 'rompe el primer bloque') && ok;
    }
    results.push({ section: 'Roux · Bloques', name: `${stage.id.toUpperCase()} · ${c.name}`, algs: 1, ok });
  }
}

// CMLL: bloques intactos, las 4 esquinas resueltas (las aristas y M no importan),
// el grupo coincide con la orientación de las esquinas (comparada con OLL 21–27) y son 42 distintos.
const ollByNumber = (n) => ollCases.find((c) => c.number === n).alg.replace(/^\(U2?'?\)\s*/, '');
const cornerOri = (alg) => AUFS.map((_, k) => LL.map((i) => orbit(turnU(shownCase(alg), k), 'CORNERS').orientation[i]).join('')).sort()[0];
const CMLL_GROUP_BY_ORI = new Map([
  ['0000', 'O'],
  [cornerOri(ollByNumber(21)), 'H'],
  [cornerOri(ollByNumber(22)), 'Pi'],
  [cornerOri(ollByNumber(23)), 'U'],
  [cornerOri(ollByNumber(24)), 'T'],
  [cornerOri(ollByNumber(27)), 'S'],
  [cornerOri(ollByNumber(26)), 'AS'],
  [cornerOri(ollByNumber(25)), 'L'],
]);
const cmllCases = ROUX.cmll.groups.flatMap((g) => g.cases);
for (const c of cmllCases) {
  let ok = true;
  const algs = [c.alg, ...(c.alts ?? [])];
  for (const [i, text] of algs.entries()) {
    const label = `Roux › CMLL › ${c.name}${i ? ` (alternativa ${i})` : ''}`;
    const alg = parse(text);
    if (!check(label, alg !== null, `no se puede leer "${text}"`)) { ok = false; continue; }
    const shown = shownCase(text);
    ok = check(label, bothBlocks(SOLVED.applyAlg(alg)) && bothBlocks(shown), 'toca los bloques (o rota el cubo)') && ok;
    ok = check(label, !llCornersAUF(shown), 'el caso ya tiene las esquinas resueltas') && ok;
    ok = check(label, llCornersAUF(shown.applyAlg(alg)), 'no deja las 4 esquinas resueltas') && ok;
    const group = CMLL_GROUP_BY_ORI.get(cornerOri(text));
    ok = check(label, group === c.group, `está en el grupo ${c.group} pero las esquinas son de ${group}`) && ok;
    // Las alternativas tienen que resolver el mismo caso que el principal.
    if (i) ok = check(label, cmllKey(text) === cmllKey(c.alg), 'no es el mismo caso que el algoritmo principal') && ok;
  }
  results.push({ section: 'Roux · CMLL', name: c.name, algs: algs.length, ok });
}
check('CMLL', cmllCases.length === 42, `hay ${cmllCases.length} casos en vez de 42`);
// Clave sin AUF antes ni después, mirando solo las esquinas de arriba.
function cmllKey(alg) {
  const t = kpuzzle.algToTransformation(new Alg(alg).invert());
  const keys = [];
  for (const pre of AUFS) for (const post of AUFS) {
    const c = orbit(SOLVED.applyAlg(pre).applyTransformation(t).applyAlg(post), 'CORNERS');
    keys.push(LL.map((i) => `${c.pieces[i]}${c.orientation[i]}`).join(' '));
  }
  return keys.sort()[0];
}
checkDistinct('CMLL', cmllCases, cmllKey);

// LSE: solo M y U; antes: bloques y esquinas; cada paso con su objetivo.
for (const step of ROUX.lse.steps) {
  for (const c of step.cases) {
    const label = `Roux › LSE › ${c.name}`;
    const alg = parse(c.alg);
    let ok = check(label, alg !== null, `no se puede leer "${c.alg}"`);
    ok = ok && check(label, /^[MU2' ]+$/.test(c.alg), 'usa giros que no son M ni U');
    if (ok) {
      const shown = shownCase(c.alg);
      const end = shown.applyAlg(alg);
      ok = check(label, bothBlocks(shown) && llCornersAUF(shown), 'el caso no tiene bloques y esquinas armados') && ok;
      ok = check(label, centersHome(shown), 'el caso no tiene los centros en su lugar') && ok;
      if (c.step === 'eo') {
        ok = check(label, !eoDone(shown) && eoDone(end), 'no orienta las aristas') && ok;
        ok = check(label, badEdges(shown) === c.bad, `dice ${c.bad} aristas malas y son ${badEdges(shown)}`) && ok;
      } else if (c.step === 'ulur') {
        ok = check(label, eoDone(shown) && !ulurDone(shown), 'el caso no es de UL/UR') && ok;
        ok = check(label, ulurDone(end) && eoDone(end), 'no deja UL y UR en su lugar') && ok;
        const at = (piece) => EDGES[orbit(shown, 'EDGES').pieces.indexOf(piece)];
        ok = check(label, at(3) === c.ul && at(1) === c.ur, `dice UL en ${c.ul} y UR en ${c.ur}, y están en ${at(3)} y ${at(1)}`) && ok;
      } else {
        ok = check(label, eoDone(shown) && ulurDone(shown) && !lseDone(shown), 'el caso no es de las últimas 4 aristas') && ok;
        ok = check(label, lseDone(end), 'no termina el cubo') && ok;
        const moved = [0, 2, 4, 6].filter((i) => orbit(shown, 'EDGES').pieces[i] !== i).length;
        ok = check(label, moved === c.moved, `dice ${c.moved} aristas fuera de lugar y son ${moved}`) && ok;
      }
    }
    results.push({ section: 'Roux · LSE', name: c.name, algs: 1, ok });
  }
}

// ---------- 2x2 (KPuzzle de 2x2: solo esquinas, sin centros) ----------
const kp2 = await cube2x2x2.kpuzzle();
const SOLVED2 = kp2.defaultPattern();
const c2 = (p) => p.patternData.CORNERS;
const ok2 = (p, i) => c2(p).pieces[i] === i && c2(p).orientation[i] === 0;
const TOP2 = [0, 1, 2, 3];
const BOTTOM2 = [4, 5, 6, 7];
const shown2 = (alg) => SOLVED2.applyAlg(new Alg(alg).invert());
// Las 24 rotaciones del cubo entero: sin centros, cualquiera cuenta como "resuelto".
const ROTATIONS = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap((a) => ['', 'y', 'y2', "y'"].map((b) => `${a} ${b}`.trim()));
const solved2 = (p) => ROTATIONS.some((r) => (r ? p.applyAlg(r) : p).isIdentical(SOLVED2));
const DMOVES = ['', 'D', 'D2', "D'"];
const solved2UD = (p) => AUFS.some((u) => DMOVES.some((d) => solved2(p.applyAlg(`${u} ${d}`))));
const bottomSolved2 = (p) => BOTTOM2.every((i) => ok2(p, i));
const orientedAt = (p, list) => list.filter((i) => c2(p).orientation[i] === 0).length;
const layerTurn = (layer) => (layer === TOP2 ? AUFS : DMOVES);
// Una capa está bien "entre sí" si girándola queda en su lugar; un lado tiene faros si
// girando la capa quedan bien las dos esquinas de ese lado.
const layerSolved = (p, layer) => layerTurn(layer).some((t) => layer.every((i) => ok2(t ? p.applyAlg(t) : p, i)));
const sides = (layer) => layer.map((a, i) => [a, layer[(i + 1) % 4]]);
// Se siguen las piezas que ESTÁN en a y b (al girar la capa se mueven a otras posiciones).
const homeAfter = (q, piece) => c2(q).pieces[piece] === piece && c2(q).orientation[piece] === 0;
const headlightSides = (p, layer) =>
  sides(layer).filter(([a, b]) => {
    const [pa, pb] = [c2(p).pieces[a], c2(p).pieces[b]];
    return layerTurn(layer).some((t) => { const q = t ? p.applyAlg(t) : p; return homeAfter(q, pa) && homeAfter(q, pb); });
  });
const permType = (p, layer) => (layerSolved(p, layer) ? 'none' : headlightSides(p, layer).length ? 'adj' : 'diag');
const centersFree2 = (alg) => { try { SOLVED2.applyAlg(alg); return true; } catch { return false; } };
// Orientación de las esquinas de arriba (sin AUF), comparable con la del 3x3 (misma numeración).
const oriKey2 = (alg) => AUFS.map((u) => { const p = shown2(alg).applyAlg(u); return TOP2.map((i) => c2(p).orientation[i]).join(''); }).sort()[0];
check('2x2', oriKey2("R U R' U R U2 R'") === cornerOri("R U R' U R U2 R'"), 'la numeración de esquinas de 2x2 y 3x3 no coincide');

// Comprueba el algoritmo y sus alternativas; checks(shown, end, alg) da los problemas posibles.
function run2(section, c, checks) {
  let ok = true;
  const algs = [c.alg, ...(c.alts ?? [])];
  for (const [i, alg] of algs.entries()) {
    const label = `${section} › ${c.name}${i ? ` (alternativa ${i})` : ''}`;
    if (!check(label, centersFree2(alg), `no se puede usar en 2x2: "${alg}"`)) { ok = false; continue; }
    const shown = shown2(alg);
    const end = shown.applyAlg(alg);
    for (const [problem, good] of checks(shown, end, alg)) ok = check(label, good, problem) && ok;
  }
  results.push({ section, name: c.name, algs: algs.length, ok });
}

for (const step of BEGINNER_2X2.steps) {
  for (const c of step.cases) {
    run2(`2x2 · Principiante · ${step.title}`, c, (shown, end) => {
      if (step.id === 'first-layer') {
        return [
          ['el caso no tiene 3 esquinas abajo armadas', BOTTOM2.filter((i) => ok2(shown, i)).length === 3],
          ['no completa la primera capa', bottomSolved2(end)],
        ];
      }
      if (step.id === 'll-orient') {
        return [
          ['el caso no tiene la primera capa armada', bottomSolved2(shown)],
          ['el caso ya está orientado', orientedAt(shown, TOP2) < 4],
          ['no orienta la cara de arriba', bottomSolved2(end) && orientedAt(end, TOP2) === 4],
        ];
      }
      const lights = headlightSides(shown, TOP2).map(([a, b]) => `${a}${b}`);
      return [
        ['el caso no tiene la primera capa y la cara de arriba', bottomSolved2(shown) && orientedAt(shown, TOP2) === 4],
        ['no arma el cubo', solved2UD(end)],
        [`los faros no coinciden con la descripción (${lights.join(', ') || 'ninguno'})`, c.headlights === 'back' ? lights.includes('12') : lights.length === 0],
      ];
    });
  }
}

for (const c of ORTEGA.face.cases) {
  run2('2x2 · Ortega · Primera cara', c, (shown, end) => [
    [`el caso no tiene ${c.orientedBefore} esquinas con el blanco abajo`, orientedAt(shown, BOTTOM2) === c.orientedBefore],
    ['no completa la cara de abajo', orientedAt(end, BOTTOM2) === 4 && BOTTOM2.every((i) => c2(end).pieces[i] >= 4)],
  ]);
}
const ortegaGroups = new Set();
for (const c of ORTEGA.oll.cases) {
  run2('2x2 · Ortega · OLL', c, (shown, end) => [
    ['el caso no tiene la cara de abajo hecha', orientedAt(shown, BOTTOM2) === 4 && BOTTOM2.every((i) => c2(shown).pieces[i] >= 4)],
    ['no orienta la cara de arriba (o rompe la de abajo)', orientedAt(end, TOP2) === 4 && orientedAt(end, BOTTOM2) === 4],
    [`está en el grupo ${c.group} pero las esquinas son de ${CMLL_GROUP_BY_ORI.get(oriKey2(c.alg))}`, CMLL_GROUP_BY_ORI.get(oriKey2(c.alg)) === c.group],
  ]);
  ortegaGroups.add(c.group);
}
check('OLL de 2x2', ORTEGA.oll.cases.length === 7 && ortegaGroups.size === 7 && !ortegaGroups.has('O'), 'tienen que ser los 7 casos distintos');
const pblKinds = new Set();
for (const c of ORTEGA.pbl.cases) {
  run2('2x2 · Ortega · PBL', c, (shown, end) => {
    const top = permType(shown, TOP2);
    const bottom = permType(shown, BOTTOM2);
    pblKinds.add(`${top}/${bottom}`);
    return [
      ['el caso no tiene las dos caras orientadas', orientedAt(shown, TOP2) === 4 && orientedAt(shown, BOTTOM2) === 4],
      ['no arma el cubo (admitiendo giros de U y D)', solved2UD(end)],
      [`dice ${c.top}/${c.bottom} y es ${top}/${bottom}`, top === c.top && bottom === c.bottom],
    ];
  });
}
check('PBL', pblKinds.size === 5, `hay ${pblKinds.size} casos distintos de PBL en vez de 5`);

const cllCases = CLL.groups.flatMap((g) => g.cases);
for (const c of cllCases) {
  run2('2x2 · CLL', c, (shown, end, alg) => [
    ['no es el mismo caso que el algoritmo principal', cllKey(alg) === cllKey(c.alg)],
    ['toca la primera capa', bottomSolved2(shown) && bottomSolved2(end)],
    ['el caso ya está resuelto', !AUFS.some((u) => TOP2.every((i) => ok2(shown.applyAlg(u || 'U4'), i)))],
    ['no deja las esquinas de arriba resueltas', AUFS.some((u) => TOP2.every((i) => ok2(u ? end.applyAlg(u) : end, i)))],
    [`está en el grupo ${c.group} pero las esquinas son de ${CMLL_GROUP_BY_ORI.get(oriKey2(c.alg))}`, CMLL_GROUP_BY_ORI.get(oriKey2(c.alg)) === c.group],
  ]);
}
check('CLL', cllCases.length === 42, `hay ${cllCases.length} casos en vez de 42`);
function cllKey(alg) {
  const t = kp2.algToTransformation(new Alg(alg).invert());
  const keys = [];
  for (const pre of AUFS) for (const post of AUFS) {
    const p = (pre ? SOLVED2.applyAlg(pre) : SOLVED2).applyTransformation(t);
    const q = post ? p.applyAlg(post) : p;
    keys.push(TOP2.map((i) => `${c2(q).pieces[i]}${c2(q).orientation[i]}`).join(' '));
  }
  return keys.sort()[0];
}
checkDistinct('CLL', cllCases, cllKey);

// ---------- 4x4 ----------
// Los centros del mismo color son iguales, así que se compara por colores (ver
// scripts/lib/cube4x4.js). Las paridades se comprueban con casos armados a mano.

const C4 = await import('./lib/cube4x4.js');
const { SOLVED4 } = C4;
const sameEffect4 = (a, b) => SOLVED4.applyAlg(a).isIdentical(SOLVED4.applyAlg(b));
const applies4 = (alg) => { try { SOLVED4.applyAlg(alg); return true; } catch { return false; } };
const F2L_DEDGES = ['DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
const corner4Ok = (p, i) => ['pieces', 'orientation'].every((k) => p.patternData.CORNERS[k][i] === SOLVED4.patternData.CORNERS[k][i]);
const f2l4 = (p) => C4.centersDone(p) && F2L_DEDGES.every((n) => C4.dedgeDone(p, n)) && [4, 5, 6, 7].every((i) => corner4Ok(p, i));
const cross4 = (p, list = ['DF', 'DR', 'DB', 'DL']) => list.every((n) => C4.dedgeDone(p, n));
const noParity = (p) => { const par = C4.parities(p); return par !== null && !par.oll && !par.pll; };
// Todas las aristas con el color de arriba/abajo bien, mirado como 3x3 (corners: también las esquinas).
const oriented4 = (p, { corners = false } = {}) => {
  const c = C4.as3x3(p);
  return c !== null && c.orientation.every((o) => o === 0) && (!corners || c.corners.orientation.every((o) => o === 0));
};

// Notación: que cada giro signifique lo que dice la tarjeta.
check('4x4 › notación', sameEffect4('Rw', 'R 2R') && sameEffect4('r', 'Rw') && sameEffect4('Uw', 'U 2U') && sameEffect4('3Rw', 'R 2R 3R'), 'Rw, r, Uw o 3Rw no son lo que dice la tarjeta');
check('4x4 › notación', SOLVED4.applyAlg('2R').patternData.CORNERS.pieces.every((x, i) => x === SOLVED4.patternData.CORNERS.pieces[i]), '2R no debería mover esquinas');
for (const c of CUBE4X4.notation.cases) {
  results.push({ section: '4x4 · Notación', name: c.name, algs: 1, ok: check(`4x4 › notación › ${c.name}`, applies4(c.alg) && c.alg.replace(/['2]$/, '') === c.name, 'no coincide con su nombre') });
}

// Casos armados a mano (independientes de los algoritmos), con el amarillo arriba.
const solvedFrom = (slot, state) => SOLVED4.patternData.EDGES.pieces.indexOf(state.patternData.EDGES.pieces[slot]);
// Las alas de `names` como quedan después de `move`, y todo lo demás resuelto.
function partialCase(move, names) {
  const after = SOLVED4.applyAlg(move);
  const changes = {};
  for (const s of names.flatMap((n) => C4.DEDGES[n])) changes[s] = [solvedFrom(s, after), after.patternData.EDGES.orientation[s]];
  return C4.withWings(changes);
}
// Una sola arista (UF) dada vuelta: sus dos alas se cambian de lugar. De las 4
// orientaciones posibles, una sola tiene que dar un estado posible.
const [ufA, ufB] = C4.DEDGES.UF;
const flips = [0, 1].flatMap((oa) => [0, 1].map((ob) => C4.withWings({ [ufA]: [ufB, oa], [ufB]: [ufA, ob] }))).filter((p) => C4.as3x3(p));
check('4x4 › caso de paridad de OLL', flips.length === 1, `${flips.length} formas posibles de dar vuelta una arista (tendría que ser 1)`);
const FLIP_CASE = flips[0];
const SWAP_CASE = partialCase('U2', ['UF', 'UB']); // aristas de adelante y atrás cambiadas
const ADJ_CASE = (() => {
  const toF = SOLVED4.applyAlg('U');
  const toR = SOLVED4.applyAlg("U'");
  const changes = {};
  for (const s of C4.DEDGES.UF) changes[s] = [solvedFrom(s, toF), toF.patternData.EDGES.orientation[s]];
  for (const s of C4.DEDGES.UR) changes[s] = [solvedFrom(s, toR), toR.patternData.EDGES.orientation[s]];
  return C4.withWings(changes);
})();
const hasParity = (p, oll, pll) => { const par = C4.parities(p); return par !== null && par.oll === oll && par.pll === pll; };
check('4x4 › caso de paridad de OLL', FLIP_CASE && hasParity(FLIP_CASE, true, false), 'el caso armado a mano no tiene paridad de OLL');
check('4x4 › caso de paridad de PLL', hasParity(SWAP_CASE, false, true) && hasParity(ADJ_CASE, false, true), 'los casos armados a mano no tienen paridad de PLL');

// Qué tiene que pasar en cada caso. shown: el caso que muestra la tarjeta; alg: el algoritmo.
const CASES_4X4 = {
  'c-first': (shown) => [['el caso no tiene 2 blancos abajo y 2 al frente', C4.colorCount(shown, 'D', 'D') === 2 && C4.colorCount(shown, 'F', 'D') === 2]],
  'c-second': (shown) => [['el caso no tiene el blanco hecho y 2 amarillos arriba', C4.centerDone(shown, 'D') && C4.centerCount(shown, 'U') === 2]],
  'c-sides': (shown) => [['el caso no tiene arriba y abajo hechos (y los costados sin hacer)', C4.centersDone(shown, 'UD') && !C4.centersDone(shown)]],
  'e-323': (shown, alg) => [
    ['el caso no tiene los centros hechos y FL/FR sin emparejar', C4.centersDone(shown) && C4.unpaired(shown).join() === 'FL,FR'],
    ['el algoritmo mueve los centros', C4.centersDone(SOLVED4.applyAlg(alg))],
  ],
  'e-last2': (shown) => [['el caso no tiene solo las dos aristas FL y FR sin emparejar', C4.centersDone(shown) && C4.unpaired(shown).join() === 'FL,FR']],
  'oll-parity': (shown, alg, i) => {
    const end = FLIP_CASE.applyAlg(alg);
    // El principal es "puro": solo da vuelta la arista. Las alternativas pueden mover dos esquinas.
    if (i === 0) return [['no resuelve la arista dada vuelta sin tocar nada más', C4.solved4(end)]];
    return [
      ['desde resuelto no hace una paridad de OLL', hasParity(SOLVED4.applyAlg(alg), true, false)],
      ['no arregla la arista dada vuelta', noParity(end) && oriented4(end)],
      ['rompe las dos primeras capas', f2l4(end)],
      ['mueve más de dos esquinas de arriba (la descripción dice dos)', [0, 1, 2, 3].filter((i) => !corner4Ok(end, i)).length <= 2],
    ];
  },
  'pll-parity': (shown, alg) => {
    const adj = ADJ_CASE.applyAlg(alg);
    return [
      ['no resuelve las aristas de adelante y atrás cambiadas', C4.solved4(SWAP_CASE.applyAlg(alg))],
      ['con dos aristas vecinas cambiadas no deja una PLL normal', noParity(adj) && f2l4(adj) && oriented4(adj, { corners: true })],
    ];
  },
  'y-centers2': (shown) => [['el caso no tiene el blanco hecho y 2 amarillos arriba', C4.centerDone(shown, 'D') && C4.centerCount(shown, 'U') === 2]],
  'y-cross': (shown) => [
    ['el caso no tiene los centros de arriba y abajo hechos', C4.centersDone(shown, 'UD')],
    ['el caso no tiene DL separada y DF, DR, DB armadas', C4.dedgeSplit(shown, 'DL') && cross4(shown, ['DF', 'DR', 'DB'])],
  ],
  'y-centers4a': (shown) => [
    ['el caso no tiene arriba y abajo hechos y la cruz DL, DB, DR', C4.centersDone(shown, 'UD') && !C4.centersDone(shown) && cross4(shown, ['DL', 'DB', 'DR'])],
    ['la barra no está entre el frente y la derecha', C4.centerCount(shown, 'F') === 2 && C4.centerCount(shown, 'R') === 2 && C4.centerDone(shown, 'L')],
  ],
  'y-centers4b': (shown) => [
    ['el caso no tiene arriba y abajo hechos y la cruz DL, DB, DR', C4.centersDone(shown, 'UD') && !C4.centersDone(shown) && cross4(shown, ['DL', 'DB', 'DR'])],
    ['la barra no está entre el frente y la izquierda', C4.centerCount(shown, 'F') === 2 && C4.centerCount(shown, 'L') === 2 && C4.centerDone(shown, 'R')],
  ],
  'y-cross4': (shown) => [['el caso no tiene los centros, DL, DB, DR y la arista DF separada', C4.centersDone(shown) && cross4(shown, ['DL', 'DB', 'DR']) && C4.dedgeSplit(shown, 'DF')]],
  'y-edges': (shown, alg) => [
    ['el caso no tiene los centros y la cruz hechos', C4.centersDone(shown) && cross4(shown) && C4.unpaired(shown).join() === 'FL,FR'],
    ['el algoritmo mueve la cruz o los centros', cross4(SOLVED4.applyAlg(alg)) && C4.centersDone(SOLVED4.applyAlg(alg))],
  ],
};

for (const [method, data] of [['Reducción', REDUCTION], ['Yau', YAU]]) {
  for (const step of data.steps) {
    for (const c of step.cases) {
      const section = `4x4 · ${method} · ${step.title}`;
      const algs = [c.alg, ...(c.alts ?? [])];
      let ok = check(`${section} › ${c.name}`, Boolean(CASES_4X4[c.id]), 'no tiene comprobaciones');
      for (const [i, alg] of algs.entries()) {
        const label = `${section} › ${c.name}${i ? ` (alternativa ${i})` : ''}`;
        if (!check(label, applies4(alg), `no se puede usar en 4x4: "${alg}"`)) { ok = false; continue; }
        const shown = C4.shown4(alg);
        ok = check(label, !C4.solved4(shown), 'el caso ya está resuelto') && ok;
        ok = check(label, C4.solved4(shown.applyAlg(alg)), 'no queda resuelto') && ok;
        for (const [problem, good] of CASES_4X4[c.id]?.(shown, alg, i) ?? []) ok = check(label, good, problem) && ok;
      }
      results.push({ section, name: c.name, algs: algs.length, ok });
    }
  }
}

// ---------- 5x5, 7x7, Megaminx y Pyraminx (KPuzzle) ----------

async function verifyPuzzleCases(puzzleId, labelPrefix, sectionsList, extraCheck = null) {
  const kp = await puzzles[puzzleId].kpuzzle();
  const solvedP = kp.defaultPattern();
  for (const { section, cases } of sectionsList) {
    for (const c of cases) {
      const fullSection = `${labelPrefix} · ${section}`;
      const algs = [c.alg, ...(c.alts ?? [])];
      let ok = true;
      for (const [i, alg] of algs.entries()) {
        const label = `${fullSection} › ${c.name}${i ? ` (alternativa ${i})` : ''}`;
        let shown = null;
        let after = null;
        try {
          const parsed = new Alg(alg);
          shown = solvedP.applyAlg(parsed.invert());
          after = shown.applyAlg(parsed);
        } catch (err) {
          ok = check(label, false, `no es válido en ${puzzleId}: "${alg}" (${err.message})`) && ok;
          continue;
        }
        ok = check(label, !shown.isIdentical(solvedP), 'el caso ya está resuelto (identidad)') && ok;
        ok = check(label, after.isIdentical(solvedP), 'al aplicar el algoritmo al caso inverso no queda resuelto') && ok;
        if (extraCheck) {
          for (const [problem, good] of extraCheck(c.id, shown, solvedP.applyAlg(alg), solvedP, i) ?? []) {
            ok = check(label, good, problem) && ok;
          }
        }
      }
      results.push({ section: fullSection, name: c.name, algs: algs.length, ok });
    }
  }
}

await verifyPuzzleCases(
  '5x5x5',
  '5x5',
  [
    { section: 'Notación', cases: CUBE5X5.notation.cases },
    ...REDUCTION_5X5.steps.filter((s) => s.cases.length).map((s) => ({ section: `Reducción · ${s.title}`, cases: s.cases })),
    ...YAU5.steps.filter((s) => s.cases.length).map((s) => ({ section: `Yau5 · ${s.title}`, cases: s.cases })),
  ],
  (id, shown, applied, solvedP, i) => {
    if (id === '5-edge-parity' && i === 0) {
      const sameCorners = JSON.stringify(applied.patternData.CORNERS) === JSON.stringify(solvedP.patternData.CORNERS);
      const sameMidges = JSON.stringify(applied.patternData.EDGES2) === JSON.stringify(solvedP.patternData.EDGES2);
      const wingsChanged = JSON.stringify(applied.patternData.EDGES) !== JSON.stringify(solvedP.patternData.EDGES);
      return [
        ['el algoritmo principal de paridad de alas toca esquinas o midges', sameCorners && sameMidges && wingsChanged],
      ];
    }
    return [];
  },
);

await verifyPuzzleCases(
  '7x7x7',
  '7x7',
  [
    { section: 'Notación', cases: CUBE7X7.notation.cases },
    ...REDUCTION_7X7.steps.filter((s) => s.cases.length).map((s) => ({ section: `Reducción · ${s.title}`, cases: s.cases })),
  ],
  (id, shown, applied, solvedP) => {
    if (id === '7-p-outer') {
      const sameCorners = JSON.stringify(applied.patternData.CORNERS) === JSON.stringify(solvedP.patternData.CORNERS);
      const sameMidges = JSON.stringify(applied.patternData.EDGES) === JSON.stringify(solvedP.patternData.EDGES);
      const outerWingsChanged = JSON.stringify(applied.patternData.EDGES2) !== JSON.stringify(solvedP.patternData.EDGES2);
      return [['la paridad de alas externas del 7x7 mueve esquinas o midges', sameCorners && sameMidges && outerWingsChanged]];
    }
    if (id === '7-p-inner') {
      const sameCorners = JSON.stringify(applied.patternData.CORNERS) === JSON.stringify(solvedP.patternData.CORNERS);
      const sameMidges = JSON.stringify(applied.patternData.EDGES) === JSON.stringify(solvedP.patternData.EDGES);
      const innerWingsChanged = JSON.stringify(applied.patternData.EDGES3) !== JSON.stringify(solvedP.patternData.EDGES3);
      return [['la paridad de alas internas del 7x7 mueve esquinas o midges', sameCorners && sameMidges && innerWingsChanged]];
    }
    return [];
  },
);

await verifyPuzzleCases('megaminx', 'Megaminx', [
  { section: 'Notación', cases: MEGAMINX.notation.cases },
  ...MEGAMINX_STANDARD.steps.filter((s) => s.cases.length).map((s) => ({ section: `Estándar · ${s.title}`, cases: s.cases })),
]);

await verifyPuzzleCases('pyraminx', 'Pyraminx', [
  { section: 'Notación', cases: PYRAMINX.notation.cases },
  ...PYRAMINX_BEGINNER.steps.filter((s) => s.cases.length).map((s) => ({ section: `Principiante · ${s.title}`, cases: s.cases })),
  ...PYRAMINX_ADVANCED.steps.filter((s) => s.cases.length).map((s) => ({ section: `Avanzados · ${s.title}`, cases: s.cases })),
]);

// ---------- CFOP: PLL ----------

const pllCases = PLL.groups.flatMap((g) => g.cases);
for (const c of pllCases) {
  check(`PLL › ${c.name}`, PLL_REFERENCE[c.id] !== undefined, 'no tiene referencia');
  runCase('CFOP · PLL', 'pll', c, { reference: PLL_REFERENCE[c.id] });
}
check('PLL', pllCases.length === 21, `hay ${pllCases.length} casos en vez de 21`);
checkDistinct('PLL', pllCases, pllKey);

// ---------- Entrenador: las mezclas de cada caso ----------
// Para cada caso se genera una mezcla real (solver de cubing.js) y una simple (respaldo).
// Las dos tienen que llevar al caso: con alguno de los 4 giros de U y el algoritmo,
// queda lo que pide cada grupo (las partes que no importan quedan al azar).
let trainerLine = '';
{
  const { TRAINER_SETS } = await import('../src/data/trainer-sets.js');
  const { caseScramble, realCaseScramble } = await import('../src/case-scramble.js');
  const { experimentalSolve3x3x3IgnoringCenters, experimentalSolve2x2x2 } = await import('cubing/search');
  const algsOf = (id) => TRAINER_SETS.find((x) => x.id === id).cases.map((c) => c.alg);
  const pools = { pll: algsOf('pll'), oll: algsOf('oll'), pbl: algsOf('pbl') };
  let seed = 2024;
  const rng = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const GOAL = {
    pll: (p) => withAUF(p, (q) => q.isIdentical(SOLVED)),
    oll: (p) => f2l(p) && llOriented(p),
    f2l: (p) => f2l(p),
    cmll: (p) => bothBlocks(p) && llCornersAUF(p),
    oll2: (p) => orientedAt(p, TOP2) === 4 && orientedAt(p, BOTTOM2) === 4,
    pbl: (p) => solved2UD(p),
  };
  for (const s of TRAINER_SETS) {
    let ok = true;
    let real = 0;
    const two = s.puzzle === '2x2x2';
    const tools = two
      ? { kpuzzle: kp2, solve: experimentalSolve2x2x2, faces: ['R', 'U', 'F'] }
      : { kpuzzle, solve: experimentalSolve3x3x3IgnoringCenters };
    for (const c of s.cases) {
      const body = c.alg.replace(/^\([^)]*\)\s*/, '');
      const generated = await realCaseScramble(s.id, c.alg, { ...tools, rng, pools });
      if (generated.real) real++;
      for (const scramble of [generated.scramble, caseScramble(c.alg, 'U')]) {
        const start = (two ? SOLVED2 : SOLVED).applyAlg(scramble);
        const solves = AUFS.some((u) => GOAL[s.id](start.applyAlg(u || 'U4').applyAlg(body)));
        ok = check(`Entrenador › ${s.title} › ${c.name}`, solves, `la mezcla "${scramble}" no lleva al caso`) && ok;
      }
    }
    ok = check(`Entrenador › ${s.title}`, real === s.cases.length, `solo ${real} de ${s.cases.length} mezclas salieron del solver`) && ok;
    trainerLine += ` ${ok ? '✔' : '✖'} ${s.title} (${real}/${s.cases.length} reales)`;
  }
}

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
console.log(`\nMezclas del entrenador (con los 4 giros de U):${trainerLine}`);
console.log(`\nCruz: ${crossSolver.states} posiciones recorridas; la más difícil se arma en ${crossSolver.maxDepth} movimientos.`);

const totalAlgs = results.reduce((n, r) => n + r.algs, 0);
console.log(`\n${results.length} casos · ${totalAlgs} algoritmos · ${checks} comprobaciones`);
if (failures.length) {
  console.log(`\n✖ ${failures.length} problema(s):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('✔ Todos los algoritmos son correctos.');
process.exit(0); // el solver deja un worker abierto
