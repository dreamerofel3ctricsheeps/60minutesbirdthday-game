# 1 Minuto para la Fiesta — v3

Abre `index.html` con doble clic en un navegador de escritorio (Chrome, Edge o Firefox). No necesita servidor, instalación ni conexión; usa WebGL.

**Controles:** WASD o flechas para moverte · ESPACIO (o E) para actuar · clic en el chat para decidir (clic sobre los mensajes para acelerarlos).

- `index.html?duelo=pizza` — modo práctica de un duelo: `decoracion`, `pollito`, `mensajes`, `pizza`, `sonambula`, `memoria`, `cactus`, `repisas`, `pisoton`, `azotea`.
- `index.html?low` — 3D a mitad de resolución · `index.html?nofx` — sin posproceso (equipos lentos).

## Qué hay en la v3
- **Sprites desde los borradores.** `tools/mksprites.py` recorta cada personaje de `assets/drafts/v1.2`, baja los brazos de la pose en T, genera caminata, pose de acción y vista de espalda, y detecta los ojos para pintar expresiones. El resultado queda en `web/assets/sprites/*.png` y embebido en `web/js/sheets.js`.
- **Duelos por rondas.** Cada minijuego es al mejor de 3 rondas contra un jefe (Batalla de mensajes: primero en ganar 3 de 5).
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
python3 tools/mksprites.py web/assets/sprites   # requiere numpy, scipy y Pillow
mv web/assets/sprites/sheets.js web/js/sheets.js
```
Ajustes por personaje en el diccionario `CFG` de `tools/mksprites.py`.

## Estructura
| Archivo | Contenido |
|---|---|
| `js/sheets.js` | Hojas de sprites embebidas (generado). |
| `js/sprites.js` | Carga de hojas, expresiones, Pollito y objetos (pixel art por código). |
| `js/data.js` | Personajes, objetos, **eventos**, orden de la historia y finales. |
| `js/gl3d.js` | Render WebGL propio: mallas, billboards, luces y posproceso. |
| `js/world.js` | Departamento 3D, colisiones, actores animados. |
| `js/scenes.js` | Recolección, casa y los 10 duelos (clase base `Duel`). |
| `js/game.js` | Estado, HUD, chat, motor de eventos y flujo de actos. |
