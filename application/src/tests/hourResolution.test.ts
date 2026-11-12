import { describe, it, expect } from 'vitest';
import { GameRun } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import {
  assignTask,
  tickHour,
  isGuardianActive,
  isCharacterFree,
} from '@/game/systems/managementSystem';
import {
  scoreCatch,
  scoreBalloon,
  generateBalloonSequence,
  MinigameOutcome,
  QTE_DIRECTIONS,
} from '@/game/systems/minigames';
import { createSeededRng } from '@/game/systems/seededRng';
import { getHourMinigame, HOUR_MINIGAME_EFFECTS } from '@/game/systems/hourMinigames';
import { resolveHour, HourResolutionResult } from '@/game/systems/hourResolution';
import { EndingSystem } from '@/game/systems/endingSystem';
import {
  CAT_ADVANCE_DESPERTAR,
  JOSE_ADVANCE_DESPERTAR,
  CAT_BREACH_DESPERTAR,
  BALLOON_SEQUENCE_LENGTH,
  CATCH_GOOD_TARGET,
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

describe('Minijuego por hora (Fase 4): rotación de getHourMinigame', () => {
  it('rota cocina → sala → puerta → baño desde las 7 y repite a las 11', () => {
    const at = (hour: number) => getHourMinigame(makeRun({ hour }));
    expect(at(7)).toMatchObject({ kind: 'catch', zone: 'cocina', title: 'Atrapa la cena' });
    expect(at(8)).toMatchObject({ kind: 'balloon', zone: 'sala', title: 'Ritmo de globos' });
    expect(at(9)).toMatchObject({ kind: 'qte', zone: 'puerta' });
    expect(at(10)).toMatchObject({ kind: 'timing', zone: 'bano', title: 'Sin hacer ruido' });
    expect(at(11)).toMatchObject({ kind: 'catch', zone: 'cocina' });
    expect(at(12)).toMatchObject({ kind: 'balloon', zone: 'sala' });
  });

  it('el showdown tiene prioridad sobre la rotación', () => {
    // A las 14 tocaría timing (baño), pero el gato está en la puerta.
    const catRun = makeRun({ hour: 14, villains: { joseZone: 0, gatoZone: 3 } });
    expect(getHourMinigame(catRun)).toMatchObject({
      kind: 'showdown',
      zone: 'puerta',
      villain: 'gato',
    });
    // A las 16 tocaría balloon (sala), pero Jose está en la puerta.
    const joseRun = makeRun({ hour: 16, villains: { joseZone: 3, gatoZone: 0 } });
    expect(getHourMinigame(joseRun)).toMatchObject({
      kind: 'showdown',
      zone: 'puerta',
      villain: 'jose',
    });
  });

  it('la tabla de efectos de la hora es la de Jose: perfect +6/-4, fail +8 Despertar', () => {
    expect(HOUR_MINIGAME_EFFECTS.perfect).toEqual({ preparacion: 6, despertar: -4 });
    expect(HOUR_MINIGAME_EFFECTS.partial).toEqual({ preparacion: 0, despertar: 0 });
    expect(HOUR_MINIGAME_EFFECTS.fail).toEqual({ preparacion: 0, despertar: 8 });
  });
});

describe('Minijuegos nuevos (Fase 4): catch y balloon', () => {
  it('scoreCatch: perfect con 10+ buenos y máx. 1 malo; partial desde la meta -2', () => {
    expect(CATCH_GOOD_TARGET).toBe(8);
    expect(scoreCatch(10, 0)).toBe('perfect');
    expect(scoreCatch(12, 1)).toBe('perfect');
    expect(scoreCatch(10, 2)).toBe('partial'); // muchos malos arruinan el perfect
    expect(scoreCatch(8, 0)).toBe('partial');
    expect(scoreCatch(6, 3)).toBe('partial');
    expect(scoreCatch(5, 0)).toBe('fail');
    expect(scoreCatch(0, 0)).toBe('fail');
  });

  it('generateBalloonSequence es determinista y usa las direcciones del QTE', () => {
    const a = generateBalloonSequence(createSeededRng(3));
    const b = generateBalloonSequence(createSeededRng(3));
    expect(a).toEqual(b);
    expect(a.length).toBe(BALLOON_SEQUENCE_LENGTH);
    a.forEach((d) => expect(QTE_DIRECTIONS).toContain(d));
    expect(generateBalloonSequence(createSeededRng(3), 3).length).toBe(3);
  });

  it('scoreBalloon: 0 fallos perfect, 1 partial, 2+ fail', () => {
    expect(scoreBalloon(0)).toBe('perfect');
    expect(scoreBalloon(1)).toBe('partial');
    expect(scoreBalloon(2)).toBe('fail');
    expect(scoreBalloon(5)).toBe('fail');
  });
});

describe('resolveHour (Fase 4): efectos del minijuego sin villanos', () => {
  it("hora 8 con 'perfect' aplica la tabla: Preparación +6, Despertar −4 sobre el tick", () => {
    const run = makeRun({
      hour: 8,
      meters: { despertar: 30, preparacion: 10, morale: 80, noise: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'perfect');
    expect(res.plan.kind).toBe('balloon');
    expect(res.run.hour).toBe(9);
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion + 6);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar - 4);
    expect(res.rivalDefeat).toBe(false);
    expect(res.catBreach).toBe(false);
    expect(res.advancedVillains).toEqual([]);
  });

  it("hora 8 con 'fail' sin showdown: Despertar +8 sobre el tick", () => {
    const run = makeRun({
      hour: 8,
      meters: { despertar: 30, preparacion: 10, morale: 80, noise: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'fail');
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar + 8);
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
  });
});

describe('resolveHour (Fase 4): avance de villanos', () => {
  it('el gato entra a las 13 en zona 0 y su primer avance ocurre al resolver la hora 13', () => {
    const run = makeRun({
      hour: 13,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'partial'); // partial: sin efectos de tabla
    expect(res.run.villains?.gatoZone).toBe(1);
    expect(res.run.villains?.joseZone).toBe(0); // Jose aún no aparece
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar + CAT_ADVANCE_DESPERTAR);
    expect(res.advancedVillains).toContain('gato');
    expect(res.advancedVillains).not.toContain('jose');
  });

  it('Jose avanza cada 2 horas: al resolver 16→17 avanza (+6); al resolver 15→16, no', () => {
    const at16 = makeRun({
      hour: 16,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const ticked16 = tickHour(at16).run;
    const res16 = resolveHour(at16, 'partial');
    expect(res16.run.villains?.joseZone).toBe(1);
    expect(res16.advancedVillains).toContain('jose');
    // A las 16 también avanza el gato (+4): el total incluye ambos avances.
    expect(res16.run.meters.despertar).toBe(
      ticked16.meters.despertar + JOSE_ADVANCE_DESPERTAR + CAT_ADVANCE_DESPERTAR
    );

    const at15 = makeRun({
      hour: 15,
      meters: { despertar: 20, preparacion: 0, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 0 },
    });
    const res15 = resolveHour(at15, 'partial');
    expect(res15.run.villains?.joseZone).toBe(0); // no le tocaba
    expect(res15.advancedVillains).not.toContain('jose');
    expect(res15.run.villains?.gatoZone).toBe(1); // el gato sí, avanza cada hora
  });

  it('un villano EN la puerta no avanza más: espera su showdown', () => {
    const run = makeRun({ hour: 14, villains: { joseZone: 0, gatoZone: 3 } });
    const res = resolveHour(run, 'perfect'); // showdown ganado
    expect(res.plan.kind).toBe('showdown');
    expect(res.advancedVillains).toEqual([]);
  });
});

describe('resolveHour (Fase 4): bloqueo del vigía', () => {
  it('con vigía asignado, el gato por avanzar NO avanza y blockedVillain es el gato', () => {
    const base = makeRun({
      hour: 13,
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
      hour: 16,
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
      hour: 16,
      villains: { joseZone: 1, gatoZone: 1 },
    });
    const assigned = assignTask(base, 'itzel', 'vigia')!;
    const res = resolveHour(assigned, 'partial');
    expect(res.blockedVillain).toBe('jose');
    expect(res.run.villains?.joseZone).toBe(1);
    expect(res.run.villains?.gatoZone).toBe(2); // el gato sí avanzó
  });
});

describe('resolveHour (Fase 4): showdowns', () => {
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
    expect(res.plan).toMatchObject({ kind: 'showdown', villain: 'gato' });
    expect(res.run.villains?.gatoZone).toBe(0);
    expect(res.catBreach).toBe(false);
    expect(res.rivalDefeat).toBe(false);
    expect(res.blockedVillain).toBe('jose');
    // Es showdown: NO se aplica HOUR_MINIGAME_EFFECTS (partial sería 0/0,
    // pero tampoco hay Despertar de avance de Jose por el bloqueo).
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar);
    expect(res.summary.join(' ')).toContain('ovillo de lana');
  });

  it("showdown ganado con 'perfect' tampoco aplica la tabla (+6/-4 es solo de horas normales)", () => {
    const run = makeRun({
      hour: 14,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 3 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'perfect');
    expect(res.plan.kind).toBe('showdown');
    expect(res.run.villains?.gatoZone).toBe(0);
    expect(res.run.meters.preparacion).toBe(ticked.meters.preparacion);
    expect(res.run.meters.despertar).toBe(ticked.meters.despertar);
  });

  it('showdown perdido contra el gato: catBreach, Despertar +25 y el gato vuelve a 0', () => {
    const run = makeRun({
      hour: 14,
      meters: { despertar: 20, preparacion: 10, morale: 80, noise: 0 },
      villains: { joseZone: 0, gatoZone: 3 },
    });
    const ticked = tickHour(run).run;
    const res = resolveHour(run, 'fail');
    expect(res.plan).toMatchObject({ kind: 'showdown', villain: 'gato' });
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
    expect(res.plan).toMatchObject({ kind: 'showdown', villain: 'jose' });
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
    // 3. Resolver la hora con el minijuego.
    const res = resolveHour(r, outcome);
    results.push(res);
    run = res.run;
  }
  return { finalRun: run, results };
}

describe('Simulación de partida ganable (Fase 4)', () => {
  it("con outcome 'partial' y juego competente: los villanos nunca arruinan la partida", () => {
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

  it("con outcome 'perfect' siempre: la victoria estándar es alcanzable (Preparación >= 70)", () => {
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
