// Árbol de páginas de la sección Métodos. Solo datos (sin DOM).
// La clave es la ruta después de "#/metodos/". title es el nombre corto que se
// usa en las migas de pan; page es la página que se dibuja (ver methods.js).
// La ruta de las migas sale de la propia clave: '3x3/cfop/f2l' → Métodos › 3x3 › CFOP › F2L.

export const METHOD_PAGES = {
  '': { title: 'Métodos', page: 'index' },

  '3x3': { title: '3x3', page: 'puzzle', puzzle: '3x3' },
  '3x3/principiante': { title: 'Principiante', page: 'beginner' },
  '3x3/cfop': { title: 'CFOP', page: 'cfop' },
  '3x3/cfop/cruz': { title: 'Cruz', page: 'cross' },
  '3x3/cfop/f2l': { title: 'F2L', page: 'f2l' },
  '3x3/cfop/oll': { title: 'OLL', page: 'oll' },
  '3x3/cfop/pll': { title: 'PLL', page: 'pll' },
  '3x3/roux': { title: 'Roux', page: 'roux' },

  '2x2': { title: '2x2', page: 'puzzle', puzzle: '2x2' },
  '4x4': { title: '4x4', page: 'puzzle', puzzle: '4x4' },
};

// Rutas de antes de ordenar los métodos por puzzle: se redirigen a las nuevas,
// así no se rompe ningún enlace guardado.
export const LEGACY_METHOD_PATHS = {
  principiante: '3x3/principiante',
  cfop: '3x3/cfop',
  'cfop/cruz': '3x3/cfop/cruz',
  'cfop/f2l': '3x3/cfop/f2l',
  'cfop/oll': '3x3/cfop/oll',
  'cfop/pll': '3x3/cfop/pll',
  roux: '3x3/roux',
};

export const methodHref = (sub) => (sub ? `#/metodos/${sub}` : '#/metodos');

// Migas de pan de una página: [[título, href], …]; la última es la página actual.
export function crumbsFor(sub) {
  const parts = sub ? sub.split('/') : [];
  const crumbs = [[METHOD_PAGES[''].title, methodHref('')]];
  for (let i = 1; i <= parts.length; i++) {
    const path = parts.slice(0, i).join('/');
    crumbs.push([METHOD_PAGES[path]?.title ?? parts[i - 1], methodHref(path)]);
  }
  return crumbs;
}
