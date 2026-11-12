import { describe, it, expect, beforeEach } from 'vitest';
import { ITEMS_DATA } from '@/data/items/items.data';
import { ITEM_SPRITES, getItemSpriteUrl, getItemScale } from '@/data/items/itemSprites.data';
import { useThrowStore } from '@/stores/throw.store';
import { useInventoryStore } from '@/stores/inventory.store';

describe('Item Sprites and Carrying/Throwing System Tests', () => {
  beforeEach(() => {
    useThrowStore.getState().resetThrows();
    useInventoryStore.getState().resetCollectionInventory();
  });

  it('maps all defined items in ITEMS_DATA to valid sprite URLs and scales', () => {
    const itemIds = Object.keys(ITEMS_DATA);
    expect(itemIds.length).toBeGreaterThan(0);

    for (const id of itemIds) {
      const url = getItemSpriteUrl(id);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url.length).toBeGreaterThan(0);

      const scale = getItemScale(id);
      expect(scale).toBeDefined();
      expect(scale.length).toBe(2);
      expect(scale[0]).toBeGreaterThan(0);
      expect(scale[1]).toBeGreaterThan(0);
    }
  });

  it('provides sprites for key celebration and defense items', () => {
    expect(ITEM_SPRITES.birthday_cake).toBeDefined();
    expect(ITEM_SPRITES.smartphone).toBeDefined();
    expect(ITEM_SPRITES.first_aid_kit).toBeDefined();
    expect(ITEM_SPRITES.mystery_gift).toBeDefined();
    expect(ITEM_SPRITES.neighbor_key).toBeDefined();
    expect(ITEM_SPRITES.pro_speaker).toBeDefined();
    expect(ITEM_SPRITES.fast_food_box).toBeDefined();
    expect(ITEM_SPRITES.tape_roll).toBeDefined();
  });

  it('simulates throwing items into the elevator dropzone and landing them safely', () => {
    const throwStore = useThrowStore.getState();
    const playerPos: [number, number, number] = [7.2, 0, 23.25];
    const dropCenter: [number, number] = [4.0, 23.25];
    const itemsToThrow = ['birthday_cake', 'smartphone'];

    throwStore.launchThrows(itemsToThrow, playerPos, dropCenter, 10.0);

    const active = useThrowStore.getState().activeThrows;
    expect(active.length).toBe(2);

    // Verify first throw parameters
    expect(active[0].itemId).toBe('birthday_cake');
    expect(active[0].startX).toBe(7.2);
    expect(active[0].targetX).toBeLessThan(7.0); // Inside elevator bounds
    expect(active[0].apexHeight).toBeGreaterThan(1.0);
    expect(active[0].duration).toBeGreaterThan(0.4);

    // Simulate projectile landing
    const firstId = active[0].id;
    throwStore.onLanded(firstId);

    const updatedActive = useThrowStore.getState().activeThrows;
    const landed = useThrowStore.getState().landedItems;

    expect(updatedActive.length).toBe(1);
    expect(landed.length).toBe(1);
    expect(landed[0].itemId).toBe('birthday_cake');
    expect(landed[0].position[1]).toBe(0.18); // resting near floor
  });

  it('correctly tracks held items during pickup for the carrying socket', () => {
    const inv = useInventoryStore.getState();

    // Pick up smartphone
    inv.pickupItem('smartphone');
    expect(useInventoryStore.getState().heldItemIds).toEqual(['smartphone']);

    // Pick up second 1-slot item: neighbor_key (2 espacios usados)
    inv.pickupItem('neighbor_key');
    expect(useInventoryStore.getState().heldItemIds).toEqual(['smartphone', 'neighbor_key']);

    // Capacidad Fase 2 = 5 espacios: fast food (1) y torta (2) completan los 5
    expect(inv.pickupItem('fast_food_box')).toBe(true);
    expect(inv.pickupItem('birthday_cake')).toBe(true);

    // Capacity reached (5 slots) -> cannot pick up anything else
    const full = inv.pickupItem('tape_roll');
    expect(full).toBe(false);
  });
});
