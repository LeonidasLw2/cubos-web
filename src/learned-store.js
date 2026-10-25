// Almacenamiento local-first de casos marcados como "aprendidos".
// Usa localStorage con try/catch y guarda updatedAt por caso para sincronizar con Firestore en la nube.

const LEARNED_KEY = 'cubos.learned.v1';

export function loadLearnedMap() {
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (val && typeof val === 'object' && typeof val.learned === 'boolean') {
        clean[key] = {
          learned: val.learned,
          updatedAt: Number.isFinite(val.updatedAt) ? val.updatedAt : 0,
        };
      } else if (typeof val === 'boolean') {
        clean[key] = { learned: val, updatedAt: 0 };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveLearnedMap(map) {
  try {
    localStorage.setItem(LEARNED_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

export function isCaseLearned(caseKey) {
  const map = loadLearnedMap();
  return Boolean(map[caseKey]?.learned);
}

export function setCaseLearned(caseKey, learned, now = Date.now()) {
  const map = loadLearnedMap();
  map[caseKey] = { learned: Boolean(learned), updatedAt: now };
  saveLearnedMap(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('learned-cases-changed', { detail: { caseKey, learned: Boolean(learned), updatedAt: now } }));
  }
  return map[caseKey];
}

export function toggleCaseLearned(caseKey) {
  const next = !isCaseLearned(caseKey);
  setCaseLearned(caseKey, next);
  return next;
}

// Fusión por id (caseKey): gana el updatedAt más reciente.
export function mergeLearnedMaps(localMap = {}, remoteMap = {}) {
  const merged = {};
  const keys = new Set([...Object.keys(localMap), ...Object.keys(remoteMap)]);
  let changedLocal = false;
  let changedRemote = false;

  for (const key of keys) {
    const l = localMap[key];
    const r = remoteMap[key];
    if (l && !r) {
      merged[key] = { learned: Boolean(l.learned), updatedAt: l.updatedAt ?? 0 };
      changedRemote = true;
    } else if (!l && r) {
      merged[key] = { learned: Boolean(r.learned), updatedAt: r.updatedAt ?? 0 };
      changedLocal = true;
    } else if (l && r) {
      const lTime = l.updatedAt ?? 0;
      const rTime = r.updatedAt ?? 0;
      if (rTime > lTime) {
        merged[key] = { learned: Boolean(r.learned), updatedAt: rTime };
        if (l.learned !== r.learned || lTime !== rTime) changedLocal = true;
      } else {
        merged[key] = { learned: Boolean(l.learned), updatedAt: lTime };
        if (r.learned !== l.learned || rTime !== lTime) changedRemote = true;
      }
    }
  }
  return { merged, changedLocal, changedRemote };
}
