import { describe, it, expect } from 'vitest';
import { GameRun } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import {
  VILLAIN_ZONES,
  DOOR_ZONE_INDEX,
  ROOM_ZONE_INDEX,
  INITIAL_VILLAINS,
  getVillains,
  isVillainActive,
  villainZoneIndex,
  villainAtDoor,
  dueToAdvance,
  pickShowdownVillain,
} from '@/game/systems/villainSystem';
import {
  VILLAIN_CAT_INTRO_HOUR,
  VILLAIN_JOSE_INTRO_HOUR,
} from '@/game/core/balance';

function makeRun(overrides: Partial<GameRun> = {}): GameRun {
  return {
    id: 'run_test',
    seed: 42,
    phase: 'MANAGEMENT',
    day: 1,
    hour: 7,
    collection: { remainingTime: 0, collectedItems: [], heldItems: [], maxCarryingSlots: 5 },
    resources: { food: 4, water: 4, energy: 5 },
    meters: { despertar: 5, preparacion: 0, morale: 80, noise: 0 },
    inventory: [],
    characters: Object.keys(CHARACTERS_DATA).map((id) => ({
      characterId: id,
      available: true,
      morale: 80,
      conditions: [],
      temporaryEffects: [],
    })),
    activeChains: [],
    completedEvents: [],
    ...overrides,
  };
}

describe('Villanos (Fase 4): zonas y estado', () => {
  it('las zonas van de exterior a cuarto, con puerta en 3 y cuarto en 4', () => {
    expect(VILLAIN_ZONES).toEqual(['exterior', 'cocina', 'sala', 'puerta', 'cuarto']);
    expect(DOOR_ZONE_INDEX).toBe(3);
    expect(ROOM_ZONE_INDEX).toBe(4);
    expect(VILLAIN_ZONES[DOOR_ZONE_INDEX]).toBe('puerta');
    expect(VILLAIN_ZONES[ROOM_ZONE_INDEX]).toBe('cuarto');
  });

  it('getVillains usa INITIAL_VILLAINS si el run no trae el campo (runs Fase 3)', () => {
    expect(getVillains(makeRun())).toEqual(INITIAL_VILLAINS);
    expect(getVillains(makeRun())).toEqual({ joseZone: 0, gatoZone: 0 });
    const withVillains = makeRun({ villains: { joseZone: 2, gatoZone: 1 } });
    expect(getVillains(withVillains)).toEqual({ joseZone: 2, gatoZone: 1 });
  });

  it('villainZoneIndex y villainAtDoor leen la zona correcta de cada villano', () => {
    const run = makeRun({ villains: { joseZone: 1, gatoZone: 3 } });
    expect(villainZoneIndex(run, 'jose')).toBe(1);
    expect(villainZoneIndex(run, 'gato')).toBe(3);
    expect(villainAtDoor(run, 'gato')).toBe(true);
    expect(villainAtDoor(run, 'jose')).toBe(false);
  });
});

describe('Villanos (Fase 4): activación derivada de la hora', () => {
  it('el gato está inactivo a las 12 y activo a las 13', () => {
    expect(VILLAIN_CAT_INTRO_HOUR).toBe(13);
    expect(isVillainActive('gato', 12)).toBe(false);
    expect(isVillainActive('gato', 13)).toBe(true);
    expect(isVillainActive('gato', 20)).toBe(true);
  });

  it('Jose está inactivo a las 14 y activo a las 15', () => {
    expect(VILLAIN_JOSE_INTRO_HOUR).toBe(15);
    expect(isVillainActive('jose', 14)).toBe(false);
    expect(isVillainActive('jose', 15)).toBe(true);
    expect(isVillainActive('jose', 24)).toBe(true);
  });
});

describe('Villanos (Fase 4): ritmo de avance dueToAdvance', () => {
  it('el gato avanza cada hora desde su aparición', () => {
    expect(dueToAdvance('gato', 12, 13)).toBe(false); // aún no apareció en la hora previa
    expect(dueToAdvance('gato', 13, 14)).toBe(true);
    expect(dueToAdvance('gato', 14, 15)).toBe(true);
    expect(dueToAdvance('gato', 20, 21)).toBe(true);
  });

  it('Jose avanza solo cada 2 horas desde su intro: 15→16 no, 16→17 sí', () => {
    expect(dueToAdvance('jose', 14, 15)).toBe(false); // aún no apareció
    expect(dueToAdvance('jose', 15, 16)).toBe(false);
    expect(dueToAdvance('jose', 16, 17)).toBe(true);
    expect(dueToAdvance('jose', 17, 18)).toBe(false);
    expect(dueToAdvance('jose', 18, 19)).toBe(true);
  });
});

describe('Villanos (Fase 4): pickShowdownVillain', () => {
  it('null si nadie está en la puerta', () => {
    const run = makeRun({ hour: 18, villains: { joseZone: 2, gatoZone: 1 } });
    expect(pickShowdownVillain(run)).toBeNull();
    expect(pickShowdownVillain(makeRun({ hour: 18 }))).toBeNull();
  });

  it('el gato en la puerta → showdown contra el gato', () => {
    const run = makeRun({ hour: 16, villains: { joseZone: 0, gatoZone: 3 } });
    expect(pickShowdownVillain(run)).toBe('gato');
  });

  it('Jose en la puerta → showdown contra Jose', () => {
    const run = makeRun({ hour: 18, villains: { joseZone: 3, gatoZone: 1 } });
    expect(pickShowdownVillain(run)).toBe('jose');
  });

  it('ambos en la puerta → prioridad Jose', () => {
    const run = makeRun({ hour: 18, villains: { joseZone: 3, gatoZone: 3 } });
    expect(pickShowdownVillain(run)).toBe('jose');
  });

  it('un villano INACTIVO en la puerta no dispara showdown', () => {
    // A las 14 Jose aún no apareció, aunque su zona diga puerta.
    const run = makeRun({ hour: 14, villains: { joseZone: 3, gatoZone: 3 } });
    expect(pickShowdownVillain(run)).toBe('gato');
    // A las 12 ninguno apareció.
    const early = makeRun({ hour: 12, villains: { joseZone: 3, gatoZone: 3 } });
    expect(pickShowdownVillain(early)).toBeNull();
  });
});
