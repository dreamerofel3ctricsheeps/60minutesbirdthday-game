# Diseño de Nivel y Mapa: "1 minuto para la fiesta"

Este documento define la estructura, proporciones y zonificación del mapa para la "Fase de 60 Segundos", basándose en el *grayboxing* inicial y adaptado para un entorno de juego web (navegador).

## 1. Consideraciones Técnicas (Juego Web)

* **Viewport (Cámara):** El juego se renderizará en formato panorámico 16:9. La cámara tendrá una vista *Top-Down* (cenital o isométrica) que seguirá al jugador.
* **Sistema de Cuadrícula (Grid):** Para facilitar el diseño y la programación web (ya sea en Phaser, Unity WebGL o Godot), el mapa se dividirá en una cuadrícula de *Tiles* (baldosas). 
  * *Equivalencia:* 1 Bloque de tu diseño en Minecraft = 1 *Tile* (ej. 64x64 píxeles).
* **Movimiento y Colisiones:** Al jugarse en teclado, las físicas web pueden ser menos precisas que un joystick analógico. Por ello, las zonas transitables deben ser indulgentes.

## 2. Proporciones y Escala Corregida

Para que el reto de 60 segundos sea justo, las distancias deben calcularse en función de la velocidad del personaje.

* **Ancho de Pasillos (Mejora Crítica):** Todo pasaje principal (como el pasillo central de "Departamento Ximena") debe tener un **mínimo de 3 a 4 tiles de ancho**. Las puertas deben tener al menos 2 tiles de ancho libre. Esto elimina la frustración de quedarse atascado en el marco de una puerta al huir con el tiempo en contra.
* **Tiempo de Recorrido:** La velocidad del personaje base debe calibrarse para que cruzar desde el "Ascensor" hasta el "Baño de Habitación" (el punto más lejano) tome **10 a 12 segundos** en línea recta y sin obstáculos. Un viaje de ida y vuelta sumará 24 segundos, consumiendo casi la mitad del tiempo total.

## 3. Zonificación y Distribución de Ítems

El mapa se divide en zonas estratégicas de riesgo/recompensa.

### Zona 0: El Resguardo (Ascensor)
* **Ubicación:** Esquina inferior izquierda.
* **Descripción:** Es la base del jugador. Cuenta con una "Drop Zone" (Zona de Entrega) visiblemente marcada. Aquí el jugador arrojará los ítems recolectados. No hay obstáculos aquí.

### Zona 1: Área de Saqueo Rápido (Cocina, Baño Principal, Sala)
* **Ubicación:** Cuadrante superior izquierdo e izquierdo central.
* **Descripción:** Las habitaciones más cercanas a la base. Ideales para asegurar la supervivencia básica en los últimos 15 segundos.
* **Ítems sugeridos:** Cajas de Fast Food (Cocina), Botiquín y Cinta Adhesiva (Baño Principal).
* **Mejora estructural:** La "Sala" actúa como un conector principal. Se reducirá el tamaño del mueble central del *grayboxing* para permitir rutas de escape circulares.

### Zona 2: Área de Riesgo y Alta Recompensa (Comedor, Habitación, Baño de Habitación)
* **Ubicación:** Cuadrante superior derecho.
* **Descripción:** Toma mucho tiempo llegar y salir de aquí. Las habitaciones tienen forma de "L", lo que significa que el jugador no puede ver qué hay al fondo hasta que entra por completo.
* **Ítems sugeridos:** Torta de Cumpleaños, TV Analógica, El Regalo Principal.

### Zona 3: Zonas de Peligro / Sigilo (Departamento del Vecino y Librería)
* **Ubicación:** Cuadrante inferior derecho.
* **Descripción:** Una zona independiente a la que se accede por el pasillo inferior. 
* **Mecánica Especial (Riesgo Web):** Entrar al departamento del vecino puede ofrecer ítems valiosos (ej. Paquetes de AliExpress robados, Chatarra Electrónica), pero hacer un movimiento brusco (correr contra los muebles) aumenta el "Medidor de Ruido", lo que podría restar segundos al tiempo total o iniciar la fase de gestión con una penalización vecinal.

## 4. Resumen de Mejoras Estructurales aplicadas al Grayboxing

1. **Apertura de Cuellos de Botella:** Las conexiones entre la Sala, el Comillo Central y el Comedor han sido ensanchadas.
2. **Flujo de Navegación:** Se sugiere añadir una puerta interna que conecte el "Baño Principal" directamente con la "Cocina" para crear un micro-anillo de movimiento y evitar que el jugador tenga que dar la vuelta entera si se equivoca.
3. **Optimización de Interfaz Web:** Al usar un mapa extenso, se añadirá una pequeña brújula o indicador en los bordes de la pantalla (UI) que apunte hacia el "Ascensor" para que el jugador nunca pierda la orientación cuando esté en el extremo opuesto del mapa.