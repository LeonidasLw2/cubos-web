// Regenera los iconos web y PWA con npm run icons.
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../src/assets/cube-tempo-icon.png', import.meta.url));
const publicDir = new URL('../public/', import.meta.url);
const outputs = [
  ['cube-tempo-64.png', 64],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-icon-512x512.png', 512],
  ['apple-touch-icon-180x180.png', 180],
];

for (const [name, size] of outputs) {
  const icon = sharp(source);
  if (name.startsWith('maskable')) {
    const inner = 400;
    const inset = (size - inner) / 2;
    icon.resize(inner).extend({
      top: inset, right: inset, bottom: inset, left: inset,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  } else {
    icon.resize(size, size);
  }
  await icon.png().toFile(fileURLToPath(new URL(name, publicDir)));
}
