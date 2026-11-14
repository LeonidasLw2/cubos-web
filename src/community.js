import { EVENTS } from './scramble.js';
import { loadSolves } from './storage.js';
import { effectiveTime, formatTime } from './stats.js';
import { cubeSvg } from './cube-art.js';

const KEY = 'cubos-web:community-preview';
const ICONS = {
  ice: ['Celeste', '#86d5ff'],
  lime: ['Verde', '#43cf88'],
  sun: ['Dorado', '#ffc756'],
};

export function publicName(value) {
  return Array.from(String(value ?? '').replace(/\s+/gu, ' ').trim()).slice(0, 32).join('') || 'Speedcuber';
}

export function eligibleBest(solves) {
  let best = Infinity;
  for (const solve of solves) {
    if (solve.source !== 'timer' || !solve.scramble || !Number.isSafeInteger(solve.time) || solve.time <= 0) continue;
    const time = effectiveTime(solve);
    if (Number.isSafeInteger(time) && time < best) best = time;
  }
  return Number.isFinite(best) ? best : null;
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY)) ?? {};
    return {
      name: publicName(data.name),
      icon: Object.hasOwn(ICONS, data.icon) ? data.icon : 'ice',
      photo: typeof data.photo === 'string' && data.photo.length < 50_000 && /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data.photo) ? data.photo : '',
      preview: data.preview === true,
    };
  } catch {
    return { name: 'Speedcuber', icon: 'ice', photo: '', preview: false };
  }
}

function avatar(profile) {
  const wrapper = document.createElement('span');
  wrapper.className = 'community-avatar';
  wrapper.setAttribute('aria-hidden', 'true');
  if (profile.photo) {
    const image = document.createElement('img');
    image.src = profile.photo;
    image.alt = '';
    wrapper.append(image);
  } else {
    wrapper.innerHTML = cubeSvg({ top: ICONS[profile.icon][1], left: '#8ba4bb', right: '#43698e' });
  }
  return wrapper;
}

function row(profile, time) {
  const item = document.createElement('div');
  item.className = 'community-row';
  const name = document.createElement('span');
  name.textContent = profile.name;
  const value = document.createElement('strong');
  value.textContent = time === null ? 'Sin marca' : formatTime(time);
  item.append(avatar(profile), name, value);
  return item;
}

async function thumbnail(file) {
  if (file.size > 5_000_000) throw new Error('Elegí una imagen de hasta 5 MB.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = [137,80,78,71,13,10,26,10].every((byte, i) => header[i] === byte);
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const webp = String.fromCharCode(...header.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  if (!png && !jpeg && !webp) throw new Error('Elegí una imagen PNG, JPEG o WebP.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 16_000_000) throw new Error('Elegí una imagen de hasta 16 megapíxeles.');
    const size = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    canvas.getContext('2d').drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 96, 96);
    const photo = canvas.toDataURL('image/webp', 0.8);
    if (!photo.startsWith('data:image/webp;base64,') || photo.length >= 50_000) throw new Error('No se pudo generar una miniatura compatible.');
    return photo;
  } finally {
    bitmap.close();
  }
}

function addPuzzles(select) {
  for (const event of EVENTS) select.add(new Option(event.name, event.id));
  select.value = '333';
}

export function initProfilePreview(section) {
  const name = section.querySelector('[name=publicName]');
  const icon = section.querySelector('[name=publicIcon]');
  const file = section.querySelector('[type=file]');
  const puzzle = section.querySelector('[name=previewPuzzle]');
  const preview = section.querySelector('.community-preview');
  const status = section.querySelector('[role=status]');
  const consent = section.querySelector('[name=previewConsent]');
  let profile = loadProfile();
  let photo = profile.photo;
  let revision = 0;
  addPuzzles(puzzle);
  for (const [key, [label]] of Object.entries(ICONS)) icon.add(new Option(label, key));
  name.value = profile.name;
  icon.value = profile.icon;
  consent.checked = profile.preview;
  const draft = () => ({ name: publicName(name.value), icon: icon.value, photo, preview: consent.checked });
  const refresh = () => preview.replaceChildren(row(draft(), eligibleBest(loadSolves(puzzle.value))));
  section.addEventListener('input', refresh);
  icon.addEventListener('change', () => {
    revision++;
    photo = '';
    refresh();
  });
  section.closest('dialog').addEventListener('close', () => { revision++; });
  section.querySelector('[data-reset-icon]').addEventListener('click', () => {
    revision++;
    photo = '';
    icon.value = 'ice';
    refresh();
  });
  file.addEventListener('change', async () => {
    const version = ++revision;
    const image = file.files[0];
    file.value = '';
    if (!image) return;
    try {
      const result = await thumbnail(image);
      if (revision !== version) return;
      photo = result;
      status.textContent = 'Miniatura lista para guardar.';
      refresh();
    } catch (error) {
      if (revision === version) status.textContent = error instanceof DOMException ? 'No se pudo leer la imagen.' : error.message;
    }
  });
  section.querySelector('[data-save-profile]').addEventListener('click', () => {
    const next = draft();
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      profile = next;
      name.value = profile.name;
      status.textContent = profile.preview ? 'Vista previa guardada en este dispositivo.' : 'Perfil local guardado. Vista previa retirada.';
      refresh();
    } catch {
      status.textContent = 'No se pudo guardar el perfil en este dispositivo.';
    }
  });
  section.querySelector('summary').addEventListener('click', refresh);
  refresh();
}

export function renderCommunity(container) {
  container.innerHTML = `<div class="methods-page community-page">
    <header class="page-head"><h2>Clasificación de la comunidad</h2>
    <p>Vista previa local. Las marcas públicas estarán disponibles después de validar los permisos del servicio.</p></header>
    <label>Cubo <select></select></label>
    <section aria-label="Marca de prueba" aria-live="polite" class="community-preview"></section>
    <p>Activá la vista previa desde Perfil de CubeSolver en Cuenta. Se usa el mejor intento elegible de este dispositivo.</p>
    <p>Las marcas de la comunidad se registran en el Timer de CubeSolver.</p>
  </div>`;
  const select = container.querySelector('select');
  addPuzzles(select);
  const refresh = () => {
    const profile = loadProfile();
    const time = eligibleBest(loadSolves(select.value));
    const list = container.querySelector('.community-preview');
    if (profile.preview && time !== null) list.replaceChildren(row(profile, time));
    else list.textContent = 'Todavía no hay una marca en la vista previa de este cubo.';
  };
  select.addEventListener('change', refresh);
  refresh();
}
