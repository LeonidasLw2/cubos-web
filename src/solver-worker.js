// Web Worker del Solver (Fase F): ejecuta la búsqueda IDA* / Kociemba / Reducción
// fuera del hilo principal para no bloquear la interfaz y permitir cancelar en cualquier momento.

import { KPattern } from 'cubing/kpuzzle';
import { getSolverEngine, solvePuzzlePattern, solveByInvertingScramble } from './solver-engine.js';
import { normalizePuzzleKey } from './notation-parser.js';

self.addEventListener('message', async (event) => {
  const data = event.data || {};
  const { id, type } = data;

  try {
    if (type === 'warmup') {
      await getSolverEngine();
      self.postMessage({ id, type: 'ready' });
      return;
    }

    if (type === 'invert-scramble') {
      const res = solveByInvertingScramble(data.puzzleKey, data.scramble);
      self.postMessage({ id, type: 'result', result: res });
      return;
    }

    if (type === 'solve') {
      const key = normalizePuzzleKey(data.puzzleKey);
      self.postMessage({
        id,
        type: 'progress',
        stage: 0,
        totalStages: key === '4x4' || key === '5x5' ? 3 : 1,
        label: 'Inicializando tablas del solver…',
        percent: 5,
      });

      const engine = await getSolverEngine();
      const kp = engine.kpuzzles[key];
      if (!kp) {
        throw new Error(`El puzzle "${key}" no está disponible en el Solver.`);
      }

      const pattern = new KPattern(kp, data.patternData);
      const result = await solvePuzzlePattern(key, pattern, {
        onProgress(progress) {
          self.postMessage({
            id,
            type: 'progress',
            ...progress,
          });
        },
      });

      self.postMessage({ id, type: 'result', result });
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      error: err?.message || 'Error inesperado al calcular la solución.',
    });
  }
});
