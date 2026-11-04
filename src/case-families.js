import { ORTEGA } from './data/cube2x2.js';
import { REDUCTION } from './data/cube4x4.js';
import { OLL } from './data/oll.js';
import { PLL } from './data/pll.js';

export const CASE_FAMILIES = {
  oll2: { size: 2, label: 'Ortega · OLL', mask: true, entries: ORTEGA.oll.cases, stickering: ORTEGA.oll.stickering, guide: '2x2/ortega', prerequisite: 'La cara de abajo está armada de un solo color.' },
  pbl: { size: 2, label: 'Ortega · PBL', entries: ORTEGA.pbl.cases, stickering: ORTEGA.pbl.stickering, guide: '2x2/ortega', prerequisite: 'Las caras de arriba y de abajo ya tienen cada una un solo color.' },
  oll: { size: 3, label: 'CFOP · OLL', mask: true, entries: OLL.groups.flatMap((group) => group.cases), stickering: OLL.stickering, guide: '3x3/cfop/oll', prerequisite: 'Las dos primeras capas están resueltas.' },
  pll: { size: 3, label: 'CFOP · PLL', entries: PLL.groups.flatMap((group) => group.cases), stickering: PLL.stickering, guide: '3x3/cfop/pll', prerequisite: 'Las dos primeras capas están resueltas y la cara superior está orientada.' },
  parity4: { size: 4, label: 'Reducción · Paridades', entries: REDUCTION.steps.flatMap((step) => step.cases).filter((entry) => ['oll-parity', 'pll-parity'].includes(entry.id)), guide: '4x4/reduccion', prerequisite: 'Los seis centros están armados, las doce aristas emparejadas y las dos primeras capas resueltas.' },
};
