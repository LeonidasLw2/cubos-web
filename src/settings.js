// Ajustes del usuario: valores por defecto, validación y guardado.
import { loadStoredSettings, saveStoredSettings } from './storage.js';

export const HOLD_OPTIONS = [300, 500, 800];
export const TIMER_DISPLAYS = ['time', 'solving']; // mostrar el tiempo o solo "Resolviendo..."

export const DEFAULT_SETTINGS = Object.freeze({
  inspection: true,
  voice: true,
  holdMs: 500,
  showCube: true,
  timerDisplay: 'time',
});

// Cada campo inválido o faltante toma su valor por defecto, así un dato viejo
// o corrupto nunca rompe la app y los ajustes nuevos se agregan solos.
export function sanitizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const bool = (key) => (typeof s[key] === 'boolean' ? s[key] : DEFAULT_SETTINGS[key]);
  return {
    inspection: bool('inspection'),
    voice: bool('voice'),
    holdMs: HOLD_OPTIONS.includes(s.holdMs) ? s.holdMs : DEFAULT_SETTINGS.holdMs,
    showCube: bool('showCube'),
    timerDisplay: TIMER_DISPLAYS.includes(s.timerDisplay) ? s.timerDisplay : DEFAULT_SETTINGS.timerDisplay,
  };
}

export function loadSettings() {
  return sanitizeSettings(loadStoredSettings());
}

export function saveSettings(settings) {
  saveStoredSettings(sanitizeSettings(settings));
}
