// Punto de entrada: estilos, timer y navegación entre vistas.
import './style.css';
import { initUI, setTimerActive } from './ui.js';
import { startRouter } from './router.js';

const views = {
  timer: document.getElementById('view-timer'),
  methods: document.getElementById('view-methods'),
};
const tabs = document.querySelectorAll('.tabs a');
let shownPath = null; // página de métodos que está dibujada

const TITLES = { timer: 'Cubos · Timer', methods: 'Cubos · Métodos' };

async function showRoute(route) {
  if (document.body.dataset.view !== route.view) window.scrollTo({ top: 0 });
  document.body.dataset.view = route.view;
  for (const [name, view] of Object.entries(views)) view.hidden = name !== route.view;
  for (const tab of tabs) {
    if (tab.dataset.view === route.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  document.title = TITLES[route.view];
  setTimerActive(route.view === 'timer');

  if (route.view !== 'methods') {
    shownPath = null;
    return;
  }
  if (route.path === shownPath) return;
  shownPath = route.path;
  // Los métodos se cargan recién cuando se piden: el timer arranca más liviano.
  const { renderMethods } = await import('./methods.js');
  if (shownPath !== route.path) return; // se cambió de página mientras cargaba
  renderMethods(views.methods, route);
  window.scrollTo({ top: 0 });
}

initUI();
startRouter(showRoute);
