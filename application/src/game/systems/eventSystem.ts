import {
  CharacterDefinition,
  ItemEffect,
} from '@/types/game.types';
import { useRunStore } from '@/stores/run.store';

export type SkillCheckOutcome = 'CRITICAL_SUCCESS' | 'SUCCESS' | 'PARTIAL' | 'FAILURE';

export class EventSystem {
  static resolveSkillCheck(
    character: CharacterDefinition,
    attribute: keyof CharacterDefinition['attributes'],
    difficulty: number,
    rng: () => number = Math.random
  ): { outcome: SkillCheckOutcome; roll: number; total: number } {
    const baseStat = character.attributes[attribute] || 5;
    const roll = Math.floor(rng() * 10) + 1; // 1 - 10
    const total = baseStat + roll;

    let outcome: SkillCheckOutcome = 'FAILURE';
    if (roll === 10 || total >= difficulty + 5) {
      outcome = 'CRITICAL_SUCCESS';
    } else if (total >= difficulty) {
      outcome = 'SUCCESS';
    } else if (total >= difficulty - 2) {
      outcome = 'PARTIAL';
    } else {
      outcome = 'FAILURE';
    }

    return { outcome, roll, total };
  }

  static applyConsequences(effects: ItemEffect[]) {
    const runStore = useRunStore.getState();

    for (const effect of effects) {
      if (effect.type === 'ADD_RESOURCE' && effect.resource && effect.value !== undefined) {
        runStore.modifyResource(effect.resource, effect.value);
      } else if (effect.type === 'MODIFY_METER' && effect.meter && effect.value !== undefined) {
        runStore.modifyMeter(effect.meter, effect.value);
      }
    }
  }
}
