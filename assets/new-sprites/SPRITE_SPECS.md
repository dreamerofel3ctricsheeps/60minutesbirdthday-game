# Especificaciones de arte para sprites de personajes — v4

## Por qué este documento existe

El pipeline actual (`tools/seg.py` + `tools/mksprites.py`) recorta a cada personaje desde tus borradores de `assets/drafts/v1.2`, que están dibujados en pose "T" o con los brazos pegados al cuerpo sobre fondo de ajedrez. Para generar la caminata y la pose de acción, el script **rota matemáticamente** la región del brazo detectada en el dibujo original. Esto funciona como solución temporal, pero tiene un límite real: si el dibujo no deja espacio o ángulo suficiente para el brazo, el recorte puede cortar manos, dedos o el borde de una manga, y el resultado no transmite el mismo mood ilustrado y cálido del diseño original.

La solución correcta no es seguir ajustando el algoritmo de recorte — es que **tú entregues las poses ya dibujadas**, con el mismo estilo y trazo del diseño original, y el pipeline las use directamente en vez de sintetizarlas. Esto es lo que necesito de cada personaje y en qué formato.

## Lista de personajes

Alan, Fátima, Itzel, José, Majo, Natalia, Samantha, Saulo, Ximena (9 personajes humanos). Pollito el gato sigue dibujado por código y no necesita arte nuevo salvo que quieras reemplazarlo también.

## Poses necesarias por personaje

Para cada personaje, en este orden de prioridad:

| # | Pose | Uso en el juego | Prioridad |
|---|---|---|---|
| 1 | **Idle (frente, reposo)** | Ya existe en tus borradores — es la base de referencia de color/proporción, no hace falta redibujar. | ✅ ya tienes |
| 2 | **Walk A (frente, paso izquierdo)** | Fotograma de caminata, pierna/brazo izquierdo adelante | 🔴 Alta |
| 3 | **Walk B (frente, paso derecho)** | Fotograma de caminata, pierna/brazo derecho adelante | 🔴 Alta |
| 4 | **Act (frente, acción/interacción)** | Usado al recoger objetos, interactuar, jugar minijuegos | 🔴 Alta |
| 5 | **Back idle (espalda, reposo)** | Vista de espalda al caminar hacia el fondo del cuarto | 🟡 Media |
| 6 | **Back Walk A / Walk B (espalda, caminata)** | Caminata de espalda | 🟡 Media |
| 7 | **Side idle / walk (perfil)** | Reemplaza el "espejo del frente inclinado" que usamos ahora como parche | 🟢 Opcional, mejora notable |

Si solo entregas 2, 3 y 4 por personaje ya resolvemos el problema más visible (extremidades cortadas en la caminata). 5–7 son para pulir espalda y perfil, que hoy son aproximaciones.

## Especificaciones técnicas de cada archivo

- **Formato:** PNG con transparencia (fondo alpha=0, NO usar el fondo de ajedrez — ya no lo necesitamos si el PNG tiene canal alpha real).
- **Lienzo:** 144 × 244 px por pose (mismo tamaño que el frame actual, `FW=144, FH=244`), personaje centrado, línea de piso en `y=236` desde arriba (`BASE=236`), dejando aire arriba de la cabeza.
- **Escala y proporción:** usa el idle actual de ese mismo personaje como plantilla de calco — altura total, ancho de hombros y proporción de cabeza deben coincidir pose a pose. Si la pose nueva no calza en escala con el idle, no podremos intercambiarlas sin que el personaje "salte" de tamaño al animar.
- **Resolución del trazo:** mismo nivel de detalle y grosor de línea que el idle (no pixel-art de baja resolución, no vector liso) — el idle ya define el estilo, solo hay que replicarlo en la pose nueva.
- **Encuadre de las extremidades — el punto crítico:** en Walk A/B y Act, brazos y piernas en movimiento **deben caber completos dentro del lienzo de 144×244**, con al menos 4–6 px de margen entre la punta de mano/pie y el borde del lienzo. No recortar manos, dedos, pies ni la punta de objetos que el personaje sostenga.
- **Nombre de archivo:** `nombre_pose.png`, ej. `jose_walkA.png`, `jose_walkB.png`, `jose_act.png`, `jose_back_idle.png`, `jose_back_walkA.png`, etc. (todo en minúsculas, sin tildes ni espacios).
- **Color de pelo / piel:** mantener exactamente los mismos tonos que el idle de ese personaje (mismo código de color, no solo "similar"), porque el sistema de expresiones y back-view repinta sobre esa referencia de color.

## Guía de pose (para que la caminata se sienta natural)

Pensando en el estilo "diorama" del juego (vista 3/4, personaje algo estilizado):

- **Walk A:** pierna izquierda adelante y brazo derecho adelante (contrapaso natural), torso con leve inclinación hacia adelante.
- **Walk B:** espejo de Walk A — pierna derecha adelante, brazo izquierdo adelante.
- **Act:** brazos ligeramente levantados o extendidos hacia adelante, como si fuera a tomar/soltar un objeto; esta pose se usa también como "golpe de energía" en los minijuegos, así que puede tener algo más de dinamismo que el idle.
- Evita extremos de pose (zancada muy abierta, brazo totalmente extendido fuera de cuadro) — el lienzo de 144×244 es angosto; piensa en el rango de movimiento que verías en un personaje de Mario Party visto en diorama, no en un sprite de lucha.

## Casos especiales ya conocidos (para que no se repitan)

- **José:** su cabello es oscuro y de bajo contraste contra el contorno — si rediseñas su pose, mantén el contorno blanco/claro alrededor de la silueta para que no se "pierda" contra el fondo oscuro del cuarto.
- **Majo:** en el borrador original sostiene un objeto (clipboard) en una mano; si esa pose se mantiene en Walk/Act, especifica claramente qué pasa con el objeto en cada fotograma (¿lo sigue sosteniendo? ¿lo suelta?) para no tener que inventarlo en el código.
- **Natalia:** su cabello tiene mechones sueltos que en el recorte automático generaban artefactos; en dibujo nuevo no hay problema, pero si usas la misma silueta de pelo, recuerda que debe quedar claramente separada del fondo de ajedrez (o directamente sin fondo de ajedrez, ya con alpha).

## Qué hago yo con esto

En cuanto me entregues los PNG con estos nombres y specs, actualizo `tools/mksprites.py` para que use tus poses dibujadas directamente (sin rotación algorítmica de brazos) para los personajes/poses que entregues, y solo caiga al método de síntesis actual para lo que falte. Así vamos reemplazando personaje por personaje sin tener que regenerar todo de una vez.

## Resumen rápido (checklist por personaje)

- [ ] `*_walkA.png` — pierna/brazo en contrapaso, frente
- [ ] `*_walkB.png` — espejo de walkA, frente
- [ ] `*_act.png` — pose de acción/interacción, frente
- [ ] `*_back_idle.png` — reposo, espalda (opcional)
- [ ] `*_back_walkA.png` / `*_back_walkB.png` — caminata, espalda (opcional)
- [ ] `*_side_idle.png` / `*_side_walk.png` — perfil (opcional, mejora notable)

Carpeta sugerida para entregarlos: `assets/drafts/v1.3/` (mismo patrón que v1.2), o dime si prefieres otra ruta.
