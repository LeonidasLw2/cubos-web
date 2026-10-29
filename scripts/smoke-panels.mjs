// QA de Fase 4: sheets, foco con menos altura, entrenador, Mirror y avisos.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/cubos-web/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [width, height] of [[360, 640], [390, 844], [667, 375], [768, 1024], [1280, 800]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 861, hasTouch: width < 861 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(BASE + '#/timer');
    await page.waitForSelector('#scramble-view twisty-player', { state: 'attached' });
    await page.evaluate(() => {
      window.originalPlayer = document.querySelector('#scramble-view').firstElementChild;
      window.originalParent = originalPlayer.parentNode;
      window.playerMutations = 0;
      new MutationObserver((records) => { window.playerMutations += records.filter((r) => r.addedNodes.length || r.removedNodes.length).length; }).observe(originalParent, { childList: true });
    });
    if (height > 500) {
      for (let i = 0; i < 4; i++) await page.locator('#toggle-preview').click();
      assert.equal(await page.evaluate(() => originalPlayer === document.querySelector('#scramble-view').firstElementChild && originalPlayer.parentNode === originalParent && playerMutations === 0), true);
    }
    for (const reduced of [false, true]) {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      for (const id of ['settings', 'account-dialog', ...(width < 861 ? ['more-sheet'] : [])]) {
        if (id === 'settings') {
          if (width < 861) { await page.locator('#open-more-sheet').click(); await page.locator('#sheet-open-settings').click(); }
          else await page.locator('#open-settings').click();
        } else if (id === 'account-dialog') await page.locator('#account-btn').click();
        else await page.locator('#open-more-sheet').click();
        await page.waitForTimeout(550);
        const rect = await page.locator(`#${id}`).boundingBox();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width + 1 && rect.y >= 0 && rect.y + rect.height <= height + 1, `${id}: fuera del viewport`);
        if (width <= 640 || id === 'more-sheet') assert.ok(Math.abs(height - rect.y - rect.height) <= 1, `${id}: hueco inferior`);
        if (id === 'settings' && width === 390) {
          await page.setViewportSize({ width, height: 420 });
          await page.locator('#settings input[name="inspection"]').focus();
          await page.waitForTimeout(150);
          const compact = await page.locator('#settings').boundingBox();
          assert.ok(compact.y >= 0 && compact.y + compact.height <= 421, 'sheet con altura reducida');
          assert.ok(await page.locator('#settings input[name="inspection"]').evaluate((el) => el === document.activeElement));
          await page.setViewportSize({ width, height });
        }
        await page.keyboard.press('Escape');
      }
    }
    await page.goto(BASE + '#/entrenar');
    await page.waitForFunction(() => document.querySelector('.trainer-scramble')?.textContent && !document.querySelector('.trainer-scramble').textContent.includes('Generando'));
    await page.locator('#view-trainer [data-action="none"]').click();
    assert.ok(await page.locator('.trainer-empty').isVisible());
    await page.locator('#view-trainer [data-action="all"]').click();
    await page.waitForFunction(() => !document.querySelector('.trainer-scramble').textContent.includes('Generando'));
    await page.keyboard.press('Tab');
    await page.locator('.trainer-pad').focus();
    assert.equal(await page.locator('.trainer-pad').evaluate((el) => getComputedStyle(el).outlineStyle), 'solid');
    await page.keyboard.down('Space'); await page.waitForTimeout(450); await page.keyboard.up('Space');
    await page.waitForFunction(() => document.body.dataset.phase === 'running');
    await page.waitForTimeout(350); await page.keyboard.press('Space');
    assert.ok(await page.locator('.trainer-last').isVisible());
    assert.equal(await page.locator('.trainer-cube twisty-player').count(), 1);
    await page.goto(BASE + '#/metodos/mirror');
    await page.waitForSelector('.hero-cube-stage .mirror-viewer');
    assert.equal(await page.locator('.hero-cube-stage .mirror-viewer').count(), 1);
    await page.goto(BASE + '#/notacion/mirror');
    await page.waitForSelector('#notation-stage-box .mirror-viewer');
    assert.equal(await page.locator('#notation-stage-box .mirror-viewer').count(), 1);
    await page.goto(BASE + '#/timer');
    await page.waitForSelector('#timer-zone');
    await page.evaluate(() => { document.querySelector('#update-banner').hidden = false; document.querySelector('#offline-toast').hidden = false; });
    await page.waitForTimeout(350);
    const banner = await page.locator('#update-banner').boundingBox();
    assert.ok(banner.y >= 0 && banner.y < 32 && banner.x >= 0 && banner.x + banner.width <= width, 'aviso arriba');
    assert.ok((await page.locator('#update-btn').boundingBox()).height >= 48);
    assert.equal(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)), width);
    assert.deepEqual(errors, []);
    console.log(`✔ ${width}×${height}: player estable, sheets sin hueco (normal/reduce), foco, entrenador real, Mirror único y avisos`);
    await context.close();
  }
} finally { await browser.close(); }
