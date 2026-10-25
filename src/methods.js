// Sección Métodos: arma cada página a partir de los datos (src/data) y de las tarjetas de caso.
import { BEGINNER } from './data/beginner.js';
import { PLL } from './data/pll.js';
import { OLL, OLL_2LOOK } from './data/oll.js';
import { F2L, describeF2L } from './data/f2l.js';
import { CROSS } from './data/cross.js';
import { ROUX } from './data/roux.js';
import { CUBE2X2, BEGINNER_2X2, ORTEGA, CLL } from './data/cube2x2.js';
import { CUBE4X4, REDUCTION, YAU } from './data/cube4x4.js';
import { createCaseCard } from './case-card.js';
import { cubeSvg } from './cube-art.js';
import { METHOD_PAGES, methodHref } from './data/method-pages.js';

// Enlace a una página de Métodos, o null si todavía es "Próximamente".
const linkTo = (sub) => (METHOD_PAGES[sub] && METHOD_PAGES[sub].page !== 'soon' ? methodHref(sub) : null);

// Colores de los dibujos de cubo de las tarjetas.
const HEX = { white: '#f2f2f2', yellow: '#ffd500', red: '#ff4d5e', orange: '#ff8a00', blue: '#3d8bff', green: '#2ec27e' };
const G = '#3a4150'; // sticker "apagado"
const D = '#2c323e';
// Una cara de 3x3 con la fila de arriba apagada y el resto de un color (F2L, OLL).
const lowerTwo = (color) => [G, G, G, color, color, color, color, color, color];

// Puzzles de la portada de Métodos (el dibujo es el cubo de cada uno).
const PUZZLES = [
  { title: '2x2', text: 'El cubo de bolsillo: sin centros fijos. Principiante, Ortega y CLL.', href: linkTo('2x2'), accent: 'orange', art: { n: 2 }, tag: '3 métodos · 56 casos' },
  { title: '3x3', text: 'El clásico. Método principiante, CFOP y Roux.', href: linkTo('3x3'), accent: 'blue', art: { n: 3 }, tag: 'Principiante · CFOP · Roux' },
  { title: '4x4', text: 'Reducción a 3x3, paridades y método Yau.', href: linkTo('4x4'), accent: 'green', art: { n: 4 }, tag: 'Reducción · Yau · 17 casos' },
];

// Métodos de cada puzzle (las páginas que todavía no existen salen como "Próximamente").
const PUZZLE_METHODS = {
  '3x3': {
    intro: 'Tres métodos para el 3x3: empezá por el principiante y, cuando lo domines, pasá a CFOP (el más usado) o a Roux.',
    methods: [
      { title: 'Principiante', text: 'Capa por capa. El primer método para aprender a armar el cubo.', href: linkTo('3x3/principiante'), accent: 'green', tag: '⭐ Ideal para empezar · 7 pasos' },
      { title: 'CFOP', text: 'Cruz, F2L, OLL y PLL. El método más usado en speedcubing.', href: linkTo('3x3/cfop'), accent: 'blue', tag: '⚡ Más rápido · 119 casos' },
      { title: 'Roux', text: 'Bloques y la capa del medio al final. Muy eficiente en movimientos.', href: linkTo('3x3/roux'), accent: 'orange', tag: '🧠 Intuitivo · Bloques' },
    ],
  },
  '2x2': {
    intro: CUBE2X2.intro.join(' '),
    methods: [
      { title: 'Principiante', text: 'Capa por capa, con 3 algoritmos que ya conocés del 3x3.', href: linkTo('2x2/principiante'), accent: 'green', n: 2, tag: 'Primer método · 3 pasos' },
      { title: 'Ortega', text: 'Primera cara, OLL (7 casos) y PBL (5 casos). El paso siguiente para ir rápido.', href: linkTo('2x2/ortega'), accent: 'blue', n: 2, tag: '⚡ Rápido · 12 casos' },
      { title: 'CLL', text: 'La última capa en un solo algoritmo: 42 casos. Para los que quieren ir todavía más rápido.', href: linkTo('2x2/cll'), accent: 'red', n: 2, tag: '🔥 Avanzado · 42 casos' },
    ],
  },
  '4x4': {
    intro: CUBE4X4.intro,
    notation: CUBE4X4.notation,
    methods: [
      { title: 'Reducción', text: 'Centros, aristas y después como un 3x3. Incluye las dos paridades.', href: linkTo('4x4/reduccion'), accent: 'green', n: 4, tag: 'Método estándar' },
      { title: 'Yau', text: 'El método de los más rápidos: parte de la cruz antes de terminar los centros.', href: linkTo('4x4/yau'), accent: 'blue', n: 4, tag: '⚡ Competición' },
    ],
  },
};

const CFOP_PARTS = [
  {
    title: '1. Cruz',
    text: 'Armar la cruz en pocos movimientos, planeada en la inspección.',
    href: linkTo('3x3/cfop/cruz'),
    accent: 'white',
    art: { top: [G, HEX.white, G, HEX.white, HEX.white, HEX.white, G, HEX.white, G], left: [G, HEX.green, G, G, G, G, G, G, G], right: [G, HEX.red, G, G, G, G, G, G, G] },
  },
  {
    title: '2. F2L',
    text: 'Las dos primeras capas de a pares esquina-arista: 41 casos.',
    href: linkTo('3x3/cfop/f2l'),
    accent: 'green',
    art: { top: G, left: lowerTwo(HEX.green), right: lowerTwo(HEX.red) },
  },
  {
    title: '3. OLL',
    text: 'Orientar la última capa: 57 casos (o 10 en dos pasos).',
    href: linkTo('3x3/cfop/oll'),
    accent: 'yellow',
    art: { top: HEX.yellow, left: lowerTwo(HEX.green), right: lowerTwo(HEX.red) },
  },
  {
    title: '4. PLL',
    text: 'Permutar la última capa: 21 casos.',
    href: linkTo('3x3/cfop/pll'),
    accent: 'red',
    art: { top: HEX.yellow, left: [HEX.red, HEX.green, HEX.orange, ...lowerTwo(HEX.green).slice(3)], right: [HEX.blue, HEX.red, HEX.green, ...lowerTwo(HEX.red).slice(3)] },
  },
];

const escape = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const paragraphs = (list) => list.map((p) => `<p>${escape(p)}</p>`).join('');

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Migas de pan: [['Métodos', '#/metodos'], ['3x3', '#/metodos/3x3'], …]; la última es la página actual.
function breadcrumb(items) {
  const parts = items.map(([label, href], i) =>
    href && i < items.length - 1 ? `<a href="${href}">${escape(label)}</a>` : `<span aria-current="page">${escape(label)}</span>`,
  );
  return `<nav class="breadcrumb" aria-label="Ubicación">${parts.join('<span class="sep" aria-hidden="true">›</span>')}</nav>`;
}

// Dibujo de cada tarjeta: el que trae, o un cubo con la cara de arriba del color del método.
const artFor = (m) => m.art ?? { n: m.n ?? 3, top: HEX[m.accent], left: G, right: D };

function linkCards(items, className = '') {
  return `<div class="link-grid ${className}">${items
    .map((m) => {
      const tagHtml = m.tag ? `<span class="card-tag accent-${m.accent}">${escape(m.tag)}</span>` : '';
      const actionHtml = m.href ? `<span class="card-action">Ver guía completa →</span>` : '';
      const inner = `
        <div class="card-art">${cubeSvg({ n: 3, ...artFor(m) })}</div>
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

function caseGrid(cases, stickering, puzzle = '3x3x3') {
  const grid = el('<div class="case-grid"></div>');
  cases.forEach((c, i) => grid.append(createCaseCard(c, { stickering, index: i, puzzle })));
  return grid;
}

// Índice de secciones: chips que hacen scroll hasta cada una sin cambiar la ruta.
// items: [{ id, title }] → ids de las secciones con prefijo "sec-".
function sectionIndex(items) {
  const nav = el(`<ol class="step-index">
    ${items.map((s) => `<li><a href="#" data-section="${s.id}">${escape(s.title)}</a></li>`).join('')}
  </ol>`);
  nav.addEventListener('click', (e) => {
    const link = e.target.closest('[data-section]');
    if (!link) return;
    e.preventDefault();
    document.getElementById(`sec-${link.dataset.section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return nav;
}

// Una sección con título, texto y grilla de casos.
function caseSection({ id, title, count, text, cases, stickering, puzzle }) {
  const section = el(`<section class="method-step" id="sec-${id}">
    <h3>${escape(title)}${count ? ` <small>${count} casos</small>` : ''}</h3>
    ${text ? `<p>${escape(text)}</p>` : ''}
  </section>`);
  section.append(caseGrid(cases, stickering, puzzle));
  return section;
}

// ---------- Presentaciones y secciones explicativas ----------

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
          <p>La forma más intuitiva de empezar. Con solo 3 algoritmos clave aprendés a colocar esquinas y aristas sin desarmar lo que ya construiste.</p>
          <ul class="pathway-features">
            <li>🎯 Objetivo: Sub-1 minuto</li>
            <li>🧠 3 algoritmos básicos</li>
            <li>💡 Fácil de memorizar en 1 tarde</li>
          </ul>
        </div>

        <div class="pathway-card stage-2 highlight">
          <div class="pathway-step">Nivel 2 · Estándar WCA</div>
          <h4>CFOP (Fridrich)</h4>
          <p>El método con el que se rompieron todos los récords mundiales. Resuelve los pares esquina-arista juntos (F2L) y la última capa en 2 pasos.</p>
          <ul class="pathway-features">
            <li>🎯 Objetivo: Sub-20 segundos</li>
            <li>⚡ Cruz + F2L (41) + OLL (57) + PLL (21)</li>
            <li>🚀 Velocidad y fluidez máxima</li>
          </ul>
        </div>

        <div class="pathway-card stage-3">
          <div class="pathway-step">Nivel 3 · Alta Eficiencia</div>
          <h4>Roux & Métodos Avanzados</h4>
          <p>Enfoque en bloques libres y giros de la capa del medio (M). Requiere menos movimientos y no depende de rotaciones continuas del cubo.</p>
          <ul class="pathway-features">
            <li>🎯 Objetivo: Menos de 45 giros (STM)</li>
            <li>🧩 Bloques 1x2x3 + CMLL + LSE</li>
            <li>✨ Gran libertad intuitiva</li>
          </ul>
        </div>
      </div>

      <div class="features-banner">
        <div class="feature-item">
          <div class="feature-icon">🎮</div>
          <div class="feature-text">
            <strong>Animaciones 3D Interactivas</strong>
            <span>Girá el cubo con el dedo o mouse, reproducí a distintas velocidades y pausá paso a paso.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🔍</div>
          <div class="feature-text">
            <strong>Algoritmos Verificados</strong>
            <span>Todos los algoritmos están probados con el motor KPuzzle para garantizar que resuelvan cada caso.</span>
          </div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">📱</div>
          <div class="feature-text">
            <strong>Listo para Celular & App</strong>
            <span>Consultá tus algoritmos sin conexión y entrená tus casos favoritos estés donde estés.</span>
          </div>
        </div>
      </div>

      <div class="notation-cheat">
        <div class="notation-head">
          <h4>Notación Universal Rápida (WCA)</h4>
          <p>Letra sola = 90° horario · Con apóstrofe (') = 90° antihorario · Con 2 = 180°</p>
        </div>
        <div class="notation-moves">
          <div class="move-pill"><strong>R</strong><span>Derecha</span></div>
          <div class="move-pill"><strong>L</strong><span>Izquierda</span></div>
          <div class="move-pill"><strong>U</strong><span>Arriba</span></div>
          <div class="move-pill"><strong>D</strong><span>Abajo</span></div>
          <div class="move-pill"><strong>F</strong><span>Frente</span></div>
          <div class="move-pill"><strong>B</strong><span>Atrás</span></div>
          <div class="move-pill"><strong>M</strong><span>Medio</span></div>
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
        <p>Compará los tres estilos principales de resolución del cubo clásico.</p>
      </div>

      <div class="comparison-grid">
        <div class="comparison-col">
          <div class="comp-header">
            <h4>Principiante</h4>
            <span class="comp-badge">Fácil</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Muy baja</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>3 principales</strong></div>
          <div class="comp-row"><span>Promedio de giros</span><strong>~100 movimientos</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>45s – 2 minutos</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Capa por capa</strong></div>
        </div>

        <div class="comparison-col featured">
          <div class="comp-header">
            <h4>CFOP (Fridrich)</h4>
            <span class="comp-badge popular">★ El más usado</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Media / Alta</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>119 casos (o 16 en 2 pasos)</strong></div>
          <div class="comp-row"><span>Promedio de giros</span><strong>~55 movimientos</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>8s – 25 segundos</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Cruz + Pares + 2 pasos LL</strong></div>
        </div>

        <div class="comparison-col">
          <div class="comp-header">
            <h4>Roux</h4>
            <span class="comp-badge">Eficiente</span>
          </div>
          <div class="comp-row"><span>Dificultad</span><strong>Media (intuitivo)</strong></div>
          <div class="comp-row"><span>Algoritmos</span><strong>42 casos (CMLL)</strong></div>
          <div class="comp-row"><span>Promedio de giros</span><strong>~48 movimientos</strong></div>
          <div class="comp-row"><span>Tiempo típico</span><strong>10s – 28 segundos</strong></div>
          <div class="comp-row"><span>Enfoque</span><strong>Bloques + M + Esquinas</strong></div>
        </div>
      </div>

      <div class="cfop-quick-stages">
        <div class="stages-head">
          <h4>Etapas de CFOP</h4>
          <p>Podés saltar directo a la etapa que quieras practicar:</p>
        </div>
        <div class="stages-grid">
          <a class="stage-link" href="#/metodos/3x3/cfop/cruz">
            <span class="stage-num">1</span>
            <div><strong>Cruz</strong><small>8 movimientos máx</small></div>
          </a>
          <a class="stage-link" href="#/metodos/3x3/cfop/f2l">
            <span class="stage-num">2</span>
            <div><strong>F2L</strong><small>41 pares de esquinas y aristas</small></div>
          </a>
          <a class="stage-link" href="#/metodos/3x3/cfop/oll">
            <span class="stage-num">3</span>
            <div><strong>OLL</strong><small>57 orientaciones (o 2 pasos)</small></div>
          </a>
          <a class="stage-link" href="#/metodos/3x3/cfop/pll">
            <span class="stage-num">4</span>
            <div><strong>PLL</strong><small>21 permutaciones finales</small></div>
          </a>
        </div>
      </div>

      <div class="pro-tips-card">
        <h4>💡 Consejos para bajar de 1 minuto a Sub-20</h4>
        <div class="tips-grid">
          <div class="tip-item">
            <strong>1. Inspección activa</strong>
            <p>No empieces a girar apenas ves el cubo: usá los 15 segundos para planear la cruz completa en la mente.</p>
          </div>
          <div class="tip-item">
            <strong>2. F2L sin pausas (Lookahead)</strong>
            <p>Es más rápido girar a velocidad constante rastreando el siguiente par que girar a toda velocidad y frenar a buscar piezas.</p>
          </div>
          <div class="tip-item">
            <strong>3. Fingertricks limpios</strong>
            <p>Usá el dedo índice y anular para los giros U y D; evitá rotar la muñeca entera cada vez que girás una cara.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ---------- Páginas ----------

function indexPage(route) {
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>Métodos</h2>
      <p>Guías paso a paso para armar cada puzzle, con los casos animados. Elegí un puzzle.</p>
    </header>
  </div>`);
  page.append(el(linkCards(PUZZLES, 'covers')));
  page.append(el(methodsPresentation()));
  return page;
}

function puzzlePage(route) {
  const data = PUZZLE_METHODS[route.puzzle];
  const body = data.methods.length
    ? linkCards(data.methods)
    : '<div class="soon-page"><span class="soon-badge">Próximamente</span><p>Los métodos de este puzzle todavía no están listos.</p></div>';
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>${escape(route.title)}</h2>
      <p>${escape(data.intro)}</p>
    </header>
  </div>`);
  // Tarjeta de notación (4x4): va primero, antes de los métodos.
  if (data.notation) page.append(notationSection(data.notation));
  page.append(el(`<div>${body}</div>`));
  if (route.puzzle === '3x3') {
    page.append(el(puzzle3x3Presentation()));
  }
  return page;
}

// Tabla de notación con ejemplos animados de cada giro.
function notationSection(notation) {
  const section = el(`<section class="method-step notation" id="sec-notacion">
    <h3>${escape(notation.title)}</h3>
    ${paragraphs(notation.text)}
    <dl class="notation-list">
      ${notation.rows.map(([move, text]) => `<div><dt>${escape(move)}</dt><dd>${escape(text)}</dd></div>`).join('')}
    </dl>
  </section>`);
  section.append(caseGrid(notation.cases, notation.stickering, notation.puzzle));
  return section;
}

function cfopPage(route) {
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>CFOP</h2>
      <p>También llamado método Fridrich. Se arma la cruz, después las dos primeras capas (F2L) de a pares, y la última capa en dos pasos: orientar (OLL) y permutar (PLL).</p>
    </header>
    ${linkCards(CFOP_PARTS)}
  </div>`);
}

function beginnerPage(route) {
  return stepsPage(BEGINNER, route, '3x3x3');
}

function beginner2Page(route) {
  return stepsPage(BEGINNER_2X2, route, '2x2x2');
}

function reduction4Page(route) {
  return stepsPage(REDUCTION, route, '4x4x4');
}

function yauPage(route) {
  return stepsPage(YAU, route, '4x4x4');
}

// Página de un método por pasos: índice, y por cada paso objetivo, texto y casos.
function stepsPage(data, route, puzzle) {
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>${escape(data.title)}</h2>
      ${paragraphs(data.intro)}
    </header>
    <ol class="step-index">
      ${data.steps.map((s) => `<li><a href="#" data-step="${s.id}">${escape(s.title)}</a></li>`).join('')}
    </ol>
  </div>`);

  data.steps.forEach((step, n) => {
    const section = el(`<section class="method-step" id="paso-${step.id}">
      <h3><span class="step-number">${n + 1}</span>${escape(step.title)}</h3>
      <p class="step-goal"><strong>Objetivo:</strong> ${escape(step.goal)}</p>
      ${paragraphs(step.text)}
    </section>`);
    section.append(caseGrid(step.cases, step.stickering, puzzle));
    page.append(section);
  });

  // El índice hace scroll a cada paso sin cambiar la ruta.
  page.querySelector('.step-index').addEventListener('click', (e) => {
    const link = e.target.closest('[data-step]');
    if (!link) return;
    e.preventDefault();
    page.querySelector(`#paso-${link.dataset.step}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  return page;
}

// Encabezado común de las páginas de casos.
function pageHead(data, route) {
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>${escape(data.title)} <small>${escape(data.subtitle)}</small></h2>
      ${paragraphs(data.intro)}
    </header>
  </div>`);
}

// Página con grupos de casos (PLL, OLL, F2L) e índice para saltar entre grupos.
function groupedPage(data, route, mapCase = (c) => c) {
  const page = pageHead(data, route);
  page.append(sectionIndex(data.groups));
  for (const group of data.groups) {
    page.append(
      caseSection({
        id: group.id,
        title: group.title,
        count: group.cases.length,
        text: group.text,
        cases: group.cases.map(mapCase),
        stickering: data.stickering,
      }),
    );
  }
  return page;
}

function pllPage(route) {
  return groupedPage(PLL, route);
}

function f2lPage(route) {
  let n = 0;
  return groupedPage(F2L, route, (c) => ({
    ...c,
    name: `Caso ${++n}`,
    description: describeF2L(c), // generada desde la posición verificada
  }));
}

function ollPage(route) {
  const page = pageHead(OLL, route);
  page.append(
    sectionIndex([{ id: '2-pasos', title: 'OLL en 2 pasos' }, ...OLL.groups]),
  );

  // OLL en 2 pasos: aristas (3 casos) y esquinas (los 7 del grupo "cruz").
  const allCases = OLL.groups.flatMap((g) => g.cases);
  const twoLook = el(`<section class="method-step two-look" id="sec-2-pasos">
    <h3>OLL en 2 pasos <small>10 algoritmos</small></h3>
    <p>${escape(OLL_2LOOK.intro)}</p>
  </section>`);
  twoLook.append(
    caseSection({
      id: '2-pasos-aristas',
      title: OLL_2LOOK.edges.title,
      text: OLL_2LOOK.edges.text,
      cases: OLL_2LOOK.edges.cases,
      stickering: OLL_2LOOK.edges.stickering,
    }),
    caseSection({
      id: '2-pasos-esquinas',
      title: OLL_2LOOK.corners.title,
      text: OLL_2LOOK.corners.text,
      cases: OLL_2LOOK.corners.caseIds.map((id) => allCases.find((c) => c.id === id)),
      stickering: OLL.stickering,
    }),
  );
  page.append(twoLook);

  const full = el(`<section class="method-step"><h3>OLL completa <small>57 casos</small></h3>
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
  return page;
}

function crossPage(route) {
  const page = pageHead(CROSS, route);
  page.append(
    el(`<div class="tip-grid">
      ${CROSS.tips.map((t, i) => `<article class="tip-card"><span class="tip-number">${i + 1}</span><h3>${escape(t.title)}</h3><p>${escape(t.text)}</p></article>`).join('')}
    </div>`),
  );
  page.append(
    caseSection({
      id: 'ejemplos',
      title: 'Ejemplos con mezclas reales',
      text: CROSS.examplesText,
      cases: CROSS.examples.map((ex) => ({ ...ex, description: `Mezcla: ${ex.scramble}` })),
      stickering: CROSS.stickering,
    }),
  );
  return page;
}

function rouxPage(route) {
  const page = pageHead(ROUX, route);

  // Comparación corta con CFOP
  page.append(
    el(`<section class="method-step">
      <h3>CFOP vs Roux</h3>
      <div class="compare-wrap">
        <table class="compare">
          <thead><tr><th></th><th>CFOP</th><th>Roux</th></tr></thead>
          <tbody>${ROUX.comparison
            .map(([what, cfop, roux]) => `<tr><th scope="row">${escape(what)}</th><td>${escape(cfop)}</td><td>${escape(roux)}</td></tr>`)
            .join('')}</tbody>
        </table>
      </div>
    </section>`),
  );

  page.append(
    sectionIndex([
      ...ROUX.stages.map((s) => ({ id: s.id, title: s.title.replace(/^\d\.\s*/, '') })),
      { id: 'cmll', title: 'CMLL' },
      { id: 'lse', title: 'LSE' },
    ]),
  );

  // 1 y 2: bloques (intuitivos, con ejemplos)
  for (const stage of ROUX.stages) {
    const section = el(`<section class="method-step" id="sec-${stage.id}">
      <h3>${escape(stage.title)}</h3>
      ${paragraphs(stage.text)}
    </section>`);
    section.append(caseGrid(stage.cases, stage.stickering));
    page.append(section);
  }

  // 3: CMLL (42 casos por grupo)
  const cmll = el(`<section class="method-step" id="sec-cmll">
    <h3>${escape(ROUX.cmll.title)} <small>42 casos</small></h3>
    ${paragraphs(ROUX.cmll.text)}
  </section>`);
  page.append(cmll);
  for (const group of ROUX.cmll.groups) {
    page.append(
      caseSection({
        id: `cmll-${group.id}`,
        title: `CMLL ${group.title}`,
        count: group.cases.length,
        text: group.text,
        cases: group.cases,
        stickering: ROUX.cmll.stickering,
      }),
    );
  }

  // 4: LSE
  page.append(
    el(`<section class="method-step" id="sec-lse">
      <h3>${escape(ROUX.lse.title)}</h3>
      ${paragraphs(ROUX.lse.text)}
    </section>`),
  );
  for (const step of ROUX.lse.steps) {
    page.append(caseSection({ id: `lse-${step.id}`, title: step.title, text: step.text, cases: step.cases, stickering: step.stickering }));
  }
  return page;
}

function ortegaPage(route) {
  const page = pageHead(ORTEGA, route);
  page.append(sectionIndex([{ id: 'cara', title: 'Primera cara' }, { id: 'oll2', title: 'OLL' }, { id: 'pbl', title: 'PBL' }]));
  page.append(caseSection({ id: 'cara', title: ORTEGA.face.title, text: ORTEGA.face.text.join(' '), cases: ORTEGA.face.cases, stickering: ORTEGA.face.stickering, puzzle: '2x2x2' }));
  page.append(caseSection({ id: 'oll2', title: ORTEGA.oll.title, text: ORTEGA.oll.text.join(' '), cases: ORTEGA.oll.cases, stickering: ORTEGA.oll.stickering, puzzle: '2x2x2' }));
  page.append(caseSection({ id: 'pbl', title: ORTEGA.pbl.title, text: ORTEGA.pbl.text.join(' '), cases: ORTEGA.pbl.cases, stickering: ORTEGA.pbl.stickering, puzzle: '2x2x2' }));
  page.append(el(`<section class="method-step"><h3>¿Y después?</h3><p>${escape(ORTEGA.eg)}</p></section>`));
  return page;
}

function cllPage(route) {
  const page = pageHead(CLL, route);
  page.append(sectionIndex(CLL.groups.map((g) => ({ id: `cll-${g.id}`, title: g.title }))));
  for (const group of CLL.groups) {
    page.append(caseSection({ id: `cll-${group.id}`, title: `CLL ${group.title}`, count: group.cases.length, text: group.text, cases: group.cases, stickering: CLL.stickering, puzzle: '2x2x2' }));
  }
  return page;
}

function soonPage(route) {
  const title = route.title;
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <div class="soon-page">
      <span class="soon-badge">Próximamente</span>
      <h2>${escape(title)}</h2>
      <p>Esta parte todavía no está lista. Mientras tanto podés ver los otros métodos.</p>
      <p><a class="text-link" href="${route.crumbs.at(-2)?.[1] ?? '#/metodos'}">Volver</a></p>
    </div>
  </div>`);
}

const PAGES = {
  index: indexPage,
  puzzle: puzzlePage,
  soon: soonPage,
  cfop: cfopPage,
  beginner: beginnerPage,
  cross: crossPage,
  f2l: f2lPage,
  oll: ollPage,
  pll: pllPage,
  roux: rouxPage,
  beginner2: beginner2Page,
  ortega: ortegaPage,
  cll: cllPage,
  reduction4: reduction4Page,
  yau: yauPage,
};

// Muestra la página de la ruta dentro del contenedor.
export function renderMethods(container, route) {
  const page = PAGES[route.page](route);
  container.replaceChildren(page);
}
