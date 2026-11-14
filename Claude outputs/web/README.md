# 1 Minuto para la Fiesta — v2.2 (3D, duelos contra jefes)

Abre `index.html` con doble clic en un navegador de escritorio (Chrome, Edge o Firefox). No necesita servidor, instalación ni conexión; usa WebGL.

**Controles:** WASD o flechas para moverte · ESPACIO (o E) para actuar · clic en el chat para decidir (clic sobre los mensajes para acelerarlos).

- `index.html?low` — dibuja el 3D a mitad de resolución (equipos lentos).
- `index.html?duelo=decoracion` — modo práctica de un duelo. Valores: `decoracion`, `pollito`, `mensajes`, `pizza`, `sonambula`.

## Qué incluye
- **Departamento 3D** (5 ambientes) hecho de cajas con color por vértice, luces puntuales y paredes que se recortan según la cámara. Personajes pixel art como billboards con caminata de 4 pasos, rebote, inclinación, saltos, parpadeo, polvo y emotes.
- **Acto 0:** 60 s de recolección con cámara de seguimiento y minimapa.
- **Acto 2:** chat grupal con eventos por datos y **5 duelos contra jefes**:

| Duelo | Jefe | Mecánica |
|---|---|---|
| Decoración Express | Pollito | Cuelgas con barra de timing; el gato las tira y hay que espantarlo. |
| Pollito robó el regalo | Pollito | Persecución con embestida; 3 corazones, saltos y ovillos. |
| Batalla de mensajes | José | Elegir la respuesta correcta (← ↑ →) antes de que José envíe la suya. |
| Pizza silenciosa | José | Carrera de equilibrio por el pasillo del edificio. |
| Sonámbula | José | Luz roja / luz verde con Ximena dormida. |

- Vencer a José en 2 de sus 3 duelos hace que se una a la fiesta.
- **Finales:** ¡Sorpresa!, El Caos Perfecto, La Ruina.

## Estructura
| Archivo | Contenido |
|---|---|
| `js/sprites.js` | Pixel art generado por código (personajes, Pollito, objetos). |
| `js/data.js` | Personajes, objetos, **eventos**, rondas de mensajes, orden de la historia y finales. |
| `js/gl3d.js` | Render WebGL propio: mallas de cajas, billboards, sombras, luces. |
| `js/world.js` | Departamento 3D, colisiones, actores animados, iluminación. |
| `js/scenes.js` | Recolección, escena de la casa y los 5 duelos (clase base `Duel`). |
| `js/game.js` | Estado, HUD, chat, motor de eventos y flujo de actos. |
