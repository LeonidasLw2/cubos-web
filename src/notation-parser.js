// Parser, validador y catálogo de notación WCA / cubing.js para los 7 puzzles:
// 2x2, 3x3, 4x4, 5x5, 7x7, Pyraminx y Megaminx.
// Se usa tanto en #/notacion como en #/solver.

const PUZZLE_ALIASES = {
  '2x2': '2x2',
  '2x2x2': '2x2',
  '3x3': '3x3',
  '3x3x3': '3x3',
  '4x4': '4x4',
  '4x4x4': '4x4',
  '5x5': '5x5',
  '5x5x5': '5x5',
  '7x7': '7x7',
  '7x7x7': '7x7',
  pyraminx: 'pyraminx',
  pyram: 'pyraminx',
  megaminx: 'megaminx',
  minx: 'megaminx',
  mirror: 'mirror',
  'mirror-cube': 'mirror',
};

export function normalizePuzzleKey(puzzle = '3x3') {
  return PUZZLE_ALIASES[String(puzzle).toLowerCase().trim()] || '3x3';
}

const FACE_NAMES_ES = {
  U: { name: 'Arriba (Up)', short: 'capa superior' },
  D: { name: 'Abajo (Down)', short: 'capa inferior' },
  R: { name: 'Derecha (Right)', short: 'capa derecha' },
  L: { name: 'Izquierda (Left)', short: 'capa izquierda' },
  F: { name: 'Frente (Front)', short: 'capa frontal' },
  B: { name: 'Atrás (Back)', short: 'capa trasera' },
};

const SLICE_FOLLOWS_ES = {
  M: {
    name: 'Capa media vertical (Middle)',
    follows: 'L',
    rule: 'Entre L y R; gira en el mismo sentido que L (hacia abajo al frente).',
  },
  E: {
    name: 'Capa ecuatorial horizontal (Equatorial)',
    follows: 'D',
    rule: 'Entre U y D; gira en el mismo sentido que D (de izquierda a derecha al frente).',
  },
  S: {
    name: 'Capa central frontal (Standing)',
    follows: 'F',
    rule: 'Entre F y B; gira en el mismo sentido que F (horario mirando el frente).',
  },
};

const ROTATIONS_ES = {
  x: {
    name: 'Rotación en eje X',
    follows: 'R',
    rule: 'Gira el cubo entero como si hicieras R (la cara F sube hacia U).',
  },
  y: {
    name: 'Rotación en eje Y',
    follows: 'U',
    rule: 'Gira el cubo entero como si hicieras U (la cara R pasa al frente).',
  },
  z: {
    name: 'Rotación en eje Z',
    follows: 'F',
    rule: 'Gira el cubo entero como si hicieras F (la cara U se inclina hacia R).',
  },
};

export const PUZZLE_NOTATION_SPECS = {
  '2x2': {
    id: '2x2',
    puzzleId: '2x2x2',
    name: '2x2',
    title: 'Notación de 2x2 (Pocket Cube)',
    intro:
      'El 2x2 no tiene centros ni aristas, pero usa exactamente las mismas 6 letras de caras que el 3x3 (U, D, R, L, F, B) y las 3 rotaciones del cubo completo (x, y, z). En las mezclas oficiales WCA solo se usan U, R y F dejando fija la esquina DBL.',
    clockwiseRule:
      'Una letra sola indica un giro de 90° en sentido horario mirando esa cara directamente de frente. Con apóstrofe (\') gira 90° antihorario; con un 2 gira 180°.',
    groups: [
      {
        id: 'basic',
        title: 'Caras básicas (90° / 180°)',
        subtitle: 'Cada giro mueve un bloque de 4 esquinas de esa cara.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira la ${FACE_NAMES_ES[f].short} mirando ${f} de frente.`,
        })),
      },
      {
        id: 'rotations',
        title: 'Rotaciones del cubo completo',
        subtitle: 'Cambian la orientación del cubo sin alterar las piezas entre sí.',
        moves: ['x', 'y', 'z'].map((r) => ({
          base: r,
          variants: ['', "'", '2'],
          label: ROTATIONS_ES[r].name,
          meaning: ROTATIONS_ES[r].rule,
          follows: `Sigue a ${ROTATIONS_ES[r].follows}`,
        })),
      },
    ],
    sampleSequences: [
      { label: 'Sexy Move', alg: "R U R' U'" },
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'PBL Adyacente (T-Perm)', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    ],
  },

  '3x3': {
    id: '3x3',
    puzzleId: '3x3x3',
    name: '3x3',
    title: 'Notación de 3x3 (Cubo de Rubik)',
    intro:
      'La notación estándar Singmaster / WCA identifica cada cara por su inicial en inglés: U (Up), D (Down), R (Right), L (Left), F (Front) y B (Back). Se complementa con giros de dos capas (Uw o u), capas centrales (M, E, S) y rotaciones (x, y, z).',
    clockwiseRule:
      'Sentido horario siempre significa "como las agujas del reloj si miraras esa cara de frente". Por eso R y L parecen girar en sentidos opuestos vistos desde el frente, y lo mismo ocurre con U/D y F/B.',
    groups: [
      {
        id: 'basic',
        title: 'Caras exteriores (U, D, R, L, F, B)',
        subtitle: 'Giros de una sola capa exterior de 90° o 180°.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira la ${FACE_NAMES_ES[f].short} mirando ${f} de frente.`,
        })),
      },
      {
        id: 'wide',
        title: 'Giros dobles / anchos (Uw/u, Dw/d, Rw/r, Lw/l, Fw/f, Bw/b)',
        subtitle: 'Mueven la capa exterior junto con la capa central adyacente.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: `${f}w`,
          alias: f.toLowerCase(),
          variants: ['', "'", '2'],
          label: `${f}w / ${f.toLowerCase()} · Doble ${FACE_NAMES_ES[f].short}`,
          meaning: `Gira la ${FACE_NAMES_ES[f].short} más la capa del medio contigua (equivale a ${f}w o ${f.toLowerCase()}).`,
        })),
      },
      {
        id: 'slices',
        title: 'Capas medias (M, E, S)',
        subtitle: 'Cada capa media sigue el sentido de giro de una cara de referencia.',
        moves: ['M', 'E', 'S'].map((s) => ({
          base: s,
          variants: ['', "'", '2'],
          label: SLICE_FOLLOWS_ES[s].name,
          meaning: SLICE_FOLLOWS_ES[s].rule,
          follows: `Sigue a ${SLICE_FOLLOWS_ES[s].follows}`,
        })),
      },
      {
        id: 'rotations',
        title: 'Rotaciones del cubo completo (x, y, z)',
        subtitle: 'Rotan todo el puzzle sobre uno de sus tres ejes.',
        moves: ['x', 'y', 'z'].map((r) => ({
          base: r,
          variants: ['', "'", '2'],
          label: ROTATIONS_ES[r].name,
          meaning: ROTATIONS_ES[r].rule,
          follows: `Sigue a ${ROTATIONS_ES[r].follows}`,
        })),
      },
    ],
    sampleSequences: [
      { label: 'Sexy Move', alg: "R U R' U'" },
      { label: 'Sledgehammer', alg: "R' F R F'" },
      { label: 'Ciclo con capa M (Roux)', alg: "M' U M U2 M' U M" },
      { label: 'OLL 45 (F R U R\' U\' F\')', alg: "F R U R' U' F'" },
    ],
  },

  '4x4': {
    id: '4x4',
    puzzleId: '4x4x4',
    name: '4x4',
    title: 'Notación de 4x4 (Rubik’s Revenge)',
    intro:
      'En el 4x4 no existe una capa central impar: hay 2 capas externas y 2 capas internas por eje. Los giros anchos WCA se escriben con "w" (Rw, Uw...) y mueven 2 capas juntas; los giros de una sola capa interna llevan el prefijo "2" (2R, 2U...).',
    clockwiseRule:
      'Tanto Rw como 2R siguen exactamente el sentido horario de la cara R mirando la derecha de frente. Lo mismo aplica a L/Lw/2L, U/Uw/2U, etc.',
    groups: [
      {
        id: 'basic',
        title: 'Caras exteriores (1 capa)',
        subtitle: 'Mueven únicamente la capa más externa.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira solo la primera capa exterior de ${f}.`,
        })),
      },
      {
        id: 'wide',
        title: 'Giros anchos de 2 capas (Rw, Lw, Uw, Dw, Fw, Bw)',
        subtitle: 'Mueven las 2 capas de ese lado juntas (también escritos en minúscula r, l, u, d, f, b).',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `${f}w`,
          alias: f.toLowerCase(),
          variants: ['', "'", '2'],
          label: `${f}w (o ${f.toLowerCase()}) · 2 capas de ${f}`,
          meaning: `Gira conjuntamente la capa exterior ${f} y la segunda capa interna 2${f}.`,
        })),
      },
      {
        id: 'inner',
        title: 'Capas internas solas (2R, 2L, 2U, 2D, 2F, 2B)',
        subtitle: 'Mueven únicamente la segunda capa contando desde afuera, sin tocar las esquinas.',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `2${f}`,
          variants: ['', "'", '2'],
          label: `2${f} · Capa interna de ${f}`,
          meaning: `Gira únicamente la segunda capa desde ${f} en el mismo sentido que ${f}.`,
        })),
      },
      {
        id: 'rotations',
        title: 'Rotaciones del cubo completo (x, y, z)',
        subtitle: 'Rotan las 4 capas juntas en el eje indicado.',
        moves: ['x', 'y', 'z'].map((r) => ({
          base: r,
          variants: ['', "'", '2'],
          label: ROTATIONS_ES[r].name,
          meaning: ROTATIONS_ES[r].rule,
          follows: `Sigue a ${ROTATIONS_ES[r].follows}`,
        })),
      },
    ],
    sampleSequences: [
      { label: 'Emparejar aristas (Uw\' R U R\' F R\' F\' R Uw)', alg: "Uw' R U R' F R' F' R Uw" },
      { label: 'Paridad de PLL', alg: '2R2 U2 2R2 Uw2 2R2 Uw2' },
      { label: 'Paridad de OLL', alg: "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'" },
    ],
  },

  '5x5': {
    id: '5x5',
    puzzleId: '5x5x5',
    name: '5x5',
    title: 'Notación de 5x5 (Professor’s Cube)',
    intro:
      'El 5x5 agrega un tercer nivel de profundidad: además de las capas exteriores (R) y los giros anchos de 2 capas (Rw), incorpora giros anchos de 3 capas (3Rw) y giros de una sola capa interna (2R para la segunda, 3R para la capa central).',
    clockwiseRule:
      'El número antes de la letra indica cuántas capas abarca (si termina en "w", como 3Rw) o cuál capa individual se mueve (si no lleva "w", como 2R o 3R).',
    groups: [
      {
        id: 'basic',
        title: 'Caras exteriores (U, D, R, L, F, B)',
        subtitle: 'Mueven solo la capa exterior (usados en la etapa 3x3 final).',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira la primera capa exterior de ${f}.`,
        })),
      },
      {
        id: 'wide2',
        title: 'Anchos de 2 capas (Rw, Lw, Uw, Dw, Fw, Bw)',
        subtitle: 'Mueven las 2 capas exteriores de ese lado juntas.',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `${f}w`,
          variants: ['', "'", '2'],
          label: `${f}w · 2 capas de ${f}`,
          meaning: `Gira las capas 1 y 2 desde la cara ${f}.`,
        })),
      },
      {
        id: 'wide3',
        title: 'Anchos de 3 capas (3Rw, 3Lw, 3Uw, 3Dw, 3Fw, 3Bw)',
        subtitle: 'Mueven las 3 capas desde ese lado (incluyendo la capa central).',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `3${f}w`,
          variants: ['', "'", '2'],
          label: `3${f}w · 3 capas de ${f}`,
          meaning: `Gira las 3 primeras capas contando desde ${f}.`,
        })),
      },
      {
        id: 'inner',
        title: 'Capas internas individuales (2R, 3R, 2U, 2L...)',
        subtitle: '2R mueve la segunda capa (alas); 3R mueve la tercera capa central.',
        moves: ['2R', '2L', '2U', '2D', '2F', '2B', '3R', '3U'].map((m) => {
          const depth = m[0];
          const face = m[1];
          return {
            base: m,
            variants: ['', "'", '2'],
            label: `${m} · Capa ${depth} de ${face}`,
            meaning:
              depth === '2'
                ? `Gira solo la 2.ª capa interna desde ${face} (mueve las alas).`
                : `Gira solo la 3.ª capa (central) siguiendo el sentido de ${face}.`,
          };
        }),
      },
      {
        id: 'rotations',
        title: 'Rotaciones (x, y, z)',
        subtitle: 'Rotan todo el cubo 5x5.',
        moves: ['x', 'y', 'z'].map((r) => ({
          base: r,
          variants: ['', "'", '2'],
          label: ROTATIONS_ES[r].name,
          meaning: ROTATIONS_ES[r].rule,
          follows: `Sigue a ${ROTATIONS_ES[r].follows}`,
        })),
      },
    ],
    sampleSequences: [
      { label: 'Flip de arista', alg: "R U R' F R' F' R" },
      { label: 'Conmutador de centros (Niklas)', alg: "2R U' 2L' U 2R' U' 2L U" },
      { label: 'Paridad de alas 5x5', alg: "2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2" },
    ],
  },

  '7x7': {
    id: '7x7',
    puzzleId: '7x7x7',
    name: '7x7',
    title: 'Notación de 7x7',
    intro:
      'En el 7x7 las mezclas oficiales WCA usan giros de 1 capa (R), 2 capas (Rw) y 3 capas (3Rw). Para algoritmos de centros y paridades de aristas también se usan las capas internas individuales 2R (alas externas), 3R (alas internas) y 4R (capa central).',
    clockwiseRule:
      'Contamos las capas desde afuera hacia adentro (1 a 4): Rw abarca 2 capas, 3Rw abarca 3 capas; sin la letra "w" (2R, 3R, 4R) se mueve únicamente esa tajada interna.',
    groups: [
      {
        id: 'basic',
        title: 'Caras exteriores (U, D, R, L, F, B)',
        subtitle: 'Mueven la primera capa exterior.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira la capa 1 exterior de ${f}.`,
        })),
      },
      {
        id: 'wide2',
        title: 'Anchos de 2 capas (Rw, Lw, Uw, Dw, Fw, Bw)',
        subtitle: 'Mueven las capas 1 y 2 juntas.',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `${f}w`,
          variants: ['', "'", '2'],
          label: `${f}w · 2 capas de ${f}`,
          meaning: `Gira las 2 capas más externas de ${f}.`,
        })),
      },
      {
        id: 'wide3',
        title: 'Anchos de 3 capas (3Rw, 3Lw, 3Uw, 3Dw, 3Fw, 3Bw)',
        subtitle: 'Mueven las capas 1, 2 y 3 juntas.',
        moves: ['R', 'L', 'U', 'D', 'F', 'B'].map((f) => ({
          base: `3${f}w`,
          variants: ['', "'", '2'],
          label: `3${f}w · 3 capas de ${f}`,
          meaning: `Gira las 3 capas externas de ${f}.`,
        })),
      },
      {
        id: 'inner',
        title: 'Capas internas individuales (2R, 3R, 4R...)',
        subtitle: '2R mueve alas externas, 3R mueve alas internas y 4R mueve la capa central.',
        moves: ['2R', '2L', '2U', '3R', '3L', '3U', '4R', '4U'].map((m) => {
          const depth = m[0];
          const face = m[1];
          const role =
            depth === '2' ? 'alas externas' : depth === '3' ? 'alas internas' : 'capa central (midges)';
          return {
            base: m,
            variants: ['', "'", '2'],
            label: `${m} · Capa ${depth} (${role})`,
            meaning: `Gira únicamente la ${depth}.ª capa desde ${face} (${role}).`,
          };
        }),
      },
    ],
    sampleSequences: [
      { label: 'Emparejar alas internas (3Uw)', alg: "3Uw' R U R' F R' F' R 3Uw" },
      { label: 'Conmutador puntual (Niklas 3R/2L)', alg: "3R U' 2L' U 3R' U' 2L U" },
      { label: 'Paridad de alas internas (3R)', alg: "3R2 B2 U2 3L U2 3R' U2 3R U2 F2 3R F2 3L' B2 3R2" },
    ],
  },

  pyraminx: {
    id: 'pyraminx',
    puzzleId: 'pyraminx',
    name: 'Pyraminx',
    title: 'Notación de Pyraminx',
    intro:
      'A diferencia de los cubos, la notación del Pyraminx se basa en sus 4 vértices o ejes: U (arriba), R (derecha), L (izquierda) y B (atrás). Las MAYÚSCULAS (U, R, L, B) mueven todo el bloque de la capa (punta + centro axial + 3 aristas), mientras que las minúsculas (u, r, l, b) mueven únicamente la puntita (tip).',
    clockwiseRule:
      'Cada giro es de 120° (un tercio de vuelta) mirando la punta de ese eje directamente de frente. No existen giros dobles "2" porque dos tercios de vuelta equivalen a un giro antihorario (\').',
    diagramNote:
      'Diferencia clave: U (mayúscula) gira las 2 piezas de altura superiores (afecta las 3 aristas superiores). u (minúscula) gira solo el vértice pequeño sin mover ninguna arista.',
    groups: [
      {
        id: 'layers',
        title: 'Capas completas — Mayúsculas (U, R, L, B)',
        subtitle: 'Mueven la punta, el centro axial y las 3 aristas alrededor de ese eje (120°).',
        moves: [
          {
            base: 'U',
            variants: ['', "'"],
            label: 'U · Capa superior',
            meaning: 'Gira el bloque superior de 120° mirando la punta de arriba desde arriba.',
          },
          {
            base: 'R',
            variants: ['', "'"],
            label: 'R · Capa derecha',
            meaning: 'Gira el bloque inferior derecho de 120° mirando su punta de frente.',
          },
          {
            base: 'L',
            variants: ['', "'"],
            label: 'L · Capa izquierda',
            meaning: 'Gira el bloque inferior izquierdo de 120° mirando su punta de frente.',
          },
          {
            base: 'B',
            variants: ['', "'"],
            label: 'B · Capa trasera',
            meaning: 'Gira el bloque trasero de 120° mirando la punta de atrás.',
          },
        ],
      },
      {
        id: 'tips',
        title: 'Puntas solas (Tips) — Minúsculas (u, r, l, b)',
        subtitle: 'Mueven únicamente la esquina/punta exterior sin afectar el resto del puzzle.',
        moves: [
          {
            base: 'u',
            variants: ['', "'"],
            label: 'u · Punta superior',
            meaning: 'Gira solo la punta de arriba 120°.',
          },
          {
            base: 'r',
            variants: ['', "'"],
            label: 'r · Punta derecha',
            meaning: 'Gira solo la punta inferior derecha 120°.',
          },
          {
            base: 'l',
            variants: ['', "'"],
            label: 'l · Punta izquierda',
            meaning: 'Gira solo la punta inferior izquierda 120°.',
          },
          {
            base: 'b',
            variants: ['', "'"],
            label: 'b · Punta trasera',
            meaning: 'Gira solo la punta de atrás 120°.',
          },
        ],
      },
    ],
    sampleSequences: [
      { label: 'Sledgehammer (R\' L R L\')', alg: "R' L R L'" },
      { label: 'Ciclo horario de 3 aristas', alg: "R U' R' U' R U' R'" },
      { label: 'Volteo de 2 aristas (L4E)', alg: "R' L R L' U L' U' L" },
    ],
  },

  megaminx: {
    id: 'megaminx',
    puzzleId: 'megaminx',
    name: 'Megaminx',
    title: 'Notación de Megaminx (Dodecaedro)',
    intro:
      'El Megaminx usa dos convenciones complementarias: (1) la notación de mezcla WCA de Stefan Pochmann (R++, R--, D++, D-- seguidos de U o U\'), que mueve bloques grandes para mezclar rápido sin perder el agarre; y (2) la notación de caras individuales (U, R, F, L, BL, BR, DR, DL, D) usada en los algoritmos de resolución.',
    clockwiseRule:
      'Cada cara es un pentágono regular, por lo que un giro simple (U, R, F...) rota 72° (1/5 de vuelta) en sentido horario mirando esa cara. Un giro doble (U2, R2) rota 144° (2/5 de vuelta). En mezclas WCA, ++ gira 144° horario y -- gira 144° antihorario.',
    groups: [
      {
        id: 'wca-scramble',
        title: 'Notación de mezcla WCA (Pochmann: R++, R--, D++, D--, U, U\')',
        subtitle: 'Sujetando la esquina superior izquierda, mueve todo el hemisferio derecho o inferior 144° (2/5 de vuelta).',
        moves: [
          {
            base: 'R',
            variants: ['++', '--'],
            label: 'R++ / R-- · Hemisferio derecho (mezcla)',
            meaning: 'Gira todo el bloque derecho 2 quintos de vuelta (144°) en sentido horario (++) o antihorario (--).',
          },
          {
            base: 'D',
            variants: ['++', '--'],
            label: 'D++ / D-- · Hemisferio inferior (mezcla)',
            meaning: 'Gira todo el bloque inferior 2 quintos de vuelta (144°) en sentido horario (++) o antihorario (--).',
          },
          {
            base: 'U',
            variants: ['', "'"],
            label: 'U / U\' · Cierre de línea WCA',
            meaning: 'Gira la cara superior 72° horario (U) o antihorario (U\') al final de cada renglón de mezcla.',
          },
        ],
      },
      {
        id: 'faces',
        title: 'Caras de resolución (U, R, F, L, BL, BR, DR, DL, D, B)',
        subtitle: 'Giros de una sola cara pentagonal (72° con letra sola, 144° con 2).',
        moves: [
          { base: 'U', variants: ['', "'", '2', "2'"], label: 'U · Cara superior', meaning: 'Gira la cara superior 72° (o 144° con 2).' },
          { base: 'R', variants: ['', "'", '2', "2'"], label: 'R · Cara frontal-derecha', meaning: 'Gira la cara derecha superior 72°.' },
          { base: 'F', variants: ['', "'", '2', "2'"], label: 'F · Cara frontal', meaning: 'Gira la cara frontal superior 72°.' },
          { base: 'L', variants: ['', "'", '2', "2'"], label: 'L · Cara frontal-izquierda', meaning: 'Gira la cara izquierda superior 72°.' },
          { base: 'BL', variants: ['', "'", '2', "2'"], label: 'BL · Cara trasera-izquierda', meaning: 'Gira la cara superior trasera izquierda 72°.' },
          { base: 'BR', variants: ['', "'", '2', "2'"], label: 'BR · Cara trasera-derecha', meaning: 'Gira la cara superior trasera derecha 72°.' },
          { base: 'DR', variants: ['', "'", '2', "2'"], label: 'DR · Cara inferior-derecha', meaning: 'Gira la cara inferior derecha 72°.' },
          { base: 'DL', variants: ['', "'", '2', "2'"], label: 'DL · Cara inferior-izquierda', meaning: 'Gira la cara inferior izquierda 72°.' },
          { base: 'D', variants: ['', "'", '2', "2'"], label: 'D · Cara base inferior', meaning: 'Gira la cara de la base 72°.' },
        ],
      },
    ],
    sampleSequences: [
      { label: 'Orientar aristas (F R U R\' U\' F\')', alg: "F R U R' U' F'" },
      { label: 'Sune de Megaminx', alg: "R U R' U R U2' R'" },
      { label: 'Muestra de mezcla WCA', alg: "R++ D-- R-- D++ U'" },
    ],
  },

  mirror: {
    id: 'mirror',
    puzzleId: 'mirror',
    name: 'Mirror',
    title: 'Notación de Mirror Cube 3x3 (Mirror Blocks)',
    intro:
      'El Mirror Cube tiene el mismo mecanismo interno que el 3x3 clásico: 6 caras, las mismas capas y giros (U, D, R, L, F, B, capas medias M/E/S y rotaciones x/y/z). Todos los algoritmos del 3x3 funcionan igual. La única diferencia es que todas las piezas son del mismo color (plateado o dorado) y las capas tienen distintos grosores en cada eje, reconociéndose por tamaño y relieve.',
    clockwiseRule:
      'El sentido horario es exactamente el mismo que en el 3x3: mirando directamente de frente a la cara que vas a girar, rotás según las agujas del reloj.',
    groups: [
      {
        id: 'basic',
        title: 'Caras exteriores (U, D, R, L, F, B)',
        subtitle: 'Giros de 90° o 180° de cada cara del cubo.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: f,
          variants: ['', "'", '2'],
          label: FACE_NAMES_ES[f].name,
          meaning: `Gira la ${FACE_NAMES_ES[f].short} mirando ${f} de frente.`,
        })),
      },
      {
        id: 'wide',
        title: 'Giros dobles / anchos (Uw/u, Dw/d, Rw/r, Lw/l, Fw/f, Bw/b)',
        subtitle: 'Mueven la capa exterior junto con la capa central adyacente.',
        moves: ['U', 'D', 'R', 'L', 'F', 'B'].map((f) => ({
          base: `${f}w`,
          alias: f.toLowerCase(),
          variants: ['', "'", '2'],
          label: `${f}w / ${f.toLowerCase()} · Doble ${FACE_NAMES_ES[f].short}`,
          meaning: `Gira la ${FACE_NAMES_ES[f].short} más la capa central contigua.`,
        })),
      },
      {
        id: 'slices',
        title: 'Capas medias (M, E, S)',
        subtitle: 'Capas centrales que siguen el sentido de su cara de referencia.',
        moves: ['M', 'E', 'S'].map((s) => ({
          base: s,
          variants: ['', "'", '2'],
          label: SLICE_FOLLOWS_ES[s].name,
          meaning: SLICE_FOLLOWS_ES[s].rule,
          follows: `Sigue a ${SLICE_FOLLOWS_ES[s].follows}`,
        })),
      },
      {
        id: 'rotations',
        title: 'Rotaciones del cubo completo (x, y, z)',
        subtitle: 'Rotan el cubo sobre sus ejes para cambiar la orientación de trabajo.',
        moves: ['x', 'y', 'z'].map((r) => ({
          base: r,
          variants: ['', "'", '2'],
          label: ROTATIONS_ES[r].name,
          meaning: ROTATIONS_ES[r].rule,
          follows: `Sigue a ${ROTATIONS_ES[r].follows}`,
        })),
      },
    ],
    sampleSequences: [
      { label: 'Sexy Move', alg: "R U R' U'" },
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'Permutación T', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
      { label: 'Sexy move x6 (vuelve a resuelto)', alg: "R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'" },
    ],
  },
};

/**
 * Separa una cadena de movimientos en tokens individuales, ignorando paréntesis de agrupación.
 */
export function tokenizeSequence(raw = '') {
  if (!raw || typeof raw !== 'string') return [];
  const cleaned = raw
    .replace(/[()[\]]/g, ' ')
    .replace(/,/g, ' ')
    .replace(/’|‘|`/g, "'")
    .trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/).filter(Boolean);
}

/**
 * Valida si un token individual es válido para el puzzle indicado.
 * Si no es válido, devuelve un mensaje explicativo en español.
 */
export function validateMoveToken(puzzleKey, rawToken) {
  const key = normalizePuzzleKey(puzzleKey);
  const token = String(rawToken || '').trim().replace(/’|‘|`/g, "'");
  if (!token) {
    return { valid: false, token, reason: 'El movimiento está vacío.' };
  }

  // Megaminx
  if (key === 'megaminx') {
    if (/^[RD](\+\+|--)$/.test(token)) {
      return { valid: true, token, canonical: token };
    }
    if (/^[ULFB](\+\+|--)$/.test(token)) {
      return {
        valid: false,
        token,
        reason: `En la mezcla WCA de Megaminx solo R y D llevan ++ o -- ("${token}" no es válido; usá R++, R--, D++ o D--).`,
      };
    }
    if (/^(U|R|F|L|B|D|BL|BR|DL|DR)(2'?|')?$/.test(token)) {
      return { valid: true, token, canonical: token };
    }
    return {
      valid: false,
      token,
      reason: `"${token}" no es un movimiento válido de Megaminx. Usá caras (U, R, F, L, BL, BR, DR, DL, D) con ', 2 o 2', o giros WCA (R++, R--, D++, D--).`,
    };
  }

  // Pyraminx
  if (key === 'pyraminx') {
    if (/^[URLBurlb]2'?$/.test(token)) {
      const base = token[0];
      const inv = `${base}'`;
      return {
        valid: false,
        token,
        reason: `En Pyraminx los giros son de 120° y no se usa "2" ("${token}" equivale a "${inv}").`,
      };
    }
    if (/^[DFdf]['2]?$/.test(token)) {
      return {
        valid: false,
        token,
        reason: `Pyraminx no tiene eje "${token[0]}". Sus 4 ejes son U (arriba), R (derecha), L (izquierda) y B (atrás), o en minúscula para las puntas.`,
      };
    }
    if (/^[URLBurlb]'?$/.test(token)) {
      return { valid: true, token, canonical: token };
    }
    return {
      valid: false,
      token,
      reason: `"${token}" no es válido en Pyraminx. Usá U, R, L, B (capas) o u, r, l, b (puntas) con o sin apóstrofe (').`,
    };
  }

  // Cubos NxN (2x2, 3x3, 4x4, 5x5, 7x7)
  if (/^[RD](\+\+|--)$/.test(token)) {
    return {
      valid: false,
      token,
      reason: `"${token}" es notación de mezcla de Megaminx, no de un cubo ${key}.`,
    };
  }

  // Rotaciones x, y, z
  if (/^[xyz](2'?|')?$/.test(token)) {
    return { valid: true, token, canonical: token.replace("2'", '2') };
  }

  // Capas medias M, E, S
  if (/^[MES](2'?|')?$/.test(token)) {
    if (key === '2x2') {
      return {
        valid: false,
        token,
        reason: `El movimiento "${token}" no existe en 2x2 porque no tiene capa central.`,
      };
    }
    if (key === '4x4') {
      return {
        valid: false,
        token,
        reason: `En 4x4 no hay una única capa central para "${token}". Usá capas internas como 2R, 2L, 2U o giros anchos Rw, Uw.`,
      };
    }
    return { valid: true, token, canonical: token.replace("2'", '2') };
  }

  // Giros básicos U, D, R, L, F, B
  if (/^[UDRLFB](2'?|')?$/.test(token)) {
    return { valid: true, token, canonical: token.replace("2'", '2') };
  }

  // Giros en minúscula u, d, r, l, f, b (equivalentes a 2 capas anchos Uw, Rw...)
  if (/^[udrlfb](2'?|')?$/.test(token)) {
    if (key === '2x2') {
      return {
        valid: false,
        token,
        reason: `En 2x2 no se usan giros anchos de 2 capas ("${token}"); usá la letra mayúscula ${token[0].toUpperCase()} o una rotación x, y, z.`,
      };
    }
    const face = token[0].toUpperCase();
    const suffix = token.slice(1).replace("2'", '2');
    return { valid: true, token, canonical: `${face}w${suffix}` };
  }

  // Giros anchos con w: Rw, 2Rw, 3Rw
  const wideMatch = token.match(/^(\d+)?([UDRLFB])w(2'?|')?$/);
  if (wideMatch) {
    const depth = wideMatch[1] ? Number(wideMatch[1]) : 2;
    const face = wideMatch[2];
    const suffix = (wideMatch[3] || '').replace("2'", '2');
    if (key === '2x2') {
      return {
        valid: false,
        token,
        reason: `El cubo 2x2 no admite giros anchos ("${token}"). Usá ${face}${suffix}.`,
      };
    }
    const maxWide = key === '3x3' || key === '4x4' || key === 'mirror' ? 2 : 3;
    if (depth < 2 || depth > maxWide) {
      return {
        valid: false,
        token,
        reason: `El giro ancho "${token}" (${depth} capas) no es válido en ${key} (máximo ${maxWide} capas anchas).`,
      };
    }
    const prefix = depth === 2 ? '' : String(depth);
    return { valid: true, token, canonical: `${prefix}${face}w${suffix}` };
  }

  // Capas internas numeradas: 2R, 3R, 4R
  const innerMatch = token.match(/^(\d+)([UDRLFB])(2'?|')?$/);
  if (innerMatch) {
    const depth = Number(innerMatch[1]);
    const face = innerMatch[2];
    const suffix = (innerMatch[3] || '').replace("2'", '2');
    if (key === '2x2' || key === '3x3' || key === 'mirror') {
      return {
        valid: false,
        token,
        reason: `El giro interno "${token}" requiere un cubo de 4x4 o más (en 3x3 y Mirror usá M, E o S).`,
      };
    }
    const maxInner = key === '4x4' ? 2 : key === '5x5' ? 3 : 4;
    if (depth < 2 || depth > maxInner) {
      return {
        valid: false,
        token,
        reason: `La capa interna "${token}" no existe en ${key} (se permiten capas de 2 a ${maxInner}).`,
      };
    }
    return { valid: true, token, canonical: `${depth}${face}${suffix}` };
  }

  return {
    valid: false,
    token,
    reason: `No se reconoce el movimiento "${token}" para ${key}. Revisá las letras permitidas (U, D, R, L, F, B) y sus modificadores (', 2).`,
  };
}

/**
 * Invierte un token individual válido.
 */
export function invertToken(rawToken) {
  const token = String(rawToken || '').trim().replace(/’|‘|`/g, "'");
  if (!token) return '';
  if (token.endsWith('++')) return `${token.slice(0, -2)}--`;
  if (token.endsWith('--')) return `${token.slice(0, -2)}++`;
  if (token.endsWith("2'")) return token.slice(0, -1);
  if (token.endsWith('2')) return token;
  if (token.endsWith("'")) return token.slice(0, -1);
  return `${token}'`;
}

/**
 * Describe un movimiento individual en español y devuelve su enlace a #/notacion.
 */
export function describeMove(puzzleKey, rawToken) {
  const key = normalizePuzzleKey(puzzleKey);
  const token = String(rawToken || '').trim().replace(/’|‘|`/g, "'");
  const notationUrl = `#/notacion?puzzle=${encodeURIComponent(key)}&move=${encodeURIComponent(token)}`;

  if (key === 'megaminx' && /^[RD](\+\+|--)$/.test(token)) {
    const hemi = token[0] === 'R' ? 'derecho' : 'inferior';
    const dir = token.endsWith('++') ? '144° (2/5) en sentido horario' : '144° (2/5) en sentido antihorario';
    return {
      token,
      base: token[0],
      modifier: token.slice(1),
      title: `${token} · Hemisferio ${hemi}`,
      description: `Gira el bloque ${hemi} del Megaminx ${dir}.`,
      notationUrl,
    };
  }

  if (key === 'pyraminx' && /^[URLBurlb]'?$/.test(token)) {
    const isTip = token[0] === token[0].toLowerCase();
    const axisMap = {
      U: 'superior (arriba)',
      R: 'derecho',
      L: 'izquierdo',
      B: 'trasero (atrás)',
    };
    const axis = axisMap[token[0].toUpperCase()];
    const dir = token.endsWith("'") ? '120° en sentido antihorario' : '120° en sentido horario';
    return {
      token,
      base: token[0],
      modifier: token.slice(1),
      title: `${token} · ${isTip ? 'Punta' : 'Capa'} ${axis}`,
      description: `Gira ${isTip ? 'solo la punta' : 'la capa completa'} del eje ${axis} ${dir}.`,
      notationUrl,
    };
  }

  // Modificador de ángulo
  let modifier = '';
  let core = token;
  if (token.endsWith("2'")) {
    modifier = "2'";
    core = token.slice(0, -2);
  } else if (token.endsWith('2')) {
    modifier = '2';
    core = token.slice(0, -1);
  } else if (token.endsWith("'")) {
    modifier = "'";
    core = token.slice(0, -1);
  }

  const deg90 = key === 'megaminx' ? '72°' : '90°';
  const deg180 = key === 'megaminx' ? '144°' : '180°';
  const dirText =
    modifier === '2'
      ? `${deg180} (media vuelta)`
      : modifier === "2'"
        ? `${deg180} en sentido antihorario`
        : modifier === "'"
          ? `${deg90} en sentido antihorario`
          : `${deg90} en sentido horario`;

  if (ROTATIONS_ES[core]) {
    return {
      token,
      base: core,
      modifier,
      title: `${token} · ${ROTATIONS_ES[core].name}`,
      description: `${ROTATIONS_ES[core].rule} (${dirText}).`,
      notationUrl,
    };
  }

  if (SLICE_FOLLOWS_ES[core]) {
    return {
      token,
      base: core,
      modifier,
      title: `${token} · ${SLICE_FOLLOWS_ES[core].name}`,
      description: `Gira la capa media ${core} ${dirText} (sigue el sentido de ${SLICE_FOLLOWS_ES[core].follows}).`,
      notationUrl,
    };
  }

  if (/^[udrlfb]$/.test(core)) {
    const f = core.toUpperCase();
    return {
      token,
      base: `${f}w`,
      modifier,
      title: `${token} · Giro doble de ${FACE_NAMES_ES[f].name}`,
      description: `Gira las 2 capas de ${FACE_NAMES_ES[f].short} ${dirText}.`,
      notationUrl,
    };
  }

  const wideMatch = core.match(/^(\d+)?([UDRLFB])w$/);
  if (wideMatch) {
    const layers = wideMatch[1] ? Number(wideMatch[1]) : 2;
    const f = wideMatch[2];
    return {
      token,
      base: core,
      modifier,
      title: `${token} · Giro ancho (${layers} capas de ${f})`,
      description: `Gira las ${layers} capas externas de ${FACE_NAMES_ES[f].short} ${dirText}.`,
      notationUrl,
    };
  }

  const innerMatch = core.match(/^(\d+)([UDRLFB])$/);
  if (innerMatch) {
    const layer = Number(innerMatch[1]);
    const f = innerMatch[2];
    return {
      token,
      base: core,
      modifier,
      title: `${token} · ${layer}.ª capa interna de ${f}`,
      description: `Gira únicamente la ${layer}.ª capa contando desde ${FACE_NAMES_ES[f].short} ${dirText}.`,
      notationUrl,
    };
  }

  if (FACE_NAMES_ES[core]) {
    return {
      token,
      base: core,
      modifier,
      title: `${token} · ${FACE_NAMES_ES[core].name}`,
      description: `Gira la ${FACE_NAMES_ES[core].short} ${dirText} mirando ${core} de frente.`,
      notationUrl,
    };
  }

  return {
    token,
    base: core,
    modifier,
    title: `${token} · Cara ${core}`,
    description: `Gira la cara ${core} ${dirText}.`,
    notationUrl,
  };
}

/**
 * Parsea y valida una secuencia completa para un puzzle.
 */
export function parseNotationSequence(puzzleKey, input = '') {
  const key = normalizePuzzleKey(puzzleKey);
  const rawTokens = tokenizeSequence(input);
  if (!rawTokens.length) {
    return {
      valid: false,
      empty: true,
      puzzle: key,
      tokens: [],
      canonicalTokens: [],
      normalizedAlg: '',
      inverseAlg: '',
      errors: ['Escribí al menos un movimiento para probar la secuencia.'],
      descriptions: [],
    };
  }

  const errors = [];
  const canonicalTokens = [];
  const descriptions = [];

  for (const t of rawTokens) {
    const res = validateMoveToken(key, t);
    if (!res.valid) {
      errors.push(res.reason);
    } else {
      canonicalTokens.push(res.canonical);
      descriptions.push(describeMove(key, t));
    }
  }

  const valid = errors.length === 0;
  const normalizedAlg = valid ? canonicalTokens.join(' ') : '';
  const inverseAlg = valid
    ? [...canonicalTokens]
        .reverse()
        .map((t) => invertToken(t))
        .join(' ')
    : '';

  return {
    valid,
    empty: false,
    puzzle: key,
    tokens: rawTokens,
    canonicalTokens,
    normalizedAlg,
    inverseAlg,
    errors,
    descriptions,
  };
}

/**
 * Invierte una secuencia completa validándola para el puzzle dado.
 */
export function invertSequence(puzzleKey, input = '') {
  const parsed = parseNotationSequence(puzzleKey, input);
  if (!parsed.valid) return null;
  return parsed.inverseAlg;
}
