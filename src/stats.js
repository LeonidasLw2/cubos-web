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

// Tiempos válidos (sin DNF) con la penalización ya aplicada.
function validTimes(solves) {
  return solves.map(effectiveTime).filter((t) => t !== DNF);
}

// Redondeo a centésimas, como la WCA en los promedios.
function roundCs(ms) {
  return Math.round(ms / 10) * 10;
}

export function dnfCount(solves) {
  return solves.filter((s) => s.penalty === 'DNF').length;
}

// Mejor tiempo individual sin contar DNF; null si no hay ninguno válido.
export function bestTime(solves) {
  const times = validTimes(solves);
  return times.length ? times.reduce((a, b) => Math.min(a, b)) : null;
}

// Peor tiempo individual sin contar DNF; null si no hay ninguno válido.
export function worstTime(solves) {
  const times = validTimes(solves);
  return times.length ? times.reduce((a, b) => Math.max(a, b)) : null;
}

// Media simple de todos los tiempos válidos (los +2 suman sus 2 s, los DNF no cuentan).
export function meanTime(solves) {
  const times = validTimes(solves);
  if (!times.length) return null;
  return roundCs(times.reduce((sum, t) => sum + t, 0) / times.length);
}

// Promedio WCA de un grupo de tiempos: se descartan el mejor y el peor;
// un DNF cuenta como el peor, así que con 2+ DNF el promedio es DNF.
function trimmedAverage(times) {
  const counted = [...times].sort((a, b) => a - b).slice(1, -1);
  if (counted.includes(DNF)) return DNF;
  return roundCs(counted.reduce((sum, t) => sum + t, 0) / counted.length);
}

// Promedio de los últimos n tiempos (solves en orden cronológico); null si faltan tiempos.
export function averageOf(solves, n) {
  if (solves.length < n) return null;
  return trimmedAverage(solves.slice(-n).map(effectiveTime));
}

// Mejor promedio de n de toda la sesión: recorre cada ventana de n tiempos seguidos.
// Devuelve null si faltan tiempos y DNF si todas las ventanas son DNF.
export function bestAverageOf(solves, n) {
  if (solves.length < n) return null;
  const times = solves.map(effectiveTime);
  let best = DNF;
  for (let i = 0; i + n <= times.length; i++) {
    best = Math.min(best, trimmedAverage(times.slice(i, i + n)));
  }
  return best;
}

// Resumen para la interfaz.
export function summarize(solves) {
  return {
    count: solves.length,
    dnfCount: dnfCount(solves),
    best: bestTime(solves),
    worst: worstTime(solves),
    mean: meanTime(solves),
    ao5: averageOf(solves, 5),
    ao12: averageOf(solves, 12),
    bestAo5: bestAverageOf(solves, 5),
    bestAo12: bestAverageOf(solves, 12),
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
