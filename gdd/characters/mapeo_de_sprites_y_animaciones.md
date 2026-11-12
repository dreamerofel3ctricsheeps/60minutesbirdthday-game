# Mapeo de Sprites y Animaciones: "1 minuto para la fiesta"

Este documento detalla la estructura técnica de las hojas de sprites (*sprite sheets*), el desglose de cuadros (*frames*) por animación y el cálculo total de recursos gráficos necesarios para los personajes en el estilo **Pixel Art 2.5D ($64 \times 64$ píxeles)**.

## 1. Especificaciones Técnicas de la Cuadrícula (*Grid*)
* **Tamaño por Frame:** $64 \times 64$ píxeles por celda.
* **Formato:** Hoja de sprites optimizada en PNG transparente para motores web (Phaser.js / Canvas).
* **Distribución Geométrica:** Matriz estandarizada por filas (direcciones/estados) y columnas (fotogramas de animación).

## 2. Desglose de Sprites por Personaje (Estándar Individual)
Cada uno de los $8$ personajes del juego sigue esta estructura base para cubrir todas sus interacciones, movimientos y la fase frenética de recolección:

| Categoría de Animación | Direcciones / Variaciones | Frames por Dirección | Total de Frames |
| :--- | :--- | :--- | :--- |
| **Idle (Reposo)** | 4 direcciones (Frente, Espalda, Perfil Izq, Perfil Der) | $1$ frame | $4$ sprites |
| **Walk (Caminar)** | 4 direcciones (Frente, Espalda, Perfil Izq, Perfil Der) | $3$ frames | $12$ sprites |
| **Run (Correr)** | 4 direcciones (Frente, Espalda, Perfil Izq, Perfil Der) | $4$ frames (ciclo dinámico rápido) | $16$ sprites |
| **Acción / Rol** | Contextual (Cocinar, reparar, agarrar objetos, estudiar) | $2$ a $3$ frames | $2 - 3$ sprites |
| **Expresiones (UI)** | Retratos para diálogos (Neutral, Risueña, Enojada, Sospechosa, Triste) | $1$ expresión estática | $5$ rostros |
| **TOTAL ESTÁNDAR** | — | — | **$39 - 40$ sprites** |

## 3. Cálculo Global de Sprites para el Juego
* **Los 7 Roomies:** $7 \times 40 = 280$ sprites en total.
* **La Cumpleañera (Ximena - El Boss):** Incluye animaciones base de movimiento/estudio ($40$) + animación especial de alerta/jumpscare de derrota ($4$ frames adicionales) = **$44$ sprites**.
* **Total General del Proyecto:** Aproximadamente **$320$ sprites individuales** distribuidos en sus respectivas hojas para cubrir fluidez total en la fase de 60 segundos y el refugio.

## 4. Arquitectura de la Hoja de Sprites (*Sprite Sheet Layout*)
Cada archivo PNG de personaje se organizará de la siguiente manera:
* **Fila 1 (Frente):** `[Idle]` `[Walk 1-3]` `[Run 1-4]` `[Acción]`
* **Fila 2 (Espalda):** `[Idle]` `[Walk 1-3]` `[Run 1-4]` `[Acción opcional]`
* **Fila 3 (Perfiles - Izq / Der):** Ciclos de caminata y carrera lateral.
* **Fila 4 (Expresiones Faciales y Alertas):** Retratos estáticos para la interfaz y animaciones de tensión/derrota (*Boss*).