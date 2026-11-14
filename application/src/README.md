# 1 Minuto para la Fiesta — v3

Abre `index.html` con doble clic en un navegador de escritorio (Chrome, Edge o Firefox). No necesita servidor, instalación ni conexión; usa WebGL.

**Controles:** WASD o flechas para moverte · ESPACIO (o E) para actuar · clic en el chat para decidir (clic sobre los mensajes para acelerarlos).

**Pausa:** botón **⏸ Pausa** en el HUD, tecla **ESC** (siempre) o tecla **P** (solo fuera de los duelos y la recolección, donde las teclas son del juego). La pausa congela TODO el juego — bucle principal, temporizadores de escenas y duelos, animaciones y la cuenta de recolección — porque el tiempo corre centralizado en `frame()` (game.js); al reanudar se continúa exactamente donde estaba, sin saltos. El menú de pausa permite seguir jugando, abrir la lista de minijuegos o salir al título.

**Minijuegos (práctica directa):** botón **🧩 MINIJUEGOS** en la pantalla de título y en el menú de pausa. Lista los 11 minijuegos (nombre, jefe y descripción) y los lanza en modo práctica pura: misma escena que en la historia, pero sin premios, castigos ni efectos sobre ninguna partida. Al terminar: **Otra vez**, **Lista de minijuegos** o **Salir** (al título). Ojo: si lanzas una práctica a mitad de una partida, la partida se abandona (al terminar vas a la lista o al título, no de vuelta a la run); mirar la lista sin lanzar nada no abandona nada.

- `index.html?duelo=pizza` — modo práctica de un minijuego (atajo por URL, se mantiene): `decoracion`, `pollito`, `mensajes`, `apagon`, `pizza`, `sonambula`, `memoria`, `cactus`, `repisas`, `pisoton`, `azotea`.
- `index.html?low` — 3D a mitad de resolución · `index.html?nofx` — sin posproceso (equipos lentos).

## Qué hay en la v3
- **Party de verdad: protagonista + 3 partners (2026-11-14).** Se retomó el diseño original: el protagonista se elige entre **los 7 roomies** (cada uno con sus stats, habilidad y defecto) y durante el minuto de recolección **los 7 están en el departamento**. Acércate a un roomie y presiona ESPACIO para **cargarlo al hombro** (el portador usa sus animaciones `carrywalk_*`; el pasajero, su pose `carried`): llévalo al **armario** y déjalo ahí para reclutarlo. Máximo **3 partners**; si el minuto termina con menos, el juego sigue con los que haya (sin game over). Capacidad total 5 espacios = 3 del roomie al hombro + 2 de las manos (los ítems siguen como siempre; cargando a alguien puedes seguir recogiendo y guardando ítems). Al llegar Ximena, los roomies **no reclutados entran en pánico y salen corriendo** por la puerta («¡Nosotros ya nos íbamos! 😅»); ella pregunta extrañada por qué se fueron, alguien la despista… y la noche se juega **solo con la party**: asignaciones de eventos, duelos, chat y la revelación usan únicamente a los que se quedaron (los que huyeron ni siquiera hablan por el chat).
- **Sprites definidos (v3.1+).** Los personajes usan los bundles definidos de `assets/new-sprites/` (idle con personalidad, caminatas y carreras reales por dirección, acción; Jose con sneak/celebrate y Pollito es el gato calicó real). `tools/mkdefined.py` los normaliza a celdas uniformes, les hornea el borde blanco Paper Mario y detecta los ojos por frame para pintar expresiones sobre el frame actual. El resultado queda en `assets/sprites/defined/*.png` y embebido en `js/defined-sheets.js`. (El pipeline anterior desde la pose en T, `tools/mksprites.py`, queda como herramienta histórica: el juego ya no lo usa.)
- **Duelos por rondas.** Cada minijuego es al mejor de 3 rondas contra un jefe (Batalla de mensajes: primero en ganar 3 de 5; Salto de repisas es la excepción: una escalada única de 60 s por altura máxima).
- **Salto de repisas: escalada infinita (2026-11-14).** Antes era una carrera a una meta fija de 14 repisas y la siguiente repisa recién "aparecía" al saltar la anterior. Ahora **no hay techo**: las repisas se generan proceduralmente (función pura del índice, sin listas) y solo se dibujan las de la banda visible (set acotado a cualquier altura). Gana **el que más escaló** en **60 s**: cuenta la altura máxima (25 u = 1 m; cada repisa ≈ 1,1 m), con marcador ▲ en vivo de ambos. Equivocarse de lado = caer a la repisa anterior (la máxima no se pierde). Zonas con gags visuales: el librero interior → **el techo** (a los 378 u ≈ 15 m el librero lo atraviesa: escombros y banner «¡SALISTE DEL TECHO! 😱», antena/chimenea/tanque en la azotea) → cielo con nubes y pájaros → estratósfera (estrellas tenues, luna) → **espacio** (≥5000 u ≈ 200 m: estrellas, un satélite que cruza, el planeta brillando abajo y flotación con vaivén de ingravidez). El fondo interpola suave entre zonas, cada zona se anuncia una vez, y la cámara sube ágil y baja lenta para no marear.
- **Caminata lateral corregida (2026-11-14).** Los strips `walk_right` originales traían [contacto, pase, contacto repetido] (medido: la diferencia de piernas entre el frame 3 y el 1 era 0.06–0.30; en Majo los 3 frames eran casi idénticos, 0.06–0.09), así que los personajes "movían una pierna" y patinaban. Se regeneraron los `walk_right` de Natalia, Saulo, Itzel, Fátima, Majo y Alan con contactos opuestos explícitos (diferencias tras el arreglo: 0.48–0.94 en las tres transiciones; alfa semitransparente < 0.55%), y la cadencia en `world.js` quedó: `step` avanza 0.16 por unidad, beat de π/2 ≈ 9.8 u por frame, ciclos de 3 frames en ping-pong (0,1,2,1) — ciclo completo ≈ 39.3 u ≈ dos zancadas, en fase con el balanceo y el puff de pisada. Los ciclos de 4 frames (`walk_down`, carreras) van en loop directo.
- **Decoración Express corregida (2026-11-14).** Bug: "a veces solo me da a decorar un ítem" y "coloco la decoración y desaparece". Causa: el pool de zonas salía solo de la decoración recolectada (2 zonas por tipo, mínimo 3 en total) y el duelo lo reparte en 3 rondas, así que con 0–2 tipos recolectados las rondas salían con **un solo ítem** (medido: [1,1,1] sin inventario o con un tipo, [2,1,1] con dos) — y ese único ítem era el único blanco del gato, que lo tiraba segundos después de colgarlo. Ahora el set es **siempre las 6 zonas** (las de tipos no recolectados se improvisan con papel y post-its): 2 ítems por ronda, en historia y en práctica. Además, cada zona colocada lleva una marca **✓** en su sitio (la decoración real se dibuja en la pared/fondo), para que se vea que quedó colocada y cuenta. La colocación es atómica: si fallas el timing, el ítem no se consume y se reintenta.
- **Minijuego del apagón (2026-11-14).** El evento del apagón ya no se resuelve mandando a un roomie con una tirada: ahora se juega **Apagón: ¿fantasma o disfraz?** (diseño de Jose), un minijuego de observación en la sala a oscuras. Aparecen 10 figuras; hay que decidir con ← 👻 FANTASMA, → 🎭 PERSONA DISFRAZADA o ↑ 😴 PERSONAJE ESPECIAL (Ximena sonámbula, Pollito con una sábana) observando las pistas: el fantasma flota, no tiene sombra y atraviesa la maceta; el disfrazado (un sprite definido bajo una sábana dibujada por código) se le ven los zapatos, tropieza y se le caen cosas. Cada acierto sube la barra **REPARACIÓN ELÉCTRICA**; los errores suben el **riesgo de despertar** a Ximena y pueden dañar la decoración. 3 fases de dificultad creciente (6 s → 5 s → 3,5 s por aparición), sin game over: el resultado (perfecta / parcial / negativa) alimenta los efectos del evento y queda guardado en `S.flags.apagon` (con `S.flags.rutaParanormal` si se confirmó algún fantasma… sin confirmar nada del todo). Está también en la lista de práctica y en `?duelo=apagon`.
- **11 minijuegos:**

| Minijuego | Jefe | Mecánica |
|---|---|---|
| Decoración Express | Pollito | Colgar con barra de timing y espantar al gato. |
| Apagón: ¿fantasma o disfraz? | Pollito (falsas alarmas) | Observación: identificar 10 apariciones en la oscuridad y reparar la luz. |
| Pollito robó el regalo | Pollito | Persecución con embestida. |
| Cactus rodantes | Pollito | Sobrevivir a bolas con púas que rebotan. |
| Salto de repisas | Pollito | Escalada infinita: gana quien suba más alto en 60 s; si fallas, caes una repisa. |
| Ojo con el pisotón | Pollito | Leer las sombras y cambiar de cojín. |
| Batalla de mensajes | José | Elegir la respuesta correcta antes que él. |
| Memoria de cajas | José | Parejas por turnos. |
| Pizza silenciosa | José | Carrera de equilibrio, tres pisos. |
| Ataque al amanecer | José | Esquivar el dron dirigido en la azotea. |
| Sonámbula | José | Luz roja / luz verde con Ximena. |

- **Acabado visual:** posproceso con desenfoque tilt-shift, bloom, viñeta y corrección de color; transiciones, interfaz con degradados y animaciones.
- Vencer a José en 3 de sus 5 duelos hace que se una a la fiesta.

## Regenerar sprites
```
python3 tools/mkdefined.py     # requiere numpy, scipy y Pillow
node tools/check_defined.js    # verifica hojas, animaciones y ojos por frame
```
`mkdefined.py` lee los bundles de `assets/new-sprites/` y regenera `js/defined-sheets.js` + `assets/sprites/defined/*.png`. Los strips nuevos generados por IA se procesan antes con `tools/keystrip.py` (clave magenta + segmentación + manifest).

## Estructura
| Archivo | Contenido |
|---|---|
| `js/defined-sheets.js` | Hojas de los sprites definidos embebidas (generado por `tools/mkdefined.py`). |
| `js/sprites.js` | Carga de hojas definidas, expresiones por frame, Pollito y objetos (pixel art por código). |
| `js/data.js` | Personajes, objetos, **eventos**, orden de la historia y finales. |
| `js/gl3d.js` | Render WebGL propio: mallas, billboards, luces y posproceso. |
| `js/world.js` | Departamento 3D, colisiones, actores animados. |
| `js/scenes.js` | Recolección, casa, los duelos (clase base `Duel`) y el minijuego del apagón (`BlackoutGame`). |
| `js/game.js` | Estado, HUD, chat, motor de eventos y flujo de actos. |

Prueba de humo sin navegador (lógica de duelos, apagón y flujos de historia sobre DOM falso): `node tools/smoke_v31.js`.
