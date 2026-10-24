// Qué piezas se ven en color y cuáles en gris en cada paso.
//
// Los stickerings que trae cubing.js ("PLL", "Cross"…) suponen la última capa
// blanca arriba. Acá el cubo se muestra con el amarillo arriba (DISPLAY_SETUP = z2),
// así que se arman máscaras propias con las mismas letras que usa cubing.js:
//   -  normal          D  atenuada (ya resuelta)        I  gris (no importa todavía)
//   O  solo el color de arriba (orientación)          P  todo menos el de arriba (permutación)
//   o  atenuada arriba y gris el resto
// Orden de las piezas (por identidad, en el cubo sin rotar):
//   EDGES   UF UR UB UL DF DR DB DL FR FL BR BL  → 0-3 blancas, 4-7 amarillas, 8-11 del medio
//   CORNERS UFR URB UBL ULF DRF DFL DLB DBR      → 0-3 blancas, 4-7 amarillas
//   CENTERS U L F R B D

export const DISPLAY_SETUP = 'z2'; // estado final: resuelto, con el amarillo arriba

const mask = (edges, corners, centers = '------') => `EDGES:${edges},CORNERS:${corners},CENTERS:${centers}`;

// 4x4: 24 alas (dos por arista), 8 esquinas y 24 centros (4 por cara, en orden
// U L F R B D). Cada ala es blanca (w, arriba en el cubo sin rotar), amarilla (y)
// o del medio (m); scripts/lib/cube4x4.js calcula estos grupos.
const WINGS_4X4 = 'wwwwwmymwmymwmymwmymyyyy';
const mask4 = ({ w = 'I', m = 'I', y = 'I', cw = 'I', cy = 'I', white = 'I', side = 'I', yellow = 'I' }) =>
  `EDGES:${[...WINGS_4X4].map((g) => ({ w, m, y })[g]).join('')},` +
  `CORNERS:${cw.repeat(4)}${cy.repeat(4)},` +
  `CENTERS:${white.repeat(4)}${side.repeat(16)}${yellow.repeat(4)}`;

export const STICKERING = {
  cross: mask('----IIIIIIII', 'IIIIIIII'),
  'first-layer': mask('DDDDIIIIIIII', '----IIII'),
  'second-layer': mask('DDDDIIII----', 'DDDDIIII'),
  'yellow-cross': mask('DDDDOOOODDDD', 'DDDDIIII'),
  'yellow-face': mask('DDDDOOOODDDD', 'DDDDOOOO'),
  'll-corners': mask('DDDDooooDDDD', 'DDDDPPPP'),
  'll-edges': mask('DDDDPPPPDDDD', 'DDDDPPPP'),
  pll: mask('DDDDPPPPDDDD', 'DDDDPPPP'),
  oll: mask('DDDDOOOODDDD', 'DDDDOOOO'),
  eoll: mask('DDDDOOOODDDD', 'DDDDIIII'),
  // F2L: con z2, el slot de adelante a la derecha lo ocupan la arista FL (9) y la
  // esquina ULF (3) del cubo sin rotar. Ese par en color; la cruz y los otros
  // slots atenuados; la última capa en gris.
  f2l: mask('DDDDIIIID-DD', 'DDD-IIII'),

  // Roux. Con z2, el bloque de la izquierda lo forman (por identidad) la arista UR (1),
  // FR (8), BR (10), las esquinas UFR (0) y URB (1) y el centro R (3); el de la derecha,
  // UL (3), FL (9), BL (11), ULF (3), UBL (2) y el centro L (1). Arriba: DF (4) UB←DB (6),
  // UL←DR (5), UR←DL (7); abajo en el medio: DF←UF (0), DB←UB (2).
  'roux-fb': mask('I-IIIIII-I-I', '--IIIIII', 'III-II'),
  'roux-sb': mask('IDI-IIIID-D-', 'DD--IIII', 'I-IDII'),
  cmll: mask('IDIDIIIIDDDD', 'DDDD----', 'IDIDII'),
  'lse-eo': mask('ODODOOOODDDD', 'DDDDDDDD', '-D-D--'),
  'lse-ulur': mask('IDIDI-I-DDDD', 'DDDDDDDD', '-D-D--'),
  'lse-l4e': mask('-D-D-D-DDDDD', 'DDDDDDDD', '-D-D--'),

  // 2x2: solo hay esquinas (misma numeración: 0-3 blancas abajo con z2, 4-7 amarillas arriba).
  '2x2-first-layer': 'CORNERS:----IIII',
  '2x2-ll-orient': 'CORNERS:DDDDOOOO',
  '2x2-ll-perm': 'CORNERS:DDDDPPPP',
  '2x2-first-face': 'CORNERS:OOOOIIII',
  '2x2-oll': 'CORNERS:OOOOOOOO',
  '2x2-pbl': 'CORNERS:--------',
  '2x2-cll': 'CORNERS:DDDD----',

  // 4x4 (con z2: blanco abajo, amarillo arriba).
  '4x4-full': mask4({ w: '-', m: '-', y: '-', cw: '-', cy: '-', white: '-', side: '-', yellow: '-' }),
  '4x4-centers': mask4({ white: '-', side: '-', yellow: '-' }),
  '4x4-edges': mask4({ w: '-', m: '-', y: '-', white: 'D', side: 'D', yellow: 'D' }),
  '4x4-oll-parity': mask4({ w: 'D', m: 'D', y: 'O', cw: 'D', cy: 'O', white: 'D', side: 'D', yellow: '-' }),
  '4x4-pll-parity': mask4({ w: 'D', m: 'D', y: '-', cw: 'D', cy: '-', white: 'D', side: 'D', yellow: '-' }),
  'yau-centers2': mask4({ white: '-', yellow: '-' }),
  'yau-cross': mask4({ w: '-', white: 'D', yellow: 'D' }),
  'yau-centers4': mask4({ w: 'D', white: 'D', side: '-', yellow: 'D' }),
  'yau-edges': mask4({ w: 'D', m: '-', y: '-', white: 'D', side: 'D', yellow: 'D' }),
};
