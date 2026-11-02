import test from 'node:test';
import assert from 'node:assert/strict';
import { rubberband, project, shouldClose, releaseVelocity } from '../src/sheet-drag.js';

test('rubberband: resiste y nunca pasa de la dimensión', () => {
  assert.equal(rubberband(0, 400), 0);
  assert.ok(rubberband(100, 400) < 100);
  assert.ok(rubberband(5000, 400) < 400);
});

test('project: la inercia crece con la velocidad', () => {
  assert.equal(project(0), 0);
  assert.ok(project(1000) > 400 && project(1000) < 600);
  assert.ok(project(-1000) < 0);
});

test('shouldClose: posición y velocidad deciden', () => {
  assert.equal(shouldClose(300, 0, 400), true); // pasó de la mitad, quieta
  assert.equal(shouldClose(100, 0, 400), false); // poco, quieta
  assert.equal(shouldClose(20, 800, 400), true); // lanzamiento hacia abajo
  assert.equal(shouldClose(300, -800, 400), false); // lanzamiento hacia arriba cancela
});

test('releaseVelocity: usa solo los últimos 100 ms', () => {
  const s = [{ t: 0, y: 0 }, { t: 950, y: 100 }, { t: 1000, y: 150 }];
  assert.equal(Math.round(releaseVelocity(s, 1000)), 1000);
  assert.equal(releaseVelocity([{ t: 1000, y: 0 }], 1000), 0);
});
