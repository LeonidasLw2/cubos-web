// Visor 3D y 2D para el Mirror Cube (Mirror Blocks).
// Carga Three.js dinámicamente con import('three') solo cuando se renderiza en 3D.
// Provee la misma interfaz que <twisty-player> para integración transparente en playerManager.js.

import {
  solvedPieces,
  piecesFromPattern,
  layerTurnForMove,
  pieceInTurn,
  faceNet,
  netFaceBounds,
  NET_FACES,
} from '../data/mirror.js';
import { tokenizeSequence } from '../notation-parser.js';
import { loadSettings } from '../settings.js';

let threePromise = null;
async function getThree() {
  if (!threePromise) {
    threePromise = import('three');
  }
  return threePromise;
}

let kpuzzlePromise = null;
async function getKPuzzle3() {
  if (!kpuzzlePromise) {
    kpuzzlePromise = (async () => {
      const { puzzles } = await import('cubing/puzzles');
      return puzzles['3x3x3'].kpuzzle();
    })();
  }
  return kpuzzlePromise;
}

function isWebGLSupported() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Colores metálicos para las piezas
const THEMES = {
  silver: {
    meshColor: 0xd8dce2,
    metalness: 0.88,
    roughness: 0.22,
    edgeColor: 0x16181f,
    netFlush: '#b0b6c1',
    netProtrude: '#e3e7ee',
    netSunken: '#6f7684',
  },
  gold: {
    meshColor: 0xd4af37,
    metalness: 0.90,
    roughness: 0.22,
    edgeColor: 0x221a08,
    netFlush: '#cfa935',
    netProtrude: '#fae48c',
    netSunken: '#8a6e19',
  },
};

/**
 * Crea o inicializa un MirrorViewer en el contenedor DOM dado.
 * Retorna el elemento host de forma síncrona, cargando 3D y KPuzzle en segundo plano.
 */
export function createMirrorViewer(container, options = {}) {
  const host = document.createElement('div');
  host.className = 'mirror-viewer';
  host.setAttribute('data-puzzle', 'mirror');
  host.style.position = 'relative';
  host.style.width = '100%';
  host.style.height = '100%';
  host.style.touchAction = 'none';
  host.style.display = 'grid';
  host.style.placeItems = 'center';
  host.style.overflow = 'hidden';

  // Contenedor 3D (canvas)
  const canvas3D = document.createElement('canvas');
  canvas3D.className = 'mirror-canvas-3d';
  canvas3D.style.width = '100%';
  canvas3D.style.height = '100%';
  canvas3D.style.display = 'block';
  canvas3D.style.touchAction = 'none';
  canvas3D.style.outline = 'none';
  host.appendChild(canvas3D);

  // Contenedor 2D (SVG)
  const netContainer = document.createElement('div');
  netContainer.className = 'mirror-net-view';
  netContainer.style.width = '100%';
  netContainer.style.height = '100%';
  netContainer.style.display = 'none';
  netContainer.style.alignItems = 'center';
  netContainer.style.justifyContent = 'center';
  netContainer.style.pointerEvents = 'none';
  host.appendChild(netContainer);

  let currentAlg = options.alg ?? '';
  let currentSetupAlg = options.experimentalSetupAlg ?? options.setupAlg ?? '';
  let currentTempo = Number(options.tempoScale) || 1.0;
  let currentVis = options.visualization === '2D' ? '2D' : '3D';
  let currentColorTheme = options.colorTheme || loadSettings()?.mirrorColor || 'silver';
  if (!THEMES[currentColorTheme]) currentColorTheme = 'silver';

  let cameraLongitude = (Number(options.cameraLongitude) || 25) * (Math.PI / 180);
  let cameraLatitude = (Number(options.cameraLatitude) || 30) * (Math.PI / 180);
  const cameraRadius = 6.8;

  let moves = [];
  let patterns = [];
  let stepIndex = 0;
  let isPlaying = false;
  let isAnimating = false;
  let destroyed = false;
  let animReqId = null;
  let playTimer = null;

  const playingListeners = new Set();
  const notifyPlayingChange = (state) => {
    for (const listener of playingListeners) {
      try {
        listener({ playing: state });
      } catch {}
    }
  };

  // Three.js objetos
  let THREE = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let cubeGroup = null;
  let turnGroup = null;
  let pieceMeshes = new Map();
  let resizeObserver = null;

  // Interacción táctil / ratón
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartLon = 0;
  let dragStartLat = 0;

  function updateCameraTransform() {
    if (!camera) return;
    const clat = Math.cos(cameraLatitude);
    camera.position.set(
      cameraRadius * clat * Math.sin(cameraLongitude),
      cameraRadius * Math.sin(cameraLatitude),
      cameraRadius * clat * Math.cos(cameraLongitude)
    );
    camera.lookAt(0, 0, 0);
  }

  function render3D() {
    if (renderer && scene && camera && currentVis === '3D') {
      renderer.render(scene, camera);
    }
  }

  function resizeViewport() {
    if (!renderer || !camera || !canvas3D) return;
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || canvas3D.clientWidth || 300));
    const height = Math.max(1, Math.floor(rect.height || canvas3D.clientHeight || 240));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render3D();
  }

  // Precomputa los patrones de KPuzzle para cada paso del algoritmo
  async function recomputePatterns() {
    const k3 = await getKPuzzle3();
    let base = k3.defaultPattern();
    if (currentSetupAlg) {
      try {
        base = base.applyAlg(currentSetupAlg);
      } catch {}
    }
    moves = tokenizeSequence(currentAlg);
    patterns = [base];
    let cur = base;
    for (const move of moves) {
      try {
        cur = cur.applyMove(move);
      } catch {
        // En caso de movimiento no elemental de KPuzzle, se conserva el estado
      }
      patterns.push(cur);
    }
    stepIndex = Math.min(stepIndex, moves.length);
  }

  // Sincroniza las piezas 3D al patrón del paso actual
  function sync3DPiecesToStep() {
    if (!cubeGroup || !turnGroup || pieceMeshes.size === 0) return;
    const pattern = patterns[stepIndex] || patterns[0];
    if (!pattern) return;
    const pieces = piecesFromPattern(pattern.patternData);

    for (const p of pieces) {
      const mesh = pieceMeshes.get(p.id);
      if (!mesh) continue;
      if (mesh.parent !== cubeGroup) {
        cubeGroup.attach(mesh);
      }
      mesh.position.set(p.position[0], p.position[1], p.position[2]);
      if (THREE) {
        const m4 = new THREE.Matrix4().set(
          p.rotation[0][0], p.rotation[0][1], p.rotation[0][2], 0,
          p.rotation[1][0], p.rotation[1][1], p.rotation[1][2], 0,
          p.rotation[2][0], p.rotation[2][1], p.rotation[2][2], 0,
          0, 0, 0, 1
        );
        mesh.quaternion.setFromRotationMatrix(m4);
      }
    }
    turnGroup.rotation.set(0, 0, 0);
  }

  // Genera el SVG de la red 2D para el paso actual
  function render2DNet() {
    const pattern = patterns[stepIndex] || patterns[0];
    if (!pattern) return;
    const pieces = piecesFromPattern(pattern.patternData);
    const net = faceNet(pieces);
    const theme = THEMES[currentColorTheme] || THEMES.silver;

    // Dimensiones y espaciado de la cuadrícula de la red desplegada
    const faceSize = 64; // px por cara
    const gap = 6;
    const pad = 10;
    const totalW = 4 * faceSize + 3 * gap + 2 * pad;
    const totalH = 3 * faceSize + 2 * gap + 2 * pad;

    let svgInner = '';
    for (const [face, view] of Object.entries(NET_FACES)) {
      const bounds = netFaceBounds(face);
      const faceX = pad + view.col * (faceSize + gap);
      const faceY = pad + view.row * (faceSize + gap);

      // Marco de fondo de la cara
      svgInner += `<rect x="${faceX}" y="${faceY}" width="${faceSize}" height="${faceSize}" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;

      // Etiquetas tenues de las caras en las esquinas
      svgInner += `<text x="${faceX + 6}" y="${faceY + 12}" fill="rgba(255,255,255,0.25)" font-size="9" font-family="system-ui, sans-serif" font-weight="bold">${face}</text>`;

      const facePieces = net[face] || [];
      const uSpan = bounds.u[1] - bounds.u[0] || 3;
      const vSpan = bounds.v[1] - bounds.v[0] || 3;

      for (const p of facePieces) {
        const px = faceX + ((p.u0 - bounds.u[0]) / uSpan) * faceSize;
        const py = faceY + ((bounds.v[1] - p.v1) / vSpan) * faceSize;
        const pw = ((p.u1 - p.u0) / uSpan) * faceSize;
        const ph = ((p.v1 - p.v0) / vSpan) * faceSize;

        let fill = theme.netFlush;
        if (p.depth > 0.02) fill = theme.netProtrude;
        else if (p.depth < -0.02) fill = theme.netSunken;

        svgInner += `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${pw.toFixed(2)}" height="${ph.toFixed(2)}" rx="2" fill="${fill}" stroke="${theme.edgeColor}" stroke-width="1.2" />`;
      }
    }

    netContainer.innerHTML = `
      <svg viewBox="0 0 ${totalW} ${totalH}" style="width:100%; max-width:340px; height:auto; max-height:260px;" aria-label="Red desplegada 2D del Mirror Cube">
        ${svgInner}
      </svg>
    `;
  }

  function updateVisualMode(vis) {
    currentVis = vis === '2D' ? '2D' : '3D';
    if (currentVis === '2D') {
      canvas3D.style.display = 'none';
      netContainer.style.display = 'flex';
      render2DNet();
    } else {
      netContainer.style.display = 'none';
      canvas3D.style.display = 'block';
      resizeViewport();
      render3D();
    }
  }

  // Inicializa la escena 3D si WebGL está disponible
  async function init3DScene() {
    if (!isWebGLSupported()) return;
    THREE = await getThree();
    if (destroyed) return;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas3D,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
    updateCameraTransform();

    // Iluminación para resaltar reflejos metálicos
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb4c8e0, 0.9);
    fillLight.position.set(-6, -3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    rimLight.position.set(4, -4, -4);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 8, 0);
    scene.add(topLight);

    cubeGroup = new THREE.Group();
    turnGroup = new THREE.Group();
    cubeGroup.add(turnGroup);
    scene.add(cubeGroup);

    // Materiales
    const theme = THEMES[currentColorTheme] || THEMES.silver;
    const meshMat = new THREE.MeshStandardMaterial({
      color: theme.meshColor,
      metalness: theme.metalness,
      roughness: theme.roughness,
    });
    const lineMat = new THREE.LineBasicMaterial({
      color: theme.edgeColor,
      linewidth: 1.5,
    });

    // Crear las 26 piezas con su geometría unrotated
    const basePieces = solvedPieces();
    for (const p of basePieces) {
      const geom = new THREE.BoxGeometry(p.dims[0], p.dims[1], p.dims[2]);
      const mesh = new THREE.Mesh(geom, meshMat);
      const edges = new THREE.EdgesGeometry(geom);
      const wire = new THREE.LineSegments(edges, lineMat);
      mesh.add(wire);
      cubeGroup.add(mesh);
      pieceMeshes.set(p.id, mesh);
    }

    // Configurar observador de tamaño
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        resizeViewport();
      });
      resizeObserver.observe(host);
    }
    resizeViewport();
    sync3DPiecesToStep();
    render3D();
  }

  // Interacción táctil y ratón para orbitar
  function onPointerDown(e) {
    if (currentVis !== '3D') return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLon = cameraLongitude;
    dragStartLat = cameraLatitude;
    try {
      canvas3D.setPointerCapture?.(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (!isDragging || currentVis !== '3D') return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    cameraLongitude = dragStartLon - dx * 0.008;
    cameraLatitude = Math.max(-1.42, Math.min(1.42, dragStartLat + dy * 0.008));
    updateCameraTransform();
    render3D();
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    try {
      canvas3D.releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  canvas3D.addEventListener('pointerdown', onPointerDown);
  canvas3D.addEventListener('pointermove', onPointerMove);
  canvas3D.addEventListener('pointerup', onPointerUp);
  canvas3D.addEventListener('pointercancel', onPointerUp);

  // Animación suave de un giro de capa
  function animateMove(moveToken, forward = true, onFinish) {
    const turn = layerTurnForMove(moveToken);
    if (!turn || !cubeGroup || !turnGroup || currentVis === '2D' || !THREE) {
      if (forward) stepIndex = Math.min(moves.length, stepIndex + 1);
      else stepIndex = Math.max(0, stepIndex - 1);
      sync3DPiecesToStep();
      render2DNet();
      render3D();
      onFinish?.();
      return;
    }

    isAnimating = true;
    const currentPattern = patterns[stepIndex] || patterns[0];
    const pieces = piecesFromPattern(currentPattern.patternData);
    const turningPieces = pieces.filter((p) => pieceInTurn(p, turn));

    for (const p of turningPieces) {
      const mesh = pieceMeshes.get(p.id);
      if (mesh) turnGroup.attach(mesh);
    }

    const directionMult = forward ? 1 : -1;
    const targetAngle = turn.quarterTurns * (Math.PI / 2) * directionMult;
    const duration = Math.max(70, Math.floor(260 / currentTempo));
    const startTime = performance.now();

    function frame(now) {
      if (destroyed) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing cúbico suave
      const ease =
        progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      turnGroup.rotation[turn.axis] = ease * targetAngle;
      render3D();

      if (progress < 1) {
        animReqId = requestAnimationFrame(frame);
      } else {
        isAnimating = false;
        animReqId = null;
        if (forward) stepIndex = Math.min(moves.length, stepIndex + 1);
        else stepIndex = Math.max(0, stepIndex - 1);
        sync3DPiecesToStep();
        render2DNet();
        render3D();
        onFinish?.();
      }
    }

    animReqId = requestAnimationFrame(frame);
  }

  function pause() {
    isPlaying = false;
    if (playTimer) {
      clearTimeout(playTimer);
      playTimer = null;
    }
    if (animReqId) {
      cancelAnimationFrame(animReqId);
      animReqId = null;
      isAnimating = false;
      sync3DPiecesToStep();
      render3D();
    }
    notifyPlayingChange(false);
  }

  function play() {
    if (isPlaying) return;
    if (stepIndex >= moves.length) {
      stepIndex = 0;
      sync3DPiecesToStep();
      render2DNet();
      render3D();
    }
    isPlaying = true;
    notifyPlayingChange(true);

    function nextStep() {
      if (!isPlaying || destroyed) return;
      if (stepIndex >= moves.length) {
        pause();
        return;
      }
      const move = moves[stepIndex];
      animateMove(move, true, () => {
        if (!isPlaying || destroyed) return;
        if (stepIndex >= moves.length) {
          pause();
          return;
        }
        const delay = Math.max(30, Math.floor(100 / currentTempo));
        playTimer = setTimeout(nextStep, delay);
      });
    }

    nextStep();
  }

  function togglePlay() {
    if (isPlaying) pause();
    else play();
  }

  function jumpToStart() {
    pause();
    stepIndex = 0;
    sync3DPiecesToStep();
    render2DNet();
    render3D();
  }

  function jumpToEnd() {
    pause();
    stepIndex = moves.length;
    sync3DPiecesToStep();
    render2DNet();
    render3D();
  }

  function stepForward() {
    pause();
    if (stepIndex < moves.length) {
      animateMove(moves[stepIndex], true, null);
    }
  }

  function stepBackward() {
    pause();
    if (stepIndex > 0) {
      const prevMove = moves[stepIndex - 1];
      animateMove(prevMove, false, null);
    }
  }

  // Carga inicial asíncrona
  (async () => {
    try {
      await recomputePatterns();
      if (options.timestamp === 'end') {
        stepIndex = moves.length;
      }
      await init3DScene();
      updateVisualMode(currentVis);
    } catch {}
  })();

  // Api compatible con <twisty-player>
  const controller = {
    animationController: {
      play({ direction = 1 } = {}) {
        if (direction < 0) stepBackward();
        else stepForward();
      },
    },
  };

  const experimentalModel = {
    playingInfo: {
      addFreshListener(fn) {
        if (typeof fn === 'function') {
          playingListeners.add(fn);
          fn({ playing: isPlaying });
        }
      },
    },
  };

  // Asignar métodos y propiedades directamente al host DOM para transparencia total
  Object.defineProperties(host, {
    alg: {
      get: () => currentAlg,
      set: async (val) => {
        currentAlg = String(val ?? '');
        await recomputePatterns();
        sync3DPiecesToStep();
        render2DNet();
        render3D();
      },
    },
    setupAlg: {
      get: () => currentSetupAlg,
      set: async (val) => {
        currentSetupAlg = String(val ?? '');
        await recomputePatterns();
        sync3DPiecesToStep();
        render2DNet();
        render3D();
      },
    },
    experimentalSetupAlg: {
      get: () => currentSetupAlg,
      set: async (val) => {
        currentSetupAlg = String(val ?? '');
        await recomputePatterns();
        sync3DPiecesToStep();
        render2DNet();
        render3D();
      },
    },
    tempoScale: {
      get: () => currentTempo,
      set: (val) => {
        currentTempo = Number(val) || 1.0;
      },
    },
    visualization: {
      get: () => currentVis,
      set: (val) => {
        updateVisualMode(val);
      },
    },
    cameraLongitude: {
      get: () => (cameraLongitude * 180) / Math.PI,
      set: (val) => {
        cameraLongitude = (Number(val) || 0) * (Math.PI / 180);
        updateCameraTransform();
        render3D();
      },
    },
    cameraLatitude: {
      get: () => (cameraLatitude * 180) / Math.PI,
      set: (val) => {
        cameraLatitude = (Number(val) || 0) * (Math.PI / 180);
        updateCameraTransform();
        render3D();
      },
    },
    timestamp: {
      get: () => stepIndex,
      set: (val) => {
        if (val === 'start' || val === 0) jumpToStart();
        else if (val === 'end') jumpToEnd();
        else if (Number.isFinite(Number(val))) {
          stepIndex = Math.max(0, Math.min(moves.length, Math.round(Number(val))));
          sync3DPiecesToStep();
          render2DNet();
          render3D();
        }
      },
    },
  });

  host.play = play;
  host.pause = pause;
  host.togglePlay = togglePlay;
  host.jumpToStart = jumpToStart;
  host.jumpToEnd = jumpToEnd;
  host.stepForward = stepForward;
  host.stepBackward = stepBackward;
  host.controller = controller;
  host.experimentalModel = experimentalModel;

  host.updateOptions = async (newOpts = {}) => {
    let recompute = false;
    if (newOpts.tempoScale !== undefined) {
      currentTempo = Number(newOpts.tempoScale) || 1.0;
    }
    if (newOpts.alg !== undefined && newOpts.alg !== currentAlg) {
      currentAlg = newOpts.alg;
      recompute = true;
    }
    const setup = newOpts.experimentalSetupAlg ?? newOpts.setupAlg;
    if (setup !== undefined && setup !== currentSetupAlg) {
      currentSetupAlg = setup;
      recompute = true;
    }
    if (newOpts.colorTheme && THEMES[newOpts.colorTheme] && newOpts.colorTheme !== currentColorTheme) {
      currentColorTheme = newOpts.colorTheme;
      if (THREE && pieceMeshes.size > 0) {
        const theme = THEMES[currentColorTheme];
        for (const mesh of pieceMeshes.values()) {
          mesh.material.color.setHex(theme.meshColor);
          mesh.material.metalness = theme.metalness;
          mesh.material.roughness = theme.roughness;
        }
      }
    }
    if (newOpts.cameraLongitude !== undefined) {
      cameraLongitude = (Number(newOpts.cameraLongitude) || 0) * (Math.PI / 180);
      updateCameraTransform();
    }
    if (newOpts.cameraLatitude !== undefined) {
      cameraLatitude = (Number(newOpts.cameraLatitude) || 0) * (Math.PI / 180);
      updateCameraTransform();
    }
    if (recompute) {
      await recomputePatterns();
      if (newOpts.timestamp === 'end') {
        stepIndex = moves.length;
      } else {
        stepIndex = 0;
      }
    }
    if (newOpts.visualization !== undefined) {
      updateVisualMode(newOpts.visualization);
    } else {
      sync3DPiecesToStep();
      render2DNet();
      render3D();
    }
  };

  host.destroy = () => {
    destroyed = true;
    pause();
    playingListeners.clear();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    canvas3D.removeEventListener('pointerdown', onPointerDown);
    canvas3D.removeEventListener('pointermove', onPointerMove);
    canvas3D.removeEventListener('pointerup', onPointerUp);
    canvas3D.removeEventListener('pointercancel', onPointerUp);

    if (renderer) {
      try {
        renderer.dispose();
        renderer.forceContextLoss?.();
      } catch {}
    }
    if (pieceMeshes) {
      for (const mesh of pieceMeshes.values()) {
        try {
          mesh.geometry?.dispose?.();
          mesh.material?.dispose?.();
        } catch {}
      }
      pieceMeshes.clear();
    }
    host.remove();
  };

  if (typeof options.onPlayingChange === 'function') {
    options.onPlayingChange(false);
    playingListeners.add((info) => options.onPlayingChange(Boolean(info?.playing)));
  }

  return host;
}
