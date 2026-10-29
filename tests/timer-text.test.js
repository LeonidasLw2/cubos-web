import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimerText } from '../src/timer-text.js';

test('timer text: conserva texto, spans y centésimos en todos los estados', () => {
  let created = 0;
  const element = {
    textContent: '0.00',
    ownerDocument: { createElement: () => { created++; return { textContent: '' }; } },
    replaceChildren(...children) { this.children = children; },
  };
  const update = createTimerText(element);
  const spans = [...element.children];
  for (const text of ['0.00', '12.34', '10:23.45', '15', '+2', 'DNF', 'DNF(10:23.45)', '14.34+', 'Resolviendo...']) {
    update(text);
    assert.equal(element.children.map((span) => span.textContent).join(''), text);
    assert.deepEqual(element.children, spans);
    assert.equal(spans[1].textContent, /\.\d{2}/.test(text) ? text.slice(text.indexOf('.')) : '');
  }
  assert.equal(created, 2);
  assert.equal(spans[1].className, 'timer-decimals');
});
