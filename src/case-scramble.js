// Mezcla que arma un caso del entrenador (con el amarillo arriba): el algoritmo al
// revés y un giro de U al final, para practicar también el giro previo.
// Módulo aparte para que cubing/alg no entre en el paquete principal.
import { Alg } from 'cubing/alg';

export const AUFS = ['', 'U', 'U2', "U'"];

export function caseScramble(alg, auf = '') {
  const body = alg.replace(/^\([^)]*\)\s*/, ''); // el "(U2)" del principio es solo para la foto
  const text = `${new Alg(body).invert().toString()} ${auf}`.trim();
  return text.replace(/2'/g, '2');
}
