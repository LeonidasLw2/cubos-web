# Identificar casos con fotos

Abrí Métodos y elegí **Identificar caso**, o entrá desde la guía de Ortega, OLL, PLL o Reducción. Confirmá el prerrequisito y mantené la orientación indicada. Para cada foto, marcá las cuatro esquinas de la cara en orden horario, desde arriba a la izquierda. Revisá los colores propuestos y confirmá la vista. También se pueden ingresar colores manualmente. Una casilla desconocida sigue sin restringir la búsqueda.

| Cubo | Método y etapa | Cobertura | Vistas y verificación |
|---|---|---|---|
| 2×2×2 | Ortega · OLL | 7 casos y etapa orientada | Cara superior, color superior de referencia y esquinas laterales cuando hagan falta. El simulador comprueba que ambas caras terminan orientadas. |
| 2×2×2 | Ortega · PBL | 5 casos y cubo resuelto | Cara superior y ambas filas de los lados necesarios. La capa inferior puede requerir girar el cubo entero con `x2`. Se verificaron las 576 permutaciones orientadas aplicando los giros devueltos al estado original. |
| 3×3×3 | CFOP · OLL | 57 casos y etapa orientada | Cara superior y stickers laterales del color superior cuando sean necesarios. El simulador verifica orientación y conservación de las dos primeras capas. |
| 3×3×3 | CFOP · PLL | 21 casos y etapa resuelta o alineable con U | Cara superior, centros y filas laterales según la ambigüedad. El simulador verifica el resultado después del ajuste final. |
| 4×4×4 | Reducción · Paridades | Una o tres aristas superiores volteadas, intercambio puro de dos aristas opuestas o adyacentes, y etapa resuelta | Confirmación de centros completos, aristas emparejadas y primeras dos capas resueltas. Cara superior y las cuatro filas laterales con centros visibles. Se usa el simulador 4×4 del verificador, incluyendo giros internos. Si queda una OLL o PLL normal, el resultado lo indica. |

En las guías de Ortega y Reducción, la búsqueda sigue disponible para primera cara, centros y aristas. F2L, CLL, otros métodos, OLL y PLL normales sobre 4×4 y paridades combinadas quedan fuera de la cobertura de captura. Para ampliarla hacen falta observaciones adicionales y pruebas de que el algoritmo conserva las piezas exigidas en cada etapa. En 4×4, un patrón no cubierto recibe un mensaje de revisión, aunque el cubo esté correctamente reducido.

Los nombres, diagramas y algoritmos usan los casos del catálogo. Los ajustes dependen de la orientación observada. Si varios casos o ajustes siguen siendo posibles, se pide una vista adicional. En 4×4 se requieren todas las vistas de la última capa antes de confirmar. El modelo no comprueba con la cámara la parte inferior del cubo reducido y depende de la confirmación de la persona.

## Evidencia

- Pruebas del índice con un esquema de color alternativo. Se confirmaron los 32 estados visibles de Ortega OLL, 576 de PBL, 232 de CFOP OLL, 288 de PLL y 60 de paridades y alineación de 4×4. Hubo 0 ambigüedades y 0 casos incorrectos en ese conjunto de vistas completas. Las pruebas parciales verificaron que PLL y PBL pueden seguir ambiguos y que alas contradictorias se rechazan.
- Chrome emuló 390 × 844. Las fotos sintéticas recorrieron PBL adyacente en ambas capas con cinco vistas, T de PLL con tres vistas y paridad OLL de 4×4 con cinco vistas. Cada resultado abrió la tarjeta correspondiente de su guía.
- Chrome con cámara simulada comprobó captura, ausencia de audio en la petición, preferencia por cámara trasera, liberación del video, denegación, imagen inválida, entrada manual, Escape, cambio de ruta y apertura del escáner manual offline con el service worker activo.
- La selección de colores procesa píxeles localmente. La foto vive en el canvas y memoria temporal. Al repetir la vista, cambiar de etapa, cerrar o navegar, se libera esa captura. La lectura de color es heurística y depende de iluminación, reflejos y encuadre. Quedan pendientes fotos reales y cámara trasera en una PWA instalada.
- `npm test` pasó 132 pruebas. `npm run verify-algs` pasó 428 algoritmos y 3.152 comprobaciones. `npm run build` generó 73 entradas y 3.874,69 KiB de precaché, frente a 63 entradas y 3.847,34 KiB en el build anterior. El archivo del escáner pesa 20,70 kB y se importa al abrirlo. El JS principal pasó de 49,73 a 50,22 kB, sin medición comparativa del tiempo de arranque.
