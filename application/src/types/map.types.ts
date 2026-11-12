export interface WallConfig {
  from: [number, number]; // [x, z]
  to: [number, number];   // [x, z]
  thickness?: number;     // 0.3m load wall, 0.15m partition wall
  height?: number;        // default 2.8m
  color?: string;
  type?: 'load' | 'partition' | 'exterior'; // muro de carga, tabique, exterior
}

export interface DoorConfig {
  position: [number, number]; // [x, z]
  width: number;              // e.g. 1.2m
  rotation?: number;          // y angle
  connects: [string, string]; // room IDs
  direction?: 'x' | 'z';     // which axis the door opening faces
}

export interface FurnitureObstacle {
  id: string;
  name: string;
  position: [number, number, number]; // [x, y, z]
  size: [number, number, number];     // [width, height, depth]
  color?: string;
  riskZone?: boolean; // noise danger when bumping into it
  isShelf?: boolean;  // whether this is a 2-tier display shelf with ladder
  shelfConfig?: {
    tierHeights?: [number, number];   // [lowerY, upperY] e.g. [0.85, 1.70]
    ladderSide?: 'left' | 'right';
    style?: 'modern_wood' | 'classic_library' | 'industrial_metal' | 'chic_white';
    ladderAngle?: number;
    showcaseLight?: boolean;
  };
}

export interface SpawnPoint {
  id: string;
  roomId: string;
  position: [number, number, number]; // [x, y, z]
  categoryAllowed?: string[];
  candidateItemIds?: string[];
}

/** Floor material specification per room */
export interface FloorMaterial {
  type: 'wood' | 'tile' | 'concrete' | 'carpet' | 'ceramic';
  baseColor: string;
  secondaryColor?: string;   // for patterns (checkerboard, etc.)
  pattern?: 'planks' | 'parquet' | 'checkerboard' | 'hexagonal' | 'plain' | 'carpet';
  roughness: number;
  metalness?: number;
}

/** Wall material specification per room */
export interface WallMaterial {
  type: 'paint' | 'tile' | 'brick' | 'wood_panel' | 'concrete';
  baseColor: string;
  secondaryColor?: string;   // for patterns
  pattern?: 'plain' | 'metro_tile' | 'checkerboard' | 'brick' | 'boiserie';
  roughness: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface RoomDefinition {
  id: string;
  name: string;
  zone: 0 | 1 | 2 | 3; // Zone 0: Resguardo, 1: Saqueo Rápido, 2: Alta Recompensa, 3: Peligro/Sigilo
  bounds: {
    x: number;      // left corner
    z: number;      // top corner
    width: number;  // in meters
    depth: number;  // in meters
  };
  floorColor: string;
  wallColor?: string;
  floorMaterial?: FloorMaterial;
  wallMaterial?: WallMaterial;
  isRiskArea?: boolean; // increases noise/suspicion
  isDropZone?: boolean; // ascensor / entrega
  spawnPoints: SpawnPoint[];
  furniture: FurnitureObstacle[];
}

export interface MapDefinition {
  id: string;
  name: string;
  scale: number; // e.g. 1 unit = 1 meter
  rooms: RoomDefinition[];
  doors: DoorConfig[];
  walls: WallConfig[];
  playerSpawn: [number, number, number];
  dropZone: {
    center: [number, number];
    radius: number;
    bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  };
}
