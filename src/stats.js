// Estadísticas puras: no tocan el DOM ni localStorage, solo reciben datos.
// Un tiempo ("solve") es { id, time, penalty, scramble, date }, con time en ms
// y penalty null | '+2' | 'DNF'.

export const DNF = Infinity;

// Tiempo real de un solve aplicando la penalización (DNF = Infinity).
export function effectiveTime(solve) {
  if (solve.penalty === 'DNF') return DNF;
  if (solve.penalty === '+2') return solve.time + 2000;
  return solve.time;
}

// Mejor tiempo individual; null si no hay ninguno válido.
export function bestTime(solves) {
  let best = DNF;
  for (const s of solves) best = Math.min(best, effectiveTime(s));
  return best === DNF ? null : best;
}

// Promedio WCA de los últimos n tiempos (solves en orden cronológico).
// Se descartan el mejor y el peor; un DNF cuenta como el peor.
// Devuelve null si no hay suficientes tiempos y DNF (Infinity) si hay 2+ DNF.
export function averageOf(solves, n) {
  if (solves.length < n) return null;
  const times = solves.slice(-n).map(effectiveTime).sort((a, b) => a - b);
  const counted = times.slice(1, -1);
  if (counted.includes(DNF)) return DNF;
  const mean = counted.reduce((sum, t) => sum + t, 0) / counted.length;
  return Math.round(mean / 10) * 10; // redondeo a centésimas, como la WCA
}

// Resumen para la interfaz.
export function summarize(solves) {
  return {
    count: solves.length,
    best: bestTime(solves),
    ao5: averageOf(solves, 5),
    ao12: averageOf(solves, 12),
  };
}

// Formato: 0.00 / 12.34 / 1:05.23. Los individuales se truncan a centésimas.
export function formatTime(ms) {
  if (ms === null || ms === undefined) return '-';
  if (ms === DNF) return 'DNF';
  const cs = Math.floor(ms / 10);
  const minutes = Math.floor(cs / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  const hundredths = String(cs % 100).padStart(2, '0');
  if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}.${hundredths}`;
  return `${seconds}.${hundredths}`;
}

// Texto de un solve en la lista: "12.34", "14.34+" o "DNF(12.34)".
export function formatSolve(solve) {
  if (solve.penalty === 'DNF') return `DNF(${formatTime(solve.time)})`;
  if (solve.penalty === '+2') return `${formatTime(solve.time + 2000)}+`;
  return formatTime(solve.time);
}
