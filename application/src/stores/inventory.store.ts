import { create } from 'zustand';
import { ItemInstance } from '@/types/game.types';
import { ITEMS_DATA } from '@/data/items/items.data';
import { CARRY_CAPACITY } from '@/game/core/balance';
import {
  canCarryRoomie,
  canPickupItem,
  canThrowLoad,
  totalSlotsUsed,
} from '@/game/systems/carryLogic';

export interface ThrownLoad {
  items: string[];
  roomieId: string | null;
}

interface InventoryState {
  // Collection Phase
  heldItemIds: string[];
  depositedItemIds: string[];
  maxCarrySlots: number;
  /** Roomie que el protagonista lleva al hombro ahora mismo (Fase 2). */
  carriedRoomieId: string | null;
  /** Roomies ya arrojados a la zona segura en esta partida. */
  collectedRoomieIds: string[];

  // Management Phase
  strategicItems: ItemInstance[];

  // Actions
  pickupItem: (itemId: string) => boolean;
  pickupRoomie: (characterId: string) => boolean;
  dropInSafetyZone: () => string[];
  /**
   * Botón de ARROJAR (Fase 2): solo deposita si el jugador está dentro
   * de la zona segura. Devuelve la carga arrojada (ítems + roomie) para
   * lanzar la animación de vuelo, o null si no se arrojó nada.
   */
  attemptThrow: (inDropZone: boolean) => ThrownLoad | null;
  resetCollectionInventory: () => void;
  finalizeCollectionToShelter: () => void;
  useStrategicItem: (instanceId: string) => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  heldItemIds: [],
  depositedItemIds: [],
  maxCarrySlots: CARRY_CAPACITY,
  carriedRoomieId: null,
  collectedRoomieIds: [],
  strategicItems: [],

  pickupItem: (itemId: string) => {
    const state = get();
    if (!canPickupItem(state, itemId)) return false;
    set({ heldItemIds: [...state.heldItemIds, itemId] });
    return true;
  },

  pickupRoomie: (characterId: string) => {
    const state = get();
    if (!canCarryRoomie(state, characterId)) return false;
    set({ carriedRoomieId: characterId });
    return true;
  },

  dropInSafetyZone: () => {
    const { heldItemIds, depositedItemIds } = get();
    if (heldItemIds.length === 0) return [];

    const deposited = [...heldItemIds];
    set({
      depositedItemIds: [...depositedItemIds, ...deposited],
      heldItemIds: [],
    });
    return deposited;
  },

  attemptThrow: (inDropZone: boolean) => {
    const state = get();
    if (!canThrowLoad(state, inDropZone)) return null;

    const items = [...state.heldItemIds];
    const roomieId = state.carriedRoomieId;

    set({
      heldItemIds: [],
      depositedItemIds: [...state.depositedItemIds, ...items],
      carriedRoomieId: null,
      collectedRoomieIds: roomieId
        ? [...state.collectedRoomieIds, roomieId]
        : state.collectedRoomieIds,
    });

    return { items, roomieId };
  },

  resetCollectionInventory: () => {
    set({
      heldItemIds: [],
      depositedItemIds: [],
      carriedRoomieId: null,
      collectedRoomieIds: [],
      strategicItems: [],
    });
  },

  finalizeCollectionToShelter: () => {
    const { depositedItemIds } = get();
    const instances: ItemInstance[] = depositedItemIds.map((itemId, idx) => {
      const def = ITEMS_DATA[itemId];
      const maxUses = def && typeof def.maxUses === 'number' ? def.maxUses : 999;
      return {
        instanceId: `inst_${itemId}_${idx}_${Date.now()}`,
        itemId,
        usesRemaining: maxUses,
      };
    });

    set({ strategicItems: instances });
  },

  useStrategicItem: (instanceId: string) => {
    const { strategicItems } = get();
    const index = strategicItems.findIndex((it) => it.instanceId === instanceId);
    if (index === -1) return false;

    const currentItem = strategicItems[index];
    if (currentItem.usesRemaining <= 1) {
      // Remove used up item
      set({
        strategicItems: strategicItems.filter((_, i) => i !== index),
      });
    } else {
      // Decrease uses
      const updated = [...strategicItems];
      updated[index] = {
        ...currentItem,
        usesRemaining: currentItem.usesRemaining - 1,
      };
      set({ strategicItems: updated });
    }
    return true;
  },
}));

/** Selector cómodo: espacios usados de la carga actual (ítems + roomie). */
export const selectUsedSlots = (s: InventoryState): number => totalSlotsUsed(s);
