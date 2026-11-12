import { describe, it, expect } from 'vitest';
import { GameRun } from '@/types/game.types';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import {
  assignTask,
  tickHour,
  formatHour,
  isGuardianActive,
  pickInterceptor,
  rollRandomEvent,
} from '@/game/systems/managementSystem';
import {
  generateQteSequence,
  qteTimePerKeyMs,
  scoreQte,
  keyToDirection,
  timingZoneAt,
  timingPrecision,
  scoreTiming,
  QTE_DESPERTAR_DELTAS,
  QTE_DIRECTIONS,
} from '@/game/systems/minigames';
import { createSeededRng } from '@/game/systems/seededRng';
import { EndingSystem } from '@/game/systems/endingSystem';
import { getBeatAtHour } from '@/data/events/storyBeats.data';
import { MANAGEMENT_EVENTS } from '@/data/events/managementEvents.data';
import {
  QTE_BASE_MS_PER_KEY,
  QTE_NO_INTERCEPTOR_MS_PER_KEY,
  QTE_SEQUENCE_LENGTH,
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

const STEALTH: Record<string, number> = Object.fromEntries(
  Object.values(CHARACTERS_DATA).map((c) => [c.id, c.attributes.stealth])
);

describe('Gestión por horas (Fase 3)', () => {
  it('formatHour mapea 7 → 07:00 y 24 → 00:00', () => {
    expect(formatHour(7)).toBe('07:00');
    expect(formatHour(13)).toBe('13:00');
    expect(formatHour(24)).toBe('00:00');
  });

  it('tickHour avanza una hora y no pasa de las 24', () => {
    const run = makeRun();
    const { run: next } = tickHour(run);
    expect(next.hour).toBe(8);
    const atEnd = makeRun({ hour: 24 });
    expect(tickHour(atEnd).run.hour).toBe(24);
  });

  it('asignar tarea ocupa al roomie y se libera al cumplir su duración', () => {
    const run = makeRun();
    const assigned = assignTask(run, 'fatima', 'cocinar'); // 3h
    expect(assigned).not.toBeNull();
    expect(assigned!.characters.find((c) => c.characterId === 'fatima')?.busyUntilHour).toBe(10);
    // No puede tomar otra mientras está ocupada
    expect(assignTask(assigned!, 'fatima', 'descansar')).toBeNull();

    let r = assigned!;
    r = tickHour(r).run; // 8
    r = tickHour(r).run; // 9
    const finalTick = tickHour(r); // 10 → se completa
    expect(finalTick.completedTasks.map((t) => t.task.id)).toContain('cocinar');
    const fatima = finalTick.run.characters.find((c) => c.characterId === 'fatima');
    expect(fatima?.currentTaskId).toBeUndefined();
  });

  it('una tarea que no cabe antes de las 00:00 no se puede asignar', () => {
    const run = makeRun({ hour: 23 });
    expect(assignTask(run, 'fatima', 'cocinar')).toBeNull(); // 3h → terminaría a las 26
    expect(assignTask(run, 'natalia', 'inflar_globos')).not.toBeNull(); // 1h → 24 ✔
  });

  it('al completarse, la tarea suma Preparación y su ruido a Despertar; la afinidad da bonus y menos ruido', () => {
    // Fátima es afín a Cocinar: prep 18 * 1.5 = 27, ruido 5 - 2 = 3
    let run = assignTask(makeRun(), 'fatima', 'cocinar')!;
    run = tickHour(run).run;
    run = tickHour(run).run;
    const { run: done, completedTasks } = tickHour(run);
    expect(completedTasks[0].preparationGained).toBe(27);
    expect(done.meters.preparacion).toBe(27);
    // Despertar: 5 inicial, -4 en las horas tranquilas 8 y 9 (clamp a 0)
    // y +3 de ruido al completarse la cocina a las 10 → 3.
    expect(done.meters.despertar).toBe(3);
  });

  it('en una hora tranquila (sin ruido nuevo) el Despertar baja', () => {
    const run = makeRun({ meters: { despertar: 40, preparacion: 0, morale: 80, noise: 0 } });
    const { run: next } = tickHour(run);
    expect(next.meters.despertar).toBe(36); // -4 por sueño profundo
    expect(next.meters.morale).toBe(79); // -1 de cansancio por hora
  });

  it('el vigía activo se detecta y es el interceptor prioritario', () => {
    const run = assignTask(makeRun(), 'itzel', 'vigia')!;
    expect(isGuardianActive(run)).toBe(true);
    const interceptor = pickInterceptor(run, STEALTH);
    expect(interceptor?.characterId).toBe('itzel');
    expect(interceptor?.isGuardian).toBe(true);
  });

  it('sin vigía, intercepta el libre con más Sigilo (Majo, 9); sin nadie libre, null', () => {
    const run = makeRun();
    const interceptor = pickInterceptor(run, STEALTH);
    expect(interceptor?.characterId).toBe('majo');

    const soloRun = makeRun({
      characters: run.characters.map((c) => ({
        ...c,
        currentTaskId: 'cocinar',
        busyUntilHour: 20,
      })),
    });
    expect(pickInterceptor(soloRun, STEALTH)).toBeNull();
  });

  it('rollRandomEvent es determinista con el rng inyectado', () => {
    expect(rollRandomEvent(() => 0.99)).toBeNull(); // sobre la probabilidad
    const ev = rollRandomEvent(() => 0); // bajo prob. y primer índice
    expect(ev?.id).toBe('disturbio_paloma');
  });
});

describe('Final estándar (Fase 3)', () => {
  it('a las 24 con Preparación >= 70 → STANDARD_VICTORY', () => {
    const run = makeRun({
      hour: 24,
      meters: { despertar: 30, preparacion: 75, morale: 50, noise: 0 },
    });
    expect(EndingSystem.evaluateEnding(run)?.id).toBe('STANDARD_VICTORY');
  });

  it('a las 24 con Preparación < 70 → WEAK_PARTY_ENDING', () => {
    const run = makeRun({
      hour: 24,
      meters: { despertar: 30, preparacion: 40, morale: 50, noise: 0 },
    });
    expect(EndingSystem.evaluateEnding(run)?.id).toBe('WEAK_PARTY_ENDING');
  });

  it('Despertar 100 en cualquier hora → WAKE_DEFEAT; Moral 0 → MORALE_DEFEAT; antes de las 24 sin derrotas → null', () => {
    expect(
      EndingSystem.evaluateEnding(
        makeRun({ meters: { despertar: 100, preparacion: 90, morale: 80, noise: 0 } })
      )?.id
    ).toBe('WAKE_DEFEAT');
    expect(
      EndingSystem.evaluateEnding(
        makeRun({ meters: { despertar: 10, preparacion: 0, morale: 0, noise: 0 } })
      )?.id
    ).toBe('MORALE_DEFEAT');
    expect(EndingSystem.evaluateEnding(makeRun())).toBeNull();
  });
});

describe('Minijuego QTE', () => {
  it('genera secuencias deterministas con seed y más largas sin interceptor', () => {
    const a = generateQteSequence(createSeededRng(7), true);
    const b = generateQteSequence(createSeededRng(7), true);
    expect(a).toEqual(b);
    expect(a.length).toBe(QTE_SEQUENCE_LENGTH);
    a.forEach((d) => expect(QTE_DIRECTIONS).toContain(d));
    const hard = generateQteSequence(createSeededRng(7), false);
    expect(hard.length).toBe(QTE_SEQUENCE_LENGTH + 1);
  });

  it('el tiempo por tecla crece con el Sigilo y cae al castigo sin interceptor', () => {
    expect(qteTimePerKeyMs(9)).toBeGreaterThan(qteTimePerKeyMs(3));
    expect(qteTimePerKeyMs(9)).toBe(QTE_BASE_MS_PER_KEY + 9 * 70);
    expect(qteTimePerKeyMs(null)).toBe(QTE_NO_INTERCEPTOR_MS_PER_KEY);
  });

  it('puntuación: perfecto sin fallos, parcial con la mitad, fallo por debajo', () => {
    expect(scoreQte(5, 0, 5)).toBe('perfect');
    expect(scoreQte(3, 2, 5)).toBe('partial');
    expect(scoreQte(1, 4, 5)).toBe('fail');
    expect(QTE_DESPERTAR_DELTAS.perfect).toBeLessThan(0);
    expect(QTE_DESPERTAR_DELTAS.fail).toBeGreaterThan(QTE_DESPERTAR_DELTAS.partial);
  });

  it('keyToDirection acepta flechas y WASD', () => {
    expect(keyToDirection('ArrowUp')).toBe('up');
    expect(keyToDirection('a')).toBe('left');
    expect(keyToDirection('S')).toBe('down');
    expect(keyToDirection('x')).toBeNull();
  });
});

describe('Minijuego Timing', () => {
  it('zonas: verde al centro, amarilla alrededor, roja en los extremos', () => {
    expect(timingZoneAt(50)).toBe('green');
    expect(timingZoneAt(30)).toBe('yellow');
    expect(timingZoneAt(5)).toBe('red');
    expect(timingPrecision(50)).toBe(100);
    expect(timingPrecision(0)).toBe(0);
  });

  it('scoreTiming promedia los intentos', () => {
    expect(scoreTiming([50, 48, 52])).toBe('perfect');
    expect(scoreTiming([30, 70, 50])).toBe('partial');
    expect(scoreTiming([0, 100, 5])).toBe('fail');
  });
});

describe('Beats de historia y eventos de disturbio', () => {
  it('hay beat de intro a las 7 y el primer disturbio (gato) a las 13', () => {
    expect(getBeatAtHour(7)?.id).toBe('beat_intro');
    const beat13 = getBeatAtHour(13);
    expect(beat13?.eventId).toBe('disturbio_gato');
    expect(MANAGEMENT_EVENTS['disturbio_gato'].kind).toBe('minigame-qte');
    expect(getBeatAtHour(9)).toBeUndefined();
  });

  it('el framework cubre los disturbios pedidos: gato QTE, paloma timing, alarma, timbre choice', () => {
    expect(MANAGEMENT_EVENTS['disturbio_paloma'].kind).toBe('minigame-timing');
    expect(['minigame-qte', 'minigame-timing']).toContain(
      MANAGEMENT_EVENTS['disturbio_alarma'].kind
    );
    expect(MANAGEMENT_EVENTS['disturbio_timbre'].kind).toBe('choice');
  });
});
