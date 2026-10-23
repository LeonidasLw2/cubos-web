// Sección Métodos: arma cada página a partir de los datos (src/data) y de las tarjetas de caso.
import { BEGINNER } from './data/beginner.js';
import { PLL } from './data/pll.js';
import { OLL, OLL_2LOOK } from './data/oll.js';
import { F2L, describeF2L } from './data/f2l.js';
import { CROSS } from './data/cross.js';
import { createCaseCard } from './case-card.js';

// Métodos y sus partes. href null = "Próximamente".
const METHODS = [
  {
    title: 'Principiante',
    text: 'Capa por capa. El primer método para aprender a armar el cubo.',
    href: '#/metodos/principiante',
    accent: 'green',
  },
  {
    title: 'CFOP',
    text: 'Cruz, F2L, OLL y PLL. El método más usado en speedcubing.',
    href: '#/metodos/cfop',
    accent: 'blue',
  },
  { title: 'Roux', text: 'Bloques y la capa del medio al final. Muy eficiente en movimientos.', href: null, accent: 'orange' },
];

const CFOP_PARTS = [
  { title: '1. Cruz', text: 'Armar la cruz en pocos movimientos, planeada en la inspección.', href: '#/metodos/cfop/cruz', accent: 'white' },
  { title: '2. F2L', text: 'Las dos primeras capas de a pares esquina-arista: 41 casos.', href: '#/metodos/cfop/f2l', accent: 'green' },
  { title: '3. OLL', text: 'Orientar la última capa: 57 casos (o 10 en dos pasos).', href: '#/metodos/cfop/oll', accent: 'yellow' },
  { title: '4. PLL', text: 'Permutar la última capa: 21 casos.', href: '#/metodos/cfop/pll', accent: 'red' },
];

const escape = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const paragraphs = (list) => list.map((p) => `<p>${escape(p)}</p>`).join('');

function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Migas de pan: [['Métodos', '#/metodos'], ['CFOP', '#/metodos/cfop'], ['PLL']]
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

function indexPage() {
  return el(`<div class="methods-page">
    ${breadcrumb([['Métodos']])}
    <header class="page-head">
      <h2>Métodos</h2>
      <p>Guías paso a paso para armar el 3x3, con cada caso animado.</p>
    </header>
    ${linkCards(METHODS)}
  </div>`);
}

function cfopPage() {
  return el(`<div class="methods-page">
    ${breadcrumb([['Métodos', '#/metodos'], ['CFOP']])}
    <header class="page-head">
      <h2>CFOP</h2>
      <p>También llamado método Fridrich. Se arma la cruz, después las dos primeras capas (F2L) de a pares, y la última capa en dos pasos: orientar (OLL) y permutar (PLL).</p>
    </header>
    ${linkCards(CFOP_PARTS)}
  </div>`);
}

function beginnerPage() {
  const page = el(`<div class="methods-page">
    ${breadcrumb([['Métodos', '#/metodos'], ['Principiante']])}
    <header class="page-head">
      <h2>${escape(BEGINNER.title)}</h2>
      ${paragraphs(BEGINNER.intro)}
    </header>
    <ol class="step-index">
      ${BEGINNER.steps.map((s) => `<li><a href="#/metodos/principiante" data-step="${s.id}">${escape(s.title)}</a></li>`).join('')}
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

// Encabezado común de las partes de CFOP.
function cfopHead(data, crumb) {
  return el(`<div class="methods-page">
    ${breadcrumb([['Métodos', '#/metodos'], ['CFOP', '#/metodos/cfop'], [crumb]])}
    <header class="page-head">
      <h2>${escape(data.title)} <small>${escape(data.subtitle)}</small></h2>
      ${paragraphs(data.intro)}
    </header>
  </div>`);
}

// Página con grupos de casos (PLL, OLL, F2L) e índice para saltar entre grupos.
function groupedPage(data, crumb, mapCase = (c) => c) {
  const page = cfopHead(data, crumb);
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

function pllPage() {
  return groupedPage(PLL, 'PLL');
}

function f2lPage() {
  let n = 0;
  return groupedPage(F2L, 'F2L', (c) => ({
    ...c,
    name: `Caso ${++n}`,
    description: describeF2L(c), // generada desde la posición verificada
  }));
}

function ollPage() {
  const page = cfopHead(OLL, 'OLL');
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

function crossPage() {
  const page = cfopHead(CROSS, 'Cruz');
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

function soonPage(title) {
  return el(`<div class="methods-page">
    ${breadcrumb([['Métodos', '#/metodos'], [title]])}
    <div class="soon-page">
      <span class="soon-badge">Próximamente</span>
      <h2>${escape(title)}</h2>
      <p>Esta parte todavía no está lista. Mientras tanto podés ver el método principiante o la PLL.</p>
      <p><a class="text-link" href="#/metodos">Volver a Métodos</a></p>
    </div>
  </div>`);
}

const PAGES = {
  index: indexPage,
  cfop: cfopPage,
  beginner: beginnerPage,
  cross: crossPage,
  f2l: f2lPage,
  oll: ollPage,
  pll: pllPage,
};

// Muestra la página de la ruta dentro del contenedor.
export function renderMethods(container, route) {
  const page = route.page === 'soon' ? soonPage(route.title) : PAGES[route.page]();
  container.replaceChildren(page);
}
