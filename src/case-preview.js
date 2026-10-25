// Generador liviano de miniaturas 2D en SVG para tarjetas de casos y portadas de puzzles.
// Evita crear múltiples contextos WebGL (<twisty-player>) por página:
// - Para casos de última capa (OLL, PLL, CMLL, CLL, Ortega OLL, etc.) dibuja la vista 2D-LL
//   (cara superior + tiras laterales de la última capa).
// - Para el resto de las etapas (Cruz, F2L, Principiante, Bloques Roux, LSE, 2x2, 4x4, 5x5, 7x7)
//   dibuja el cubo isométrico 2D con el stickering correspondiente aplicado al estado previo al algoritmo.
import { cubeSvg } from './cube-art.js';

const COLORS = {
  U: '#ffd500', // Amarillo arriba (con DISPLAY_SETUP = z2)
  D: '#f2f2f2', // Blanco abajo
  F: '#2ec27e', // Verde al frente
  B: '#3d8bff', // Azul atrás
  R: '#ff8a00', // Naranja a la derecha (tras z2)
  L: '#ff4d5e', // Rojo a la izquierda (tras z2)
};

const DIM_COLORS = {
  U: '#7a6810',
  D: '#7c828f',
  F: '#1b5e41',
  B: '#214985',
  R: '#7d490a',
  L: '#7d2933',
};

const GREY = '#323948';

// Etapas que se ven mejor con el diagrama superior 2D-LL (cara U + bordes F/R/B/L).
const LL_STICKERINGS = new Set([
  'oll',
  'eoll',
  'pll',
  'yellow-cross',
  'yellow-face',
  'll-corners',
  'll-edges',
  'cmll',
  '2x2-ll-orient',
  '2x2-ll-perm',
  '2x2-oll',
  '2x2-cll',
  '4x4-oll-parity',
  '4x4-pll-parity',
  '5x5-edge-parity',
]);

function puzzleDimension(puzzle) {
  if (puzzle === '2x2x2' || puzzle === '2x2') return 2;
  if (puzzle === '4x4x4' || puzzle === '4x4') return 4;
  if (puzzle === '5x5x5' || puzzle === '5x5') return 5;
  if (puzzle === '7x7x7' || puzzle === '7x7') return 7;
  return 3;
}

// Determina qué color mostrar en cada sticker según el stickering de la etapa.
function resolveStickerColor(s, stickering, n) {
  const topCoord = n - 1;
  const botCoord = -(n - 1);
  const { x0, y0, z0, face0 } = s;
  const isTopPiece = y0 === topCoord;
  const isBotPiece = y0 === botCoord;
  const isMidPiece = y0 > botCoord && y0 < topCoord;
  const extremalCount =
    (Math.abs(x0) === topCoord ? 1 : 0) +
    (Math.abs(y0) === topCoord ? 1 : 0) +
    (Math.abs(z0) === topCoord ? 1 : 0);
  const isCorner = extremalCount === 3;
  const isEdge = extremalCount === 2;
  const isCenter = extremalCount === 1;

  const full = COLORS[face0];
  const dim = DIM_COLORS[face0];
  const isYellow = face0 === 'U';
  const isWhiteOrYellow = face0 === 'U' || face0 === 'D';

  switch (stickering) {
    case 'cross':
      if (isCenter) return dim;
      if (isBotPiece && isEdge) return full;
      return GREY;

    case 'first-layer':
      if (isCenter) return dim;
      if (isBotPiece && isEdge) return dim;
      if (isBotPiece && isCorner) return full;
      return GREY;

    case 'second-layer':
      if (isCenter && y0 <= 0) return dim;
      if (isBotPiece) return dim;
      if (isMidPiece && isEdge) return full;
      return GREY;

    case 'f2l': {
      if (isCenter && y0 <= 0) return dim;
      const isFrontRightSlot = x0 === topCoord && z0 === topCoord && y0 <= 0;
      if (isFrontRightSlot) return full;
      if (y0 <= 0) return dim;
      return GREY;
    }

    case 'eoll':
    case 'yellow-cross':
      if (!isTopPiece) return dim;
      if (isCenter) return full;
      if (isEdge) return isYellow ? full : GREY;
      return GREY;

    case 'oll':
    case 'yellow-face':
    case '2x2-ll-orient':
      if (!isTopPiece) return dim;
      return isYellow ? full : GREY;

    case '2x2-oll':
      return isYellow || face0 === 'D' ? full : GREY;

    case 'll-corners':
      if (!isTopPiece) return dim;
      if (isCorner) return full;
      return isYellow ? dim : GREY;

    case 'll-edges':
    case 'pll':
    case '2x2-ll-perm':
    case '2x2-cll':
      if (!isTopPiece) return dim;
      return full;

    case 'cmll':
      if (isTopPiece && isCorner) return full;
      if (!isTopPiece && Math.abs(x0) === topCoord) return dim;
      return GREY;

    case 'roux-fb':
      // Bloque izquierdo (x0 === -topCoord, y0 <= 0)
      if (x0 === -topCoord && y0 <= 0) return full;
      return GREY;

    case 'roux-sb':
      if (x0 === -topCoord && y0 <= 0) return dim;
      if (x0 === topCoord && y0 <= 0) return full;
      return GREY;

    case 'lse-eo':
      if (Math.abs(x0) === topCoord && (!isTopPiece || isCorner)) return dim;
      if (isEdge) return isWhiteOrYellow ? COLORS.U : GREY;
      if (isCenter) return dim;
      return dim;

    case 'lse-ulur':
    case 'lse-l4e':
      if (Math.abs(x0) === topCoord && !isTopPiece) return dim;
      if (isTopPiece && isCorner) return dim;
      return full;

    case '2x2-first-layer':
      return isBotPiece ? full : GREY;

    case '2x2-first-face':
      return isBotPiece && face0 === 'D' ? full : GREY;

    case '2x2-pbl':
      return full;

    case '4x4-centers':
      return isCenter ? full : GREY;

    case '4x4-edges':
      if (isCenter) return dim;
      if (isEdge) return full;
      return GREY;

    case '4x4-oll-parity':
      if (!isTopPiece) return dim;
      return isYellow ? full : GREY;

    case '4x4-pll-parity':
      if (!isTopPiece) return dim;
      return full;

    case 'yau-centers2':
      return isCenter && isWhiteOrYellow ? full : GREY;

    case 'yau-cross':
      if (isCenter && isWhiteOrYellow) return dim;
      if (isBotPiece && isEdge) return full;
      return GREY;

    case 'yau-centers4':
      if (isCenter) return isWhiteOrYellow ? dim : full;
      if (isBotPiece && isEdge) return dim;
      return GREY;

    case 'yau-edges':
      if (isCenter || (isBotPiece && isEdge)) return dim;
      if (isEdge) return full;
      return GREY;

    default:
      return full;
  }
}

// Crea todos los stickers del cubo n×n×n en el estado resuelto (con z2 aplicado).
function createSolvedStickers(n) {
  const coords = Array.from({ length: n }, (_, i) => 2 * i - (n - 1));
  const bound = n;
  const stickers = [];

  const addSticker = (x, y, z, nx, ny, nz, face0) => {
    const clamp = (v) => Math.max(-(n - 1), Math.min(n - 1, v));
    stickers.push({
      x,
      y,
      z,
      nx,
      ny,
      nz,
      x0: clamp(x),
      y0: clamp(y),
      z0: clamp(z),
      face0,
    });
  };

  for (const a of coords) {
    for (const b of coords) {
      addSticker(a, bound, b, 0, 1, 0, 'U');
      addSticker(a, -bound, b, 0, -1, 0, 'D');
      addSticker(a, b, bound, 0, 0, 1, 'F');
      addSticker(a, b, -bound, 0, 0, -1, 'B');
      addSticker(bound, a, b, 1, 0, 0, 'R');
      addSticker(-bound, a, b, -1, 0, 0, 'L');
    }
  }
  return stickers;
}

// Rota 90° horario mirando hacia la cara positiva del eje (dir = +1 para R, U, F; dir = -1 para L, D, B).
function rotateSticker90(s, axis, dir) {
  if (axis === 'x') {
    // R (+1): (y, z) -> (z, -y)
    const { y, z, ny, nz } = s;
    s.y = dir * z;
    s.z = -dir * y;
    s.ny = dir * nz;
    s.nz = -dir * ny;
  } else if (axis === 'y') {
    // U (+1): (x, z) -> (-z, x)
    const { x, z, nx, nz } = s;
    s.x = -dir * z;
    s.z = dir * x;
    s.nx = -dir * nz;
    s.nz = dir * nx;
  } else if (axis === 'z') {
    // F (+1): (x, y) -> (y, -x)
    const { x, y, nx, ny } = s;
    s.x = dir * y;
    s.y = -dir * x;
    s.nx = dir * ny;
    s.ny = -dir * nx;
  }
}

// Convierte un token de movimiento (ej. "R", "U'", "Rw2", "2R'", "M'") en { axis, dir, turns, filter }.
function parseMoveToken(token, n) {
  const m = token.match(/^(\d+)?([RLUDFB]w|[RLUDFBrludfbMESxyz])(2?'?|'2?)?$/);
  if (!m) return null;
  const prefix = m[1] ? Number(m[1]) : null;
  const base = m[2];
  const mod = m[3] ?? '';
  let turns = mod.includes('2') ? 2 : 1;
  const prime = mod.includes("'");
  const top = n - 1;

  // Sentido base de cada letra sobre su eje positivo:
  const BASE_MAP = {
    R: { axis: 'x', dir: 1, sign: 1, kind: 'outer' },
    L: { axis: 'x', dir: -1, sign: -1, kind: 'outer' },
    U: { axis: 'y', dir: 1, sign: 1, kind: 'outer' },
    D: { axis: 'y', dir: -1, sign: -1, kind: 'outer' },
    F: { axis: 'z', dir: 1, sign: 1, kind: 'outer' },
    B: { axis: 'z', dir: -1, sign: -1, kind: 'outer' },
    Rw: { axis: 'x', dir: 1, sign: 1, kind: 'wide' },
    Lw: { axis: 'x', dir: -1, sign: -1, kind: 'wide' },
    Uw: { axis: 'y', dir: 1, sign: 1, kind: 'wide' },
    Dw: { axis: 'y', dir: -1, sign: -1, kind: 'wide' },
    Fw: { axis: 'z', dir: 1, sign: 1, kind: 'wide' },
    Bw: { axis: 'z', dir: -1, sign: -1, kind: 'wide' },
    r: { axis: 'x', dir: 1, sign: 1, kind: 'wide' },
    l: { axis: 'x', dir: -1, sign: -1, kind: 'wide' },
    u: { axis: 'y', dir: 1, sign: 1, kind: 'wide' },
    d: { axis: 'y', dir: -1, sign: -1, kind: 'wide' },
    f: { axis: 'z', dir: 1, sign: 1, kind: 'wide' },
    b: { axis: 'z', dir: -1, sign: -1, kind: 'wide' },
    M: { axis: 'x', dir: -1, sign: 0, kind: 'slice' },
    E: { axis: 'y', dir: -1, sign: 0, kind: 'slice' },
    S: { axis: 'z', dir: 1, sign: 0, kind: 'slice' },
    x: { axis: 'x', dir: 1, sign: 0, kind: 'all' },
    y: { axis: 'y', dir: 1, sign: 0, kind: 'all' },
    z: { axis: 'z', dir: 1, sign: 0, kind: 'all' },
  };

  const info = BASE_MAP[base];
  if (!info) return null;
  const dir = prime ? -info.dir : info.dir;
  const axis = info.axis;

  let filter;
  if (info.kind === 'all') {
    filter = () => true;
  } else if (info.kind === 'slice') {
    filter = (s) => s[axis] === 0;
  } else if (info.kind === 'wide') {
    const layers = prefix ?? 2;
    const minCoord = top - 2 * (layers - 1);
    filter = (s) => (info.sign > 0 ? s[axis] >= minCoord : s[axis] <= -minCoord);
  } else {
    // 'outer': sin número = 1ra capa; con número (ej. 2R) = solo la capa interna k.
    if (prefix && prefix >= 2) {
      const target = top - 2 * (prefix - 1);
      filter = (s) => s[axis] === info.sign * target;
    } else {
      filter = (s) => (info.sign > 0 ? s[axis] >= top : s[axis] <= -top);
    }
  }

  return { axis, dir, turns, filter };
}

function applyAlgInverse(stickers, alg, n) {
  const clean = (alg ?? '').replace(/[()]/g, ' ').trim();
  if (!clean) return;
  const tokens = clean.split(/\s+/).filter(Boolean);
  // Recorremos de atrás hacia adelante invirtiendo el sentido de giro (dir -> -dir).
  for (let i = tokens.length - 1; i >= 0; i--) {
    const parsed = parseMoveToken(tokens[i], n);
    if (!parsed) continue;
    for (const s of stickers) {
      if (parsed.filter(s)) {
        for (let t = 0; t < parsed.turns; t++) {
          rotateSticker90(s, parsed.axis, -parsed.dir);
        }
      }
    }
  }
}

// Dibuja la vista superior 2D-LL (cara U + tiras de la última capa en F, R, B, L).
function render2DLL(stickers, stickering, n) {
  const coords = Array.from({ length: n }, (_, i) => 2 * i - (n - 1));
  const idxOf = (v) => coords.indexOf(v);
  const topCoord = n - 1;

  const uGrid = Array(n * n).fill(GREY);
  const fRow = Array(n).fill(GREY);
  const bRow = Array(n).fill(GREY);
  const lRow = Array(n).fill(GREY);
  const rRow = Array(n).fill(GREY);

  for (const s of stickers) {
    const color = resolveStickerColor(s, stickering, n);
    if (s.ny === 1) {
      const r = idxOf(s.z); // z=-top (atrás) es fila 0, z=+top (frente) es fila n-1
      const c = idxOf(s.x); // x=-top (izq) es col 0, x=+top (der) es col n-1
      if (r >= 0 && c >= 0) uGrid[r * n + c] = color;
    } else if (s.y === topCoord) {
      if (s.nz === 1) {
        const c = idxOf(s.x);
        if (c >= 0) fRow[c] = color;
      } else if (s.nz === -1) {
        const c = idxOf(s.x);
        if (c >= 0) bRow[c] = color;
      } else if (s.nx === -1) {
        const r = idxOf(s.z);
        if (r >= 0) lRow[r] = color;
      } else if (s.nx === 1) {
        const r = idxOf(s.z);
        if (r >= 0) rRow[r] = color;
      }
    }
  }

  // Geometría del SVG 100×100: cara U centrada en [18..82, 18..82], tiras laterales de 9px.
  const pad = 18;
  const size = 64;
  const cell = size / n;
  const gap = Math.max(1.2, cell * 0.08);
  const strip = 8;
  const stripGap = 3;

  let rects = `<rect x="${pad - 2}" y="${pad - 2}" width="${size + 4}" height="${size + 4}" rx="5" fill="#07090c" />`;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = pad + c * cell + gap;
      const y = pad + r * cell + gap;
      const w = cell - 2 * gap;
      rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${w.toFixed(2)}" rx="2.6" fill="${uGrid[r * n + c]}" />`;
    }
  }

  // Tiras de B (arriba), F (abajo), L (izquierda), R (derecha)
  for (let i = 0; i < n; i++) {
    const pos = pad + i * cell + gap;
    const len = cell - 2 * gap;
    // B (arriba)
    rects += `<rect x="${pos.toFixed(2)}" y="${(pad - stripGap - strip).toFixed(2)}" width="${len.toFixed(2)}" height="${strip}" rx="2" fill="${bRow[i]}" stroke="#07090c" stroke-width="1" />`;
    // F (abajo)
    rects += `<rect x="${pos.toFixed(2)}" y="${(pad + size + stripGap).toFixed(2)}" width="${len.toFixed(2)}" height="${strip}" rx="2" fill="${fRow[i]}" stroke="#07090c" stroke-width="1" />`;
    // L (izquierda)
    rects += `<rect x="${(pad - stripGap - strip).toFixed(2)}" y="${pos.toFixed(2)}" width="${strip}" height="${len.toFixed(2)}" rx="2" fill="${lRow[i]}" stroke="#07090c" stroke-width="1" />`;
    // R (derecha)
    rects += `<rect x="${(pad + size + stripGap).toFixed(2)}" y="${pos.toFixed(2)}" width="${strip}" height="${len.toFixed(2)}" rx="2" fill="${rRow[i]}" stroke="#07090c" stroke-width="1" />`;
  }

  return `<svg class="case-svg case-svg-2dll" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${rects}</svg>`;
}

// Dibuja la vista isométrica 3D en SVG (caras U, F, R).
function renderIsometric(stickers, stickering, n) {
  const coords = Array.from({ length: n }, (_, i) => 2 * i - (n - 1));
  const idxOf = (v) => coords.indexOf(v);

  const topColors = Array(n * n).fill(GREY);
  const leftColors = Array(n * n).fill(GREY);
  const rightColors = Array(n * n).fill(GREY);

  for (const s of stickers) {
    const color = resolveStickerColor(s, stickering, n);
    if (s.ny === 1) {
      // En cubeSvg, la cara 'top' tiene eje 1 hacia abajo-derecha (x crece: 0..n-1)
      // y eje 2 hacia abajo-izquierda (z crece: 0..n-1).
      const r = idxOf(s.z);
      const c = idxOf(s.x);
      if (r >= 0 && c >= 0) topColors[r * n + c] = color;
    } else if (s.nz === 1) {
      // Cara frontal izquierda ('left' en cubeSvg): eje 1 = x (0..n-1), eje 2 = -y (arriba a abajo)
      const r = n - 1 - idxOf(s.y);
      const c = idxOf(s.x);
      if (r >= 0 && c >= 0) leftColors[r * n + c] = color;
    } else if (s.nx === 1) {
      // Cara lateral derecha ('right' en cubeSvg): eje 1 = -z (frente a atrás), eje 2 = -y (arriba a abajo)
      const r = n - 1 - idxOf(s.y);
      const c = n - 1 - idxOf(s.z);
      if (r >= 0 && c >= 0) rightColors[r * n + c] = color;
    }
  }

  return cubeSvg({ n, top: topColors, left: leftColors, right: rightColors, className: 'case-svg-iso' });
}

// Ilustración SVG de un Pyraminx (para portadas y tarjetas de casos de Pyraminx).
export function pyraminxSvg({ colors = ['#2ec27e', '#ff4d5e', '#ffd500', '#3d8bff'], className = '' } = {}) {
  const [cF, cR, cL, cU] = colors;
  return `<svg class="cube-art pyraminx-art ${className}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <polygon points="50,8 92,80 50,92 8,80" fill="#07090c" stroke="#1f293a" stroke-width="2" stroke-linejoin="round"/>
    <!-- Cara frontal izquierda -->
    <g fill="${cF}" stroke="#07090c" stroke-width="2.2" stroke-linejoin="round">
      <polygon points="50,12 36,36 50,40" fill="${cU}" />
      <polygon points="35,38 22,60 36,64 49,42" />
      <polygon points="50,42 37,64 50,68" />
      <polygon points="21,62 10,80 24,84 35,66" />
      <polygon points="36,66 25,84 38,88 49,70" />
      <polygon points="50,70 39,88 50,91" />
    </g>
    <!-- Cara frontal derecha (sombreada) -->
    <g fill="${cR}" stroke="#07090c" stroke-width="2.2" stroke-linejoin="round" opacity="0.88">
      <polygon points="50,12 64,36 50,40" fill="${cL}" />
      <polygon points="65,38 78,60 64,64 51,42" />
      <polygon points="50,42 63,64 50,68" />
      <polygon points="79,62 90,80 76,84 65,66" />
      <polygon points="64,66 75,84 62,88 51,70" />
      <polygon points="50,70 61,88 50,91" />
    </g>
  </svg>`;
}

// Ilustración SVG de un Megaminx (dodecaedro estilizado para portadas y tarjetas).
export function megaminxSvg({ accent = '#3d8bff', className = '' } = {}) {
  return `<svg class="cube-art megaminx-art ${className}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <polygon points="50,6 88,26 94,66 68,93 32,93 6,66 12,26" fill="#07090c" stroke="#243044" stroke-width="2" stroke-linejoin="round"/>
    <!-- Cara superior pentagonal -->
    <polygon points="50,11 81,28 70,54 30,54 19,28" fill="#ffd500" stroke="#07090c" stroke-width="2.4" stroke-linejoin="round"/>
    <polygon points="50,23 64,31 59,45 41,45 36,31" fill="#f6b40e" stroke="#07090c" stroke-width="1.6"/>
    <!-- Cara inferior izquierda -->
    <polygon points="19,30 30,55 49,66 32,90 10,65" fill="#2ec27e" stroke="#07090c" stroke-width="2.4" stroke-linejoin="round"/>
    <!-- Cara inferior derecha -->
    <polygon points="81,30 90,65 68,90 51,66 70,55" fill="${accent}" stroke="#07090c" stroke-width="2.4" stroke-linejoin="round"/>
    <!-- Cara frontal baja -->
    <polygon points="31,56 69,56 66,89 34,89" fill="#ff4d5e" stroke="#07090c" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`;
}

export function casePreviewSvg(alg, { stickering = '', puzzle = '3x3x3' } = {}) {
  if (puzzle === 'pyraminx') {
    const hash = [...(alg || 'U')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const palette = ['#ffd500', '#2ec27e', '#ff4d5e', '#3d8bff'];
    return pyraminxSvg({
      colors: [
        palette[hash % 4],
        palette[(hash + 1) % 4],
        palette[(hash + 2) % 4],
        palette[(hash + 3) % 4],
      ],
    });
  }
  if (puzzle === 'megaminx') {
    return megaminxSvg({ accent: '#74acdf' });
  }
  const n = puzzleDimension(puzzle);
  const stickers = createSolvedStickers(n);
  applyAlgInverse(stickers, alg, n);

  if (LL_STICKERINGS.has(stickering)) {
    return render2DLL(stickers, stickering, n);
  }
  return renderIsometric(stickers, stickering, n);
}
