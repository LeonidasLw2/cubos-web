// Punto de entrada: estilos, timer, navegación entre las 5 secciones, bottom sheet móvil y cuenta.
import './fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/topbar-nav.css';
import './styles/timer.css';
import './styles/methods.css';
import './styles/solver.css';
import './styles/notation.css';
import './styles/trainer.css';
import './styles/dialogs.css';
import { initUI, setTimerActive, isTimerIdle, openSettingsDialog } from './ui.js';
import { startRouter } from './router.js';
import { createNavHistory } from './nav-history.js';
import { initPWA } from './pwa.js';
import { destroyScopePlayer } from './twisty/playerManager.js';
import { initQuickScroll } from './quick-scroll.js';

const views = {
  timer: document.getElementById('view-timer'),
  methods: document.getElementById('view-methods'),
  solver: document.getElementById('view-solver'),
  notation: document.getElementById('view-notation'),
  trainer: document.getElementById('view-trainer'),
};

let trainer = null;
let shownMethodsPath = null;
let shownNotationPath = null;
let shownSolverPath = null;

const desktopTabsContainer = document.getElementById('desktop-tabs');
const tabIndicator = document.getElementById('tab-indicator');
const allNavLinks = () => document.querySelectorAll('.tabs a, .bottom-nav a');
const openMoreSheetBtn = document.getElementById('open-more-sheet');
const moreSheet = document.getElementById('more-sheet');
const closeMoreSheetBtn = document.getElementById('close-more-sheet');
const sheetLinkNotation = document.getElementById('sheet-link-notation');
const sheetOpenSettings = document.getElementById('sheet-open-settings');
const sheetOpenAccount = document.getElementById('sheet-open-account');
const accountBtn = document.getElementById('account-btn');
const accountDialog = document.getElementById('account-dialog');
const closeAccountDialogBtn = document.getElementById('close-account-dialog');
const exitToast = document.getElementById('exit-toast');

const TITLES = {
  timer: 'CubeSolver · Timer',
  methods: 'CubeSolver · Métodos',
  solver: 'CubeSolver · Solver',
  notation: 'CubeSolver · Notación',
  trainer: 'CubeSolver · Entrenar',
};

// ---------- Indicador deslizante de la barra superior ----------

function updateTabIndicator() {
  if (!desktopTabsContainer || !tabIndicator) return;
  const activeTab = desktopTabsContainer.querySelector('a[aria-current="page"]');
  if (!activeTab || desktopTabsContainer.offsetParent === null) {
    tabIndicator.style.opacity = '0';
    return;
  }
  const navRect = desktopTabsContainer.getBoundingClientRect();
  const tabRect = activeTab.getBoundingClientRect();
  const left = tabRect.left - navRect.left;
  tabIndicator.style.opacity = '1';
  tabIndicator.style.width = `${tabRect.width}px`;
  tabIndicator.style.transform = `translateX(${left}px)`;
}

window.addEventListener('resize', updateTabIndicator, { passive: true });

// ---------- Bottom sheet "Más" (Móvil) y diálogo de Cuenta ----------

function openMoreSheet() {
  if (!moreSheet || moreSheet.open) return;
  moreSheet.showModal();
}

function closeMoreSheet() {
  if (moreSheet?.open) moreSheet.close();
}

function openAccountModal() {
  closeMoreSheet();
  if (accountDialog && !accountDialog.open) accountDialog.showModal();
}

openMoreSheetBtn?.addEventListener('click', openMoreSheet);
closeMoreSheetBtn?.addEventListener('click', closeMoreSheet);
moreSheet?.addEventListener('click', (e) => {
  if (e.target === moreSheet) closeMoreSheet();
});
sheetLinkNotation?.addEventListener('click', () => closeMoreSheet());
sheetOpenSettings?.addEventListener('click', () => {
  closeMoreSheet();
  openSettingsDialog();
});
sheetOpenAccount?.addEventListener('click', openAccountModal);

accountBtn?.addEventListener('click', openAccountModal);
closeAccountDialogBtn?.addEventListener('click', () => accountDialog?.close());
accountDialog?.addEventListener('click', (e) => {
  if (e.target === accountDialog) accountDialog.close();
});

// ---------- Historial y restauración de scroll ----------

history.scrollRestoration = 'manual';

const standalone =
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const nav = createNavHistory({
  standalone,
  onUpdate() {},
  onExitWarning() {
    if (exitToast) {
      exitToast.hidden = false;
      setTimeout(() => (exitToast.hidden = true), 2500);
    }
  },
});

window.addEventListener('popstate', () => nav.onPopState(window.scrollY));
window.addEventListener('scroll', () => nav.saveScroll(window.scrollY), { passive: true });
window.addEventListener('pagehide', () => nav.persist());

// ---------- Vistas ----------

async function showRoute(route) {
  closeMoreSheet();
  const scrollTarget = nav.sync(window.scrollY);
  document.body.dataset.view = route.view;
  for (const [name, view] of Object.entries(views)) {
    if (view) view.hidden = name !== route.view;
  }
  for (const tab of allNavLinks()) {
    if (tab.dataset.view === route.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  // En móvil, "Notación" vive dentro de "Más": resaltamos "Más" cuando está activa.
  if (openMoreSheetBtn) {
    if (route.view === 'notation') openMoreSheetBtn.setAttribute('aria-current', 'page');
    else openMoreSheetBtn.removeAttribute('aria-current');
  }
  requestAnimationFrame(updateTabIndicator);

  document.title = TITLES[route.view] ?? 'CubeSolver';
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

  if (route.view === 'methods' && route.path !== shownMethodsPath) {
    shownMethodsPath = route.path;
    const { renderMethods } = await import('./methods.js');
    if (shownMethodsPath !== route.path) return;
    renderMethods(views.methods, route);
  }
  if (route.view !== 'methods') {
    shownMethodsPath = null;
    const caseModal = document.getElementById('case-anim-modal');
    if (caseModal?.open) caseModal.close();
    destroyScopePlayer('methods');
  }

  if (route.view === 'notation' && route.path !== shownNotationPath) {
    shownNotationPath = route.path;
    const { renderNotation } = await import('./notation.js');
    if (shownNotationPath !== route.path) return;
    renderNotation(views.notation, route);
  }
  if (route.view !== 'notation') {
    shownNotationPath = null;
    destroyScopePlayer('notation');
  }

  if (route.view === 'solver' && route.path !== shownSolverPath) {
    shownSolverPath = route.path;
    const { renderSolver } = await import('./solver.js');
    if (shownSolverPath !== route.path) return;
    renderSolver(views.solver, route);
  }
  if (route.view !== 'solver') {
    shownSolverPath = null;
    destroyScopePlayer('solver');
  }

  window.scrollTo({ top: scrollTarget });
}

initUI();
initQuickScroll();
startRouter(showRoute);
nav.armGuard();
initPWA({ canUpdate: () => isTimerIdle() && (trainer?.isTrainerIdle() ?? true) });
