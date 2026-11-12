# Roadmap de Desarrollo: Juego de Navegador Estilo "60 Segundos" llamado "1 minuto para la fiesta"

Este documento detalla el ciclo de vida del desarrollo del juego, dividido en fases y tareas accionables.

## Fase 1: Conceptualización y Arquitectura (Semanas 1-2)
**Objetivo:** Definir las reglas del juego, la estética y preparar el entorno de desarrollo.

- [x] **Documento de Diseño (GDD):**
  - [x] Definir la temática: 
  El juego debe ser la preparacion de una fiesta sorpresa, en donde se tenga que alistar todo lo necesario para sorprender a la cumpleañera para este objetivo. La mecanica es superar una serie de problemas que pueden detener la fiesta sorpresa y evitar que la cumpleañera se entere de la fiesta sorporesa.
  Se pierde, porque la cumpleañera se entera de la fiesta o algun evento lleva a la cancelacion.
  Se gana, porque la fiesta sorpresa se da y se sorprende a la cumpleañera.
  Y se puede ganar si es que se llega a un "evento atipico": como finales de la historia del juego super alucinantes.
  - [x] Listar los personajes jugables y sus características (ventajas/desventajas).
  Inicialmente estoy definiando esta lista de personajes y los agrupo en dos.
  ROOMIES
  1.Natalia: 
     Cosas buenas: futbol, videjuegos
                 Malas: terca, impaciente
  2.Saulo: 
     Cosas buenas: cantar, dibujar
                 Malas: miagajero(se deja llevar mucho por sus novias), llorón	
  3.Itzel: 
     Cosas buenas: comprensiva, 
                 Malas: muy infantil, celosa
  4.Fatima: 
     Cosas buenas: 
                 Malas: 
  5.Samantha: 
     Cosas buenas: 
                 Malas: 
  6.Majo: 
     Cosas buenas: 
                 Malas: 
  7.Alan: 
     Cosas buenas: 
                 Malas: 
CUMPLEAÑERA
  Ximena

  - [x] Crear el inventario base: lista de objetos, pesos y utilidad en el refugio.
- [x] **Diseño de Niveles:**
  - [x] Dibujar el *layout* (plano) básico de la casa para la fase de recolección.
  - [x] Definir la ubicación del búnker/zona segura.
- [x] **Setup Técnico:**
  - [x] Elegir el motor o framework (Ej: Vanilla JS + Canvas, o Phaser.js).
  - [ ] Inicializar el repositorio (Git) y la estructura de carpetas del proyecto.
  - [ ] Configurar un servidor local de desarrollo (Ej: Vite, Webpack o Live Server).

## Fase 2: Prototipo Core - Mecánicas Base (Semanas 3-4)
**Objetivo:** Lograr un bucle de juego funcional usando gráficos provisionales (cajas/círculos).

- [ ] **Fase 1 - Los 60 Segundos (Recolección):**
  - [ ] Implementar el temporizador de cuenta regresiva (60s).
  - [ ] Crear el jugador y el sistema de movimiento (top-down, colisiones con paredes).
  - [ ] Programar la lógica para recoger/soltar objetos.
  - [ ] Implementar la zona segura: detectar qué objetos y personajes están dentro al acabar el tiempo.
- [ ] **Fase 2 - El Refugio (Supervivencia):**
  - [ ] Crear la pantalla de transición (Resumen de lo recolectado).
  - [ ] Construir la interfaz básica del "Diario de Supervivencia".
  - [ ] Programar el bucle de "Avanzar Día".
  - [ ] Implementar el consumo básico de recursos (restar comida/agua por personaje vivo).

## Fase 3: Sistemas Avanzados y Narrativa (Semanas 5-7)
**Objetivo:** Darle profundidad al juego con eventos impredecibles, estados de salud y expediciones.

- [ ] **Motor de Eventos Aleatorios:**
  - [ ] Crear una estructura de datos (JSON) para almacenar los eventos diarios.
  - [ ] Programar el sistema de probabilidades (RNG) para disparar eventos.
  - [ ] Añadir toma de decisiones (Botones: Sí, No, Usar Objeto).
- [ ] **Sistema de Expediciones:**
  - [ ] Lógica para enviar a un personaje fuera del refugio.
  - [ ] Calcular el riesgo/recompensa y los días de ausencia.
  - [ ] Programar el retorno del personaje (con botín, herido, o confirmación de muerte).
- [ ] **Estados y Consecuencias:**
  - [ ] Programar estados de los personajes: Saludable, Hambriento, Sediento, Enfermo, Loco.
  - [ ] Implementar las condiciones de Game Over (todos mueren) y Victoria (rescate).

## Fase 4: Integración de Arte, UI y Audio (Semanas 8-9)
**Objetivo:** Reemplazar los elementos provisionales y darle la identidad visual y sonora final al juego.

- [ ] **Interfaz de Usuario (UI):**
  - [ ] Diseñar el menú principal y la pantalla de Game Over.
  - [ ] Estilizar el Diario de Supervivencia (tipografía, colores, botones inmersivos).
  - [ ] Añadir feedback visual (pantalla parpadea en rojo si hay peligro, iconos de estado).
- [ ] **Integración Gráfica (Sprites):**
  - [ ] Sustituir los placeholders por los *sprites* finales del jugador y objetos.
  - [ ] Integrar el mapa final (tileset o imagen de fondo) de la casa.
  - [ ] Dibujar y añadir el fondo dinámico del búnker (cambia según los objetos y estado de los personajes).
- [ ] **Diseño Sonoro:**
  - [ ] Añadir música de tensión para la cuenta regresiva.
  - [ ] Añadir música ambiental para los días en el refugio.
  - [ ] Integrar Efectos de Sonido (SFX): pasos, agarrar objetos, clics de UI, alarmas.

## Fase 5: Balanceo, Pruebas y Pulido (Semanas 10-11)
**Objetivo:** Asegurar que el juego sea divertido, justo y no tenga errores bloqueantes.

- [ ] **Ajuste de Dificultad:**
  - [ ] Modificar la velocidad del personaje y el tiempo límite si es necesario.
  - [ ] Ajustar la tasa de consumo de comida/agua.
  - [ ] Balancear las probabilidades de éxito/fracaso en los eventos y expediciones.
- [ ] **Control de Calidad (QA):**
  - [ ] Probar el juego buscando *edge cases* (Ej: qué pasa si no recoges a nadie).
  - [ ] Solucionar bugs de lógica o superposición de UI.
  - [ ] Optimizar el rendimiento en Canvas para navegadores de bajos recursos.

## Fase 6: Lanzamiento (Semana 12)
**Objetivo:** Publicar el juego y hacerlo accesible para los jugadores.

- [ ] **Preparación para Producción:**
  - [ ] Minificar archivos JavaScript y CSS.
  - [ ] Comprimir imágenes y audios para reducir el peso final del juego web.
  - [ ] Añadir metadatos (título, favicon, descripción).
- [ ] **Despliegue (Deployment):**
  - [ ] Subir a un hosting web o plataformas indie (Itch.io, GitHub Pages, Vercel).
  - [ ] Pruebas finales en el entorno de producción.
- [ ] **Post-Lanzamiento:**
  - [ ] Recopilar feedback de los primeros jugadores.
  - [ ] Preparar el primer parche de balanceo o corrección de bugs si es necesario.