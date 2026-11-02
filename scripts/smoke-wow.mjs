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
} finally { await browser.close(); }
