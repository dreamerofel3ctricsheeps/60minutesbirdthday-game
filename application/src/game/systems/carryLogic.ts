import { ITEMS_DATA } from '@/data/items/items.data';
import {
  CARRY_CAPACITY,
  MAX_COLLECTED_ROOMIES,
  ROOMIE_CARRY_SLOTS,
} from '@/game/core/balance';

/**
 * Lógica PURA de carga (Fase 2): espacios, reglas de recogida de ítems
 * y roomies, y condición de arrojo. La inventory.store la consume y los
 * tests la verifican sin renderizar nada.
 */

export interface CarryStateLike {
  heldItemIds: string[];
  carriedRoomieId: string | null;
  collectedRoomieIds: string[];
}

/** Espacios que ocupa una lista de ítems según su definición. */
export function slotsUsedByItems(itemIds: readonly string[]): number {
  return itemIds.reduce((acc, id) => acc + (ITEMS_DATA[id]?.inventorySlots ?? 1), 0);
}

/** Espacios usados en total: ítems + roomie cargado (3 si hay uno). */
export function totalSlotsUsed(state: CarryStateLike): number {
  return (
    slotsUsedByItems(state.heldItemIds) +
    (state.carriedRoomieId ? ROOMIE_CARRY_SLOTS : 0)
  );
}

/** Espacios libres restantes. */
export function freeSlots(state: CarryStateLike): number {
  return CARRY_CAPACITY - totalSlotsUsed(state);
}

/** ¿Cabe este ítem en la carga actual? */
export function canPickupItem(state: CarryStateLike, itemId: string): boolean {
  const def = ITEMS_DATA[itemId];
  if (!def) return false;
  return totalSlotsUsed(state) + def.inventorySlots <= CARRY_CAPACITY;
}

/**
 * ¿Se puede cargar a este roomie ahora?
 * - No si ya llevas uno al hombro (máx. 1: 3+3 > 5).
 * - No si ya fue entregado antes en esta partida.
 * - No si ya se alcanzó el tope de recolectados (protagonista + 3).
 * - No si no quedan los 3 espacios que ocupa.
 */
export function canCarryRoomie(state: CarryStateLike, roomieId: string): boolean {
  if (state.carriedRoomieId) return false;
  if (state.collectedRoomieIds.includes(roomieId)) return false;
  if (state.collectedRoomieIds.length >= MAX_COLLECTED_ROOMIES) return false;
  return totalSlotsUsed(state) + ROOMIE_CARRY_SLOTS <= CARRY_CAPACITY;
}

/** ¿Hay algo cargado (ítems o roomie) para arrojar? */
export function hasLoad(state: CarryStateLike): boolean {
  return state.heldItemIds.length > 0 || state.carriedRoomieId !== null;
}

/**
 * El arrojo SOLO deposita dentro de la zona segura y con carga.
 * Fuera de la zona, arrojar no hace nada (regla de diseño Fase 2).
 */
export function canThrowLoad(state: CarryStateLike, inDropZone: boolean): boolean {
  return inDropZone && hasLoad(state);
}
