// Referencia independiente para definir cada caso de PLL al verificar.
// Son las soluciones óptimas (HTM) de la wiki de SpeedSolving
// (https://www.speedsolving.com/wiki/index.php/PLL): algoritmos encontrados por
// computadora, distintos de los que usa la app. Un "(y)" de la wiki se escribe
// como "y … y'" para que el cubo termine sin rotar.
// El caso de referencia es el estado que estos algoritmos resuelven.

export const PLL_REFERENCE = {
  H: "R2 F2 B2 L2 D' R2 F2 B2 L2",
  Ua: "B2 U' R L' B2 R' L U' B2",
  Ub: "B2 U L' R B2 L R' U B2",
  Z: "R L' U2 D2 R L' D' R2 L2 U F2 B2",
  Aa: "R2 F2 R' B' R F2 R' B R'",
  Ab: "y L2 F2 L B L' F2 L B' L y'",
  E: "F R B R' F' R L F L' B' L F' R' L'",
  F: "y R2 B2 R2 L U' L F2 R' D L' F2 R L' y'",
  Ga: "y F B U2 F' B' L' U R' U2 L U' R y'",
  Gb: "y R2 F2 U R2 D' R2 D B2 U' F2 B2 R2 y'",
  Gc: "B2 R2 L2 U' R2 U R2 D' R2 D L2 B2",
  Gd: "L U L' B2 D' R U' R' U R' D B2",
  Ja: "L2 D L D' L B2 R' U R B2",
  Jb: "R2 D' R' D R' B2 L U' L' B2",
  Na: "R' U R2 B2 U R' B2 R U' B2 R2 U' R",
  Nb: "L U' L2 B2 U' L B2 L' U B2 L2 U L'",
  Ra: "y F U2 F' U R B' R' F R B R' U F' y'",
  Rb: "y R2 F R U R U' R' F' R U2 R' U2 R y'",
  T: "y F2 U' F2 D R2 B2 U B2 D' R2 y'",
  V: "R' U R' U' B' D B' D' B2 R' B' R B R",
  Y: "R2 U' R2 U' R2 U F U F' R2 F U' F'",
};
