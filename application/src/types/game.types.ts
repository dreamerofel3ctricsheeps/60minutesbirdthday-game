export type GamePhase =
  | 'MENU'
  | 'PREPARATION'
  | 'COLLECTION'
  | 'COLLECTION_RESULT'
  | 'MANAGEMENT'
  | 'EVENT'
  | 'ENDING'
  | 'RESULTS'
  | 'MAP_EXPLORER';

export interface GameResources {
  food: number;
  water: number;
  energy: number;
}

export interface GameMeters {
  /**
   * Fase 3: la sospecha se REDEFINE como DESPERTAR. Ximena está dormida en
   * su cuarto durante toda la gestión; el ruido la acerca a despertarse.
   * Si llega a 100, se despierta y la sorpresa se arruina.
   */
  despertar: number;    // 0 - 100
  /** Qué tan lista está la fiesta (decoración, comida, regalo, música). */
  preparacion: number;  // 0 - 100
  morale: number;       // 0 - 100
  noise: number;        // 0 - 100 (se sigue usando en la recolección)
}

export interface CollectionRunState {
  remainingTime: number; // 60s
  collectedItems: string[]; // item IDs or instance IDs deposited in drop zone
  heldItems: string[];     // currently carrying
  maxCarryingSlots: number;
}

export interface GameRun {
  id: string;
  seed: number;
  phase: GamePhase;
  day: number;
  /** Fase 3: reloj de la gestión, de 7 a 24 (24 = 00:00, empieza el cumple). */
  hour: number;
  collection: CollectionRunState;
  resources: GameResources;
  meters: GameMeters;
  inventory: string[]; // IDs of instances in management shelter
  characters: CharacterRunState[];
  activeChains: ActiveChain[];
  completedEvents: string[];
  ending?: string;
}

export type AttributeType = 'logic' | 'charisma' | 'speed' | 'stealth';

export interface CharacterAttributes {
  logic: number;
  charisma: number;
  speed: number;
  stealth: number;
}

export interface CharacterDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  attributes: CharacterAttributes;
  passiveAbility?: {
    id: string;
    name: string;
    description: string;
  };
  tags: string[];
  spriteSet: string;
}

export interface TemporaryEffect {
  id: string;
  attribute?: AttributeType;
  modifier: number;
  durationDays: number;
}

export interface CharacterRunState {
  characterId: string;
  available: boolean;
  /** @deprecated El modelo por días fue reemplazado por horas (Fase 3). */
  busyUntilDay?: number;
  /** Fase 3 (gestión por horas): tarea actual y hora en que se libera. */
  currentTaskId?: string;
  taskStartedHour?: number;
  busyUntilHour?: number;
  morale: number;
  conditions: string[];
  temporaryEffects: TemporaryEffect[];
}

export type ItemCategory =
  | 'SURVIVAL'
  | 'DEFENSE'
  | 'COMMUNICATION'
  | 'ENTERTAINMENT'
  | 'KEY'
  | 'MISC';

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'UNIQUE';

export interface ItemEffect {
  type:
    | 'ADD_RESOURCE'
    | 'MODIFY_METER'
    | 'UNLOCK_EVENT'
    | 'PREVENT_THREAT'
    | 'DELAY_THREAT'
    | 'HEAL_CONDITION';
  resource?: keyof GameResources;
  meter?: keyof GameMeters;
  value?: number;
  turns?: number;
  targetId?: string;
}

export interface Requirement {
  type: 'ITEM' | 'CHARACTER' | 'RESOURCE' | 'METER';
  key: string;
  min?: number;
  max?: number;
}

export interface SpawnConfig {
  roomIds: string[];
  weight: number;
  guaranteed?: boolean;
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  inventorySlots: number;
  maxUses: number | 'infinite';
  description: string;
  tags: string[];
  effects: ItemEffect[];
  requirements?: Requirement[];
  sprite: {
    sheet: string;
    frame: number;
  };
  spawn: SpawnConfig;
  rarity: ItemRarity;
}

export interface ItemInstance {
  instanceId: string;
  itemId: string;
  usesRemaining: number;
}

export type EventType = 'THREAT' | 'DAILY' | 'CHAIN' | 'STORY';

export interface EventChoice {
  id: string;
  label: string;
  description?: string;
  requirements?: Requirement[];
  consequences: ItemEffect[];
  skillCheck?: {
    attribute: AttributeType;
    difficulty: number;
  };
  nextEventId?: string;
}

export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  type: EventType;
  weight: number;
  requirements?: Requirement[];
  blockingConditions?: string[];
  choices: EventChoice[];
  consequences?: ItemEffect[];
  nextEvent?: string;
}

export interface ChainStep {
  stepIndex: number;
  eventId: string;
  requiredDaysPassed?: number;
}

export interface ActiveChain {
  id: string;
  currentStep: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
}

// ---------------------------------------------------------------------------
// Fase 3: gestión por horas, eventos con minijuegos y beats de historia
// ---------------------------------------------------------------------------

/** Zona de la escena 2D donde se ejecuta (y se ve) una tarea. */
export type TaskZone = 'sala' | 'cocina' | 'puerta';

export interface TaskDefinition {
  id: string;
  name: string;
  zone: TaskZone;
  /** Duración en horas completas (1-3). */
  durationHours: number;
  /**
   * Ruido: cuánto suma a DESPERTAR cuando la tarea se COMPLETA
   * (el golpe de ruido ocurre al terminar: martillazo final, globos, etc.).
   * Con personaje afín el ruido baja 2 puntos (trabaja con más cuidado).
   */
  noise: number;
  /** Preparación que suma al completarse (con afín: +50%, redondeado). */
  preparationGain: number;
  /** Delta de Moral al completarse (Descansar lo usa en positivo). */
  moraleDelta?: number;
  /** Delta extra de Despertar al completarse (negativo = calmar/ocultar). */
  despertarDelta?: number;
  attribute: AttributeType;
  /** Personajes afines: bonus de preparación y menos ruido. */
  affinityCharacterIds?: string[];
  description: string;
  icon: string;
}

export type ManagementEventKind = 'choice' | 'minigame-qte' | 'minigame-timing';

export interface ManagementEventDefinition {
  id: string;
  title: string;
  description: string;
  kind: ManagementEventKind;
  /** Solo para kind='choice'. */
  choices?: EventChoice[];
  /** Texto corto de qué hay que hacer en el minijuego. */
  minigameHint?: string;
}

export interface StoryBeat {
  id: string;
  /** Hora a la que se dispara (al LLEGAR a esa hora). */
  hour: number;
  title: string;
  /** Líneas de diálogo/narración que se muestran en orden. */
  lines: string[];
  /** Evento que se lanza al cerrar el beat (p. ej. el tutorial del gato). */
  eventId?: string;
}

export interface EndingDefinition {
  id: string;
  title: string;
  description: string;
  priority: number;
  isVictory: boolean;
}
