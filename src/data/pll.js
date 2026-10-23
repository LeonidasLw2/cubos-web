// CFOP · PLL: los 21 casos de permutación de la última capa.
// Solo datos (sin DOM). Notación estándar con la última capa en U.
// Un "(U)" al principio es el giro previo para ver el caso en la orientación estándar.
// Todos los algoritmos se comprueban con `npm run verify-algs`.

export const PLL = {
  id: 'pll',
  title: 'PLL',
  subtitle: 'Permutar la última capa',
  stickering: 'pll',
  intro: [
    'Llegás a la PLL con la cara de arriba ya toda amarilla (después de la OLL). Falta mover las piezas de la última capa a su lugar sin girarlas.',
    'Para reconocer el caso mirá los costados de la capa de arriba: los "faros" (dos esquinas del mismo color en un lado) y las "barras" (tres stickers seguidos del mismo color) te dicen qué piezas ya están bien entre sí.',
  ],
  groups: [
    {
      id: 'edges',
      title: 'Solo aristas',
      text: 'Las cuatro esquinas ya están en su lugar (hay faros en los cuatro lados); solo se mueven las aristas.',
      cases: [
        {
          id: 'Ua',
          name: 'Ua',
          alg: "(U2) R U' R U R U R U' R' U' R2",
          alts: ["(U2) M2 U M U2 M' U M2"],
        },
        {
          id: 'Ub',
          name: 'Ub',
          alg: "(U2) R2 U R U R' U' R' U' R' U R'",
          alts: ["(U2) M2 U' M U2 M' U' M2"],
        },
        { id: 'H', name: 'H', alg: "M2 U M2 U2 M2 U M2" },
        {
          id: 'Z',
          name: 'Z',
          alg: "(U) M' U M2 U M2 U M' U2 M2",
          alts: ["M2 U M2 U M' U2 M2 U2 M'"],
        },
      ],
    },
    {
      id: 'corners',
      title: 'Solo esquinas',
      text: 'Las aristas ya están bien; se mueven solo las esquinas (tres en las A, cuatro en la E).',
      cases: [
        { id: 'Aa', name: 'Aa', alg: "(U') x R' U R' D2 R U' R' D2 R2 x'" },
        { id: 'Ab', name: 'Ab', alg: "(U') x R2 D2 R U R' D2 R U' R x'" },
        { id: 'E', name: 'E', alg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },
      ],
    },
    {
      id: 'adjacent',
      title: 'Intercambio de esquinas adyacentes',
      text: 'Dos esquinas vecinas (del mismo lado) intercambian lugar, junto con un par de aristas.',
      cases: [
        { id: 'T', name: 'T', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
        { id: 'F', name: 'F', alg: "(U) R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
        {
          id: 'Ja',
          name: 'Ja',
          alg: "(U2) x R2 F R F' R U2 r' U r U2 x'",
          alts: ["(U) R' U L' U2 R U' R' U2 R L"],
        },
        { id: 'Jb', name: 'Jb', alg: "R U R' F' R U R' U' R' F R2 U' R'" },
        { id: 'Ra', name: 'Ra', alg: "(U') R U' R' U' R U R D R' U' R D' R' U2 R'" },
        {
          id: 'Rb',
          name: 'Rb',
          alg: "(U) R2 F R U R U' R' F' R U2 R' U2 R",
          alts: ["R' U2 R U2 R' F R U R' U' R' F' R2"],
        },
      ],
    },
    {
      id: 'diagonal',
      title: 'Intercambio de esquinas en diagonal',
      text: 'Dos esquinas opuestas (en diagonal) intercambian lugar, junto con un par de aristas.',
      cases: [
        { id: 'V', name: 'V', alg: "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2" },
        { id: 'Y', name: 'Y', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
        { id: 'Na', name: 'Na', alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
        { id: 'Nb', name: 'Nb', alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
      ],
    },
    {
      id: 'g',
      title: 'Permutaciones G',
      text: 'Tres esquinas y tres aristas se mueven a la vez. Se reconocen por un par de faros y un bloque de 1×2 en algún lado.',
      cases: [
        { id: 'Ga', name: 'Ga', alg: "(U) R2 U R' U R' U' R U' R2 U' D R' U R D'" },
        { id: 'Gb', name: 'Gb', alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
        { id: 'Gc', name: 'Gc', alg: "(U) R2 U' R U' R U R' U R2 U D' R U' R' D" },
        { id: 'Gd', name: 'Gd', alg: "(U2) R U R' U' D R2 U' R U' R' U R' U R2 D'" },
      ],
    },
  ],
};
