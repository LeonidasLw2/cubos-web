// Historial de navegación para los botones Atrás / Adelante.
// El navegador no deja leer el historial, así que cada entrada guarda en
// history.state su número de orden (idx). Con eso se sabe si hay adónde ir:
//   · Atrás:    idx > base       · Adelante: idx < max
// También guarda el scroll de cada entrada y, en la app instalada, agrega una
// entrada "de guardia" al principio para que el botón atrás de Android no
// cierre la app de golpe (muestra un aviso y recién la segunda vez sale).
// Las dependencias (history, sessionStorage) se inyectan para poder probarlo.

const MAX_KEY = 'cubos-web:history-max';
const SCROLL_KEY = 'cubos-web:history-scroll';
const EXIT_WINDOW_MS = 2500;

export function createNavHistory({
  hist = globalThis.history,
  store = globalThis.sessionStorage,
  standalone = false,
  onUpdate = () => {},
  onExitWarning = () => {},
  setTimer = setTimeout,
} = {}) {
  const read = (key, fallback) => {
    try {
      const v = store.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch {
      // sin sessionStorage: funciona igual, solo se pierde al recargar
    }
  };

  const GUARD_KEY = `${MAX_KEY}:guard`;
  let idx = -1; // -1 = todavía no se registró ninguna entrada
  let max = read(MAX_KEY, 0);
  // Con la entrada de guardia, la primera entrada "real" es la 1.
  let base = standalone && read(GUARD_KEY, false) ? 1 : 0;
  const scrolls = read(SCROLL_KEY, {});

  const notify = () => onUpdate({ canBack: idx > base, canForward: idx < max, idx, max });

  // Llamar en cada cambio de ruta (y al empezar), ANTES de dibujar la página nueva.
  // currentY: el scroll en ese momento, que todavía es el de la página que se deja.
  // Devuelve a qué scroll ir: el guardado si se volvió a una entrada, o 0 si es nueva.
  function sync(currentY) {
    const state = hist.state;
    // Guardar el scroll de la entrada que se deja (si popstate no lo hizo ya).
    if (idx >= 0 && currentY !== undefined && !(state && state.idx === idx)) scrolls[idx] = Math.round(currentY);
    if (state && typeof state.idx === 'number') {
      // Atrás/Adelante, o recarga de la página: la entrada ya tenía número.
      idx = state.idx;
      if (idx > max) max = idx;
      notify();
      return scrolls[idx] ?? 0;
    }
    // Entrada nueva (se tocó un link): todo lo que estaba "adelante" se pierde.
    idx += 1;
    max = idx;
    for (const key of Object.keys(scrolls)) if (Number(key) >= idx) delete scrolls[key];
    write(MAX_KEY, max);
    write(SCROLL_KEY, scrolls);
    hist.replaceState({ ...(state ?? {}), idx }, '');
    notify();
    return 0;
  }

  // App instalada recién abierta: la entrada actual pasa a ser la de guardia
  // y se agrega una copia encima, que es la que el usuario ve.
  function armGuard() {
    if (!standalone || idx !== 0 || hist.state?.guard) return;
    hist.replaceState({ ...hist.state, idx: 0, guard: true }, '');
    hist.pushState({ idx: 1 }, '');
    write(GUARD_KEY, true);
    base = 1;
    idx = 1;
    max = 1;
    write(MAX_KEY, max);
    notify();
  }

  // popstate: actualiza la posición (también cuando no cambia el hash, como al
  // ir a la entrada de guardia). Si se llegó a la de guardia, avisa y la vuelve
  // a armar después de un rato (si en ese rato se toca atrás otra vez, la app se cierra).
  // currentY: el scroll en ese momento (todavía es el de la entrada que se deja).
  function onPopState(currentY) {
    const state = hist.state;
    if (state && typeof state.idx === 'number') {
      if (idx >= 0 && currentY !== undefined && state.idx !== idx) scrolls[idx] = Math.round(currentY);
      idx = state.idx;
      notify();
    }
    if (!state?.guard) return;
    onExitWarning();
    setTimer(() => {
      if (hist.state?.guard) hist.forward();
    }, EXIT_WINDOW_MS);
  }

  // Guardar el scroll de la entrada actual (llamar en cada scroll).
  function saveScroll(y) {
    if (idx < 0) return;
    scrolls[idx] = Math.round(y);
  }

  // Al cerrar u ocultar la página, para recordar el scroll si se recarga.
  function persist() {
    write(SCROLL_KEY, scrolls);
  }

  return {
    sync,
    armGuard,
    onPopState,
    saveScroll,
    persist,
    back: () => hist.back(),
    forward: () => hist.forward(),
    get state() {
      return { idx, max, base, canBack: idx > base, canForward: idx < max };
    },
  };
}
