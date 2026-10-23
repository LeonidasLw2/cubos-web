// Sección Métodos: arma cada página a partir de los datos (src/data) y de las tarjetas de caso.
import { BEGINNER } from './data/beginner.js';
import { PLL } from './data/pll.js';
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
  { title: 'Cruz', text: 'Armar la cruz en pocos movimientos, planeada en la inspección.', href: null, accent: 'white' },
  { title: 'F2L', text: 'Las dos primeras capas de a pares esquina-arista.', href: null, accent: 'green' },
  { title: 'OLL', text: 'Orientar la última capa: 57 casos.', href: null, accent: 'yellow' },
  { title: 'PLL', text: 'Permutar la última capa: 21 casos.', href: '#/metodos/cfop/pll', accent: 'red' },
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

function pllPage() {
  const page = el(`<div class="methods-page">
    ${breadcrumb([['Métodos', '#/metodos'], ['CFOP', '#/metodos/cfop'], ['PLL']])}
    <header class="page-head">
      <h2>${escape(PLL.title)} <small>${escape(PLL.subtitle)}</small></h2>
      ${paragraphs(PLL.intro)}
    </header>
  </div>`);
  for (const group of PLL.groups) {
    const section = el(`<section class="method-step">
      <h3>${escape(group.title)} <small>${group.cases.length} casos</small></h3>
      <p>${escape(group.text)}</p>
    </section>`);
    section.append(caseGrid(group.cases, PLL.stickering));
    page.append(section);
  }
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

const PAGES = { index: indexPage, cfop: cfopPage, beginner: beginnerPage, pll: pllPage };

// Muestra la página de la ruta dentro del contenedor.
export function renderMethods(container, route) {
  const page = route.page === 'soon' ? soonPage(route.title) : PAGES[route.page]();
  container.replaceChildren(page);
}
