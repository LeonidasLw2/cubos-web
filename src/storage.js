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

// Devuelve false si no se pudo guardar.
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en memoria.
    return false;
  }
}

const isPenalty = (p) => p === '+2' || p === 'DNF';

// Asegura el formato { id, time, penalty, autoPenalty, scramble, date } en datos
// guardados por versiones anteriores, incompletos o importados de un archivo.
// Descarta solo lo que no tiene un tiempo válido. Es pura (no toca localStorage).
export function normalizeSolve(raw, index) {
  if (!raw || typeof raw.time !== 'number' || !Number.isFinite(raw.time) || raw.time < 0) return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : `old-${index}-${raw.time}`,
    time: raw.time,
    penalty: isPenalty(raw.penalty) ? raw.penalty : null,
    // Penalización puesta automáticamente por la inspección (etapa 2); antes no existía.
    autoPenalty: isPenalty(raw.autoPenalty) ? raw.autoPenalty : null,
    scramble: typeof raw.scramble === 'string' ? raw.scramble : null,
    date: typeof raw.date === 'number' ? raw.date : null, // sin fecha: se muestra "—"
  };
}

// Tiempos en orden cronológico (el más viejo primero).
export function loadSolves(eventId) {
  const solves = read(`${PREFIX}:solves:${eventId}`, []);
  if (!Array.isArray(solves)) return [];
  return solves.map(normalizeSolve).filter(Boolean);
}

// Devuelve false si no se pudo guardar (por ejemplo, sin espacio).
export function saveSolves(eventId, solves) {
  return write(`${PREFIX}:solves:${eventId}`, solves);
}

// Pide que el navegador no borre los datos de la página cuando falta espacio
// (Android lo hace con las páginas que no están protegidas).
// Devuelve 'granted', 'denied' o 'unsupported'.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return 'unsupported';
    if (await navigator.storage.persisted()) return 'granted';
    return (await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

// Solo consulta (sin pedir): para mostrar el estado en Ajustes.
export async function isStoragePersistent() {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}

export function loadSelectedEvent(fallback) {
  return read(`${PREFIX}:event`, fallback);
}

export function saveSelectedEvent(eventId) {
  write(`${PREFIX}:event`, eventId);
}

// Ajustes tal como están guardados; settings.js se encarga de validarlos.
export function loadStoredSettings() {
  return read(`${PREFIX}:settings`, {});
}

export function saveStoredSettings(settings) {
  write(`${PREFIX}:settings`, settings);
}
