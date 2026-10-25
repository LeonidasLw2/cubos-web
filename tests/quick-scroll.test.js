// Pruebas unitarias para la barra lateral interactiva de desplazamiento rápido (quick-scroll.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateScrollRatio,
  calculateTargetScroll,
  calculateThumbOffset,
  getScrollBubbleLabel,
  initQuickScroll,
} from '../src/quick-scroll.js';

test('calculateScrollRatio calcula valores exactos y acota en los límites', () => {
  const trackH = 400;
  const thumbH = 40; // effectiveTrack = 360

  // Puntero arriba del todo (menos de la mitad del pulgar)
  assert.equal(calculateScrollRatio(10, trackH, thumbH), 0);
  assert.equal(calculateScrollRatio(-50, trackH, thumbH), 0);

  // Puntero exactamente en el centro del pulgar en la cima
  assert.equal(calculateScrollRatio(20, trackH, thumbH), 0);

  // Puntero al 50% del recorrido útil
  assert.equal(calculateScrollRatio(200, trackH, thumbH), 0.5);

  // Puntero en el extremo inferior
  assert.equal(calculateScrollRatio(380, trackH, thumbH), 1);
  assert.equal(calculateScrollRatio(500, trackH, thumbH), 1);
});

test('calculateTargetScroll calcula el píxel de scroll objetivo proporcional', () => {
  const scrollH = 3000;
  const clientH = 1000; // maxScroll = 2000

  assert.equal(calculateTargetScroll(0, scrollH, clientH), 0);
  assert.equal(calculateTargetScroll(0.25, scrollH, clientH), 500);
  assert.equal(calculateTargetScroll(0.5, scrollH, clientH), 1000);
  assert.equal(calculateTargetScroll(1, scrollH, clientH), 2000);
  assert.equal(calculateTargetScroll(1.5, scrollH, clientH), 2000);
  assert.equal(calculateTargetScroll(-0.5, scrollH, clientH), 0);
});

test('calculateThumbOffset calcula la traslación del thumb en píxeles', () => {
  const scrollH = 2000;
  const clientH = 1000; // maxScroll = 1000
  const trackH = 500;
  const thumbH = 50; // effectiveTrack = 450

  assert.equal(calculateThumbOffset(0, scrollH, clientH, trackH, thumbH), 0);
  assert.equal(calculateThumbOffset(500, scrollH, clientH, trackH, thumbH), 225);
  assert.equal(calculateThumbOffset(1000, scrollH, clientH, trackH, thumbH), 450);
});

test('getScrollBubbleLabel etiqueta Inicio, Final y porcentaje intermedio', () => {
  assert.equal(getScrollBubbleLabel(0), 'Inicio');
  assert.equal(getScrollBubbleLabel(0.03), 'Inicio');
  assert.equal(getScrollBubbleLabel(0.42), '42%');
  assert.equal(getScrollBubbleLabel(0.95), '95%');
  assert.equal(getScrollBubbleLabel(0.98), 'Final');
  assert.equal(getScrollBubbleLabel(1), 'Final');
});
