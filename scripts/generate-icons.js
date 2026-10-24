// Genera los íconos PNG de la app a partir de los SVG de public/.
// Uso: npm run icons (solo hace falta volver a correrlo si cambia el diseño).
//   icon.svg          → pwa-192x192.png, pwa-512x512.png (íconos normales, con esquinas redondeadas)
//   icon-maskable.svg → maskable-icon-512x512.png (Android le aplica su propia forma)
//                       apple-touch-icon-180x180.png (iOS también redondea solo)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC = new URL('../public/', import.meta.url);

const OUTPUTS = [
  { from: 'icon.svg', to: 'pwa-192x192.png', size: 192 },
  { from: 'icon.svg', to: 'pwa-512x512.png', size: 512 },
  { from: 'icon-maskable.svg', to: 'maskable-icon-512x512.png', size: 512 },
  { from: 'icon-maskable.svg', to: 'apple-touch-icon-180x180.png', size: 180 },
];

for (const { from, to, size } of OUTPUTS) {
  const svg = await readFile(new URL(from, PUBLIC));
  // density alta para que el SVG se dibuje nítido antes de achicarlo
  await sharp(svg, { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(to, PUBLIC)));
  console.log(`✔ ${to} (${size}×${size})`);
}
