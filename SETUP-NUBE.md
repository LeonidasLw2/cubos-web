# Configuración de Sincronización en la Nube (`SETUP-NUBE.md`)

CubeSolver es **local-first**: funciona 100 % sin cuenta guardando todo en `localStorage`. Si querés activar el inicio de sesión con Google y la sincronización entre dispositivos con Firebase (plan gratuito Spark), seguí estos **7 pasos** en [Firebase Console](https://console.firebase.google.com/):

---

## 1. Crear el proyecto en Firebase
Entrá a [console.firebase.google.com](https://console.firebase.google.com/), hacé clic en **Agregar proyecto** (por ejemplo `cubesolver-web`) y finalizá el asistente (no hace falta activar Google Analytics).

## 2. Registrar la aplicación Web
En la portada del proyecto, hacé clic en el ícono Web **`</>`**, poné de nombre `CubeSolver` y copiá el objeto `firebaseConfig` que te muestra la pantalla.

## 3. Activar Google en Authentication
En el menú izquierdo, abrí **Compilación → Authentication → Comenzar**, entrá a la pestaña **Sign-in method**, elegí **Google**, activá el interruptor, seleccioná tu correo de soporte y tocá **Guardar**.

## 4. Autorizar el dominio de GitHub Pages
Dentro de **Authentication → Settings → Dominios autorizados**, verificá que estén `localhost` y agregá tu dominio de publicación (por ejemplo `leonidaslw2.github.io`).

## 5. Crear la base de datos Cloud Firestore
Abrí **Compilación → Firestore Database → Crear base de datos**, elegí la ubicación más cercana (por ejemplo `southamerica-east1`) y creala en **modo de producción**.

## 6. Publicar las reglas de seguridad (`firestore.rules`)
En **Firestore Database → Reglas**, reemplazá el contenido por el archivo [`firestore.rules`](./firestore.rules) de este repositorio y hacé clic en **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 7. Pegar las credenciales en `src/firebase-config.js`
Abrí [`src/firebase-config.js`](./src/firebase-config.js), completá los campos de `FIREBASE_CONFIG` con los valores del paso 2 (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) y hacé deploy.

---

### Estructura de datos en Firestore
- `users/{uid}/solves/{solveId}`: un documento por cada tiempo (con `id` UUID, `puzzle`, `time`, `penalty`, `scramble`, `session`, `date`, `updatedAt` y `deleted` para tombstones).
- `users/{uid}/meta/settings`: ajustes del Timer, inspección y (por compatibilidad) las preferencias viejas del Solver.
- `users/{uid}/meta/progress`: algoritmos marcados como aprendidos en Métodos.
