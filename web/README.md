# 1 Minuto para la Fiesta — vertical slice (navegador, single player)

Abre `index.html` con doble clic en cualquier navegador de escritorio. No necesita servidor, instalación ni conexión.

**Controles:** WASD o flechas para moverte · ESPACIO (o E) para actuar · clic en el chat para decidir (clic sobre los mensajes para acelerarlos).

## Qué incluye (GDD §29)
- **Acto 0:** 60 s de recolección en 3 habitaciones, 10 objetos, 2 espacios de carga y armario para guardar. Pollito cambia objetos de lugar.
- **Acto 1:** llegada de Ximena; lo que quedó en tus manos sube la sospecha.
- **Acto 2:** chat grupal con eventos por datos: Las cajas, Interrogatorio de WhatsApp, Apagón, José escribe, No hay pastel, más reactivos (La vuelta, El sexto sentido, El regalo no sobrevivió).
- **Minijuegos:** Decoración Express, Esconde Todo (El vaso de agua), Pollito robó el regalo.
- **Sistemas:** Inventario, Sospecha, Sueño, Ruido, Calidad de la fiesta, progreso visual de la sala.
- **Finales:** ¡Sorpresa!, El Caos Perfecto, La Ruina.
- **Jugables:** Natalia, Itzel, Alan. El resto de roomies y José aparecen en el chat.

## Estructura
| Archivo | Contenido |
|---|---|
| `js/sprites.js` | Pixel art generado por código (frames 64×64, borde blanco): 9 personajes en 3 vistas + caminata + expresiones, Pollito y objetos. Para ajustar un diseño, edita `LOOKS` y `outfit()`. |
| `js/data.js` | Personajes, objetos, **eventos**, orden de la historia y finales. Agregar un evento = agregar una entrada aquí. |
| `js/world.js` | Mapa del departamento, muebles, colisiones, actores y dibujo. |
| `js/scenes.js` | Recolección, escena de la casa y los 3 minijuegos. |
| `js/game.js` | Estado, HUD, chat, motor de eventos y flujo de actos. |
