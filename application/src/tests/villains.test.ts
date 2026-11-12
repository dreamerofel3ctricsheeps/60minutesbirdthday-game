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
  CAT_ESCALATION_HOUR,
  JOSE_ESCALATION_HOUR,
  MANAGEMENT_START_HOUR,
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

describe('Villanos: zonas y estado', () => {
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

describe('Villanos (mejora Fase 4): amenaza DESDE EL INICIO', () => {
  it('ambos villanos están activos desde las 7:00', () => {
    expect(MANAGEMENT_START_HOUR).toBe(7);
    expect(isVillainActive('gato', 7)).toBe(true);
    expect(isVillainActive('jose', 7)).toBe(true);
    expect(isVillainActive('gato', 12)).toBe(true);
    expect(isVillainActive('jose', 20)).toBe(true);
    expect(isVillainActive('gato', 6)).toBe(false);
  });

  it('las 13:00 y las 15:00 ya no son apariciones: son las escaladas de IA', () => {
    expect(CAT_ESCALATION_HOUR).toBe(13);
    expect(JOSE_ESCALATION_HOUR).toBe(15);
  });
});

describe('Villanos (mejora Fase 4): ritmo de avance dueToAdvance', () => {
  it('el gato avanza cada hora desde las 7:00', () => {
    expect(dueToAdvance('gato', 6, 7)).toBe(false); // aún no empieza la gestión
    expect(dueToAdvance('gato', 7, 8)).toBe(true);
    expect(dueToAdvance('gato', 13, 14)).toBe(true);
    expect(dueToAdvance('gato', 20, 21)).toBe(true);
  });

  it('Jose avanza cada 2 horas desde las 7:00: res 7→8 no, 8→9 sí, 9→10 no, 10→11 sí', () => {
    expect(dueToAdvance('jose', 6, 7)).toBe(false);
    expect(dueToAdvance('jose', 7, 8)).toBe(false);
    expect(dueToAdvance('jose', 8, 9)).toBe(true);
    expect(dueToAdvance('jose', 9, 10)).toBe(false);
    expect(dueToAdvance('jose', 10, 11)).toBe(true);
    expect(dueToAdvance('jose', 16, 17)).toBe(true);
    expect(dueToAdvance('jose', 17, 18)).toBe(false);
  });
});

describe('Villanos: pickShowdownVillain', () => {
  it('null si nadie está en la puerta', () => {
    const run = makeRun({ hour: 18, villains: { joseZone: 2, gatoZone: 1 } });
    expect(pickShowdownVillain(run)).toBeNull();
    expect(pickShowdownVillain(makeRun({ hour: 7 }))).toBeNull();
  });

  it('el gato en la puerta → showdown contra el gato, incluso temprano', () => {
    const run = makeRun({ hour: 10, villains: { joseZone: 0, gatoZone: 3 } });
    expect(pickShowdownVillain(run)).toBe('gato');
  });

  it('Jose en la puerta → showdown contra Jose', () => {
    const run = makeRun({ hour: 13, villains: { joseZone: 3, gatoZone: 1 } });
    expect(pickShowdownVillain(run)).toBe('jose');
  });

  it('ambos en la puerta → prioridad Jose', () => {
    const run = makeRun({ hour: 18, villains: { joseZone: 3, gatoZone: 3 } });
    expect(pickShowdownVillain(run)).toBe('jose');
  });
});
