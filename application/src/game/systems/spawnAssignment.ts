import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { createSeededRng, shuffled } from './seededRng';

export interface SpawnedItem {
  id: string;
  itemId: string;
  position: [number, number, number];
}

/**
 * Spawn de ítems ALEATORIO PARA TODOS con la seed de la partida
 * (decisión expresa de Jose, Fase 2):
 * - Se toma el POOL COMPLETO de ítems definidos y se baraja con la seed.
 * - Los spawn points del mapa también se barajan con la misma seed.
 * - Se asignan ítems barajados a puntos barajados, en orden, hasta
 *   agotar ítems o puntos (hoy: 12 ítems, 10 puntos → 10 aparecen y
 *   su posición varía por partida; ningún ítem tiene sitio fijo ni
 *   aparición privilegiada).
 * Misma seed → misma asignación exacta.
 */
export function assignSpawnItems(
  seed: number,
  itemIds: readonly string[] = Object.keys(ITEMS_DATA),
  spawnPoints: readonly { id: string; position: [number, number, number] }[] = ALL_SPAWN_POINTS
): SpawnedItem[] {
  const rng = createSeededRng(seed);
  const itemsShuffled = shuffled(itemIds, rng);
  const pointsShuffled = shuffled(spawnPoints, rng);

  const count = Math.min(itemsShuffled.length, pointsShuffled.length);
  const result: SpawnedItem[] = [];
  for (let i = 0; i < count; i++) {
    result.push({
      id: pointsShuffled[i].id,
      itemId: itemsShuffled[i],
      position: pointsShuffled[i].position,
    });
  }
  return result;
}

/** Todos los spawn points del departamento, aplanados. */
export const ALL_SPAWN_POINTS = APARTMENT_MAP.rooms.flatMap((room) =>
  room.spawnPoints.map((sp) => ({ id: sp.id, position: sp.position }))
);
