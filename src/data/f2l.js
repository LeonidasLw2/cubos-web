// CFOP · F2L: los 41 casos de un par (esquina + arista) para el slot de adelante a la derecha.
// Solo datos (sin DOM). Todos se comprueban con `npm run verify-algs`:
//   · corner/edge: dónde está cada pieza y hacia dónde mira (se compara con el caso real).
//   · pair: la primera parte del algoritmo, que junta esquina y arista en un par;
//     se comprueba que después de esa parte el par está armado y listo para entrar.
// corner: [posición, hacia dónde mira el blanco] · edge: [posición, hacia dónde mira el color del frente]
// Posiciones: UFR = arriba sobre el slot · DRF = en el slot · UF/UR/UB/UL = arista arriba · FR = arista en el slot.

export const F2L = {
  id: 'f2l',
  title: 'F2L',
  subtitle: 'Las dos primeras capas, de a pares',
  stickering: 'f2l',
  intro: [
    'Después de la cruz, en vez de poner primero las esquinas y después las aristas (como en el método principiante), se junta cada esquina con su arista y se insertan juntas en su lugar ("slot"). Son cuatro pares: uno por cada esquina de abajo.',
    'El F2L se aprende entendiéndolo: casi todos los casos son "juntar la esquina con la arista para formar un par" y después "insertar el par" con uno de los cuatro casos básicos. En cada algoritmo vas a ver resaltada la parte que arma el par.',
    'Todos los casos están mostrados para el slot de adelante a la derecha. Para otro slot, girá el cubo (o usá la versión espejada con la mano izquierda).',
  ],
  groups: [
    {
      id: 'basic',
      title: 'Inserción directa',
      text: 'Las piezas ya están listas para entrar con 3 o 4 movimientos. Son la base: casi todos los demás casos terminan en uno de estos.',
      cases: [
        {
          id: 'f2l-1',
          corner: ['UFR', 'F'],
          edge: ['UR', 'U'],
          pair: '',
          alg: "U R U' R'",
          idea: 'Esquina y arista ya combinan; solo tienen que bajar juntas. U corre la esquina para que R pueda levantar el hueco del slot; U\' pone las dos justo encima del hueco y R\' las baja.',
        },
        {
          id: 'f2l-2',
          corner: ['UFR', 'R'],
          edge: ['UF', 'F'],
          pair: '',
          alg: "U' F' U F",
          idea: 'El mismo caso que el anterior, pero entrando por el frente: U\' corre la esquina, F\' levanta el hueco, U pone las piezas encima y F las baja.',
        },
        {
          id: 'f2l-3',
          corner: ['UFR', 'F'],
          edge: ['UL', 'L'],
          pair: '',
          alg: "F' U' F",
          idea: 'F\' levanta el hueco y de paso corre la esquina hacia la izquierda, al lado de la arista. U\' deja el par encima del hueco y F lo baja.',
        },
        {
          id: 'f2l-4',
          corner: ['UFR', 'R'],
          edge: ['UB', 'U'],
          pair: '',
          alg: "R U R'",
          idea: 'R lleva la esquina atrás, justo al lado de la arista: ahí se forma el par. U lo trae encima del slot y R\' lo baja.',
        },
      ],
    },
    {
      id: 'side',
      title: 'Esquina arriba con el blanco al costado',
      text: 'La esquina está encima del slot con el blanco mirando a un costado y la arista en otro lugar de arriba. Primero se forma el par y después se inserta.',
      cases: [
        {
          id: 'f2l-5',
          corner: ['UFR', 'F'],
          edge: ['UB', 'U'],
          pair: "U' R U R'",
          alg: "U' R U R' U2 R U' R'",
          idea: 'La arista está atrás, lejos de la esquina. Con U\' R U R\' la esquina da una vuelta por la cara derecha y vuelve pegada a la arista. Con el par armado, U2 R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-6',
          corner: ['UFR', 'R'],
          edge: ['UL', 'L'],
          pair: "U F' U' F",
          alg: "U F' U' F U2 F' U F",
          idea: 'Es el espejo del anterior usando la cara del frente: U F\' U\' F junta esquina y arista, y U2 F\' U F inserta el par.',
        },
        {
          id: 'f2l-7',
          corner: ['UFR', 'F'],
          edge: ['UL', 'U'],
          pair: "U' R U2 R'",
          alg: "U' R U2 R' U2 R U' R'",
          idea: 'La arista está del otro lado. U\' R U2 R\' hace que la esquina dé media vuelta por arriba y quede junto a la arista; U2 R U\' R\' inserta el par.',
        },
        {
          id: 'f2l-8',
          corner: ['UFR', 'R'],
          edge: ['UB', 'B'],
          pair: "U F' U2 F",
          alg: "U F' U2 F U2 F' U F",
          idea: 'Espejo del anterior: U F\' U2 F junta las piezas y U2 F\' U F inserta el par.',
        },
        {
          id: 'f2l-9',
          corner: ['UFR', 'F'],
          edge: ['UB', 'B'],
          pair: "U' R U' R'",
          alg: "U' R U' R' U F' U' F",
          idea: 'U\' R U\' R\' junta la esquina con la arista, pero el par queda mirando hacia el frente. Por eso se inserta por F: U F\' U\' F.',
        },
        {
          id: 'f2l-10',
          corner: ['UFR', 'R'],
          edge: ['UL', 'U'],
          pair: "U' R U R'",
          alg: "U' R U R' U R U R'",
          idea: 'U\' R U R\' junta la esquina con la arista. Como el par queda del lado derecho, se inserta con U R U R\'.',
        },
        {
          id: 'f2l-11',
          corner: ['UFR', 'F'],
          edge: ['UR', 'R'],
          pair: "U' R U2 R'",
          alg: "U' R U2 R' U F' U' F",
          idea: 'Esquina y arista están una al lado de la otra, pero con los colores cruzados: no forman par. U\' R U2 R\' las separa y las vuelve a juntar bien; U F\' U\' F inserta el par por el frente.',
        },
        {
          id: 'f2l-12',
          corner: ['UFR', 'R'],
          edge: ['UF', 'U'],
          pair: "U F' U2 F",
          alg: "U F' U2 F U' R U R'",
          idea: 'Igual que el anterior, con la arista al frente: U F\' U2 F rearma el par y U\' R U R\' lo inserta por la derecha.',
        },
        {
          id: 'f2l-13',
          corner: ['UFR', 'F'],
          edge: ['UF', 'F'],
          pair: "U F' U F",
          alg: "U F' U F U' F' U' F",
          idea: 'Están juntas pero mal combinadas. U F\' U F las separa y las une bien; U\' F\' U\' F mete el par por el frente.',
        },
        {
          id: 'f2l-14',
          corner: ['UFR', 'R'],
          edge: ['UR', 'U'],
          pair: "U' R U' R'",
          alg: "U' R U' R' U R U R'",
          idea: 'Espejo del anterior por la derecha: U\' R U\' R\' arma el par y U R U R\' lo inserta.',
        },
        {
          id: 'f2l-15',
          corner: ['UFR', 'R'],
          edge: ['UR', 'R'],
          pair: "R U' R'",
          alg: "R U' R' U2 F' U' F",
          idea: 'El slot está vacío y se puede usar: R U\' R\' gira la esquina aprovechando el hueco y la deja pegada a la arista. U2 F\' U\' F inserta el par por el frente.',
        },
        {
          id: 'f2l-16',
          corner: ['UFR', 'F'],
          edge: ['UF', 'U'],
          pair: "F' U F",
          alg: "F' U F U2 R U R'",
          idea: 'Espejo del anterior: F\' U F gira la esquina usando el hueco y la junta con la arista; U2 R U R\' inserta el par por la derecha.',
        },
      ],
    },
    {
      id: 'up',
      title: 'Esquina arriba con el blanco hacia arriba',
      text: 'Con el blanco arriba la esquina no puede entrar directo: primero hay que girarla. Casi siempre se hace con R U2 R\' (o F\' U2 F), que además la deja junto a la arista.',
      cases: [
        {
          id: 'f2l-17',
          corner: ['UFR', 'U'],
          edge: ['UR', 'U'],
          pair: "R U2 R'",
          alg: "R U2 R' U' R U R'",
          idea: 'R U2 R\' gira la esquina (el blanco pasa a un costado) y la deja junto a la arista. U\' R U R\' inserta el par.',
        },
        {
          id: 'f2l-18',
          corner: ['UFR', 'U'],
          edge: ['UF', 'F'],
          pair: "F' U2 F",
          alg: "F' U2 F U F' U' F",
          idea: 'Espejo por el frente: F\' U2 F gira la esquina y forma el par; U F\' U\' F lo inserta.',
        },
        {
          id: 'f2l-19',
          corner: ['UFR', 'U'],
          edge: ['UB', 'U'],
          pair: "U R U2 R'",
          alg: "U R U2 R' U R U' R'",
          idea: 'U ubica la esquina para que R U2 R\' la gire y la deje junto a la arista, que estaba atrás. U R U\' R\' inserta el par.',
        },
        {
          id: 'f2l-20',
          corner: ['UFR', 'U'],
          edge: ['UL', 'L'],
          pair: "U' F' U2 F",
          alg: "U' F' U2 F U' F' U F",
          idea: 'Espejo del anterior: U\' F\' U2 F gira la esquina y forma el par; U\' F\' U F lo inserta.',
        },
        {
          id: 'f2l-21',
          corner: ['UFR', 'U'],
          edge: ['UL', 'U'],
          pair: "U2 R U R'",
          alg: "U2 R U R' U R U' R'",
          idea: 'La arista está a la izquierda. U2 R U R\' gira la esquina y la lleva hasta la arista; U R U\' R\' inserta el par.',
        },
        {
          id: 'f2l-22',
          corner: ['UFR', 'U'],
          edge: ['UB', 'B'],
          pair: "U2 F' U' F",
          alg: "U2 F' U' F U' F' U F",
          idea: 'Espejo del anterior: U2 F\' U\' F forma el par y U\' F\' U F lo inserta.',
        },
        {
          id: 'f2l-23',
          corner: ['UFR', 'U'],
          edge: ['UF', 'U'],
          pair: "R U R' U2 R U R'",
          alg: "R U R' U2 R U R' U' R U R'",
          idea: 'Esquina y arista están juntas pero mal combinadas, y encima el blanco mira arriba. R U R\' U2 R U R\' las separa, gira la esquina y las vuelve a unir bien; U\' R U R\' inserta el par.',
        },
        {
          id: 'f2l-24',
          corner: ['UFR', 'U'],
          edge: ['UR', 'R'],
          pair: "F' U' F U2 F' U' F",
          alg: "F' U' F U2 F' U' F U F' U' F",
          idea: 'Espejo del anterior por el frente: F\' U\' F U2 F\' U\' F arma bien el par y U F\' U\' F lo inserta.',
        },
      ],
    },
    {
      id: 'edge-slot',
      title: 'Arista en el slot, esquina arriba',
      text: 'La arista ya está en su lugar (bien o dada vuelta) y la esquina arriba. Se saca la arista junto con la esquina para formar el par y se vuelve a meter.',
      cases: [
        {
          id: 'f2l-25',
          corner: ['UFR', 'R'],
          edge: ['FR', 'R'],
          pair: "U F' U' F",
          alg: "U F' U' F U' R U R'",
          idea: 'La arista está en el slot pero dada vuelta. U F\' U\' F la saca y la deja pegada a la esquina, ya como par; U\' R U R\' lo inserta bien.',
        },
        {
          id: 'f2l-26',
          corner: ['UFR', 'F'],
          edge: ['FR', 'R'],
          pair: "U' R U R'",
          alg: "U' R U R' U F' U' F",
          idea: 'Arista dada vuelta en el slot. U\' R U R\' la saca junto con la esquina y forma el par; U F\' U\' F lo vuelve a meter, ahora bien orientado.',
        },
        {
          id: 'f2l-27',
          corner: ['UFR', 'U'],
          edge: ['FR', 'R'],
          pair: "R U' R'",
          alg: "R U' R' U F' U F",
          idea: 'R U\' R\' saca la arista del slot y a la vez gira la esquina: quedan juntas formando el par. U F\' U F lo inserta por el frente.',
        },
        {
          id: 'f2l-28',
          corner: ['UFR', 'R'],
          edge: ['FR', 'F'],
          pair: "U R U R'",
          alg: "U R U R' U2 R U R'",
          idea: 'La arista está bien, pero hay que sacarla para poder meter la esquina con ella. U R U R\' la saca y forma el par; U2 R U R\' lo inserta.',
        },
        {
          id: 'f2l-29',
          corner: ['UFR', 'F'],
          edge: ['FR', 'F'],
          pair: "U' R U' R'",
          alg: "U' R U' R' U2 R U' R'",
          idea: 'Igual que el anterior, con el blanco de la esquina al frente: U\' R U\' R\' saca la arista y arma el par; U2 R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-30',
          corner: ['UFR', 'U'],
          edge: ['FR', 'F'],
          pair: "R U R' U' R U R'",
          alg: "R U R' U' R U R' U' R U R'",
          idea: 'Con el blanco arriba hace falta un paso más: R U R\' U\' R U R\' saca la arista, gira la esquina y deja el par armado. U\' R U R\' lo inserta.',
        },
      ],
    },
    {
      id: 'corner-slot',
      title: 'Esquina en el slot, arista arriba',
      text: 'La esquina ya está en su lugar (bien o girada) y la arista arriba. Se saca la esquina un momento para juntarla con la arista.',
      cases: [
        {
          id: 'f2l-31',
          corner: ['DRF', 'D'],
          edge: ['UR', 'U'],
          pair: "U' F' U F",
          alg: "U' F' U F U R U' R'",
          idea: 'La esquina ya está bien, pero hay que sacarla un momento para emparejarla con la arista. U\' F\' U F la saca y forma el par; U R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-32',
          corner: ['DRF', 'D'],
          edge: ['UF', 'F'],
          pair: "U R U' R'",
          alg: "U R U' R' U' F' U F",
          idea: 'Espejo del anterior: U R U\' R\' saca la esquina y forma el par; U\' F\' U F lo inserta por el frente.',
        },
        {
          id: 'f2l-33',
          corner: ['DRF', 'F'],
          edge: ['UR', 'U'],
          pair: "R U' R'",
          alg: "R U' R' U R U' R'",
          idea: 'La esquina está en el slot pero girada. R U\' R\' la saca y la deja junto a la arista formando el par; U R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-34',
          corner: ['DRF', 'F'],
          edge: ['UF', 'F'],
          pair: "F' U' F",
          alg: "F' U' F U F' U' F",
          idea: 'Espejo del anterior por el frente: F\' U\' F saca la esquina y forma el par; U F\' U\' F lo inserta.',
        },
        {
          id: 'f2l-35',
          corner: ['DRF', 'R'],
          edge: ['UR', 'U'],
          pair: "R U R'",
          alg: "R U R' U' R U R'",
          idea: 'Esquina girada en el slot: R U R\' la saca y la empareja con la arista; U\' R U R\' inserta el par.',
        },
        {
          id: 'f2l-36',
          corner: ['DRF', 'R'],
          edge: ['UF', 'F'],
          pair: "F' U F",
          alg: "F' U F U' F' U F",
          idea: 'Espejo del anterior: F\' U F saca la esquina formando el par y U\' F\' U F lo inserta.',
        },
      ],
    },
    {
      id: 'both-slot',
      title: 'Esquina y arista en el slot',
      text: 'Las dos piezas están en su lugar, pero alguna está mal orientada. Hay que sacar el par roto, armarlo bien arriba y volver a meterlo.',
      cases: [
        {
          id: 'f2l-37',
          corner: ['DRF', 'D'],
          edge: ['FR', 'R'],
          pair: "R U2 R' U R U2 R'",
          alg: "R U2 R' U R U2 R' U F' U' F",
          idea: 'La esquina está bien y la arista dada vuelta. R U2 R\' U R U2 R\' saca las dos y deja el par bien armado arriba; U F\' U\' F lo inserta.',
        },
        {
          id: 'f2l-38',
          corner: ['DRF', 'F'],
          edge: ['FR', 'F'],
          pair: "R U' R' U' R U R'",
          alg: "R U' R' U' R U R' U2 R U' R'",
          idea: 'La arista está bien y la esquina girada. R U\' R\' U\' R U R\' saca las dos y las une como par; U2 R U\' R\' lo vuelve a meter.',
        },
        {
          id: 'f2l-39',
          corner: ['DRF', 'R'],
          edge: ['FR', 'F'],
          pair: "R U' R' U R U2 R'",
          alg: "R U' R' U R U2 R' U R U' R'",
          idea: 'Como el anterior, con la esquina girada para el otro lado: R U\' R\' U R U2 R\' arma el par afuera y U R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-40',
          corner: ['DRF', 'F'],
          edge: ['FR', 'R'],
          pair: "R U' R' F R U R' U' F'",
          alg: "R U' R' F R U R' U' F' R U' R'",
          idea: 'Esquina girada y arista dada vuelta: es el caso más largo. R U\' R\' F R U R\' U\' F\' saca todo y deja el par armado; R U\' R\' lo inserta.',
        },
        {
          id: 'f2l-41',
          corner: ['DRF', 'R'],
          edge: ['FR', 'R'],
          pair: "R U R' U' R U' R'",
          alg: "R U R' U' R U' R' U2 F' U' F",
          idea: 'Esquina girada y arista dada vuelta, para el otro lado: R U R\' U\' R U\' R\' arma el par afuera y U2 F\' U\' F lo inserta por el frente.',
        },
      ],
    },
  ],
};

// ---------- Texto de la situación, generado desde corner/edge ----------
// Así la descripción nunca puede contradecir lo que se verificó.

const FACING = { U: 'hacia arriba', D: 'hacia abajo', F: 'al frente', R: 'a la derecha', B: 'hacia atrás', L: 'a la izquierda' };
const EDGE_PLACE = { UF: 'arriba al frente', UR: 'arriba a la derecha', UB: 'arriba atrás', UL: 'arriba a la izquierda' };

export function describeF2L({ corner: [cAt, white], edge: [eAt, front] }) {
  const corner =
    cAt === 'DRF'
      ? white === 'D'
        ? 'Esquina en su lugar y bien orientada.'
        : `Esquina en el slot pero girada (blanco ${FACING[white]}).`
      : `Esquina arriba del slot, con el blanco ${FACING[white]}.`;
  const edge =
    eAt === 'FR'
      ? front === 'F'
        ? 'Arista en su lugar y bien orientada.'
        : 'Arista en el slot pero dada vuelta.'
      : `Arista ${EDGE_PLACE[eAt]}, con el color del frente ${FACING[front]}.`;
  return `${corner} ${edge}`;
}
