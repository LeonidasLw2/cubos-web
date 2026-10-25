// Fuente única de verdad para cifras, etiquetas, estadísticas, consejos, errores comunes
// y navegación entre páginas de Métodos.
//
// Reglas unificadas:
// - 2-look OLL = 10 algoritmos (3 de aristas + 7 de esquinas)
// - 2-look PLL = 6 algoritmos (2 de esquinas + 4 de aristas)
// - CFOP de 2 looks = 16 algoritmos
// - Etiqueta de CFOP = "El más usado"
// - Tiempos típicos y movimientos promedio siempre aproximados (~)

export const UNIFIED_COUNTS = {
  twoLookOll: 10,
  twoLookPll: 6,
  twoLookCfop: 16,
  fullOll: 57,
  fullPll: 21,
  fullF2l: 41,
  fullCfop: 119,
  rouxCmll: 42,
  ortegaOll: 7,
  ortegaPbl: 5,
  ortegaTotal: 12,
  cll2x2: 42,
};

export const CFOP_BADGE = 'El más usado';

// Metadatos enriquecidos por página de método / etapa (Hero, Stats, Requisitos, Consejos, Errores, Prev/Next).
export const PAGE_METADATA = {
  beginner: {
    puzzle: '3x3x3',
    stickering: 'first-layer',
    setupAlg: "R U R' U' F' U' F",
    accent: 'green',
    chips: ['Dificultad: Baja', '3 algoritmos base', 'Aprendizaje: ~1–2 días'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '7 pasos' },
      { icon: 'book', label: 'Algoritmos', value: '3 básicos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~95–110 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~45 s – 2 min' },
    ],
    prerequisites: [
      'Conocer las 6 caras del cubo (U, D, F, B, L, R) y que los centros del 3x3 son fijos.',
      'Saber qué significa una letra sola (90° horario) y con apóstrofe (\', antihorario).',
    ],
    tips: [
      { title: 'Mantené el blanco abajo', text: 'Armar la cruz directamente en la cara de abajo evita dar vuelta el cubo a mitad de la resolución.' },
      { title: 'Miradas a los centros', text: 'El color de cada cara lo define su centro fijo: alineá siempre las aristas y esquinas con sus centros laterales.' },
      { title: 'No cortes el último giro', text: 'Al orientar las esquinas amarillas en el último paso, completá siempre los 4 movimientos (R\' D\' R D) antes de girar U.' },
    ],
    mistakes: [
      { title: 'Rotar todo el cubo en el último paso', text: 'Si girás el cubo entero en lugar de girar solo la capa U para traer la siguiente esquina amarilla, el cubo se desarma.' },
      { title: 'Armar los colores de la cruz sin alinear laterales', text: 'Cuatro aristas blancas arriba no forman una cruz válida si sus otros colores no coinciden con los 4 centros del medio.' },
    ],
    prev: { label: '3x3 · Comparativa', href: '#/metodos/3x3' },
    next: { label: 'CFOP · El más usado', href: '#/metodos/3x3/cfop' },
  },

  cfop: {
    puzzle: '3x3x3',
    stickering: 'pll',
    setupAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    accent: 'blue',
    chips: ['★ El más usado', '2-look: 16 algoritmos · Completo: 119', 'Aprendizaje gradual: ~2–8 semanas'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '4 (C · F · O · P)' },
      { icon: 'book', label: 'Algoritmos 2-look', value: '16 algoritmos' },
      { icon: 'book', label: 'Algoritmos totales', value: '119 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~55 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~8 s – 25 s' },
    ],
    whatYouLearn: [
      { title: '1. Cruz eficiente', text: 'Planificar las 4 aristas de la base durante los 15 s de inspección y resolverlas en 8 movimientos o menos con el blanco abajo.' },
      { title: '2. F2L (First Two Layers)', text: 'Unir cada esquina de la primera capa con su arista de la segunda capa en la capa superior e insertarlas juntas en sus 4 ranuras (41 casos).' },
      { title: '3. OLL (Orientation of the Last Layer)', text: 'Dejar toda la cara superior amarilla de una sola vez (57 casos) o en 2 pasos con solo 10 algoritmos (2-look OLL).' },
      { title: '4. PLL (Permutation of the Last Layer)', text: 'Ubicar todas las piezas de la última capa en su posición final sin perder la orientación amarilla: 21 casos (o 6 algoritmos en 2-look PLL).' },
    ],
    learningGoals: [
      { stage: 'Fase 1 · CFOP de 2 looks', time: 'Semanas 1–2', target: '~25–35 s', desc: 'F2L intuitivo + 2-look OLL (10 algoritmos) + 2-look PLL (6 algoritmos) = 16 algoritmos en total.' },
      { stage: 'Fase 2 · PLL completo', time: 'Semanas 3–5', target: '~18–24 s', desc: 'Aprender los 21 casos de PLL para resolver la permutación final en un único paso.' },
      { stage: 'Fase 3 · F2L sin pausas + OLL completo', time: 'Mes 2+', target: 'Sub-15 s', desc: 'Dominar los 41 casos de F2L desde distintos ángulos y sumar los 57 casos de OLL.' },
    ],
    prerequisites: [
      'Resolver el 3x3 con el método principiante en menos de ~1:15 min.',
      'Manejar la notación básica del 3x3 (R, L, U, D, F, B y giros dobles 2).',
    ],
    tips: [
      { title: 'Empezá por CFOP de 2 looks (16 algoritmos)', text: 'No intentes memorizar los 119 algoritmos juntos: con 10 de 2-look OLL y 6 de 2-look PLL ya tenés toda la estructura de CFOP.' },
      { title: 'Priorizá la fluidez en F2L', text: 'Más de la mitad del tiempo de resolución está en la cruz y el F2L. Girar parejo sin pausas rinde mucho más que girar brusco y frenar.' },
      { title: 'Reconocimiento por 2 caras en PLL', text: 'Acostumbrate a identificar bloques y faros mirando solo el frente y la derecha antes de girar U.' },
    ],
    mistakes: [
      { title: 'Abusar de rotaciones (y / y\') durante F2L', text: 'Rotar el cubo más de una vez por par hace perder de vista las piezas traseras; insertá también en las ranuras de atrás con R\' U R o L U\' L\'.' },
      { title: 'Girar U al azar buscando piezas (AUF innecesario)', text: 'Antes de girar la capa U, mirá qué hay en el frente y los laterales para ahorrar 4 o 5 movimientos por resolución.' },
    ],
    ctaFirstStage: { label: 'Empezar por Etapa 1: La Cruz →', href: '#/metodos/3x3/cfop/cruz' },
    prev: { label: '3x3 · Principiante', href: '#/metodos/3x3/principiante' },
    next: { label: 'Etapa 1 · La Cruz', href: '#/metodos/3x3/cfop/cruz' },
  },

  cross: {
    puzzle: '3x3x3',
    stickering: 'cross',
    setupAlg: "D' R' F D2 R'",
    accent: 'white',
    chips: ['Etapa 1 de CFOP', 'Intuitiva (0 algoritmos)', 'Máximo 8 movimientos'],
    stats: [
      { icon: 'moves', label: 'Tope matemático', value: '≤ 8 giros (HTM)' },
      { icon: 'moves', label: 'Promedio típico', value: '~5–6 giros' },
      { icon: 'clock', label: 'Inspección WCA', value: '15 segundos' },
      { icon: 'clock', label: 'Ejecución objetivo', value: '~1,5 – 2,5 s' },
    ],
    prerequisites: [
      'Conocer el orden de los 4 colores laterales con el blanco abajo: Verde (frente) → Rojo (derecha) → Azul (atrás) → Naranja (izquierda).',
    ],
    tips: [
      { title: 'Cruz relativa', text: 'Armá las 4 aristas respetando su orden entre sí aunque estén corridas de su centro, y alinealas al final con un solo giro D, D\' o D2.' },
      { title: 'Aprovechá una arista para acomodar otra', text: 'Cuando bajes una arista con F o R, fijate si ese mismo giro deja otra arista lista para insertarse en un movimiento.' },
    ],
    mistakes: [
      { title: 'Subir cada arista al amarillo primero', text: 'La margarita sirve el primer día, pero duplica la cantidad de giros. Aprendé a insertar cada arista directo en D.' },
    ],
    prev: { label: 'Resumen CFOP', href: '#/metodos/3x3/cfop' },
    next: { label: 'Etapa 2 · F2L (41 casos)', href: '#/metodos/3x3/cfop/f2l' },
  },

  f2l: {
    puzzle: '3x3x3',
    stickering: 'f2l',
    setupAlg: "R U R'",
    accent: 'green',
    chips: ['Etapa 2 de CFOP', '41 casos estándar', 'Intuitivo + Algorítmico'],
    stats: [
      { icon: 'layers', label: 'Ranuras (slots)', value: '4 pares' },
      { icon: 'book', label: 'Casos totales', value: '41 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~26–30 giros' },
      { icon: 'clock', label: 'Tiempo objetivo', value: '~4 – 10 s' },
    ],
    intuitiveSummary: {
      title: 'F2L Intuitivo: las 3 situaciones base',
      text: 'Cualquier par esquina-arista en la capa superior se reduce a una de tres situaciones antes de insertarse en su ranura con R U R\' o F\' U\' F:',
      items: [
        { name: '1. Colores distintos arriba', desc: 'La esquina tiene el blanco de costado y el color superior de la esquina es distinto al de la arista: se juntan e insertan en 3 movimientos (ej. R U R\').' },
        { name: '2. Mismo color arriba', desc: 'Los dos stickers de arriba tienen el mismo color: escondés la esquina bajándola, acercás la arista en U para formar el par y subís.' },
        { name: '3. Blanco mirando arriba', desc: 'El sticker blanco de la esquina apunta al techo: alineás la arista con su centro lateral, la inclinás alejándola de la esquina, ponés la esquina encima y volvés.' },
      ],
    },
    prerequisites: [
      'Tener la cruz blanca armada en la cara inferior (D) sin deshacerla al mover las caras laterales.',
    ],
    tips: [
      { title: 'Usá ranuras vacías (empty slots)', text: 'Cuando escondés una pieza en la capa inferior para separar o emparejar en U, asegurate de que la columna que sube sea una ranura todavía vacía.' },
      { title: 'Insertá también atrás', text: 'Insertar en las ranuras traseras (BR y BL) sin rotar el cubo deja visibles todas las piezas de adelante.' },
    ],
    mistakes: [
      { title: 'Romper una ranura ya resuelta', text: 'Antes de hacer R U R\' para separar un par, verificá qué esquina estás subiendo desde abajo.' },
      { title: 'Mirar el par que ya estás insertando', text: 'Una vez que tus dedos saben los últimos 3 giros del par actual, tus ojos ya tienen que buscar las dos piezas del siguiente par.' },
    ],
    prev: { label: 'Etapa 1 · La Cruz', href: '#/metodos/3x3/cfop/cruz' },
    next: { label: 'Etapa 3 · OLL (57 casos)', href: '#/metodos/3x3/cfop/oll' },
  },

  oll: {
    puzzle: '3x3x3',
    stickering: 'oll',
    setupAlg: "R U R' U R U2' R'",
    accent: 'yellow',
    chips: ['Etapa 3 de CFOP', '2-look: 10 algoritmos', 'Completo: 57 casos'],
    stats: [
      { icon: 'book', label: '2-look OLL', value: '10 algoritmos' },
      { icon: 'book', label: 'OLL completo', value: '57 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~9–10 giros' },
      { icon: 'clock', label: 'Ejecución típica', value: '~1,2 – 2,5 s' },
    ],
    prerequisites: [
      'Tener las dos primeras capas (F2L) completas con el amarillo apuntando hacia arriba (U).',
    ],
    tips: [
      { title: 'Dominá primero los 10 de 2-look OLL', text: '3 algoritmos arman la cruz amarilla (Línea, L y Punto) y 7 orientan las esquinas (Sune, Antisune, H, Pi, U, T y L).' },
      { title: 'Evitá los casos de "Punto"', text: 'En el último par de F2L, insertar con R\' F R F\' (sledgehammer) en vez de U R U\' R\' orienta una arista superior y evita quedar sin ninguna arista amarilla arriba.' },
    ],
    mistakes: [
      { title: 'Confundir Sune y Antisune', text: 'En Sune (OLL 27) la esquina amarilla armada está adelante a la izquierda y un sticker amarillo te mira de frente a la derecha.' },
    ],
    prev: { label: 'Etapa 2 · F2L', href: '#/metodos/3x3/cfop/f2l' },
    next: { label: 'Etapa 4 · PLL (21 casos)', href: '#/metodos/3x3/cfop/pll' },
  },

  pll: {
    puzzle: '3x3x3',
    stickering: 'pll',
    setupAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    accent: 'red',
    chips: ['Etapa 4 de CFOP', '2-look: 6 algoritmos', 'Completo: 21 casos'],
    stats: [
      { icon: 'book', label: '2-look PLL', value: '6 algoritmos' },
      { icon: 'book', label: 'PLL completo', value: '21 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~11–13 giros' },
      { icon: 'clock', label: 'Ejecución típica', value: '~1,3 – 2,8 s' },
    ],
    twoLookSummary: {
      title: 'PLL en 2 pasos (2-look PLL): 6 algoritmos',
      text: 'Para resolver cualquier PLL en dos pasos solo necesitás 6 algoritmos: 2 para acomodar las esquinas y 4 para las aristas.',
      steps: [
        { name: 'Paso 1 · Esquinas (2 algoritmos)', desc: 'Si hay "faros" (dos esquinas del mismo color en un lado), ponelos a la izquierda y aplicá T (o Aa). Si no hay faros en ningún lado (intercambio diagonal), aplicá Y.' },
        { name: 'Paso 2 · Aristas (4 algoritmos)', desc: 'Con las 4 esquinas ya en su lugar, terminá las aristas con Ua (ciclo horario), Ub (ciclo antihorario), H (opuestas cruzadas) o Z (adyacentes).' },
      ],
    },
    prerequisites: [
      'Tener toda la cara superior orientada de color amarillo (OLL resuelto).',
    ],
    tips: [
      { title: 'Alineá el caso con U antes que con rotaciones', text: 'Girá la capa U para llevar el caso a su ángulo de ejecución en lugar de girar todo el cubo con las manos.' },
      { title: 'Aprendé primero T, Y, Ua, Ub, H y Z', text: 'Esos 6 algoritmos son la base de 2-look PLL y además son 6 de los 21 casos de PLL completo.' },
    ],
    mistakes: [
      { title: 'Olvidar el AUF final', text: 'Después de terminar el algoritmo de PLL, puede faltar un último giro U, U\' o U2 para alinear la capa superior con las dos primeras.' },
    ],
    prev: { label: 'Etapa 3 · OLL', href: '#/metodos/3x3/cfop/oll' },
    next: { label: '3x3 · Método Roux', href: '#/metodos/3x3/roux' },
  },

  roux: {
    puzzle: '3x3x3',
    stickering: 'cmll',
    setupAlg: "R U R' U R U2' R'",
    accent: 'orange',
    chips: ['Dificultad: Media', '42 casos CMLL', 'Alta eficiencia (~48 giros)'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '4 (FB · SB · CMLL · LSE)' },
      { icon: 'book', label: 'Algoritmos CMLL', value: '42 casos (o 9 en 2 pasos)' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~45–50 giros (STM)' },
      { icon: 'clock', label: 'Tiempo típico', value: '~9 s – 25 s' },
    ],
    prerequisites: [
      'Sentirse cómodo con giros de la capa central M (M, M\', M2) usando el dedo anular o medio desde abajo.',
    ],
    tips: [
      { title: 'Libertad en el Primer Bloque (FB)', text: 'Como la capa M y el lado derecho están libres, podés armar el bloque 1x2x3 izquierdo en muy pocos movimientos.' },
      { title: 'Reconocimiento de EO en LSE', text: 'En el paso 4a solo mirá si los stickers de las 6 aristas restantes son del color de arriba/abajo (blanco o amarillo): ambos colores cuentan como orientados.' },
    ],
    mistakes: [
      { title: 'Tratar los bloques como Cruz + F2L', text: 'Si primero ponés la arista inferior y después armás pares como en CFOP, desaprovechás la libertad de la capa M.' },
    ],
    prev: { label: '3x3 · CFOP', href: '#/metodos/3x3/cfop' },
    next: { label: '2x2 · Métodos', href: '#/metodos/2x2' },
  },

  beginner2: {
    puzzle: '2x2x2',
    stickering: '2x2-first-layer',
    setupAlg: "R U R' U'",
    accent: 'green',
    chips: ['Dificultad: Baja', '3 algoritmos', 'Aprendizaje: ~30 min'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '3 pasos' },
      { icon: 'book', label: 'Algoritmos', value: '2–3 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~25–30 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~8 s – 20 s' },
    ],
    prerequisites: [
      'Recordar que el 2x2 equivale a las 8 esquinas del 3x3: no tiene centros fijos, así que la primera esquina que pongas define tu cara de referencia.',
    ],
    tips: [
      { title: 'Elegí una esquina de ancla', text: 'Por ejemplo, si empezás por la cara blanca y tu primera esquina es blanco-verde-rojo, la esquina de al lado adelante tiene que tener blanco y verde.' },
    ],
    mistakes: [
      { title: 'Armar una cara blanca sin mirar los costados', text: 'En el método principiante necesitás una primera CAPA (con las barras laterales coincidiendo), mientras que en Ortega alcanza con una CARA.' },
    ],
    prev: { label: '2x2 · Comparativa', href: '#/metodos/2x2' },
    next: { label: '2x2 · Método Ortega', href: '#/metodos/2x2/ortega' },
  },

  ortega: {
    puzzle: '2x2x2',
    stickering: '2x2-pbl',
    setupAlg: "R2 U' B2 U2 R2 U' R2",
    accent: 'blue',
    chips: ['Dificultad: Baja / Media', '12 algoritmos (7 OLL + 5 PBL)', 'Aprendizaje: ~2–4 días'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '3 (Cara · OLL · PBL)' },
      { icon: 'book', label: 'Algoritmos', value: '12 casos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~18–20 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~3,5 s – 7 s' },
    ],
    prerequisites: [
      'Saber armar una cara de un mismo color en 3–5 movimientos, sin importar cómo queden los colores laterales.',
    ],
    tips: [
      { title: 'Neutralidad de color total', text: 'En 2x2 es muy fácil empezar por cualquiera de los 6 colores: buscá en la inspección qué color ya tiene una barra de 2 o 3 piezas armadas.' },
      { title: 'Detectá la barra de abajo durante la inspección', text: 'Cuando armes la primera cara, recordá si abajo quedó barra (adyacente), todo armado o diagonal: eso ahorra mirar abajo en PBL.' },
    ],
    mistakes: [
      { title: 'Perder tiempo alineando la primera capa', text: 'En Ortega NO hace falta que coincidan los laterales de la primera cara: PBL arregla las dos capas al mismo tiempo.' },
    ],
    prev: { label: '2x2 · Principiante', href: '#/metodos/2x2/principiante' },
    next: { label: '2x2 · Método CLL (42 casos)', href: '#/metodos/2x2/cll' },
  },

  cll: {
    puzzle: '2x2x2',
    stickering: '2x2-cll',
    setupAlg: "R U R' U R U2' R'",
    accent: 'red',
    chips: ['Dificultad: Avanzada', '42 algoritmos', 'Última capa en 1 paso'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '2 (Capa + CLL)' },
      { icon: 'book', label: 'Algoritmos', value: '42 casos (7 grupos)' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~14–16 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~2 s – 4,5 s' },
    ],
    prerequisites: [
      'Dominar Ortega y saber armar la primera capa completa con sus colores laterales ordenados.',
    ],
    tips: [
      { title: 'Aprender grupo por grupo', text: 'Los 42 casos se dividen en 7 formas de orientación (Sune, Antisune, H, Pi, U, T, L) con 6 casos cada una (más los 2 de permutación O).' },
    ],
    mistakes: [
      { title: 'Aplicar CLL sobre una cara desordenada', text: 'A diferencia de Ortega, CLL exige que las 4 esquinas de la capa inferior estén bien permutadas entre sí (si no, necesitarías EG-1 o EG-2).' },
    ],
    prev: { label: '2x2 · Método Ortega', href: '#/metodos/2x2/ortega' },
    next: { label: '4x4 · Métodos', href: '#/metodos/4x4' },
  },

  reduction4: {
    puzzle: '4x4x4',
    stickering: '4x4-full',
    setupAlg: "Rw U2 x Rw U2 Rw U2' Rw' U2 Lw U2 Rw' U2' Rw U2 Rw' U2' Rw'",
    accent: 'green',
    chips: ['Dificultad: Media', '2 algoritmos de paridad', 'Estándar para empezar en 4x4'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '3 + Paridades' },
      { icon: 'book', label: 'Paridades posibles', value: 'OLL y PLL (2 algs)' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~110–130 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~55 s – 1:45 min' },
    ],
    prerequisites: [
      'Saber resolver el 3x3 con fluidez (Principiante o CFOP).',
      'Recordar el esquema de colores WCA porque el 4x4 no tiene centros fijos: con Blanco abajo y Amarillo arriba, el orden lateral hacia la derecha es Verde → Rojo → Azul → Naranja.',
    ],
    tips: [
      { title: 'Armá los centros por barras de 1x2', text: 'En lugar de meter piezas de centro una por una, formá dos barras de 2 piezas y unilas.' },
      { title: 'Usá Freeslice o 3-2-3 para las aristas', text: 'Desplazar la mitad superior (Uw / Uw\') permite emparejar varias aristas seguidas antes de restaurar los centros.' },
    ],
    mistakes: [
      { title: 'Invertir los centros laterales', text: 'Si armás el centro rojo a la izquierda del verde en vez de a su derecha, las esquinas no van a coincidir nunca al llegar a la etapa 3x3.' },
    ],
    prev: { label: '4x4 · Comparativa', href: '#/metodos/4x4' },
    next: { label: '4x4 · Método Yau', href: '#/metodos/4x4/yau' },
  },

  yau: {
    puzzle: '4x4x4',
    stickering: 'yau-cross',
    setupAlg: "Uw R U' R' Uw'",
    accent: 'blue',
    chips: ['Dificultad: Media / Alta', 'Cruz anticipada + 3-2-3', 'Estándar de competición'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '5 etapas fluidas' },
      { icon: 'book', label: 'Emparejado final', value: 'Sistema 3-2-3' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~95–115 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~30 s – 1:05 min' },
    ],
    prerequisites: [
      'Dominar la reducción estándar del 4x4 y los dos algoritmos de paridad.',
      'Resolver el 3x3 con CFOP.',
    ],
    tips: [
      { title: 'Dejá libre una ranura de la cruz', text: 'Armar primero solo 3 de las 4 aristas blancas en la capa izquierda permite construir los 4 centros laterales usando esa cuarta posición libre.' },
    ],
    mistakes: [
      { title: 'Romper las 3 aristas de la cruz al armar centros', text: 'Mantené las 3 aristas blancas aseguradas en L y hacé solo giros Rw, R y U para los 4 centros laterales.' },
    ],
    prev: { label: '4x4 · Reducción', href: '#/metodos/4x4/reduccion' },
    next: { label: '5x5 · Métodos', href: '#/metodos/5x5' },
  },
};
