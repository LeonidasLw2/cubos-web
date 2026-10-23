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
};
