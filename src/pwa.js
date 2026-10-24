// PWA: registra el service worker, avisa cuando hay una versión nueva y pide
// almacenamiento persistente. Nunca recarga la página sola.
import { registerSW } from 'virtual:pwa-register';
import { requestPersistentStorage } from './storage.js';

const HOUR = 60 * 60 * 1000;

// canUpdate(): true si se puede recargar ahora (el timer está quieto).
export function initPWA({ canUpdate }) {
  const banner = document.getElementById('update-banner');
  const updateBtn = document.getElementById('update-btn');
  const dismissBtn = document.getElementById('update-dismiss');
  const offlineToast = document.getElementById('offline-toast');

  const updateSW = registerSW({
    immediate: true,
    // Se instaló una versión nueva y está esperando: mostrar el aviso.
    onNeedRefresh() {
      banner.hidden = false;
    },
    // Primera vez que quedó todo guardado: ya se puede usar sin conexión.
    onOfflineReady() {
      offlineToast.hidden = false;
      setTimeout(() => (offlineToast.hidden = true), 4000);
    },
    // Con la app abierta mucho tiempo (por ejemplo instalada), buscar versiones nuevas cada hora.
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), HOUR);
    },
  });

  updateBtn.addEventListener('click', () => {
    // Doble seguro: el aviso se oculta durante la inspección y la resolución,
    // pero si igual llegara un clic, no se recarga.
    if (!canUpdate()) return;
    updateBtn.disabled = true;
    updateBtn.textContent = 'Actualizando...';
    updateSW(true); // activa la versión nueva y recarga una sola vez
  });
  dismissBtn.addEventListener('click', () => (banner.hidden = true));

  // Que Android/Chrome no borre los tiempos si falta espacio. Si al principio no
  // lo concede (pasa en páginas sin instalar), se vuelve a pedir al instalarla.
  requestPersistentStorage();
  window.addEventListener('appinstalled', () => requestPersistentStorage());
}
