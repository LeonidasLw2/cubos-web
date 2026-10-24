// Router simple con hash: #/timer, #/metodos, #/metodos/cfop/pll…
// parseRoute() es pura (se puede probar sin navegador); startRouter() escucha los cambios.

export const DEFAULT_HASH = '#/timer';

// Páginas de la sección Métodos. soon: todavía no está hecha ("Próximamente").
const METHOD_PAGES = {
  '': { page: 'index' },
  principiante: { page: 'beginner' },
  cfop: { page: 'cfop' },
  'cfop/cruz': { page: 'cross' },
  'cfop/f2l': { page: 'f2l' },
  'cfop/oll': { page: 'oll' },
  'cfop/pll': { page: 'pll' },
  roux: { page: 'soon', title: 'Roux' },
};

// Convierte el hash en { view, page, title? }. Un hash desconocido vuelve al timer.
export function parseRoute(hash) {
  const path = (hash ?? '').replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();
  if (path === '' || path === 'timer') return { view: 'timer', path: 'timer' };
  if (path === 'metodos' || path.startsWith('metodos/')) {
    const sub = path.slice('metodos'.length).replace(/^\//, '');
    const found = METHOD_PAGES[sub];
    if (found) return { view: 'methods', path, ...found };
  }
  return { view: 'timer', path: 'timer', notFound: true };
}

// Llama a onRoute con la ruta actual y cada vez que cambia el hash.
export function startRouter(onRoute) {
  const handle = () => {
    const route = parseRoute(location.hash);
    // Corrige la URL si estaba vacía o no existía (sin agregar una entrada al historial
    // y sin perder lo que el historial de navegación guardó en history.state).
    if (route.notFound || location.hash === '') history.replaceState(history.state, '', DEFAULT_HASH);
    onRoute(route);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
