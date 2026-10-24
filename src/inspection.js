// Inspección WCA: reglas de tiempo, qué mostrar y avisos (voz o pitido).
// Las funciones de reglas son puras; la parte de sonido (al final) usa el navegador.

export const INSPECTION_MS = 15000; // hasta acá, sin penalización
export const PLUS2_LIMIT_MS = 17000; // hasta acá, +2; después, DNF
export const ALERTS_MS = [8000, 12000];
export const MAX_VOICE_LEAD_MS = 1500; // lo máximo que se adelanta la voz

// Penalización según cuánto duró la inspección al arrancar el timer.
// Más de 15 s → +2 · más de 17 s → DNF.
export function inspectionPenalty(elapsed) {
  if (elapsed <= INSPECTION_MS) return null;
  if (elapsed <= PLUS2_LIMIT_MS) return '+2';
  return 'DNF';
}

// Texto y nivel de color de la inspección.
// mode 'down' (regresivo): segundos que faltan, 15 → 0 (a los 8 s pasados muestra 7).
// mode 'up' (progresivo): segundos que pasaron, 0 → 15 (a los 8 s pasados muestra 8).
// Después de los 15 s: "+2", y después de los 17 s: "DNF".
// Nivel: normal (blanco) · warn a los 8 s (amarillo) · danger a los 12 s (rojo).
export function inspectionDisplay(elapsed, mode = 'down') {
  let text;
  if (elapsed <= INSPECTION_MS) {
    text = String(mode === 'up' ? Math.floor(elapsed / 1000) : Math.ceil((INSPECTION_MS - elapsed) / 1000));
  } else if (elapsed <= PLUS2_LIMIT_MS) text = '+2';
  else text = 'DNF';

  let level = 'normal';
  if (elapsed >= ALERTS_MS[1]) level = 'danger';
  else if (elapsed >= ALERTS_MS[0]) level = 'warn';
  return { text, level };
}

// Avisos que se cruzaron entre dos lecturas (prev, now]. Normalmente 0 o 1,
// pero si la pestaña estuvo en segundo plano pueden ser los dos juntos.
// cues: los momentos a vigilar (por defecto, 8 y 12 s exactos).
export function alertsCrossed(prev, now, cues = ALERTS_MS) {
  return cues.filter((ms) => prev < ms && now >= ms);
}

// Cuándo hay que LLAMAR a la voz para que se ESCUCHE a los 8 y 12 s: se adelanta
// lo que tarda el motor de voz en empezar a hablar (medido en este dispositivo).
// Devuelve [{ at, alert }]: at = cuándo llamar, alert = qué aviso es (8000 o 12000).
export function voiceSchedule(leadMs) {
  const lead = Math.min(Math.max(0, leadMs || 0), MAX_VOICE_LEAD_MS);
  return ALERTS_MS.map((alert) => ({ at: alert - lead, alert }));
}

// Retraso típico de la voz a partir de las últimas mediciones (la mediana, que
// no se deja llevar por una medición rara). Sin mediciones: 0.
export function estimateLead(samples) {
  const valid = samples.filter((ms) => Number.isFinite(ms) && ms >= 0).sort((a, b) => a - b);
  if (!valid.length) return 0;
  const mid = Math.floor(valid.length / 2);
  const median = valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
  return Math.min(Math.round(median), MAX_VOICE_LEAD_MS);
}

// ---------- Avisos de sonido (navegador) ----------

// Frases cortas: cuanto más corta, antes termina y menos se nota cualquier demora.
const WORDS = { 8000: 'ocho', 12000: 'doce' };
const LATENCY_KEY = 'cubos-web:voice-latency';
let audioCtx = null;
let voice = null;

// Elige la voz en español, prefiriendo una local (las "online" dependen de la red).
function pickVoice() {
  const voices = globalThis.speechSynthesis?.getVoices() ?? [];
  const es = voices.filter((v) => v.lang?.toLowerCase().startsWith('es'));
  voice = es.find((v) => v.localService) ?? es[0] ?? null;
}

// Al abrir la app: cargar las voces (en algunos navegadores llegan después, con "voiceschanged").
export function initVoices() {
  const synth = globalThis.speechSynthesis;
  if (!synth) return;
  pickVoice();
  synth.addEventListener?.('voiceschanged', pickVoice);
}

export const hasSpanishVoice = () => voice !== null;

function loadLatencies() {
  try {
    const list = JSON.parse(localStorage.getItem(LATENCY_KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveLatency(ms) {
  try {
    localStorage.setItem(LATENCY_KEY, JSON.stringify([...loadLatencies(), Math.round(ms)].slice(-7)));
  } catch {
    // sin almacenamiento: se usa solo en esta sesión
  }
}

// Cuánto conviene adelantar la voz en este dispositivo.
export const voiceLead = () => estimateLead(loadLatencies());

// Al empezar la inspección (viene de una tecla o toque, así que el navegador deja
// sonar): activa el audio y "despierta" el motor de voz con una frase muda, para
// que el aviso real no tenga que arrancarlo en frío.
export function primeAudio(mode) {
  const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (Ctx) {
    audioCtx ??= new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  if (mode !== 'voice' || !globalThis.speechSynthesis) return;
  if (!voice) pickVoice();
  const warm = new SpeechSynthesisUtterance('.');
  warm.volume = 0;
  if (voice) {
    warm.voice = voice;
    warm.lang = voice.lang;
  }
  stopAnnouncements();
  speechSynthesis.speak(warm);
}

// Corta cualquier frase pendiente (al cancelar o terminar la inspección).
export function stopAnnouncements() {
  const synth = globalThis.speechSynthesis;
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
}

export function beep(times) {
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

// Dice "ocho" / "doce" (alert = 8000 o 12000). Si no hay voz en español, pita
// (1 pitido a los 8 s, 2 a los 12 s). Mide cuánto tardó en empezar a hablar y lo
// guarda para adelantar los próximos avisos. Devuelve qué se usó.
export function announce(alert, { onLatency } = {}) {
  if (!voice) pickVoice();
  if (!voice || !globalThis.speechSynthesis) {
    beep(alert >= 12000 ? 2 : 1);
    return 'beep';
  }
  const utterance = new SpeechSynthesisUtterance(WORDS[alert]);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 1.2;
  const calledAt = performance.now();
  utterance.onstart = () => {
    const latency = performance.now() - calledAt;
    saveLatency(latency);
    onLatency?.(latency);
  };
  stopAnnouncements(); // si quedó algo sonando (por ejemplo el "ocho"), que no se encimen
  speechSynthesis.speak(utterance);
  return 'voice';
}
