// 4x4: notación, método de reducción (con las paridades) y método Yau. Solo datos.
// Los ejemplos se comprueban con `npm run verify-algs` (KPuzzle de 4x4).
// Cubo con el amarillo arriba y el blanco abajo, verde al frente.

export const CUBE4X4 = {
  intro:
    'El 4x4 casi siempre se arma "reduciéndolo" a un 3x3: primero se juntan los centros y se emparejan las aristas, y después se resuelve como un 3x3, con dos casos nuevos que en el 3x3 no existen (las paridades).',
  notation: {
    title: 'Notación del 4x4',
    puzzle: '4x4x4',
    stickering: '4x4-full',
    text: [
      'En el 4x4 hay dos capas de cada lado, así que además de los giros de siempre hay giros de capas internas. Se usa la misma notación que en los torneos (la de cubing.js):',
    ],
    rows: [
      ['R', 'La capa de afuera de la derecha, igual que en el 3x3.'],
      ['Rw  (o r)', 'Las dos capas de la derecha juntas ("w" viene de wide, ancho).'],
      ['2R', 'Solo la segunda capa desde la derecha, la de adentro.'],
      ['3Rw', 'Las tres capas de la derecha (en el 4x4 casi no se usa).'],
      ["R'  ·  R2", "Igual que en el 3x3: ' es al revés y 2 es media vuelta. Vale para todos: Rw', 2R2, Uw2…"],
      ['x  ·  y  ·  z', 'Girar el cubo entero (x como R, y como U, z como F).'],
    ],
    cases: [
      { id: 'n-r', name: 'R', description: 'Una sola capa: la de afuera.', alg: 'R' },
      { id: 'n-rw', name: 'Rw', nickname: 'o r', description: 'Las dos capas de la derecha a la vez.', alg: 'Rw' },
      { id: 'n-2r', name: '2R', description: 'Solo la capa de adentro: la de afuera no se mueve.', alg: '2R' },
      { id: 'n-uw', name: 'Uw', description: 'Las dos capas de arriba a la vez.', alg: 'Uw' },
    ],
  },
};

const NOTATION_HINT = 'Si una letra no te suena (Rw, 2R, Uw…), mirá la tarjeta de notación en la página del 4x4.';

const OLL_PARITY = {
  id: 'oll-parity',
  name: 'Paridad de OLL',
  nickname: 'una arista dada vuelta',
  description:
    'Una sola arista de arriba tiene el amarillo de costado (la de adelante). Este algoritmo solo mueve capas internas y da vuelta esa arista sin tocar nada más. Las alternativas, con Rw, son las más conocidas: también la arreglan, pero de paso mueven y giran dos esquinas de arriba (después hacé la OLL del caso que quede).',
  alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
  alts: [
    "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'",
    "Rw2 B2 U2 Lw U2 Rw' U2 Rw U2 F2 Rw F2 Lw' B2 Rw2",
    "Rw' U2 Lw F2 Lw' F2 Rw2 U2 Rw U2 Rw' U2 F2 Rw2 F2",
  ],
};

const PLL_PARITY = {
  id: 'pll-parity',
  name: 'Paridad de PLL',
  nickname: 'dos aristas cambiadas',
  description:
    'Las aristas de adelante y de atrás están cambiadas entre sí y todo lo demás está bien. Solo mueve capas internas (2R y Uw) y la cara de arriba; el U2 del final acomoda la capa de arriba.',
  alg: '2R2 U2 2R2 Uw2 2R2 Uw2 U2',
};

const PARITY_WHY = [
  'En el 3x3 hay reglas que ningún movimiento puede romper: nunca queda una sola arista dada vuelta, y nunca quedan solo dos aristas cambiadas de lugar (las piezas se mueven siempre "de a pares"). Por eso esos casos no aparecen en ninguna OLL ni PLL.',
  'En el 4x4 cada arista son en realidad dos piezas sueltas (las "alas") y cada centro son 4 piezas del mismo color. Los giros de capas internas, como 2R, mueven alas y centros de maneras que en un 3x3 son imposibles. Como los 4 centros de un color son iguales, no se nota que quedaron mezclados entre ellos, pero al terminar de emparejar las aristas puede quedar una combinación que el 3x3 no permite.',
  'No es que hiciste algo mal: pasa más o menos en la mitad de las resoluciones y no se puede ver venir sin seguir cada pieza. La solución es un algoritmo que use capas internas.',
];

export const REDUCTION = {
  title: 'Reducción',
  intro: [
    'El método más común para empezar con el 4x4. La idea es convertirlo en un 3x3: cuando los centros están completos y cada arista tiene sus dos mitades juntas, el cubo se gira como si fuera un 3x3 grande.',
    NOTATION_HINT,
  ],
  steps: [
    {
      id: 'centros',
      title: 'Los 6 centros',
      goal: 'Cada cara con sus 4 centros del mismo color.',
      text: [
        'Primero el centro blanco: juntá dos centros blancos en una barra de 2 y llevala a la cara de abajo con una capa interna (2R o 2L). Repetí con la otra barra.',
        'Después el amarillo, en la cara opuesta (arriba). Ojo con no romper el blanco: cuando sacás una capa interna para meter la barra, devolvela con el movimiento contrario.',
        'Al final los 4 centros de los costados, en el orden correcto (con blanco abajo y amarillo arriba: verde, rojo, azul y naranja, como en el 3x3). Para no romper arriba y abajo se usan las capas internas horizontales (2U, Uw).',
      ],
      stickering: '4x4-centers',
      cases: [
        { id: 'c-first', name: 'Primer centro', description: 'Dos centros blancos abajo y la otra barra blanca al frente. La barra se lleva abajo con 2R.', alg: "2R F2 2R'" },
        { id: 'c-second', name: 'Centro opuesto', description: 'El blanco ya está. Se meten los dos amarillos que faltan sin romper el blanco: la capa 2R sale y vuelve.', alg: "2R U2 2R'" },
        { id: 'c-sides', name: 'Centros de los costados', description: 'Arriba y abajo ya están. Con 2U (que no toca ni el amarillo ni el blanco) se mueve una barra entre los costados.', alg: "2U R2 2U'" },
      ],
    },
    {
      id: 'aristas',
      title: 'Emparejar las aristas',
      goal: 'Las 12 aristas con sus dos mitades juntas.',
      text: [
        'Cada arista del 4x4 son dos mitades del mismo color. Buscá las dos mitades de una arista y ponelas en la capa del medio, una a la izquierda y otra a la derecha del frente, de modo que con un Uw (o Uw\') queden alineadas.',
        'El truco es "3-2-3": juntar las mitades con Uw, guardar la arista armada y traer una sin armar con R U R\' F R\' F\' R, y deshacer el Uw para que los centros vuelvan a su lugar.',
        'Las dos últimas aristas tienen su propio algoritmo, porque ya no queda una arista "libre" para cambiar.',
      ],
      stickering: '4x4-edges',
      cases: [
        { id: 'e-323', name: 'Emparejar una arista', nickname: '3-2-3', description: 'Las mitades de una arista están en la capa del medio, adelante a la izquierda y a la derecha.', alg: "Uw' R U R' F R' F' R Uw" },
        { id: 'e-last2', name: 'Las dos últimas', description: 'Solo quedan dos aristas sin emparejar, adelante a la izquierda y a la derecha.', alg: "Dw R F' U R' F Dw'" },
      ],
    },
    {
      id: '3x3',
      title: 'Como un 3x3',
      goal: 'Armar el cubo con el método de 3x3 que ya sepas.',
      text: [
        'Con los centros hechos y las aristas emparejadas, girá solo las capas de afuera (R, U, F…) y resolvé como un 3x3: cruz, primeras dos capas, OLL y PLL. Cualquier método de 3x3 sirve.',
        'Lo único distinto puede aparecer en la última capa: las paridades de los dos pasos siguientes.',
      ],
      stickering: '4x4-full',
      cases: [],
    },
    {
      id: 'paridad-oll',
      title: 'Paridad de OLL',
      goal: 'Arreglar una arista dada vuelta, un caso que en el 3x3 no existe.',
      text: [
        'Se nota en la OLL: queda una sola arista de arriba (o tres) con el amarillo de costado. En el 3x3 eso nunca pasa.',
        ...PARITY_WHY,
      ],
      stickering: '4x4-oll-parity',
      cases: [OLL_PARITY],
    },
    {
      id: 'paridad-pll',
      title: 'Paridad de PLL',
      goal: 'Intercambiar dos aristas, otro caso imposible en el 3x3.',
      text: [
        'Se nota en la PLL: un caso que no está entre los 21 del 3x3, por ejemplo dos aristas enfrentadas cambiadas y todo lo demás bien. Poné las aristas cambiadas adelante y atrás y hacé el algoritmo. Si las dos aristas cambiadas están una al lado de la otra, o si ves otra PLL "rara", hacé el algoritmo igual, desde cualquier lado: después queda una PLL normal del 3x3.',
        'Pasa por lo mismo que la paridad de OLL: las capas internas mezclaron las alas y los centros de una forma que el 3x3 no puede hacer. Se puede tener las dos paridades en la misma resolución: primero se arregla la de OLL y después la de PLL.',
      ],
      stickering: '4x4-pll-parity',
      cases: [PLL_PARITY],
    },
  ],
};

export const YAU = {
  title: 'Yau',
  intro: [
    'El método más usado por los más rápidos en 4x4. Es una reducción en otro orden: se arma parte de la cruz antes de terminar los centros, y así la cruz del 3x3 ya queda hecha y se ve mejor lo que falta.',
    'Los pasos: dos centros opuestos, tres aristas de la cruz, los cuatro centros que faltan, la última arista de la cruz, el resto de las aristas y el 3x3 (con las paridades de la página de Reducción).',
    NOTATION_HINT,
  ],
  steps: [
    {
      id: 'centros-2',
      title: 'Dos centros opuestos',
      goal: 'Los centros blanco (abajo) y amarillo (arriba).',
      text: [
        'Igual que en la reducción, pero solo el blanco y el amarillo. Como los centros de los costados todavía no importan, hay más libertad para mover capas internas.',
      ],
      stickering: 'yau-centers2',
      cases: [
        { id: 'y-centers2', name: 'Completar el amarillo', description: 'El blanco está hecho y faltan dos amarillos. La capa 2R sale y vuelve, así el blanco no se rompe.', alg: "2R' F2 2R" },
      ],
    },
    {
      id: 'cruz-3',
      title: 'Tres aristas de la cruz',
      goal: 'Tres aristas blancas emparejadas y en su lugar abajo, con el centro blanco.',
      text: [
        'Con los centros de los costados todavía libres, se pueden usar Uw y Dw para juntar las dos mitades de una arista blanca en la capa del medio, y después bajarla con un giro de cara.',
        'Dejá el lugar de la cuarta arista adelante (DF): en el paso siguiente las capas internas pasan por ahí.',
      ],
      stickering: 'yau-cross',
      cases: [
        { id: 'y-cross', name: 'Una arista de la cruz', description: 'Las dos mitades de la arista blanco-roja están separadas. Uw\' las junta a la izquierda y L\' la baja a su lugar.', alg: "Uw' L'" },
      ],
    },
    {
      id: 'centros-4',
      title: 'Los cuatro centros que faltan',
      goal: 'Todos los centros, sin romper las tres aristas de la cruz.',
      text: [
        'Se usan 2U (o Uw) y giros de la cara de adelante: 2U no toca la cara de abajo y F solo mueve el lugar libre de la cruz, así que las tres aristas armadas no se mueven.',
        'En muchos videos este paso se hace con la cruz a la izquierda y movimientos r y U: es lo mismo, con el cubo girado.',
      ],
      stickering: 'yau-centers4',
      cases: [
        { id: 'y-centers4a', name: 'Barra al frente', description: 'Se cambia una barra entre el frente y el costado derecho.', alg: "2U F2 2U'" },
        { id: 'y-centers4b', name: 'Barra al otro lado', description: 'Lo mismo hacia la izquierda.', alg: "2U' F2 2U" },
      ],
    },
    {
      id: 'cruz-4',
      title: 'La última arista de la cruz',
      goal: 'La cruz blanca completa.',
      text: [
        'Juntá las dos mitades de la arista blanca que falta con el truco 3-2-3 (las dos mitades en la capa del medio, adelante) y bajala con F o F\'.',
      ],
      stickering: 'yau-cross',
      cases: [
        { id: 'y-cross4', name: 'Emparejar y bajar', description: 'Las mitades de la arista blanco-verde están adelante a la izquierda y a la derecha.', alg: "Uw' R U R' F R' F' R Uw F'" },
      ],
    },
    {
      id: 'aristas',
      title: 'El resto de las aristas',
      goal: 'Las 8 aristas que faltan emparejadas, sin romper la cruz.',
      text: [
        'Con el 3-2-3 de siempre: R U R\' F R\' F\' R no toca la capa de abajo, así que la cruz queda intacta. Es la gran ventaja de Yau: mientras emparejás, la cruz ya está hecha.',
        'Las dos últimas aristas se pueden hacer con el mismo truco o con el algoritmo de la página de Reducción (que rompe la cruz y obliga a rehacerla).',
      ],
      stickering: 'yau-edges',
      cases: [
        { id: 'y-edges', name: '3-2-3 con la cruz', description: 'Las mitades de una arista están adelante a la izquierda y a la derecha, en la capa del medio.', alg: "Uw' R U R' F R' F' R Uw" },
      ],
    },
    {
      id: '3x3',
      title: 'Como un 3x3',
      goal: 'Terminar con las primeras dos capas, OLL y PLL.',
      text: [
        'La cruz ya está hecha: seguí directo con las dos primeras capas. Si aparece una paridad, se arregla igual que en la reducción (los algoritmos están en esa página).',
      ],
      stickering: '4x4-full',
      cases: [],
    },
  ],
};
