import { create } from 'zustand';
import { ItemInstance } from '@/types/game.types';
import { ITEMS_DATA } from '@/data/items/items.data';

interface InventoryState {
  // Collection Phase
  heldItemIds: string[];
  depositedItemIds: string[];
  maxCarrySlots: number;

  // Management Phase
  strategicItems: ItemInstance[];

  // Actions
  pickupItem: (itemId: string) => boolean;
  dropInSafetyZone: () => string[];
  resetCollectionInventory: () => void;
  finalizeCollectionToShelter: () => void;
  useStrategicItem: (instanceId: string) => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  heldItemIds: [],
  depositedItemIds: [],
  maxCarrySlots: 2,
  strategicItems: [],

  pickupItem: (itemId: string) => {
    const { heldItemIds, maxCarrySlots } = get();
    const itemDef = ITEMS_DATA[itemId];
    if (!itemDef) return false;

    // Check slots
    const totalSlotsUsed = heldItemIds.reduce((acc, id) => {
      const def = ITEMS_DATA[id];
      return acc + (def ? def.inventorySlots : 1);
    }, 0);

    if (totalSlotsUsed + itemDef.inventorySlots > maxCarrySlots) {
      return false; // No capacity
    }

    set({ heldItemIds: [...heldItemIds, itemId] });
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

  resetCollectionInventory: () => {
    set({
      heldItemIds: [],
      depositedItemIds: [],
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
