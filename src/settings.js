// Ajustes del usuario: valores por defecto, validación y guardado.
import { loadStoredSettings, saveStoredSettings } from './storage.js';

export const HOLD_OPTIONS = [300, 500, 800];
export const TIMER_DISPLAYS = ['time', 'solving']; // mostrar el tiempo u ocultarlo (cubo que late)
export const ALERT_MODES = ['voice', 'beep', 'none']; // avisos de 8 y 12 s
export const COUNTDOWN_MODES = ['down', 'up']; // inspección regresiva (15 → 0) o progresiva (0 → 15)
export const MIRROR_COLOR_OPTIONS = ['silver', 'gold']; // aspecto de las piezas en el Mirror

export const DEFAULT_SETTINGS = Object.freeze({
  inspection: true,
  alerts: 'voice',
  countdown: 'down',
  holdMs: 500,
  showCube: true,
  timerDisplay: 'time',
  mirrorColor: 'silver',
});

// Cada campo inválido o faltante toma su valor por defecto, así un dato viejo
// o corrupto nunca rompe la app y los ajustes nuevos se agregan solos.
export function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const bool = (key) => (typeof s[key] === 'boolean' ? s[key] : DEFAULT_SETTINGS[key]);
  const pick = (key, options) => (options.includes(s[key]) ? s[key] : DEFAULT_SETTINGS[key]);
  // Antes era "voice: true/false" (voz o nada): se traduce al ajuste nuevo.
  const legacyAlerts = typeof s.voice === 'boolean' ? (s.voice ? 'voice' : 'none') : DEFAULT_SETTINGS.alerts;
  return {
    inspection: bool('inspection'),
    alerts: ALERT_MODES.includes(s.alerts) ? s.alerts : legacyAlerts,
    countdown: pick('countdown', COUNTDOWN_MODES),
    holdMs: pick('holdMs', HOLD_OPTIONS),
    showCube: bool('showCube'),
    timerDisplay: pick('timerDisplay', TIMER_DISPLAYS),
    mirrorColor: pick('mirrorColor', MIRROR_COLOR_OPTIONS),
  };
}

export function loadSettings() {
  return sanitizeSettings(loadStoredSettings());
}

export function saveSettings(settings) {
  saveStoredSettings(sanitizeSettings(settings));
}
