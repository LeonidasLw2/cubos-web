// Exportar e importar tiempos (archivo JSON) para pasarlos entre dispositivos.
// Lógica pura: no toca el DOM ni localStorage (eso lo hace ui.js).
import { normalizeSolve } from './storage.js';

export const EXPORT_FORMAT = 'cubos-web/tiempos';
export const EXPORT_VERSION = 1;

// solvesByEvent: { '333': [...], '222': [...] } → objeto listo para JSON.stringify.
export function buildExport(solvesByEvent, now = new Date()) {
  const events = {};
  for (const [eventId, solves] of Object.entries(solvesByEvent)) {
    if (solves.length) events[eventId] = solves;
  }
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now.toISOString(), events };
}

// Nombre del archivo: cubos-web-tiempos-2026-10-24.json
export function exportFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `cubos-web-tiempos-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

// Lee y valida un archivo exportado. Devuelve { events, invalid, unknownEvents }
// o lanza un Error con un mensaje para mostrar al usuario.
export function parseImport(text, validEventIds) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!data || typeof data !== 'object' || data.format !== EXPORT_FORMAT) {
    throw new Error('El archivo no es una exportación de tiempos de Cubos Web.');
  }
  if (typeof data.version !== 'number' || data.version > EXPORT_VERSION) {
    throw new Error('El archivo es de una versión más nueva de Cubos Web. Actualizá la app y volvé a intentar.');
  }
  if (!data.events || typeof data.events !== 'object' || Array.isArray(data.events)) {
    throw new Error('El archivo no tiene tiempos.');
  }

  const events = {};
  let invalid = 0;
  const unknownEvents = [];
  for (const [eventId, list] of Object.entries(data.events)) {
    if (!validEventIds.includes(eventId)) {
      unknownEvents.push(eventId);
      continue;
    }
    if (!Array.isArray(list)) {
      throw new Error(`Los tiempos de "${eventId}" no tienen el formato esperado.`);
    }
    const solves = [];
    list.forEach((raw, i) => {
      const solve = normalizeSolve(raw, i);
      if (solve) solves.push(solve);
      else invalid++;
    });
    events[eventId] = solves;
  }
  return { events, invalid, unknownEvents };
}

// Un tiempo importado es repetido si ya existe uno con el mismo id, o con el
// mismo tiempo y la misma fecha (por si el id cambió en algún momento).
const sameSolve = (a, b) => a.id === b.id || (a.date !== null && a.date === b.date && a.time === b.time);

// Junta los tiempos sin duplicar. Devuelve { merged, added, duplicates }.
// merged queda en orden cronológico (los sin fecha, que son los más viejos, primero).
export function mergeSolves(existing, incoming) {
  const fresh = [];
  let duplicates = 0;
  for (const solve of incoming) {
    if (existing.some((s) => sameSolve(s, solve)) || fresh.some((s) => sameSolve(s, solve))) duplicates++;
    else fresh.push(solve);
  }
  const merged = [...existing, ...fresh].sort((a, b) => (a.date ?? -Infinity) - (b.date ?? -Infinity));
  return { merged, added: fresh.length, duplicates };
}
