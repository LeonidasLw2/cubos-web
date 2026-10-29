// Crea los spans una vez; cada cuadro conserva el mismo texto accesible y los mismos elementos.
export function createTimerText(element) {
  const whole = element.ownerDocument.createElement('span');
  const decimals = element.ownerDocument.createElement('span');
  decimals.className = 'timer-decimals';
  const initial = element.textContent;
  element.replaceChildren(whole, decimals);
  const update = (text) => {
    const dot = text.search(/\.\d{2}/);
    const head = dot < 0 ? text : text.slice(0, dot);
    const tail = dot < 0 ? '' : text.slice(dot);
    if (whole.textContent !== head) whole.textContent = head;
    if (decimals.textContent !== tail) decimals.textContent = tail;
  };
  update(initial);
  return update;
}
