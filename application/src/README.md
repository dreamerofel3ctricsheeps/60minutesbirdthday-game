# 1 Minuto para la Fiesta — v3

Abre `index.html` con doble clic en un navegador de escritorio (Chrome, Edge o Firefox). No necesita servidor, instalación ni conexión; usa WebGL.

**Controles:** WASD o flechas para moverte · ESPACIO (o E) para actuar · clic en el chat para decidir (clic sobre los mensajes para acelerarlos).

**Pausa:** botón **⏸ Pausa** en el HUD, tecla **ESC** (siempre) o tecla **P** (solo fuera de los duelos y la recolección, donde las teclas son del juego). La pausa congela TODO el juego — bucle principal, temporizadores de escenas y duelos, animaciones y la cuenta de recolección — porque el tiempo corre centralizado en `frame()` (game.js); al reanudar se continúa exactamente donde estaba, sin saltos. El menú de pausa permite seguir jugando, abrir la lista de minijuegos o salir al título.

**Minijuegos (práctica directa):** botón **🧩 MINIJUEGOS** en la pantalla de título y en el menú de pausa. Lista los 10 duelos (nombre, jefe y descripción) y los lanza en modo práctica pura: misma escena de duelo que en la historia, pero sin premios, castigos ni efectos sobre ninguna partida. Al terminar un duelo: **Otra vez**, **Lista de minijuegos** o **Salir** (al título). Ojo: si lanzas una práctica a mitad de una partida, la partida se abandona (al terminar vas a la lista o al título, no de vuelta a la run); mirar la lista sin lanzar nada no abandona nada.

- `index.html?duelo=pizza` — modo práctica de un duelo (atajo por URL, se mantiene): `decoracion`, `pollito`, `mensajes`, `pizza`, `sonambula`, `memoria`, `cactus`, `repisas`, `pisoton`, `azotea`.
- `index.html?low` — 3D a mitad de resolución · `index.html?nofx` — sin posproceso (equipos lentos).

## Qué hay en la v3
- **Sprites definidos (v3.1+).** Los personajes usan los bundles definidos de `assets/new-sprites/` (idle con personalidad, caminatas y carreras reales por dirección, acción; Jose con sneak/celebrate y Pollito es el gato calicó real). `tools/mkdefined.py` los normaliza a celdas uniformes, les hornea el borde blanco Paper Mario y detecta los ojos por frame para pintar expresiones sobre el frame actual. El resultado queda en `assets/sprites/defined/*.png` y embebido en `js/defined-sheets.js`. (El pipeline anterior desde la pose en T, `tools/mksprites.py`, queda como herramienta histórica: el juego ya no lo usa.)
- **Duelos por rondas.** Cada minijuego es al mejor de 3 rondas contra un jefe (Batalla de mensajes: primero en ganar 3 de 5).
- **Caminata lateral corregida (2026-11-14).** Los strips `walk_right` originales traían [contacto, pase, contacto repetido] (medido: la diferencia de piernas entre el frame 3 y el 1 era 0.06–0.30; en Majo los 3 frames eran casi idénticos, 0.06–0.09), así que los personajes "movían una pierna" y patinaban. Se regeneraron los `walk_right` de Natalia, Saulo, Itzel, Fátima, Majo y Alan con contactos opuestos explícitos (diferencias tras el arreglo: 0.48–0.94 en las tres transiciones; alfa semitransparente < 0.55%), y la cadencia en `world.js` quedó: `step` avanza 0.16 por unidad, beat de π/2 ≈ 9.8 u por frame, ciclos de 3 frames en ping-pong (0,1,2,1) — ciclo completo ≈ 39.3 u ≈ dos zancadas, en fase con el balanceo y el puff de pisada. Los ciclos de 4 frames (`walk_down`, carreras) van en loop directo.
- **10 duelos:**

| Duelo | Jefe | Mecánica |
|---|---|---|
| Decoración Express | Pollito | Colgar con barra de timing y espantar al gato. |
| Pollito robó el regalo | Pollito | Persecución con embestida. |
| Cactus rodantes | Pollito | Sobrevivir a bolas con púas que rebotan. |
| Salto de repisas | Pollito | Carrera vertical: ← o → según la siguiente repisa. |
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
| `js/scenes.js` | Recolección, casa y los 10 duelos (clase base `Duel`). |
| `js/game.js` | Estado, HUD, chat, motor de eventos y flujo de actos. |
