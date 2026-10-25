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

  reduction5: {
    puzzle: '5x5x5',
    stickering: '5x5-full',
    setupAlg: "Uw' R U R' F R' F' R Uw",
    accent: 'green',
    chips: ['Centros fijos · Sin paridad PLL', '1 paridad de alas', 'Barras 1×3 + Freeslice'],
    stats: [
      { icon: 'layers', label: 'Centros', value: '6 bloques de 3×3' },
      { icon: 'layers', label: 'Aristas', value: '12 triples (Freeslice)' },
      { icon: 'book', label: 'Paridad posible', value: 'Solo alas de última arista' },
      { icon: 'clock', label: 'Tiempo típico', value: '~1:15 – 2:30 min' },
    ],
    prerequisites: [
      'Saber resolver el 3x3 y conocer la mecánica de reducción del 4x4.',
      'Comprender que el centro central de cada cara es fijo y define el color de esa cara.',
    ],
    tips: [
      { title: 'Freeslice en las primeras 8 aristas', text: 'Desplazá Uw libremente para armar aristas de 3 piezas y guardalas en U y D antes de restaurar los centros.' },
      { title: 'Revisá la orientación de las alas antes de subir', text: 'Si un ala tiene los colores invertidos respecto de la pieza central (midge), aplicá R U R\' F R\' F\' R antes de juntar.' },
    ],
    mistakes: [
      { title: 'Intentar armar las últimas 4 aristas rompiendo centros sin volver', text: 'Con 8 aristas ya guardadas en U y D, cada giro Uw debe deshacerse con Uw\' después de voltear la arista.' },
    ],
    prev: { label: '5x5 · Comparativa', href: '#/metodos/5x5' },
    next: { label: '5x5 · Método Yau5', href: '#/metodos/5x5/yau5' },
  },

  yau5: {
    puzzle: '5x5x5',
    stickering: '5x5-full',
    setupAlg: "Rw U2 Rw'",
    accent: 'blue',
    chips: ['Dificultad: Avanzada', 'Cruz + 2 pares F2L anticipados', 'Transición directa a 3x3'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '4 etapas integradas' },
      { icon: 'book', label: 'Ventaja clave', value: 'Cruz + 2 F2L listos' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~145–170 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~50 s – 1:40 min' },
    ],
    prerequisites: [
      'Dominar Reducción 5x5 y el método Yau en 4x4.',
    ],
    tips: [
      { title: 'Asegurá dos pares de F2L antes de las últimas 4 aristas', text: 'Al dejar dos ranuras de F2L ya resueltas, las últimas aristas quedan todas a la vista en la mitad superior.' },
    ],
    mistakes: [
      { title: 'Cortar las 3 aristas de la cruz al hacer centros laterales', text: 'Mantené las 3 aristas blancas en la cara izquierda (L) y usá únicamente giros Rw, 2R, 3R y U.' },
    ],
    prev: { label: '5x5 · Reducción', href: '#/metodos/5x5/reduccion' },
    next: { label: '7x7 · Métodos', href: '#/metodos/7x7' },
  },

  reduction7: {
    puzzle: '7x7x7',
    stickering: '7x7-full',
    setupAlg: "3Uw' R U R' F R' F' R 3Uw",
    accent: 'orange',
    chips: ['Centros de 5×5 (barras 1×5)', 'Aristas de 5 piezas', 'Conmutadores + Freeslice'],
    stats: [
      { icon: 'layers', label: 'Piezas por centro', value: '25 (5 barras de 1×5)' },
      { icon: 'layers', label: 'Piezas por arista', value: '5 (midge + 4 alas)' },
      { icon: 'book', label: 'Paridad posible', value: 'Alas internas / externas' },
      { icon: 'clock', label: 'Tiempo típico', value: '~3:00 – 6:00 min' },
    ],
    prerequisites: [
      'Dominar la reducción del 5x5, el emparejado Freeslice y el algoritmo de paridad de alas.',
    ],
    tips: [
      { title: 'Construí siempre de adentro hacia afuera', text: 'Tanto en los centros de 5×5 como en las aristas de 5 piezas, empezá por el centro fijo / midge, sumá las capas internas (3R/3U) y cerrá con las externas (2R/2U).' },
      { title: 'Usá conmutadores para las últimas piezas del sexto centro', text: 'Con 2R U\' 3L\' U 2R\' U\' 3L cambiás una sola pieza puntual entre dos centros sin desarmar ninguna barra.' },
    ],
    mistakes: [
      { title: 'Forzar giros con capas desalineadas', text: 'En un 7x7 es clave mantener los dedos medios alineando el bloque central para evitar trabas mecánicas.' },
    ],
    prev: { label: '7x7 · Resumen', href: '#/metodos/7x7' },
    next: { label: 'Megaminx · Métodos', href: '#/metodos/megaminx' },
  },

  megaminxStandard: {
    puzzle: 'megaminx',
    stickering: 'full',
    setupAlg: "F R U R' U' F'",
    accent: 'celeste',
    chips: ['12 caras pentagonales', '6 etapas progresivas', 'Última capa en 4 pasos'],
    stats: [
      { icon: 'layers', label: 'Estructura', value: 'Estrella + F2L + S2L + LL' },
      { icon: 'book', label: 'Última capa base', value: '4 pasos (EO·CO·EP·CP)' },
      { icon: 'moves', label: 'Sin paridades', value: 'Piezas equivalentes a 3x3' },
      { icon: 'clock', label: 'Tiempo típico', value: '~1:10 – 2:45 min' },
    ],
    prerequisites: [
      'Saber armar el 3x3 con F2L y conocer los algoritmos básicos de última capa (F R U R\' U\' F\' y Sune).',
    ],
    tips: [
      { title: 'Aprovechá el espacio libre durante F2L y S2L', text: 'Con 12 caras tenés muchas caras vecinas desocupadas para emparejar esquina y arista sin usar algoritmos largos.' },
      { title: 'Seguí un orden fijo de colores en S2L', text: 'Recorrer las caras laterales siempre en el mismo sentido evita perder tiempo buscando piezas por detrás del dodecaedro.' },
    ],
    mistakes: [
      { title: 'Girar U de más al recordar el 3x3', text: 'En Megaminx cada cara tiene 5 lados: el giro opuesto a U es U\' (4/5 de vuelta en horario), y dos lugares es U2 o U2\'.' },
    ],
    prev: { label: 'Megaminx · Resumen', href: '#/metodos/megaminx' },
    next: { label: 'Pyraminx · Métodos', href: '#/metodos/pyraminx' },
  },

  pyraminxBeginner: {
    puzzle: 'pyraminx',
    stickering: 'full',
    setupAlg: "R' L R L' U L' U' L",
    accent: 'yellow',
    chips: ['Dificultad: Muy baja', '5 casos de última capa', 'Aprendizaje: ~20 min'],
    stats: [
      { icon: 'layers', label: 'Etapas', value: '3 (Centros · Capa · LL)' },
      { icon: 'book', label: 'Casos última capa', value: '5 casos verificados' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~16–22 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~6 s – 14 s' },
    ],
    prerequisites: [
      'Distinguir las 4 puntas triviales (u, l, r, b), los 4 bloques axiales (U, L, R, B) y las 6 aristas.',
    ],
    tips: [
      { title: 'Identificá la punta que NO tiene tu color base', text: 'La única punta que no tiene el color elegido para la base va arriba (U); las otras tres forman tu cara inferior.' },
    ],
    mistakes: [
      { title: 'Insertar aristas de la base sin alinear su color lateral', text: 'Igual que en el 3x3, cada arista inferior tiene dos colores: ambos deben coincidir con sus centros antes de bajarla.' },
    ],
    prev: { label: 'Pyraminx · Comparativa', href: '#/metodos/pyraminx' },
    next: { label: 'Pyraminx · Keyhole y L4E', href: '#/metodos/pyraminx/avanzados' },
  },

  pyraminxAdvanced: {
    puzzle: 'pyraminx',
    stickering: 'full',
    setupAlg: "R' L R L'",
    accent: 'red',
    chips: ['Keyhole · L4E · Top-First · 1-Flip', 'Enfoque en V + últimas 4 aristas', 'Objetivo: Sub-5 s'],
    stats: [
      { icon: 'layers', label: 'Base L4E', value: 'V inferior (2 aristas)' },
      { icon: 'book', label: 'Familias', value: 'Keyhole, L4E y Top-First' },
      { icon: 'moves', label: 'Movimientos prom.', value: '~11–15 giros' },
      { icon: 'clock', label: 'Tiempo típico', value: '~2,5 s – 6 s' },
    ],
    prerequisites: [
      'Resolver el Pyraminx con el método principiante en menos de ~10 segundos.',
    ],
    tips: [
      { title: 'Planeá la V completa en la inspección', text: 'Armar los 3 centros y 2 aristas inferiores toma entre 3 y 5 movimientos: se puede prever entero durante los 15 s de inspección.' },
    ],
    mistakes: [
      { title: 'Casarse con un único color de V', text: 'En Pyraminx hay 4 caras y en cada cara podés dejar libre cualquiera de las 3 aristas: elegí siempre la V más corta de la mezcla.' },
    ],
    prev: { label: 'Pyraminx · Principiante', href: '#/metodos/pyraminx/principiante' },
    next: { label: 'Portada de Métodos', href: '#/metodos' },
  },
};
