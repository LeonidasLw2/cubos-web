// Pyraminx: notación WCA (U, L, R, B = punta + capa de 120°; u, l, r, b = solo punta),
// método principiante (puntas, centros, primera capa y última capa) y métodos intermedios/avanzados
// (Keyhole, L4E, Top-First y 1-Flip) con sus casos verificados en el KPuzzle de pyraminx.

export const PYRAMINX = {
  intro:
    'El Pyraminx es un tetraedro de 4 caras y 4 vértices. Sus giros son de 120° (un tercio de vuelta): una letra sola (U, L, R, B) gira el bloque en sentido horario mirando esa punta de frente, y con apóstrofe (\') lo gira en sentido antihorario. No existen giros "2".',
  notation: {
    title: 'Notación del Pyraminx',
    puzzle: 'pyraminx',
    stickering: 'full',
    text: [
      'Las letras mayúsculas (U, L, R, B) mueven la punta junto con su capa axial (120°). Las letras minúsculas (u, l, r, b) giran únicamente la punta pequeña y en las mezclas oficiales WCA siempre aparecen al final:',
    ],
    rows: [
      ['U  ·  L  ·  R  ·  B', 'Punta + la capa siguiente (120° horario mirando esa punta de frente).'],
      ["U'  ·  L'  ·  R'  ·  B'", 'Mismo bloque pero 120° antihorario mirando esa punta.'],
      ['u  ·  l  ·  r  ·  b', 'Solo la punta exterior (trivial, se alinea en 1 movimiento con su centro).'],
    ],
    cases: [
      { id: 'pyr-n-u', name: 'U', description: 'Gira el bloque superior 120° en sentido horario.', alg: 'U' },
      { id: 'pyr-n-r', name: 'R', description: 'Gira el bloque derecho 120° en sentido horario.', alg: 'R' },
      { id: 'pyr-n-l', name: 'L', description: 'Gira el bloque izquierdo 120° en sentido horario.', alg: 'L' },
      { id: 'pyr-n-tip', name: 'u', description: 'Gira únicamente la punta superior.', alg: 'u' },
    ],
  },
};

export const PYRAMINX_BEGINNER = {
  title: 'Pyraminx · Método Principiante (Capa por Capa)',
  intro: [
    'El método Capa por Capa (LBL) resuelve primero las 4 puntas y los 3 centros de una base (por ejemplo, la cara inferior), luego inserta las 3 aristas de esa primera capa y termina con uno de los 5 casos de la última capa superior.',
  ],
  steps: [
    {
      id: 'puntas-y-centros',
      title: '1. Puntas y los 3 centros de la base',
      goal: 'Alinear las 4 puntas con sus centros axiales y llevar los 3 centros del color base hacia abajo.',
      text: [
        'Primero girá cada punta pequeña (u, l, r, b) para que coincida con la pieza central que tiene pegada.',
        'Después elegí la cara que NO tiene el color de tu base (por ejemplo, la punta que no tiene amarillo) y ponela mirando hacia arriba (U). Con un máximo de un giro en L, R y B vas a poder llevar los 3 centros amarillos hacia la cara de abajo.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-step1-tip',
          name: 'Alinear punta con su centro',
          description: 'Cada punta (u, l, r, b) gira sola y se alinea en un solo movimiento.',
          alg: 'u',
        },
        {
          id: 'pyr-step1-centers',
          name: 'Llevar los 3 centros a la base',
          description: 'Girá los bloques L, R y B hasta que los 3 centros inferiores apunten hacia abajo.',
          alg: "L' R",
        },
      ],
    },
    {
      id: 'primera-capa',
      title: '2. Las 3 aristas de la primera capa',
      goal: 'Insertar las 3 aristas de la base haciendo coincidir también sus colores laterales.',
      text: [
        'Buscá una arista de la base en el nivel superior (U). Girá U hasta que el color lateral de esa arista coincida con su centro frontal y mirá de qué lado quedó el sticker del color de la base: si te mira desde la derecha, insertala subiendo la izquierda (L\' U L); si te mira desde la izquierda, subí la derecha (R U\' R\').',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-fl-right',
          name: 'Inserción por la derecha',
          description: 'Sube la ranura derecha, mete la arista con U\' y vuelve a bajar la base.',
          alg: "R U' R'",
        },
        {
          id: 'pyr-fl-left',
          name: 'Inserción por la izquierda',
          description: 'Sube la ranura izquierda, mete la arista con U y vuelve a bajar.',
          alg: "L' U L",
        },
        {
          id: 'pyr-fl-flip',
          name: 'Arista en su lugar pero volteada',
          description: 'Sacala con una inserción normal y volvela a meter orientada.',
          alg: "R U' R' U R U' R'",
        },
      ],
    },
    {
      id: 'ultima-capa',
      title: '3. Última capa (los 5 casos de las 3 aristas superiores)',
      goal: 'Resolver las 3 aristas superiores después de alinear el centro de U.',
      text: [
        'Girá primero el bloque superior U para que su centro quede alineado con los laterales de abajo. Siempre vas a encontrar uno de estos 5 casos verificados:',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-ll-cw',
          name: 'Ciclo de 3 aristas (horario / hacia atrás)',
          nickname: 'Sune de Pyraminx',
          description: 'Las 3 aristas superiores necesitan rotar sin cambiar su orientación.',
          alg: "R' U' R U' R' U' R",
        },
        {
          id: 'pyr-ll-ccw',
          name: 'Ciclo de 3 aristas (antihorario / hacia adelante)',
          nickname: 'Antisune de Pyraminx',
          description: 'Ciclo inverso de las 3 aristas superiores.',
          alg: "R' U R U R' U R",
        },
        {
          id: 'pyr-ll-2flip',
          name: 'Dos aristas volteadas en su lugar',
          nickname: '2-Flip frontal',
          description: 'La arista trasera ya está resuelta y las dos aristas frontales están en su sitio pero dadas vuelta.',
          alg: "R' L R L' U L' U' L",
        },
        {
          id: 'pyr-ll-cycle-r',
          name: 'Ciclo + volteo (una arista bien orientada)',
          nickname: '3-ciclo con flip derecho',
          description: 'Las 3 aristas están fuera de lugar y dos de ellas necesitan darse vuelta.',
          alg: "L R' L' R U' R U R'",
        },
        {
          id: 'pyr-ll-cycle-l',
          name: 'Ciclo + volteo simétrico (izquierdo)',
          nickname: '3-ciclo con flip izquierdo',
          description: 'Caso espejo del anterior: resuelve el ciclo de 3 con volteo desde la izquierda.',
          alg: "R' L R L' U R U' R'",
        },
      ],
    },
  ],
};

export const PYRAMINX_ADVANCED = {
  title: 'Pyraminx · Keyhole, L4E, Top-First y 1-Flip',
  intro: [
    'Para bajar de 4–5 segundos en Pyraminx se pasa de armar una primera capa completa a armar una "V" (la base menos una arista) o el bloque superior (Top-First), resolviendo las últimas aristas de forma directa.',
  ],
  steps: [
    {
      id: 'keyhole',
      title: '1. Método Keyhole (Cerradura)',
      goal: 'Usar una arista libre de la punta superior para orientar los centros de la punta y terminar en un ciclo corto.',
      text: [
        'En Keyhole armás dos aristas alrededor de una punta (por ejemplo la punta superior U) dejando la tercera ranura libre ("el ojo de la cerradura"). Usando esa ranura vacía podés meter los 3 centros inferiores en un movimiento cada uno, luego colocás la tercera arista de la punta superior y terminás las 3 aristas inferiores.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-kh-insert',
          name: 'Cerrar la tercera arista de la punta',
          description: 'Inserta la última arista de la punta superior sin deshacer los centros recién orientados.',
          alg: "R U' R'",
        },
      ],
    },
    {
      id: 'l4e',
      title: '2. L4E (Last 4 Edges · Últimas 4 Aristas)',
      goal: 'Armar una "V" en la base (3 centros + 2 aristas) y resolver las últimas 4 aristas de una sola vez.',
      text: [
        'L4E es el método más usado en competición: durante los 15 s de inspección planeás una V en la cara inferior (dejando vacía la posición frontal inferior DF) y después resolvés las 4 aristas restantes juntas con algoritmos muy cortos de 4 a 8 movimientos.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-l4e-sledge',
          name: 'L4E · Sledgehammer directo',
          description: 'Resuelve la arista inferior y dos superiores en 4 movimientos.',
          alg: "R' L R L'",
        },
        {
          id: 'pyr-l4e-hedge',
          name: 'L4E · Hedgeslammer directo',
          description: 'Inverso del Sledgehammer: inserta desde la izquierda resolviendo las 4 aristas.',
          alg: "L R' L' R",
        },
        {
          id: 'pyr-l4e-polish',
          name: 'L4E · Dos aristas superiores volteadas con V lista',
          description: 'Inserta la arista de la V y orienta las superiores al mismo tiempo.',
          alg: "R U' R' L' U L",
        },
      ],
    },
    {
      id: 'top-first',
      title: '3. Top-First y 1-Flip (Descripción de métodos de punta)',
      goal: 'Resolver primero las 3 aristas alrededor de la punta superior y terminar la base al final.',
      text: [
        'En los métodos Top-First (como Oka, Bell, Nutella y 1-Flip) se empieza resolviendo el bloque superior (1 punta + 3 centros + 3 aristas).',
        'En 1-Flip se colocan las 3 aristas alrededor de la punta superior dejando exactamente UNA arista volteada a propósito: eso permite orientar los 3 centros restantes mientras se corrige esa arista volteada en un solo algoritmo corto, terminando luego con las 3 aristas de la base.',
      ],
      stickering: 'full',
      cases: [
        {
          id: 'pyr-1flip-core',
          name: 'Movimiento base de 1-Flip / Oka',
          description: 'Corrige la arista superior desplazada mientras alinea los centros laterales.',
          alg: "R U' R' U",
        },
      ],
    },
  ],
};
