import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { RoomDefinition } from '@/types/map.types';
import { createSeededRng, shuffled } from './seededRng';

export interface RoomiePlacement {
  characterId: string;
  roomId: string;
  position: [number, number, number];
}

/**
 * Habitaciones principales donde pueden esperar los roomies NPC.
 * Se excluyen la drop zone (ascensor) y los pasillos: son salas con
 * identidad donde tiene sentido encontrar a alguien esperando.
 */
const NPC_ROOM_IDS = [
  'kitchen',
  'living_room',
  'main_bathroom',
  'bedroom',
  'bedroom_bathroom',
  'dining_room',
  'library',
  'neighbor_apartment',
];

/** Desplazamientos candidatos desde el centro de la habitación. */
const OFFSETS: [number, number][] = [
  [0, 0],
  [1.6, 0],
  [-1.6, 0],
  [0, 1.6],
  [0, -1.6],
  [1.6, 1.6],
  [-1.6, -1.6],
  [1.6, -1.6],
  [-1.6, 1.6],
  [2.8, 0],
  [-2.8, 0],
  [0, 2.8],
  [0, -2.8],
];

function isFreeSpot(room: RoomDefinition, x: number, z: number): boolean {
  // Dentro de la habitación, con margen a las paredes
  const margin = 0.7;
  if (
    x < room.bounds.x + margin ||
    x > room.bounds.x + room.bounds.width - margin ||
    z < room.bounds.z + margin ||
    z > room.bounds.z + room.bounds.depth - margin
  ) {
    return false;
  }
  // Fuera de cualquier mueble (con holgura para el cuerpo del NPC)
  const pad = 0.45;
  return !room.furniture.some((f) => {
    const halfW = f.size[0] / 2 + pad;
    const halfD = f.size[2] / 2 + pad;
    return (
      x >= f.position[0] - halfW &&
      x <= f.position[0] + halfW &&
      z >= f.position[2] - halfD &&
      z <= f.position[2] + halfD
    );
  });
}

function findSpotInRoom(room: RoomDefinition): [number, number] | null {
  const cx = room.bounds.x + room.bounds.width / 2;
  const cz = room.bounds.z + room.bounds.depth / 2;
  for (const [dx, dz] of OFFSETS) {
    if (isFreeSpot(room, cx + dx, cz + dz)) return [cx + dx, cz + dz];
  }
  return null;
}

/**
 * Distribución de los roomies NPC (todos menos el protagonista) por el
 * departamento, derivada de la seed de la partida:
 * - Los roomies se barajan y las habitaciones candidatas también.
 * - Cada roomie va a una habitación distinta, en un punto libre de
 *   muebles cercano al centro de esa habitación.
 * Misma seed + mismo protagonista → misma distribución.
 */
export function placeRoomieNpcs(seed: number, protagonistId: string): RoomiePlacement[] {
  const rng = createSeededRng(seed ^ 0x9e3779b9);
  const npcIds = shuffled(
    Object.keys(CHARACTERS_DATA).filter((id) => id !== protagonistId),
    rng
  );
  const rooms = shuffled(
    APARTMENT_MAP.rooms.filter((r) => NPC_ROOM_IDS.includes(r.id)),
    rng
  );

  const placements: RoomiePlacement[] = [];
  let roomIdx = 0;
  for (const characterId of npcIds) {
    let placed = false;
    while (roomIdx < rooms.length && !placed) {
      const room = rooms[roomIdx];
      roomIdx += 1;
      const spot = findSpotInRoom(room);
      if (spot) {
        placements.push({
          characterId,
          roomId: room.id,
          position: [spot[0], 0, spot[1]],
        });
        placed = true;
      }
    }
    if (!placed) {
      // Fallback determinista: centro de la sala (no debería ocurrir
      // con las habitaciones actuales, todas amplias).
      const living = APARTMENT_MAP.rooms.find((r) => r.id === 'living_room')!;
      placements.push({
        characterId,
        roomId: living.id,
        position: [
          living.bounds.x + living.bounds.width / 2 + placements.length,
          0,
          living.bounds.z + living.bounds.depth / 2,
        ],
      });
    }
  }
  return placements;
}
