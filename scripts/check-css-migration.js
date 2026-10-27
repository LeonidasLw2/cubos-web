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
