// Grupos de casos del entrenador. Reusa los casos de Métodos (ya verificados):
// acá no hay algoritmos nuevos. Solo datos (sin DOM).
import { PLL } from './pll.js';
import { OLL } from './oll.js';
import { F2L } from './f2l.js';
import { ROUX } from './roux.js';
import { ORTEGA } from './cube2x2.js';

const flat = (groups) => groups.flatMap((g) => g.cases.map((c) => ({ ...c, group: g.title })));
const pick = ({ id, name, nickname, alg, group }) => ({ id, name, nickname, alg, group });

export const TRAINER_SETS = [
  { id: 'pll', title: 'PLL', puzzle: '3x3x3', stickering: PLL.stickering, cases: flat(PLL.groups).map(pick) },
  { id: 'oll', title: 'OLL', puzzle: '3x3x3', stickering: OLL.stickering, cases: flat(OLL.groups).map(pick) },
  {
    id: 'f2l',
    title: 'F2L',
    puzzle: '3x3x3',
    stickering: F2L.stickering,
    // Mismo nombre que en la página de F2L ("Caso 1", "Caso 2"…).
    cases: flat(F2L.groups).map((c, i) => pick({ ...c, name: `Caso ${i + 1}` })),
  },
  { id: 'cmll', title: 'CMLL', puzzle: '3x3x3', stickering: ROUX.cmll.stickering, cases: flat(ROUX.cmll.groups).map(pick) },
  { id: 'oll2', title: 'OLL 2x2', puzzle: '2x2x2', stickering: ORTEGA.oll.stickering, cases: ORTEGA.oll.cases.map(pick) },
  { id: 'pbl', title: 'PBL', puzzle: '2x2x2', stickering: ORTEGA.pbl.stickering, cases: ORTEGA.pbl.cases.map(pick) },
];

export const findSet = (id) => TRAINER_SETS.find((s) => s.id === id) ?? TRAINER_SETS[0];
