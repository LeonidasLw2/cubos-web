// Configuración pública de Firebase (SDK modular v9+).
// Esta configuración NO es secreta: identifica el proyecto cliente en el navegador.
// La seguridad real depende de las reglas en `firestore.rules` y de los dominios
// autorizados en Firebase Authentication.
//
// Seguí los pasos de `SETUP-NUBE.md` para crear tu proyecto gratuito en Firebase Console
// y pegá acá los valores de tu Web App. Si dejás los campos vacíos (""), CubeSolver
// funciona 100 % en modo local y muestra "Sincronización no configurada".

export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

const PLACEHOLDER_VALUES = new Set([
  '',
  'TU_API_KEY',
  'TU_PROJECT_ID',
  'YOUR_API_KEY',
  'YOUR_PROJECT_ID',
]);

/**
 * Devuelve true solo si `FIREBASE_CONFIG` tiene credenciales reales configuradas.
 */
export function isFirebaseConfigured(config = FIREBASE_CONFIG) {
  if (!config || typeof config !== 'object') return false;
  const apiKey = String(config.apiKey || '').trim();
  const projectId = String(config.projectId || '').trim();
  const authDomain = String(config.authDomain || '').trim();
  if (PLACEHOLDER_VALUES.has(apiKey) || PLACEHOLDER_VALUES.has(projectId)) return false;
  return apiKey.length > 8 && projectId.length > 2 && authDomain.length > 4;
}
