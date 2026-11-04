// Una foto por cara. Las esquinas se marcan en sentido horario desde arriba a la izquierda.
export const COLORS = {
  white: ['Blanco', '#fff'], yellow: ['Amarillo', '#ffe300'], red: ['Rojo', '#ff3535'],
  orange: ['Naranja', '#ff8900'], green: ['Verde', '#25bd62'], blue: ['Azul', '#3388ff'],
};

export function classifyColor(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (max < 65) return '';
  if (delta / max < 0.15) return max >= 155 ? 'white' : '';
  if (delta / max < 0.32) return '';
  const hue = ((max === r ? (g - b) / delta : max === g ? 2 + (b - r) / delta : 4 + (r - g) / delta) * 60 + 360) % 360;
  if (hue >= 348 || hue <= 10) return 'red';
  if (hue >= 19 && hue <= 40) return 'orange';
  if (hue >= 48 && hue <= 73) return 'yellow';
  if (hue >= 85 && hue <= 165) return 'green';
  if (hue >= 192 && hue <= 255) return 'blue';
  return '';
}

export function sampleFace({ data, width, height }, points, size = 3) {
  if (points.length !== 4 || points.some(([x, y]) => x < 0 || y < 0 || x >= width || y >= height)) return null;
  const edges = points.map(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % 4];
    return [nx - x, ny - y];
  });
  if (edges.some(([x, y], i) => {
    const [nx, ny] = edges[(i + 1) % 4];
    return x * ny - y * nx < 144;
  })) return null;

  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;

  return Array.from({ length: size * size }, (_, index) => {
    const votes = new Map();
    for (const dy of [-0.06, 0, 0.06]) {
      for (const dx of [-0.06, 0, 0.06]) {
        const u = (index % size + 0.5) / size + dx;
        const v = (Math.floor(index / size) + 0.5) / size + dy;
        const scale = 1 + g * u + h * v;
        const x = Math.round((x0 + ((1 + g) * x1 - x0) * u + ((1 + h) * x3 - x0) * v) / scale);
        const y = Math.round((y0 + ((1 + g) * y1 - y0) * u + ((1 + h) * y3 - y0) * v) / scale);
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const offset = (y * width + x) * 4;
        const color = classifyColor(data[offset], data[offset + 1], data[offset + 2]);
        if (color) votes.set(color, (votes.get(color) ?? 0) + 1);
      }
    }
    return [...votes].find(([, count]) => count >= 7)?.[0] ?? '';
  });
}
