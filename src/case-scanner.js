import { buildCaseIndex, identifyCase } from './case-identification.js';
import { COLORS, sampleFace } from './case-photo.js';
import { cubeSvg } from './cube-art.js';
import { casePreviewSvg } from './case-preview.js';

const FACES = { U: 'Superior', F: 'Frente', R: 'Derecha', B: 'Trasera', L: 'Izquierda' };
import { CASE_FAMILIES } from './case-families.js';

const indexes = new Map();

export function openCaseScanner(initialFamily, trigger) {
  if (document.getElementById('case-scanner')) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'case-scanner';
  dialog.className = 'case-scanner';
  dialog.setAttribute('aria-labelledby', 'scanner-title');
  dialog.innerHTML = `
    <header><h2 id="scanner-title">Identificar caso</h2><form method="dialog"><button class="chip-btn" autofocus>Cerrar</button></form></header>
    <label>Cubo <select data-size><option value="2">2×2×2</option><option value="3">3×3×3</option><option value="4">4×4×4</option></select></label>
    <label>Método y etapa <select data-family></select></label>
    <details><summary>No sé en qué etapa estoy</summary><div class="scanner-position"><div data-help-cube data-diagram aria-hidden="true"></div><p data-help></p></div></details>
    <label data-confirm-wrap hidden><input type="checkbox" data-confirm> <span data-prerequisite></span> Confirmo este estado.</label>
    <section data-work hidden>
      <div class="scanner-position">
        <div data-diagram aria-hidden="true"></div>
        <div><label>Vista <select data-face>${Object.entries(FACES).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label>
        <p data-instruction></p></div>
      </div>
      <div class="scanner-actions">
        <button type="button" class="chip-btn" data-camera>Abrir cámara</button>
        <button type="button" class="chip-btn" data-file>Elegir foto</button>
        <input type="file" accept="image/*" hidden>
        <button type="button" class="chip-btn" data-manual>Cargar colores manualmente</button>
      </div>
      <div class="scanner-live" hidden><video playsinline muted></video><span aria-hidden="true"></span></div>
      <button type="button" class="chip-btn" data-capture hidden>Capturar</button>
      <div data-photo hidden>
        <p>Marcá las cuatro esquinas de la cara: arriba izquierda, arriba derecha, abajo derecha y abajo izquierda.</p>
        <canvas tabindex="0" aria-label="Foto. Flechas para mover el punto, Intro para marcar esquina"></canvas>
        <button type="button" class="chip-btn" data-repeat>Volver a marcar esquinas</button>
      </div>
      <div data-editor hidden><p>Revisá los colores. Dejá como «Desconocido» lo que no puedas confirmar.</p>
        <div class="scanner-grid" data-grid></div>
        <button type="button" class="chip-btn" data-save>Confirmar esta vista</button>
      </div>
      <p data-progress></p>
    </section>
    <p role="status" data-status></p>
    <section data-result hidden></section>
  `;
  const find = (selector) => dialog.querySelector(selector);
  const family = find('[data-family]');
  const cubeSize = find('[data-size]');
  const size = () => Number(cubeSize.value);
  const confirmation = find('[data-confirm]');
  const face = find('[data-face]');
  const video = find('video');
  const canvas = find('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const file = find('input[type=file]');
  const status = find('[data-status]');
  const result = find('[data-result]');
  let observations = {};
  let stream;
  let cameraRequest = 0;
  let imageRequest = 0;
  let photo;
  let points = [];
  let cursor = [0, 0];
  let index;
  let sourceLabel = '';

  function stopCamera() {
    cameraRequest++;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
    find('.scanner-live').hidden = true;
    find('[data-capture]').hidden = true;
  }

  function clearPhoto() {
    imageRequest++;
    photo = null;
    points = [];
    canvas.width = 1;
    canvas.height = 1;
    find('[data-photo]').hidden = true;
  }

  function updateFace() {
    stopCamera();
    clearPhoto();
    const top = observations.U?.center;
    const front = observations.F?.center;
    find('[data-work] [data-diagram]').innerHTML = cubeSvg({
      n: size(),
      top: COLORS[top]?.[1] ?? '#74bded',
      left: COLORS[observations[face.value === 'U' ? 'F' : face.value]?.center ?? front]?.[1] ?? '#626b7b',
      right: '#414754',
    });
    find('[data-instruction]').textContent = face.value === 'U'
      ? 'Fotografiá la cara superior de frente. La arista de tu frente de referencia debe quedar abajo en la imagen.'
      : `Poné el lado ${FACES[face.value].toLowerCase()} frente a la cámara. Girá el cubo entero con la última capa arriba. ${size() === 2 ? 'Mostrá las dos filas.' : 'Mostrá el centro y la fila superior.'} Mantené las capas quietas entre fotos.`;
    find('[data-editor]').hidden = true;
  }

  function setFamily() {
    observations = {};
    result.hidden = true;
    result.replaceChildren();
    status.textContent = '';
    find('[data-progress]').textContent = '';
    confirmation.checked = false;
    find('[data-work]').hidden = true;
    find('[data-confirm-wrap]').hidden = !family.value;
    find('[data-prerequisite]').textContent = CASE_FAMILIES[family.value]?.prerequisite ?? '';
    index = null;
    const selected = family.value;
    if (selected) {
      if (!indexes.has(selected)) {
        indexes.set(selected, buildCaseIndex(selected).catch((error) => { indexes.delete(selected); throw error; }));
      }
      indexes.get(selected).then((ready) => {
        if (family.value === selected) index = ready;
      }).catch(() => {
        if (family.value === selected) status.textContent = 'No pude preparar el catálogo. Volvé a elegir la etapa.';
      });
    }
    face.value = 'U';
    updateFace();
  }

  function editor(values, source) {
    sourceLabel = source;
    const grid = find('[data-grid]');
    grid.replaceChildren();
    const n = size();
    grid.style.setProperty('--scanner-columns', String(n));
    const cells = Array.from({ length: n * n }, (_, i) => i);
    const centers = n === 4 ? [5, 6, 9, 10] : [4];
    const indexes = face.value === 'U' || n === 2 ? cells : [...cells.slice(0, n), ...centers];
    if (n === 2 && face.value === 'U') indexes.push(4);
    for (const i of indexes) {
      const label = document.createElement('label');
      const row = Math.floor(i / n) + 1;
      const column = i % n + 1;
      label.textContent = n === 2 && i === 4 ? 'Color superior de referencia' : n > 2 && centers.includes(i) ? `Centro ${row}, ${column}` : `Fila ${row}, col. ${column}`;
      const select = document.createElement('select');
      select.dataset.cell = String(i);
      select.add(new Option('Desconocido', ''));
      for (const [key, [name]] of Object.entries(COLORS)) select.add(new Option(name, key));
      select.value = values[i] ?? '';
      const paint = () => label.style.setProperty('--sticker', COLORS[select.value]?.[1] ?? 'transparent');
      select.addEventListener('change', paint);
      paint();
      label.append(select);
      grid.append(label);
    }
    find('[data-editor]').hidden = false;
    grid.querySelector('select').focus({ preventScroll: true });
  }

  function manualValues() {
    const saved = observations[face.value];
    return saved?.values ?? [];
  }

  function showPhoto(source, width, height) {
    const scale = Math.min(1, 1000 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    photo = context.getImageData(0, 0, canvas.width, canvas.height);
    points = [];
    cursor = [Math.floor(canvas.width / 4), Math.floor(canvas.height / 4)];
    find('[data-photo]').hidden = false;
    status.textContent = 'Marcá la esquina superior izquierda de la cara.';
    canvas.focus();
  }

  function drawPoints() {
    context.putImageData(photo, 0, 0);
    context.fillStyle = '#71ccff';
    for (const [x, y] of [...points, cursor]) {
      context.beginPath();
      context.arc(x, y, Math.max(4, canvas.width / 100), 0, 2 * Math.PI);
      context.fill();
    }
  }

  function mark(point) {
    if (!photo || points.length >= 4) return;
    points.push(point);
    drawPoints();
    if (points.length < 4) {
      status.textContent = `Marcaste ${points.length} de 4 esquinas.`;
      return;
    }
    const values = sampleFace(photo, points, size());
    if (!values) {
      status.textContent = 'No pude ubicar la cara. Marcá cuatro esquinas separadas en el orden indicado.';
      return;
    }
    status.textContent = values.includes('') ? 'Hay colores dudosos. Revisá las casillas desconocidas.' : 'Revisá los colores antes de confirmar.';
    const previous = manualValues();
    for (const [i, color] of values.entries()) {
      if (!color && previous[i]) values[i] = previous[i];
    }
    if (size() === 2 && face.value === 'U') values[4] = observations.U?.center ?? '';
    editor(values, 'foto revisada');
  }

  function showResult(match) {
    result.replaceChildren();
    result.hidden = false;
    find('[data-work]').hidden = true;
    const title = document.createElement('h3');
    title.textContent = match.entry ? `${CASE_FAMILIES[family.value].label} · ${match.entry.name}${match.entry.nickname ? ` · ${match.entry.nickname}` : ''}` : 'La etapa ya está resuelta';
    const help = document.createElement('p');
    const color = (key) => COLORS[key]?.[0]?.toLowerCase();
    help.textContent = `Poné ${color(observations.U.center)} arriba y ${color(observations.F?.center) ?? 'tu frente de referencia'} hacia vos. Para orientar el cubo, giralo entero. Los ajustes U mueven solo la capa superior.`;
    result.append(title, help);
    const renderMove = (label, move) => {
      const row = document.createElement('p');
      const code = document.createElement('code');
      code.textContent = move;
      row.append(label, code);
      result.append(row);
    };
    if (match.flip) renderMove('Girá el cubo entero media vuelta alrededor del eje derecha–izquierda · ', match.flip);
    if (match.pre) renderMove('Ajuste inicial · ', match.pre);
    if (match.entry) {
      const diagram = document.createElement('div');
      diagram.className = 'scanner-case';
      diagram.innerHTML = casePreviewSvg(match.entry.alg, {
        stickering: CASE_FAMILIES[family.value].stickering ?? `4x4-${match.entry.id}`,
        puzzle: `${size()}x${size()}x${size()}`,
      });
      result.append(diagram);
      const prefix = match.entry.alg.match(/^\((U[2']?)\)\s+/);
      if (prefix) renderMove('Ajuste del catálogo · ', prefix[1]);
      renderMove('Algoritmo · ', prefix ? match.entry.alg.slice(prefix[0].length) : match.entry.alg);
      const link = document.createElement('a');
      link.href = `#/metodos/${CASE_FAMILIES[family.value].guide}?caso=${encodeURIComponent(match.entry.id)}`;
      link.textContent = 'Abrir este caso en la guía';
      link.addEventListener('click', () => dialog.close());
      const train = document.createElement('a');
      train.href = `#/entrenar?grupo=${family.value}&caso=${encodeURIComponent(match.entry.id)}`;
      train.textContent = 'Entrenar este caso';
      train.addEventListener('click', () => dialog.close());
      const actions = document.createElement('div');
      actions.className = 'scanner-actions';
      actions.append(link);
      if (family.value !== 'parity4') actions.append(train);
      result.append(actions);
    }
    if (match.post) renderMove('Alineación final · ', match.post);
    const explanation = document.createElement('p');
    explanation.textContent = CASE_FAMILIES[family.value].mask
      ? 'El algoritmo orienta la cara superior y conserva el prerrequisito de la etapa.'
      : 'Aplicá la alineación final si aparece.';
    const again = document.createElement('button');
    again.className = 'chip-btn';
    again.textContent = 'Volver a escanear';
    again.addEventListener('click', () => { setFamily(); confirmation.focus(); });
    if (match.remaining) explanation.textContent = `El algoritmo elimina la paridad. Después queda una ${match.remaining} normal que se resuelve con giros externos.`;
    const correct = document.createElement('button');
    correct.className = 'chip-btn';
    correct.textContent = 'Corregir colores o repetir una vista';
    correct.addEventListener('click', () => {
      result.hidden = true;
      find('[data-work]').hidden = false;
      editor(manualValues(), 'carga manual');
    });
    const controls = document.createElement('div');
    controls.className = 'scanner-actions';
    controls.append(again, correct);
    result.append(explanation, controls);
    title.tabIndex = -1;
    title.focus();
  }

  function updateChoices() {
    family.replaceChildren(new Option('Elegí una etapa', ''));
    for (const [key, entry] of Object.entries(CASE_FAMILIES)) {
      if (entry.size === size()) family.add(new Option(entry.label, key));
    }
    find('[data-help-cube]').innerHTML = cubeSvg({ n: size() });
    find('[data-help]').textContent = {
      2: '¿Ya armaste una cara abajo? Si arriba todavía tiene varios colores, elegí OLL. Si ambas caras están orientadas, elegí PBL.',
      3: '¿Están resueltas las dos primeras capas? Si la cara de arriba tiene varios colores, elegí OLL. Si es uniforme, elegí PLL.',
      4: '¿Están armados los centros, emparejadas las aristas y resueltas las dos primeras capas? Si es así, podés buscar las dos paridades de Reducción.',
    }[size()];
    setFamily();
  }

  cubeSize.value = String(CASE_FAMILIES[initialFamily]?.size ?? 3);
  updateChoices();
  family.value = initialFamily ?? '';
  cubeSize.addEventListener('change', updateChoices);
  confirmation.addEventListener('change', () => {
    find('[data-work]').hidden = !confirmation.checked;
    result.hidden = true;
    if (!confirmation.checked) { stopCamera(); clearPhoto(); result.hidden = true; }
  });
  family.addEventListener('change', setFamily);
  face.addEventListener('change', updateFace);
  find('[data-camera]').addEventListener('click', async () => {
    stopCamera();
    clearPhoto();
    const request = cameraRequest;
    status.textContent = 'Abriendo la cámara…';
    try {
      const incoming = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' } } });
      if (request !== cameraRequest || !dialog.open || document.hidden) {
        incoming.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = incoming;
      video.srcObject = stream;
      await video.play();
      if (request !== cameraRequest) return;
      find('.scanner-live').hidden = false;
      find('[data-capture]').hidden = false;
      status.textContent = 'Centrá la cara completa dentro del marco.';
    } catch (error) {
      if (request !== cameraRequest) return;
      stopCamera();
      status.textContent = error.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Podés elegir una foto o cargar los colores.'
        : 'Cámara no disponible. Podés elegir una foto o cargar los colores.';
    }
  });
  find('[data-capture]').addEventListener('click', () => {
    if (!video.videoWidth) return;
    showPhoto(video, video.videoWidth, video.videoHeight);
    stopCamera();
  });
  find('[data-file]').addEventListener('click', () => { stopCamera(); file.click(); });
  file.addEventListener('change', async () => {
    const image = file.files[0];
    file.value = '';
    if (!image) return;
    clearPhoto();
    const request = imageRequest;
    try {
      if (image.size > 12 * 1024 * 1024) throw new Error('size');
      const bitmap = await createImageBitmap(image);
      try {
        if (bitmap.width * bitmap.height > 40_000_000) throw new Error('dimensions');
        if (request === imageRequest && dialog.open) showPhoto(bitmap, bitmap.width, bitmap.height);
      } finally { bitmap.close(); }
    } catch (error) {
      if (request !== imageRequest) return;
      status.textContent = error.message === 'size' ? 'Elegí una foto de hasta 12 MB.'
        : error.message === 'dimensions' ? 'La foto supera 40 megapíxeles. Reducí su tamaño y probá otra vez.'
        : 'No pude abrir esa imagen. Probá otra foto.';
    }
  });
  find('[data-manual]').addEventListener('click', () => { stopCamera(); clearPhoto(); editor(manualValues(), 'carga manual'); });
  find('[data-repeat]').addEventListener('click', () => {
    points = [];
    drawPoints();
    status.textContent = 'Marcá de nuevo las cuatro esquinas.';
    canvas.focus();
  });
  canvas.addEventListener('click', (event) => {
    const box = canvas.getBoundingClientRect();
    mark([Math.floor((event.clientX - box.left) * canvas.width / box.width),
      Math.floor((event.clientY - box.top) * canvas.height / box.height)]);
  });
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); mark(cursor); return; }
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!delta) return;
    event.preventDefault();
    cursor = cursor.map((value, i) => Math.max(0, Math.min((i ? canvas.height : canvas.width) - 1, value + delta[i] * (event.shiftKey ? 1 : 8))));
    drawPoints();
  });

  find('[data-save]').addEventListener('click', () => {
    if (!index) { status.textContent = 'El catálogo todavía se está preparando.'; return; }
    const values = [];
    for (const select of find('[data-grid]').querySelectorAll('select')) values[select.dataset.cell] = select.value;
    const n = size();
    const center = n === 4 ? values[5] : n === 3 || face.value === 'U' ? values[4] : '';
    if ((n !== 2 || face.value === 'U') && !center) {
      status.textContent = n === 2 ? 'Elegí el color superior de referencia.' : 'Elegí el color de los centros de esta cara.';
      return;
    }
    if (n === 4 && [5, 6, 9, 10].some((i) => values[i] !== center)) {
      status.textContent = 'Revisá los cuatro centros de esta cara. Para reconocer la paridad deben coincidir.';
      return;
    }
    const cells = values.slice(0, face.value === 'U' || n === 2 ? n * n : n);
    observations[face.value] = { center, cells, values, source: sourceLabel };
    find('[data-progress]').textContent = `Vistas guardadas · ${Object.entries(observations).map(([key, value]) => `${FACES[key]} (${value.source})`).join(', ')}`;
    clearPhoto();
    result.hidden = true;
    const outcome = identifyCase(index, family.value, observations);
    if (outcome.result) {
      status.textContent = 'Caso confirmado con las vistas ingresadas.';
      showResult(outcome.result);
    } else if (outcome.next) {
      const count = new Set(outcome.candidates.map((candidate) => candidate.entry?.id)).size;
      status.textContent = `${count ? `Quedan ${count} casos compatibles o falta precisar el ajuste. ` : ''}Revisá la vista: ${FACES[outcome.next]}.`;
      face.value = outcome.next;
      updateFace();
      face.focus();
    } else {
      status.textContent = 'No pude confirmar el caso. Revisá la etapa, los centros y el orden de las vistas. También podés volver a la búsqueda de la guía.';
    }
  });

  const visibility = () => { if (document.hidden) stopCamera(); };
  const routeChanged = () => dialog.close();
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('hashchange', routeChanged);
  window.addEventListener('pagehide', stopCamera);
  dialog.addEventListener('close', () => {
    stopCamera();
    clearPhoto();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('hashchange', routeChanged);
    window.removeEventListener('pagehide', stopCamera);
    dialog.remove();
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  }, { once: true });
  document.body.append(dialog);
  setFamily();
  dialog.showModal();
}
