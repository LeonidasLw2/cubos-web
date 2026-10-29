// Humo de interfaz: recorre las rutas a varios anchos y reporta errores de consola,
// desborde horizontal y si el timer entra completo en pantalla. También prueba el flujo del timer.
// Uso: npm run build && npm run preview   (en otra terminal)   →   node scripts/smoke-ui.mjs [url]
// Necesita playwright-core (no está en package.json): PLAYWRIGHT_MODULE=/ruta/a/playwright-core/index.mjs
const BASE = (process.argv[2] ?? 'http://localhost:4173/cubos-web/').replace(/\/?$/, '/');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright-core');

const ROUTES = ['#/timer', '#/metodos', '#/metodos/3x3', '#/metodos/3x3/cfop', '#/metodos/2x2', '#/metodos/4x4',
  '#/metodos/mirror', '#/notacion', '#/notacion/mirror', '#/entrenar'];
const SIZES = [[360, 640], [360, 800], [390, 844], [412, 915], [667, 375], [768, 1024], [1280, 800]];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let fails = 0;
const fail = (msg) => { fails++; console.log('  ✖ ' + msg); };

for (const [w, h] of SIZES) {
  const mobile = w < 861 || h < 500;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  console.log(`\n${w}×${h}`);

  for (const route of ROUTES) {
    errors.length = 0;
    await page.goto(BASE + route);
    await page.reload();
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const over = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth;
      const z = document.querySelector('#timer-zone')?.getBoundingClientRect();
      const nav = document.querySelector('.bottom-nav');
      const navTop = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : innerHeight;
      const head = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
      return { over, zone: z && { top: Math.round(z.top), bottom: Math.round(z.bottom), visible: z.height > 0 }, navTop: Math.round(navTop), head: Math.round(head) };
    });
    const bad = [];
    if (errors.length) bad.push(`consola: ${errors[0].slice(0, 90)}`);
    if (m.over > 0) bad.push(`desborde horizontal ${m.over}px`);
    if (route === '#/timer') {
      if (!m.zone?.visible) bad.push('no hay zona del timer');
      else if (m.zone.top < m.head - 1 || m.zone.bottom > m.navTop + 1) bad.push(`el timer no entra sin scroll (zona ${m.zone.top}–${m.zone.bottom}, límite ${m.head}–${m.navTop})`);
    }
    console.log(`  ${bad.length ? '✖' : '✔'} ${route.padEnd(20)} ${bad.join(' | ')}${route === '#/timer' && m.zone ? ` zona ${m.zone.top}–${m.zone.bottom} de ${m.navTop}` : ''}`);
    if (bad.length) fails++;
  }

  // Rutas viejas del Solver: redirigen al Timer
  await page.goto(BASE + '#/solver/mirror'); await page.reload(); await page.waitForTimeout(800);
  const hash = await page.evaluate(() => location.hash);
  console.log(`  ${hash === '#/timer' ? '✔' : '✖'} #/solver/mirror → ${hash}`);
  if (hash !== '#/timer') fails++;

  // Flujo del timer (teclado): inspección → resolución → resultado → +2 → DNF
  if (w === 360 || w === 1280 || w === 667) {
    await page.goto(BASE + '#/timer'); await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(1500);
    errors.length = 0;
    const phase = () => page.evaluate(() => document.body.dataset.phase ?? 'idle');
    const steps = [];
    await page.keyboard.down('Space'); await page.waitForTimeout(800); await page.keyboard.up('Space'); await page.waitForTimeout(300);
    steps.push(['inspección', await phase()]);
    await page.keyboard.down('Space'); await page.waitForTimeout(800); await page.keyboard.up('Space'); await page.waitForTimeout(1300); // en inspección también hay que mantener
    steps.push(['resolviendo', await phase()]);
    await page.keyboard.down('Space'); await page.keyboard.up('Space'); await page.waitForTimeout(600);
    const text = await page.locator('#timer').textContent();
    steps.push(['resultado', /^\d+\.\d\d$/.test(text.trim()) && text.trim() !== '0.00' ? 'result ' + text.trim() : 'sin resultado: ' + text]);
    const press = async (a) => { try { await page.locator(`[data-action="${a}"]`).first().click({ timeout: 3000 }); } catch {} await page.waitForTimeout(200); return page.locator(`[data-action="${a}"]`).first().getAttribute('aria-pressed'); };
    const plus2 = await press('plus2');
    const dnf = await press('dnf');
    steps.push(['+2', plus2 === 'true' ? 'activo' : 'no se activó'], ['DNF', dnf === 'true' ? 'activo' : 'no se activó']);
    const ok = steps[0][1] === 'inspection' && steps[1][1] === 'running' && steps[2][1].startsWith('result') && plus2 === 'true' && dnf === 'true' && !errors.length;
    console.log(`  ${ok ? '✔' : '✖'} flujo del timer: ${steps.map(([a, b]) => `${a}=${b}`).join(', ')}${errors.length ? ' | consola: ' + errors[0].slice(0, 80) : ''}`);
    if (!ok) fails++;
  }
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} problema(s)` : '\nTodo en orden');
process.exit(fails ? 1 : 0);
