// Pruebas unitarias para el visor del Mirror Cube y su integración con playerManager.
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPlayer,
  destroyPlayer,
  destroyAllPlayers,
  updatePlayerOptions,
} from '../src/twisty/playerManager.js';
import { createMirrorViewer } from '../src/twisty/mirrorViewer.js';

function createMockDOM() {
  const mountedPlayers = new Set();

  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.attributes = new Map();
      this.style = {};
      this.children = [];
      this.parentNode = null;
      this.shadow = null;
      this.connectCount = 0;
      this.dataset = {};
      this._className = '';
      this.classList = {
        _set: new Set(),
        add: (...names) => {
          for (const n of names) this.classList._set.add(n);
          this._className = [...this.classList._set].join(' ');
        },
        remove: (...names) => {
          for (const n of names) this.classList._set.delete(n);
          this._className = [...this.classList._set].join(' ');
        },
        contains: (n) => this.classList._set.has(n),
      };
    }

    get className() {
      return this._className;
    }

    set className(val) {
      this._className = String(val);
      this.classList._set = new Set(this._className.split(/\s+/).filter(Boolean));
    }

    get parentElement() {
      return this.parentNode;
    }

    get isConnected() {
      return Boolean(this.parentNode);
    }

    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }

    getAttribute(k) {
      return this.attributes.get(k) ?? null;
    }

    appendChild(child) {
      this.append(child);
      return child;
    }

    append(...nodes) {
      for (const n of nodes) {
        if (n.parentNode) {
          n.parentNode.children = n.parentNode.children.filter((c) => c !== n);
        }
        n.parentNode = this;
        this.children.push(n);
        if (n.tagName === 'TWISTY-PLAYER') {
          mountedPlayers.add(n);
          n.onConnected?.();
        }
      }
    }

    replaceChildren(...nodes) {
      for (const c of this.children) {
        c.parentNode = null;
        if (c.tagName === 'TWISTY-PLAYER') {
          mountedPlayers.delete(c);
        }
      }
      this.children = [];
      this.append(...nodes);
    }

    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter((c) => c !== this);
        this.parentNode = null;
      }
      if (this.tagName === 'TWISTY-PLAYER') {
        mountedPlayers.delete(this);
      }
    }

    getBoundingClientRect() {
      return { width: 300, height: 240, top: 0, left: 0, right: 300, bottom: 240 };
    }

    addEventListener() {}
    removeEventListener() {}

    querySelectorAll(selector) {
      const parts = selector.split(',').map((s) => s.trim().toUpperCase());
      const out = [];
      const match = (node) => {
        for (const p of parts) {
          if (p.startsWith('.')) {
            const cls = p.slice(1).toLowerCase();
            if (node.classList?.contains(cls)) return true;
          } else if (node.tagName === p) {
            return true;
          }
        }
        return false;
      };

      const walk = (node) => {
        for (const ch of node.children || []) {
          if (match(ch)) out.push(ch);
          walk(ch);
        }
      };
      walk(this);
      return out;
    }
  }

  class MockTwistyPlayer extends MockElement {
    constructor() {
      super('twisty-player');
      const wrapper = new MockElement('div');
      const sceneWrapper = new MockElement('twisty-3d-scene-wrapper');
      sceneWrapper.shadow = new MockElement('shadow-root');
      wrapper.children.push(sceneWrapper);
      this.shadow = new MockElement('shadow-root');
      this.shadow.children.push(wrapper);
      this._sceneWrapper = sceneWrapper;
    }

    onConnected() {
      this.connectCount++;
      const vantage = new MockElement('twisty-3d-vantage');
      vantage.shadow = new MockElement('shadow-root');
      const canvas = new MockElement('canvas');
      vantage.shadow.append(canvas);
      this._sceneWrapper.shadow.append(vantage);
    }
  }

  globalThis.document = {
    createElement(tag) {
      if (tag.toLowerCase() === 'twisty-player') {
        return new MockTwistyPlayer();
      }
      return new MockElement(tag);
    },
    querySelectorAll(sel) {
      if (sel.toLowerCase() === 'twisty-player') {
        return [...mountedPlayers];
      }
      return [];
    },
  };

  return {
    createContainer: () => new MockElement('div'),
    getMountedPlayers: () => [...mountedPlayers],
  };
}

describe('mirrorViewer y playerManager con puzzle="mirror"', () => {
  let dom;

  beforeEach(() => {
    dom = createMockDOM();
    destroyAllPlayers();
  });

  it('createMirrorViewer crea un elemento host .mirror-viewer con canvas 3D y contenedor 2D', () => {
    const container = dom.createContainer();
    const viewer = createMirrorViewer(container, {
      alg: "R U R' U'",
      visualization: '3D',
    });

    assert.ok(viewer.classList.contains('mirror-viewer'));
    assert.equal(viewer.getAttribute('data-puzzle'), 'mirror');
    assert.equal(typeof viewer.play, 'function');
    assert.equal(typeof viewer.pause, 'function');
    assert.equal(typeof viewer.jumpToStart, 'function');
    assert.equal(typeof viewer.jumpToEnd, 'function');
    assert.equal(typeof viewer.stepForward, 'function');
    assert.equal(typeof viewer.stepBackward, 'function');
  });

  it('alternar a visualización 2D oculta el canvas y activa la vista de red desplegada', () => {
    const container = dom.createContainer();
    const viewer = createMirrorViewer(container, {
      visualization: '3D',
    });

    const canvas = viewer.children[0];
    const net = viewer.children[1];
    assert.equal(canvas.style.display, 'block');
    assert.equal(net.style.display, 'none');

    viewer.visualization = '2D';
    assert.equal(canvas.style.display, 'none');
    assert.equal(net.style.display, 'flex');

    viewer.visualization = '3D';
    assert.equal(canvas.style.display, 'block');
    assert.equal(net.style.display, 'none');
  });

  it('getPlayer monta un MirrorViewer cuando puzzle="mirror" y no crea <twisty-player>', () => {
    const stage = dom.createContainer();
    const player = getPlayer(stage, {
      scope: 'methods',
      puzzle: 'mirror',
      alg: "R U R' U'",
    });

    assert.ok(player.classList.contains('mirror-viewer'));
    assert.equal(stage.querySelectorAll('.mirror-viewer').length, 1);
    assert.equal(stage.querySelectorAll('twisty-player').length, 0);
  });

  it('reutiliza la misma instancia del visor Mirror 10 veces seguidas sin duplicar elementos', () => {
    const stage = dom.createContainer();
    let firstPlayer = null;

    for (let i = 0; i < 10; i++) {
      const player = getPlayer(stage, {
        scope: 'methods',
        puzzle: 'mirror',
        alg: i % 2 === 0 ? "R U R' U'" : "R U2 R'",
        visualization: i % 2 === 0 ? '3D' : '2D',
      });
      if (i === 0) firstPlayer = player;
      assert.equal(player, firstPlayer);
      assert.equal(stage.querySelectorAll('.mirror-viewer').length, 1);
    }
  });

  it('abrir y cerrar el visor Mirror 10 veces limpia y deja siempre exactamente 1 instancia activa', () => {
    const heroStage = dom.createContainer();
    const modalStage = dom.createContainer();

    // Hero inicial con Mirror
    getPlayer(heroStage, {
      scope: 'methods',
      puzzle: 'mirror',
      alg: "R U R' U'",
    });
    assert.equal(heroStage.querySelectorAll('.mirror-viewer').length, 1);

    for (let i = 0; i < 10; i++) {
      // Abrir modal con Mirror
      const modalPlayer = getPlayer(modalStage, {
        scope: 'methods',
        puzzle: 'mirror',
        alg: "R U R' U'",
      });
      assert.ok(modalPlayer.classList.contains('mirror-viewer'));
      assert.equal(heroStage.querySelectorAll('.mirror-viewer').length, 0);
      assert.equal(modalStage.querySelectorAll('.mirror-viewer').length, 1);

      // Cerrar modal
      destroyPlayer(modalStage);
      assert.equal(modalStage.querySelectorAll('.mirror-viewer').length, 0);

      // Restaurar hero
      const restoredHero = getPlayer(heroStage, {
        scope: 'methods',
        puzzle: 'mirror',
        alg: "R U R' U'",
      });
      assert.ok(restoredHero.classList.contains('mirror-viewer'));
      assert.equal(heroStage.querySelectorAll('.mirror-viewer').length, 1);
    }
  });

  it('opción "showColors: true" cambia transparentemente a twisty-player de 3x3 y volver la restaura', () => {
    const stage = dom.createContainer();

    // 1. Mirror normal
    const mirrorPlayer = getPlayer(stage, {
      scope: 'methods',
      puzzle: 'mirror',
      alg: "R U R' U'",
    });
    assert.ok(mirrorPlayer.classList.contains('mirror-viewer'));
    assert.equal(stage.querySelectorAll('.mirror-viewer').length, 1);
    assert.equal(stage.querySelectorAll('twisty-player').length, 0);

    // 2. Activar ayuda de colores -> cambia a twisty-player con puzzle 3x3x3
    const colorPlayer = getPlayer(stage, {
      scope: 'methods',
      puzzle: 'mirror',
      showColors: true,
      alg: "R U R' U'",
    });
    assert.equal(colorPlayer.tagName, 'TWISTY-PLAYER');
    assert.equal(colorPlayer.getAttribute('puzzle'), '3x3x3');
    assert.equal(stage.querySelectorAll('.mirror-viewer').length, 0);
    assert.equal(stage.querySelectorAll('twisty-player').length, 1);

    // 3. Desactivar ayuda de colores -> vuelve a MirrorViewer metálico
    const restoredMirror = getPlayer(stage, {
      scope: 'methods',
      puzzle: 'mirror',
      showColors: false,
      alg: "R U R' U'",
    });
    assert.ok(restoredMirror.classList.contains('mirror-viewer'));
    assert.equal(stage.querySelectorAll('.mirror-viewer').length, 1);
    assert.equal(stage.querySelectorAll('twisty-player').length, 0);
  });
});
