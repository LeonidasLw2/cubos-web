// Método Roux (3x3). Solo datos (sin DOM). Todo se comprueba con `npm run verify-algs`.
// · Bloques (FB y SB): ejemplos intuitivos. before/goal dicen qué piezas tienen que estar
//   armadas antes y después (dl, fbFront, fbBack = primer bloque; dr, sbFront, sbBack = segundo).
// · CMLL: los 42 casos. El grupo (O, H, Pi, U, T, S, AS, L) lo calcula el script comparando la
//   orientación de las esquinas con OLL 21–27; los 42 tienen que ser distintos (= están todos).
//   Algoritmos estándar de CMLL (lista pública de scheopner.com) o, donde esa lista no tenía
//   uno más corto, el más corto de una búsqueda propia; el comentario dice de dónde sale cada uno.
// · LSE: ejemplos con M y U. Para EO, "bad" es la cantidad de aristas mal orientadas del caso;
//   para UL/UR, "ul"/"ur" dicen dónde están esas aristas; para las últimas 4, "moved" es cuántas
//   de esas aristas están fuera de lugar.

export const ROUX = {
  id: 'roux',
  title: 'Método Roux',
  subtitle: 'Bloques, esquinas y las últimas seis aristas',
  intro: [
    'Roux arma primero dos bloques de 1×2×3 a los costados (izquierda y derecha), después las cuatro esquinas de arriba (CMLL) y termina con las seis aristas que quedan, usando casi solo giros de M (la capa del medio) y de U.',
    'Como la capa del medio queda libre hasta el final, Roux necesita menos movimientos que CFOP y muy pocos algoritmos. A cambio, hay que acostumbrarse a los giros de M y a armar bloques de forma intuitiva.',
  ],
  comparison: [
    ['Pasos', 'Cruz, F2L, OLL, PLL', 'Primer bloque, segundo bloque, CMLL, LSE'],
    ['Algoritmos (completo)', '78 (57 OLL + 21 PLL)', '42 CMLL y unos pocos de LSE'],
    ['Movimientos', 'Más movimientos, se compensa con velocidad de dedos', 'Menos movimientos (el medio queda libre hasta el final)'],
    ['Lo más difícil', 'Reconocer y ejecutar rápido muchos casos', 'Planear bloques sin la ayuda de una cruz y dominar M'],
    ['Giros típicos', 'R, U, L, F, rotaciones', 'R, U, r, M (casi sin rotaciones)'],
  ],
  stages: [
    {
      id: 'fb',
      title: '1. Primer bloque (izquierda)',
      stickering: 'roux-fb',
      text: [
        'El primer bloque es un 1×2×3 en la izquierda: la arista de abajo a la izquierda, el centro izquierdo y dos pares esquina-arista (uno adelante y uno atrás).',
        'No hay algoritmos fijos: se arma de forma intuitiva, como el F2L pero con más libertad, porque todavía no hay nada armado que cuidar. Lo habitual es poner primero la arista de abajo y después cada par.',
      ],
      cases: [
        {
          id: 'fb-dl',
          name: 'La arista de abajo',
          description: 'La arista que va abajo a la izquierda está arriba al frente. U la lleva sobre su lugar y L2 la baja.',
          alg: 'U L2',
          before: [],
          goal: ['dl'],
        },
        {
          id: 'fb-front',
          name: 'El par de adelante',
          description: 'Esquina y arista del frente ya forman un par arriba. Se baja con la cara izquierda, sin romper la arista de abajo.',
          alg: "L' U' L",
          before: ['dl'],
          goal: ['dl', 'fbFront'],
        },
        {
          id: 'fb-back',
          name: 'El par de atrás',
          description: 'Lo mismo con el par de atrás: L U L\' lo inserta en la parte trasera del bloque.',
          alg: "L U L'",
          before: ['dl', 'fbFront'],
          goal: ['dl', 'fbFront', 'fbBack'],
        },
      ],
    },
    {
      id: 'sb',
      title: '2. Segundo bloque (derecha)',
      stickering: 'roux-sb',
      text: [
        'El segundo bloque es igual pero a la derecha. Ahora hay que cuidar el primero, así que se usan sobre todo R, U, r y M, que no lo tocan.',
        'Truco: los pares se arman arriba usando la capa del medio (M) como espacio libre, algo que CFOP no puede hacer porque ahí está la cruz.',
      ],
      cases: [
        {
          id: 'sb-dr',
          name: 'La arista de abajo',
          description: 'La arista de abajo a la derecha está arriba al frente: U\' la acomoda y R2 la baja.',
          alg: "U' R2",
          before: ['dl', 'fbFront', 'fbBack'],
          goal: ['dr'],
        },
        {
          id: 'sb-front',
          name: 'El par de adelante',
          description: 'Par ya formado arriba, listo para entrar adelante con R U R\'.',
          alg: "R U R'",
          before: ['dl', 'fbFront', 'fbBack', 'dr'],
          goal: ['dr', 'sbFront'],
        },
        {
          id: 'sb-back',
          name: 'El par de atrás',
          description: 'El par de atrás entra con R\' U\' R.',
          alg: "R' U' R",
          before: ['dl', 'fbFront', 'fbBack', 'dr', 'sbFront'],
          goal: ['dr', 'sbFront', 'sbBack'],
        },
      ],
    },
  ],
  cmll: {
    title: '3. CMLL: las esquinas de arriba',
    stickering: 'cmll',
    text: [
      'Con los dos bloques armados, se resuelven las cuatro esquinas de arriba en un solo algoritmo, sin importar las aristas ni la capa del medio. Son 42 casos, agrupados por cómo están giradas las esquinas (el mismo criterio que la OLL de esquinas).',
      'Para empezar alcanza con hacerlo en dos pasos: primero orientar las esquinas (los 7 casos de la cruz de la OLL) y después permutarlas. Los algoritmos de esta lista son los cortos y conocidos de CMLL (en general de 7 a 11 movimientos) y no tocan los bloques.',
    ],
    groups: [
      {
        id: 'o',
        title: 'O · esquinas orientadas',
        text: 'Las cuatro esquinas ya miran arriba: solo hay que permutarlas (dos casos: intercambio adyacente o en diagonal).',
        cases: [
          { id: 'cmll-o1', name: 'O 1', group: 'O', alg: "R2 F2 R' B' R F2 R' B R'" }, // PLL Aa óptimo
          { id: 'cmll-o2', name: 'O 2', group: 'O', alg: "R2 U2 F2 U' R2 U2 F2 U R2 U2 F2" }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'h',
        title: 'H',
        text: 'Ninguna esquina mira arriba y los stickers de arriba quedan de a pares en lados opuestos.',
        cases: [
          { id: 'cmll-h1', name: 'H 1', group: 'H', alg: "R U R' U R U' R' U R U2 R'" }, // OLL 21
          { id: 'cmll-h2', name: 'H 2', group: 'H', alg: "R U' R2 D' r U' r' D R2 U R'" }, // OLL 1
          { id: 'cmll-h3', name: 'H 3', group: 'H', alg: "R U2' R2' F R F' U2 R' F R F'" }, // OLL 1
          { id: 'cmll-h4', name: 'H 4', group: 'H', alg: "F R U R' U' R U R' U' R U R' U' F'", alts: ["F R2 F2 U2 F R2 F' U2 F2 R2 F'"] }, // estándar (lista de CMLL de scheopner.com)
        ],
      },
      {
        id: 'pi',
        title: 'Pi',
        text: 'Ninguna esquina mira arriba; en un costado hay dos stickers de arriba y en el opuesto, otros dos, mirando hacia afuera.',
        cases: [
          { id: 'cmll-pi1', name: 'Pi 1', group: 'Pi', alg: "R U2' R2' U' R2 U' R2' U2' R" }, // OLL 22
          { id: 'cmll-pi2', name: 'Pi 2', group: 'Pi', alg: "R U R' U R U' B U' B' R'" }, // OLL 52
          { id: 'cmll-pi3', name: 'Pi 3', group: 'Pi', alg: "F R' F' R U2' F R' F' R2 U2 R'" }, // OLL 1 inv
          { id: 'cmll-pi4', name: 'Pi 4', group: 'Pi', alg: "R U' R2' D' r U r' D R2' U R'" }, // OLL 1 inv
          { id: 'cmll-pi5', name: 'Pi 5', group: 'Pi', alg: "F R' F' R U2 R U' R' U R U2' R'" }, // OLL 47
          { id: 'cmll-pi6', name: 'Pi 6', group: 'Pi', alg: "R U2 R' U' R U R' U2' R' F R F'" }, // OLL 47 inv
        ],
      },
      {
        id: 'u',
        title: 'U',
        text: 'Dos esquinas vecinas miran arriba y las otras dos tienen el color de arriba hacia el mismo lado (como faros).',
        cases: [
          { id: 'cmll-u1', name: 'U 1', group: 'U', alg: "R' U' F' U F R" }, // OLL 43
          { id: 'cmll-u2', name: 'U 2', group: 'U', alg: "L2 D L' U2 L D' L' U2 L'" }, // OLL 23 esp
          { id: 'cmll-u3', name: 'U 3', group: 'U', alg: "R2' D' R U2 R' D R U2 R" }, // OLL 23
          { id: 'cmll-u4', name: 'U 4', group: 'U', alg: "F U R U2' R' U R U2 R' U' F'" }, // OLL 30 inv
          { id: 'cmll-u5', name: 'U 5', group: 'U', alg: "F2 R U' R' U R U R2' F' R F'" }, // OLL 30 inv
          { id: 'cmll-u6', name: 'U 6', group: 'U', alg: "F R2 D R' U R D' R2 U' F'" }, // estándar (lista de CMLL de scheopner.com)
        ],
      },
      {
        id: 't',
        title: 'T',
        text: 'Dos esquinas vecinas miran arriba y las otras dos tienen el color de arriba hacia lados opuestos.',
        cases: [
          { id: 'cmll-t1', name: 'T 1', group: 'T', alg: "L' U' L U L F' L' F" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-t2', name: 'T 2', group: 'T', alg: "R U R' U' R' F R F'" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-t3', name: 'T 3', group: 'T', alg: "F R' F R2 U' R' U' R U R' F2'" }, // OLL 30
          { id: 'cmll-t4', name: 'T 4', group: 'T', alg: "F U R U2' R' U' R U2 R' U' F'" }, // OLL 30
          { id: 'cmll-t5', name: 'T 5', group: 'T', alg: "r2' D' r U r' D r2 U' r' U' r" }, // OLL 29
          { id: 'cmll-t6', name: 'T 6', group: 'T', alg: "r' U r U2 R2 F R F' R" }, // estándar (lista de CMLL de scheopner.com)
        ],
      },
      {
        id: 's',
        title: 'S (Sune)',
        text: 'Una sola esquina mira arriba; las otras tres están giradas igual (forma de "pez", como en el Sune).',
        cases: [
          { id: 'cmll-s1', name: 'S 1', group: 'S', alg: "R U R' U R U2 R'" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-s2', name: 'S 2', group: 'S', alg: "F R' F' R U2' R U2 R'" }, // OLL 8 inv
          { id: 'cmll-s3', name: 'S 3', group: 'S', alg: "L' U2 L U2 L F' L' F" }, // OLL 8 esp
          { id: 'cmll-s4', name: 'S 4', group: 'S', alg: "R U' L' U R' U' L" }, // estándar (lista de CMLL de scheopner.com)
          { id: 'cmll-s5', name: 'S 5', group: 'S', alg: "R U R' U R' F R F' R U2' R'" }, // OLL 10
          { id: 'cmll-s6', name: 'S 6', group: 'S', alg: "R U2 R2 F2 R F R' F2 R2 U2 R'" }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'as',
        title: 'AS (Antisune)',
        text: 'Una sola esquina mira arriba; las otras tres están giradas igual pero hacia el otro lado (Antisune).',
        cases: [
          { id: 'cmll-as1', name: 'AS 1', group: 'AS', alg: "L' U' L U' L' U2 L" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-as2', name: 'AS 2', group: 'AS', alg: "F' L F L' U2' L' U2' L" }, // OLL 8 esp inv
          { id: 'cmll-as3', name: 'AS 3', group: 'AS', alg: "R U2' R' U2 R' F R F'" }, // OLL 8
          { id: 'cmll-as4', name: 'AS 4', group: 'AS', alg: "L' U R U' L U R'" }, // estándar (lista de CMLL de scheopner.com)
          { id: 'cmll-as5', name: 'AS 5', group: 'AS', alg: "R U2 R' F R' F' R U' R U' R'" }, // OLL 10 inv
          { id: 'cmll-as6', name: 'AS 6', group: 'AS', alg: "R U2 R2 F2 R F' R' F2 R2 U2 R'" }, // búsqueda propia (el más corto encontrado)
        ],
      },
      {
        id: 'l',
        title: 'L',
        text: 'Dos esquinas en diagonal miran arriba.',
        cases: [
          { id: 'cmll-l1', name: 'L 1', group: 'L', alg: "F R' F' R U R U' R'" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-l2', name: 'L 2', group: 'L', alg: "F' L F L' U' L' U L" }, // estándar, mismo largo sin giros anchos ni B
          { id: 'cmll-l3', name: 'L 3', group: 'L', alg: "L U2' L D L' U2' L D' L2'" }, // OLL 23 esp inv
          { id: 'cmll-l4', name: 'L 4', group: 'L', alg: "R U2' R2' F R F' R U2' R'" }, // OLL 35
          { id: 'cmll-l5', name: 'L 5', group: 'L', alg: "R' U2' R' D' R U2' R' D R2" }, // OLL 23 inv
          { id: 'cmll-l6', name: 'L 6', group: 'L', alg: "R U2 R' U' R U R' U' R U R' U' R U' R'", alts: ["R U R2 F R F' U F U2 F U2 F'"] }, // estándar (lista de CMLL de scheopner.com)
        ],
      },
    ],
  },
  lse: {
    title: '4. LSE: las últimas seis aristas',
    text: [
      'Quedan seis aristas (las cuatro de arriba y las dos del medio de abajo) y los centros de la capa del medio. Todo se resuelve con M y U, en tres pasos.',
    ],
    steps: [
      {
        id: 'eo',
        title: '4a. Orientar las aristas (EO)',
        stickering: 'lse-eo',
        text: 'Una arista está "bien" si su color de arriba/abajo mira hacia arriba o hacia abajo. Se cuentan las malas y se arreglan con secuencias cortas de M y U.',
        cases: [
          { id: 'eo-4', name: 'Cuatro malas', description: 'Cuatro aristas con el color de arriba hacia un costado.', alg: "M U M' U'", step: 'eo', bad: 4 },
          { id: 'eo-2', name: 'Dos malas', description: 'Solo dos aristas mal orientadas: hace falta un poco más de recorrido.', alg: 'M U M U2 M U M', step: 'eo', bad: 2 },
        ],
      },
      {
        id: 'ulur',
        title: '4b. UL y UR',
        stickering: 'lse-ulur',
        text: 'Se ubican las aristas de izquierda y derecha de arriba (las que van entre los bloques). Primero se juntan las dos abajo (en el medio) y después se suben con M2.',
        cases: [
          { id: 'ulur-down', name: 'Las dos abajo', description: 'UL y UR están en la capa del medio, abajo: se suben juntas.', alg: "U M2 U' M2", step: 'ulur', ul: 'DF', ur: 'DB' },
          { id: 'ulur-mix-1', name: 'Una arriba, una abajo', description: 'UL está arriba (donde va UR) y UR está abajo atrás.', alg: "U M U2 M' U", step: 'ulur', ul: 'UR', ur: 'DB' },
          { id: 'ulur-mix-2', name: 'Una abajo, una arriba', description: 'UL está abajo adelante y UR arriba (donde va UL).', alg: "U M' U2 M U", step: 'ulur', ul: 'DF', ur: 'UL' },
        ],
      },
      {
        id: 'l4e',
        title: '4c. Las últimas cuatro aristas',
        stickering: 'lse-l4e',
        text: 'Quedan las cuatro aristas de la capa del medio (adelante y atrás, arriba y abajo). Se permutan con M2, M y U2.',
        cases: [
          { id: 'l4e-h', name: 'Intercambio doble', description: 'Las dos de arriba y las dos de abajo están cambiadas.', alg: 'M2 U2 M2 U2', step: 'l4e', moved: 4 },
          { id: 'l4e-a', name: 'Ciclo de tres', description: 'Tres aristas rotan entre sí.', alg: "M U2 M' U2", step: 'l4e', moved: 3 },
          { id: 'l4e-b', name: 'Ciclo de tres (al revés)', description: 'El mismo ciclo, hacia el otro lado.', alg: "M' U2 M U2", step: 'l4e', moved: 3 },
          { id: 'l4e-c', name: 'Ciclo de tres (abajo)', description: 'Otro ciclo de tres, que involucra la de abajo adelante.', alg: "U2 M' U2 M", step: 'l4e', moved: 3 },
        ],
      },
    ],
  },
};
