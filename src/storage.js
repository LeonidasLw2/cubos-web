// Persistencia en localStorage. Cada categoría guarda su propia lista de tiempos.
const PREFIX = 'cubos-web';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback; // modo privado, datos corruptos, etc.
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
  }
}

// Tiempos en orden cronológico (el más viejo primero).
export function loadSolves(eventId) {
  const solves = read(`${PREFIX}:solves:${eventId}`, []);
  return Array.isArray(solves) ? solves : [];
}

export function saveSolves(eventId, solves) {
  write(`${PREFIX}:solves:${eventId}`, solves);
}

export function loadSelectedEvent(fallback) {
  return read(`${PREFIX}:event`, fallback);
}

export function saveSelectedEvent(eventId) {
  write(`${PREFIX}:event`, eventId);
}
