// Repositorio local-first y sincronización opcional en la nube (Firebase Auth + Cloud Firestore v9+ modular).
// Funciona 100 % sin cuenta ni conexión. Si FIREBASE_CONFIG está configurado y el usuario inicia sesión,
// sincroniza tiempos (users/{uid}/solves/{solveId}), ajustes (users/{uid}/meta/settings) y progreso
// de algoritmos aprendidos (users/{uid}/meta/progress).

import { FIREBASE_CONFIG, isFirebaseConfigured } from './firebase-config.js';
import { EVENTS } from './scramble.js';
import { loadSolves, saveSolves } from './storage.js';
import { loadSettings, saveSettings } from './settings.js';
import { loadLearnedMap, saveLearnedMap, mergeLearnedMaps } from './learned-store.js';

const TOMBSTONES_KEY_PREFIX = 'cubos-web:tombstones:';
const SYNC_META_KEY = 'cubos-web:sync-meta';
const SOLVER_PREFS_KEY = 'cubos-web:solver-prefs';
const BATCH_CHUNK_SIZE = 400; // Firestore permite hasta 500 operaciones por writeBatch

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizePhotoUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\/[^\s"'<>]+$/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '';
}

export const DEFAULT_SOLVER_PREFS = Object.freeze({
  stepDelaySec: 1.0, // 0 a 3 s, paso 0.1 s, por defecto 1 s
  turnSpeed: 1.2, // multiplicador tempoScale
});

export function sanitizeSolverPrefs(raw) {
  const obj = raw && typeof raw === 'object' ? raw : {};
  const delay = Number(obj.stepDelaySec);
  const speed = Number(obj.turnSpeed);
  return {
    stepDelaySec: Number.isFinite(delay) ? Math.min(3, Math.max(0, Math.round(delay * 10) / 10)) : DEFAULT_SOLVER_PREFS.stepDelaySec,
    turnSpeed: Number.isFinite(speed) && speed >= 0.3 && speed <= 4 ? Math.round(speed * 10) / 10 : DEFAULT_SOLVER_PREFS.turnSpeed,
  };
}

export function loadSolverPrefs() {
  try {
    const raw = localStorage.getItem(SOLVER_PREFS_KEY);
    return sanitizeSolverPrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_SOLVER_PREFS };
  }
}

export function saveSolverPrefs(prefs) {
  const clean = sanitizeSolverPrefs(prefs);
  try {
    localStorage.setItem(SOLVER_PREFS_KEY, JSON.stringify(clean));
  } catch {
    // Ignorar en modo privado sin espacio
  }
  touchLocalSettingsMeta();
  queueCloudSync();
  return clean;
}

export function generateSolveUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const isPenalty = (p) => p === '+2' || p === 'DNF';

/**
 * Normaliza un registro de tiempo (activo o tombstone eliminado) para almacenamiento y fusión.
 * Función pura exportada para tests unitarios.
 */
export function normalizeSolveRecord(raw, defaultPuzzle = '333') {
  if (!raw || typeof raw !== 'object') return null;
  const deleted = Boolean(raw.deleted);
  const time = typeof raw.time === 'number' && Number.isFinite(raw.time) && raw.time >= 0 ? raw.time : deleted ? 0 : null;
  if (time === null) return null;

  const date = typeof raw.date === 'number' && Number.isFinite(raw.date) ? raw.date : null;
  const updatedAt =
    typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
      ? raw.updatedAt
      : date ?? 1;

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : generateSolveUuid(),
    puzzle: typeof raw.puzzle === 'string' && raw.puzzle.trim() ? raw.puzzle.trim() : defaultPuzzle,
    time,
    penalty: isPenalty(raw.penalty) ? raw.penalty : null,
    autoPenalty: isPenalty(raw.autoPenalty) ? raw.autoPenalty : null,
    scramble: typeof raw.scramble === 'string' ? raw.scramble : null,
    session: typeof raw.session === 'string' && raw.session.trim() ? raw.session.trim() : 'main',
    date,
    updatedAt,
    deleted,
  };
}

/**
 * Fusiona dos listas de registros de tiempos (locales y remotos) sin perder ningún tiempo:
 * - Unión por `id`.
 * - Si el mismo `id` está en ambos lados, gana el que tenga `updatedAt` más reciente.
 * - Si `updatedAt` empata y alguno está marcado con `deleted: true`, prevalece el tombstone.
 * Función pura exportada para tests unitarios.
 */
export function mergeSolveRecords(localList = [], remoteList = [], defaultPuzzle = '333') {
  const byId = new Map();

  const ingest = (item) => {
    const rec = normalizeSolveRecord(item, item?.puzzle || defaultPuzzle);
    if (!rec) return;
    const prev = byId.get(rec.id);
    if (!prev) {
      byId.set(rec.id, rec);
      return;
    }
    if (rec.updatedAt > prev.updatedAt) {
      byId.set(rec.id, rec);
    } else if (rec.updatedAt === prev.updatedAt && rec.deleted && !prev.deleted) {
      byId.set(rec.id, rec);
    }
  };

  for (const item of localList) ingest(item);
  for (const item of remoteList) ingest(item);

  return Array.from(byId.values()).sort((a, b) => (a.date ?? 0) - (b.date ?? 0));
}

/**
 * Filtra los tiempos activos (no eliminados) listos para mostrar en la UI.
 */
export function activeSolvesFromRecords(records = []) {
  return records
    .filter((r) => r && !r.deleted)
    .sort((a, b) => (a.date ?? 0) - (b.date ?? 0));
}

/**
 * Filtra únicamente los registros que cambiaron después de `lastSyncAt` (sincronización incremental).
 */
export function getIncrementalChanges(records = [], lastSyncAt = 0) {
  return records.filter((r) => r && (r.updatedAt ?? 0) > lastSyncAt);
}

/**
 * Fusiona metadatos de ajustes entre local y nube según `updatedAt`.
 */
export function mergeSettingsMeta(localMeta, remoteMeta) {
  const lTime = Number(localMeta?.updatedAt || 0);
  const rTime = Number(remoteMeta?.updatedAt || 0);
  if (rTime > lTime && remoteMeta) {
    return {
      settings: remoteMeta.settings || {},
      solverPrefs: sanitizeSolverPrefs(remoteMeta.solverPrefs),
      updatedAt: rTime,
    };
  }
  return {
    settings: localMeta?.settings || {},
    solverPrefs: sanitizeSolverPrefs(localMeta?.solverPrefs),
    updatedAt: lTime || Date.now(),
  };
}

// ---------- Persistencia de Tombstones y Meta de Sincronización en localStorage ----------

function loadTombstones(eventId) {
  try {
    const raw = localStorage.getItem(`${TOMBSTONES_KEY_PREFIX}${eventId}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((r) => normalizeSolveRecord({ ...r, deleted: true }, eventId)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveTombstones(eventId, tombstones) {
  try {
    localStorage.setItem(`${TOMBSTONES_KEY_PREFIX}${eventId}`, JSON.stringify(tombstones));
  } catch {
    // Ignorar
  }
}

function loadSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : { lastSyncAt: 0, settingsUpdatedAt: 0, pendingSync: false };
  } catch {
    return { lastSyncAt: 0, settingsUpdatedAt: 0, pendingSync: false };
  }
}

function saveSyncMeta(patch) {
  const next = { ...loadSyncMeta(), ...patch };
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  } catch {
    // Ignorar
  }
  return next;
}

export function touchLocalSettingsMeta() {
  saveSyncMeta({ settingsUpdatedAt: Date.now(), pendingSync: true });
}

/**
 * Devuelve todos los registros locales (activos + tombstones) de una categoría.
 */
export function loadLocalRecordsForEvent(eventId) {
  const active = loadSolves(eventId).map((s) =>
    normalizeSolveRecord({ ...s, puzzle: eventId, deleted: false, updatedAt: s.updatedAt ?? s.date ?? 1 }, eventId),
  );
  const tombs = loadTombstones(eventId);
  return mergeSolveRecords(active, tombs, eventId);
}

/**
 * Guarda los registros fusionados de una categoría separando activos y tombstones.
 */
export function saveLocalRecordsForEvent(eventId, records) {
  const normalized = records.map((r) => normalizeSolveRecord(r, eventId)).filter(Boolean);
  const active = activeSolvesFromRecords(normalized);
  const tombs = normalized.filter((r) => r.deleted);
  saveSolves(eventId, active);
  saveTombstones(eventId, tombs);
  return active;
}

/**
 * Registra la eliminación de uno o más tiempos como tombstones para que no revivan al sincronizar.
 */
export function recordSolveDeletions(eventId, deletedSolves = []) {
  const now = Date.now();
  const existingTombs = loadTombstones(eventId);
  const newTombs = deletedSolves.map((s) =>
    normalizeSolveRecord(
      {
        ...s,
        puzzle: eventId,
        deleted: true,
        updatedAt: now,
      },
      eventId,
    ),
  );
  const mergedTombs = mergeSolveRecords(existingTombs, newTombs, eventId).filter((r) => r.deleted);
  saveTombstones(eventId, mergedTombs);
  saveSyncMeta({ pendingSync: true });
  queueCloudSync();
}

export function notifyLocalSolvesChanged() {
  saveSyncMeta({ pendingSync: true });
  queueCloudSync();
}

// ---------- Estado de sesión y sincronización ----------

let currentUser = null;
let syncState = isFirebaseConfigured() ? 'local' : 'unconfigured'; // 'unconfigured' | 'local' | 'syncing' | 'synced' | 'offline' | 'error'
let lastSyncedTimestamp = loadSyncMeta().lastSyncAt || 0;
let lastErrorMsg = '';
let firebaseCtxPromise = null;
let syncDebounceTimer = null;
const uiListeners = new Set();

export function onCloudSyncStateChange(fn) {
  uiListeners.add(fn);
  fn(getCloudSyncStatus());
  return () => uiListeners.delete(fn);
}

function emitState() {
  const status = getCloudSyncStatus();
  for (const fn of uiListeners) {
    try {
      fn(status);
    } catch {
      // Ignorar
    }
  }
}

export function formatRelativeSync(ts) {
  if (!ts) return 'Nunca';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 15) return 'hace instantes';
  if (diffSec < 60) return `hace ${diffSec} s`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ts));
}

export function getCloudSyncStatus() {
  const configured = isFirebaseConfigured();
  const online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  let effectiveState = syncState;
  if (!configured) effectiveState = 'unconfigured';
  else if (!online && currentUser) effectiveState = 'offline';

  const labels = {
    unconfigured: 'Sincronización no configurada',
    local: 'Local · Sin cuenta',
    syncing: 'Sincronizando...',
    synced: lastSyncedTimestamp ? `Sincronizado ${formatRelativeSync(lastSyncedTimestamp)}` : 'Sincronizado',
    offline: 'Sin conexión — guardado localmente',
    error: lastErrorMsg || 'Error de sincronización',
  };

  return {
    configured,
    online,
    user: currentUser,
    state: effectiveState,
    label: labels[effectiveState] || 'Local',
    lastSyncAt: lastSyncedTimestamp,
  };
}

// Carga diferida de Firebase v9+ modular
async function getFirebaseContext() {
  if (!isFirebaseConfigured()) return null;
  if (!firebaseCtxPromise) {
    firebaseCtxPromise = (async () => {
      const [{ initializeApp, getApps }, authMod, firestoreMod] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = authMod.getAuth(app);
      const db = firestoreMod.getFirestore(app);
      return { app, auth, db, authMod, firestoreMod };
    })();
  }
  return firebaseCtxPromise;
}

export function queueCloudSync() {
  if (!isFirebaseConfigured() || !currentUser) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    syncState = 'offline';
    emitState();
    return;
  }
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    syncNow().catch(() => {});
  }, 900);
}

/**
 * Ejecuta una sincronización bidireccional completa o incremental con Firestore.
 */
export async function syncNow({ full = false, onSolvesMerged = null } = {}) {
  if (!isFirebaseConfigured() || !currentUser) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    syncState = 'offline';
    emitState();
    return false;
  }

  syncState = 'syncing';
  lastErrorMsg = '';
  emitState();

  try {
    const ctx = await getFirebaseContext();
    if (!ctx || !currentUser) return false;
    const { db, firestoreMod } = ctx;
    const { collection, doc, getDocs, getDoc, setDoc, query, where, writeBatch } = firestoreMod;
    const uid = currentUser.uid;
    const meta = loadSyncMeta();
    const since = full ? 0 : Math.max(0, (meta.lastSyncAt || 0) - 5000);

    // 1. Descargar tiempos remotos modificados desde `since`
    const solvesCol = collection(db, 'users', uid, 'solves');
    const q = since > 0 ? query(solvesCol, where('updatedAt', '>', since)) : solvesCol;
    const snap = await getDocs(q);
    const remoteByPuzzle = new Map();
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const rec = normalizeSolveRecord({ ...data, id: docSnap.id }, data.puzzle || '333');
      if (!rec) return;
      if (!remoteByPuzzle.has(rec.puzzle)) remoteByPuzzle.set(rec.puzzle, []);
      remoteByPuzzle.get(rec.puzzle).push(rec);
    });

    // 2. Fusionar por cada categoría y preparar cambios a subir
    const toUpload = [];
    for (const ev of EVENTS) {
      const localRecords = loadLocalRecordsForEvent(ev.id);
      const remoteRecords = remoteByPuzzle.get(ev.id) || [];
      const merged = mergeSolveRecords(localRecords, remoteRecords, ev.id);
      saveLocalRecordsForEvent(ev.id, merged);

      const remoteMap = new Map(remoteRecords.map((r) => [r.id, r]));
      for (const rec of merged) {
        const rem = remoteMap.get(rec.id);
        if ((full && (!rem || rem.updatedAt < rec.updatedAt)) || rec.updatedAt > since) {
          toUpload.push(rec);
        }
      }
    }

    // Subir tiempos en lotes writeBatch de hasta 400 operaciones
    for (let i = 0; i < toUpload.length; i += BATCH_CHUNK_SIZE) {
      const slice = toUpload.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const rec of slice) {
        const ref = doc(db, 'users', uid, 'solves', rec.id);
        batch.set(ref, rec, { merge: true });
      }
      await batch.commit();
    }

    // 3. Sincronizar Ajustes (users/{uid}/meta/settings)
    const settingsRef = doc(db, 'users', uid, 'meta', 'settings');
    const settingsSnap = await getDoc(settingsRef);
    const localSettingsMeta = {
      settings: loadSettings(),
      solverPrefs: loadSolverPrefs(),
      updatedAt: meta.settingsUpdatedAt || 1,
    };
    const remoteSettingsMeta = settingsSnap.exists() ? settingsSnap.data() : null;
    const mergedSettings = mergeSettingsMeta(localSettingsMeta, remoteSettingsMeta);
    saveSettings(mergedSettings.settings);
    try {
      localStorage.setItem(SOLVER_PREFS_KEY, JSON.stringify(mergedSettings.solverPrefs));
    } catch {
      // Ignorar
    }
    await setDoc(settingsRef, mergedSettings, { merge: true });

    // 4. Sincronizar progreso de casos aprendidos (users/{uid}/meta/progress)
    const progressRef = doc(db, 'users', uid, 'meta', 'progress');
    const progressSnap = await getDoc(progressRef);
    const localLearned = loadLearnedMap();
    const remoteLearned = progressSnap.exists() ? progressSnap.data()?.learned || {} : {};
    const { merged: mergedLearned } = mergeLearnedMaps(localLearned, remoteLearned);
    saveLearnedMap(mergedLearned);
    await setDoc(progressRef, { learned: mergedLearned, updatedAt: Date.now() }, { merge: true });

    const now = Date.now();
    lastSyncedTimestamp = now;
    saveSyncMeta({
      lastSyncAt: now,
      settingsUpdatedAt: mergedSettings.updatedAt,
      pendingSync: false,
    });
    syncState = 'synced';
    emitState();
    if (typeof onSolvesMerged === 'function') onSolvesMerged();
    return true;
  } catch (err) {
    console.error('Error en sincronización con Firestore:', err);
    lastErrorMsg = 'No se pudo sincronizar (guardado localmente)';
    syncState = typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error';
    emitState();
    return false;
  }
}

export async function signInWithGoogle({ onSolvesMerged = null } = {}) {
  if (!isFirebaseConfigured()) return null;
  const ctx = await getFirebaseContext();
  if (!ctx) return null;
  const { auth, authMod } = ctx;
  const provider = new authMod.GoogleAuthProvider();
  const cred = await authMod.signInWithPopup(auth, provider);
  currentUser = cred.user;
  await syncNow({ full: true, onSolvesMerged });
  return currentUser;
}

export async function signOutAccount({ clearLocal = false, onSolvesMerged = null } = {}) {
  if (isFirebaseConfigured()) {
    const ctx = await getFirebaseContext();
    if (ctx) {
      await ctx.authMod.signOut(ctx.auth);
    }
  }
  currentUser = null;
  if (clearLocal) {
    for (const ev of EVENTS) {
      saveSolves(ev.id, []);
      saveTombstones(ev.id, []);
    }
    saveLearnedMap({});
    saveSyncMeta({ lastSyncAt: 0, pendingSync: false });
    if (typeof onSolvesMerged === 'function') onSolvesMerged();
  }
  syncState = isFirebaseConfigured() ? 'local' : 'unconfigured';
  emitState();
}

/**
 * Conecta el botón de Cuenta, el indicador de sincronización de la barra superior y el modal de Cuenta.
 */
export function initCloudSyncUI({ onDataUpdated, onExportBackup, onImportBackup } = {}) {
  const syncIndicator = document.getElementById('sync-indicator');
  const syncText = syncIndicator?.querySelector('.sync-text');
  const accountBtn = document.getElementById('account-btn');
  const accountLabel = accountBtn?.querySelector('.account-label');
  const accountDialogBody = document.getElementById('account-dialog-body');

  function renderAccountDialog(status) {
    if (!accountDialogBody) return;

    if (!status.configured) {
      accountDialogBody.innerHTML = `
        <div class="account-status-banner is-unconfigured">
          <strong>Sincronización no configurada</strong>
          <p>CubeSolver está funcionando al 100 % en modo local. Tus tiempos, ajustes y algoritmos aprendidos se guardan automáticamente en este navegador.</p>
        </div>
        <div class="account-info-box">
          <h3>☁️ ¿Querés sincronizar entre tu celular y tu PC?</h3>
          <p>Podés conectar tu propio proyecto gratuito de Firebase siguiendo los 7 pasos de <code>SETUP-NUBE.md</code> y pegando las credenciales en <code>src/firebase-config.js</code>.</p>
        </div>
        <div class="account-backup-actions">
          <button type="button" class="data-btn" id="account-export-btn">⬇ Exportar respaldo JSON</button>
          <button type="button" class="data-btn" id="account-import-btn">⬆ Importar respaldo JSON</button>
        </div>
        <p class="setting-help privacy-note">
          <strong>Privacidad:</strong> Tus datos son tuyos. En modo local no sale nada de tu dispositivo; con cuenta activa solo se guardan tus tiempos, ajustes y casos aprendidos en tu espacio privado <code>users/{uid}</code>.
        </p>
      `;
    } else if (!status.user) {
      accountDialogBody.innerHTML = `
        <div class="account-info-box">
          <h3>☁️ Sincronizá tus tiempos en la nube</h3>
          <p>Iniciá sesión con Google para respaldar y fusionar automáticamente tus tiempos de todos los puzzles, tus ajustes del Timer y tus casos aprendidos entre todos tus dispositivos.</p>
          <ul class="account-feature-list">
            <li>✔ Fusión inteligente sin perder ningún tiempo previo</li>
            <li>✔ Funciona sin conexión y sincroniza al reconectar</li>
            <li>✔ Tus datos siguen disponibles localmente siempre</li>
          </ul>
        </div>
        <button type="button" class="btn-google-login" id="account-google-login-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"/>
            <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
        <p id="account-auth-error" class="notation-seq-error" hidden></p>
        <div class="account-backup-actions">
          <button type="button" class="data-btn" id="account-export-btn">⬇ Exportar respaldo JSON</button>
          <button type="button" class="data-btn" id="account-import-btn">⬆ Importar respaldo JSON</button>
        </div>
        <p class="setting-help privacy-note">
          <strong>Privacidad:</strong> Solo se almacenan tu correo básico de perfil, tus tiempos por categoría, tus ajustes y los algoritmos marcados como aprendidos.
        </p>
      `;
    } else {
      const u = status.user;
      const cleanPhoto = sanitizePhotoUrl(u.photoURL);
      const safeName = escapeHtml(u.displayName || 'Speedcuber');
      const safeEmail = escapeHtml(u.email || '');
      const avatarHtml = cleanPhoto
        ? `<img src="${cleanPhoto}" alt="" class="account-avatar-img" referrerpolicy="no-referrer" />`
        : `<span class="account-avatar-fallback">${escapeHtml((u.displayName || u.email || 'U')[0].toUpperCase())}</span>`;

      accountDialogBody.innerHTML = `
        <div class="account-profile-card">
          ${avatarHtml}
          <div class="account-profile-info">
            <strong>${safeName}</strong>
            <span>${safeEmail}</span>
            <small class="account-sync-status-line" data-state="${status.state}">${escapeHtml(status.label)}</small>
          </div>
        </div>
        <div class="account-backup-actions">
          <button type="button" class="btn-primary" id="account-sync-now-btn" ${status.state === 'syncing' ? 'disabled' : ''}>
            ↻ Sincronizar ahora
          </button>
          <button type="button" class="data-btn" id="account-export-btn">⬇ Exportar respaldo JSON</button>
          <button type="button" class="data-btn" id="account-import-btn">⬆ Importar respaldo JSON</button>
        </div>
        <div class="account-signout-box">
          <label class="account-keep-local">
            <input type="checkbox" id="account-clear-local-chk" />
            <span>Limpiar también los datos locales de este dispositivo al cerrar sesión</span>
          </label>
          <button type="button" class="data-btn danger" id="account-signout-btn">Cerrar sesión</button>
        </div>
        <p class="setting-help privacy-note">
          <strong>Privacidad:</strong> Tus tiempos y progreso están protegidos en <code>users/${escapeHtml(u.uid)}</code> y solo tu cuenta autenticada tiene permiso de lectura y escritura.
        </p>
      `;
    }

    accountDialogBody.querySelector('#account-export-btn')?.addEventListener('click', () => {
      onExportBackup?.();
    });
    accountDialogBody.querySelector('#account-import-btn')?.addEventListener('click', () => {
      onImportBackup?.();
    });
    accountDialogBody.querySelector('#account-google-login-btn')?.addEventListener('click', async () => {
      const errEl = accountDialogBody.querySelector('#account-auth-error');
      if (errEl) errEl.hidden = true;
      try {
        await signInWithGoogle({ onSolvesMerged: onDataUpdated });
      } catch (err) {
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = `No se pudo iniciar sesión: ${err?.message || 'intentá de nuevo'}.`;
        }
      }
    });
    accountDialogBody.querySelector('#account-sync-now-btn')?.addEventListener('click', () => {
      syncNow({ full: true, onSolvesMerged: onDataUpdated });
    });
    accountDialogBody.querySelector('#account-signout-btn')?.addEventListener('click', async () => {
      const clearLocal = Boolean(accountDialogBody.querySelector('#account-clear-local-chk')?.checked);
      await signOutAccount({ clearLocal, onSolvesMerged: onDataUpdated });
    });
  }

  onCloudSyncStateChange((status) => {
    if (syncIndicator) {
      syncIndicator.dataset.syncState = status.state;
      syncIndicator.title = status.label;
    }
    if (syncText) {
      syncText.textContent = status.label;
    }
    if (accountBtn && accountLabel) {
      accountLabel.textContent = status.user
        ? status.user.displayName?.split(' ')[0] || status.user.email?.split('@')[0] || 'Mi cuenta'
        : 'Iniciar sesión';
    }
    renderAccountDialog(status);
  });

  // Escuchar cambios en algoritmos aprendidos para encolar sincronización
  if (typeof window !== 'undefined') {
    window.addEventListener('learned-cases-changed', () => {
      saveSyncMeta({ pendingSync: true });
      queueCloudSync();
    });
  }

  // Reconexión automática
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      if (currentUser) {
        syncNow({ onSolvesMerged: onDataUpdated }).catch(() => {});
      } else {
        emitState();
      }
    });
    window.addEventListener('offline', () => {
      if (currentUser) syncState = 'offline';
      emitState();
    });
  }

  // Si Firebase está configurado, suscribirse al estado de sesión de forma diferida
  if (isFirebaseConfigured()) {
    getFirebaseContext()
      .then((ctx) => {
        if (!ctx) return;
        ctx.authMod.onAuthStateChanged(ctx.auth, (user) => {
          currentUser = user || null;
          if (currentUser) {
            syncNow({ full: !loadSyncMeta().lastSyncAt, onSolvesMerged: onDataUpdated }).catch(() => {});
          } else {
            syncState = 'local';
            emitState();
          }
        });
      })
      .catch(() => {});
  }
}
