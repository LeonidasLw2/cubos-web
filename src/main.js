// Punto de entrada: estilos, timer, navegación entre vistas e historial (Atrás/Adelante).
import './fonts.css';
import './style.css';
import { initUI, setTimerActive, isTimerIdle } from './ui.js';
import { startRouter } from './router.js';
import { createNavHistory } from './nav-history.js';
import { initPWA } from './pwa.js';

const views = {
  timer: document.getElementById('view-timer'),
  methods: document.getElementById('view-methods'),
  trainer: document.getElementById('view-trainer'),
};
let trainer = null; // módulo del entrenador, se carga la primera vez que se abre
const tabs = document.querySelectorAll('.tabs a');
const backBtn = document.getElementById('nav-back');
const forwardBtn = document.getElementById('nav-forward');
const exitToast = document.getElementById('exit-toast');
let shownPath = null; // página de métodos que está dibujada

const TITLES = { timer: 'Cubos · Timer', methods: 'Cubos · Métodos', trainer: 'Cubos · Entrenar' };

// ---------- Historial: botones Atrás / Adelante y scroll de cada página ----------

// El scroll lo maneja la app: las páginas de métodos se dibujan después de cargar,
// y el automático del navegador llegaría antes de que existan.
history.scrollRestoration = 'manual';

const standalone =
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const nav = createNavHistory({
  standalone,
  onUpdate({ canBack, canForward }) {
    backBtn.disabled = !canBack;
    forwardBtn.disabled = !canForward;
  },
  // App instalada, primer "atrás" en la entrada de guardia: avisar antes de salir.
  onExitWarning() {
    exitToast.hidden = false;
    setTimeout(() => (exitToast.hidden = true), 2500);
  },
});

backBtn.addEventListener('click', () => nav.back());
forwardBtn.addEventListener('click', () => nav.forward());
// El scroll también se guarda en el momento de navegar (el evento "scroll" llega
// en el próximo cuadro y podría no haber llegado todavía).
window.addEventListener('popstate', () => nav.onPopState(window.scrollY));
window.addEventListener('scroll', () => nav.saveScroll(window.scrollY), { passive: true });
window.addEventListener('pagehide', () => nav.persist());

// ---------- Vistas ----------

async function showRoute(route) {
  // Página nueva → arriba; volver a una entrada → donde estaba.
  const scrollTarget = nav.sync(window.scrollY);
  document.body.dataset.view = route.view;
  for (const [name, view] of Object.entries(views)) view.hidden = name !== route.view;
  for (const tab of tabs) {
    if (tab.dataset.view === route.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  document.title = TITLES[route.view];
  setTimerActive(route.view === 'timer');
  trainer?.setTrainerActive(route.view === 'trainer');

  if (route.view === 'trainer' && !trainer) {
    const mod = await import('./trainer.js');
    if (!trainer) {
      trainer = mod;
      trainer.renderTrainer(views.trainer);
    }
    trainer.setTrainerActive(document.body.dataset.view === 'trainer');
  }

  if (route.view === 'methods' && route.path !== shownPath) {
    shownPath = route.path;
    // Los métodos se cargan recién cuando se piden: el timer arranca más liviano.
    const { renderMethods } = await import('./methods.js');
    if (shownPath !== route.path) return; // se cambió de página mientras cargaba
    renderMethods(views.methods, route);
  }
  if (route.view !== 'methods') shownPath = null;
  window.scrollTo({ top: scrollTarget });
}

initUI();
startRouter(showRoute);
nav.armGuard();
// Service worker (sin conexión + aviso de versión nueva). Solo actualiza con el timer quieto.
initPWA({ canUpdate: () => isTimerIdle() && (trainer?.isTrainerIdle() ?? true) });
