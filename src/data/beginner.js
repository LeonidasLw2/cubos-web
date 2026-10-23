// Método principiante (capa por capa) para 3x3. Solo datos (sin DOM).
// Se arma con la cruz blanca abajo y se termina con el amarillo arriba.
// Todos los algoritmos se comprueban con `npm run verify-algs`.

export const BEGINNER = {
  id: 'principiante',
  title: 'Método principiante',
  subtitle: 'Capa por capa, con pocos algoritmos',
  intro: [
    'Es el método con el que aprende casi todo el mundo: se arma el cubo de abajo hacia arriba, una capa a la vez. Usa pocos algoritmos y la mayoría son cortos.',
    'Sostené el cubo con el centro blanco abajo y el amarillo arriba durante todo el método. Los centros nunca cambian de lugar: son los que indican de qué color es cada cara.',
    'Notación: cada letra es un giro de 90° de esa cara en sentido horario, mirándola de frente (R derecha, L izquierda, U arriba, D abajo, F frente, B atrás). El apóstrofo (\') es antihorario y el 2 es media vuelta.',
  ],
  steps: [
    {
      id: 'cross',
      title: 'Cruz blanca',
      goal: 'Las cuatro aristas blancas abajo, cada una con su otro color coincidiendo con el centro del costado.',
      stickering: 'cross',
      text: [
        'Este paso es intuitivo: no hace falta memorizar nada largo. Buscá una arista blanca, girá la cara de arriba hasta que su otro color quede sobre el centro del mismo color, y bajala.',
        'Cuidado con no romper las aristas que ya pusiste: si un movimiento saca una, devolvela enseguida.',
      ],
      cases: [
        {
          id: 'cross-up',
          name: 'Blanco mirando arriba',
          description: 'La arista está en la capa de arriba, con el blanco hacia arriba y el otro color sobre su centro.',
          alg: 'F2',
        },
        {
          id: 'cross-front',
          name: 'Blanco mirando al frente',
          description: 'La arista está arriba pero con el blanco hacia el frente. Se lleva a la derecha, se baja por el costado y se acomoda.',
          alg: "U' R' F R",
        },
        {
          id: 'cross-middle',
          name: 'En la capa del medio',
          description: 'La arista está en la capa del medio, con el blanco mirando a la derecha. Un solo giro del frente la baja.',
          alg: 'F',
        },
        {
          id: 'cross-flipped',
          name: 'Abajo pero dada vuelta',
          description: 'La arista ya está abajo en su lugar, pero con el blanco hacia el frente. Hay que sacarla y volver a meterla.',
          alg: "F' D R' D'",
        },
      ],
    },
    {
      id: 'first-layer',
      title: 'Esquinas de la primera capa',
      goal: 'Completar la cara blanca con las cuatro esquinas, cada una alineada con los centros de sus costados.',
      stickering: 'first-layer',
      text: [
        'Buscá una esquina con blanco en la capa de arriba y girá U hasta dejarla justo encima de su lugar (arriba a la derecha, al frente). Después aplicá el algoritmo según hacia dónde mire el blanco.',
        'Si una esquina blanca está abajo pero en el lugar equivocado o girada, sacala con R U R\' y seguí con alguno de estos casos.',
      ],
      cases: [
        {
          id: 'fl-right',
          name: 'Blanco a la derecha',
          description: 'La esquina está arriba a la derecha y el blanco mira hacia la derecha.',
          alg: "R U R'",
        },
        {
          id: 'fl-front',
          name: 'Blanco al frente',
          description: 'La esquina está arriba a la derecha y el blanco mira hacia el frente.',
          alg: "F' U' F",
        },
        {
          id: 'fl-up',
          name: 'Blanco arriba',
          description: 'La esquina está arriba a la derecha con el blanco hacia arriba: primero se gira para que el blanco mire a un costado.',
          alg: "R U2 R' U' R U R'",
        },
      ],
    },
    {
      id: 'second-layer',
      title: 'Segunda capa',
      goal: 'Ubicar las cuatro aristas de la capa del medio (las que no tienen amarillo).',
      stickering: 'second-layer',
      text: [
        'Buscá una arista sin amarillo en la capa de arriba. Girá U hasta que el color del frente coincida con el centro del frente: va a formar una "T" invertida. Fijate el color de arriba de la arista: si es el del centro de la derecha, va a la derecha; si es el de la izquierda, va a la izquierda.',
        'Si una arista está en la capa del medio pero mal puesta, aplicá cualquiera de los dos algoritmos en ese lugar para sacarla arriba.',
      ],
      cases: [
        {
          id: 'sl-right',
          name: 'Hacia la derecha',
          description: 'La arista está arriba al frente y tiene que ir entre el frente y la derecha.',
          alg: "U R U' R' U' F' U F",
        },
        {
          id: 'sl-left',
          name: 'Hacia la izquierda',
          description: 'La arista está arriba al frente y tiene que ir entre el frente y la izquierda.',
          alg: "U' L' U L U F U' F'",
        },
      ],
    },
    {
      id: 'yellow-cross',
      title: 'Cruz amarilla',
      goal: 'Hacer una cruz amarilla arriba (sin importar todavía los costados).',
      stickering: 'yellow-cross',
      text: [
        'Mirá solo las aristas de arriba y fijate qué figura forma el amarillo: un punto, una "L" o una línea. Con un mismo algoritmo se pasa de una figura a la siguiente.',
      ],
      cases: [
        {
          id: 'yc-line',
          name: 'Línea',
          description: 'La línea amarilla tiene que quedar horizontal (de izquierda a derecha).',
          alg: "F R U R' U' F'",
        },
        {
          id: 'yc-l',
          name: '"L"',
          description: 'La "L" tiene que quedar con sus brazos hacia atrás y hacia la izquierda.',
          alg: "F U R U' R' F'",
        },
        {
          id: 'yc-dot',
          name: 'Punto',
          description: 'No hay aristas amarillas arriba: se hace el de la línea, queda una "L", y se sigue con el de la "L".',
          alg: "F R U R' U' F' U2 F U R U' R' F'",
        },
      ],
    },
    {
      id: 'yellow-face',
      title: 'Cara amarilla',
      goal: 'Girar las esquinas de arriba para que toda la cara de arriba quede amarilla.',
      stickering: 'yellow-face',
      text: [
        'Contá cuántas esquinas tienen el amarillo arriba. Si hay una sola, la cara forma un "pez" y alcanza con un algoritmo.',
        'Si no hay ninguna o hay dos, poné una esquina con el amarillo mirando a la izquierda (al frente, arriba a la izquierda) y hacé el primero; repetí hasta llegar al pez.',
      ],
      cases: [
        {
          id: 'yf-sune',
          name: 'Pez (Sune)',
          description: 'Una sola esquina amarilla arriba, adelante a la izquierda.',
          alg: "R U R' U R U2 R'",
        },
        {
          id: 'yf-antisune',
          name: 'Pez al revés (Antisune)',
          description: 'Una sola esquina amarilla arriba, atrás a la derecha. Es el mismo algoritmo hacia atrás.',
          alg: "R U2 R' U' R U' R'",
        },
      ],
    },
    {
      id: 'll-corners',
      title: 'Permutar las esquinas',
      goal: 'Llevar cada esquina de arriba a su lugar (las caras laterales empiezan a coincidir).',
      stickering: 'll-corners',
      text: [
        'Mirá los costados de la capa de arriba y buscá "faros": dos esquinas del mismo color en un mismo lado. Poné los faros atrás y hacé el algoritmo.',
        'Si no hay faros en ningún lado, hacé el algoritmo desde cualquier posición: van a aparecer y lo repetís.',
      ],
      cases: [
        {
          id: 'llc-headlights',
          name: 'Faros atrás',
          description: 'Las dos esquinas de atrás ya están bien entre sí; las otras tres rotan.',
          alg: "R' F R' B2 R F' R' B2 R2",
        },
      ],
    },
    {
      id: 'll-edges',
      title: 'Permutar las aristas',
      goal: 'Ubicar las últimas aristas y terminar el cubo.',
      stickering: 'll-edges',
      text: [
        'Buscá un lado completo (una "barra" de tres colores iguales) y ponelo atrás. Fijate hacia dónde tiene que ir la arista del frente: si va a la izquierda es un caso y si va a la derecha es el otro.',
        'Si no hay ninguna barra, hacé cualquiera de los dos y va a aparecer.',
      ],
      cases: [
        {
          id: 'lle-left',
          name: 'La de adelante va a la izquierda',
          description: 'Barra atrás; las tres aristas restantes giran en sentido horario visto desde arriba.',
          alg: "R2 U R U R' U' R' U' R' U R'",
        },
        {
          id: 'lle-right',
          name: 'La de adelante va a la derecha',
          description: 'Barra atrás; las tres aristas restantes giran en sentido antihorario visto desde arriba.',
          alg: "R U' R U R U R U' R' U' R2",
        },
      ],
    },
  ],
};
