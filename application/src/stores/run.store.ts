import { create } from 'zustand';
import { GameRun, GameResources, GameMeters, CharacterRunState } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { CARRY_CAPACITY } from '@/game/core/balance';

interface RunState {
  currentRun: GameRun | null;
  startNewRun: (seed?: number) => void;
  advanceDay: () => void;
  modifyResource: (resource: keyof GameResources, delta: number) => void;
  modifyMeter: (meter: keyof GameMeters, delta: number) => void;
  setCharacterAvailability: (characterId: string, available: boolean, busyUntil?: number) => void;
  updateCollectionTime: (remainingSeconds: number) => void;
  setEnding: (endingId: string) => void;
  /**
   * Al pasar a gestión (Fase 2): quedan disponibles SOLO el protagonista
   * seleccionado y los roomies recolectados en la recolección.
   */
  applyCollectionParty: (protagonistId: string, collectedRoomieIds: string[]) => void;
}

const INITIAL_RESOURCES: GameResources = {
  food: 4,
  water: 4,
  energy: 5,
};

const INITIAL_METERS: GameMeters = {
  suspicion: 10,
  morale: 80,
  noise: 0,
};

export const useRunStore = create<RunState>((set, get) => ({
  currentRun: null,

  startNewRun: (seed = Date.now()) => {
    const characters: CharacterRunState[] = Object.keys(CHARACTERS_DATA).map((id) => ({
      characterId: id,
      available: true,
      morale: 80,
      conditions: [],
      temporaryEffects: [],
    }));

    const newRun: GameRun = {
      id: `run_${Date.now()}`,
      seed,
      phase: 'PREPARATION',
      day: 1,
      collection: {
        remainingTime: 60,
        collectedItems: [],
        heldItems: [],
        maxCarryingSlots: CARRY_CAPACITY, // 5 espacios (balance Fase 2)
      },
      resources: { ...INITIAL_RESOURCES },
      meters: { ...INITIAL_METERS },
      inventory: [],
      characters,
      activeChains: [],
      completedEvents: [],
    };

    set({ currentRun: newRun });
  },

  advanceDay: () => {
    const { currentRun } = get();
    if (!currentRun) return;

    // Decay noise and natural consumption per day
    const nextFood = Math.max(0, currentRun.resources.food - 1);
    const nextSuspicion = Math.min(100, currentRun.meters.suspicion + 5);
    const nextNoise = Math.max(0, currentRun.meters.noise - 20);

    set({
      currentRun: {
        ...currentRun,
        day: currentRun.day + 1,
        resources: {
          ...currentRun.resources,
          food: nextFood,
        },
        meters: {
          ...currentRun.meters,
          suspicion: nextSuspicion,
          noise: nextNoise,
        },
      },
    });
  },

  modifyResource: (resource, delta) => {
    const { currentRun } = get();
    if (!currentRun) return;

    const currentVal = currentRun.resources[resource];
    const updated = Math.max(0, currentVal + delta);

    set({
      currentRun: {
        ...currentRun,
        resources: {
          ...currentRun.resources,
          [resource]: updated,
        },
      },
    });
  },

  modifyMeter: (meter, delta) => {
    const { currentRun } = get();
    if (!currentRun) return;

    const currentVal = currentRun.meters[meter];
    const updated = Math.max(0, Math.min(100, currentVal + delta));

    set({
      currentRun: {
        ...currentRun,
        meters: {
          ...currentRun.meters,
          [meter]: updated,
        },
      },
    });
  },

  setCharacterAvailability: (characterId, available, busyUntil) => {
    const { currentRun } = get();
    if (!currentRun) return;

    const updatedCharacters = currentRun.characters.map((c) =>
      c.characterId === characterId
        ? { ...c, available, busyUntilDay: busyUntil }
        : c
    );

    set({
      currentRun: {
        ...currentRun,
        characters: updatedCharacters,
      },
    });
  },

  updateCollectionTime: (remainingSeconds) => {
    const { currentRun } = get();
    if (!currentRun) return;

    set({
      currentRun: {
        ...currentRun,
        collection: {
          ...currentRun.collection,
          remainingTime: remainingSeconds,
        },
      },
    });
  },

  setEnding: (endingId) => {
    const { currentRun } = get();
    if (!currentRun) return;

    set({
      currentRun: {
        ...currentRun,
        phase: 'ENDING',
        ending: endingId,
      },
    });
  },

  applyCollectionParty: (protagonistId, collectedRoomieIds) => {
    const { currentRun } = get();
    if (!currentRun) return;

    const party = new Set([protagonistId, ...collectedRoomieIds]);
    const characters = currentRun.characters.map((c) => ({
      ...c,
      available: party.has(c.characterId),
    }));

    set({ currentRun: { ...currentRun, characters } });
  },
}));
