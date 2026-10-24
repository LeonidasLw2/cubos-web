// Pruebas del historial de navegación (Atrás / Adelante) con un historial falso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNavHistory } from '../src/nav-history.js';

// Historial falso que se comporta como el del navegador.
function fakeBrowser() {
  const entries = [{ url: '#/timer', state: null }];
  let pos = 0;
  const hist = {
    get state() {
      return entries[pos].state;
    },
    replaceState(state) {
      entries[pos].state = state;
    },
    pushState(state, _title, url = entries[pos].url) {
      entries.splice(pos + 1); // lo que estaba adelante se pierde
      entries.push({ url, state });
      pos++;
    },
    back() {
      if (pos > 0) pos--;
    },
    forward() {
      if (pos < entries.length - 1) pos++;
    },
  };
  const data = new Map();
  const store = { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, v) };
  return { hist, store, entries, get pos() { return pos; } };
}

// Simula tocar un link: el navegador crea una entrada con state null y avisa (hashchange).
// y: el scroll en ese momento (el de la página que se deja).
const clickLink = (b, nav, url, y) => {
  b.hist.pushState(null, '', url);
  return nav.sync(y);
};
// Simula Atrás/Adelante: el navegador cambia de entrada, avisa popstate y después hashchange.
const go = (b, nav, dir, y) => {
  b.hist[dir]();
  nav.onPopState(y);
  return nav.sync(y);
};

test('al empezar no hay adónde ir', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync();
  assert.deepEqual([nav.state.canBack, nav.state.canForward], [false, false]);
  assert.equal(b.hist.state.idx, 0);
});

test('entrar, volver y avanzar habilita los botones correctos', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync();
  clickLink(b, nav, '#/metodos');
  clickLink(b, nav, '#/metodos/cfop');
  assert.deepEqual([nav.state.idx, nav.state.canBack, nav.state.canForward], [2, true, false]);
  go(b, nav, 'back');
  assert.deepEqual([nav.state.idx, nav.state.canBack, nav.state.canForward], [1, true, true]);
  go(b, nav, 'back');
  assert.deepEqual([nav.state.idx, nav.state.canBack, nav.state.canForward], [0, false, true]);
  go(b, nav, 'forward');
  assert.deepEqual([nav.state.idx, nav.state.canBack, nav.state.canForward], [1, true, true]);
});

test('ir a otra página después de volver borra el "adelante"', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync();
  clickLink(b, nav, '#/metodos');
  clickLink(b, nav, '#/metodos/cfop');
  go(b, nav, 'back');
  clickLink(b, nav, '#/metodos/principiante');
  assert.deepEqual([nav.state.idx, nav.state.max, nav.state.canForward], [2, 2, false]);
});

test('al volver se restaura el scroll; en una página nueva se va arriba', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync();
  clickLink(b, nav, '#/metodos/cfop/oll');
  nav.saveScroll(1234);
  assert.equal(clickLink(b, nav, '#/metodos/cfop/pll'), 0);
  nav.saveScroll(50);
  assert.equal(go(b, nav, 'back'), 1234);
  assert.equal(go(b, nav, 'forward'), 50);
});

test('el scroll se guarda al navegar aunque nunca llegue un evento "scroll"', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync(0);
  clickLink(b, nav, '#/metodos/cfop/oll', 0);
  // El usuario bajó hasta 3000 y tocó un link sin que se registrara el scroll
  assert.equal(clickLink(b, nav, '#/metodos/cfop', 3000), 0);
  // En CFOP bajó a 120 y tocó Atrás: popstate llega con la página de CFOP todavía dibujada
  assert.equal(go(b, nav, 'back', 120), 3000);
  // Y al ir Adelante, CFOP vuelve a 120 (el scroll de OLL ahora es 3000 otra vez)
  assert.equal(go(b, nav, 'forward', 3000), 120);
});

test('al recargar se recuerda la posición (sessionStorage + history.state)', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store });
  nav.sync();
  clickLink(b, nav, '#/metodos');
  clickLink(b, nav, '#/metodos/cfop');
  go(b, nav, 'back');
  nav.saveScroll(300);
  nav.persist();
  const reloaded = createNavHistory({ hist: b.hist, store: b.store });
  assert.equal(reloaded.sync(), 300);
  assert.deepEqual([reloaded.state.idx, reloaded.state.canBack, reloaded.state.canForward], [1, true, true]);
});

test('app instalada: el primer "atrás" no sale, avisa; el segundo sí', () => {
  const b = fakeBrowser();
  let warnings = 0;
  let pending = null;
  const nav = createNavHistory({
    hist: b.hist,
    store: b.store,
    standalone: true,
    onExitWarning: () => warnings++,
    setTimer: (fn) => (pending = fn),
  });
  nav.sync();
  nav.armGuard();
  assert.equal(b.entries.length, 2); // guardia + la que se ve
  assert.equal(nav.state.canBack, false); // la guardia no cuenta como "atrás"
  // Botón atrás de Android: va a la guardia (misma dirección: solo popstate)
  b.hist.back();
  nav.onPopState();
  assert.equal(warnings, 1);
  assert.equal(b.pos, 0);
  // Si no se vuelve a tocar atrás, se rearma sola
  pending();
  nav.onPopState();
  assert.equal(b.pos, 1);
  assert.equal(nav.state.idx, 1);
});

test('fuera de la app instalada no se agrega la entrada de guardia', () => {
  const b = fakeBrowser();
  const nav = createNavHistory({ hist: b.hist, store: b.store, standalone: false });
  nav.sync();
  nav.armGuard();
  assert.equal(b.entries.length, 1);
});
