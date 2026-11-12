# Definición de Ítems y Recursos: "1 minuto para la fiesta"

Este documento detalla los objetos que los jugadores podrán recolectar durante los primeros 60 segundos del juego. Estos ítems se utilizarán en la Fase de Gestión para sobrevivir, reducir la sospecha de Ximena o desbloquear los finales atípicos.

## 1. Variables Base de los Ítems (Para Programación)

Cada ítem en el juego debe contar con las siguientes variables en su estructura de código (Clase o ScriptableObject):

*   **Categoría:** Tipo de objeto (Consumible, Herramienta, Fiesta, Defensa, Clave).
*   **Peso / Espacio:** Cuántos "huecos" del inventario (o manos) ocupa al recogerse en la fase 3D/2D inicial. Define qué tan difícil es llevarlo al refugio.
*   **Usos:** Cuántas veces se puede emplear antes de desaparecer del inventario (∞ = uso infinito siempre que se cumplan condiciones).
*   **Efecto / Función:** Consecuencia directa al utilizarlo en un evento diario o de cadena.

---

## 2. Ítems Principales (Lanzamiento Base)

Estos 13 objetos son fundamentales para la jugabilidad principal, la gestión de amenazas y las ramas narrativas principales del juego.

| Ítem | Categoría | Peso | Usos | Efecto / Función |
| :--- | :--- | :--- | :--- | :--- |
| **Torta de Cumpleaños** | Fiesta | 3 | 1 | Requisito de victoria estándar. También es ofrenda obligatoria para el espectro director en el final de *La Nahuala*. |
| **Smartphone (Yape/Plin)** | Herramienta | 1 | ∞ | Resuelve emergencias de pagos y sobornos rápidos. Requiere que haya electricidad en el departamento. |
| **Caja de Fast Food** | Consumible | 2 | 4 | Aporta raciones de comida inmediatas; evita que el grupo muera de inanición o pierda moral por hambre. |
| **Pack de Cervezas** | Consumible | 2 | 6 | Sirve de hidratación y da éxito automático a un chequeo de Carisma. Aumenta ligeramente el ruido. |
| **Cinta Adhesiva** | Herramienta | 1 | 3 | Repara averías rápidas, sella tuberías o silencia objetos ruidosos (ayuda en chequeos de Lógica y Sigilo). |
| **Botiquín Básico** | Herramienta | 2 | 2 | Cura estados alterados severos (como depresión o lesiones físicas) de los roomies, devolviéndoles su turno. |
| **Paquete de AliExpress** | Clave | 2 | 1 | Contiene decoración general, pero puede albergar la "Máscara" que inicia el evento de los *Hermanos Calavera*. |
| **Caja de Herramientas** | Herramienta | 2 | 4 | Soluciona cortocircuitos severos y fallas mecánicas. Aprovechado al máximo por Alan o Majo. |
| **El Regalo Principal** | Fiesta | 2 | 1 | Objeto defensivo pasivo. Si está en el inventario, reduce la sospecha final de Ximena a la mitad. |
| **TV Analógica** | Clave | 2 | 1 | Captura de madrugada el *Canal 94*, detonando la cadena de eventos del exoplaneta WASP-103b. |
| **Bolsas de Basura** | Defensa | 1 | 5 | Cruciales para limpiar desastres (como los de Fátima). Cancela eventos de plagas y quejas vecinales por olor. |
| **Guion Polvoriento** | Clave | 1 | 1 | Objeto narrativo. Al leerlo, detona inmediatamente la cadena de eventos atípicos de *"La Nahuala contraataca"*. |
| **Candado de Seguridad** | Defensa | 1 | 1 | Sella la puerta del departamento, retrasando a Ximena o a la policía exactamente un turno completo. |

---

## 3. Backlog de Ítems (Para futuras actualizaciones o balanceo)

Estos objetos están conceptualizados pero se mantendrán en reserva. Pueden integrarse si la recolección en los 60 segundos se siente escasa o si se necesita bajar la dificultad.

| Ítem | Categoría | Peso | Usos | Efecto / Función |
| :--- | :--- | :--- | :--- | :--- |
| **Ambientador en Spray** | Defensa | 1 | 3 | Reduce 15% la Sospecha durante visitas relámpago de Ximena. |
| **Consola Retro/Arcade** | Distracción | 2 | ∞ | Mantiene la moral alta (ideal para calmar a Natalia), pero gasta mucha energía eléctrica. |
| **Linterna a Batería** | Herramienta | 1 | ∞ | Permite a los roomies realizar acciones de gestión sin penalidad durante los apagones. |
| **Parlante Bluetooth** | Fiesta | 2 | 1 | Aumenta drásticamente la moral, pero genera constantes eventos de quejas por ruido. |
| **Mancuernas Metálicas** | Defensa | 2 | 1 | Pueden bloquear puertas físicamente o usarse para entrenar de cara al evento del Ring de Lucha Libre. |
| **Chatarra Electrónica** | Clave | 2 | 1 | Material base que reemplazaría las raciones de comida para construir la antena interdimensional. |
| **Libreta de Apuntes** | Herramienta | 1 | 1 | Otorga éxito automático en un evento que requiera un chequeo muy alto del atributo "Lógica". |