// Barra lateral de desplazamiento rápido e interactivo para Android y dispositivos táctiles / móviles.
// Permite arrastrar el control o tocar la pista para moverse de arriba a abajo rápidamente,
// además de botones táctiles de salto al inicio y al final.

export function calculateScrollRatio(pointerY, trackHeight, thumbHeight = 44) {
  const effectiveTrack = Math.max(1, trackHeight - thumbHeight);
  const clampedY = Math.max(0, Math.min(effectiveTrack, pointerY - thumbHeight / 2));
  return Math.max(0, Math.min(1, clampedY / effectiveTrack));
}

export function calculateTargetScroll(ratio, scrollHeight, clientHeight) {
  const maxScroll = Math.max(0, scrollHeight - clientHeight);
  return Math.round(Math.max(0, Math.min(1, ratio)) * maxScroll);
}

export function calculateThumbOffset(scrollY, scrollHeight, clientHeight, trackHeight, thumbHeight = 44) {
  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  const ratio = Math.max(0, Math.min(1, scrollY / maxScroll));
  const effectiveTrack = Math.max(0, trackHeight - thumbHeight);
  return Math.round(ratio * effectiveTrack);
}

export function getScrollBubbleLabel(ratio) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  if (pct <= 4) return 'Inicio';
  if (pct >= 96) return 'Final';
  return `${pct}%`;
}

/**
 * Inicializa la barra lateral interactiva montándola en el body.
 */
export function initQuickScroll({
  container = document.body,
  scrollContainer = window,
  docElement = document.documentElement,
} = {}) {
  // Evitar instanciar múltiples veces
  const existing = document.getElementById('quick-scrollbar');
  if (existing) return existing;

  const root = document.createElement('aside');
  root.id = 'quick-scrollbar';
  root.className = 'quick-scrollbar is-idle';
  root.setAttribute('aria-label', 'Desplazamiento rápido');
  root.innerHTML = `
    <button type="button" class="quick-scroll-btn quick-scroll-up" id="quick-scroll-up" title="Ir arriba" aria-label="Ir al inicio de la página">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
    <div class="quick-scroll-track" id="quick-scroll-track" role="slider" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0" aria-label="Control deslizante vertical">
      <div class="quick-scroll-thumb" id="quick-scroll-thumb">
        <span class="quick-scroll-grip" aria-hidden="true"></span>
      </div>
      <div class="quick-scroll-bubble" id="quick-scroll-bubble" aria-hidden="true">Inicio</div>
    </div>
    <button type="button" class="quick-scroll-btn quick-scroll-down" id="quick-scroll-down" title="Ir abajo" aria-label="Ir al final de la página">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  `;

  container.appendChild(root);

  const track = root.querySelector('#quick-scroll-track');
  const thumb = root.querySelector('#quick-scroll-thumb');
  const bubble = root.querySelector('#quick-scroll-bubble');
  const upBtn = root.querySelector('#quick-scroll-up');
  const downBtn = root.querySelector('#quick-scroll-down');

  let isDragging = false;
  let idleTimer = null;
  let rafId = null;

  function getScrollMetrics() {
    const scrollH = docElement.scrollHeight || document.body.scrollHeight || 0;
    const clientH = window.innerHeight || docElement.clientHeight || 0;
    const currentY = window.scrollY || docElement.scrollTop || 0;
    const maxScroll = Math.max(0, scrollH - clientH);
    return { scrollH, clientH, currentY, maxScroll };
  }

  function wakeUp() {
    root.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!isDragging) {
        root.classList.add('is-idle');
      }
    }, 1800);
  }

  function updateThumbPosition() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const { scrollH, clientH, currentY, maxScroll } = getScrollMetrics();
      // Ocultar si la página no necesita scroll (menos de 60px de excedente)
      if (maxScroll <= 60) {
        root.hidden = true;
        return;
      }
      root.hidden = false;

      const trackH = track.clientHeight;
      const thumbH = thumb.offsetHeight || 44;
      const offset = calculateThumbOffset(currentY, scrollH, clientH, trackH, thumbH);
      thumb.style.transform = `translateY(${offset}px)`;

      const ratio = maxScroll > 0 ? currentY / maxScroll : 0;
      track.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      bubble.textContent = getScrollBubbleLabel(ratio);
    });
  }

  function handleScrub(clientY, smooth = false) {
    const trackRect = track.getBoundingClientRect();
    const trackH = trackRect.height;
    const thumbH = thumb.offsetHeight || 44;
    const pointerY = clientY - trackRect.top;
    const ratio = calculateScrollRatio(pointerY, trackH, thumbH);
    const { scrollH, clientH } = getScrollMetrics();
    const targetY = calculateTargetScroll(ratio, scrollH, clientH);

    window.scrollTo({
      top: targetY,
      behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant',
    });

    const offset = Math.round(ratio * Math.max(0, trackH - thumbH));
    thumb.style.transform = `translateY(${offset}px)`;
    bubble.textContent = getScrollBubbleLabel(ratio);
    track.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
  }

  // Eventos de arrastre táctil / puntero
  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isDragging = true;
    wakeUp();
    root.classList.add('is-active');
    bubble.classList.add('is-visible');
    if (track.setPointerCapture && e.pointerId !== undefined) {
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        // Ignorar
      }
    }
    handleScrub(e.clientY, false);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    wakeUp();
    handleScrub(e.clientY, false);
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    root.classList.remove('is-active');
    bubble.classList.remove('is-visible');
    wakeUp();
    if (track.releasePointerCapture && e.pointerId !== undefined) {
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {
        // Ignorar
      }
    }
    e.preventDefault();
  }

  track.addEventListener('pointerdown', onPointerDown);
  track.addEventListener('pointermove', onPointerMove);
  track.addEventListener('pointerup', onPointerUp);
  track.addEventListener('pointercancel', onPointerUp);

  // Fallback touch events para máxima compatibilidad en WebView de Android antiguos
  track.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0];
      if (touch) onPointerDown({ clientY: touch.clientY, preventDefault: () => e.preventDefault() });
    },
    { passive: false }
  );
  track.addEventListener(
    'touchmove',
    (e) => {
      const touch = e.touches[0];
      if (touch && isDragging) onPointerMove({ clientY: touch.clientY, preventDefault: () => e.preventDefault() });
    },
    { passive: false }
  );
  track.addEventListener('touchend', (e) => onPointerUp({ preventDefault: () => e.preventDefault() }));

  // Botones de salto rápido
  upBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    wakeUp();
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

  downBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    wakeUp();
    const { scrollH } = getScrollMetrics();
    window.scrollTo({ top: scrollH, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });

  // Escuchar scroll y resize de la ventana
  window.addEventListener(
    'scroll',
    () => {
      if (!isDragging) {
        wakeUp();
        updateThumbPosition();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      updateThumbPosition();
    },
    { passive: true }
  );

  // Observador de mutación para cuando cargan métodos o solvers dinámicamente
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      updateThumbPosition();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  }

  // Primera actualización
  updateThumbPosition();
  wakeUp();

  return root;
}
