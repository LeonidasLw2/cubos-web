// QA de Métodos y Notación sobre preview: preserva navegación, filtros y visores.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/cubos-web/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [360, 390, 412, 667, 768, 861, 1024, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 861, hasTouch: width < 861 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    for (const route of ['#/metodos', '#/metodos/3x3/cfop/pll', '#/metodos/mirror', '#/notacion', '#/notacion/mirror']) {
      await page.goto(BASE + route);
      await page.waitForTimeout(1400);
      assert.equal(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)), width, `${width} ${route}: desborde`);
      const blur = await page.locator('main:visible').evaluate((el) => [...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backdropFilter !== 'none').length);
      assert.equal(blur, 0, `${route}: vidrio en contenido`);
      if (route === '#/metodos') {
        const gap = await page.locator('.method-hero h2 small').evaluate((subtitle) => {
          const title = document.createRange();
          title.setStart(subtitle.parentNode, 0);
          title.setEndBefore(subtitle);
          return subtitle.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
        });
        assert.ok(gap >= 0, `${width}px: subtítulo superpuesto al título (${gap}px)`);
        console.log(`  subtítulo ${width}px: debajo del título, separación ${gap.toFixed(2)}px`);
      }
    }
    await page.goto(BASE + '#/metodos/3x3/cfop/pll');
    await page.waitForSelector('.case-card');
    assert.equal(await page.locator('.breadcrumb a').first().evaluate((el) => getComputedStyle(el).textDecorationLine), 'underline');
    const learned = page.locator('[data-action="toggle-learned"]').first();
    await learned.click();
    assert.equal(await learned.getAttribute('aria-pressed'), 'true');
    await learned.click();
    await page.locator('#explorer-search-input').fill('no-existe-esta-forma');
    assert.ok(await page.locator('#explorer-empty').isVisible());
    await page.locator('#explorer-search-input').fill('');
    await page.locator('[data-action="watch"]').first().click();
    await page.waitForSelector('#case-modal-stage twisty-player');
    assert.equal(await page.locator('#case-modal-stage twisty-player').count(), 1);
    await page.locator('#case-modal-close').click();
    await page.goto(BASE + '#/notacion/3x3');
    await page.waitForSelector('#notation-seq-input');
    await page.locator('#notation-seq-input').fill('INVALIDO');
    await page.locator('#notation-seq-play-btn').click();
    assert.ok(await page.locator('#view-notation .notation-seq-error').isVisible());
    await page.locator('#notation-seq-input').fill("R U R' U'");
    await page.locator('#notation-seq-play-btn').click();
    assert.ok(await page.locator('.notation-seq-valid').isVisible());
    assert.equal(await page.locator('#notation-stage-box twisty-player').count(), 1);
    const touch = await page.locator('.notation-variant-btn').first().boundingBox();
    assert.ok(touch.height >= 48);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.notation-variant-btn').first().evaluate((el) => getComputedStyle(el).transitionDuration.split(',')[0]), '1e-05s');
    assert.deepEqual(errors, []);
    console.log(`✔ ${width}px: cinco rutas, migas, búsqueda, aprendido, modal único, notación válida/inválida y movimiento reducido`);
    await context.close();
  }
} finally {
  await browser.close();
}
