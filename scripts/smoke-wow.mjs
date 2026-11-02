// QA de los momentos "wow": resaltado de PB, píldora de categorías y borde de la barra superior.
// Uso: npm run build + npm run preview; node scripts/smoke-wow.mjs [url]
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:4173/cubos-web/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const open = async (opts = {}, reduced = false) => {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: reduced ? 'reduce' : 'no-preference', ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    localStorage.setItem('cubos-web:settings', JSON.stringify({ alerts: 'none', inspection: false }));
    if (!localStorage.getItem('cubos-web:solves:333')) {
      localStorage.setItem('cubos-web:solves:333', JSON.stringify([{ id: 'a', time: 600000, penalty: null, autoPenalty: null, date: 1793260800000, scramble: "R U" }]));
    }
  });
  await page.goto(BASE + '#/timer');
  await page.waitForFunction(() => document.querySelectorAll('#events button').length === 8 && !document.querySelector('#scramble').classList.contains('loading'));
  return { ctx, page, errors };
};
try {
  // --- Fase 3: resaltado de PB ---
  for (const reduced of [false, true]) {
    const { ctx, page, errors } = await open({}, reduced);
    await page.keyboard.down('Space'); await page.waitForTimeout(650); await page.keyboard.up('Space');
    await page.waitForFunction(() => document.body.dataset.phase === 'running');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => document.body.dataset.phase === 'idle');
    await page.waitForSelector('.stat-best.pb-flash');
    assert.equal(await page.locator('.solve.pb-flash').count(), 1, 'fila nueva resaltada');
    const op = () => page.evaluate(() => getComputedStyle(document.querySelector('.stat-best'), '::before').opacity);
    if (reduced) {
      await page.waitForTimeout(1800);
      assert.equal(await op(), '1', 'estático con movimiento reducido');
    } else {
      await page.waitForTimeout(1900);
      assert.equal(await op(), '0', 'se desvanece una sola vez');
    }
    assert.deepEqual(errors, []);
    console.log(`✔ PB flash (${reduced ? 'movimiento reducido: estático' : 'se desvanece'})`);
    await ctx.close();
  }

  // --- Fase 4: píldora de categorías (360 px, lista con scroll horizontal) ---
  {
    const { ctx, page, errors } = await open();
    await page.evaluate(() => document.fonts.ready);
    const geo = () => page.evaluate(() => {
      const pill = document.querySelector('.event-pill');
      const btn = document.querySelector('.event-btn[aria-pressed="true"]');
      const p = pill.getBoundingClientRect(); const b = btn.getBoundingClientRect();
      return { dx: Math.abs(p.left - b.left), dy: Math.abs(p.top - b.top), dw: Math.abs(p.width - b.width), dh: Math.abs(p.height - b.height), tr: getComputedStyle(pill).transitionProperty };
    });
    const near = (g, label) => assert.ok(g.dx < 1 && g.dy < 1 && g.dw < 1 && g.dh < 1, `${label}: ${JSON.stringify(g)}`);
    for (const ev of ['222', '444', '555', '777', 'minx', 'pyram', 'mirror', '333']) {
      await page.locator(`[data-event='${ev}']`).scrollIntoViewIfNeeded();
      await page.locator(`[data-event='${ev}']`).click();
      // Respuesta inmediata: el estado y el destino de la píldora cambian en el mismo clic.
      assert.equal(await page.evaluate(() => document.querySelector('.event-pill').style.transform !== ''), true);
      assert.equal((await geo()).tr, 'transform', 'solo se anima transform');
      await page.waitForTimeout(450);
      near(await geo(), `categoría ${ev}`);
    }
    // Desplazar la lista, cambiar el tamaño y la fuente: la píldora sigue sobre el botón.
    await page.locator('#events').evaluate((el) => { el.scrollLeft = 80; });
    await page.waitForTimeout(100);
    near(await geo(), 'tras scroll');
    await page.setViewportSize({ width: 412, height: 800 });
    await page.waitForTimeout(150);
    near(await geo(), 'tras resize');
    // Cambiar de vista y volver (display none → recalcula al mostrarse).
    await page.goto(BASE + '#/metodos'); await page.goto(BASE + '#/timer');
    await page.waitForTimeout(200);
    near(await geo(), 'tras volver al timer');
    assert.deepEqual(errors, []);
    console.log('✔ píldora de categorías: 8 botones a 360 px, scroll, resize y cambio de vista');
    await ctx.close();
  }

  // --- Fase 6: borde de scroll de la barra superior ---
  for (const reduced of [false, true]) {
    const { ctx, page, errors } = await open({}, reduced);
    await page.goto(BASE + '#/metodos/3x3/pll');
    await page.waitForFunction(() => document.documentElement.scrollHeight > innerHeight + 400);
    const edge = () => page.evaluate(() => getComputedStyle(document.querySelector('.topbar'), '::after').opacity);
    assert.equal(await edge(), '0', 'arriba: sin borde');
    await page.evaluate(() => scrollTo(0, 400));
    await page.waitForTimeout(150);
    assert.equal(await edge(), reduced ? '0' : '1', reduced ? 'movimiento reducido: sin animación' : 'abajo: borde visible');
    assert.deepEqual(errors, []);
    console.log(`✔ borde de scroll (${reduced ? 'movimiento reducido' : 'normal'})`);
    await ctx.close();
  }
} finally { await browser.close(); }
