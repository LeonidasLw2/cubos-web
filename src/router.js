// Router simple con hash: #/timer, #/metodos, #/solver, #/notacion, #/entrenar…
// parseRoute() es pura (se puede probar sin navegador); startRouter() escucha los cambios.
import { METHOD_PAGES, LEGACY_METHOD_PATHS, methodHref, crumbsFor } from './data/method-pages.js';

export const DEFAULT_HASH = '#/timer';

// Convierte el hash en { view, path, page, sub, crumbs, … }.
// Un hash desconocido vuelve al timer; una ruta vieja de Métodos trae "redirect".
export function parseRoute(hash) {
  const path = (hash ?? '').replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();
  if (path === '' || path === 'timer') return { view: 'timer', path: 'timer' };
  if (path === 'entrenar') return { view: 'trainer', path };
  if (path === 'solver' || path.startsWith('solver/')) {
    const puzzle = path.slice('solver'.length).replace(/^\//, '') || null;
    return { view: 'solver', path, puzzle };
  }
  if (path === 'notacion' || path.startsWith('notacion/')) {
    const puzzle = path.slice('notacion'.length).replace(/^\//, '') || null;
    return { view: 'notation', path, puzzle };
  }
  if (path === 'metodos' || path.startsWith('metodos/')) {
    const sub = path.slice('metodos'.length).replace(/^\//, '');
    const found = METHOD_PAGES[sub];
    if (found) return { view: 'methods', path, sub, crumbs: crumbsFor(sub), ...found };
    const moved = LEGACY_METHOD_PATHS[sub];
    if (moved) return { ...parseRoute(methodHref(moved)), redirect: methodHref(moved) };
  }
  return { view: 'timer', path: 'timer', notFound: true };
}

// Llama a onRoute con la ruta actual y cada vez que cambia el hash.
export function startRouter(onRoute) {
  const handle = () => {
    const route = parseRoute(location.hash);
    // Corrige la URL si estaba vacía, no existía o era una ruta vieja: sin agregar
    // una entrada al historial y sin perder lo que guardó el historial de navegación.
    if (route.redirect) history.replaceState(history.state, '', route.redirect);
    else if (route.notFound || location.hash === '') history.replaceState(history.state, '', DEFAULT_HASH);
    onRoute(route);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
