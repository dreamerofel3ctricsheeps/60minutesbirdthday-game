import { describe, it, expect, beforeEach } from 'vitest';
import { useInventoryStore } from '@/stores/inventory.store';
import { useRunStore } from '@/stores/run.store';
import { EventSystem } from '@/game/systems/eventSystem';
import { EndingSystem } from '@/game/systems/endingSystem';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';

describe('Base Architecture Systems Test', () => {
  beforeEach(() => {
    useInventoryStore.getState().resetCollectionInventory();
    useRunStore.getState().startNewRun(12345);
  });

  it('correctly tracks items picked up and respects carry capacity', () => {
    const inv = useInventoryStore.getState();

    // Capacidad Fase 2: 5 espacios en total.
    // Smartphone takes 1 slot
    const pickedPhone = inv.pickupItem('smartphone');
    expect(pickedPhone).toBe(true);

    // Birthday cake takes 2 slots -> 1 + 2 = 3 of 5, fits
    const pickedCake = inv.pickupItem('birthday_cake');
    expect(pickedCake).toBe(true);

    // Toolbox takes 2 more -> exactly 5 of 5, fits
    expect(inv.pickupItem('toolbox')).toBe(true);

    // Box of beers (2 slots) would exceed the 5-space capacity
    expect(inv.pickupItem('box_of_beers')).toBe(false);

    // Drop to safety zone
    const deposited = inv.dropInSafetyZone();
    expect(deposited).toContain('smartphone');
    expect(useInventoryStore.getState().heldItemIds.length).toBe(0);
    expect(useInventoryStore.getState().depositedItemIds.length).toBe(3);
  });

  it('correctly resolves skill checks based on character attributes', () => {
    const natalia = CHARACTERS_DATA.natalia;
    // Natalia has speed 9 -> roll with fixed pseudo-random
    const check = EventSystem.resolveSkillCheck(natalia, 'speed', 10, () => 0.5); // roll = 6, total = 15
    expect(check.outcome).toBe('CRITICAL_SUCCESS');
  });

  it('evaluates ending defeat conditions when suspicion reaches 100', () => {
    const runStore = useRunStore.getState();
    runStore.modifyMeter('suspicion', 100);

    const currentRun = useRunStore.getState().currentRun;
    expect(currentRun).toBeDefined();
    if (currentRun) {
      const ending = EndingSystem.evaluateEnding(currentRun);
      expect(ending).toBeDefined();
      expect(ending?.id).toBe('SUSPICION_DEFEAT');
    }
  });
});
