# Rediseño local de CubeSolver

Base `main` en `dfa72b3`. El informe previo se conserva en [Auditoría](AUDITORIA-CUBESOLVER.md). El producto sigue siendo una PWA con un solo frontend, manifiesto en Vite, arranque `/cubos-web/` en modo standalone y caché de producción con Workbox. La referencia visual es el sitio publicado.

## Abrir y probar

Desde `/Users/leo/cubos-web`, ejecutá `npm run build` y `npm run preview -- --host 127.0.0.1 --port 4181`.

- [Timer](http://127.0.0.1:4181/cubos-web/#/timer)
- [Entrenar](http://127.0.0.1:4181/cubos-web/#/entrenar)
- [Métodos](http://127.0.0.1:4181/cubos-web/#/metodos)
- [PLL](http://127.0.0.1:4181/cubos-web/#/metodos/3x3/cfop/pll)
- [Notación](http://127.0.0.1:4181/cubos-web/#/notacion)

## Composición

Referencias de composición y respuesta de controles. [Apple América Latina](https://www.apple.com/la/) · [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

El Timer conserva Inter y sus cifras tabulares. Se acorta la práctica en móviles verticales con altura suficiente para acercar las estadísticas. Entrenar presenta antes la mezcla y el reloj, con un visor más compacto. Métodos y las portadas de puzzle ponen la elección arriba. Las guías que tienen explorador ofrecen un acceso que desplaza al buscador y le da foco sin modificar la ruta. Notación mantiene juntos los primeros giros y su visor en el orden del documento. Ajustes ofrece un acceso a Tus tiempos.

Comparación en Chrome con viewport emulado 390 × 844, tema oscuro, perfil temporal sin historial inicial, movimiento reducido y las mismas rutas. Son posiciones de inicio de cada elemento en píxeles CSS.

| Elemento | Publicado | Local |
|---|---:|---:|
| Estadísticas del Timer | 801 | 697 |
| Área del reloj de Entrenar | 803 | 530 |
| Primera opción de Métodos | 620 | 226 |
| Buscador PLL en la carga inicial | 2491 | 2547 |
| Buscador PLL desde el encabezado | Desplazamiento manual | Una activación, con foco en el campo |

En 1280 × 800, la primera opción de Métodos subió de 507 a 207 y el área del reloj de Entrenar de 466 a 415. El buscador PLL sigue en su posición dentro del contenido. El enlace del encabezado es el acceso rápido. Las 18 capturas se guardaron fuera del repositorio en `/Users/leo/.codex/visualizations/2026/11/03/01a1a3bc-03b8-7fa3-a4d8-764abc0f8d15/cubos-rediseno`. Las mezclas aleatorias pueden variar entre perfiles.

## Hallazgos de la auditoría

| # | Estado | Cambio y evidencia |
|---|---|---|
| 1 | Corregido | Fechas fuera del rango pasan a desconocidas. Prueba de importación con fecha válida, ausente y fuera de rango. |
| 2 | Parcial | Timer y Entrenar avisan de escrituras fallidas. La exportación incluye intentos pendientes. Chrome simuló cuota bloqueada en Timer y descargó un resultado que no sobrevivió a la recarga. Quedan preferencias y combinaciones de importación, sincronización y datos pendientes. |
| 3 | Corregido con verificación parcial | Espacio respeta controles enfocados en reposo. Chrome abrió el visor con Espacio y cronometró con foco en el reloj. Se limpia la pulsación al ocultar la página. Falta validar hardware táctil. |
| 4 | Pendiente de entorno aislado | Se conserva el protocolo de nube. Para resolverlo hace falta un proyecto de prueba o emulador con dos clientes y una barrera entre lectura y escritura. Probar edición concurrente, borrado, desfase, lote parcial y reintento. Evaluar escritura condicional y cursor con orden del servidor en ese entorno. |
| 5 | Corregido | Se excluyen las mutaciones del propio control y se añaden flechas, Inicio, Fin y avance por página. La medición en reposo pasó de 60 escrituras por segundo a 0. |
| 6 | Parcial | Tras penalizar se recupera el foco del mismo control sin desplazar la página. La lista sigue reconstruyéndose. |
| 7 | Corregido | Se devuelve el foco a la casilla equivalente al actualizar la lista. Chrome comprobó que Espacio cambia la casilla y mantiene el foco. |
| 8 | Corregido | La fusión indexa por ID y fecha/tiempo. Las pruebas existentes de unión y reimportación pasan. En Node, con dos conjuntos disjuntos de 10.000 registros la fusión pasó de aproximadamente 940 ms a 9 ms. Con 25.000 por conjunto pasó de unos 3.041 ms a 16 ms. |
| 9 | Pendiente de decisión | Archivos independientes sin fecha ni ID pueden ser indistinguibles. Para separar archivos diferentes, evaluar un identificador estable de origen y decidir cómo reconciliar importaciones que ya tienen IDs sintéticos guardados. |
| 10 | Corregido | Se consultan propiedades propias en los mapas de rutas. Pruebas con constructor y __proto__. Se conserva la redirección del Solver retirado. |
| 11 | Corregido | Los chips de Notación se anuncian como navegación y el activo como página actual. Se añadieron giros junto al visor. |
| 12 | Corregido | El control de mezcla en historial expone aria-expanded y lo sincroniza al abrir o cerrar. |

## Verificación y pendientes

- `npm test` pasó 122 pruebas. `npm run verify-algs` pasó 428 algoritmos y 3.152 comprobaciones. `npm run build` generó 63 entradas y 3.847,34 KiB de precaché frente a 3.842,95 KiB en la referencia local anterior. Vite sigue avisando de chunks superiores a 500 kB. El manifiesto de npm carece de comandos de lint y typecheck.
- Chrome completó inspección, resolución y recarga con historial en 390 × 844 y 1280 × 800. También verificó la activación del visor con Espacio, el foco del buscador PLL y la activación de un giro rápido de Notación.
- El barrido local abrió 37 rutas en 360 × 640, 390 × 844, 667 × 375 y 1280 × 800. Las 148 vistas pasaron las comprobaciones de encabezado, excepciones y desborde horizontal.
- Con el service worker controlando Chrome, la recarga del Timer y la apertura de PLL funcionaron en modo offline emulado.
- Hallazgo adicional en Entrenar. Una casilla podía cambiar el caso durante una resolución. Se conserva la selección hasta que termine el intento. El área del reloj captura el puntero para poder completar o cancelar el gesto fuera de su borde. Chrome comprobó que soltar fuera inicia el intento preparado, que la casilla conserva su valor durante la resolución y que aparece el resultado al terminar.
- Quedan pendientes la revisión específica de materiales plateado y dorado de Mirror, la reorganización completa de selección y rendimiento de Entrenar, la revisión de Cuenta y sincronización, la actualización entre dos instalaciones, el lector de pantalla y el teclado virtual y gestos en un teléfono físico.
