// Mini gráfica de la evolución de los tiempos. Pura: devuelve los trazos SVG.
import { effectiveTime, DNF } from './stats.js';

// Últimos n tiempos válidos (sin DNF), del más viejo al más nuevo.
export function recentTimes(solves, n = 20) {
  return solves
    .map(effectiveTime)
    .filter((t) => t !== DNF)
    .slice(-n);
}

// values → { line, area, best } en un rectángulo de width × height (y crece hacia abajo,
// así que los tiempos más rápidos quedan arriba). best: índice del más rápido.
export function sparkline(values, width, height, pad = 4) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i) => pad + (i * (width - 2 * pad)) / (values.length - 1);
  const y = (v) => pad + ((v - min) / span) * (height - 2 * pad);
  const pts = values.map((v, i) => [x(i), y(v)].map((n) => Number(n.toFixed(1))));
  const line = `M${pts.map((p) => p.join(' ')).join(' L')}`;
  const area = `${line} L${pts.at(-1)[0]} ${height} L${pts[0][0]} ${height} Z`;
  return { line, area, points: pts, best: values.indexOf(min), min, max };
}
