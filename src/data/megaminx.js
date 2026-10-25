// Megaminx: notación WCA (R++, R--, D++, D--, U, U') y notación de resolución,
// más el método estándar en 6 etapas (1. Estrella, 2. Primera cara, 3. F2L, 4. S2L,
// 5. Resto de caras, 6. Última capa en 4 pasos) y mención de OLL/PLL avanzados.
// Todos los algoritmos incluidos están verificados con el KPuzzle de megaminx.

export const MEGAMINX = {
  intro:
    'El Megaminx es un dodecaedro de 12 caras pentagonales (50 piezas móviles: 20 esquinas y 30 aristas, más 12 centros fijos). Como tiene la misma mecánica de esquinas y aristas que el 3x3, casi todo lo que sabés de Cruz y F2L se traslada directo.',
  notation: {
    title: 'Notación del Megaminx (Mezcla WCA y Resolución)',
    puzzle: 'megaminx',
    stickering: 'full',
    text: [
      'En el Megaminx conviven dos notaciones: la notación de mezcla oficial WCA (Pochmann: R++, R--, D++, D--, U, U\') y la notación de caras para los algoritmos de resolución (U, F, R, L, BR, BL, DR, DL… donde cada giro simple es de 72°, es decir 1/5 de vuelta):',
    ],
    rows: [
      ['R++  /  R--', 'Mezcla WCA: gira 2/5 de vuelta (144°) todo el dodecaedro excepto la cara superior-izquierda.'],
      ['D++  /  D--', 'Mezcla WCA: gira 2/5 de vuelta (144°) todo el dodecaedro excepto la cara superior (U).'],
      ["U  /  U'", 'Gira 1/5 de vuelta (72°) la cara superior en sentido horario (U) o antihorario (U\').'],
      ['U2  ·  R2  ·  F2', 'Gira 2/5 de vuelta (144°) en sentido horario; con U2\' gira 2/5 en sentido antihorario.'],
    ],
    cases: [
      { id: 'mega-n-u', name: 'U', description: 'Giro de 1/5 de vuelta (72°) horario de la cara superior.', alg: 'U' },
      { id: 'mega-n-r', name: 'R', description: 'Giro de 1/5 de vuelta (72°) horario de la cara derecha.', alg: 'R' },
      { id: 'mega-n-f', name: 'F', description: 'Giro de 1/5 de vuelta (72°) horario de la cara frontal.', alg: 'F' },
      { id: 'mega-n-u2', name: 'U2', description: 'Giro de 2/5 de vuelta (144°) horario de la cara superior.', alg: 'U2' },
    ],
  },
};

export const MEGAMINX_STANDARD = {
  title: 'Megaminx · Método Estándar en 6 Etapas',
  intro: [
    'El método estándar resuelve el Megaminx de abajo hacia arriba extendiendo el concepto de Cruz + F2L del 3x3 a 12 caras pentagonales, y termina la última capa superior en 4 pasos sistemáticos.',
  ],
  steps: [
    {
      id: 'estrella',
      title: '1. Estrella (Cara base)',
      goal: 'Colocar las 5 aristas blancas alrededor del centro blanco alineadas con los 5 centros vecinos.',
      text: [
        'Equivale exactamente a la cruz del 3x3, pero con 5 aristas en lugar de 4. Como el Megaminx tiene muchas caras libres, podés llevar cada arista blanca a su centro lateral y bajarla a la base sin deshacer las anteriores.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-star-1',
          name: 'Alinear y bajar una arista de la estrella',
          description: 'Coloca la arista en su cara vecina y la une al centro de referencia.',
          alg: "F R",
        },
      ],
    },
    {
      id: 'primera-cara',
      title: '2. Primera cara (5 esquinas de la base)',
      goal: 'Insertar las 5 esquinas blancas en sus ranuras entre las puntas de la estrella.',
      text: [
        'Igual que en la primera capa del 3x3: buscás cada esquina blanca, la ubicás encima de su ranura entre sus dos colores laterales e insertás con R U R\' o F\' U\' F.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-fc-right',
          name: 'Inserción básica por la derecha',
          description: 'Mete la esquina en su ranura con 3 movimientos.',
          alg: "R U R'",
        },
        {
          id: 'mega-fc-left',
          name: 'Inserción básica por la izquierda',
          description: 'Mete la esquina desde la cara frontal.',
          alg: "F' U' F",
        },
      ],
    },
    {
      id: 'f2l-megaminx',
      title: '3. F2L (Primeras dos capas inferiores)',
      goal: 'Completar las 5 aristas ecuatoriales entre los 5 colores que rodean la base blanca.',
      text: [
        'Con la estrella lista, podés armar cada par esquina-arista de las 5 ranuras inferiores igual que en el F2L del 3x3 (aprovechando que tenés todavía más espacio libre para juntar las dos piezas sin romper lo armado).',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-f2l-pair',
          name: 'Armar e insertar par F2L',
          description: 'Une la esquina y la arista en U y las baja juntas a la ranura entre F y R.',
          alg: "U R U' R'",
        },
      ],
    },
    {
      id: 's2l',
      title: '4. S2L (Second Two Layers · Bloques medios)',
      goal: 'Armar las dos aristas inferiores ("mini-estrella") y los pares F2L de las caras laterales en orden circular.',
      text: [
        'Para la mitad superior del Megaminx (conocida como S2L) se avanza cara por cara alrededor del dodecaedro: en cada cara colocás las 2 aristas inferiores que la conectan con el F2L y después insertás las 2 esquinas con sus aristas laterales.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-s2l-slot',
          name: 'Inserción limpia de par S2L',
          description: 'Inserta un par en la ranura superior sin desarmar las caras ya cerradas.',
          alg: "R U R' U' R U R'",
        },
      ],
    },
    {
      id: 'resto-caras',
      title: '5. Resto de caras laterales',
      goal: 'Cerrar la última cara lateral antes de quedar únicamente con la capa superior (U).',
      text: [
        'Al llegar a la quinta y última cara lateral, trabajá usando solo esa cara y la cara superior U (igual que cuando cerrás el cuarto par de F2L en el 3x3) para dejar las 11 caras inferiores completamente resueltas.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-last-slot',
          name: 'Cerrar el último par antes de la capa superior',
          description: 'Empareja e inserta el último bloque usando solo R y U.',
          alg: "R U' R' U2 R U R'",
        },
      ],
    },
    {
      id: 'ultima-capa-4pasos',
      title: '6. Última capa en 4 pasos (OLL y PLL de 2 looks)',
      goal: '1) Orientar aristas (estrella superior) → 2) Orientar esquinas → 3) Permutar aristas → 4) Permutar esquinas.',
      text: [
        'Paso 6a (Orientar aristas): usá F R U R\' U\' F\' o F U R U\' R\' F\' hasta que las 5 aristas superiores formen la estrella en U.',
        'Paso 6b (Orientar esquinas): usá Sune (R U R\' U R U2\' R\') o Antisune para dejar toda la cara superior del mismo color.',
        'Paso 6c (Permutar aristas): ciclá las aristas de la estrella superior con variantes de Sune hasta que las 5 coincidan con sus caras laterales.',
        'Paso 6d (Permutar esquinas): sacá una esquina mal ubicada a la capa R con R\' D\' R, girá la capa U para traer el lugar donde va esa esquina, insertala con R\' D R y repetí hasta cerrar las 5 esquinas.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'mega-ll-eo1',
          name: 'Paso 6a · Orientar aristas (Flecha → Estrella)',
          description: 'Orienta dos aristas adyacentes de la capa superior para formar la estrella.',
          alg: "F R U R' U' F'",
        },
        {
          id: 'mega-ll-eo2',
          name: 'Paso 6a · Orientar aristas (Línea → Estrella)',
          description: 'Inverso del anterior: orienta dos aristas no adyacentes en un solo paso.',
          alg: "F U R U' R' F'",
        },
        {
          id: 'mega-ll-co1',
          name: 'Paso 6b · Orientar esquinas (Sune)',
          description: 'Gira 3 esquinas de la cara superior sin deshacer la estrella.',
          alg: "R U R' U R U2' R'",
        },
        {
          id: 'mega-ll-co2',
          name: 'Paso 6b · Orientar esquinas (Antisune)',
          description: 'Inverso de Sune para orientar esquinas en sentido contrario.',
          alg: "R U2 R' U' R U' R'",
        },
        {
          id: 'mega-ll-ep',
          name: 'Paso 6c · Permutar 3 aristas superiores',
          description: 'Cicla 3 aristas de la estrella superior manteniendo las otras 2 fijas.',
          alg: "R U R' U R U2' R' U R U R' U R U2' R'",
        },
        {
          id: 'mega-ll-cp',
          name: 'Paso 6d · Ciclo de 3 esquinas (Conmutador)',
          description: 'Permuta 3 esquinas de la capa superior sin perder la orientación de la cara U.',
          alg: "R U R' F' R U R' U' R' F R2 U' R'",
        },
      ],
    },
  ],
};
