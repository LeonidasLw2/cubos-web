// CFOP · Cruz: consejos y ejemplos. Solo datos (sin DOM).
// Cada ejemplo parte de una mezcla oficial (WCA), hecha con el blanco arriba y el
// verde al frente; después se gira el cubo con z2 (blanco abajo) y se resuelve.
// `npm run verify-algs` comprueba que la solución arma la cruz BLANCA desde esa
// mezcla y que es óptima (la más corta posible).

export const CROSS = {
  id: 'cruz',
  title: 'Cruz',
  subtitle: 'El primer paso de CFOP',
  stickering: 'cross',
  intro: [
    'La cruz es igual que en el método principiante (las cuatro aristas blancas abajo, alineadas con sus centros), pero en CFOP se hace distinto: se planea entera durante la inspección y se arma de una sola vez, sin mirar.',
  ],
  tips: [
    {
      title: 'Hacela abajo',
      text: 'Armá la cruz directamente en la cara de abajo, no arriba para después dar vuelta el cubo. Así, cuando terminás, ya estás viendo las piezas del F2L y no perdés tiempo girando el cubo.',
    },
    {
      title: 'Planeala en la inspección',
      text: 'Tenés 15 segundos: usalos para encontrar las cuatro aristas blancas y decidir los movimientos de toda la cruz. El objetivo es hacerla sin pausas, con la vista ya puesta en el primer par.',
    },
    {
      title: 'Ocho movimientos alcanzan',
      text: 'Cualquier cruz se puede armar en 8 movimientos o menos (lo comprobamos recorriendo las 190.080 posiciones posibles), y la mayoría en 6 o 7. Si tu plan pasa de 8, seguramente hay uno mejor.',
    },
    {
      title: 'Pensá en relativo',
      text: 'No hace falta que cada arista quede ya frente a su centro: alcanza con que estén bien entre sí. Al final, un giro de D las alinea a todas juntas.',
    },
    {
      title: 'Aprovechá los dos a la vez',
      text: 'Buscá movimientos que acomoden dos aristas juntas (por ejemplo, una que ya está abajo y otra que entra con el mismo giro). Ahí es donde se ahorran movimientos.',
    },
  ],
  examplesText:
    'Cada ejemplo parte de una mezcla oficial de competencia: mezclá con el blanco arriba y el verde al frente, girá el cubo con z2 (el blanco queda abajo y el verde sigue al frente) y hacé la solución. La que se anima es la cruz óptima: no existe ninguna más corta.',
  examples: [
    {
      id: 'cross-ex-1',
      name: 'Ejemplo 1 · 6 movimientos',
      scramble: "F L' U2 D' R2 L D' R' B U' B2 U L2 D' F2 B2 D' B2 U2",
      alg: "U' R L2 B' D2 B'",
    },
    {
      id: 'cross-ex-2',
      name: 'Ejemplo 2 · 6 movimientos',
      scramble: "R2 F' R2 U' L' U2 R2 U' F' L2 U2",
      alg: "F2 D' L D' R2 F'",
    },
    {
      id: 'cross-ex-3',
      name: 'Ejemplo 3 · 7 movimientos',
      scramble: "D B2 U' R2 U R2 B2 U2 L2 R2 B2 D2 L F2 D U' B L D' B D",
      alg: "R F B' L2 D' R F'",
    },
  ],
};
