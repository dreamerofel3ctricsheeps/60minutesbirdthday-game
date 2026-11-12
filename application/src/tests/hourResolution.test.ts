import { describe, it, expect } from 'vitest';
import { GameRun } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import {
  assignTask,
  tickHour,
  isGuardianActive,
  isCharacterFree,
} from '@/game/systems/managementSystem';
import { MinigameOutcome } from '@/game/systems/minigames';
import { getHourMinigame, HOUR_MINIGAME_EFFECTS } from '@/game/systems/hourMinigames';
import { resolveHour, HourResolutionResult } from '@/game/systems/hourResolution';
import { EndingSystem } from '@/game/systems/endingSystem';
import {
  CAT_ADVANCE_DESPERTAR,
  JOSE_ADVANCE_DESPERTAR,
  CAT_BREACH_DESPERTAR,
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
    villains: { joseZone: 0, gatoZone: 0 },
    ...overrides,
  };
}

describe('Duelo por hora (mejora Fase 4): rotación de getHourMinigame', () => {
  it('rota cocina(Jose) → sala(gato) → puerta(Jose) → baño(gato) desde las 7 y repite a las 11', () => {
    const at = (hour: number) => getHourMinigame(makeRun({ hour }));
    expect(at(7)).toMatchObject({ kind: 'catch', zone: 'cocina', villain: 'jose', showdown: false, title: 'Duelo de la cena' });
    expect(at(8)).toMatchObject({ kind: 'carpets', zone: 'sala', villain: 'gato', showdown: false, title: 'Alfombras de colores' });
    expect(at(9)).toMatchObject({ kind: 'race', zone: 'puerta', villain: 'jose', showdown: false });
    expect(at(10)).toMatchObject({ kind: 'shower', zone: 'bano', villain: 'gato', showdown: false, title: 'Ducha silenciosa' });
    expect(at(11)).toMatchObject({ kind: 'catch', zone: 'cocina', villain: 'jose' });
    expect(at(12)).toMatchObject({ kind: 'carpets', zone: 'sala', villain: 'gato' });
  });

  it('cada duelo documenta su inspiración real de Mario Party', () => {
    const at = (hour: number) => getHourMinigame(makeRun({ hour }));
    expect(at(7).inspiration).toContain('Coney Island');
    expect(at(8).inspiration).toContain('Mushroom Mix-Up');
    expect(at(9).inspiration).toContain('Mecha-Marathon');
    expect(at(10).inspiration).toContain('Hot Rope Jump');
  });

  it('el showdown tiene prioridad sobre la rotación y es la Carrera al timbre contra el villano en la puerta', () => {
    // A las 10 tocaría ducha (baño), pero el gato está en la puerta.
    const catRun = makeRun({ hour: 10, villains: { joseZone: 0, gatoZone: 3 } });
    expect(getHourMinigame(catRun)).toMatchObject({
      kind: 'race',
      zone: 'puerta',
      villain: 'gato',
      showdown: true,
    });
    // A las 12 tocaría alfombras (sala), pero Jose está en la puerta.
    const joseRun = makeRun({ hour: 12, villains: { joseZone: 3, gatoZone: 0 } });
    expect(getHourMinigame(joseRun)).toMatchObject({
      kind: 'race',
      zone: 'puerta',
      villain: 'jose',
      showdown: true,
    });
  });

  it('la tabla de efectos del duelo es la de Jose: ganar +6/-4, perder +8 Despertar', () => {
    expect(HOUR_MINIGAME_EFFECTS.perfect).toEqual({ preparacion: 6, despertar: -4 });
    expect(HOUR_MINIGAME_EFFECTS.partial).toEqual({ preparacion: 0, despertar: 0 });
    expect(HOUR_MINIGAME_EFFECTS.fail).toEqual({ preparacion: 0, despertar: 8 });
  });
});

describe('resolveHour (mejora Fase 4): efectos del duelo y avance de villanos', () => {
  it("hora 8 con duelo ganado ('perfect'): tabla +6/-4, y SIN vigía avanzan gato y Jose (+4 y +6)", () => {
    const run = makeRun({
      hour: 8,
      meters: { despertar: 30, preparacion: 10, morale: 80, noise: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'perfect');
    expect(res.plan.kind).toBe('carpets');
    expect(res.run.hour).toBe(9);
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion + 6);
    expect(res.run.meters.despertar).toBe(
      ticked.meters.despertar - 4 + CAT_ADVANCE_DESPERTAR + JOSE_ADVANCE_DESPERTAR
    );
    expect(res.rivalDefeat).toBe(false);
    expect(res.catBreach).toBe(false);
    expect(res.advancedVillains).toEqual(['gato', 'jose']);
    expect(res.run.villains).toEqual({ joseZone: 1, gatoZone: 1 });
  });

  it("hora 8 con duelo perdido ('fail') sin showdown: Despertar +8 de tabla + avances", () => {
    const run = makeRun({
      hour: 8,
      meters: { despertar: 30, preparacion: 10, morale: 80, noise: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'fail');
    expect(res.run.meters.despertar).toBe(
      ticked.meters.despertar + 8 + CAT_ADVANCE_DESPERTAR + JOSE_ADVANCE_DESPERTAR
    );
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
  });

  it('a las 7:00 el gato ya avanza (amenaza desde el inicio); Jose aún no (su ritmo es cada 2 h)', () => {
    const run = makeRun({
      hour: 7,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'partial'); // partial: sin efectos de tabla
    expect(res.run.villains?.gatoZone).toBe(1);
    expect(res.run.villains?.joseZone).toBe(0);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar + CAT_ADVANCE_DESPERTAR);
    expect(res.advancedVillains).toEqual(['gato']);
  });

  it('Jose avanza al resolver la hora 8 (+6) y también el gato (+4): el total incluye ambos', () => {
    const at8 = makeRun({
      hour: 8,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const ticked8 = tickHour(at8).run;
    const res8 = resolveHour(at8, 'partial');
    expect(res8.run.villains?.joseZone).toBe(1);
    expect(res8.advancedVillains).toContain('jose');
    expect(res8.run.meters.despertar).toBe(
      ticked8.meters.despertar + JOSE_ADVANCE_DESPERTAR + CAT_ADVANCE_DESPERTAR
    );

    const at7 = makeRun({
      hour: 7,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const res7 = resolveHour(at7, 'partial');
    expect(res7.run.villains?.joseZone).toBe(0); // a las 7→8 no le tocaba
    expect(res7.advancedVillains).not.toContain('jose');
    expect(res7.run.villains?.gatoZone).toBe(1); // el gato sí, avanza cada hora
  });

  it('un villano EN la puerta no avanza más: espera su showdown', () => {
    const run = makeRun({ hour: 10, villains: { joseZone: 0, gatoZone: 3 } });
    const res = resolveHour(run, 'perfect'); // showdown ganado
    expect(res.plan.showdown).toBe(true);
    expect(res.advancedVillains).not.toContain('gato');
  });
});

describe('resolveHour: bloqueo del vigía', () => {
  it('con vigía asignado a las 7, el gato (único candidato) NO avanza y blockedVillain es el gato', () => {
    const base = makeRun({
      hour: 7,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const assigned = assignTask(base, 'itzel', 'vigia')!;
    expect(isGuardianActive(assigned)).toBe(true);
    const ticked = tickHour(assigned).run;
    const res = resolveHour(assigned, 'partial');
    expect(res.blockedVillain).toBe('gato');
    expect(res.run.villains?.gatoZone).toBe(0);
    expect(res.advancedVillains).toEqual([]);
    // Sin avance no hay Despertar de villano: queda solo lo del tick.
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar);
  });

  it('con gato y Jose por avanzar a la vez, el vigía bloquea al de zona más avanzada', () => {
    const base = makeRun({
      hour: 8,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 1, gatoZone: 2 },
    });
    const assigned = assignTask(base, 'itzel', 'vigia')!;
    const ticked = tickHour(assigned).run;
    const res = resolveHour(assigned, 'partial');
    expect(res.blockedVillain).toBe('gato'); // zona 2 > zona 1 de Jose
    expect(res.run.villains?.gatoZone).toBe(2); // bloqueado: no avanza
    expect(res.run.villains?.joseZone).toBe(2); // Jose sí: 1 → 2
    expect(res.advancedVillains).toEqual(['jose']);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar + JOSE_ADVANCE_DESPERTAR);
  });

  it('con empate de zona, el vigía bloquea a Jose', () => {
    const base = makeRun({
      hour: 8,
      villains: { joseZone: 1, gatoZone: 1 },
    });
    const assigned = assignTask(base, 'itzel', 'vigia')!;
    const res = resolveHour(assigned, 'partial');
    expect(res.blockedVillain).toBe('jose');
    expect(res.run.villains?.joseZone).toBe(1);
    expect(res.run.villains?.gatoZone).toBe(2); // el gato sí avanzó
  });
});

describe('resolveHour: showdowns', () => {
  it('showdown ganado contra el gato: vuelve a zona 0, sin breach y sin tabla de hora', () => {
    const base = makeRun({
      hour: 16,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 3 },
    });
    // Vigía para que Jose (que avanzaría 16→17) quede bloqueado y no ensucie los números.
    const assigned = assignTask(base, 'itzel', 'vigia')!;
    const ticked = tickHour(assigned).run;
    const res = resolveHour(assigned, 'partial');
    expect(res.plan).toMatchObject({ showdown: true, villain: 'gato', kind: 'race' });
    expect(res.run.villains?.gatoZone).toBe(0);
    expect(res.catBreach).toBe(false);
    expect(res.rivalDefeat).toBe(false);
    expect(res.blockedVillain).toBe('jose');
    // Es showdown: NO se aplica HOUR_MINIGAME_EFFECTS.
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar);
    expect(res.summary.join(' ')).toContain('ovillo de lana');
  });

  it("showdown ganado con duelo perfecto tampoco aplica la tabla (+6/-4 es solo de horas normales)", () => {
    const run = makeRun({
      hour: 13,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 3 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'perfect');
    expect(res.plan.showdown).toBe(true);
    expect(res.run.villains?.gatoZone).toBe(0);
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
    // A las 13→14 Jose no avanza (ritmo de 2 h): tampoco hay Despertar suyo.
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar);
  });

  it('showdown perdido contra el gato: catBreach, Despertar +25 y el gato vuelve a 0', () => {
    const run = makeRun({
      hour: 13,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 3 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'fail');
    expect(res.plan).toMatchObject({ showdown: true, villain: 'gato' });
    expect(res.catBreach).toBe(true);
    expect(res.rivalDefeat).toBe(false);
    expect(res.run.villains?.gatoZone).toBe(0);
    // +25 del breach; el +8 de 'fail' de la tabla NO se aplica en showdown.
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar + CAT_BREACH_DESPERTAR);
    expect(res.run.rivalBreach).toBeFalsy();
  });

  it('showdown perdido contra Jose: rivalDefeat, rivalBreach y final RIVAL_PARTY_DEFEAT', () => {
    const run = makeRun({
      hour: 18,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 3, gatoZone: 3 },
    });
    const res = resolveHour(run, 'fail');
    expect(res.plan).toMatchObject({ showdown: true, villain: 'jose' });
    expect(res.rivalDefeat).toBe(true);
    expect(res.run.rivalBreach).toBe(true);
    expect(EndingSystem.evaluateEnding(res.run)?.id).toBe('RIVAL_PARTY_DEFEAT');
  });

  it('el final rival manda incluso sobre Despertar 100 (prioridad en evaluateEnding)', () => {
    const run = makeRun({
      hour: 10,
      meters: { despertar: 100, preparacion: 0, morale: 80, noise: 0 },
      rivalBreach: true,
    });
    expect(EndingSystem.evaluateEnding(run)?.id).toBe('RIVAL_PARTY_DEFEAT');
  });
});

// ---------------------------------------------------------------------------
// Simulación de partida ganable (en papel): 4 party members, vigía rotando
// y tareas de preparación de bajo ruido, resolviendo 7 → 24.
// Con los villanos activos desde las 7:00, el vigía es la pieza que
// mantiene la presión de avances en ≈36 de Despertar en toda la partida.
// ---------------------------------------------------------------------------

const PARTY_IDS = ['natalia', 'fatima', 'majo', 'itzel'];
const GUARDIAN_PREFERENCE = ['itzel', 'majo', 'natalia', 'fatima'];
const PREP_TASKS: Record<string, string[]> = {
  fatima: ['cocinar', 'envolver_regalo'], // afín a cocinar: +27 prep, poco ruido
  majo: ['envolver_regalo'], // afín: +12 prep, 0 ruido
  natalia: ['envolver_regalo', 'decorar_sala'],
  itzel: ['esconder_evidencia', 'envolver_regalo'],
};

function playSimulatedGame(outcome: MinigameOutcome): {
  finalRun: GameRun;
  results: HourResolutionResult[];
} {
  let run = makeRun({
    characters: Object.keys(CHARACTERS_DATA).map((id) => ({
      characterId: id,
      available: PARTY_IDS.includes(id),
      morale: 80,
      conditions: [],
      temporaryEffects: [],
    })),
    villains: { joseZone: 0, gatoZone: 0 },
  });
  const results: HourResolutionResult[] = [];

  const tryAssign = (r: GameRun, characterId: string, taskIds: string[]): GameRun => {
    for (const taskId of taskIds) {
      const next = assignTask(r, characterId, taskId);
      if (next) return next;
    }
    return r;
  };

  while (run.hour < 24) {
    let r = run;
    // 1. Si no hay vigía activo, asignar uno (un roomie libre).
    if (!isGuardianActive(r)) {
      for (const candidate of GUARDIAN_PREFERENCE) {
        if (!PARTY_IDS.includes(candidate)) continue;
        if (!isCharacterFree(r, candidate)) continue;
        const next = assignTask(r, candidate, 'vigia');
        if (next) {
          r = next;
          break;
        }
      }
    }
    // 2. Tareas de preparación para los demás libres.
    for (const id of PARTY_IDS) {
      r = tryAssign(r, id, PREP_TASKS[id] ?? ['envolver_regalo']);
    }
    // 3. Resolver la hora con el duelo.
    const res = resolveHour(r, outcome);
    results.push(res);
    run = res.run;
  }
  return { finalRun: run, results };
}

describe('Simulación de partida ganable (mejora Fase 4)', () => {
  it("con duelos en 'draw' (partial) y vigía competente: los villanos nunca arruinan la partida", () => {
    const { finalRun, results } = playSimulatedGame('partial');
    expect(finalRun.hour).toBe(24);
    expect(results).toHaveLength(17);
    for (const res of results) {
      expect(res.rivalDefeat).toBe(false);
      expect(res.run.rivalBreach).toBeFalsy();
      expect(res.run.meters.despertar).toBeLessThan(100);
    }
    expect(EndingSystem.evaluateEnding(finalRun)?.id).not.toBe('RIVAL_PARTY_DEFEAT');
  });

  it("ganando todos los duelos ('perfect'): la victoria estándar es alcanzable (Preparación >= 70)", () => {
    const { finalRun, results } = playSimulatedGame('perfect');
    expect(finalRun.hour).toBe(24);
    for (const res of results) {
      expect(res.rivalDefeat).toBe(false);
      expect(res.run.meters.despertar).toBeLessThan(100);
    }
    expect(finalRun.meters.preparacion).toBeGreaterThanOrEqual(70);
    expect(EndingSystem.evaluateEnding(finalRun)?.id).toBe('STANDARD_VICTORY');
  });
});
