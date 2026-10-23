// Inspección WCA: reglas de tiempo, qué mostrar y avisos (voz o pitido).
// Las funciones de reglas son puras; solo announce() y primeAudio() usan el navegador.

export const INSPECTION_MS = 15000; // hasta acá, sin penalización
export const PLUS2_LIMIT_MS = 17000; // hasta acá, +2; después, DNF
export const ALERTS_MS = [8000, 12000];

// Penalización según cuánto duró la inspección al arrancar el timer.
// Más de 15 s → +2 · más de 17 s → DNF.
export function inspectionPenalty(elapsed) {
  if (elapsed <= INSPECTION_MS) return null;
  if (elapsed <= PLUS2_LIMIT_MS) return '+2';
  return 'DNF';
}

// Texto y nivel de color: segundos restantes (15…1), después "+2" y "DNF".
// Nivel: normal (blanco) · warn a los 8 s (amarillo) · danger a los 12 s (rojo).
export function inspectionDisplay(elapsed) {
  let text;
  if (elapsed < INSPECTION_MS) text = String(Math.ceil((INSPECTION_MS - elapsed) / 1000));
  else if (elapsed <= PLUS2_LIMIT_MS) text = '+2';
  else text = 'DNF';

  let level = 'normal';
  if (elapsed >= ALERTS_MS[1]) level = 'danger';
  else if (elapsed >= ALERTS_MS[0]) level = 'warn';
  return { text, level };
}

// Avisos que se cruzaron entre dos lecturas (prev, now]. Normalmente 0 o 1,
// pero si la pestaña estuvo en segundo plano pueden ser los dos juntos.
export function alertsCrossed(prev, now) {
  return ALERTS_MS.filter((ms) => prev < ms && now >= ms);
}

// ---------- Avisos de sonido ----------

const WORDS = { 8: 'ocho segundos', 12: 'doce segundos' };
let audioCtx = null;

function spanishVoice() {
  const voices = globalThis.speechSynthesis?.getVoices() ?? [];
  return voices.find((v) => v.lang?.toLowerCase().startsWith('es')) ?? null;
}

// El navegador solo deja reproducir sonido después de una interacción del
// usuario: esto se llama al empezar la inspección (que viene de una tecla o toque).
export function primeAudio() {
  globalThis.speechSynthesis?.getVoices(); // algunas voces se cargan recién al pedirlas
  const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctx) return;
  audioCtx ??= new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(times) {
  if (!audioCtx) return;
  for (let i = 0; i < times; i++) {
    const start = audioCtx.currentTime + i * 0.18;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.13);
  }
}

// Dice "ocho segundos" / "doce segundos" con voz en español; si no hay, pita
// (1 pitido a los 8 s, 2 a los 12 s). Devuelve qué se usó.
export function announce(seconds) {
  const voice = spanishVoice();
  if (voice) {
    const utterance = new SpeechSynthesisUtterance(WORDS[seconds]);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 1.15;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    return 'voice';
  }
  beep(seconds >= 12 ? 2 : 1);
  return 'beep';
}
