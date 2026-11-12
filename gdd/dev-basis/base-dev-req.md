
# MARCO MAESTRO DE DESARROLLO Y ARQUITECTURA
## Proyecto: "1 Minuto para la Fiesta"

**Versión:** 2.0  
**Estado:** Documento Rector del Proyecto  
**Tecnología objetivo:** Web / Desktop Web  
**Arquitectura:** React + TypeScript + React Three Fiber + Zustand  
**Principio fundamental:** El juego debe ser extensible mediante datos y configuraciones, no mediante lógica hardcodeada.

---

# 1. VISIÓN GENERAL DEL PROYECTO

## 1.1 Concepto

**"1 Minuto para la Fiesta"** es un juego de supervivencia, gestión de recursos y narrativa ramificada estructurado en dos fases principales:

### FASE A — RECOLECCIÓN
El jugador dispone de **60 segundos en tiempo real** para recorrer un departamento, encontrar objetos y recolectar recursos estratégicos.

### FASE B — GESTIÓN Y SUPERVIVENCIA
Una vez terminados los 60 segundos, comienza una fase basada en:

- Gestión de inventario.
- Asignación de personajes.
- Administración de acciones.
- Resolución de eventos.
- Control de recursos.
- Gestión de sospecha.
- Decisiones narrativas.
- Supervivencia hasta la celebración final.

El resultado de la partida depende directamente de:

> **Qué objetos fueron recolectados + qué decisiones se tomaron + qué personajes permanecieron disponibles + qué cadenas narrativas fueron activadas.**

---

# 2. PILARES DE DISEÑO

Todo desarrollo futuro debe respetar estos cinco pilares.

## 2.1 Presión temporal

La primera fase debe generar:

- Urgencia.
- Priorización.
- Decisiones imperfectas.
- Rutas repetibles.
- Riesgo versus recompensa.

El jugador nunca debería poder recoger todo cómodamente.

---

## 2.2 Información imperfecta

El jugador no debe conocer necesariamente todas las consecuencias futuras.

Un objeto aparentemente poco importante puede desbloquear:

- Un evento.
- Una solución alternativa.
- Una cadena narrativa.
- Un final especial.

---

## 2.3 Rejugabilidad sistémica

Cada partida debe poder variar mediante:

- Spawn de ítems.
- Eventos diarios.
- Personajes disponibles.
- Estados iniciales.
- Ramas narrativas.
- Recursos obtenidos.

La rejugabilidad no debe depender únicamente de cambiar textos.

---

## 2.4 Decisiones con coste

Toda acción importante debe consumir al menos uno de estos recursos:

- Tiempo.
- Acción.
- Ítem.
- Uso de ítem.
- Moral.
- Sospecha.
- Disponibilidad de un personaje.

Evitar decisiones completamente gratuitas.

---

## 2.5 Narrativa emergente

La historia debe surgir de los sistemas.

Ejemplo:

> Apagón → smartphone inutilizable → no se puede resolver un pago → aumenta sospecha → se pierde una acción → no se completa una cadena narrativa.

Los sistemas deben poder afectar otros sistemas.

---

# 3. GAME LOOP PRINCIPAL

```text
MENÚ PRINCIPAL
      ↓
NUEVA PARTIDA
      ↓
CONFIGURACIÓN DE RUN
      ↓
FASE 1: RECOLECCIÓN — 60 SEGUNDOS
      ↓
CÁLCULO DEL INVENTARIO OBTENIDO
      ↓
TRANSICIÓN
      ↓
FASE 2: GESTIÓN POR DÍAS/TURNOS
      ↓
EVENTOS + DECISIONES + ACCIONES
      ↓
¿CONDICIÓN DE FINAL?
      ├── NO → SIGUIENTE DÍA
      │
      └── SÍ
           ↓
      RESOLUCIÓN DEL FINAL
           ↓
      ESTADÍSTICAS DE LA PARTIDA
           ↓
      NUEVA PARTIDA / MENÚ
```

---

# 4. STACK TECNOLÓGICO OFICIAL

## 4.1 Base

- **Vite**
- **React**
- **TypeScript**

### Responsabilidades

React debe gestionar:

- Pantallas.
- Menús.
- HUD.
- Eventos.
- Inventarios.
- Diálogos.
- Transiciones.
- Estado visual.

---

## 4.2 Renderizado 3D

- **Three.js**
- **React Three Fiber**
- **@react-three/drei**

Se utilizarán para:

- Departamento.
- Habitaciones.
- Pasillos.
- Paredes.
- Iluminación.
- Cámara.
- Elementos decorativos 3D simples.

El escenario debe continuar siendo principalmente **generado mediante código**, evitando depender de modelos `.glb` para la arquitectura principal.

---

## 4.3 Física

### Recomendación

Usar:

```text
@react-three/rapier
```

Únicamente para:

- Colisiones.
- Obstáculos.
- Límites del mapa.
- Movimiento físico cuando realmente aporte valor.

### Regla importante

**No utilizar física para resolver todo.**

Para objetos recolectables simples:

```text
Distancia jugador ↔ objeto
```

puede ser suficiente.

La física debe reservarse para problemas que realmente necesiten simulación.

---

## 4.4 Estado global

### Librería

```text
Zustand
```

El estado global no debe ser un único archivo gigantesco.

Debe dividirse por dominio:

```text
gameStore
inventoryStore
runStore
eventStore
settingsStore
```

---

## 4.5 UI

### Tailwind CSS

Utilizar para:

- HUD.
- Menús.
- Paneles.
- Inventario.
- Eventos.
- Tooltips.
- Pantallas de resultados.

---

# 5. ARQUITECTURA GENERAL

El proyecto debe separarse en cinco capas conceptuales:

```text
PRESENTATION
    ↓
APPLICATION / GAME FLOW
    ↓
DOMAIN / GAME RULES
    ↓
DATA / CONTENT
    ↓
INFRASTRUCTURE
```

---

## 5.1 Presentation

Responsable de mostrar información.

No debe contener reglas complejas del juego.

Ejemplos:

```text
HUD
InventoryPanel
EventModal
CharacterCard
MainMenu
ResultScreen
```

---

## 5.2 Application

Coordina el flujo del juego.

Ejemplos:

```text
startRun()
startCollectionPhase()
finishCollectionPhase()
startManagementPhase()
advanceDay()
resolveEvent()
finishRun()
```

---

## 5.3 Domain

Contiene las reglas reales.

Ejemplos:

```text
¿Puede el jugador recoger este objeto?
¿Hay espacio suficiente?
¿Puede este personaje realizar esta acción?
¿Este evento puede aparecer?
¿Esta decisión cumple las condiciones?
¿Se ha desbloqueado un final?
```

---

## 5.4 Data

Contiene contenido declarativo:

```text
items
characters
events
endings
maps
sprite metadata
dialogues
balance configuration
```

---

## 5.5 Infrastructure

Encargada de servicios técnicos:

```text
audio
save/load
random number generation
asset loading
localStorage
analytics future
```

---

# 6. ESTRUCTURA OFICIAL DEL PROYECTO

```text
src/
│
├── app/
│   ├── App.tsx
│   ├── routes.ts
│   └── providers.tsx
│
├── assets/
│   ├── sprites/
│   │   ├── characters/
│   │   ├── items/
│   │   ├── effects/
│   │   └── ui/
│   │
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   │
│   └── fonts/
│
├── components/
│   ├── ui/
│   ├── common/
│   └── layout/
│
├── features/
│   │
│   ├── collection/
│   │   ├── components/
│   │   ├── systems/
│   │   ├── hooks/
│   │   └── collection.types.ts
│   │
│   ├── management/
│   │   ├── components/
│   │   ├── actions/
│   │   ├── systems/
│   │   └── management.types.ts
│   │
│   ├── inventory/
│   │   ├── components/
│   │   ├── inventory.logic.ts
│   │   └── inventory.types.ts
│   │
│   ├── events/
│   │   ├── components/
│   │   ├── eventEngine.ts
│   │   └── eventResolver.ts
│   │
│   └── endings/
│       ├── endingEngine.ts
│       └── endingResolver.ts
│
├── game/
│   ├── core/
│   │   ├── GameManager.ts
│   │   ├── GamePhase.ts
│   │   └── RunManager.ts
│   │
│   ├── domain/
│   │   ├── items/
│   │   ├── characters/
│   │   ├── events/
│   │   ├── resources/
│   │   └── endings/
│   │
│   └── systems/
│       ├── timerSystem.ts
│       ├── inventorySystem.ts
│       ├── eventSystem.ts
│       ├── suspicionSystem.ts
│       ├── moraleSystem.ts
│       └── endingSystem.ts
│
├── scenes/
│   ├── collection/
│   │   ├── CollectionScene.tsx
│   │   ├── Player.tsx
│   │   ├── Collectible.tsx
│   │   └── CameraController.tsx
│   │
│   └── environment/
│       ├── Apartment.tsx
│       ├── Room.tsx
│       ├── Walls.tsx
│       └── Lighting.tsx
│
├── data/
│   ├── items/
│   │   └── items.data.ts
│   │
│   ├── characters/
│   │   └── characters.data.ts
│   │
│   ├── events/
│   │   ├── threats.data.ts
│   │   ├── dailyEvents.data.ts
│   │   └── chains.data.ts
│   │
│   ├── endings/
│   │   └── endings.data.ts
│   │
│   └── maps/
│       └── apartment.data.ts
│
├── stores/
│   ├── game.store.ts
│   ├── run.store.ts
│   ├── inventory.store.ts
│   ├── event.store.ts
│   └── settings.store.ts
│
├── services/
│   ├── save.service.ts
│   ├── audio.service.ts
│   └── random.service.ts
│
├── hooks/
│
├── types/
│
├── utils/
│
└── tests/
```

---

# 7. SISTEMA DE FASES

Nunca utilizar múltiples booleanos como:

```typescript
isCollecting
isManaging
isGameOver
isPaused
```

Esto puede provocar estados inválidos.

Utilizar una máquina de estados:

```typescript
type GamePhase =
  | "MENU"
  | "PREPARATION"
  | "COLLECTION"
  | "COLLECTION_RESULT"
  | "MANAGEMENT"
  | "EVENT"
  | "ENDING"
  | "RESULTS";
```

Regla:

> Solo puede existir una fase principal activa.

---

# 8. MODELO DE UNA PARTIDA

Cada partida debe tener un objeto independiente:

```typescript
interface GameRun {
  id: string;
  seed: number;

  phase: GamePhase;

  day: number;

  collection: {
    remainingTime: number;
    collectedItems: string[];
  };

  resources: {
    food: number;
    water: number;
    energy: number;
  };

  meters: {
    suspicion: number;
    morale: number;
    noise: number;
  };

  inventory: string[];

  characters: CharacterRunState[];

  activeChains: ActiveChain[];

  completedEvents: string[];

  ending?: string;
}
```

---

# 9. SISTEMA DE DATOS DE ÍTEMS

El documento actual define correctamente categoría, peso, usos y efecto.

La estructura debe evolucionar hacia un modelo declarativo:

```typescript
interface ItemDefinition {
  id: string;

  name: string;

  category: ItemCategory;

  inventorySlots: number;

  maxUses: number | "infinite";

  description: string;

  tags: string[];

  effects: ItemEffect[];

  requirements?: Requirement[];

  sprite: SpriteReference;

  spawn: SpawnConfig;

  rarity: ItemRarity;
}
```

---

## 9.1 Nunca programar efectos directamente dentro del componente visual

Incorrecto:

```typescript
if (item.name === "Candado") {
  suspicion -= 40;
}
```

Correcto:

```typescript
effects: [
  {
    type: "DELAY_THREAT",
    turns: 1
  }
]
```

El motor interpreta el efecto.

---

# 10. SISTEMA DE INVENTARIO

El sistema debe soportar dos conceptos separados:

## 10.1 Capacidad física

Durante los 60 segundos:

- Peso.
- Espacio.
- Número máximo de objetos transportables.

## 10.2 Inventario estratégico

Después de la fase de recolección:

- Objetos disponibles.
- Usos restantes.
- Objetos equipados.
- Objetos consumidos.
- Objetos clave.

No todos los objetos deberían comportarse igual.

---

## 10.3 Regla de inventario

Cada objeto debe existir como:

### Definición

```text
ItemDefinition
```

Información permanente.

### Instancia

```text
ItemInstance
```

Información de esa partida.

Ejemplo:

```typescript
interface ItemInstance {
  instanceId: string;
  itemId: string;
  usesRemaining: number;
}
```

Esto evita modificar accidentalmente la definición global del objeto.

---

# 11. SISTEMA DE PERSONAJES

Cada personaje debe tener:

```typescript
interface CharacterDefinition {
  id: string;

  name: string;

  attributes: {
    logic: number;
    charisma: number;
    speed: number;
    stealth: number;
  };

  passiveAbility?: Ability;

  tags: string[];

  spriteSet: string;
}
```

Y durante una partida:

```typescript
interface CharacterRunState {
  characterId: string;

  available: boolean;

  busyUntilDay?: number;

  morale: number;

  conditions: string[];

  temporaryEffects: TemporaryEffect[];
}
```

---

# 12. ATRIBUTOS Y CHEQUEOS

Los atributos principales ya están implícitos en los eventos actuales:

- Lógica.
- Carisma.
- Velocidad.
- Sigilo.

Estos deben convertirse en un sistema formal.

Ejemplo:

```typescript
interface SkillCheck {
  attribute: AttributeType;

  difficulty: number;

  modifiers?: Modifier[];
}
```

Resultado:

```text
ÉXITO
ÉXITO PARCIAL
FALLO
FALLO CRÍTICO
```

Esto permite resultados más interesantes que un simple:

```text
Éxito / Fallo
```

---

# 13. MOTOR DE EVENTOS

Los eventos deben ser completamente data-driven.

Los documentos actuales separan correctamente:

- Eventos de amenaza.
- Eventos diarios.
- Eventos de cadena.
- Finales.

La arquitectura debe formalizarlo.

```typescript
interface EventDefinition {
  id: string;

  type:
    | "THREAT"
    | "DAILY"
    | "CHAIN"
    | "STORY";

  weight: number;

  requirements: Requirement[];

  blockingConditions: Condition[];

  choices: EventChoice[];

  consequences: EventEffect[];

  nextEvent?: string;
}
```

---

# 14. SISTEMA DE CADENAS NARRATIVAS

Las cadenas actuales de tres días son una excelente base para finales especiales.

Deben implementarse como máquinas de estados.

```typescript
interface NarrativeChain {
  id: string;

  steps: ChainStep[];

  currentStep: number;

  status:
    | "LOCKED"
    | "ACTIVE"
    | "COMPLETED"
    | "FAILED";
}
```

Cada cadena debe tener:

```text
TRIGGER
    ↓
STEP 1
    ↓
STEP 2
    ↓
STEP 3
    ↓
ENDING
```

Nunca depender exclusivamente de:

```typescript
if (day === 3)
```

---

# 15. SISTEMA DE FINALES

Los finales deben evaluarse mediante prioridades.

Ejemplo:

```text
PRIORIDAD 1 — Derrotas absolutas
PRIORIDAD 2 — Finales especiales completados
PRIORIDAD 3 — Victoria estándar
PRIORIDAD 4 — Resultado parcial
```

Ejemplo conceptual:

```typescript
function evaluateEnding(run: GameRun): EndingResult {
  if (run.meters.suspicion >= 100) {
    return getEnding("SUSPICION_DEFEAT");
  }

  const specialEnding = evaluateSpecialChains(run);

  if (specialEnding) {
    return specialEnding;
  }

  return evaluateStandardEnding(run);
}
```

---

# 16. FASE DE RECOLECCIÓN — 60 SEGUNDOS

Esta fase necesita ser tratada como un sistema independiente.

## Componentes

```text
CollectionScene
PlayerController
TimerSystem
CollectibleSystem
SpawnSystem
InteractionSystem
CameraController
```

---

## Flujo

```text
START
 ↓
GENERAR SPAWNS
 ↓
ACTIVAR TIMER
 ↓
PERMITIR MOVIMIENTO
 ↓
DETECTAR INTERACCIONES
 ↓
ACTUALIZAR INVENTARIO
 ↓
TIMER = 0
 ↓
BLOQUEAR INPUT
 ↓
GUARDAR RESULTADO
 ↓
TRANSICIÓN
```

---

# 17. GENERACIÓN DEL MAPA

El mapa debe generarse desde datos.

Ejemplo:

```typescript
interface RoomDefinition {
  id: string;

  position: [number, number, number];

  size: {
    width: number;
    depth: number;
    height: number;
  };

  walls: WallConfig[];

  spawnPoints: SpawnPoint[];
}
```

Ventajas:

- Modificar habitaciones sin reescribir componentes.
- Crear variantes del departamento.
- Cambiar puntos de aparición.
- Crear mapas futuros.

---

# 18. SPRITES Y ANIMACIONES

El estándar actual establece:

- Frames de `64 × 64`.
- Idle.
- Walk.
- Run.
- Acciones.
- Expresiones.

Sin embargo, se debe corregir una inconsistencia:

El documento menciona:

```text
PNG transparente para Phaser.js / Canvas
```

La arquitectura oficial utilizará:

```text
React Three Fiber + Three.js
```

Por tanto, los metadatos del sprite deben ser independientes del motor.

Ejemplo:

```typescript
interface SpriteAnimation {
  name: string;

  row: number;

  frames: number[];

  frameDuration: number;

  loop: boolean;
}
```

---

# 19. RECOMENDACIÓN PARA EL RENDERIZADO PIXEL ART

Configurar:

```text
NearestFilter
NearestMipmapNearestFilter
```

Además:

- Evitar interpolación.
- Evitar escalado fraccional cuando sea posible.
- Mantener dimensiones consistentes.
- Separar sprites de gameplay y retratos de UI.

---

# 20. SISTEMA DE SPAWN

Los ítems no deberían aparecer siempre exactamente en el mismo lugar.

Cada spawn debe tener:

```typescript
interface SpawnPoint {
  id: string;

  position: Vector3;

  allowedTags: string[];

  probability: number;
}
```

---

## Tipos de spawn

### Garantizado

Siempre aparece.

### Aleatorio

Aparece según probabilidad.

### Exclusivo

Solo puede aparecer uno de un grupo.

### Condicional

Depende de:

- Seed.
- Dificultad.
- Personajes.
- Partidas previas.

---

# 21. SISTEMA DE RANDOM SEED

Cada partida debe tener una semilla.

```typescript
seed: number
```

Esto permitirá:

- Reproducir bugs.
- Compartir partidas.
- Hacer debugging.
- Mantener aleatoriedad controlada.

Ejemplo:

```text
Seed: 874291
```

Si ocurre un error, se puede repetir exactamente la misma configuración.

---

# 22. SISTEMA DE GUARDADO

Implementar desde el inicio:

```text
LocalStorage
```

Posteriormente se puede migrar a:

```text
IndexedDB
```

El guardado debe incluir:

- Versión del save.
- Estado de la partida.
- Día.
- Inventario.
- Personajes.
- Eventos completados.
- Seed.

Ejemplo:

```typescript
interface SaveGame {
  version: number;

  savedAt: number;

  run: GameRun;
}
```

---

# 23. VERSIONADO DE SAVES

Esto es importante y suele olvidarse.

Nunca asumir que un save antiguo tendrá la misma estructura.

```typescript
version: 1
```

Si cambias el modelo:

```typescript
version: 2
```

Crear migraciones.

---

# 24. AUDIO

Separar:

```text
MUSIC
SFX
UI
AMBIENCE
```

No reproducir audio directamente desde componentes.

Utilizar:

```text
audio.service.ts
```

Ejemplo:

```typescript
audio.play("ITEM_PICKUP");
audio.play("EVENT_ALERT");
audio.playMusic("MANAGEMENT_THEME");
```

---

# 25. OPTIMIZACIÓN WEB

## Obligatorio

### No recrear objetos en cada frame

Evitar:

```typescript
useFrame(() => {
  const object = new THREE.Vector3();
});
```

Reutilizar referencias.

---

### Instancing

Utilizar `InstancedMesh` cuando existan muchos elementos repetidos.

---

### Frustum Culling

No renderizar objetos fuera de cámara cuando sea posible.

---

### Texturas

Preferir:

- Sprite sheets.
- Atlas.
- Texturas reutilizables.

Evitar cientos de imágenes pequeñas independientes.

---

### Memoria

Liberar recursos cuando una escena deje de utilizarse.

---

# 26. RESPONSIVE DESIGN

El juego debe definir desde el inicio qué plataformas soporta.

## Recomendación inicial

### Desktop

Soporte principal.

### Tablet

Soporte secundario.

### Mobile

No asumir compatibilidad completa hasta validar:

- Controles.
- Rendimiento.
- Tamaño de UI.

---

# 27. CONTROLES

Crear una capa abstracta:

```typescript
interface InputAction {
  action:
    | "MOVE_UP"
    | "MOVE_DOWN"
    | "MOVE_LEFT"
    | "MOVE_RIGHT"
    | "INTERACT"
    | "PAUSE";
}
```

No conectar directamente:

```text
KeyW → lógica del jugador
```

En cambio:

```text
KeyW → MOVE_UP → PlayerController
```

Esto facilitará:

- Gamepad.
- Mobile.
- Reconfiguración futura.

---

# 28. TESTING

Prioridad:

## Unit Tests

Para:

- Inventario.
- Resolución de eventos.
- Chequeos.
- Finales.
- Recursos.

## Integration Tests

Para:

- Cambio de fases.
- Resolución de cadenas.
- Guardado/carga.

---

# 29. LOGGING DE DESARROLLO

Crear un modo:

```text
DEBUG MODE
```

Debe permitir:

- Añadir ítems.
- Cambiar de día.
- Modificar sospecha.
- Forzar eventos.
- Completar cadenas.
- Finalizar los 60 segundos.

Esto reducirá enormemente el tiempo de pruebas.

---

# 30. REGLAS PARA ANTIGRAVITY

Antigravity debe respetar estas reglas:

## Regla 1

No modificar contratos TypeScript existentes sin justificarlo.

## Regla 2

No introducir dependencias nuevas sin necesidad.

## Regla 3

No hardcodear nombres de ítems dentro de componentes visuales.

## Regla 4

Toda nueva mecánica debe tener:

```text
Tipos
Datos
Lógica
UI
Tests cuando aplique
```

## Regla 5

Los componentes visuales no deben contener reglas de negocio complejas.

## Regla 6

No crear archivos gigantescos.

Objetivo:

```text
Un archivo = una responsabilidad clara.
```

## Regla 7

Antes de implementar una feature:

```text
1. Analizar arquitectura existente.
2. Identificar dominio afectado.
3. Revisar tipos.
4. Definir datos.
5. Implementar lógica.
6. Implementar UI.
7. Validar flujo completo.
```

---

# 31. ORDEN DE DESARROLLO RECOMENDADO

## MILESTONE 0 — FUNDACIÓN

- Vite.
- React.
- TypeScript.
- Tailwind.
- Zustand.
- Arquitectura de carpetas.
- Tipos principales.

---

## MILESTONE 1 — VERTICAL SLICE

Crear una versión mínima completamente jugable:

```text
1 habitación
1 personaje
5 ítems
60 segundos
1 evento
1 decisión
1 final
```

Este milestone es crítico.

No desarrollar todo el contenido antes de validar el loop.

---

## MILESTONE 2 — FASE DE RECOLECCIÓN

- Movimiento.
- Cámara.
- Colisiones.
- Interacción.
- Timer.
- Inventario.
- Spawns.

---

## MILESTONE 3 — GESTIÓN

- Días.
- Acciones.
- Personajes.
- Recursos.
- Sospecha.
- Moral.

---

## MILESTONE 4 — EVENTOS

- Eventos diarios.
- Amenazas.
- Chequeos.
- Consecuencias.

---

## MILESTONE 5 — CADENAS NARRATIVAS

Implementar inicialmente una sola cadena completa.

Después:

- WASP-103b.
- La Nahuala.
- Hermanos Calavera.

---

## MILESTONE 6 — CONTENIDO COMPLETO

Agregar:

- Todos los ítems.
- Todos los personajes.
- Todos los eventos.
- Todos los finales.

---

## MILESTONE 7 — PULIDO

- Audio.
- Animaciones.
- Efectos.
- Transiciones.
- Balance.
- UX.

---

# 32. PRINCIPALES RIESGOS DEL PROYECTO

## Riesgo 1 — Scope Creep

El proyecto tiene muchas ideas narrativas.

Solución:

> Primero validar el loop con contenido reducido.

---

## Riesgo 2 — Eventos demasiado hardcodeados

Solución:

> Eventos declarativos mediante datos.

---

## Riesgo 3 — Estado global gigantesco

Solución:

> Stores separados por dominio.

---

## Riesgo 4 — Dependencia excesiva del motor 3D

Solución:

> Three.js solo para aquello que realmente necesita representación 3D.

---

## Riesgo 5 — Balance tardío

Solución:

> Centralizar números en configuraciones.

Ejemplo:

```typescript
export const BALANCE = {
  collectionDuration: 60,

  maxSuspicion: 100,

  maxMorale: 100,

  maxInventorySlots: 8
};
```

---

# 33. DECISIONES PENDIENTES QUE DEBEN DEFINIRSE

Antes de producción completa todavía deben definirse:

### Jugabilidad

- ¿Cuántos días dura una partida estándar?
- ¿Cuántas acciones tiene cada día?
- ¿Cuántos personajes pueden actuar?
- ¿El jugador controla a un personaje o a todo el grupo durante los 60 segundos?
- ¿Cuál es exactamente la capacidad máxima inicial?

### Aleatoriedad

- ¿Todos los ítems pueden aparecer en cada partida?
- ¿Qué porcentaje de objetos clave está garantizado?
- ¿Puede una partida bloquear accidentalmente todos los finales?

### Eventos

- ¿Cuántos eventos pueden ocurrir por día?
- ¿Puede haber múltiples amenazas simultáneas?
- ¿Cómo se resuelven prioridades?

### Balance

- ¿Cuál es la duración total ideal de una run?
- ¿Qué porcentaje de jugadores debería alcanzar la victoria estándar?
- ¿Qué tan raros deben ser los finales especiales?

---

# 34. PRINCIPIO FINAL DEL PROYECTO

La arquitectura debe permitir que añadir contenido nuevo sea principalmente un trabajo de datos.

Idealmente, agregar un nuevo ítem debería requerir:

```text
1. Crear su definición.
2. Crear o asignar su sprite.
3. Configurar sus efectos.
4. Añadirlo a tablas de spawn.
```

No debería requerir modificar:

```text
Player.tsx
InventoryPanel.tsx
GameManager.tsx
EventModal.tsx
```

salvo que el objeto introduzca una mecánica completamente nueva.

---

# 35. DEFINICIÓN DE ÉXITO TÉCNICO

El proyecto estará correctamente arquitecturado si:

- Se puede agregar un ítem sin modificar el núcleo.
- Se puede agregar un evento desde datos.
- Se puede agregar un final sin reescribir el Game Loop.
- Se puede reproducir una partida mediante seed.
- Se pueden guardar y cargar partidas.
- La fase de 60 segundos funciona independientemente de la gestión.
- La UI no contiene reglas complejas.
- Los sistemas principales pueden probarse sin renderizar Three.js.

---

# DOCUMENTO RECTOR

A partir de este punto:

> **React Three Fiber representa el mundo.**  
> **Zustand mantiene el estado.**  
> **Los sistemas resuelven las reglas.**  
> **Los datos definen el contenido.**  
> **React presenta la información.**

Toda nueva funcionalidad debe respetar esta separación.