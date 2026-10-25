// 5x5: notación, método de reducción (con paridad de la última arista y por qué no tiene
// paridad de permutación como el 4x4) y método Yau5. Solo datos verificados con KPuzzle de 5x5x5.

export const CUBE5X5 = {
  intro:
    'El 5x5 ("Professor\'s Cube") tiene centros fijos igual que el 3x3: la pieza central de cada cara nunca cambia de posición relativa. Eso elimina la paridad de permutación (PLL parity) del 4x4, aunque todavía puede aparecer paridad de alas al emparejar las últimas dos aristas.',
  notation: {
    title: 'Notación del 5x5',
    puzzle: '5x5x5',
    stickering: '5x5-full',
    text: [
      'En el 5x5 las mezclas oficiales WCA usan giros de una capa (R, U, F…) y de dos capas exteriores (Rw, Uw, Fw…). Para algoritmos de centros y paridades también se usa la notación de capas internas (SiGN):',
    ],
    rows: [
      ['R  ·  U  ·  F', 'Una sola capa exterior, igual que en el 3x3.'],
      ['Rw  (o r)', 'Las dos capas exteriores de la derecha juntas (usado en mezclas WCA).'],
      ['2R', 'Solo la segunda capa contando desde la derecha.'],
      ['3R', 'La capa central (la tercera contando desde la derecha, equivalente a M\').'],
      ["R'  ·  R2  ·  Rw2", 'Con apóstrofe (\') es giro antihorario de 90°; con 2 es giro de 180°.'],
    ],
    cases: [
      { id: '5-n-r', name: 'R', description: 'Capa exterior derecha.', alg: 'R' },
      { id: '5-n-rw', name: 'Rw', description: 'Las dos capas exteriores derechas juntas.', alg: 'Rw' },
      { id: '5-n-2r', name: '2R', description: 'Segunda capa interna desde la derecha.', alg: '2R' },
      { id: '5-n-3r', name: '3R', description: 'Capa central del 5x5.', alg: '3R' },
    ],
  },
};

export const REDUCTION_5X5 = {
  title: 'Reducción 5x5',
  intro: [
    'La reducción del 5x5 consiste en armar los 6 centros de 3×3 (9 piezas cada uno), emparejar las 12 aristas triples (una pieza central "midge" más dos alas "wings") y resolver el cubo resultante como un 3x3.',
    'A diferencia del 4x4, como el 5x5 tiene centros fijos y aristas centrales ("midges"), al llegar a la etapa 3x3 nunca hay paridad de PLL ni aristas completas imposibles: el único caso especial se resuelve al terminar la última arista.',
  ],
  steps: [
    {
      id: 'centros',
      title: 'Los 6 centros (barras de 1×3)',
      goal: 'Completar los 6 bloques centrales de 3×3 respetando el color de cada centro fijo.',
      text: [
        'Empezá por el centro blanco: primero formá la barra central de 1×3 uniendo dos aristas de centro al centro fijo blanco, y después armá las dos barras laterales de 1×3 e insertalas.',
        'En el centro opuesto (amarillo) y en los dos últimos centros laterales, cuando subís una barra con Rw, desplazala en U y bajá la misma columna para no desarmar los centros ya terminados.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: '5-c-bar',
          name: 'Unir barra al centro',
          description: 'Subir una barra lateral de 1×3 sin desarmar la barra central.',
          alg: "Rw U Rw'",
        },
        {
          id: '5-c-opposite',
          name: 'Insertar última barra en centro opuesto',
          description: 'Si ya hay 2 barras armadas arriba, alineá la tercera barra en el frente, subila desplazando la que ya estaba, girá U2 y volvé.',
          alg: "Rw U2 Rw'",
        },
        {
          id: '5-c-niklas',
          name: 'Últimas piezas entre dos centros (Conmutador)',
          description: 'Intercambia una esquina de centro entre la cara superior y la frontal sin desarmar el resto.',
          alg: "2R U' 2L' U 2R' U' 2L",
        },
      ],
    },
    {
      id: 'aristas-8',
      title: 'Primeras 8 aristas (Freeslice)',
      goal: 'Armar 8 aristas completas de 3 piezas y guardarlas en las capas U y D.',
      text: [
        'Cada arista del 5x5 tiene una pieza central ("midge") y dos alas ("wings"). Con la técnica Freeslice desplazás las dos capas superiores (Uw) para unir las tres piezas en el anillo horizontal y subís la arista armada a U, reemplazándola por una arista todavía desarmada.',
        'Si un ala está en la misma columna pero apuntando al revés, usá el algoritmo de volteo (Flip) para invertir la arista derecha sin tocar la banda horizontal.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: '5-e-flip',
          name: 'Algoritmo de volteo (Flip)',
          description: 'Da vuelta en el lugar la arista frontal derecha (FR) para que su ala coincida con la pieza central.',
          alg: "R U R' F R' F' R",
        },
        {
          id: '5-e-slice',
          name: 'Emparejar, voltear y restaurar',
          description: 'Junta las piezas con Uw\', invierte la arista derecha con el algoritmo de Flip y restaura los centros con Uw.',
          alg: "Uw' R U R' F R' F' R Uw",
        },
      ],
    },
    {
      id: 'ultimas-4-aristas',
      title: 'Las últimas 4 aristas',
      goal: 'Emparejar las 4 aristas restantes manteniendo los 6 centros armados.',
      text: [
        'Con 8 aristas guardadas en U y D (4 arriba y 4 abajo), restaurá los centros laterales y resolvé las últimas 4 aristas en la capa media usando ida y vuelta de Uw o Dw junto con el algoritmo de volteo.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: '5-e-last2',
          name: 'Intercambio de alas en las últimas 2 aristas',
          description: 'Pasa el ala inferior de FL a FR y viceversa sin romper los centros.',
          alg: "Dw R F' U R' F Dw'",
        },
      ],
    },
    {
      id: 'paridad-aristas',
      title: 'Paridad de las últimas aristas',
      goal: 'Orientar las dos alas externas de la última arista cuando quedan dadas vuelta respecto de su centro.',
      text: [
        '¿Por qué el 5x5 NO tiene paridad de permutación (PLL) como el 4x4? Porque tiene centros fijos y una arista central ("midge") que se comporta exactamente igual que una arista de 3x3.',
        'Sin embargo, al terminar de emparejar las 12 aristas puede quedar la última arista con su pieza central bien orientada y sus dos alas laterales invertidas entre sí. Se resuelve con el algoritmo de paridad de alas antes de empezar la etapa 3x3.',
      ],
      stickering: '5x5-edge-parity',
      cases: [
        {
          id: '5-edge-parity',
          name: 'Paridad de alas (última arista)',
          nickname: 'alas invertidas',
          description: 'Da vuelta las dos alas laterales de la arista superior frontal (UF) dejando su pieza central en el lugar.',
          alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
          alts: [
            "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 3Rw' U2 Rw U2 Rw' U2 Rw'",
          ],
        },
      ],
    },
    {
      id: 'etapa-3x3',
      title: 'Resolución como 3x3',
      goal: 'Resolver el cubo usando solo las capas exteriores (R, L, U, D, F, B).',
      text: [
        'Con los 6 centros y las 12 aristas triples listos, el 5x5 se resuelve exactamente igual que un 3x3 (con CFOP, Roux o Principiante), sin ninguna paridad adicional en OLL ni en PLL.',
      ],
      stickering: '5x5-full',
      cases: [],
    },
  ],
};

export const YAU5 = {
  title: 'Método Yau5',
  intro: [
    'Yau5 adapta el método Yau del 4x4 al 5x5: arma 3 aristas de la cruz antes de completar los 4 centros laterales y además construye las dos primeras aristas de F2L antes de entrar a la etapa 3x3, logrando una transición mucho más fluida.',
  ],
  steps: [
    {
      id: 'yau5-centros2',
      title: '1. Dos centros opuestos',
      goal: 'Armar los centros blanco (D) y amarillo (U) alrededor de sus centros fijos.',
      text: [
        'Construí barras de 1×3 para completar primero el centro blanco y luego el amarillo, aprovechando que los 4 centros laterales todavía están libres.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: 'yau5-c2',
          name: 'Insertar barra final amarilla',
          description: 'Sube la tercera barra amarilla manteniendo intacto el centro blanco inferior.',
          alg: "Rw U2 Rw'",
        },
      ],
    },
    {
      id: 'yau5-cruz3',
      title: '2. Tres aristas de la cruz',
      goal: 'Armar 3 aristas blancas triples y colocarlas en la cara izquierda (o inferior), dejando un lugar libre.',
      text: [
        'Uní la pieza central y las dos alas de 3 aristas blancas y aseguralas en su posición de cruz dejando libre una cuarta posición para trabajar los centros laterales.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: 'yau5-cross',
          name: 'Alinear e insertar arista de la cruz',
          description: 'Junta el ala restante con Uw\' y baja la arista triple a la base.',
          alg: "Uw' L'",
        },
      ],
    },
    {
      id: 'yau5-centros4',
      title: '3. Los 4 centros laterales',
      goal: 'Completar los centros verde, rojo, azul y naranja sin desarmar las 3 aristas blancas.',
      text: [
        'Con las 3 aristas blancas protegidas, usá giros Rw, 2R, 3R y U para formar barras de 1×3 en los 4 centros restantes.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: 'yau5-c4',
          name: 'Conmutador para los últimos dos centros',
          description: 'Pasa una pieza puntual de U a F sin alterar las 3 aristas de la cruz.',
          alg: "2R U' 2L' U 2R' U' 2L",
        },
      ],
    },
    {
      id: 'yau5-aristas-f2l',
      title: '4. Cuarta arista de la cruz y aristas restantes',
      goal: 'Cerrar la cruz blanca y emparejar las 8 aristas restantes con Freeslice / 3-2-3.',
      text: [
        'Completá la cuarta arista blanca e insertala para cerrar la cruz en D. En Yau5 se suelen emparejar primero dos aristas de F2L e insertarlas con sus esquinas, dejando solo 6 aristas libres en la mitad superior para un reconocimiento mucho más rápido.',
      ],
      stickering: '5x5-full',
      cases: [
        {
          id: 'yau5-edges',
          name: 'Emparejado con cruz armada',
          description: 'Une y voltea una arista en la capa media sin deshacer la cruz inferior.',
          alg: "Uw' R U R' F R' F' R Uw",
        },
      ],
    },
  ],
};
