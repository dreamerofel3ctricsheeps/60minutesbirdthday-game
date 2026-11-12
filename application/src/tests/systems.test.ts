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

    // Smartphone takes 1 slot
    const pickedPhone = inv.pickupItem('smartphone');
    expect(pickedPhone).toBe(true);

    // Birthday cake takes 2 slots -> should exceed standard 2 slots
    const pickedCake = inv.pickupItem('birthday_cake');
    expect(pickedCake).toBe(false);

    // Drop to safety zone
    const deposited = inv.dropInSafetyZone();
    expect(deposited).toContain('smartphone');
    expect(useInventoryStore.getState().heldItemIds.length).toBe(0);
    expect(useInventoryStore.getState().depositedItemIds.length).toBe(1);
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
