// Guía y método de resolución del Mirror Cube 3x3 (Mirror Blocks).
// Utiliza los mismos algoritmos verificados del método principiante de 3x3 (src/data/beginner.js),
// adaptando el reconocimiento por forma, alturas y piezas al ras.

export const MIRROR_METHOD = {
  id: 'mirror',
  title: 'Método para Mirror Cube',
  subtitle: 'Mismos algoritmos de 3x3, reconocimiento puramente por forma',
  intro: [
    'El Mirror Cube (Mirror Blocks) es mecánicamente un cubo de Rubik 3x3x3 normal: tiene las mismas 6 caras, el mismo núcleo interno y responde exactamente a los mismos giros y algoritmos (R, U, F, L, D, B).',
    'La diferencia es que todas sus piezas son del mismo color metálico (plateado o dorado) y cada una tiene un grosor distinto en cada eje. Al mezclarlo se transforma en una figura geométrica irregular y al resolverlo vuelve a formar un cubo perfecto.',
    'La clave del Mirror no es aprender algoritmos nuevos, sino aprender a reconocer qué pieza es cada una y si está bien orientada observando si sus caras quedan al ras (planas y niveladas) con los centros vecinos.',
  ],
  recognitionGuide: [
    {
      title: 'Centros: tu punto de referencia fijo',
      desc: 'Los 6 centros nunca se mueven de lugar relativo. Cada uno tiene una altura fija distinta respecto del núcleo. El centro más grueso identifica la cara base y el más delgado la cara opuesta (última capa).',
    },
    {
      title: 'Orientación al ras',
      desc: 'Una arista o esquina está bien orientada cuando su cara exterior queda perfectamente plana y continua (al ras) con la cara del centro contiguo. Si sentís un escalón o desnivel al pasar el dedo, la pieza está invertida.',
    },
    {
      title: 'Identificación por tamaño',
      desc: 'Las 4 esquinas de la base son los bloques más grandes y pesados de todo el cubo. Las piezas de la última capa son las más finas. Si dudás entre dos aristas parecidas, presentala en la ranura con un giro suave: si no encaja a nivel, pertenece a otro lugar.',
    },
  ],
  cfopGuide: {
    title: '¿Se puede usar CFOP en el Mirror Cube?',
    desc: '¡Sí, absolutamente! Como el mecanismo es idéntico al 3x3, cualquier algoritmo de CFOP (F2L, OLL, PLL) funciona a la perfección. La dificultad en CFOP está en el reconocimiento a alta velocidad:',
    points: [
      'En F2L: armar pares esquina-arista requiere emparejar piezas por altura en lugar de colores. Lleva más práctica identificar qué par va en qué ranura.',
      'En OLL: en lugar de buscar stickers amarillos arriba, buscás qué aristas y esquinas quedan al ras con el plano superior y cuáles sobresalen.',
      'En PLL: en lugar de buscar faros y barras por color, buscás bloques donde las piezas adyacentes formen paredes perfectamente planas en los laterales.',
    ],
    linkText: 'Ver guía completa de CFOP de 3x3 →',
    linkHref: '#/metodos/3x3/cfop',
  },
  steps: [
    {
      id: 'cross',
      title: '1. Cruz en la capa más gruesa',
      goal: 'Armar la cruz en la cara con el centro más alto, dejando las 4 aristas al ras con sus centros laterales.',
      stickering: 'cross',
      text: [
        'Elegí como base la cara más gruesa (el centro que más sobresale). Al resolver esta cara primero, el cubo gana estabilidad y las piezas grandes son mucho más fáciles de ubicar.',
        'Buscá las 4 aristas más altas. Girá la capa superior hasta alinear la arista con el centro lateral que tenga su misma altura: cuando ambas piezas forman una pared plana continua, bajala a la base.',
      ],
      cases: [
        {
          id: 'mirror-cross-up',
          name: 'Arista arriba orientada',
          description: 'La arista está en la capa superior y su lateral ya queda al ras con el centro del costado. Dos giros la llevan a la base.',
          alg: 'F2',
        },
        {
          id: 'mirror-cross-front',
          name: 'Arista arriba invertida',
          description: 'La arista está arriba pero al presentarla queda desfasada con el centro del costado. Se desplaza a un lateral para insertarla a nivel.',
          alg: "U' R' F R",
        },
        {
          id: 'mirror-cross-middle',
          name: 'Arista en la capa del medio',
          description: 'La arista está en la capa central y coincide en altura con el lateral. Un solo giro del frente la baja a la cruz.',
          alg: 'F',
        },
        {
          id: 'mirror-cross-flipped',
          name: 'En su lugar pero invertida',
          description: 'La arista está en la base pero sobresale formando un escalón con el centro frontal. Hay que sacarla, reorientarla y volver a insertarla.',
          alg: "F' D R' D'",
        },
      ],
    },
    {
      id: 'first-layer',
      title: '2. Esquinas de la primera capa',
      goal: 'Insertar las 4 esquinas más grandes del cubo, dejando la primera capa totalmente sólida y plana.',
      stickering: 'first-layer',
      text: [
        'Las 4 esquinas de la base son los bloques más grandes de todo el puzzle. Llevalas a la capa de arriba y colocalas sobre la ranura que corresponda según sus dimensiones de ancho y profundidad.',
        'Aplicá el algoritmo básico (R U R\') observando hacia dónde mira la cara más grande de la esquina hasta que encaje sin ningún resalte.',
      ],
      cases: [
        {
          id: 'mirror-fl-right',
          name: 'Cara base a la derecha',
          description: 'La esquina está arriba de su ranura y su cara de base mira a la derecha. Entra directamente con tres movimientos.',
          alg: "R U R'",
        },
        {
          id: 'mirror-fl-front',
          name: 'Cara base al frente',
          description: 'La cara principal mira al frente. Se inserta por el lateral frontal con F\' U\' F.',
          alg: "F' U' F",
        },
        {
          id: 'mirror-fl-up',
          name: 'Cara base hacia arriba',
          description: 'La cara principal apunta hacia el techo: primero se gira para ponerla de costado y luego se inserta.',
          alg: "R U2 R' U' R U R'",
        },
      ],
    },
    {
      id: 'second-layer',
      title: '3. Segunda capa (aristas medias)',
      goal: 'Colocar las 4 aristas intermedias para completar los dos primeros tercios del cubo.',
      stickering: 'second-layer',
      text: [
        'Buscá en la capa superior una arista que no pertenezca a la capa delgada. Girá la capa U hasta que la arista quede perfectamente al ras con el centro frontal, formando una "T" continua sin escalones.',
        'Fijate si por su altura lateral debe entrar hacia la ranura derecha o hacia la izquierda y aplicá el algoritmo correspondiente.',
      ],
      cases: [
        {
          id: 'mirror-sl-right',
          name: 'Inserción hacia la derecha',
          description: 'La arista coincide en altura con el centro frontal y su otra medida corresponde a la ranura derecha.',
          alg: "U R U' R' U' F' U F",
        },
        {
          id: 'mirror-sl-left',
          name: 'Inserción hacia la izquierda',
          description: 'La arista coincide con el centro frontal y su otra medida corresponde a la ranura izquierda.',
          alg: "U' L' U L U F U' F'",
        },
      ],
    },
    {
      id: 'yellow-cross',
      title: '4. Cruz en la última capa',
      goal: 'Orientar las aristas de la capa más delgada para que queden al ras con el centro superior.',
      stickering: 'yellow-cross',
      text: [
        'La última capa es la más delgada de todas. Para saber cuántas aristas están bien orientadas, pasá la yema del dedo por arriba: las aristas orientadas están a la misma altura plana que el centro.',
        'Según las aristas planas arriba, verás un punto (ninguna a nivel), una "L" o una línea recta. Usá el mismo algoritmo tradicional para formar la cruz plana superior.',
      ],
      cases: [
        {
          id: 'mirror-yc-line',
          name: 'Línea plana',
          description: 'Dos aristas opuestas quedan al ras con el centro. Colocá la línea horizontal y ejecutá el algoritmo.',
          alg: "F R U R' U' F'",
        },
        {
          id: 'mirror-yc-l',
          name: '"L" en ángulo',
          description: 'Dos aristas adyacentes están al ras. Ponelas apuntando hacia atrás y hacia la izquierda.',
          alg: "F U R U' R' F'",
        },
        {
          id: 'mirror-yc-dot',
          name: 'Punto (ninguna arista a nivel)',
          description: 'Solo el centro superior está a nivel; las 4 aristas sobresalen o quedan hundidas. Hacé la línea y luego la "L".',
          alg: "F R U R' U' F' U2 F U R U' R' F'",
        },
      ],
    },
    {
      id: 'yellow-face',
      title: '5. Orientar esquinas superiores',
      goal: 'Aplanar toda la cara superior para que no quede ninguna esquina desnivelada.',
      stickering: 'yellow-face',
      text: [
        'Comprobá cuántas esquinas quedaron al mismo nivel que la cruz superior. Si hay exactamente una plana, estás en el caso Pez (Sune / Antisune).',
        'Si hay cero o dos esquinas planas, ubicá una esquina desorientada arriba a la izquierda y aplicá Sune hasta obtener el pez.',
      ],
      cases: [
        {
          id: 'mirror-yf-sune',
          name: 'Pez (Sune)',
          description: 'Una sola esquina plana arriba, adelante a la izquierda. Su algoritmo alinea toda la cara superior de un tiro.',
          alg: "R U R' U R U2 R'",
        },
        {
          id: 'mirror-yf-antisune',
          name: 'Pez simétrico (Antisune)',
          description: 'Una sola esquina plana arriba, atrás a la derecha. Es el espejo del Sune.',
          alg: "R U2 R' U' R U' R'",
        },
      ],
    },
    {
      id: 'll-corners',
      title: '6. Permutar esquinas superiores',
      goal: 'Poner cada esquina en su columna correspondiente.',
      stickering: 'll-corners',
      text: [
        'Mirá los laterales de la última capa buscando dos esquinas que sobresalgan exactamente lo mismo en una pared lateral ("faros").',
        'Colocá los faros en la cara trasera (B) y ejecutá el algoritmo para ordenar las 4 esquinas.',
      ],
      cases: [
        {
          id: 'mirror-llc-headlights',
          name: 'Faros hacia atrás',
          description: 'Dos esquinas tienen el mismo grosor lateral en una cara. Se colocan atrás y se permutan las restantes.',
          alg: "R' F R' B2 R F' R' B2 R2",
        },
      ],
    },
    {
      id: 'll-edges',
      title: '7. Permutar aristas y terminar',
      goal: 'Llevar las últimas aristas a su lugar y recuperar la forma de cubo perfecto.',
      stickering: 'll-edges',
      text: [
        'Buscá una cara lateral que ya haya quedado totalmente plana y alineada ("barra resuelta") y ubicala en la cara trasera (B).',
        'Mirá la arista del frente: según su altura y anchura, decidí si debe viajar hacia la izquierda o hacia la derecha.',
      ],
      cases: [
        {
          id: 'mirror-lle-left',
          name: 'Arista frontal hacia la izquierda',
          description: 'La cara posterior está resuelta. La arista del frente encaja por medidas en el lateral izquierdo.',
          alg: "R2 U R U R' U' R' U' R' U R'",
        },
        {
          id: 'mirror-lle-right',
          name: 'Arista frontal hacia la derecha',
          description: 'La cara posterior está resuelta. La arista del frente encaja por medidas en el lateral derecho.',
          alg: "R U' R U R U R U' R' U' R2",
        },
      ],
    },
  ],
};
