// 7x7: notación (Rw, 3Rw, 2R, 3R), método de reducción para cubos grandes (centros por barras de 1×5,
// aristas por grupos con Freeslice, paridad de alas internas/externas y consejos de cubos grandes).
// Datos verificados con el KPuzzle de 7x7x7.

export const CUBE7X7 = {
  intro:
    'El 7x7 es el cubo más grande de las categorías oficiales WCA. Tiene centros fijos (cada cara tiene un bloque central de 5×5 = 25 piezas) y cada arista está compuesta por 5 piezas (1 central "midge", 2 alas internas y 2 alas externas). Se resuelve por reducción formando barras de 1×5.',
  notation: {
    title: 'Notación del 7x7',
    puzzle: '7x7x7',
    stickering: '7x7-full',
    text: [
      'En las mezclas oficiales WCA del 7x7 se usan giros de 1 capa (R, U, F…), de 2 capas exteriores (Rw, Uw…) y de 3 capas exteriores (3Rw, 3Uw…). En los algoritmos de centros y paridades también se indican capas internas individuales (2R, 3R):',
    ],
    rows: [
      ['R  ·  U  ·  F', 'Solo la primera capa exterior.'],
      ['Rw  (o 2Rw)', 'Las 2 capas exteriores de la derecha juntas.'],
      ['3Rw', 'Las 3 capas exteriores de la derecha juntas (hasta antes de la capa central).'],
      ['2R  ·  3R', 'Capas internas individuales: 2R es la segunda desde afuera y 3R es la tercera desde afuera.'],
    ],
    cases: [
      { id: '7-n-rw', name: 'Rw', description: 'Las 2 capas exteriores derechas juntas.', alg: 'Rw' },
      { id: '7-n-3rw', name: '3Rw', description: 'Las 3 capas exteriores derechas juntas.', alg: '3Rw' },
      { id: '7-n-2r', name: '2R', description: 'Solo la segunda capa interna desde la derecha.', alg: '2R' },
      { id: '7-n-3r', name: '3R', description: 'Solo la tercera capa interna desde la derecha.', alg: '3R' },
    ],
  },
};

export const REDUCTION_7X7 = {
  title: 'Reducción para Cubos Grandes (7x7)',
  intro: [
    'En el 7x7 el tiempo principal de la resolución está en construir los 6 centros de 5×5 (25 piezas cada uno) mediante 5 barras de 1×5 y en emparejar las 12 aristas de 5 piezas con Freeslice.',
    'Al igual que el 5x5, como es un cubo impar con centros fijos y arista central, no existe la paridad de permutación del 4x4; solo puede aparecer paridad de alas internas o externas en la última arista.',
  ],
  steps: [
    {
      id: 'centros-barras',
      title: '1. Los 6 centros por barras de 1×5',
      goal: 'Construir cada centro de 5×5 armando primero la barra central y luego las 4 barras paralelas.',
      text: [
        'Empezá siempre por la barra central de 1×5 que contiene el centro fijo de esa cara. Después armá las dos barras adyacentes (capas 3R / 3L) y finalmente las dos barras de borde (capas 2R / 2L) uniéndolas de a una.',
        'Cuando te queden solo 1 o 2 piezas sueltas entre los últimos dos centros laterales, en lugar de desarmar toda una barra usá un conmutador puro (tipo Niklas) con las dos capas internas que cruzan exactamente esa coordenada.',
      ],
      stickering: '7x7-full',
      cases: [
        {
          id: '7-c-bar3',
          name: 'Subir barra interna (3Rw)',
          description: 'Sube un bloque de 3×5 barras del frente a la cara superior y lo asegura girando U2.',
          alg: "3Rw U2 3Rw'",
        },
        {
          id: '7-c-bar2',
          name: 'Subir barra de borde (Rw)',
          description: 'Inserta la última barra externa de 1×5 sin romper las 4 barras ya unidas.',
          alg: "Rw U2 Rw'",
        },
        {
          id: '7-c-comm',
          name: 'Conmutador puntual de centros (Niklas interno)',
          description: 'Intercambia una sola pieza oblicua entre el centro superior (U) y el frontal (F) usando las capas 2R y 3L.',
          alg: "2R U' 3L' U 2R' U' 3L",
        },
      ],
    },
    {
      id: 'aristas-grupos',
      title: '2. Emparejado de aristas por grupos (Freeslice)',
      goal: 'Unir las 5 piezas de cada una de las 12 aristas (primeras 8 libres + últimas 4 con centros alineados).',
      text: [
        'Cada arista tiene 1 pieza central ("midge"), 2 alas internas (capas 3U/3D) y 2 alas externas (capas 2U/2D). Con Freeslice trabajás en la banda ecuatorial desplazando 3Uw o Uw para reunir primero el bloque interno de 3 piezas y luego sumarle las 2 alas externas.',
        'Cada vez que completás una arista de 5 piezas en la ranura frontal derecha, la subís a U con R U R\' y bajás en su lugar una arista desarmada. Después de guardar 8 aristas (4 en U y 4 en D), alineás los centros y terminás las últimas 4 aristas con ida y vuelta.',
      ],
      stickering: '7x7-full',
      cases: [
        {
          id: '7-e-inner',
          name: 'Emparejar alas internas (3Uw)',
          description: 'Une las alas internas con la pieza central, invierte la arista derecha y restaura el centro.',
          alg: "3Uw' R U R' F R' F' R 3Uw",
        },
        {
          id: '7-e-outer',
          name: 'Emparejar alas externas (Uw)',
          description: 'Une las alas externas sobre el bloque de 3 piezas ya formado y restaura las capas.',
          alg: "Uw' R U R' F R' F' R Uw",
        },
      ],
    },
    {
      id: 'paridad-7x7',
      title: '3. Paridad de aristas en el 7x7',
      goal: 'Orientar el par de alas internas (3R) o externas (2R) si quedan invertidas en la última arista.',
      text: [
        'En la última arista pueden quedar dadas vuelta las dos alas externas (capa 2), las dos alas internas (capa 3) o ambas juntas. Se aplica el mismo algoritmo de paridad que en el 5x5 sobre la capa correspondiente (2R para las externas, 3R para las internas).',
      ],
      stickering: '7x7-full',
      cases: [
        {
          id: '7-p-outer',
          name: 'Paridad de alas externas (2R)',
          description: 'Invierte las dos alas externas de la arista superior frontal (UF).',
          alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2",
        },
        {
          id: '7-p-inner',
          name: 'Paridad de alas internas (3R)',
          description: 'Invierte las dos alas internas de la arista superior frontal (UF).',
          alg: "3R2 B2 U2 3L U2 3R' U2 3R U2 F2 3R F2 3L' B2 3R2",
        },
      ],
    },
    {
      id: 'etapa-3x3-7x7',
      title: '4. Resolución como 3x3 y consejos de cubos grandes',
      goal: 'Resolver el 7x7 reducido usando solo las capas exteriores (R, L, U, D, F, B).',
      text: [
        'Una vez completos los 6 centros de 5×5 y las 12 aristas quíntuples, resolvé el cubo como un 3x3 normal.',
        'Consejo de agarre en cubos grandes: sujetá con los dedos medios y anulares las capas centrales para que no se desfasen al hacer R, U y F rápidos durante la etapa 3x3.',
      ],
      stickering: '7x7-full',
      cases: [],
    },
  ],
};
