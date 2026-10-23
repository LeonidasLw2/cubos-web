// CFOP · OLL: los 57 casos de orientación de la última capa, agrupados por forma.
// Solo datos (sin DOM). Algoritmos de la wiki de SpeedSolving con su número estándar;
// el "(U)" inicial es el giro previo para ver el caso como en las imágenes estándar.
// Todos se comprueban con `npm run verify-algs` (también contra scripts/oll-reference.js).

export const OLL = {
  id: 'oll',
  title: 'OLL',
  subtitle: 'Orientar la última capa',
  stickering: 'oll',
  intro: [
    'Con las dos primeras capas armadas, la OLL deja toda la cara de arriba amarilla en un solo algoritmo. No importa todavía si las piezas están en su lugar: eso es trabajo de la PLL.',
    'Para reconocer el caso mirá la figura que forma el amarillo arriba y, si hace falta, hacia dónde miran los stickers amarillos de los costados.',
  ],
  groups: [
    {
      id: 'cross',
      title: 'Cruz: las aristas ya están orientadas',
      text: 'Arriba hay una cruz amarilla; solo falta girar las esquinas. Son los 7 casos de la segunda parte de la OLL en 2 pasos.',
      cases: [
        { id: 'oll-27', number: 27, name: 'OLL 27', nickname: 'Sune', alg: "R U R' U R U2' R'", alts: ["(U') R' U2' R U R' U R"] },
        { id: 'oll-26', number: 26, name: 'OLL 26', nickname: 'Antisune', alg: "(U') R U2 R' U' R U' R'", alts: ["(U2) R' U' R U' R' U2 R"] },
        { id: 'oll-21', number: 21, name: 'OLL 21', nickname: 'H', alg: "R U R' U R U' R' U R U2 R'", alts: ["(U) R U2' R' U' R U R' U' R U' R'", "U F (R U R' U')3 F'"] },
        { id: 'oll-22', number: 22, name: 'OLL 22', nickname: 'Pi', alg: "R U2' R2' U' R2 U' R2' U2' R", alts: ["f (R U R' U') S' (R U R' U') F'"] },
        { id: 'oll-23', number: 23, name: 'OLL 23', nickname: 'Headlights', alg: "R2' D' R U2 R' D R U2 R", alts: ["(U2) R2 D R' U2 R D' R' U2 R'", "(R U R' U')3 (R' F R F')3"] },
        { id: 'oll-24', number: 24, name: 'OLL 24', nickname: 'Chameleon', alg: "r U R' U' r' F R F'", alts: ["(U2) l' U' L U l F' L' F"] },
        { id: 'oll-25', number: 25, name: 'OLL 25', nickname: 'Bowtie', alg: "(U2) F R' F' r U R U' r'", alts: ["(U') F' r U R' U' r' F R", "(F R B R') (F' R B' R')"] },
      ],
    },
    {
      id: 'dot',
      title: 'Punto: ninguna arista orientada',
      text: 'Solo el centro es amarillo entre las aristas. Son los casos más largos; con el tiempo se aprende a evitarlos.',
      cases: [
        { id: 'oll-1', number: 1, name: 'OLL 1', nickname: 'Runway', alg: "R U2' R2' F R F' U2 R' F R F'", alts: ["(U) R U' R2 D' r U' r' D R2 U R'"] },
        { id: 'oll-2', number: 2, name: 'OLL 2', nickname: 'Zamboni', alg: "(U') R U' R2' D' r U r' D R2 U R'", alts: ["F R U R' U' S R U R' U' f'", "(U2) f U R U' R' S' U R U' R' F'"] },
        { id: 'oll-3', number: 3, name: 'OLL 3', nickname: 'Anti-Pinwheel', alg: "(U) f R U R' U' f' U' F R U R' U' F'", alts: ["(U2) r' R2 U R' U r U2 r' U M'", "(U2) L' l U l' U2 l U L' U L M'"] },
        { id: 'oll-4', number: 4, name: 'OLL 4', nickname: 'Pinwheel', alg: "f R U R' U' f' U F R U R' U' F'", alts: ["(U) l L2' U' L U' l' U2 l U' M'", "(U) R r' U' r U2 r' U' R U' R2' r"] },
        { id: 'oll-17', number: 17, name: 'OLL 17', nickname: 'Slash', alg: "R U R' U R' F R F' U2 R' F R F'", alts: ["(U2) F R' F' R U S' R U' R' S"] },
        { id: 'oll-18', number: 18, name: 'OLL 18', nickname: 'Crown', alg: "R U2 R2 F R F' U2 M' U R U' r'", alts: ["(U) R U R2 F' U' F U R U2' R' F R F'"] },
        { id: 'oll-19', number: 19, name: 'OLL 19', nickname: 'Bunny', alg: "(U) S' R U R' S U' R' F R F'", alts: ["r' R U R U R' U' r R2 F R F'"] },
        { id: 'oll-20', number: 20, name: 'OLL 20', nickname: 'X', alg: "r' R U R U R' U' r R' M' U R U' r'", alts: ["r U R' U' r R' M' U R U' R' U' M'", "S' R U R' S U' M' U R U' r'"] },
      ],
    },
    {
      id: 'line',
      title: 'Línea',
      text: 'Una línea amarilla atraviesa la cara (forma de I).',
      cases: [
        { id: 'oll-51', number: 51, name: 'OLL 51', nickname: 'Bottlecap', alg: "F U R U' R' U R U' R' F'", alts: ["(U2) f R U R' U' R U R' U' f'"] },
        { id: 'oll-52', number: 52, name: 'OLL 52', nickname: 'Rice Cooker', alg: "R U R' U R U' B U' B' R'", alts: ["(U2) R' F' U' F U' R U R' U R"] },
        { id: 'oll-55', number: 55, name: 'OLL 55', nickname: 'Highway', alg: "(U) R' F R U R U' R2' F' R2 U' R' U R U R'", alts: ["(U) R' F U R U' R2' F' R2 U R' U' R", "(U) r U2' R' U' r' R2 U R' U' r U' r'"] },
        { id: 'oll-56', number: 56, name: 'OLL 56', nickname: 'Streetlights', alg: "r U r' U R U' R' U R U' R' r U' r'", alts: ["r U r' U R U' R' M' U R U2' r'"] },
      ],
    },
    {
      id: 'l',
      title: 'Forma de L',
      text: 'Dos aristas orientadas forman una L con el centro.',
      cases: [
        { id: 'oll-47', number: 47, name: 'OLL 47', nickname: 'Anti-Breakneck', alg: "(U') F R' F' R U2 R U' R' U R U2' R'", alts: ["R' U' R' F R F' R' F R F' U R", "F' L' U' L U L' U' L U F"] },
        { id: 'oll-48', number: 48, name: 'OLL 48', nickname: 'Breakneck', alg: "F R U R' U' R U R' U' F'" },
        { id: 'oll-49', number: 49, name: 'OLL 49', nickname: 'Right Back Squeezy', alg: "(U2) r U' r2' U r2 U r2' U' r", alts: ["R B' R2' F R2 B R2' F' R"] },
        { id: 'oll-50', number: 50, name: 'OLL 50', nickname: 'Right Front Squeezy', alg: "(U2) R' F R2 B' R2' F' R2 B R'", alts: ["r' U r2 U' r2' U' r2 U r'"] },
        { id: 'oll-53', number: 53, name: 'OLL 53', nickname: 'Frying Pan', alg: "l' U' L U' L' U L U' L' U2 l", alts: ["(U') r' U2' R U R' U' R U R' U r", "(U2) r' U' R U' R' U R U' R' U2 r"] },
        { id: 'oll-54', number: 54, name: 'OLL 54', nickname: 'Anti-Frying Pan', alg: "r U R' U R U' R' U R U2' r'", alts: ["(U') r U2' R' U' R U R' U' R U' r'"] },
      ],
    },
    {
      id: 't',
      title: 'Forma de T',
      text: 'Una T amarilla: la línea del medio más dos esquinas.',
      cases: [
        { id: 'oll-33', number: 33, name: 'OLL 33', nickname: 'Shoelaces', alg: "R U R' U' R' F R F'" },
        { id: 'oll-45', number: 45, name: 'OLL 45', nickname: 'Suit Up', alg: "F R U R' U' F'" },
      ],
    },
    {
      id: 'c',
      title: 'Forma de C',
      text: 'Una C amarilla abierta hacia un costado.',
      cases: [
        { id: 'oll-34', number: 34, name: 'OLL 34', nickname: 'City', alg: "R U R2' U' R' F R U R U' F'", alts: ["(U') f R f' U' r' U' R U M'"] },
        { id: 'oll-46', number: 46, name: 'OLL 46', nickname: "Seein' Headlights", alg: "R' U' R' F R F' U R" },
      ],
    },
    {
      id: 'p',
      title: 'Forma de P',
      text: 'Un bloque de 2×2 amarillo más una arista: parece una P.',
      cases: [
        { id: 'oll-31', number: 31, name: 'OLL 31', nickname: 'Couch', alg: "(U2) R' U' F U R U' R' F' R" },
        { id: 'oll-32', number: 32, name: 'OLL 32', nickname: 'Anti-Couch', alg: "S R U R' U' R' F R f'", alts: ["(U2) L U F' U' L' U L F L'", "R U B' U' R' U R B R'"] },
        { id: 'oll-43', number: 43, name: 'OLL 43', nickname: 'Anti-P', alg: "(U) R' U' F' U F R" },
        { id: 'oll-44', number: 44, name: 'OLL 44', nickname: 'P', alg: "f R U R' U' f'", alts: ["(U2) F U R U' R' F'"] },
      ],
    },
    {
      id: 'w',
      title: 'Forma de W',
      text: 'Escalones amarillos en zigzag, como una W.',
      cases: [
        { id: 'oll-36', number: 36, name: 'OLL 36', nickname: 'Wario', alg: "(U2) L' U' L U' L' U L U L F' L' F", alts: ["(U2) R U R' F' R U R' U' R' F R U' R' F R F'", "(U2) R' F' U' F2 U R U' R' F' R"] },
        { id: 'oll-38', number: 38, name: 'OLL 38', nickname: 'Mario', alg: "(U2) R U R' U R U' R' U' R' F R F'" },
      ],
    },
    {
      id: 'fish',
      title: 'Peces',
      text: 'La forma recuerda a un pez: una diagonal con una "cola".',
      cases: [
        { id: 'oll-9', number: 9, name: 'OLL 9', nickname: 'Kite', alg: "(U') R U R' U' R' F R2 U R' U' F'" },
        { id: 'oll-10', number: 10, name: 'OLL 10', nickname: 'Anti-Kite', alg: "(U') R U R' U R' F R F' R U2' R'", alts: ["F U F' R' F R U' R' F' R"] },
        { id: 'oll-35', number: 35, name: 'OLL 35', nickname: 'Fish Salad', alg: "R U2' R2' F R F' R U2' R'" },
        { id: 'oll-37', number: 37, name: 'OLL 37', nickname: 'Mounted Fish', alg: "(U) F R' F' R U R U' R'" },
      ],
    },
    {
      id: 'square',
      title: 'Cuadrados',
      text: 'Un cuadrado de 2×2 amarillo en una esquina.',
      cases: [
        { id: 'oll-5', number: 5, name: 'OLL 5', nickname: 'Lefty Square', alg: "(U2) l' U2 L U L' U l", alts: ["r' U2' R U R' U r"] },
        { id: 'oll-6', number: 6, name: 'OLL 6', nickname: 'Righty Square', alg: "(U2) r U2 R' U' R U' r'" },
      ],
    },
    {
      id: 'lightning',
      title: 'Rayos',
      text: 'Formas de rayo, chicas y grandes.',
      cases: [
        { id: 'oll-7', number: 7, name: 'OLL 7', nickname: 'Lightning', alg: "r U R' U R U2 r'" },
        { id: 'oll-8', number: 8, name: 'OLL 8', nickname: 'Reverse Lightning', alg: "l' U' L U' L' U2 l", alts: ["(U2) r' U' R U' R' U2 r", "R U2' R' U2 R' F R F'"] },
        { id: 'oll-11', number: 11, name: 'OLL 11', nickname: 'Downstairs', alg: "(U') r' R2 U R' U R U2' R' U M'", alts: ["(U) r U R' U R' F R F' R U2' r'"] },
        { id: 'oll-12', number: 12, name: 'OLL 12', nickname: 'Upstairs', alg: "(U') r R2' U' R U' R' U2 R U' r' R", alts: ["(U) l L2' U' L U' L' U2 L U' M'"] },
        { id: 'oll-39', number: 39, name: 'OLL 39', nickname: 'Fung', alg: "L F' L' U' L U F U' L'", alts: ["(U2) R U R' F' U' F U R U2' R'", "(U2) f' r U r' U' r' F r S"] },
        { id: 'oll-40', number: 40, name: 'OLL 40', nickname: 'Anti-Fung', alg: "R' F R U R' U' F' U R" },
      ],
    },
    {
      id: 'knight',
      title: 'Salto de caballo',
      text: 'Las piezas orientadas forman la jugada del caballo de ajedrez.',
      cases: [
        { id: 'oll-13', number: 13, name: 'OLL 13', nickname: 'Gun', alg: "F U R U2' R' U' R U R' F'", alts: ["F U R U' R2' F' R U R U' R'", "r U' r' U' r U r' F' U F"] },
        { id: 'oll-14', number: 14, name: 'OLL 14', nickname: 'Anti-Gun', alg: "R' F R U R' F' R F U' F'" },
        { id: 'oll-15', number: 15, name: 'OLL 15', nickname: 'Squeegee', alg: "(U2) l' U' l L' U' L U l' U l", alts: ["r' U' r R' U' R U r' U r"] },
        { id: 'oll-16', number: 16, name: 'OLL 16', nickname: 'Anti-Squeegee', alg: "(U2) r U r' R U R' U' r U' r'" },
      ],
    },
    {
      id: 'awkward',
      title: 'Formas raras',
      text: 'Casos que no encajan en otras familias (en inglés, "awkward").',
      cases: [
        { id: 'oll-29', number: 29, name: 'OLL 29', nickname: 'Spotted Chameleon', alg: "(U) R U R' U' R U' R' F' U' F R U R'", alts: ["(U) R U R' U' R' F R F' R U R' U' M' U R U' r'", "r2' D' r U r' D r2 U' r' U' r"] },
        { id: 'oll-30', number: 30, name: 'OLL 30', nickname: 'Anti-Spotted Chameleon', alg: "(U2) F U R U2' R' U' R U2 R' U' F'", alts: ["(U') r' D' r U' r' D r2 U' r' U r U r'", "(U2) F R' F R2 U' R' U' R U R' F2'"] },
        { id: 'oll-41', number: 41, name: 'OLL 41', nickname: 'Awkward Fish', alg: "(U2) R U R' U R U2 R' F R U R' U' F'" },
        { id: 'oll-42', number: 42, name: 'OLL 42', nickname: 'Lefty Awkward Fish', alg: "R' U' R U' R' U2' R F R U R' U' F'", alts: ["R' U' R U' R' U2' R U R' F' U' F U R", "(U) R' F R F' R' F R F' R U R' U' R U R'"] },
      ],
    },
    {
      id: 'corners',
      title: 'Esquinas orientadas',
      text: 'Las cuatro esquinas ya están bien; solo faltan aristas.',
      cases: [
        { id: 'oll-28', number: 28, name: 'OLL 28', nickname: 'Stealth', alg: "r U R' U' r' R U R U' R'", alts: ["U2 (M' U l L') U2 (M' U l L')", "U2 (M' U M) U2 (M' U M)"] },
        { id: 'oll-57', number: 57, name: 'OLL 57', nickname: 'Mummy', alg: "R U R' U' M' U R U' r'" },
      ],
    },
  ],
};

// OLL en 2 pasos: primero las aristas (cruz amarilla) y después las esquinas.
// La segunda parte usa los 7 casos del grupo "cruz" de arriba.
export const OLL_2LOOK = {
  intro:
    'Para empezar con CFOP no hace falta saber las 57: se puede hacer la OLL en dos pasos con 10 algoritmos. Primero se orientan las aristas (cruz amarilla) y después las esquinas.',
  edges: {
    title: '1. Orientar las aristas',
    text: 'Mirá qué figura forman las aristas amarillas arriba (ignorá las esquinas) y aplicá el algoritmo de esa figura.',
    stickering: 'eoll',
    cases: [
      {
        id: 'eo-line',
        name: 'Línea',
        description: 'La línea tiene que quedar horizontal (de izquierda a derecha).',
        alg: "F R U R' U' F'",
      },
      {
        id: 'eo-l',
        name: '"L"',
        description: 'La "L" tiene que quedar con sus brazos hacia el frente y hacia la derecha.',
        alg: "f R U R' U' f'",
      },
      {
        id: 'eo-dot',
        name: 'Punto',
        description: 'Ninguna arista amarilla arriba: es la línea seguida de la "L".',
        alg: "F R U R' U' F' f R U R' U' f'",
      },
    ],
  },
  corners: {
    title: '2. Orientar las esquinas',
    text: 'Con la cruz amarilla hecha, quedan 7 casos según cómo estén las esquinas: son los del grupo "Cruz" de la OLL completa.',
    caseIds: ['oll-27', 'oll-26', 'oll-21', 'oll-22', 'oll-23', 'oll-24', 'oll-25'],
  },
};
