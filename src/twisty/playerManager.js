// Único punto de creación, configuración, reutilización y limpieza de <twisty-player> en toda la app.
//
// Por qué existe este módulo:
// En cubing/twisty (Twisty3DSceneWrapper.connectedCallback), cada vez que un <twisty-player> ya conectado
// se mueve de un contenedor DOM a otro o se desmonta y vuelve a insertar con innerHTML/append,
// el sub-elemento <twisty-3d-scene-wrapper> ejecuta connectedCallback() sin guardia y agrega un
// nuevo <twisty-3d-vantage> (<canvas>) adicional en columna, apilando múltiples cubos diminutos.
//
// Reglas estrictas de este módulo:
// 1. NUNCA se mueve un <twisty-player> entre contenedores distintos.
// 2. Si el mismo contenedor ya tiene su <twisty-player> montado, se REUTILIZA in-place actualizando
//    únicamente sus propiedades reactivas (puzzle, alg, experimentalSetupAlg, stickering, visualization, etc.).
// 3. Si cambia el contenedor dentro de un mismo ámbito (scope) o se cierra el modal / se sale de la ruta,
//    se destruye primero el anterior (player.remove() y container.replaceChildren()).

import { DISPLAY_SETUP, STICKERING } from '../data/stickering.js';
import { createMirrorViewer } from './mirrorViewer.js';

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  await import('cubing/twisty');
}

// Mapa WeakMap<HTMLElement, ManagedEntry> y Map<string, ManagedEntry> por scope
let containerEntries = new WeakMap();
const scopeEntries = new Map();

/**
 * Recorre el Shadow DOM (abierto o cerrado `node.shadow` de cubing.js) y cuenta los <canvas>
 * y <twisty-3d-vantage>. Si por cualquier razón hubiera más de 1 vantage cuando backView='none',
 * elimina los duplicados inmediatamente.
 */
export function inspectAndPrunePlayerShadow(player) {
  if (!player) return { vantages: [], canvases: [] };

  const vantages = [];
  const walk = (node) => {
    if (!node) return;
    const tag = node.tagName ? node.tagName.toLowerCase() : '';
    if (tag === 'twisty-3d-vantage') vantages.push(node);
    const sr = node.shadow || node.shadowRoot;
    if (sr) walk(sr);
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  };
  walk(player);

  // Blindaje defensivo: nunca permitir más de 1 vantage cuando back-view="none"
  if (vantages.length > 1) {
    for (let i = 1; i < vantages.length; i++) {
      try {
        vantages[i].disconnect?.();
        vantages[i].remove?.();
      } catch {
        // Ignorar
      }
    }
  }

  // Recontar vantages y canvases tras podar
  const finalVantages = [];
  const finalCanvases = [];
  const walkFinal = (node) => {
    if (!node) return;
    const tag = node.tagName ? node.tagName.toLowerCase() : '';
    if (tag === 'twisty-3d-vantage') finalVantages.push(node);
    if (tag === 'canvas') finalCanvases.push(node);
    const sr = node.shadow || node.shadowRoot;
    if (sr) walkFinal(sr);
    if (node.children) {
      for (const child of node.children) walkFinal(child);
    }
  };
  walkFinal(player);

  return {
    vantages: finalVantages,
    canvases: finalCanvases,
  };
}

/**
 * Destruye el <twisty-player> o visor Mirror asociado a un contenedor y limpia sus listeners.
 */
export function destroyPlayer(container) {
  if (!container) return;
  const entry = containerEntries.get(container);
  if (entry) {
    if (entry.isMirror) {
      try {
        entry.player?.destroy?.();
      } catch {}
    } else {
      try {
        entry.player?.pause?.();
      } catch {}
    }
    for (const cleanup of entry.cleanups) {
      try {
        cleanup();
      } catch {}
    }
    entry.cleanups.length = 0;
    try {
      entry.player?.remove?.();
    } catch {}
    containerEntries.delete(container);
    if (entry.scope && scopeEntries.get(entry.scope) === entry) {
      scopeEntries.delete(entry.scope);
    }
  }
  // Asegurar que no quede ningún player huérfano dentro del contenedor
  const strayTwisty = container.querySelectorAll?.('twisty-player') ?? [];
  for (const el of strayTwisty) {
    try {
      el.pause?.();
      el.remove();
    } catch {}
  }
  const strayMirror = container.querySelectorAll?.('.mirror-viewer') ?? [];
  for (const el of strayMirror) {
    try {
      el.destroy?.();
      el.remove();
    } catch {}
  }
  container.replaceChildren?.();
}

/**
 * Destruye el player activo de un ámbito (por ejemplo 'methods', 'notation', 'solver', 'timer', 'trainer').
 */
export function destroyScopePlayer(scope) {
  const entry = scopeEntries.get(scope);
  if (!entry) return;
  destroyPlayer(entry.container);
  scopeEntries.delete(scope);
}

/**
 * Destruye todos los players registrados en todos los ámbitos.
 */
export function destroyAllPlayers() {
  for (const scope of [...scopeEntries.keys()]) {
    destroyScopePlayer(scope);
  }
  containerEntries = new WeakMap();
}

/**
 * Aplica las opciones de configuración sobre un reproductor existente sin desmontarlo del DOM.
 */
export function updatePlayerOptions(player, options = {}) {
  if (!player) return;

  if (typeof player.updateOptions === 'function') {
    player.updateOptions(options);
    return;
  }

  const {
    puzzle,
    alg,
    setupAlg,
    experimentalSetupAlg,
    anchor,
    experimentalSetupAnchor,
    stickering,
    visualization,
    tempoScale,
    cameraLongitude,
    cameraLatitude,
    timestamp,
    useDefaultZ2 = false,
  } = options;

  // Configuración base obligatoria en toda la app
  player.hintFacelets = 'none';
  player.backView = 'none';
  player.controlPanel = 'none';
  player.background = 'none';
  player.experimentalDragInput = 'auto';
  player.setAttribute?.('hint-facelets', 'none');
  player.setAttribute?.('back-view', 'none');
  player.setAttribute?.('control-panel', 'none');
  player.setAttribute?.('background', 'none');

  if (puzzle !== undefined && player.getAttribute?.('puzzle') !== puzzle) {
    try {
      player.experimentalModel?.twistySceneModel?.stickeringMaskRequest?.set(null);
    } catch {}
    player.puzzle = puzzle;
    player.setAttribute?.('puzzle', puzzle);
  }

  if (visualization !== undefined) {
    const vis = visualization === '2D' ? '2D' : '3D';
    player.visualization = vis;
    player.setAttribute?.('visualization', vis);
  }

  // Stickering
  if (stickering !== undefined) {
    if (stickering && STICKERING[stickering]) {
      try {
        player.experimentalStickeringMaskOrbits = STICKERING[stickering];
      } catch {}
    } else {
      try {
        player.experimentalModel?.twistySceneModel?.stickeringMaskRequest?.set(null);
        player.experimentalStickering = 'full';
      } catch {}
    }
  }

  // Setup alg y anchor
  const rawSetup =
    experimentalSetupAlg !== undefined
      ? experimentalSetupAlg
      : setupAlg !== undefined
        ? setupAlg
        : undefined;

  if (rawSetup !== undefined || useDefaultZ2) {
    const targetPuzzle = puzzle || player.getAttribute?.('puzzle') || '3x3x3';
    const needsZ2 = useDefaultZ2 && String(targetPuzzle).includes('x');
    const finalSetup =
      rawSetup !== undefined
        ? rawSetup
        : needsZ2
          ? DISPLAY_SETUP
          : '';
    try {
      player.experimentalSetupAlg = finalSetup;
    } catch {}
  }

  const targetAnchor = experimentalSetupAnchor ?? anchor;
  if (targetAnchor !== undefined) {
    try {
      player.experimentalSetupAnchor = targetAnchor;
    } catch {}
  }

  if (alg !== undefined) {
    try {
      player.alg = alg;
    } catch {}
  }

  if (timestamp !== undefined) {
    try {
      player.timestamp = timestamp;
    } catch {}
  }

  if (tempoScale !== undefined && Number.isFinite(Number(tempoScale))) {
    player.tempoScale = Number(tempoScale);
  }

  if (cameraLongitude !== undefined && Number.isFinite(Number(cameraLongitude))) {
    player.cameraLongitude = Number(cameraLongitude);
  }

  if (cameraLatitude !== undefined && Number.isFinite(Number(cameraLatitude))) {
    player.cameraLatitude = Number(cameraLatitude);
  }

  inspectAndPrunePlayerShadow(player);
}

/**
 * Obtiene o crea el único <twisty-player> para `container`.
 * - La primera vez crea el elemento, lo configura y lo monta en `container`.
 * - En llamadas sucesivas con el mismo `container`, REUTILIZA el mismo elemento sin tocar el DOM padre.
 * - Si se pasa un `scope` (ej. 'methods', 'notation', 'solver', 'timer', 'trainer') y ese scope estaba montado
 *   en otro contenedor distinto, primero destruye el anterior (`player.remove()` y `oldContainer.replaceChildren()`).
 */
export function getPlayer(container, options = {}) {
  if (!container) return null;

  const scope = options.scope || null;

  // Si el scope tenía un player en OTRO contenedor, destruirlo primero para no acumular players ni mover nodos
  if (scope) {
    const prevScopeEntry = scopeEntries.get(scope);
    if (prevScopeEntry && prevScopeEntry.container !== container) {
      destroyPlayer(prevScopeEntry.container);
    }
  }

  const isMirrorTarget = options.puzzle === 'mirror' && !options.showColors;
  let entry = containerEntries.get(container);

  // Verificar si el player sigue siendo hijo directo de `container`
  if (
    entry &&
    entry.player &&
    (entry.player.parentElement === container || entry.player.parentNode === container)
  ) {
    if (Boolean(entry.isMirror) !== isMirrorTarget) {
      // Cambio entre visor Mirror y twisty-player normal (o viceversa)
      destroyPlayer(container);
    } else if (entry.isMirror) {
      // Reutilizar el MirrorViewer existente in-place
      updatePlayerOptions(entry.player, options);
      return entry.player;
    } else {
      const currentPuzzle = entry.player.getAttribute?.('puzzle');
      const targetPuzzle = options.puzzle === 'mirror' ? '3x3x3' : options.puzzle;
      if (targetPuzzle && currentPuzzle && targetPuzzle !== currentPuzzle) {
        destroyPlayer(container);
      } else {
        const allInContainer = container.querySelectorAll?.('twisty-player') ?? [];
        if (allInContainer.length > 1) {
          for (const p of allInContainer) {
            if (p !== entry.player) p.remove();
          }
        }
        updatePlayerOptions(entry.player, {
          ...options,
          puzzle: options.puzzle === 'mirror' ? '3x3x3' : options.puzzle,
        });
        return entry.player;
      }
    }
  }

  // Si había una entrada vieja desconectada, limpiarla primero
  if (entry) {
    destroyPlayer(container);
  }

  if (isMirrorTarget) {
    const mirrorPlayer = createMirrorViewer(container, options);
    entry = {
      container,
      player: mirrorPlayer,
      scope,
      isMirror: true,
      cleanups: [],
    };
    containerEntries.set(container, entry);
    if (scope) {
      scopeEntries.set(scope, entry);
    }
    container.replaceChildren(mirrorPlayer);

    const mountedCount = (container.querySelectorAll?.('.mirror-viewer') ?? []).length;
    if (mountedCount !== 1) {
      throw new Error(
        `[playerManager] Se esperaba exactamente 1 visor Mirror en el contenedor, pero hay ${mountedCount}.`
      );
    }
    return mirrorPlayer;
  }

  // Crear un <twisty-player> nuevo por única vez para este contenedor
  const player = document.createElement('twisty-player');
  player.setAttribute('hint-facelets', 'none');
  player.setAttribute('back-view', 'none');
  player.setAttribute('control-panel', 'none');
  player.setAttribute('background', 'none');

  entry = {
    container,
    player,
    scope,
    isMirror: false,
    cleanups: [],
  };
  containerEntries.set(container, entry);
  if (scope) {
    scopeEntries.set(scope, entry);
  }

  const twistyOpts = {
    visualization: '3D',
    ...options,
    puzzle: options.puzzle === 'mirror' ? '3x3x3' : options.puzzle,
  };

  updatePlayerOptions(player, twistyOpts);

  container.replaceChildren(player);
  inspectAndPrunePlayerShadow(player);

  if (typeof options.onPlayingChange === 'function') {
    const handler = (info) => {
      options.onPlayingChange(Boolean(info?.playing));
    };
    player.experimentalModel?.playingInfo?.addFreshListener?.(handler);
  }

  // Verificación: exactamente 1 twisty-player en el contenedor
  const mountedCount = (container.querySelectorAll?.('twisty-player') ?? []).length;
  if (mountedCount !== 1) {
    throw new Error(
      `[playerManager] Se esperaba exactamente 1 <twisty-player> en el contenedor, pero hay ${mountedCount}.`
    );
  }

  return player;
}
