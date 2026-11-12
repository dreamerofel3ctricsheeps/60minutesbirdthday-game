import { create } from 'zustand';
import { GameRun, GameResources, GameMeters, CharacterRunState } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { CARRY_CAPACITY, MANAGEMENT_START_HOUR, INITIAL_DESPERTAR } from '@/game/core/balance';
import { tickHour, assignTask, HourTickResult } from '@/game/systems/managementSystem';
import { MinigameOutcome } from '@/game/systems/minigames';
import { resolveHour, HourResolutionResult } from '@/game/systems/hourResolution';

interface RunState {
  currentRun: GameRun | null;
  startNewRun: (seed?: number) => void;
  /** Fase 3: avanza el reloj de gestión una hora. Devuelve las tareas completadas en ese tick. */
  advanceHour: () => HourTickResult | null;
  /** Fase 3: asigna una tarea de gestión a un roomie libre. Devuelve si se pudo. */
  assignManagementTask: (characterId: string, taskId: string) => boolean;
  /** Fase 4: resuelve la hora completa (tick + minijuego + villanos). Devuelve el resultado o null si no hay run. */
  applyHourResolution: (outcome: MinigameOutcome) => HourResolutionResult | null;
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
  despertar: INITIAL_DESPERTAR,
  preparacion: 0,
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
      hour: MANAGEMENT_START_HOUR,
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
      villains: { joseZone: 0, gatoZone: 0 },
    };

    set({ currentRun: newRun });
  },

  advanceHour: () => {
    const { currentRun } = get();
    if (!currentRun) return null;

    const result = tickHour(currentRun);
    set({ currentRun: result.run });
    return result;
  },

  assignManagementTask: (characterId, taskId) => {
    const { currentRun } = get();
    if (!currentRun) return false;

    const next = assignTask(currentRun, characterId, taskId);
    if (!next) return false;
    set({ currentRun: next });
    return true;
  },

  applyHourResolution: (outcome) => {
    const { currentRun } = get();
    if (!currentRun) return null;

    const result = resolveHour(currentRun, outcome);
    set({ currentRun: result.run });
    return result;
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
