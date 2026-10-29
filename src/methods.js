// Sección Métodos: arma cada página tipo presentación interactiva con:
// - Hero con chips (white-space: nowrap) y el único <twisty-player> 3D compartido por página.
// - Fila de estadísticas con íconos.
// - Stepper / línea de tiempo numerada, conectada y clickeable.
// - Buscador, filtros (grupo / aprendidos / por aprender) y barra de progreso en vivo.
// - Tarjetas de caso con miniatura 2D SVG (2D-LL o isométrica), botón "Ver animación 3D" y "Marcar como aprendido".
// - Bloques de Requisitos previos, Consejos y Errores comunes.
// - Navegación tipo diapositivas (Anterior / Siguiente).
import { BEGINNER } from './data/beginner.js';
import { PLL } from './data/pll.js';
import { OLL, OLL_2LOOK } from './data/oll.js';
import { F2L, describeF2L } from './data/f2l.js';
import { CROSS } from './data/cross.js';
import { ROUX } from './data/roux.js';
import { CUBE2X2, BEGINNER_2X2, ORTEGA, CLL } from './data/cube2x2.js';
import { CUBE4X4, REDUCTION, YAU } from './data/cube4x4.js';
import { CUBE5X5, REDUCTION_5X5, YAU5 } from './data/cube5x5.js';
import { CUBE7X7, REDUCTION_7X7 } from './data/cube7x7.js';
import { MEGAMINX, MEGAMINX_STANDARD } from './data/megaminx.js';
import { PYRAMINX, PYRAMINX_BEGINNER, PYRAMINX_ADVANCED } from './data/pyraminx.js';
import { MIRROR_METHOD } from './data/mirror-method.js';
import { PAGE_METADATA, UNIFIED_COUNTS, CFOP_BADGE } from './data/methods-metadata.js';
import { createCaseCard, mountHeroPlayer, openSharedCaseModal } from './case-card.js';
import { cubeSvg } from './cube-art.js';
import { pyraminxSvg, megaminxSvg } from './case-preview.js';
import { METHOD_PAGES, methodHref } from './data/method-pages.js';

const linkTo = (sub) => (METHOD_PAGES[sub] && METHOD_PAGES[sub].page !== 'soon' ? methodHref(sub) : null);

const HEX = {
  white: '#f2f2f2',
  yellow: '#ffd500',
  red: '#ff4d5e',
  orange: '#ff8a00',
  blue: '#3d8bff',
  green: '#2ec27e',
  celeste: '#74acdf',
};
const G = '#3a4150';
const D = '#2c323e';
const lowerTwo = (color) => [G, G, G, color, color, color, color, color, color];

const STAT_ICONS = {
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  moves: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
};

const statIconSvg = (name) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STAT_ICONS[name] ?? STAT_ICONS.layers}</svg>`;

// Portada de Métodos: los 7 puzzles de la app
const PUZZLES = [
  {
    title: '2x2',
    text: 'El cubo de bolsillo: sin centros fijos. Principiante, Ortega, CLL y descripción de EG.',
    href: linkTo('2x2'),
    accent: 'orange',
    art: { n: 2 },
    tag: '3 métodos · 56 casos',
  },
  {
    title: '3x3',
    text: 'El clásico de speedcubing. Método principiante, CFOP (el más usado), Roux y ZZ.',
    href: linkTo('3x3'),
    accent: 'blue',
    art: { n: 3 },
    tag: 'Principiante · CFOP · Roux',
  },
  {
    title: '4x4',
    text: 'Reducción a 3x3, paridades OLL y PLL explicadas paso a paso y método Yau.',
    href: linkTo('4x4'),
    accent: 'green',
    art: { n: 4 },
    tag: 'Reducción · Yau · Paridades',
  },
  {
    title: '5x5',
    text: 'Centros fijos de 3×3, aristas triples con Freeslice, paridad de alas y método Yau5.',
    href: linkTo('5x5'),
    accent: 'yellow',
    art: { n: 5, top: HEX.yellow, left: HEX.green, right: HEX.orange },
    tag: 'Reducción · Yau5',
  },
  {
    title: '7x7',
    text: 'Reducción para cubos grandes: centros de 5×5 por barras, aristas por grupos y conmutadores.',
    href: linkTo('7x7'),
    accent: 'red',
    art: { n: 7, top: HEX.red, left: HEX.blue, right: HEX.yellow },
    tag: 'Cubos grandes · Barras 1×5',
  },
  {
    title: 'Megaminx',
    text: 'Dodecaedro de 12 caras: Estrella, primera cara, F2L, S2L y última capa en 4 pasos.',
    href: linkTo('megaminx'),
    accent: 'celeste',
    customSvg: megaminxSvg({ accent: HEX.celeste }),
    tag: '6 etapas · 12 caras',
  },
  {
    title: 'Pyraminx',
    text: 'Tetraedro de giros de 120°: método Principiante (LBL), Keyhole, L4E, Top-First y 1-Flip.',
    href: linkTo('pyraminx'),
    accent: 'green',
    customSvg: pyraminxSvg(),
    tag: 'Principiante · Keyhole · L4E',
  },
  {
    title: 'Mirror Cube',
    text: 'El 3x3 que se desforma: mismo mecanismo y notación, pero las piezas se reconocen por grosor y relieve.',
    href: linkTo('mirror'),
    accent: 'celeste',
    art: { n: 3, top: '#e2e6ec', left: '#9ea5b1', right: '#c4cad4' },
    tag: 'Monocromo · Reconocimiento por forma',
  },
];

const PUZZLE_METHODS = {
  '3x3': {
    intro: 'Tres métodos principales para el 3x3: empezá por el método principiante y, cuando lo domines, pasá a CFOP (el más usado) o a Roux.',
    hero: {
      puzzle: '3x3x3',
      stickering: 'pll',
      setupAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
      chips: ['Cubo clásico WCA', '3 métodos completos + ZZ', 'De ~1 min a Sub-10 s'],
    },
    methods: [
      {
        title: 'Principiante',
        text: 'Capa por capa (LBL). El primer método ideal para aprender a armar el cubo desde cero.',
        href: linkTo('3x3/principiante'),
        accent: 'green',
        tag: 'Ideal para empezar · 7 pasos',
      },
      {
        title: 'CFOP',
        text: `Cruz, F2L, OLL y PLL. El método más usado en torneos WCA (${UNIFIED_COUNTS.twoLookCfop} algoritmos en 2-look o ${UNIFIED_COUNTS.fullCfop} completo).`,
        href: linkTo('3x3/cfop'),
        accent: 'blue',
        tag: `★ ${CFOP_BADGE} · ${UNIFIED_COUNTS.fullCfop} casos`,
      },
      {
        title: 'Roux',
        text: `Bloques laterales 1×2×3, esquinas (${UNIFIED_COUNTS.rouxCmll} CMLL) y las 6 aristas finales (LSE) usando la capa M.`,
        href: linkTo('3x3/roux'),
        accent: 'orange',
        tag: 'Intuitivo · ~48 giros',
      },
    ],
  },
  '2x2': {
    intro: CUBE2X2.intro.join(' '),
    hero: {
      puzzle: '2x2x2',
      stickering: '2x2-pbl',
      setupAlg: "R U R' U R U2' R'",
      chips: ['Sin centros fijos', 'Principiante · Ortega · CLL', 'Objetivo: Sub-5 s'],
    },
    methods: [
      {
        title: 'Principiante',
        text: 'Capa por capa, con algoritmos que ya conocés del 3x3.',
        href: linkTo('2x2/principiante'),
        accent: 'green',
        n: 2,
        tag: 'Primer método · 3 pasos',
      },
      {
        title: 'Ortega',
        text: `Primera cara, OLL (${UNIFIED_COUNTS.ortegaOll} casos) y PBL (${UNIFIED_COUNTS.ortegaPbl} casos). El paso ideal para bajar de 5 segundos.`,
        href: linkTo('2x2/ortega'),
        accent: 'blue',
        n: 2,
        tag: `Intermedio · ${UNIFIED_COUNTS.ortegaTotal} casos`,
      },
      {
        title: 'CLL',
        text: `Primera capa completa y la última capa en un solo algoritmo: ${UNIFIED_COUNTS.cll2x2} casos.`,
        href: linkTo('2x2/cll'),
        accent: 'red',
        n: 2,
        tag: `Avanzado · ${UNIFIED_COUNTS.cll2x2} casos`,
      },
    ],
  },
  '4x4': {
    intro: CUBE4X4.intro,
    notation: CUBE4X4.notation,
    hero: {
      puzzle: '4x4x4',
      stickering: '4x4-full',
      setupAlg: "Uw R U' R' Uw'",
      chips: ['96 stickers · Sin centros fijos', 'Reducción + Yau', 'Paridades OLL y PLL'],
    },
    methods: [
      {
        title: 'Reducción',
        text: 'Armar los 6 centros, emparejar las 12 aristas y resolver como un 3x3. Incluye paridad de OLL y de PLL.',
        href: linkTo('4x4/reduccion'),
        accent: 'green',
        n: 4,
        tag: 'Método estándar · 4 etapas',
      },
      {
        title: 'Yau',
        text: 'Tres aristas de la cruz antes de terminar los centros y emparejado 3-2-3 para entrar directo a F2L.',
        href: linkTo('4x4/yau'),
        accent: 'blue',
        n: 4,
        tag: 'Competición · 5 etapas',
      },
    ],
  },
  '5x5': {
    intro: CUBE5X5.intro,
    notation: CUBE5X5.notation,
    hero: {
      puzzle: '5x5x5',
      stickering: '5x5-full',
      setupAlg: "Uw' R U R' F R' F' R Uw",
      chips: ['150 stickers · Centros fijos', 'Sin paridad PLL del 4x4', 'Reducción + Yau5'],
    },
    methods: [
      {
        title: 'Reducción 5x5',
        text: 'Centros de 3×3 por barras, aristas triples con Freeslice, paridad de la última arista y etapa 3x3.',
        href: linkTo('5x5/reduccion'),
        accent: 'green',
        n: 5,
        tag: 'Método estándar · 5 etapas',
      },
      {
        title: 'Yau5',
        text: 'Tres aristas de la cruz antes de los centros laterales y dos pares de F2L adelantados.',
        href: linkTo('5x5/yau5'),
        accent: 'blue',
        n: 5,
        tag: 'Avanzado · Transición fluida',
      },
    ],
  },
  '7x7': {
    intro: CUBE7X7.intro,
    notation: CUBE7X7.notation,
    hero: {
      puzzle: '7x7x7',
      stickering: '7x7-full',
      setupAlg: "3Uw' R U R' F R' F' R 3Uw",
      chips: ['294 stickers · Cubo grande WCA', 'Centros de 5×5 por barras', 'Conmutadores + Freeslice'],
    },
    methods: [
      {
        title: 'Reducción para Cubos Grandes',
        text: 'Centros por barras de 1×5, aristas de 5 piezas por grupos, paridad de alas y consejos de cubos grandes.',
        href: linkTo('7x7/reduccion'),
        accent: 'orange',
        n: 7,
        tag: 'Guía completa · 4 etapas',
      },
    ],
  },
  megaminx: {
    intro: MEGAMINX.intro,
    notation: MEGAMINX.notation,
    hero: {
      puzzle: 'megaminx',
      stickering: 'full',
      setupAlg: "F R U R' U' F'",
      chips: ['12 caras · 50 piezas móviles', 'Estrella + F2L + S2L', 'Última capa en 4 pasos'],
    },
    methods: [
      {
        title: 'Método Estándar (6 etapas)',
        text: 'Estrella, primera cara, F2L, S2L, cierre de caras laterales y última capa en 4 pasos (EO, CO, EP, CP).',
        href: linkTo('megaminx/estandar'),
        accent: 'celeste',
        customSvg: megaminxSvg({ accent: HEX.celeste }),
        tag: 'Estándar WCA · 6 etapas',
      },
    ],
  },
  pyraminx: {
    intro: PYRAMINX.intro,
    notation: PYRAMINX.notation,
    hero: {
      puzzle: 'pyraminx',
      stickering: 'full',
      setupAlg: "R' L R L' U L' U' L",
      chips: ['4 caras · Giros de 120°', 'Principiante (LBL) + L4E', 'Objetivo: Sub-5 s'],
    },
    methods: [
      {
        title: 'Principiante (Capa por Capa)',
        text: 'Puntas, los 3 centros de la base, las 3 aristas inferiores y los 5 casos de la última capa.',
        href: linkTo('pyraminx/principiante'),
        accent: 'yellow',
        customSvg: pyraminxSvg(),
        tag: 'Ideal para empezar · 5 casos LL',
      },
      {
        title: 'Keyhole, L4E, Top-First y 1-Flip',
        text: 'Métodos intermedios y avanzados: cerradura (Keyhole), últimas 4 aristas (L4E) y métodos de punta.',
        href: linkTo('pyraminx/avanzados'),
        accent: 'red',
        customSvg: pyraminxSvg({ colors: ['#ff4d5e', '#3d8bff', '#2ec27e', '#ffd500'] }),
        tag: 'Intermedio / Avanzado',
      },
    ],
  },
};

const CFOP_PARTS = [
  {
    num: 1,
    title: '1. Cruz',
    shortTitle: 'Cruz',
    text: 'Armar las 4 aristas blancas en la base en ≤ 8 movimientos, planeadas en la inspección.',
    href: linkTo('3x3/cfop/cruz'),
    accent: 'white',
    tag: 'Intuitiva · ≤ 8 giros',
    art: { top: [G, HEX.white, G, HEX.white, HEX.white, HEX.white, G, HEX.white, G], left: [G, HEX.green, G, G, G, G, G, G, G], right: [G, HEX.red, G, G, G, G, G, G, G] },
  },
  {
    num: 2,
    title: '2. F2L',
    shortTitle: 'F2L',
    text: `Las dos primeras capas de a pares esquina-arista: ${UNIFIED_COUNTS.fullF2l} casos estándar.`,
    href: linkTo('3x3/cfop/f2l'),
    accent: 'green',
    tag: `${UNIFIED_COUNTS.fullF2l} casos · 4 ranuras`,
    art: { top: G, left: lowerTwo(HEX.green), right: lowerTwo(HEX.red) },
  },
  {
    num: 3,
    title: '3. OLL',
    shortTitle: 'OLL',
    text: `Orientar la última capa amarilla: ${UNIFIED_COUNTS.fullOll} casos (o ${UNIFIED_COUNTS.twoLookOll} algoritmos en 2-look OLL).`,
    href: linkTo('3x3/cfop/oll'),
    accent: 'yellow',
    tag: `2-look: ${UNIFIED_COUNTS.twoLookOll} · Full: ${UNIFIED_COUNTS.fullOll}`,
    art: { top: HEX.yellow, left: lowerTwo(HEX.green), right: lowerTwo(HEX.red) },
  },
  {
    num: 4,
    title: '4. PLL',
    shortTitle: 'PLL',
    text: `Permutar las piezas de la última capa: ${UNIFIED_COUNTS.fullPll} casos (o ${UNIFIED_COUNTS.twoLookPll} algoritmos en 2-look PLL).`,
    href: linkTo('3x3/cfop/pll'),
    accent: 'red',
    tag: `2-look: ${UNIFIED_COUNTS.twoLookPll} · Full: ${UNIFIED_COUNTS.fullPll}`,
    art: { top: HEX.yellow, left: [HEX.red, HEX.green, HEX.orange, ...lowerTwo(HEX.green).slice(3)], right: [HEX.blue, HEX.red, HEX.green, ...lowerTwo(HEX.red).slice(3)] },
  },
];

const escape = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const paragraphs = (list) => (Array.isArray(list) ? list : [list]).filter(Boolean).map((p) => `<p>${escape(p)}</p>`).join('');

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

function breadcrumb(items) {
  const parts = items.map(([label, href], i) =>
    href && i < items.length - 1 ? `<a href="${href}">${escape(label)}</a>` : `<span aria-current="page">${escape(label)}</span>`,
  );
  return `<nav class="breadcrumb" aria-label="Ubicación">${parts.join('<span class="sep" aria-hidden="true">›</span>')}</nav>`;
}

const artFor = (m) => {
  if (m.customSvg) return m.customSvg;
  const spec = m.art ?? { n: m.n ?? 3, top: HEX[m.accent] ?? HEX.blue, left: G, right: D };
  return cubeSvg({ n: 3, ...spec });
};

function linkCards(items, className = '') {
  return `<div class="link-grid ${className}">${items
    .map((m) => {
      const tagHtml = m.tag ? `<span class="card-tag accent-${m.accent}">${escape(m.tag)}</span>` : '';
      const actionHtml = m.href ? `<span class="card-action">Ver guía completa →</span>` : '';
      const inner = `
        <div class="card-art">${artFor(m)}</div>
        ${tagHtml}
        <h3>${escape(m.title)}</h3>
        <p>${escape(m.text)}</p>
        ${actionHtml}
        ${m.href ? '' : '<span class="soon-badge">Próximamente</span>'}
      `;
      return m.href
        ? `<a class="link-card accent-${m.accent}" href="${m.href}">${inner}</a>`
        : `<div class="link-card accent-${m.accent} is-soon" aria-disabled="true">${inner}</div>`;
    })
    .join('')}</div>`;
}

// ---------- Componentes Reutilizables de Presentación ----------

function renderPageHero({ title, subtitle = '', intro = [], chips = [], accent = 'blue', puzzle = '3x3x3', stickering = '', setupAlg = "R U R' U'" }) {
  const hero = el(`
    <header class="method-hero accent-${accent}">
      <div class="method-hero-content">
        <div class="hero-chips">
          ${chips.map((c) => `<span class="hero-chip">${escape(c)}</span>`).join('')}
        </div>
        <h2>${escape(title)}${subtitle ? ` <small>${escape(subtitle)}</small>` : ''}</h2>
        <div class="method-hero-text">${paragraphs(intro)}</div>
      </div>
      <div class="method-hero-visual">
        <div class="hero-cube-stage" role="region" aria-label="Vista 3D interactiva"></div>
        <div class="hero-cube-caption">
          <span>Arrastrá para rotar en 3D</span>
          <button type="button" class="hero-replay-btn" data-hero-play>▶ Animar ejemplo</button>
        </div>
      </div>
    </header>
  `);

  const stage = hero.querySelector('.hero-cube-stage');
  mountHeroPlayer(stage, {
    puzzle,
    stickering,
    alg: setupAlg,
  });

  hero.querySelector('[data-hero-play]')?.addEventListener('click', () => {
    const player = stage.querySelector('twisty-player');
    if (player) {
      player.jumpToStart?.();
      player.play?.();
    } else {
      openSharedCaseModal({ name: title, alg: setupAlg, description: subtitle }, { stickering, puzzle });
    }
  });

  return hero;
}

function renderStatsRow(stats = []) {
  if (!stats.length) return '';
  return `
    <div class="method-stats-row" role="list" aria-label="Resumen del método">
      ${stats
        .map(
          (s) => `
        <div class="method-stat-card" role="listitem">
          <span class="method-stat-icon">${statIconSvg(s.icon)}</span>
          <div class="method-stat-body">
            <span>${escape(s.label)}</span>
            <strong>${escape(s.value)}</strong>
          </div>
        </div>`,
        )
        .join('')}
    </div>
  `;
}

// Stepper / línea de tiempo numerada, conectada y clickeable.
function renderStepper(steps, { title = 'Línea de etapas', isScroll = false } = {}) {
  const wrap = el(`
    <section class="stepper-section" aria-label="${escape(title)}">
      <div class="stepper-head">
        <h3>${escape(title)}</h3>
        <small>Tocá cualquier etapa para ir directo</small>
      </div>
      <ol class="method-stepper">
        ${steps
          .map(
            (s, i) => `
          <li class="stepper-item">
            <a href="${s.href ?? '#'}" ${s.targetId ? `data-scroll-to="${escape(s.targetId)}"` : ''} class="stepper-link">
              <span class="stepper-num">${i + 1}</span>
              <span class="stepper-info">
                <strong>${escape(s.title)}</strong>
                ${s.subtitle ? `<small>${escape(s.subtitle)}</small>` : ''}
              </span>
            </a>
          </li>`,
          )
          .join('')}
      </ol>
    </section>
  `);

  if (isScroll) {
    wrap.addEventListener('click', (e) => {
      const link = e.target.closest('[data-scroll-to]');
      if (!link) return;
      e.preventDefault();
      document.getElementById(link.dataset.scrollTo)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  }
  return wrap;
}

// Bloques de Requisitos previos, Consejos y Errores comunes.
function renderInfoBlocks(meta = {}) {
  const { prerequisites = [], tips = [], mistakes = [] } = meta;
  if (!prerequisites.length && !tips.length && !mistakes.length) return '';

  return `
    <section class="info-blocks-section">
      ${
        prerequisites.length
          ? `<div class="info-block info-prereq">
              <div class="info-block-head">
                <span class="info-badge prereq">Requisitos previos</span>
                <h3>Antes de empezar</h3>
              </div>
              <ul class="info-list">
                ${prerequisites.map((p) => `<li>${escape(p)}</li>`).join('')}
              </ul>
            </div>`
          : ''
      }
      <div class="info-columns">
        ${
          tips.length
            ? `<div class="info-block info-tips">
                <div class="info-block-head">
                  <span class="info-badge tips">Consejos clave</span>
                  <h3>Buenas prácticas</h3>
                </div>
                <div class="info-cards">
                  ${tips
                    .map(
                      (t) => `
                    <article class="info-mini-card">
                      <strong>${escape(t.title)}</strong>
                      <p>${escape(t.text)}</p>
                    </article>`,
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
        ${
          mistakes.length
            ? `<div class="info-block info-mistakes">
                <div class="info-block-head">
                  <span class="info-badge mistakes">Errores comunes</span>
                  <h3>Qué evitar</h3>
                </div>
                <div class="info-cards">
                  ${mistakes
                    .map(
                      (m) => `
                    <article class="info-mini-card">
                      <strong>${escape(m.title)}</strong>
                      <p>${escape(m.text)}</p>
                    </article>`,
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </div>
    </section>
  `;
}

// Navegación Anterior / Siguiente tipo diapositivas al pie de cada página.
function renderPrevNextNav(meta = {}) {
  if (!meta.prev && !meta.next) return '';
  return `
    <nav class="slide-nav" aria-label="Navegación entre páginas">
      ${
        meta.prev
          ? `<a class="slide-nav-btn prev" href="${meta.prev.href}">
              <small>← Anterior</small>
              <strong>${escape(meta.prev.label)}</strong>
            </a>`
          : '<div></div>'
      }
      ${
        meta.next
          ? `<a class="slide-nav-btn next" href="${meta.next.href}">
              <small>Siguiente →</small>
              <strong>${escape(meta.next.label)}</strong>
            </a>`
          : '<div></div>'
      }
    </nav>
  `;
}

// Barra de herramientas de casos: Progreso + Buscador + Filtro de grupo + Filtro aprendidos.
function attachCaseExplorer(page, groups = []) {
  const allCards = () => [...page.querySelectorAll('.case-card')];
  if (allCards().length === 0) return;

  const toolbar = el(`
    <section class="case-explorer-bar" aria-label="Buscador y progreso de casos">
      <div class="explorer-progress-row">
        <div class="explorer-progress-text">
          <strong>Tu progreso en esta página</strong>
          <span id="explorer-progress-label">0 / 0 aprendidos (0%)</span>
        </div>
        <div class="explorer-progress-track" role="progressbar" aria-label="Casos aprendidos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="explorer-progress-fill" id="explorer-progress-fill" style="width: 0%"></div>
        </div>
      </div>

      <div class="explorer-controls-row">
        <label class="explorer-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" id="explorer-search-input" aria-label="Buscar caso, forma o algoritmo" placeholder="Buscar caso, forma o algoritmo (ej. Sune, R U R')…" autocomplete="off" />
        </label>

        ${
          groups.length > 1
            ? `<div class="explorer-group-select-wrap">
                <select id="explorer-group-select" aria-label="Filtrar por grupo">
                  <option value="all">Todos los grupos (${groups.length})</option>
                  ${groups.map((g) => `<option value="${escape(g.id)}">${escape(g.title)}</option>`).join('')}
                </select>
              </div>`
            : ''
        }

        <div class="explorer-status-pills" role="group" aria-label="Estado de aprendizaje">
          <button type="button" class="chip-btn is-active" data-learn-filter="all">Todos</button>
          <button type="button" class="chip-btn" data-learn-filter="unlearned">Por aprender</button>
          <button type="button" class="chip-btn" data-learn-filter="learned">Aprendidos</button>
        </div>
      </div>
      <p class="explorer-empty" id="explorer-empty" hidden>No hay casos que coincidan con la búsqueda o el filtro.</p>
    </section>
  `);

  // Insertamos la barra justo antes de la primera sección de casos
  const firstStep = page.querySelector('.method-step, .two-look');
  if (firstStep) firstStep.before(toolbar);
  else page.append(toolbar);

  let query = '';
  let groupFilter = 'all';
  let learnFilter = 'all';

  const progressLabel = toolbar.querySelector('#explorer-progress-label');
  const progressFill = toolbar.querySelector('#explorer-progress-fill');
  const progressTrack = toolbar.querySelector('.explorer-progress-track');
  const searchInput = toolbar.querySelector('#explorer-search-input');
  const groupSelect = toolbar.querySelector('#explorer-group-select');
  const emptyMsg = toolbar.querySelector('#explorer-empty');

  function updateProgressAndFilters() {
    const cards = allCards();
    // Evitar contar duplicados si el mismo caseKey aparece en 2-look y en OLL completo
    const uniqueByKey = new Map();
    for (const c of cards) {
      uniqueByKey.set(c.dataset.caseKey, c.dataset.learned === 'true');
    }
    const total = uniqueByKey.size;
    const learnedCount = [...uniqueByKey.values()].filter(Boolean).length;
    const pct = total > 0 ? Math.round((learnedCount / total) * 100) : 0;

    progressLabel.textContent = `${learnedCount} / ${total} aprendidos (${pct}%)`;
    progressFill.style.width = `${pct}%`;
    progressTrack.setAttribute('aria-valuenow', String(pct));

    let visibleCount = 0;
    for (const card of cards) {
      const matchQuery = !query || (card.dataset.search ?? '').includes(query);
      const matchGroup = groupFilter === 'all' || card.dataset.group === groupFilter;
      const isLearned = card.dataset.learned === 'true';
      const matchLearn =
        learnFilter === 'all' ||
        (learnFilter === 'learned' && isLearned) ||
        (learnFilter === 'unlearned' && !isLearned);
      const show = matchQuery && matchGroup && matchLearn;
      card.hidden = !show;
      if (show) visibleCount++;
    }

    // Ocultar secciones cuyos casos hayan quedado todos ocultos por el filtro
    for (const sec of page.querySelectorAll('.case-section')) {
      const hasVisible = [...sec.querySelectorAll('.case-card')].some((c) => !c.hidden);
      sec.hidden = !hasVisible;
    }

    emptyMsg.hidden = visibleCount > 0;
  }

  searchInput?.addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    updateProgressAndFilters();
  });

  groupSelect?.addEventListener('change', (e) => {
    groupFilter = e.target.value;
    updateProgressAndFilters();
  });

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-learn-filter]');
    if (!btn) return;
    learnFilter = btn.dataset.learnFilter;
    for (const b of toolbar.querySelectorAll('[data-learn-filter]')) {
      b.classList.toggle('is-active', b === btn);
    }
    updateProgressAndFilters();
  });

  window.addEventListener('learned-cases-changed', (e) => {
    const { caseKey, learned } = e.detail ?? {};
    if (caseKey) {
      for (const c of allCards()) {
        if (c.dataset.caseKey === caseKey) {
          c.dataset.learned = learned ? 'true' : 'false';
          c.classList.toggle('is-learned', learned);
          const b = c.querySelector('[data-action="toggle-learned"]');
          if (b) {
            b.classList.toggle('is-learned', learned);
            b.setAttribute('aria-pressed', String(learned));
            b.querySelector('span').textContent = learned ? 'Aprendido' : 'Aprender';
          }
        }
      }
    }
    updateProgressAndFilters();
  });

  updateProgressAndFilters();
}

function caseGrid(cases, stickering, puzzle = '3x3x3', groupId = '') {
  const grid = el('<div class="case-grid"></div>');
  cases.forEach((c, i) => grid.append(createCaseCard(c, { stickering, index: i, puzzle, groupId })));
  return grid;
}

function caseSection({ id, title, count, text, cases, stickering, puzzle = '3x3x3' }) {
  const section = el(`<section class="method-step case-section" id="sec-${id}">
    <div class="case-section-head">
      <h3>${escape(title)}${count ? ` <small>${count} casos</small>` : ''}</h3>
    </div>
    ${text ? `<p>${escape(text)}</p>` : ''}
  </section>`);
  section.append(caseGrid(cases, stickering, puzzle, id));
  return section;
}

// ---------- Presentaciones y comparativas ----------

function methodsPresentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Ruta Speedcubing</span>
        <h3>Ruta de Aprendizaje Recomendada</h3>
        <p>Desde tu primer cubo resuelto hasta competir en torneos oficiales WCA.</p>
      </div>

      <div class="pathway-grid">
        <div class="pathway-card stage-1">
          <div class="pathway-step">Nivel 1 · Principiante</div>
          <h4>Capa por Capa (LBL)</h4>
          <p>La forma más intuitiva de empezar en 2x2, 3x3 o Pyraminx. Con pocos algoritmos aprendés a colocar esquinas y aristas sin desarmar lo que ya construiste.</p>
          <ul class="pathway-features">
            <li>Objetivo 3x3: ~45 s – 2 min</li>
            <li>🧠 3 algoritmos básicos</li>
            <li>Ideal para tu primera tarde</li>
          </ul>
        </div>

        <div class="pathway-card stage-2 highlight">
          <div class="pathway-step">Nivel 2 · Estándar WCA</div>
          <h4>CFOP de 2 looks → Completo</h4>
          <p>El método más usado en speedcubing. Empezá con CFOP de 2 looks (${UNIFIED_COUNTS.twoLookCfop} algoritmos: ${UNIFIED_COUNTS.twoLookOll} de OLL + ${UNIFIED_COUNTS.twoLookPll} de PLL) y avanzá hacia los ${UNIFIED_COUNTS.fullCfop} casos completos.</p>
          <ul class="pathway-features">
            <li>Objetivo: ~8 s – 25 s</li>
            <li>Cruz + F2L (${UNIFIED_COUNTS.fullF2l}) + OLL (${UNIFIED_COUNTS.fullOll}) + PLL (${UNIFIED_COUNTS.fullPll})</li>
            <li>Progresión paso a paso</li>
          </ul>
        </div>

        <div class="pathway-card stage-3">
          <div class="pathway-step">Nivel 3 · Bloques y Reducción</div>
          <h4>Roux, Ortega/CLL y Yau</h4>
          <p>Dominá métodos sin rotaciones como Roux (~48 giros en 3x3), CLL en 2x2 y la reducción avanzada Yau / Yau5 para 4x4 y 5x5.</p>
          <ul class="pathway-features">
            <li>Alta eficiencia de movimientos</li>
            <li>Bloques 1×2×3, CMLL y 3-2-3</li>
            <li>✨ Dominio completo de las categorías</li>
          </ul>
        </div>
      </div>

      <div class="features-banner">
        <div class="feature-item">
          <div class="feature-icon">${statIconSvg('moves')}</div>
          <div class="feature-text">
            <strong>Visor 3D Único + Miniaturas 2D</strong>
            <span>Miniaturas 2D instantáneas en cada tarjeta y un visor 3D interactivo compartido que no traba el celular.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">${statIconSvg('book')}</div>
          <div class="feature-text">
            <strong>Seguimiento de Progreso</strong>
            <span>Marcá los casos que ya aprendiste, filtrá los que te faltan y sincronizalos en la nube.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">${statIconSvg('layers')}</div>
          <div class="feature-text">
            <strong>Algoritmos Verificados con KPuzzle</strong>
            <span>Cada algoritmo de la plataforma se comprueba matemáticamente antes de publicarse.</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function puzzle3x3Presentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Comparativa 3x3</span>
        <h3>¿Qué método es mejor para vos?</h3>
        <p>Compará los métodos de resolución del cubo 3x3.</p>
      </div>

      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Principiante</h4>
            <span class="comp-badge">Para empezar</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Baja</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>3 principales</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~95–110 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~45 s – 2 min</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Capa por capa</strong></div>
        </div>

        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>CFOP (Fridrich)</h4>
            <span class="comp-badge popular">★ ${CFOP_BADGE}</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Media / Alta</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>${UNIFIED_COUNTS.fullCfop} (o ${UNIFIED_COUNTS.twoLookCfop} en 2-look)</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~55 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~8 s – 25 s</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Cruz + F2L + OLL + PLL</strong></div>
        </div>

        <div class="comparison-col">
          <div class="comp-header">
            <h4>Roux</h4>
            <span class="comp-badge">Eficiente</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Media (intuitivo)</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>${UNIFIED_COUNTS.rouxCmll} casos (CMLL)</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~48 giros (STM)</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~9 s – 25 s</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Bloques + CMLL + LSE</strong></div>
        </div>
      </div>

      <div class="other-methods-card">
        <div class="other-methods-head">
          <span class="presentation-badge">Otros métodos</span>
          <h4>Método ZZ (Zbigniew Zborowski)</h4>
        </div>
        <p>
          El método <strong>ZZ</strong> comienza con <strong>EO-Line</strong> (o <strong>EO-Cross</strong> en su variante moderna): durante el primer paso orienta las 12 aristas del cubo de modo que el resto de la resolución se completa usando únicamente giros <code>R</code>, <code>U</code> y <code>L</code> sin rotar nunca el cubo y dejando siempre la cruz superior ya orientada al llegar a la última capa.
        </p>
      </div>
    </section>
  `;
}

function puzzle2x2Presentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Comparativa 2x2</span>
        <h3>Ruta de progresión en 2x2</h3>
        <p>Cómo pasar de armar tu primer 2x2 a resolverlo en una sola mirada.</p>
      </div>

      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Principiante</h4>
            <span class="comp-badge">Paso 1</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>1ra capa ordenada</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>2–3 básicos</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~25–30 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~8 s – 20 s</strong></div>
        </div>

        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>Ortega (Varasano)</h4>
            <span class="comp-badge popular">★ Recomendado</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>1ra cara libre (sin ordenar)</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>${UNIFIED_COUNTS.ortegaTotal} (${UNIFIED_COUNTS.ortegaOll} OLL + ${UNIFIED_COUNTS.ortegaPbl} PBL)</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~18–20 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~3,5 s – 7 s</strong></div>
        </div>

        <div class="comparison-col">
          <div class="comp-header">
            <h4>CLL</h4>
            <span class="comp-badge">Avanzado</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>1ra capa ordenada</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>${UNIFIED_COUNTS.cll2x2} casos</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~14–16 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~2 s – 4,5 s</strong></div>
        </div>
      </div>

      <div class="other-methods-card">
        <div class="other-methods-head">
          <span class="presentation-badge">Nivel Élite</span>
          <h4>Método EG (Erik–Gunnar)</h4>
        </div>
        <p>
          <strong>EG</strong> extiende CLL para no exigir una primera capa ordenada: armas cualquier cara de un mismo color y resolvés el resto del cubo en un solo algoritmo según cómo hayan quedado las esquinas inferiores: <strong>CLL</strong> (resueltas), <strong>EG-1</strong> (intercambio adyacente abajo) o <strong>EG-2</strong> (intercambio diagonal abajo).
        </p>
      </div>
    </section>
  `;
}

function puzzle4x4Presentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Comparativa 4x4</span>
        <h3>Reducción estándar vs Yau</h3>
        <p>Ambos métodos reducen el 4x4 a un 3x3 equivalente, pero organizan los centros y la cruz en distinto orden.</p>
      </div>

      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Reducción</h4>
            <span class="comp-badge">Estándar</span>
          </div>
          <div class="comp-row"><span>Orden</span><strong>6 centros → 12 aristas → 3x3</strong></div>
          <div class="comp-row"><span>Ventaja</span><strong>Libertad total al armar centros</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~110–130 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~55 s – 1:45 min</strong></div>
        </div>

        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>Método Yau</h4>
            <span class="comp-badge popular">★ El más usado en torneo</span>
          </div>
          <div class="comp-row"><span>Orden</span><strong>2 centros → 3 aristas cruz → 4 centros → cruz → 3-2-3 → F2L</strong></div>
          <div class="comp-row"><span>Ventaja</span><strong>La cruz ya está lista al terminar las aristas</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~95–115 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~30 s – 1:05 min</strong></div>
        </div>
      </div>
    </section>
  `;
}

function puzzle5x5Presentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Comparativa 5x5</span>
        <h3>Reducción Freeslice vs Yau5</h3>
        <p>En 5x5 los centros son fijos: no existe la paridad de permutación del 4x4, pero sí la paridad de alas en la última arista.</p>
      </div>
      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Reducción (Freeslice)</h4>
            <span class="comp-badge">Estándar</span>
          </div>
          <div class="comp-row"><span>Orden</span><strong>6 centros (3×3) → 8 aristas → 4 aristas → 3x3</strong></div>
          <div class="comp-row"><span>Paridades</span><strong>Solo paridad de alas (última arista)</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~1:15 – 2:30 min</strong></div>
        </div>
        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>Yau5</h4>
            <span class="comp-badge popular">★ Avanzado</span>
          </div>
          <div class="comp-row"><span>Orden</span><strong>2 centros → 3 cruz → 4 centros → cruz + 2 F2L → últimas aristas</strong></div>
          <div class="comp-row"><span>Ventaja</span><strong>Entra al 3x3 con la cruz y 2 pares de F2L listos</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~50 s – 1:40 min</strong></div>
        </div>
      </div>
    </section>
  `;
}

function puzzle7x7Presentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Claves del 7x7</span>
        <h3>Estrategia para cubos grandes</h3>
        <p>Cada centro tiene 25 piezas (5×5) y cada arista tiene 5 piezas (1 central + 2 alas internas + 2 externas).</p>
      </div>
      <div class="pathway-grid">
        <div class="pathway-card stage-1">
          <div class="pathway-step">Paso 1 · Centros</div>
          <h4>Barras de 1×5 de adentro hacia afuera</h4>
          <p>Armá siempre primero la barra central que contiene el centro fijo, luego las dos barras de capa 3 (3R/3L) y cerrá con las barras de borde (2R/2L).</p>
        </div>
        <div class="pathway-card stage-2 highlight">
          <div class="pathway-step">Paso 2 · Aristas</div>
          <h4>Freeslice por grupos (8 + 4)</h4>
          <p>En la banda ecuatorial reuní el bloque interno de 3 piezas (midge + alas internas), sumale las 2 alas externas y guardá 8 aristas en U y D antes de cerrar las últimas 4.</p>
        </div>
        <div class="pathway-card stage-3">
          <div class="pathway-step">Paso 3 · Cierre</div>
          <h4>Paridad de alas + Etapa 3x3</h4>
          <p>Si en la última arista quedan invertidas las alas internas (3R) o externas (2R), aplicá el algoritmo de paridad de alas sobre esa capa antes de resolver como 3x3.</p>
        </div>
      </div>
    </section>
  `;
}

function puzzleMegaminxPresentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Ruta Megaminx</span>
        <h3>Del método estándar a OLL / PLL avanzado</h3>
        <p>Cómo organizar las 12 caras sin perderte buscando piezas.</p>
      </div>
      <div class="pathway-grid">
        <div class="pathway-card stage-1">
          <div class="pathway-step">Etapas 1–3 · Mitad inferior</div>
          <h4>Estrella + Primera Cara + F2L</h4>
          <p>Igual que en el 3x3 pero con 5 lados: armás la estrella blanca en la base y completás los 5 pares esquina-arista inferiores.</p>
        </div>
        <div class="pathway-card stage-2 highlight">
          <div class="pathway-step">Etapas 4–5 · Mitad superior</div>
          <h4>S2L (Second Two Layers) en orden fijo</h4>
          <p>Recorré las caras laterales en círculo: en cada cara poné sus 2 aristas inferiores y sus 2 pares laterales hasta dejar solo la cara superior U.</p>
        </div>
        <div class="pathway-card stage-3">
          <div class="pathway-step">Etapa 6 · Última Capa</div>
          <h4>4 pasos (2-Look) → OLL / PLL completo</h4>
          <p>Empezá con la última capa en 4 pasos (orientar aristas, orientar esquinas, permutar aristas y permutar esquinas). En nivel avanzado se agrupan en OLL y PLL directo de Megaminx.</p>
        </div>
      </div>
    </section>
  `;
}

function puzzlePyraminxPresentation() {
  return `
    <section class="methods-presentation">
      <div class="presentation-header">
        <span class="presentation-badge">Comparativa Pyraminx</span>
        <h3>Capa por Capa vs Keyhole, L4E y Top-First</h3>
        <p>Elegí tu método según tu etapa de aprendizaje en Pyraminx.</p>
      </div>
      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Principiante (LBL)</h4>
            <span class="comp-badge">Para empezar</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>3 centros + 3 aristas abajo</strong></div>
          <div class="comp-row"><span>Última capa</span><strong>5 casos verificados</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~16–22 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~6 s – 14 s</strong></div>
        </div>
        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>L4E (Last 4 Edges)</h4>
            <span class="comp-badge popular">★ El más usado</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>"V" en la base (3 centros + 2 aristas)</strong></div>
          <div class="comp-row"><span>Cierre</span><strong>Las últimas 4 aristas en 1 paso</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~11–14 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~2,5 s – 5,5 s</strong></div>
        </div>
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Keyhole y Top-First (1-Flip)</h4>
            <span class="comp-badge">Métodos de punta</span>
          </div>
          <div class="comp-row"><span>Base</span><strong>Bloque alrededor de la punta U</strong></div>
          <div class="comp-row"><span>Ventaja</span><strong>Planeamiento muy rápido en inspección</strong></div>
          <div class="comp-row"><span>Movimientos prom.</span><strong>~12–16 giros</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>~3 s – 6 s</strong></div>
        </div>
      </div>
    </section>
  `;
}

// ---------- Páginas ----------

function indexPage(route) {
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);
  page.append(
    renderPageHero({
      title: 'Métodos de Resolución',
      subtitle: 'Guías interactivas paso a paso',
      intro: [
        'Aprendé a resolver cada puzzle desde tu primera vez hasta nivel de competición, con diagramas 2D claros, visor 3D compartido y seguimiento de casos aprendidos.',
      ],
      chips: ['Algoritmos verificados con KPuzzle', 'Progreso guardado', 'Visor 3D + 2D-LL'],
      accent: 'celeste',
      puzzle: '3x3x3',
      stickering: 'pll',
      setupAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    }),
  );
  page.append(el(linkCards(PUZZLES, 'covers')));
  page.append(el(methodsPresentation()));
  return page;
}

function puzzlePage(route) {
  const data = PUZZLE_METHODS[route.puzzle];
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  const heroSpec = data.hero ?? {
    puzzle: '3x3x3',
    stickering: 'full',
    setupAlg: "R U R' U'",
    chips: [route.title],
  };

  page.append(
    renderPageHero({
      title: route.title,
      intro: [data.intro],
      chips: heroSpec.chips,
      accent: 'blue',
      puzzle: heroSpec.puzzle,
      stickering: heroSpec.stickering,
      setupAlg: heroSpec.setupAlg,
    }),
  );

  page.append(el(`<div>${linkCards(data.methods)}</div>`));

  if (data.notation) page.append(notationSection(data.notation));
  if (route.puzzle === '3x3') page.append(el(puzzle3x3Presentation()));
  if (route.puzzle === '2x2') page.append(el(puzzle2x2Presentation()));
  if (route.puzzle === '4x4') page.append(el(puzzle4x4Presentation()));
  if (route.puzzle === '5x5') page.append(el(puzzle5x5Presentation()));
  if (route.puzzle === '7x7') page.append(el(puzzle7x7Presentation()));
  if (route.puzzle === 'megaminx') page.append(el(puzzleMegaminxPresentation()));
  if (route.puzzle === 'pyraminx') page.append(el(puzzlePyraminxPresentation()));

  return page;
}

function notationSection(notation) {
  const section = el(`<section class="method-step notation" id="sec-notacion">
    <h3>${escape(notation.title)}</h3>
    ${paragraphs(notation.text)}
    <dl class="notation-list">
      ${notation.rows.map(([move, text]) => `<div><dt>${escape(move)}</dt><dd>${escape(text)}</dd></div>`).join('')}
    </dl>
  </section>`);
  section.append(caseGrid(notation.cases, notation.stickering, notation.puzzle, 'notacion'));
  return section;
}

// Página completa de método CFOP (#/metodos/3x3/cfop) con las 9 secciones requeridas.
function cfopPage(route) {
  const meta = PAGE_METADATA.cfop;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  // 1. Hero
  page.append(
    renderPageHero({
      title: 'CFOP (Método Fridrich)',
      subtitle: CFOP_BADGE,
      intro: [
        `El método estándar del speedcubing moderno: se arma la Cruz en la base, las dos primeras capas de a pares (F2L), la orientación de la última capa (OLL) y la permutación final (PLL).`,
        `Podés dominarlo primero en versión de 2 looks con solo ${UNIFIED_COUNTS.twoLookCfop} algoritmos (${UNIFIED_COUNTS.twoLookOll} de 2-look OLL + ${UNIFIED_COUNTS.twoLookPll} de 2-look PLL) y luego expandir a los ${UNIFIED_COUNTS.fullCfop} casos completos.`,
      ],
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: meta.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  // 2. Stats
  page.append(el(renderStatsRow(meta.stats)));

  // 3. Qué vas a aprender
  page.append(
    el(`
      <section class="method-learn-section">
        <div class="presentation-header">
          <span class="presentation-badge">Estructura del método</span>
          <h3>Qué vas a aprender en CFOP</h3>
          <p>Las cuatro etapas que transforman una resolución de ~1 minuto en una de ~10–20 segundos.</p>
        </div>
        <div class="what-learn-grid">
          ${meta.whatYouLearn
            .map(
              (item) => `
            <article class="what-learn-card">
              <h4>${escape(item.title)}</h4>
              <p>${escape(item.text)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </section>
    `),
  );

  // 4. Stepper de etapas con descripción
  page.append(
    renderStepper(
      CFOP_PARTS.map((p) => ({
        title: p.shortTitle,
        subtitle: p.tag,
        href: p.href,
      })),
      { title: 'Recorrido de las 4 etapas de CFOP' },
    ),
  );

  // 5. Tarjetas de etapa con vista previa
  page.append(
    el(`
      <section class="method-stages-cards">
        <h3>Explorá cada etapa en detalle</h3>
        ${linkCards(CFOP_PARTS)}
      </section>
    `),
  );

  // 6. Tiempo estimado de aprendizaje y objetivo de tiempos
  page.append(
    el(`
      <section class="learning-goals-section">
        <div class="presentation-header">
          <span class="presentation-badge">Plan de entrenamiento</span>
          <h3>Tiempo estimado de aprendizaje y objetivos</h3>
          <p>Progresión realista para incorporar CFOP sin saturarte de algoritmos el primer día.</p>
        </div>
        <div class="pathway-grid">
          ${meta.learningGoals
            .map(
              (g, i) => `
            <article class="pathway-card stage-${i + 1} ${i === 0 ? 'highlight' : ''}">
              <div class="pathway-step">${escape(g.time)} · Objetivo ${escape(g.target)}</div>
              <h4>${escape(g.stage)}</h4>
              <p>${escape(g.desc)}</p>
            </article>`,
            )
            .join('')}
        </div>
      </section>
    `),
  );

  // 7. Consejos, errores comunes y requisitos previos
  page.append(el(renderInfoBlocks(meta)));

  // 8. CTA a la primera etapa
  page.append(
    el(`
      <section class="method-cta-banner">
        <div>
          <span class="presentation-badge">Paso 1 de 4</span>
          <h3>¿Listo para empezar con CFOP?</h3>
          <p>Arrancá dominando la Cruz eficiente en ≤ 8 movimientos antes de pasar a los pares de F2L.</p>
        </div>
        <a class="cta-primary-btn" href="${meta.ctaFirstStage.href}">${escape(meta.ctaFirstStage.label)}</a>
      </section>
    `),
  );

  // 9. Navegación al siguiente método / etapa
  page.append(el(renderPrevNextNav(meta)));

  return page;
}

function stepsPage(data, route, puzzle, metaKey) {
  const meta = PAGE_METADATA[metaKey] ?? {
    puzzle,
    stickering: data.steps[0]?.stickering ?? '',
    setupAlg: data.steps[0]?.cases?.[0]?.alg ?? "R U R' U'",
    accent: 'green',
    chips: [data.title],
    stats: [],
  };

  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: data.title,
      intro: data.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: meta.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  if (meta.stats?.length) page.append(el(renderStatsRow(meta.stats)));

  page.append(
    renderStepper(
      data.steps.map((s) => ({
        title: s.title,
        subtitle: s.goal,
        targetId: `paso-${s.id}`,
      })),
      { title: `Etapas de ${data.title}`, isScroll: true },
    ),
  );

  const groupsForFilter = [];
  data.steps.forEach((step, n) => {
    const groupId = `paso-${step.id}`;
    groupsForFilter.push({ id: groupId, title: `${n + 1}. ${step.title}` });
    const section = el(`<section class="method-step case-section" id="${groupId}">
      <h3><span class="step-number">${n + 1}</span>${escape(step.title)}</h3>
      <p class="step-goal"><strong>Objetivo:</strong> ${escape(step.goal)}</p>
      ${paragraphs(step.text)}
    </section>`);
    if (step.cases?.length) {
      section.append(caseGrid(step.cases, step.stickering, puzzle, groupId));
    }
    page.append(section);
  });

  attachCaseExplorer(page, groupsForFilter);
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function beginnerPage(route) {
  return stepsPage(BEGINNER, route, '3x3x3', 'beginner');
}

function beginner2Page(route) {
  return stepsPage(BEGINNER_2X2, route, '2x2x2', 'beginner2');
}

function reduction4Page(route) {
  return stepsPage(REDUCTION, route, '4x4x4', 'reduction4');
}

function yauPage(route) {
  return stepsPage(YAU, route, '4x4x4', 'yau');
}

function reduction5Page(route) {
  return stepsPage(REDUCTION_5X5, route, '5x5x5', 'reduction5');
}

function yau5Page(route) {
  return stepsPage(YAU5, route, '5x5x5', 'yau5');
}

function reduction7Page(route) {
  return stepsPage(REDUCTION_7X7, route, '7x7x7', 'reduction7');
}

function megaminxStandardPage(route) {
  const page = stepsPage(MEGAMINX_STANDARD, route, 'megaminx', 'megaminxStandard');
  page.insertAdjacentHTML(
    'beforeend',
    `<section class="other-methods-card" style="margin-top: 20px;">
      <div class="other-methods-head">
        <span class="presentation-badge">Nivel Avanzado</span>
        <h4>OLL y PLL completos en Megaminx</h4>
      </div>
      <p>
        Una vez dominada la última capa en 4 pasos (orientar aristas → orientar esquinas → permutar aristas → permutar esquinas), los competidores avanzados agrupan la orientación superior en un solo paso (<strong>OLL de Megaminx</strong>) y la permutación final en un solo paso (<strong>PLL de Megaminx</strong>), incorporando los casos de forma progresiva a partir de los bloques y ciclos que más aparecen en resolución.
      </p>
    </section>`,
  );
  return page;
}

function pyraminxBeginnerPage(route) {
  return stepsPage(PYRAMINX_BEGINNER, route, 'pyraminx', 'pyraminxBeginner');
}

function pyraminxAdvancedPage(route) {
  return stepsPage(PYRAMINX_ADVANCED, route, 'pyraminx', 'pyraminxAdvanced');
}

function mirrorPage(route) {
  const page = stepsPage(MIRROR_METHOD, route, 'mirror', 'mirror');

  // Sección explicativa: Cómo identificar las piezas
  const recognitionSection = el(`<section class="other-methods-card" style="margin-top: 24px;">
    <div class="other-methods-head">
      <span class="presentation-badge">Reconocimiento</span>
      <h4>Cómo identificar las piezas en el Mirror</h4>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 12px;">
      ${MIRROR_METHOD.recognitionGuide
        .map(
          (g) => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 14px;">
          <h5 style="margin: 0 0 6px; color: var(--accent); font-size: 0.95rem;">${g.title}</h5>
          <p style="margin: 0; font-size: 0.85rem; color: var(--muted); line-height: 1.45;">${g.desc}</p>
        </div>`
        )
        .join('')}
    </div>
  </section>`);
  page.append(recognitionSection);

  // Sección explicativa: CFOP en el Mirror
  const cfopSection = el(`<section class="other-methods-card" style="margin-top: 20px;">
    <div class="other-methods-head">
      <span class="presentation-badge">Nivel Avanzado</span>
      <h4>${MIRROR_METHOD.cfopGuide.title}</h4>
    </div>
    <p style="margin: 8px 0 10px; font-size: 0.88rem; color: var(--muted); line-height: 1.5;">
      ${MIRROR_METHOD.cfopGuide.desc}
    </p>
    <ul style="margin: 0 0 14px; padding-left: 20px; font-size: 0.86rem; color: var(--text); line-height: 1.55;">
      ${MIRROR_METHOD.cfopGuide.points.map((pt) => `<li>${pt}</li>`).join('')}
    </ul>
    <p style="margin: 0;">
      <a class="text-link" href="${MIRROR_METHOD.cfopGuide.linkHref}">${MIRROR_METHOD.cfopGuide.linkText}</a>
    </p>
  </section>`);
  page.append(cfopSection);

  return page;
}

function groupedStagePage(data, route, metaKey, mapCase = (c) => c, extraBeforeCases = null) {
  const meta = PAGE_METADATA[metaKey] ?? {};
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: data.title,
      subtitle: data.subtitle,
      intro: data.intro,
      chips: meta.chips ?? [],
      accent: meta.accent ?? 'blue',
      puzzle: meta.puzzle ?? '3x3x3',
      stickering: data.stickering ?? meta.stickering,
      setupAlg: meta.setupAlg ?? data.groups[0]?.cases?.[0]?.alg ?? "R U R' U'",
    }),
  );

  if (meta.stats?.length) page.append(el(renderStatsRow(meta.stats)));

  page.append(
    renderStepper(
      data.groups.map((g) => ({
        title: g.title,
        subtitle: `${g.cases.length} casos`,
        targetId: `sec-${g.id}`,
      })),
      { title: `Grupos de ${data.title}`, isScroll: true },
    ),
  );

  if (extraBeforeCases) page.append(extraBeforeCases);

  for (const group of data.groups) {
    page.append(
      caseSection({
        id: group.id,
        title: group.title,
        count: group.cases.length,
        text: group.text,
        cases: group.cases.map(mapCase),
        stickering: data.stickering,
        puzzle: meta.puzzle ?? '3x3x3',
      }),
    );
  }

  attachCaseExplorer(
    page,
    data.groups.map((g) => ({ id: g.id, title: g.title })),
  );
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function pllPage(route) {
  const twoLookInfo = PAGE_METADATA.pll.twoLookSummary;
  const twoLookBlock = el(`
    <section class="two-look-banner">
      <div class="presentation-header">
        <span class="presentation-badge">Versión reducida · ${UNIFIED_COUNTS.twoLookPll} algoritmos</span>
        <h3>${escape(twoLookInfo.title)}</h3>
        <p>${escape(twoLookInfo.text)}</p>
      </div>
      <div class="pathway-grid">
        ${twoLookInfo.steps
          .map(
            (s, i) => `
          <article class="pathway-card stage-${i + 1}">
            <h4>${escape(s.name)}</h4>
            <p>${escape(s.desc)}</p>
          </article>`,
          )
          .join('')}
      </div>
    </section>
  `);
  return groupedStagePage(PLL, route, 'pll', (c) => c, twoLookBlock);
}

function f2lPage(route) {
  let n = 0;
  const intuitive = PAGE_METADATA.f2l.intuitiveSummary;
  const intuitiveBlock = el(`
    <section class="two-look-banner">
      <div class="presentation-header">
        <span class="presentation-badge">Comprensión conceptual</span>
        <h3>${escape(intuitive.title)}</h3>
        <p>${escape(intuitive.text)}</p>
      </div>
      <div class="pathway-grid">
        ${intuitive.items
          .map(
            (item, i) => `
          <article class="pathway-card stage-${i + 1}">
            <h4>${escape(item.name)}</h4>
            <p>${escape(item.desc)}</p>
          </article>`,
          )
          .join('')}
      </div>
    </section>
  `);
  return groupedStagePage(
    F2L,
    route,
    'f2l',
    (c) => ({
      ...c,
      name: `Caso ${++n}`,
      description: describeF2L(c),
    }),
    intuitiveBlock,
  );
}

function ollPage(route) {
  const meta = PAGE_METADATA.oll;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: OLL.title,
      subtitle: OLL.subtitle,
      intro: OLL.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: OLL.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  page.append(el(renderStatsRow(meta.stats)));

  page.append(
    renderStepper(
      [
        { title: `OLL en 2 pasos (${UNIFIED_COUNTS.twoLookOll} algs)`, subtitle: '3 de aristas + 7 de esquinas', targetId: 'sec-2-pasos' },
        ...OLL.groups.map((g) => ({ title: g.title, subtitle: `${g.cases.length} casos`, targetId: `sec-${g.id}` })),
      ],
      { title: 'Navegación de OLL (2-look y 57 casos)', isScroll: true },
    ),
  );

  const allCases = OLL.groups.flatMap((g) => g.cases);
  const twoLook = el(`<section class="method-step two-look" id="sec-2-pasos">
    <h3>OLL en 2 pasos (2-look OLL) <small>${UNIFIED_COUNTS.twoLookOll} algoritmos</small></h3>
    <p>${escape(OLL_2LOOK.intro)}</p>
  </section>`);
  twoLook.append(
    caseSection({
      id: '2-pasos-aristas',
      title: OLL_2LOOK.edges.title,
      count: OLL_2LOOK.edges.cases.length,
      text: OLL_2LOOK.edges.text,
      cases: OLL_2LOOK.edges.cases,
      stickering: OLL_2LOOK.edges.stickering,
    }),
    caseSection({
      id: '2-pasos-esquinas',
      title: OLL_2LOOK.corners.title,
      count: OLL_2LOOK.corners.caseIds.length,
      text: OLL_2LOOK.corners.text,
      cases: OLL_2LOOK.corners.caseIds.map((id) => allCases.find((c) => c.id === id)),
      stickering: OLL.stickering,
    }),
  );
  page.append(twoLook);

  const full = el(`<section class="method-step"><h3>OLL completa <small>${UNIFIED_COUNTS.fullOll} casos</small></h3>
    <p>Agrupadas por la forma que hace el amarillo arriba. El número es el estándar que usa toda la comunidad.</p></section>`);
  page.append(full);
  for (const group of OLL.groups) {
    page.append(
      caseSection({
        id: group.id,
        title: group.title,
        count: group.cases.length,
        text: group.text,
        cases: group.cases,
        stickering: OLL.stickering,
      }),
    );
  }

  attachCaseExplorer(page, [
    { id: '2-pasos-aristas', title: '2-Look · Aristas (3)' },
    { id: '2-pasos-esquinas', title: '2-Look · Esquinas (7)' },
    ...OLL.groups.map((g) => ({ id: g.id, title: g.title })),
  ]);
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function crossPage(route) {
  const meta = PAGE_METADATA.cross;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: CROSS.title,
      subtitle: CROSS.subtitle,
      intro: CROSS.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: CROSS.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  page.append(el(renderStatsRow(meta.stats)));

  page.append(
    el(`<div class="tip-grid">
      ${CROSS.tips.map((t, i) => `<article class="tip-card"><span class="tip-number">${i + 1}</span><h3>${escape(t.title)}</h3><p>${escape(t.text)}</p></article>`).join('')}
    </div>`),
  );

  page.append(
    caseSection({
      id: 'ejemplos',
      title: 'Ejemplos resueltos sobre mezclas reales',
      count: CROSS.examples.length,
      text: CROSS.examplesText,
      cases: CROSS.examples.map((ex) => ({ ...ex, description: `Mezcla: ${ex.scramble}` })),
      stickering: CROSS.stickering,
    }),
  );

  attachCaseExplorer(page, [{ id: 'ejemplos', title: 'Ejemplos de Cruz' }]);
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function rouxPage(route) {
  const meta = PAGE_METADATA.roux;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: ROUX.title,
      subtitle: ROUX.subtitle,
      intro: ROUX.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: meta.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  page.append(el(renderStatsRow(meta.stats)));

  page.append(
    el(`<section class="method-step">
      <h3>Comparativa rápida: CFOP vs Roux</h3>
      <div class="compare-wrap">
        <table class="compare">
          <thead><tr><th>Aspecto</th><th>CFOP</th><th>Roux</th></tr></thead>
          <tbody>${ROUX.comparison
            .map(([what, cfop, roux]) => `<tr><th scope="row">${escape(what)}</th><td>${escape(cfop)}</td><td>${escape(roux)}</td></tr>`)
            .join('')}</tbody>
        </table>
      </div>
    </section>`),
  );

  page.append(
    renderStepper(
      [
        ...ROUX.stages.map((s) => ({ title: s.title.replace(/^\d\.\s*/, ''), subtitle: 'Bloque 1×2×3', targetId: `sec-${s.id}` })),
        { title: 'CMLL', subtitle: '42 casos de esquinas', targetId: 'sec-cmll' },
        { title: 'LSE (6 aristas)', subtitle: 'EO · UL/UR · 4c', targetId: 'sec-lse' },
      ],
      { title: 'Las 4 etapas del método Roux', isScroll: true },
    ),
  );

  const filterGroups = [];

  for (const stage of ROUX.stages) {
    filterGroups.push({ id: stage.id, title: stage.title });
    page.append(
      caseSection({
        id: stage.id,
        title: stage.title,
        count: stage.cases.length,
        text: stage.text.join(' '),
        cases: stage.cases,
        stickering: stage.stickering,
      }),
    );
  }

  const cmll = el(`<section class="method-step" id="sec-cmll">
    <h3>${escape(ROUX.cmll.title)} <small>${UNIFIED_COUNTS.rouxCmll} casos</small></h3>
    ${paragraphs(ROUX.cmll.text)}
  </section>`);
  page.append(cmll);
  for (const group of ROUX.cmll.groups) {
    const gid = `cmll-${group.id}`;
    filterGroups.push({ id: gid, title: `CMLL ${group.title}` });
    page.append(
      caseSection({
        id: gid,
        title: `CMLL ${group.title}`,
        count: group.cases.length,
        text: group.text,
        cases: group.cases,
        stickering: ROUX.cmll.stickering,
      }),
    );
  }

  page.append(
    el(`<section class="method-step" id="sec-lse">
      <h3>${escape(ROUX.lse.title)}</h3>
      ${paragraphs(ROUX.lse.text)}
    </section>`),
  );
  for (const step of ROUX.lse.steps) {
    const gid = `lse-${step.id}`;
    filterGroups.push({ id: gid, title: step.title });
    page.append(caseSection({ id: gid, title: step.title, count: step.cases.length, text: step.text, cases: step.cases, stickering: step.stickering }));
  }

  attachCaseExplorer(page, filterGroups);
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function ortegaPage(route) {
  const meta = PAGE_METADATA.ortega;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: ORTEGA.title,
      subtitle: ORTEGA.subtitle,
      intro: ORTEGA.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: meta.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  page.append(el(renderStatsRow(meta.stats)));

  page.append(
    renderStepper(
      [
        { title: 'Primera cara', subtitle: 'Intuitiva (sin ordenar)', targetId: 'sec-cara' },
        { title: 'OLL', subtitle: `${UNIFIED_COUNTS.ortegaOll} casos de orientación`, targetId: 'sec-oll2' },
        { title: 'PBL', subtitle: `${UNIFIED_COUNTS.ortegaPbl} casos de permutación`, targetId: 'sec-pbl' },
      ],
      { title: 'Las 3 etapas de Ortega', isScroll: true },
    ),
  );

  page.append(caseSection({ id: 'cara', title: ORTEGA.face.title, count: ORTEGA.face.cases.length, text: ORTEGA.face.text.join(' '), cases: ORTEGA.face.cases, stickering: ORTEGA.face.stickering, puzzle: '2x2x2' }));
  page.append(caseSection({ id: 'oll2', title: ORTEGA.oll.title, count: ORTEGA.oll.cases.length, text: ORTEGA.oll.text.join(' '), cases: ORTEGA.oll.cases, stickering: ORTEGA.oll.stickering, puzzle: '2x2x2' }));
  page.append(caseSection({ id: 'pbl', title: ORTEGA.pbl.title, count: ORTEGA.pbl.cases.length, text: ORTEGA.pbl.text.join(' '), cases: ORTEGA.pbl.cases, stickering: ORTEGA.pbl.stickering, puzzle: '2x2x2' }));
  page.append(el(`<section class="other-methods-card"><h4>¿Y después de Ortega?</h4><p>${escape(ORTEGA.eg)}</p></section>`));

  attachCaseExplorer(page, [
    { id: 'cara', title: '1. Primera cara' },
    { id: 'oll2', title: '2. OLL (7)' },
    { id: 'pbl', title: '3. PBL (5)' },
  ]);
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function cllPage(route) {
  const meta = PAGE_METADATA.cll;
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
  </div>`);

  page.append(
    renderPageHero({
      title: CLL.title,
      subtitle: CLL.subtitle,
      intro: CLL.intro,
      chips: meta.chips,
      accent: meta.accent,
      puzzle: meta.puzzle,
      stickering: CLL.stickering,
      setupAlg: meta.setupAlg,
    }),
  );

  page.append(el(renderStatsRow(meta.stats)));

  page.append(
    renderStepper(
      CLL.groups.map((g) => ({
        title: `Grupo ${g.title}`,
        subtitle: `${g.cases.length} casos`,
        targetId: `sec-cll-${g.id}`,
      })),
      { title: 'Los 7 grupos de CLL (42 casos)', isScroll: true },
    ),
  );

  for (const group of CLL.groups) {
    page.append(
      caseSection({
        id: `cll-${group.id}`,
        title: `CLL ${group.title}`,
        count: group.cases.length,
        text: group.text,
        cases: group.cases,
        stickering: CLL.stickering,
        puzzle: '2x2x2',
      }),
    );
  }

  attachCaseExplorer(
    page,
    CLL.groups.map((g) => ({ id: `cll-${g.id}`, title: `CLL ${g.title}` })),
  );
  page.append(el(renderInfoBlocks(meta)));
  page.append(el(renderPrevNextNav(meta)));
  return page;
}

function soonPage(route) {
  const title = route.title;
  const parent = route.crumbs.length >= 2 ? route.crumbs[route.crumbs.length - 2] : ['Métodos', '#/metodos'];
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <div class="soon-page">
      <span class="soon-badge">Próximamente</span>
      <h2>${escape(title)}</h2>
      <p>Esta guía todavía no está lista.</p>
      <p><a class="text-link" href="${parent[1]}">← Volver a ${escape(parent[0])}</a></p>
    </div>
  </div>`);
}

const RENDERERS = {
  index: indexPage,
  puzzle: puzzlePage,
  cfop: cfopPage,
  beginner: beginnerPage,
  beginner2: beginner2Page,
  ortega: ortegaPage,
  cll: cllPage,
  reduction4: reduction4Page,
  yau: yauPage,
  reduction5: reduction5Page,
  yau5: yau5Page,
  reduction7: reduction7Page,
  megaminxStandard: megaminxStandardPage,
  pyraminxBeginner: pyraminxBeginnerPage,
  pyraminxAdvanced: pyraminxAdvancedPage,
  mirror: mirrorPage,
  pll: pllPage,
  oll: ollPage,
  f2l: f2lPage,
  cross: crossPage,
  roux: rouxPage,
  soon: soonPage,
};

export function renderMethods(container, route) {
  const render = RENDERERS[route.page] ?? indexPage;
  container.replaceChildren(render(route));
}
