// Hojas arrastrables: seguimiento 1:1 desde el tirador, cierre según la velocidad al soltar
// y resistencia (rubber-band) hacia arriba. Esc y el botón de cerrar siguen siendo los nativos.

const DECELERATION = 0.998; // misma caída que el scroll de iOS
const THRESHOLD_PX = 8; // movimiento mínimo antes de decidir que es un arrastre

// Resistencia progresiva: cuanto más se pasa del borde, menos sigue la hoja.
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// Dónde terminaría el gesto si siguiera con su inercia (px, velocidad en px/s).
export function project(velocity) {
  return ((velocity / 1000) * DECELERATION) / (1 - DECELERATION);
}

// Cierra si el punto proyectado pasa de la mitad de la hoja; la velocidad hacia arriba lo evita.
export function shouldClose(y, velocity, height) {
  return y + project(velocity) > height * 0.5;
}

// Velocidad (px/s) con las últimas muestras de los últimos 100 ms.
export function releaseVelocity(samples, now) {
  const recent = samples.filter((s) => now - s.t <= 100);
  if (recent.length < 2) return 0;
  const a = recent[0];
  const b = recent[recent.length - 1];
  return b.t === a.t ? 0 : ((b.y - a.y) / (b.t - a.t)) * 1000;
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSheet = (dialog) => dialog.classList.contains('bottom-sheet') || window.matchMedia('(max-width: 640px)').matches;

export function initSheetDrag(dialog) {
  if (!dialog) return;
  let grip = dialog.querySelector(':scope > .sheet-handle');
  if (!grip) {
    grip = document.createElement('div');
    grip.className = 'sheet-handle';
    grip.setAttribute('aria-hidden', 'true');
    dialog.prepend(grip);
  }
  const head = dialog.querySelector('.sheet-head, .settings-head, .account-dialog-head');
  let drag = null;
  let anim = null;

  const currentY = () => new DOMMatrix(getComputedStyle(dialog).transform).m42;
  const setY = (y) => {
    dialog.style.transform = y ? `translateY(${y}px)` : '';
    dialog.style.setProperty('--sheet-progress', String(Math.min(1, Math.max(0, y / dialog.offsetHeight))));
  };
  const reset = () => {
    dialog.style.transform = '';
    dialog.style.removeProperty('--sheet-progress');
    anim = null;
  };

  const onDown = (e) => {
    if (!isSheet(dialog) || e.button > 0 || e.target.closest('button, a, input, select, textarea')) return;
    // Interrumpible: si aún se está moviendo, se la agarra desde donde está ahora.
    const live = anim ? currentY() : 0;
    dialog.getAnimations().forEach((a) => a.cancel());
    anim = null;
    drag = { zone: e.currentTarget, id: e.pointerId, startY: e.clientY, y0: live, samples: [], active: false, h: dialog.offsetHeight };
    e.currentTarget.setPointerCapture(e.pointerId); // con mouse también se sigue fuera del tirador
    if (live) setY(live);
  };

  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.startY;
    if (!drag.active) {
      if (Math.abs(dy) < THRESHOLD_PX) return;
      drag.active = true;
      dialog.style.transition = 'none';
    }
    const raw = drag.y0 + dy;
    const y = raw < 0 ? -rubberband(-raw, drag.h) : raw;
    drag.y = y;
    drag.samples.push({ t: e.timeStamp, y });
    setY(y);
  };

  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { active, y = 0, samples, h } = drag;
    drag = null;
    if (!active) return;
    const v = releaseVelocity(samples, e.timeStamp);
    const close = shouldClose(y, v, h);
    const target = close ? h : 0;
    const finish = () => {
      if (close) dialog.close();
      reset();
    };
    if (reduceMotion()) return finish();
    // La duración sale de la velocidad: un lanzamiento rápido termina rápido (sin rebote: hay borde inferior).
    const dist = Math.abs(target - y);
    const ms = Math.min(360, Math.max(160, close ? (dist / Math.max(Math.abs(v), 900)) * 1000 * 1.6 : 300));
    anim = dialog.animate(
      [{ transform: `translateY(${y}px)` }, { transform: `translateY(${target}px)` }],
      { duration: ms, easing: close ? 'cubic-bezier(0.3, 0, 0.8, 0.6)' : 'cubic-bezier(0.2, 0.9, 0.3, 1)' }
    );
    dialog.style.transition = '';
    anim.onfinish = finish;
    anim.oncancel = () => {};
  };

  for (const zone of [grip, head]) {
    zone?.addEventListener('pointerdown', onDown);
    zone?.addEventListener('pointermove', onMove);
    zone?.addEventListener('pointerup', onUp);
    zone?.addEventListener('pointercancel', onUp);
  }
  dialog.addEventListener('close', reset);
}
