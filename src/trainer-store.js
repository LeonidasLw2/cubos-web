// Datos del entrenador de casos: qué grupo se está practicando, qué casos están
// elegidos y los tiempos de cada caso. Funciones puras (sin DOM ni localStorage).
//
// Formato: { set: 'pll', selected: { pll: ['Ua', …] }, times: { pll: { Ua: [{ time, date }] } } }
// selected[set] ausente = todos los casos del grupo.

export const MAX_TIMES_PER_CASE = 100; // se guardan los últimos 100 de cada caso

const isId = (x) => typeof x === 'string' && x.length > 0 && x.length < 64;
const validTime = (t) => t && typeof t.time === 'number' && Number.isFinite(t.time) && t.time >= 0;

export const emptyTrainer = () => ({ set: null, selected: {}, times: {} });

// Asegura el formato (datos viejos, incompletos o importados). Descarta lo inválido.
export function normalizeTrainer(raw) {
  const data = emptyTrainer();
  if (!raw || typeof raw !== 'object') return data;
  if (isId(raw.set)) data.set = raw.set;
  for (const [setId, list] of Object.entries(raw.selected ?? {})) {
    if (isId(setId) && Array.isArray(list)) data.selected[setId] = list.filter(isId);
  }
  for (const [setId, cases] of Object.entries(raw.times ?? {})) {
    if (!isId(setId) || !cases || typeof cases !== 'object') continue;
    for (const [caseId, list] of Object.entries(cases)) {
      if (!isId(caseId) || !Array.isArray(list)) continue;
      const clean = list
        .filter(validTime)
        .map((t) => ({ time: t.time, date: typeof t.date === 'number' ? t.date : null }))
        .slice(-MAX_TIMES_PER_CASE);
      if (clean.length) (data.times[setId] ??= {})[caseId] = clean;
    }
  }
  return data;
}

// Agrega un tiempo a un caso (devuelve datos nuevos, no modifica los de entrada).
export function addTime(data, setId, caseId, time, date = Date.now()) {
  const list = [...(data.times[setId]?.[caseId] ?? []), { time, date }].slice(-MAX_TIMES_PER_CASE);
  return { ...data, times: { ...data.times, [setId]: { ...data.times[setId], [caseId]: list } } };
}

// Estadísticas de un caso: cantidad, mejor, media y media de los últimos 5.
export function caseStats(list = []) {
  if (!list.length) return { count: 0, best: null, mean: null, recent: null };
  const times = list.map((t) => t.time);
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return { count: times.length, best: Math.min(...times), mean: avg(times), recent: avg(times.slice(-5)) };
}

export const countTimes = (data) =>
  Object.values(data.times).reduce((n, cases) => n + Object.values(cases).reduce((m, list) => m + list.length, 0), 0);

// Junta los tiempos de un archivo importado sin duplicar (mismo tiempo y misma fecha).
// Los casos elegidos y el grupo actual no se tocan. Devuelve { merged, added, duplicates }.
export function mergeTrainer(existing, incoming) {
  let added = 0;
  let duplicates = 0;
  const times = structuredClone(existing.times);
  for (const [setId, cases] of Object.entries(incoming.times)) {
    for (const [caseId, list] of Object.entries(cases)) {
      const current = (times[setId] ??= {})[caseId] ?? [];
      const fresh = [];
      for (const t of list) {
        const same = (u) => u.time === t.time && u.date === t.date;
        if (current.some(same) || fresh.some(same)) duplicates++;
        else fresh.push(t);
      }
      added += fresh.length;
      times[setId][caseId] = [...current, ...fresh]
        .sort((a, b) => (a.date ?? -Infinity) - (b.date ?? -Infinity))
        .slice(-MAX_TIMES_PER_CASE);
    }
  }
  return { merged: { ...existing, times }, added, duplicates };
}

// Elige un caso al azar entre los elegidos, sin repetir el anterior si hay otro.
export function pickCase(caseIds, previous = null, random = Math.random) {
  if (!caseIds.length) return null;
  const pool = caseIds.length > 1 ? caseIds.filter((id) => id !== previous) : caseIds;
  return pool[Math.floor(random() * pool.length)];
}
