// Categorías y generación de scrambles con cubing.js.

// cubing/scramble se carga aparte (import dinámico): genera los scrambles en un
// worker, y si su código quedara en el mismo archivo que la interfaz, el worker
// cargaría también la interfaz (que usa document) y fallaría en el build.
let scrambleLib = null;
function loadScrambleLib() {
  scrambleLib ??= Promise.all([import('cubing/scramble'), import('cubing/search')]).then(([scramble, search]) => {
    // cubing.js prueba varias formas de arrancar el worker. Con Vite la que anda es
    // la "esbuild workaround": se la pone primera para no pedir antes un archivo
    // que no existe en el build (sería un error 404 en cada carga).
    search.setSearchDebug({ prioritizeEsbuildWorkaroundForWorkerInstantiation: true });
    return scramble;
  });
  return scrambleLib;
}

// id: ID WCA de cubing.js · puzzle y view: configuración de <twisty-player>
export const EVENTS = [
  { id: '222', name: '2x2', puzzle: '2x2x2', view: '2D' },
  { id: '333', name: '3x3', puzzle: '3x3x3', view: '2D' },
  { id: '444', name: '4x4', puzzle: '4x4x4', view: '2D' },
  { id: '555', name: '5x5', puzzle: '5x5x5', view: '2D' },
  { id: '777', name: '7x7', puzzle: '7x7x7', view: '2D' },
  { id: 'minx', name: 'Megaminx', puzzle: 'megaminx', view: '2D' },
  { id: 'pyram', name: 'Pyraminx', puzzle: 'pyraminx', view: '2D' },
];

export const DEFAULT_EVENT = '333';

export function getEvent(eventId) {
  return EVENTS.find((e) => e.id === eventId) ?? EVENTS.find((e) => e.id === DEFAULT_EVENT);
}

// Scramble pre-generado por categoría, para que el siguiente salga al instante.
const prefetched = new Map();

async function generate(eventId) {
  const { randomScrambleForEvent } = await loadScrambleLib();
  return (await randomScrambleForEvent(eventId)).toString();
}

// Devuelve un scramble (el pre-generado si existe) y deja el siguiente en camino.
export function nextScramble(eventId) {
  const current = prefetched.get(eventId) ?? generate(eventId);
  current
    .catch(() => {})
    .then(() => prefetched.set(eventId, generate(eventId)));
  prefetched.delete(eventId);
  return current;
}
