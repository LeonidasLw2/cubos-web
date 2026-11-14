# Clasificación de la comunidad

La vista previa local se abre desde Más o desde la sesión del Timer. En Cuenta, abrí Perfil de CubeSolver para elegir un nombre e icono. Podés guardar una imagen PNG, JPEG o WebP como miniatura local de 96 × 96. Al volver al icono predeterminado y guardar, la miniatura anterior deja de estar guardada. La vista previa empieza desactivada y se retira desmarcando la opción y guardando el perfil.

El selector usa el catálogo del Timer. La marca se calcula de los intentos guardados para ese cubo, tomando el mejor tiempo válido con +2 aplicado. Quedan fuera DNF, Entrenar, respaldos importados e intentos anteriores a esta versión que carecen del campo de procedencia. La marca se recalcula al abrir la vista y al cambiar de cubo. El perfil de autenticación se conserva en la sección privada de Cuenta.

La clasificación pública requiere implementar y comprobar su servicio antes de habilitar participación. El build actual solo muestra la fila local, carece de operaciones de escritura pública y conserva las reglas privadas de Firestore.

## Trabajo de backend pendiente

1. Preparar un proyecto de prueba con emuladores de Auth y Firestore y un runtime Java compatible. Usar dos identidades ficticias y una sesión sin autenticar.
2. Implementar una vinculación privada, inmutable y única de la cuenta al ID público opaco. Separar esa vinculación de las filas públicas por puzzle. Cada fila debe admitir exclusivamente nombre elegido, icono permitido y mejor tiempo declarado en milisegundos. El puzzle pertenece a la ruta.
3. Implementar escrituras idempotentes bajo el mismo ID por puzzle y retirada atómica de las filas de la cuenta. Validar identidad, consentimiento, catálogo de puzzles, límites y campos permitidos en reglas. Comprobar que cambiar de cuenta detiene reintentos de la anterior.
4. Probar lectura pública acotada y ordenada por tiempo e ID opaco, sin correo, UID, foto del proveedor ni historial. Probar actualizaciones de PB, penalizaciones, empate, borrado, retirada, dos escrituras simultáneas y rechazo de edición ajena.
5. Si se habilitan imágenes públicas, preparar almacenamiento con comprobación de propietario, formato y tamaño, y limpieza al reemplazar o retirar. Mientras tanto, el perfil compartido puede usar iconos incluidos en la app.
6. Una vez comprobadas las reglas y el servicio, revisar y desplegar la configuración del backend desde el proyecto autorizado. Solo entonces habilitar el flujo de participación y desplegar la web. Presentar las marcas como declaradas por el cliente.
