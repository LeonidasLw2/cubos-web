import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getPlayer,
  destroyPlayer,
  destroyScopePlayer,
  destroyAllPlayers,
  inspectAndPrunePlayerShadow,
} from '../src/twisty/playerManager.js';

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

    append(...nodes) {
      for (const n of nodes) {
        if (n.parentNode) {
          n.parentNode.children = n.parentNode.children.filter((c) => c !== n);
        }
        n.parentNode = this;
        this.children.push(n);
        if (n.tagName === 'TWISTY-PLAYER') {
          mountedPlayers.add(n);
          n.onConnected();
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

    querySelectorAll(selector) {
      const sel = selector.toUpperCase();
      const out = [];
      const walk = (node) => {
        for (const ch of node.children || []) {
          if (ch.tagName === sel) out.push(ch);
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
      // Simulamos el shadow cerrado de cubing/twisty (Twisty3DSceneWrapper)
      const wrapper = new MockElement('div');
      const sceneWrapper = new MockElement('twisty-3d-scene-wrapper');
      sceneWrapper.shadow = new MockElement('shadow-root');
      wrapper.children.push(sceneWrapper);
      this.shadow = new MockElement('shadow-root');
      this.shadow.children.push(wrapper);
      this._sceneWrapper = sceneWrapper;
    }

    // Reproducimos el comportamiento real de Twisty3DSceneWrapper.connectedCallback:
    // cada vez que se conecta al DOM agrega un nuevo <twisty-3d-vantage> con su <canvas>.
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

describe('playerManager — Único gestor de <twisty-player>', () => {
  let dom;

  beforeEach(() => {
    dom = createMockDOM();
    destroyAllPlayers();
  });

  it('es el ÚNICO archivo en src/ que instancia <twisty-player>', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const files = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.js')) files.push(full);
      }
    };
    walk(srcDir);

    const offenders = [];
    for (const file of files) {
      const rel = path.relative(srcDir, file).replace(/\\/g, '/');
      if (rel === 'twisty/playerManager.js') continue;
      const content = fs.readFileSync(file, 'utf8');
      if (
        /createElement\(\s*['"`]twisty-player['"`]\s*\)/.test(content) ||
        /new\s+TwistyPlayer\b/.test(content)
      ) {
        offenders.push(rel);
      }
    }

    assert.deepEqual(offenders, []);
  });

  it('aplica la configuración por defecto obligatoria (hint-facelets=none, back-view=none, control-panel=none, background=none)', () => {
    const stage = dom.createContainer();
    const player = getPlayer(stage, {
      scope: 'methods',
      puzzle: '4x4x4',
      alg: "2R U2 2R'",
      visualization: '3D',
    });

    assert.equal(player.getAttribute('hint-facelets'), 'none');
    assert.equal(player.getAttribute('back-view'), 'none');
    assert.equal(player.getAttribute('control-panel'), 'none');
    assert.equal(player.getAttribute('background'), 'none');
    assert.equal(player.getAttribute('visualization'), '3D');
    assert.equal(player.getAttribute('puzzle'), '4x4x4');
  });

  it('reutiliza la misma instancia al cambiar de caso 10 veces en el modal y mantiene siempre 1 player y 1 canvas', () => {
    const modalStage = dom.createContainer();
    let firstPlayer = null;

    for (let i = 0; i < 10; i++) {
      const player = getPlayer(modalStage, {
        scope: 'methods',
        puzzle: '4x4x4',
        alg: i % 2 === 0 ? "2R U2 2R'" : "Rw U Rw'",
        visualization: i % 3 === 0 ? '2D' : '3D',
      });
      if (i === 0) firstPlayer = player;
      assert.equal(player, firstPlayer);
      assert.equal(dom.getMountedPlayers().length, 1);
      assert.equal(modalStage.querySelectorAll('twisty-player').length, 1);

      const { canvases, vantages } = inspectAndPrunePlayerShadow(player);
      assert.equal(vantages.length, 1);
      assert.equal(canvases.length, 1);
    }
  });

  it('al abrir y cerrar el modal 10 veces seguidas nunca acumula players ni canvases (siempre 1 player y 1 canvas)', () => {
    const heroStage = dom.createContainer();
    const modalStage = dom.createContainer();

    // Carga inicial del hero
    const initialHero = getPlayer(heroStage, {
      scope: 'methods',
      puzzle: '4x4x4',
      alg: "2R U2 2R'",
    });
    assert.equal(dom.getMountedPlayers().length, 1);
    assert.equal(inspectAndPrunePlayerShadow(initialHero).canvases.length, 1);

    for (let i = 0; i < 10; i++) {
      // Abrir modal
      const modalPlayer = getPlayer(modalStage, {
        scope: 'methods',
        puzzle: '4x4x4',
        alg: "2R U2 2R'",
      });
      assert.equal(dom.getMountedPlayers().length, 1);
      assert.equal(heroStage.querySelectorAll('twisty-player').length, 0);
      assert.equal(modalStage.querySelectorAll('twisty-player').length, 1);
      assert.equal(inspectAndPrunePlayerShadow(modalPlayer).canvases.length, 1);

      // Cerrar modal y restaurar hero
      destroyPlayer(modalStage);
      assert.equal(modalStage.querySelectorAll('twisty-player').length, 0);

      const restoredHero = getPlayer(heroStage, {
        scope: 'methods',
        puzzle: '4x4x4',
        alg: "2R U2 2R'",
      });
      assert.equal(dom.getMountedPlayers().length, 1);
      assert.equal(heroStage.querySelectorAll('twisty-player').length, 1);
      assert.equal(inspectAndPrunePlayerShadow(restoredHero).canvases.length, 1);
    }

    destroyScopePlayer('methods');
    assert.equal(dom.getMountedPlayers().length, 0);
  });
});
