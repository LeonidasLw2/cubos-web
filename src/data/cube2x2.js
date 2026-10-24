// 2x2: método principiante, Ortega y CLL. Solo datos (sin DOM).
// Todo se comprueba con `npm run verify-algs` en el KPuzzle de 2x2 (que no tiene centros:
// "resuelto" puede ser cualquier rotación del cubo entero, y el script lo tiene en cuenta).
// · OLL de Ortega y CLL: el grupo se calcula comparando la orientación de las esquinas con
//   OLL 21–27 del 3x3 (misma numeración de esquinas). Los CLL son algoritmos estándar de 2x2/CMLL
//   que usan solo caras exteriores o, si no había uno más corto, el más corto de una búsqueda
//   propia (el comentario dice de dónde sale cada uno).
// · PBL: top/bottom dicen cómo están permutadas las capas de arriba y de abajo en el caso.

export const CUBE2X2 = {
  intro: [
    'El 2x2 es un 3x3 sin aristas ni centros: solo tiene 8 esquinas. Por eso no hay un "color de cada cara" fijo: el color de una cara lo decide la primera capa que armes.',
    'Lo bueno: casi todo lo que sabés del 3x3 sirve. Lo nuevo: como no hay centros, el cubo puede quedar "resuelto" en cualquier orientación, y hay métodos propios muy rápidos.',
  ],
};

export const BEGINNER_2X2 = {
  id: 'principiante',
  title: 'Método principiante (2x2)',
  subtitle: 'Capa por capa, con 3 algoritmos',
  intro: [
    'Es el método principiante del 3x3 sin los pasos de aristas: primero la capa de abajo, después orientar las esquinas de arriba y por último permutarlas.',
    'Elegí un color para empezar (acá, blanco abajo). Como no hay centros, la primera esquina que pongas define dónde va cada color.',
  ],
  steps: [
    {
      id: 'first-layer',
      title: 'Primera capa',
      goal: 'Las cuatro esquinas blancas abajo, con los colores de los costados combinando entre sí.',
      stickering: '2x2-first-layer',
      text: [
        'Poné la primera esquina como quieras. Para cada una de las siguientes, buscala arriba, girá U hasta dejarla sobre su lugar (arriba a la derecha, al frente) y aplicá el algoritmo según hacia dónde mire el blanco. Son los mismos que en el 3x3.',
      ],
      cases: [
        { id: 'fl2-right', name: 'Blanco a la derecha', description: 'La esquina está arriba a la derecha y el blanco mira hacia la derecha.', alg: "R U R'" },
        { id: 'fl2-front', name: 'Blanco al frente', description: 'La esquina está arriba a la derecha y el blanco mira hacia el frente.', alg: "F' U' F" },
        { id: 'fl2-up', name: 'Blanco arriba', description: 'Con el blanco hacia arriba, primero se gira para que mire a un costado.', alg: "R U2 R' U' R U R'" },
      ],
    },
    {
      id: 'll-orient',
      title: 'Orientar la última capa',
      goal: 'Toda la cara de arriba amarilla.',
      stickering: '2x2-ll-orient',
      text: [
        'Igual que en el 3x3: si hay una sola esquina amarilla arriba (forma de pez), con un Sune o un Antisune alcanza. Si no hay ninguna o hay dos, poné una esquina con el amarillo mirando a la izquierda (adelante) y hacé el Sune; repetí hasta llegar al pez.',
      ],
      cases: [
        { id: 'll2-sune', name: 'Sune', description: 'Una sola esquina amarilla arriba, adelante a la izquierda.', alg: "R U R' U R U2 R'" },
        { id: 'll2-antisune', name: 'Antisune', description: 'Una sola esquina amarilla arriba, atrás a la derecha.', alg: "R U2 R' U' R U' R'" },
      ],
    },
    {
      id: 'll-permute',
      title: 'Permutar la última capa',
      goal: 'Las esquinas de arriba en su lugar: el cubo armado.',
      stickering: '2x2-ll-perm',
      text: [
        'Buscá "faros" (dos esquinas del mismo color en un lado), ponelos atrás y hacé el primero. Si no hay faros en ningún lado, las esquinas están cruzadas en diagonal: usá el segundo (o hacé el primero dos veces).',
      ],
      cases: [
        { id: 'pl2-headlights', name: 'Faros atrás', description: 'Las dos esquinas de atrás ya están bien entre sí.', alg: "R' F R' B2 R F' R' B2 R2", headlights: 'back' },
        { id: 'pl2-diagonal', name: 'En diagonal', description: 'No hay faros: dos esquinas opuestas están intercambiadas.', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", headlights: 'none' },
      ],
    },
  ],
};

export const ORTEGA = {
  id: 'ortega',
  title: 'Método Ortega',
  subtitle: 'Primera cara, OLL y PBL',
  intro: [
    'Ortega es el método más popular entre quienes empiezan a ir rápido en 2x2. En vez de armar una capa entera, arma solo una cara (sin importar los costados), orienta la de arriba y al final permuta las dos capas a la vez.',
    'Son 12 algoritmos: 7 de OLL y 5 de PBL. Los de OLL son los mismos casos de esquinas que la OLL del 3x3.',
  ],
  face: {
    title: '1. Primera cara',
    stickering: '2x2-first-face',
    text: [
      'Solo hay que lograr que la cara de abajo sea toda del mismo color; no importa si los costados combinan (eso lo arregla el PBL). Es más fácil y rápido que una capa completa, y se planea en la inspección.',
    ],
    cases: [
      { id: 'face-right', name: 'Blanco a la derecha', description: 'Una esquina con blanco arriba, mirando a la derecha: entra con R U R\'.', alg: "R U R'", orientedBefore: 3 },
      { id: 'face-front', name: 'Blanco al frente', description: 'Con el blanco mirando al frente entra por F.', alg: "F' U' F", orientedBefore: 3 },
    ],
  },
  oll: {
    title: '2. OLL (7 casos)',
    stickering: '2x2-oll',
    text: [
      'Con la cara de abajo hecha, se orientan las esquinas de arriba. Son los 7 casos de esquinas de la OLL del 3x3 (los mismos nombres).',
    ],
    cases: [
      { id: 'oll2-h', name: 'H', group: 'H', alg: "R2 U2 R U2 R2" }, // 2x2 clásico
      { id: 'oll2-pi', name: 'Pi', group: 'Pi', alg: "R U2' R2' U' R2 U' R2' U2' R" }, // OLL 22
      { id: 'oll2-u', name: 'U (faros)', group: 'U', alg: "R' U' F' U F R" }, // OLL 43
      { id: 'oll2-t', name: 'T', group: 'T', alg: "R B R' F R B' R' F'" }, // OLL 25 inv
      { id: 'oll2-l', name: 'L (diagonal)', group: 'L', alg: "F R B R' F' R B' R'" }, // OLL 25
      { id: 'oll2-s', name: 'Sune', group: 'S', alg: "R U R' U R U2' R'" }, // OLL 26 inv
      { id: 'oll2-as', name: 'Antisune', group: 'AS', alg: "R U2 R' U' R U' R'" }, // OLL 26
    ],
  },
  pbl: {
    title: '3. PBL (5 casos)',
    stickering: '2x2-pbl',
    text: [
      'Con las dos caras orientadas, se permutan las dos capas a la vez. Para reconocer el caso, mirá cada capa: si tiene "faros" (dos esquinas iguales en un lado) es un intercambio adyacente; si no tiene, es en diagonal. Si solo la capa de abajo está mal, dá vuelta el cubo.',
    ],
    cases: [
      { id: 'pbl-adj', name: 'Adyacente arriba', description: 'Arriba hay faros (intercambio adyacente) y abajo está todo bien.', alg: "R U R' U' R' F R2 U' R' U' R U R' F'", top: 'adj', bottom: 'none' },
      { id: 'pbl-diag', name: 'Diagonal arriba', description: 'Arriba no hay faros (intercambio en diagonal) y abajo está todo bien.', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", top: 'diag', bottom: 'none' },
      { id: 'pbl-adj-adj', name: 'Adyacente y adyacente', description: 'Faros arriba y abajo.', alg: "R2 U' B2 U2 R2 U' R2", top: 'adj', bottom: 'adj' },
      { id: 'pbl-diag-diag', name: 'Diagonal y diagonal', description: 'Sin faros arriba ni abajo.', alg: 'R2 F2 R2', top: 'diag', bottom: 'diag' },
      { id: 'pbl-adj-diag', name: 'Adyacente y diagonal', description: 'Faros en una capa y en la otra no.', alg: "R U' R F2 R' U R'", top: 'adj', bottom: 'diag' },
    ],
  },
  eg: 'Más adelante existe EG: un método en el que la primera cara tampoco necesita estar permutada y se resuelve todo lo de arriba (y lo de abajo) con un algoritmo. Tiene más de 120 casos; lo usan los más rápidos del mundo.',
};

export const CLL = {
  id: 'cll',
  title: 'CLL',
  subtitle: 'La última capa en un solo algoritmo',
  stickering: '2x2-cll',
  intro: [
    'CLL es para quien ya domina el 2x2 y quiere ir más rápido: con la primera capa completa (como en el principiante), se resuelven las cuatro esquinas de arriba en un solo algoritmo. Son 42 casos, agrupados igual que la OLL (por cómo están giradas las esquinas).',
    'Conviene aprenderlos por grupo, empezando por el Sune y el Antisune, que ya conocés.',
  ],
  groups: [
      {
        id: 'o',
        title: 'O · esquinas orientadas',
        text: 'Las cuatro esquinas ya miran arriba: solo falta permutarlas.',
        cases: [
          { id: 'cll-o1', name: 'O 1', group: 'O', alg: "R2 F2 R' B' R F2 R' B R'" }, // PLL Aa óptimo
          { id: 'cll-o2', name: 'O 2', group: 'O', alg: "R U' R' U' F2 U' R U R' U F2" }, // estándar de 2x2
        ],
      },
      {
        id: 'h',
        title: 'H',
        text: 'Ninguna esquina mira arriba; el color de arriba queda de a pares en lados opuestos.',
        cases: [
          { id: 'cll-h1', name: 'H 1', group: 'H', alg: "R2 U2 R U2 R2" }, // 2x2 clásico
          { id: 'cll-h2', name: 'H 2', group: 'H', alg: "R U2' R2' F R F' U2 R' F R F'" }, // OLL 1
          { id: 'cll-h3', name: 'H 3', group: 'H', alg: "R U R' U R U R' F R' F' R" }, // estándar de 2x2
          { id: 'cll-h4', name: 'H 4', group: 'H', alg: "R2 F' U2 F2 R2 F' R2", alts: ["F R U R' U' R U R' U' R U R' U' F'"] }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'pi',
        title: 'Pi',
        text: 'Ninguna esquina mira arriba; dos stickers en un costado y dos en el opuesto, mirando hacia afuera.',
        cases: [
          { id: 'cll-pi1', name: 'Pi 1', group: 'Pi', alg: "R U2' R2' U' R2 U' R2' U2' R" }, // OLL 22
          { id: 'cll-pi2', name: 'Pi 2', group: 'Pi', alg: "R U R' U R U' B U' B' R'" }, // OLL 52
          { id: 'cll-pi3', name: 'Pi 3', group: 'Pi', alg: "F R' F' R U2' F R' F' R2 U2 R'" }, // OLL 1 inv
          { id: 'cll-pi4', name: 'Pi 4', group: 'Pi', alg: "F R' F' R U2 R U' R' U R U2' R'" }, // OLL 47
          { id: 'cll-pi5', name: 'Pi 5', group: 'Pi', alg: "R U2 R' U' R U R' U2' R' F R F'" }, // OLL 47 inv
          { id: 'cll-pi6', name: 'Pi 6', group: 'Pi', alg: "R' F R F' R U' R' U' R U' R'" }, // estándar de 2x2
        ],
      },
      {
        id: 'u',
        title: 'U',
        text: 'Dos esquinas vecinas miran arriba y las otras dos tienen el color de arriba hacia el mismo lado.',
        cases: [
          { id: 'cll-u1', name: 'U 1', group: 'U', alg: "R' U' F' U F R" }, // OLL 43
          { id: 'cll-u2', name: 'U 2', group: 'U', alg: "L2 D L' U2 L D' L' U2 L'" }, // OLL 23 esp
          { id: 'cll-u3', name: 'U 3', group: 'U', alg: "R2' D' R U2 R' D R U2 R" }, // OLL 23
          { id: 'cll-u4', name: 'U 4', group: 'U', alg: "R2 F2 R U2 R' F2 R F2 R" }, // búsqueda propia (el más corto encontrado)
          { id: 'cll-u5', name: 'U 5', group: 'U', alg: "F2 R U' R' U R U R2' F' R F'" }, // OLL 30 inv
          { id: 'cll-u6', name: 'U 6', group: 'U', alg: "F R2 D R' U R D' R2 U' F'" }, // estándar de 2x2
        ],
      },
      {
        id: 't',
        title: 'T',
        text: 'Dos esquinas vecinas miran arriba y las otras dos, hacia lados opuestos.',
        cases: [
          { id: 'cll-t1', name: 'T 1', group: 'T', alg: "R U R' U' R' F R F'" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cll-t2', name: 'T 2', group: 'T', alg: "L' U' L U L F' L' F" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cll-t3', name: 'T 3', group: 'T', alg: "R' U' F' U F R' U2 R U2 R2" }, // el mismo de antes, escrito sin R3
          { id: 'cll-t4', name: 'T 4', group: 'T', alg: "F R' F R2 U' R' U' R U R' F2'" }, // OLL 30
          { id: 'cll-t5', name: 'T 5', group: 'T', alg: "F R' U' R F' R' U F' R" }, // búsqueda propia (el más corto encontrado)
          { id: 'cll-t6', name: 'T 6', group: 'T', alg: "R' U R U2 R2 F R F' R" }, // estándar de 2x2
        ],
      },
      {
        id: 's',
        title: 'S (Sune)',
        text: 'Una sola esquina mira arriba; las otras tres están giradas igual (Sune).',
        cases: [
          { id: 'cll-s1', name: 'S 1', group: 'S', alg: "R U R' U R U2' R'" }, // OLL 26 inv
          { id: 'cll-s2', name: 'S 2', group: 'S', alg: "F R' F' R U2' R U2 R'" }, // OLL 8 inv
          { id: 'cll-s3', name: 'S 3', group: 'S', alg: "L' U2 L U2 L F' L' F" }, // OLL 8 esp
          { id: 'cll-s4', name: 'S 4', group: 'S', alg: "R U' L' U R' U' L" }, // estándar de 2x2
          { id: 'cll-s5', name: 'S 5', group: 'S', alg: "R U R' U R' F R F' R U2' R'" }, // OLL 10
          { id: 'cll-s6', name: 'S 6', group: 'S', alg: "F2 R U F2 R F2 U' R' F2" }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'as',
        title: 'AS (Antisune)',
        text: 'Una sola esquina mira arriba; las otras tres están giradas hacia el otro lado (Antisune).',
        cases: [
          { id: 'cll-as1', name: 'AS 1', group: 'AS', alg: "R U2 R' U' R U' R'" }, // OLL 26
          { id: 'cll-as2', name: 'AS 2', group: 'AS', alg: "F' L F L' U2' L' U2' L" }, // OLL 8 esp inv
          { id: 'cll-as3', name: 'AS 3', group: 'AS', alg: "R U2' R' U2 R' F R F'" }, // OLL 8
          { id: 'cll-as4', name: 'AS 4', group: 'AS', alg: "L' U R U' L U R'" }, // estándar de 2x2
          { id: 'cll-as5', name: 'AS 5', group: 'AS', alg: "R U2 R' F R' F' R U' R U' R'" }, // OLL 10 inv
          { id: 'cll-as6', name: 'AS 6', group: 'AS', alg: "F2 R U F2 R' F2 U' R' F2" }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'l',
        title: 'L',
        text: 'Dos esquinas en diagonal miran arriba.',
        cases: [
          { id: 'cll-l1', name: 'L 1', group: 'L', alg: "F' L F L' U' L' U L" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cll-l2', name: 'L 2', group: 'L', alg: "F R' F' R U R U' R'" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cll-l3', name: 'L 3', group: 'L', alg: "L U2' L D L' U2' L D' L2'" }, // OLL 23 esp inv
          { id: 'cll-l4', name: 'L 4', group: 'L', alg: "R U2' R2' F R F' R U2' R'" }, // OLL 35
          { id: 'cll-l5', name: 'L 5', group: 'L', alg: "R' U2' R' D' R U2' R' D R2" }, // OLL 23 inv
          { id: 'cll-l6', name: 'L 6', group: 'L', alg: "R2 U R' U2 R U2 R' U R2" }, // estándar de 2x2
        ],
      },
  ],
};
