// Pruebas unitarias para tokens de diseño y contraste accesible WCAG 2.1.
// Verifica matemáticamente que todos los pares texto/fondo de los tokens cumplan
// con WCAG AA (>= 4.5:1 para texto normal y >= 3:1 para texto grande/controles).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Luminancia relativa según la especificación WCAG 2.1
function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Razón de contraste WCAG (L1 + 0.05) / (L2 + 0.05)
export function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseHex(hex) {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Extrae variables :root desde un archivo CSS
function extractRootTokens(cssContent) {
  const tokens = {};
  const rootMatch = cssContent.replace(/\/\*[\s\S]*?\*\//g, '').match(/:root\s*\{([^}]+)\}/s);
  if (!rootMatch) return tokens;
  const lines = rootMatch[1].split(';');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('--')) continue;
    const [name, ...valParts] = trimmed.split(':');
    const val = valParts.join(':').split('/*')[0].trim();
    tokens[name.trim()] = val;
  }
  return tokens;
}

test('tokens de diseño: contraste WCAG AA en todas las combinaciones texto/superficie', () => {
  // Buscamos tokens en src/styles/tokens.css (o src/style.css mientras migramos)
  let cssPath = path.resolve('src/styles/tokens.css');
  if (!fs.existsSync(cssPath)) cssPath = path.resolve('src/style.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const tokens = extractRootTokens(css);

  const surfaces = [
    { name: '--surface-solid', hex: tokens['--surface-solid'] || '#1a1a1d' },
    { name: '--bg-canvas', hex: tokens['--bg-canvas'] || '#050506' },
    { name: '--surface-1', hex: tokens['--surface-1'] || '#0e0e10' },
    { name: '--surface-2', hex: tokens['--surface-2'] || '#17171a' },
    { name: '--surface-3', hex: tokens['--surface-3'] || '#222226' },
    { name: '--surface-sheet', hex: tokens['--surface-sheet'] || '#0e0e10' },
  ];

  const texts = [
    { name: '--text-primary', hex: tokens['--text-primary'] || '#f5f5f7' },
    { name: '--text-secondary', hex: tokens['--text-secondary'] || '#a1a1a8' },
    { name: '--text-tertiary', hex: tokens['--text-tertiary'] || '#8e8e96' },
  ];

  // Cada texto debe tener al menos 4.5:1 de contraste en TODAS las superficies donde se presente
  for (const surf of surfaces) {
    for (const txt of texts) {
      const ratio = contrastRatio(txt.hex, surf.hex);
      assert.ok(
        ratio >= 4.5,
        `Contraste insuficiente para ${txt.name} (${txt.hex}) sobre ${surf.name} (${surf.hex}): ${ratio.toFixed(2)}:1 < 4.5:1`
      );
    }
  }
});

test('tokens de diseño: acentos y elementos grandes cumplen WCAG >= 3.0:1', () => {
  const tokens = extractRootTokens(fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8'));

  const bg = tokens['--bg-canvas'] || '#050506';
  assert.ok(contrastRatio(tokens['--text-disabled'], bg) >= 3, 'el borde de la zona táctil debe distinguirse del lienzo');
  const accents = [
    { name: '--c-celeste', hex: tokens['--c-celeste'] || '#74acdf' },
    { name: '--c-sol', hex: tokens['--c-sol'] || '#f6b40e' },
  ];

  for (const acc of accents) {
    const ratio = contrastRatio(acc.hex, bg);
    assert.ok(
      ratio >= 3.0,
      `Contraste insuficiente para acento ${acc.name} (${acc.hex}) sobre fondo ${bg}: ${ratio.toFixed(2)}:1 < 3.0:1`
    );
  }
});

test('tokens de diseño: el azul del cubo se distingue claramente del celeste patrio', () => {
  const tokens = extractRootTokens(fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8'));

  const celeste = tokens['--c-celeste'] || '#74acdf';
  const cubeBlue = tokens['--c-cube-blue'] || '#2563eb';

  const [rC, gC, bC] = parseHex(celeste);
  const [rB, gB, bB] = parseHex(cubeBlue);

  // La luminancia del celeste patrio (#74acdf) es significativamente mayor a la del azul real (#2563eb)
  const lumC = relativeLuminance(rC, gC, bC);
  const lumB = relativeLuminance(rB, gB, bB);

  assert.ok(
    lumC > lumB * 2,
    `El celeste patrio (lum: ${lumC.toFixed(3)}) debe ser claramente más claro y distinto que el azul del cubo (lum: ${lumB.toFixed(3)})`
  );
  assert.notEqual(celeste.toLowerCase(), cubeBlue.toLowerCase(), 'No deben compartir el mismo valor hex');
});

test('tokens de diseño: el estado seleccionado y el botón primario se distinguen (>= 3:1) y se leen (>= 4.5:1)', () => {
  const tokens = extractRootTokens(fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8'));
  const accent = tokens['--c-celeste'];
  const onAccent = tokens['--on-accent'];
  assert.ok(contrastRatio(onAccent, accent) >= 4.5, 'el texto sobre el relleno de acento tiene que leerse');
  // Chip activo (relleno de acento) contra los vecinos sin seleccionar
  for (const n of ['--surface-1', '--surface-2', '--surface-3']) {
    const r = contrastRatio(accent, tokens[n]);
    assert.ok(r >= 3, `acento seleccionado contra ${n}: ${r.toFixed(2)}:1 < 3:1`);
  }
});

test('tokens de diseño: fondo casi negro, timer con peso >= 300 y una sola familia tipográfica', () => {
  const tokens = extractRootTokens(fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8'));
  const [r, g, b] = parseHex(tokens['--bg-canvas']);
  assert.ok(relativeLuminance(r, g, b) < 0.005, 'el fondo tiene que estar cerca del negro');
  assert.ok(Number(tokens['--timer-weight']) >= 300, 'dígitos del timer: peso mínimo 300');
  assert.match(tokens['--font-sans'], /^'Inter'/);
  assert.equal(tokens['--font-mono'], 'var(--font-sans)', 'sin segunda familia para números: tabular-nums');
});
