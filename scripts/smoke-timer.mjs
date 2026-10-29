// QA de Fase 2 sobre la build: geometría, estados reales, fixtures largas, CLS y movimiento reducido.
// Uso: npm run build + npm run preview; node scripts/smoke-timer.mjs [url]
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:4173/cubos-web/';
const SIZES = [[360, 640], [360, 800], [390, 844], [412, 915], [667, 375], [768, 1024], [861, 800], [1024, 768], [1280, 800]];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let failures = 0;
try {
  for (const [width, height] of SIZES) {
    const mobile = width < 861;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.addInitScript(() => {
      window.timerCLS = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.timerCLS += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
      localStorage.setItem('cubos-web:settings', JSON.stringify({ alerts: 'none' }));

    });
    const geometry = async (label) => {
      const m = await page.evaluate(() => {
        const zone = document.querySelector('#timer-zone').getBoundingClientRect();
        const time = document.querySelector('#timer').getBoundingClientRect();
        const nav = document.querySelector('.bottom-nav');
        const limit = getComputedStyle(nav).display === 'none' ? innerHeight : nav.getBoundingClientRect().top;
        const scramble = document.querySelector('#scramble');
        return {
          viewport: innerWidth, over: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          zone: { top: zone.top, bottom: zone.bottom, width: zone.width, height: zone.height }, limit,
          timeFits: time.left >= zone.left && time.right <= zone.right && time.top >= zone.top && time.bottom <= zone.bottom,
          scrambleVisible: getComputedStyle(scramble).visibility !== 'hidden' && getComputedStyle(scramble.parentElement.parentElement).opacity === '1',
        };
      });
      assert.equal(m.viewport, width, `${label}: viewport`);
      assert.equal(m.over, width, `${label}: desborde`);
      assert.ok(m.zone.top >= 0 && m.zone.bottom <= m.limit + 1, `${label}: zona ${m.zone.top}–${m.zone.bottom}, límite ${m.limit}`);
      assert.ok(m.timeFits, `${label}: dígitos fuera de la zona`);
      assert.ok(m.scrambleVisible, `${label}: mezcla oculta`);
      return m;
    };
    try {
      await page.goto(BASE + '#/timer');
      await page.waitForFunction(() => document.querySelectorAll('#events button').length === 8 && !document.querySelector('#scramble').classList.contains('loading'));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => window.timerCLS), 0, 'CLS con sesión vacía');
      await page.evaluate(() => {
      localStorage.setItem('cubos-web:solves:333', JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
        id: `fixture-${i}`, time: i === 11 ? 623450 : 10000 + i * 500,
        penalty: i === 11 ? 'DNF' : null, autoPenalty: null, date: 1793260800000 + i * 60000,
        scramble: "R U R' U'",
      }))));
      });
      await page.reload();
      await page.waitForFunction(() => document.querySelectorAll('#solves .solve').length === 12 && !document.querySelector('#scramble').classList.contains('loading'));
      await page.waitForTimeout(600);
      const idle = await geometry('reposo');
      const cls = await page.evaluate(() => window.timerCLS);
      assert.equal(cls, 0, `CLS ${cls}`);
      assert.equal(await page.locator('#solves .solve').count(), 12);
      assert.ok(await page.locator('#trend').isVisible());
      await page.locator('#timer-zone').focus();
      assert.equal(await page.locator('#timer-zone').evaluate((el) => getComputedStyle(el).outlineStyle), 'solid');
      const player = await page.locator('#scramble-view').evaluate((el) => { window.timerPlayer = el.firstElementChild; return el.children.length; });
      assert.equal(player, 1);
      if (height > 500) {
        await page.locator('#toggle-preview').click();
        assert.ok(await page.locator('#scramble-view').isVisible());
        await page.locator('#toggle-preview').click();
        assert.equal(await page.locator('#scramble-view').evaluate((el) => el.children.length === 1 && el.firstElementChild === window.timerPlayer), true);
        await page.evaluate(() => scrollTo(0, 0));
      }
      if (width === 360 && height === 640) {
        for (const event of ['222', '444', '555', '777', 'minx', 'pyram', 'mirror', '333']) {
          await page.locator(`[data-event='${event}']`).click();
          await page.waitForFunction(() => !document.querySelector('#scramble').classList.contains('loading'));
          await page.evaluate(() => scrollTo(0, 0));
          await geometry(`categoría ${event}`);
        }
      }
      await page.keyboard.down('Space'); await page.waitForTimeout(650); await page.keyboard.up('Space');
      await page.waitForFunction(() => document.body.dataset.phase === 'inspection');
      await geometry('inspección');
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#insp-ring')).opacity === '1');
      await page.keyboard.down('Space'); await page.waitForTimeout(650); await page.keyboard.up('Space');
      await page.waitForFunction(() => document.body.dataset.phase === 'running');
      await page.waitForTimeout(1100);
      await geometry('corriendo');
      await page.keyboard.press('Space');
      await page.waitForFunction(() => document.body.dataset.phase === 'idle');
      await page.waitForTimeout(450);
      await geometry('resultado');
      for (const action of ['plus2', 'dnf']) {
        await page.locator(`[data-action='${action}']`).first().click();
        assert.equal(await page.locator(`[data-action='${action}']`).first().getAttribute('aria-pressed'), 'true');
        await page.evaluate(() => scrollTo(0, 0));
        await geometry(action);
      }
      // Fixtures de texto: prueban presentación, sin esperar diez minutos de resolución.
      for (const text of ['10:23.45', 'DNF(10:23.45)', 'Resolviendo...']) {
        await page.locator('#timer').evaluate((el, text) => {
          el.children[0].textContent = text; el.children[1].textContent = '';
          el.classList.toggle('is-long', text.length > 7 || text.startsWith('DNF'));
          el.style.setProperty('--timer-chars', text.length);
        }, text);
        await geometry(text);
      }
      for (const state of ['loading', 'is-error']) {
        await page.locator('#scramble').evaluate((el, state) => {
          el.className = `scramble ${state}`;
          el.textContent = state === 'loading' ? 'Generando scramble...' : 'No se pudo generar el scramble. Tocá ↻ para reintentar.';
        }, state);
        await geometry(state);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.locator('#timer').evaluate((el) => getComputedStyle(el).transitionDuration), '1e-05s');
      assert.equal(await page.locator('#timer-zone').evaluate((el) => getComputedStyle(el).touchAction), 'none');
      assert.equal(await page.locator('#timer-zone').evaluate((el) => getComputedStyle(el).overscrollBehaviorY), 'contain');
      assert.equal(await page.locator('#timer').evaluate((el) => getComputedStyle(el).fontWeight), '300');
      if (width === 1280) {
        await page.evaluate(() => navigator.serviceWorker.ready);
        await page.reload();
        await page.waitForFunction(() => navigator.serviceWorker.controller);
        await context.setOffline(true);
        await page.reload();
        await page.waitForFunction(() => document.querySelectorAll('#events button').length === 8 && !document.querySelector('#scramble').classList.contains('loading'));
        await page.evaluate(() => document.fonts.ready);
        await geometry('sin conexión');
        assert.equal(await page.evaluate(() => document.fonts.check('16px Inter')), true);
        console.log('  ✔ recarga sin conexión: interfaz, fuente local y generación de mezcla');
      }
      assert.deepEqual(errors, []);
      console.log(`✔ ${width}×${height}: CLS=${cls}; zona=${Math.round(idle.zone.top)}–${Math.round(idle.zone.bottom)}; estados, spans, visor único, foco y reduced-motion`);
    } catch (error) {
      failures++;
      console.error(`✖ ${width}×${height}: ${error.message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
assert.equal(failures, 0, `${failures} tamaños con fallos`);
