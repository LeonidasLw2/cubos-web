// Mide los scrambles largos (5x5, 7x7, Megaminx) en celular: tamaño, líneas, zona del timer.
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://localhost:4173/cubos-web/#/timer';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [360, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: +(process.argv[3] || 800) }, hasTouch: true });
  await page.goto(URL);
  await page.waitForSelector('#scramble');
  for (const ev of ['555', '777', 'minx', 'pyram', '333']) {
    await page.evaluate((e) => document.querySelector(`[data-event="${e}"]`)?.click(), ev);
    await page.waitForFunction(() => !document.querySelector('#scramble').classList.contains('loading') && !/Generando/.test(document.querySelector('#scramble').textContent), null, { timeout: 20000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const s = document.querySelector('#scramble'), cs = getComputedStyle(s);
      const z = document.querySelector('.timer-zone').getBoundingClientRect();
      const nav = document.querySelector('.bottom-nav').getBoundingClientRect();
      return { chars: s.textContent.length, fs: cs.fontSize, lh: cs.lineHeight, h: Math.round(s.getBoundingClientRect().height),
        zoneTop: Math.round(z.top), zoneH: Math.round(z.height), zoneBottom: Math.round(z.bottom), navTop: Math.round(nav.top),
        overflowX: document.documentElement.scrollWidth - innerWidth, long: document.querySelector('#scramble-card').classList.contains('long') };
    });
    console.log(w, ev, JSON.stringify(m));
    if (w === 360 && (ev === '777' || ev === 'minx')) await page.screenshot({ path: `/tmp/sc-${w}-${ev}.png` });
  }
  await page.close();
}
await browser.close();
