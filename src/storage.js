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

const isPenalty = (p) => p === '+2' || p === 'DNF';

// Asegura el formato { id, time, penalty, autoPenalty, scramble, date } en datos
// guardados por versiones anteriores o incompletos. Descarta solo lo que no tiene tiempo.
function normalizeSolve(raw, index) {
  if (!raw || typeof raw.time !== 'number' || !Number.isFinite(raw.time)) return null;
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

export function saveSolves(eventId, solves) {
  write(`${PREFIX}:solves:${eventId}`, solves);
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
