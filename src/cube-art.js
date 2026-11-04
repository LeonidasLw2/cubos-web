// Cubo isométrico en SVG (para portadas, estados vacíos e indicadores). Sin DOM: devuelve texto.
// Cada cara es una grilla n×n en coordenadas 0..1, deformada con una matriz.

const C = Math.cos(Math.PI / 6); // proyección isométrica
const L = 42; // largo de la arista (viewBox de 100×100)
const TOP = [50, 8]; // vértice de arriba

// Matrices de cada cara: [eje 1, eje 2, origen]
const FACES = {
  top: [[C * L, L / 2], [-C * L, L / 2], TOP],
  left: [[C * L, L / 2], [0, L], [TOP[0] - C * L, TOP[1] + L / 2]],
  right: [[C * L, -L / 2], [0, L], [TOP[0], TOP[1] + L]],
};

function face(name, colors, n, shade, stickerless) {
  const [[ax, ay], [bx, by], [ox, oy]] = FACES[name];
  const cell = 1 / n;
  const gap = cell * (stickerless ? 0.025 : 0.09);
  const radius = cell * (stickerless ? 0.16 : 0.18);
  let stickers = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const color = Array.isArray(colors) ? colors[r * n + c] : colors;
      stickers += `<rect x="${(c * cell + gap).toFixed(4)}" y="${(r * cell + gap).toFixed(4)}" width="${(cell - 2 * gap).toFixed(4)}" height="${(cell - 2 * gap).toFixed(4)}" rx="${radius.toFixed(4)}" fill="${color}"/>`;
    }
  }
  const shadeRect = shade ? `<rect width="1" height="1" rx="0.04" fill="#000" opacity="${shade}"/>` : '';
  return `<g transform="matrix(${ax} ${ay} ${bx} ${by} ${ox} ${oy})"><rect width="1" height="1" rx="0.04" fill="${stickerless ? '#242b35' : '#07090c'}"/>${stickers}${shadeRect}</g>`;
}

// opts: { n, top, left, right } — cada color puede ser uno solo o una lista de n×n.
export function cubeSvg({ n = 3, top = '#ffd500', left = '#2ec27e', right = '#ff4d5e', className = '', stickerless = false, animateTop = false } = {}) {
  const topFace = face('top', top, n, 0, stickerless);
  return `<svg class="cube-art ${className}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${animateTop ? `<g class="solving-top">${topFace}</g>` : topFace}${face('left', left, n, 0.18, stickerless)}${face('right', right, n, 0.32, stickerless)}</svg>`;
}
