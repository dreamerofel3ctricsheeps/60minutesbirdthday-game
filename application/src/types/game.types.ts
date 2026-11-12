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
  suspicion: number; // 0 - 100
  morale: number;    // 0 - 100
  noise: number;     // 0 - 100
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
  busyUntilDay?: number;
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

export interface EndingDefinition {
  id: string;
  title: string;
  description: string;
  priority: number;
  isVictory: boolean;
}
