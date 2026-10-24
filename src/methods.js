// Sección Métodos: arma cada página a partir de los datos (src/data) y de las tarjetas de caso.
import { BEGINNER } from './data/beginner.js';
import { PLL } from './data/pll.js';
import { OLL, OLL_2LOOK } from './data/oll.js';
import { F2L, describeF2L } from './data/f2l.js';
import { CROSS } from './data/cross.js';
import { ROUX } from './data/roux.js';
import { createCaseCard } from './case-card.js';
import { METHOD_PAGES, methodHref } from './data/method-pages.js';

// Enlace a una página de Métodos, o null si todavía es "Próximamente".
const linkTo = (sub) => (METHOD_PAGES[sub] && METHOD_PAGES[sub].page !== 'soon' ? methodHref(sub) : null);

// Puzzles de la portada de Métodos.
const PUZZLES = [
  { title: '2x2', text: 'El cubo de bolsillo: sin centros fijos. Principiante, Ortega y CLL.', href: linkTo('2x2'), accent: 'orange' },
  { title: '3x3', text: 'El clásico. Método principiante, CFOP y Roux.', href: linkTo('3x3'), accent: 'blue' },
  { title: '4x4', text: 'Reducción a 3x3, paridades y método Yau.', href: linkTo('4x4'), accent: 'green' },
];

// Métodos de cada puzzle (las páginas que todavía no existen salen como "Próximamente").
const PUZZLE_METHODS = {
  '3x3': {
    intro: 'Tres métodos para el 3x3: empezá por el principiante y, cuando lo domines, pasá a CFOP (el más usado) o a Roux.',
    methods: [
      { title: 'Principiante', text: 'Capa por capa. El primer método para aprender a armar el cubo.', href: linkTo('3x3/principiante'), accent: 'green' },
      { title: 'CFOP', text: 'Cruz, F2L, OLL y PLL. El método más usado en speedcubing.', href: linkTo('3x3/cfop'), accent: 'blue' },
      { title: 'Roux', text: 'Bloques y la capa del medio al final. Muy eficiente en movimientos.', href: linkTo('3x3/roux'), accent: 'orange' },
    ],
  },
  '2x2': {
    intro: 'El 2x2 es como un 3x3 sin aristas ni centros. Se puede armar con lo que ya sabés del 3x3 o con métodos propios más rápidos.',
    methods: [],
  },
  '4x4': {
    intro: 'El 4x4 se arma casi siempre "reduciéndolo" a un 3x3: primero los centros y las aristas, y después como un 3x3, con un par de casos nuevos (las paridades).',
    methods: [],
  },
};

const CFOP_PARTS = [
  { title: '1. Cruz', text: 'Armar la cruz en pocos movimientos, planeada en la inspección.', href: linkTo('3x3/cfop/cruz'), accent: 'white' },
  { title: '2. F2L', text: 'Las dos primeras capas de a pares esquina-arista: 41 casos.', href: linkTo('3x3/cfop/f2l'), accent: 'green' },
  { title: '3. OLL', text: 'Orientar la última capa: 57 casos (o 10 en dos pasos).', href: linkTo('3x3/cfop/oll'), accent: 'yellow' },
  { title: '4. PLL', text: 'Permutar la última capa: 21 casos.', href: linkTo('3x3/cfop/pll'), accent: 'red' },
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

function linkCards(items) {
  return `<div class="link-grid">${items
    .map((m) => {
      const inner = `<h3>${escape(m.title)}</h3><p>${escape(m.text)}</p>${m.href ? '' : '<span class="soon-badge">Próximamente</span>'}`;
      return m.href
        ? `<a class="link-card accent-${m.accent}" href="${m.href}">${inner}</a>`
        : `<div class="link-card accent-${m.accent} is-soon" aria-disabled="true">${inner}</div>`;
    })
    .join('')}</div>`;
}

function caseGrid(cases, stickering) {
  const grid = el('<div class="case-grid"></div>');
  cases.forEach((c, i) => grid.append(createCaseCard(c, { stickering, index: i })));
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
function caseSection({ id, title, count, text, cases, stickering }) {
  const section = el(`<section class="method-step" id="sec-${id}">
    <h3>${escape(title)}${count ? ` <small>${count} casos</small>` : ''}</h3>
    ${text ? `<p>${escape(text)}</p>` : ''}
  </section>`);
  section.append(caseGrid(cases, stickering));
  return section;
}

// ---------- Páginas ----------

function indexPage(route) {
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>Métodos</h2>
      <p>Guías paso a paso para armar cada puzzle, con los casos animados. Elegí un puzzle.</p>
    </header>
    ${linkCards(PUZZLES)}
  </div>`);
}

function puzzlePage(route) {
  const data = PUZZLE_METHODS[route.puzzle];
  const body = data.methods.length
    ? linkCards(data.methods)
    : '<div class="soon-page"><span class="soon-badge">Próximamente</span><p>Los métodos de este puzzle todavía no están listos.</p></div>';
  return el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>${escape(route.title)}</h2>
      <p>${escape(data.intro)}</p>
    </header>
    ${body}
  </div>`);
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
  const page = el(`<div class="methods-page">
    ${breadcrumb(route.crumbs)}
    <header class="page-head">
      <h2>${escape(BEGINNER.title)}</h2>
      ${paragraphs(BEGINNER.intro)}
    </header>
    <ol class="step-index">
      ${BEGINNER.steps.map((s) => `<li><a href="#" data-step="${s.id}">${escape(s.title)}</a></li>`).join('')}
    </ol>
  </div>`);

  BEGINNER.steps.forEach((step, n) => {
    const section = el(`<section class="method-step" id="paso-${step.id}">
      <h3><span class="step-number">${n + 1}</span>${escape(step.title)}</h3>
      <p class="step-goal"><strong>Objetivo:</strong> ${escape(step.goal)}</p>
      ${paragraphs(step.text)}
    </section>`);
    section.append(caseGrid(step.cases, step.stickering));
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
};

// Muestra la página de la ruta dentro del contenedor.
export function renderMethods(container, route) {
  const page = PAGES[route.page](route);
  container.replaceChildren(page);
}
