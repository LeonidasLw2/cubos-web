// Compara el style.css original (commit 25a2087) con src/styles/*.css.
// Lista selectores, @keyframes y condiciones de @media que faltan.
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ORIGINAL = '25a2087:src/style.css';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Borrados a propósito: clave -> motivo. Claves: "selector", "selector @ media", "@keyframes nombre", "@media cond".
const BORRADOS = {};

// Eliminación de la sección Solver (#/solver, src/solver*.js y src/styles/solver.css): sus selectores
// y su @media ya no existen a propósito. Si falta cualquier otra cosa, el script sigue fallando.
const POR_SOLVER = [
  ".solver-page",
  ".solver-hero",
  ".solver-hero h1",
  ".solver-lead",
  ".solver-puzzle-bar",
  ".solver-puzzle-chip",
  ".solver-puzzle-chip:hover",
  ".solver-puzzle-chip.is-active",
  ".solver-mode-tabs",
  ".solver-mode-btn",
  ".solver-mode-btn:hover",
  ".solver-mode-btn.is-active",
  ".solver-orientation-banner",
  ".solver-workspace",
  ".solver-workspace @ @media (max-width: 980px)",
  ".solver-editor-card",
  ".solver-player-card",
  ".solver-card-head",
  ".solver-card-head h2",
  ".solver-sub",
  ".solver-history-btns",
  ".solver-palette",
  ".solver-color-btn",
  ".solver-color-btn:hover",
  ".solver-color-btn.is-selected",
  ".solver-color-swatch",
  ".solver-color-info",
  ".solver-color-name",
  ".solver-color-count",
  ".solver-color-btn.is-complete .solver-color-count",
  ".solver-color-btn.is-over .solver-color-count",
  ".solver-quick-actions",
  ".solver-view-switch",
  ".solver-view-switch .btn-secondary.is-active",
  ".solver-load-scramble-details",
  ".solver-load-scramble-details summary",
  ".solver-load-scramble-box",
  ".solver-load-scramble-box input",
  ".solver-paste-feedback",
  ".solver-face-tabs",
  ".solver-face-tab",
  ".solver-face-tab.is-active",
  ".solver-face-current-title",
  ".solver-net-wrapper",
  ".solver-cube-net",
  ".solver-net-row",
  ".solver-net-face",
  ".solver-net-face-label",
  ".solver-face-grid",
  ".solver-sticker-btn",
  ".solver-cube-net[data-size='2'] .solver-sticker-btn",
  ".solver-cube-net[data-size='4'] .solver-sticker-btn",
  ".solver-cube-net[data-size='5'] .solver-sticker-btn",
  ".solver-single-face-wrap",
  ".solver-face-header",
  ".solver-face-grid-zoom",
  ".solver-face-grid-zoom .solver-sticker-btn",
  ".solver-sticker-btn:hover",
  ".solver-sticker-btn.is-fixed-center",
  ".solver-center-letter",
  ".solver-sticker-btn.is-error",
  ".solver-pyraminx-net",
  ".solver-pyr-row-top",
  ".solver-pyr-face-card",
  ".solver-pyr-svg",
  ".solver-pyr-poly",
  ".solver-pyr-poly:hover",
  ".solver-pyr-poly.is-error",
  ".solver-validation-box",
  ".solver-validation-box.is-valid",
  ".solver-validation-box.is-invalid",
  ".solver-val-ok",
  ".solver-val-badge",
  ".solver-validation-box.is-valid .solver-val-badge",
  ".solver-validation-box.is-invalid .solver-val-badge",
  ".solver-val-list",
  ".solver-solve-actions",
  ".solver-solve-btn",
  ".solver-progress-card",
  ".solver-progress-head",
  ".solver-progress-bar",
  ".solver-progress-fill",
  ".solver-undo-scramble-form",
  ".solver-label",
  ".solver-undo-textarea",
  ".solver-3d-stage",
  ".solver-3d-stage twisty-player",
  ".solver-3d-stage .mirror-viewer",
  ".solver-solved-badge",
  ".solver-empty-solution",
  ".solver-solution-panel",
  ".solver-solution-summary",
  ".solver-solution-summary h3",
  ".solver-stage-pill",
  ".solver-step-counter",
  ".solver-move-callout",
  ".solver-move-next-info",
  ".solver-move-token-badge",
  ".solver-move-badge-label",
  ".solver-move-badge-tok",
  ".solver-move-face-tag",
  ".solver-move-text",
  ".solver-move-explain",
  ".solver-notation-link",
  ".solver-notation-link:hover",
  ".solver-transport-controls",
  ".solver-transport-controls button",
  ".solver-play-btn",
  ".solver-prefs-grid",
  ".solver-checkbox-row",
  ".solver-sliders-row",
  ".solver-slider-field",
  ".solver-slider-label-row",
  ".solver-slider-label-row output",
  ".solver-stages-list",
  ".solver-stage-block",
  ".solver-stage-header",
  ".solver-stage-count",
  ".solver-moves-chips",
  ".solver-move-chip",
  ".solver-move-chip .solver-chip-num",
  ".solver-move-chip.is-done",
  ".solver-move-chip.is-current",
  ".solver-move-chip.is-next",
  ".solver-practice-bar",
  ".solver-footer-note",
  ".solver-footer-note p",
  ".solver-footer-note a",
  "@media (max-width: 980px)",
];
for (const k of POR_SOLVER) BORRADOS[k] = 'Eliminación de la sección Solver';

const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Parte "a, b" por comas de nivel 0 (respeta paréntesis como :is(a, b)).
function splitSelectors(sel) {
  const out = []; let depth = 0, cur = '';
  for (const ch of sel) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map(norm).filter(Boolean);
}

// Devuelve { selectors:Set, keyframes:Set, media:Set }
export function extract(css) {
  const res = { selectors: new Set(), keyframes: new Set(), media: new Set() };
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const walk = (text, ctx) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      const semi = text.indexOf(';', i);
      if (open === -1) break;
      if (semi !== -1 && semi < open) { i = semi + 1; continue; } // @import, etc.
      const prelude = norm(text.slice(i, open));
      let depth = 1, j = open + 1;
      while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (prelude.startsWith('@keyframes')) res.keyframes.add(prelude.split(' ')[1]);
      else if (/^@(media|supports|container)/.test(prelude)) {
        if (prelude.startsWith('@media') && prelude !== '@media (hover: hover)') res.media.add(norm(prelude.slice(6)));
        // Envolver un :hover en (hover: hover) no cambia qué reglas existen: se ignora ese contexto.
        const hover = prelude === '@media (hover: hover)';
        walk(body, hover ? ctx : ctx ? `${ctx} ${prelude}` : prelude);
      } else if (!prelude.startsWith('@')) {
        for (const s of splitSelectors(prelude)) res.selectors.add(ctx ? `${s} @ ${ctx}` : s);
      }
      i = j;
    }
  };
  walk(css, '');
  return res;
}

const old = extract(execSync(`git show ${ORIGINAL}`, { cwd: root, encoding: 'utf8', maxBuffer: 1e8 }));
const dir = path.join(root, 'src/styles');
const now = extract(readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(path.join(dir, f), 'utf8')).join('\n'));

const faltan = [];
for (const s of old.selectors) if (!now.selectors.has(s)) faltan.push(s);
for (const k of old.keyframes) if (!now.keyframes.has(k)) faltan.push(`@keyframes ${k}`);
for (const m of old.media) if (!now.media.has(m)) faltan.push(`@media ${m}`);

const reales = faltan.filter((k) => !(k in BORRADOS));
console.log(`Original: ${old.selectors.size} selectores, ${old.keyframes.size} keyframes, ${old.media.size} @media`);
console.log(`Borrados a propósito: ${faltan.length - reales.length}`);
if (reales.length) {
  console.log(`FALTAN ${reales.length}:`);
  for (const k of reales) console.log('  - ' + k);
  process.exit(1);
}
console.log('Faltan: 0');
