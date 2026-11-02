// QA de hojas arrastrables: 1:1, regreso, cierre por velocidad, rubber-band, Esc y botón. Requiere `npm run preview`.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:4173/cubos-web/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE + '#/timer');
await page.waitForSelector('#open-more-sheet');
const ty = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.getElementById('more-sheet')).transform).m42);
const isOpen = () => page.evaluate(() => document.getElementById('more-sheet').open);
const open = async () => { await page.click('#open-more-sheet'); await page.waitForFunction(() => document.getElementById('more-sheet').getAnimations().length === 0); };
const handle = async () => { const b = await page.locator('#more-sheet .sheet-handle').boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

await open();
let h = await handle();
// 1:1: el arrastre de 120 px mueve la hoja 120 px
await page.mouse.move(h.x, h.y); await page.mouse.down();
for (let i = 1; i <= 12; i++) { await page.mouse.move(h.x, h.y + i * 10); await page.waitForTimeout(25); }
assert.ok(Math.abs((await ty()) - 120) < 2, `1:1 (${await ty()})`);
// soltar quieto y poco: vuelve y sigue abierta
await page.waitForTimeout(250); await page.mouse.up(); await page.waitForTimeout(500);
assert.equal(await isOpen(), true); assert.ok(Math.abs(await ty()) < 1, 'volvió a 0');
// rubber-band hacia arriba: se mueve menos que el dedo y poco
await page.mouse.move(h.x, h.y); await page.mouse.down();
for (let i = 1; i <= 10; i++) { await page.mouse.move(h.x, h.y - i * 20); await page.waitForTimeout(20); }
const up = await ty(); assert.ok(up < 0 && up > -150, `rubber-band ${up}`);
await page.mouse.up(); await page.waitForTimeout(500);
// lanzamiento rápido corto: cierra
await page.mouse.move(h.x, h.y); await page.mouse.down();
for (let i = 1; i <= 5; i++) { await page.mouse.move(h.x, h.y + i * 16); await page.waitForTimeout(8); }
await page.mouse.up(); await page.waitForTimeout(700);
assert.equal(await isOpen(), false, 'lanzamiento cierra');
// Esc y botón de cerrar siguen funcionando
await open(); await page.keyboard.press('Escape'); await page.waitForTimeout(200); assert.equal(await isOpen(), false, 'Esc');
await open(); await page.click('#close-more-sheet'); await page.waitForTimeout(200); assert.equal(await isOpen(), false, 'botón');
// el estado queda limpio al reabrir
await open(); assert.equal(await ty(), 0); assert.equal(await page.evaluate(() => document.getElementById('more-sheet').style.transform), '');
// reduced-motion: el cierre es inmediato
await page.emulateMedia({ reducedMotion: 'reduce' });
h = await handle(); await page.mouse.move(h.x, h.y); await page.mouse.down();
for (let i = 1; i <= 30; i++) { await page.mouse.move(h.x, h.y + i * 10); await page.waitForTimeout(10); }
await page.mouse.up(); await page.waitForTimeout(100);
assert.equal(await isOpen(), false, 'reduced-motion cierra al instante');
await page.emulateMedia({ reducedMotion: 'no-preference' });
// Ajustes y Cuenta (hojas en celular): tirador insertado, touch-action y arrastre que cierra
for (const id of ['settings', 'account-dialog']) {
  await page.evaluate((i) => document.getElementById(i).showModal(), id);
  await page.waitForFunction((i) => document.getElementById(i).getAnimations().length === 0, id);
  const info = await page.evaluate((i) => { const d = document.getElementById(i), g = d.querySelector(':scope > .sheet-handle'); return { grip: !!g, ta: g && getComputedStyle(g).touchAction, ob: getComputedStyle(d).overscrollBehaviorY }; }, id);
  assert.deepEqual(info, { grip: true, ta: 'none', ob: 'contain' }, id);
  const b = await page.locator(`#${id} > .sheet-handle`).boundingBox();
  await page.mouse.move(b.x + 16, b.y + 2); await page.mouse.down();
  for (let i = 1; i <= 25; i++) { await page.mouse.move(b.x + 16, b.y + 2 + i * 20); await page.waitForTimeout(10); }
  await page.mouse.up(); await page.waitForTimeout(500);
  assert.equal(await page.evaluate((i) => document.getElementById(i).open, id), false, `${id} cierra al arrastrar`);
}
assert.deepEqual(errors, []);
console.log('✔ hojas: 1:1, regreso, rubber-band, cierre por velocidad, Esc, botón y reduced-motion');
await browser.close();
