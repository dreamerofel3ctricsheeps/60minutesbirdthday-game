import { describe, it, expect } from 'vitest';
import {
  duelResultToOutcome,
  duelDifficultyRamp,
  getDuelAiProfile,
  catCarpetsErrorProb,
  pickCatCarpet,
  catShowerStopPosition,
  scoreCatchDuel,
  scoreRoundsDuel,
  scoreRaceDuel,
} from '@/game/systems/duelSystem';
import { createSeededRng } from '@/game/systems/seededRng';
import { timingPrecision } from '@/game/systems/minigames';

describe('Duelos: mapeo resultado → outcome de la hora', () => {
  it('win = perfect, draw = partial, loss = fail (la tabla de la Fase 4)', () => {
    expect(duelResultToOutcome('win')).toBe('perfect');
    expect(duelResultToOutcome('draw')).toBe('partial');
    expect(duelResultToOutcome('loss')).toBe('fail');
  });
});

describe('Duelos: rampa de dificultad por hora', () => {
  it('va de 0 a las 7:00 a 1 a las 24:00, acotada', () => {
    expect(duelDifficultyRamp(7)).toBe(0);
    expect(duelDifficultyRamp(24)).toBe(1);
    expect(duelDifficultyRamp(3)).toBe(0);
    expect(duelDifficultyRamp(15)).toBeGreaterThan(0.4);
    expect(duelDifficultyRamp(15)).toBeLessThan(0.55);
  });

  it('los villanos se endurecen con la hora: Jose corre más rápido y el gato se equivoca menos', () => {
    const joseEarly = getDuelAiProfile('jose', 7);
    const joseLate = getDuelAiProfile('jose', 23);
    expect(joseLate.raceStepMs).toBeLessThan(joseEarly.raceStepMs);
    expect(joseLate.catchSpeedRatio).toBeGreaterThan(joseEarly.catchSpeedRatio);
    expect(joseLate.catchErrorProb).toBeLessThan(joseEarly.catchErrorProb);

    const catEarly = getDuelAiProfile('gato', 7);
    const catLate = getDuelAiProfile('gato', 23);
    expect(catLate.carpetsErrorProb).toBeLessThan(catEarly.carpetsErrorProb);
    expect(catLate.showerErrorStd).toBeLessThan(catEarly.showerErrorStd);
  });

  it('pero la IA nunca es imposible: rangos jugables en el peor caso (23:00)', () => {
    const jose = getDuelAiProfile('jose', 23);
    // Jose tarda al menos ~0.7 s/paso: un jugador a ~0.55 s/tecla le gana.
    expect(jose.raceStepMs).toBeGreaterThan(680);
    expect(jose.catchSpeedRatio).toBeLessThanOrEqual(1);
    const gato = getDuelAiProfile('gato', 23);
    // El gato conserva al menos ~10% de error en alfombras y σ ≥ 9 en la ducha.
    expect(gato.carpetsErrorProb).toBeGreaterThanOrEqual(0.1);
    expect(gato.showerErrorStd).toBeGreaterThanOrEqual(9);
  });

  it('escaladas: a las 13 el gato se equivoca menos que a las 12; a las 15 Jose acelera', () => {
    expect(getDuelAiProfile('gato', 13).carpetsErrorProb).toBeLessThan(
      getDuelAiProfile('gato', 12).carpetsErrorProb
    );
    expect(getDuelAiProfile('gato', 13).showerErrorStd).toBeLessThan(
      getDuelAiProfile('gato', 12).showerErrorStd
    );
    expect(getDuelAiProfile('jose', 15).raceStepMs).toBeLessThan(
      getDuelAiProfile('jose', 14).raceStepMs
    );
  });
});

describe('Duelos: alfombras del gato', () => {
  it('su error baja ronda a ronda, con suelo del 8%', () => {
    const profile = getDuelAiProfile('gato', 7);
    expect(catCarpetsErrorProb(profile, 1)).toBeCloseTo(profile.carpetsErrorProb);
    expect(catCarpetsErrorProb(profile, 3)).toBeLessThan(catCarpetsErrorProb(profile, 1));
    expect(catCarpetsErrorProb(profile, 40)).toBe(0.08);
  });

  it('pickCatCarpet: si el azar cae en su error elige otra alfombra; si no, la correcta', () => {
    const profile = getDuelAiProfile('gato', 7);
    // Azar alto (0.999 > prob. de error): siempre acierta la correcta.
    const lucky = () => 0.999;
    for (const correct of [0, 1, 2, 3]) {
      expect(pickCatCarpet(lucky, profile, 1, correct, 4)).toBe(correct);
    }
    // Azar 0 (< prob. de error): siempre se equivoca, a una alfombra válida.
    const unlucky = () => 0;
    for (const correct of [0, 1, 2, 3]) {
      const pick = pickCatCarpet(unlucky, profile, 1, correct, 4);
      expect(pick).not.toBe(correct);
      expect(pick).toBeGreaterThanOrEqual(0);
      expect(pick).toBeLessThan(4);
    }
  });
});

describe('Duelos: la detención del gato en la ducha', () => {
  it('siempre cae en [0, 100] y su precisión media es peor que la de un buen jugador (~90)', () => {
    const profile = getDuelAiProfile('gato', 10);
    const rng = createSeededRng(99);
    let sumPrecision = 0;
    const N = 400;
    for (let i = 0; i < N; i++) {
      const pos = catShowerStopPosition(rng, profile, 1);
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(100);
      sumPrecision += timingPrecision(pos);
    }
    const avg = sumPrecision / N;
    // σ ≈ 15 → precisión esperada ≈ 76; debe quedar claramente bajo 90
    // (ganable con buena ejecución) y sobre 55 (no es un paseo).
    expect(avg).toBeGreaterThan(55);
    expect(avg).toBeLessThan(88);
  });
});

describe('Duelos: puntuaciones puras', () => {
  it('scoreCatchDuel compara netos (buenos − malos)', () => {
    expect(scoreCatchDuel(15, 1, 11, 0)).toBe('win');
    expect(scoreCatchDuel(9, 2, 10, 1)).toBe('loss'); // 7 vs 9
    expect(scoreCatchDuel(10, 2, 9, 1)).toBe('draw'); // 8 vs 8
    expect(scoreCatchDuel(0, 0, 0, 0)).toBe('draw');
  });

  it('scoreRoundsDuel compara rondas ganadas', () => {
    expect(scoreRoundsDuel(3, 1)).toBe('win');
    expect(scoreRoundsDuel(1, 3)).toBe('loss');
    expect(scoreRoundsDuel(2, 2)).toBe('draw');
  });

  it('scoreRaceDuel: llegar a la meta manda; si no, manda ir más avanzado', () => {
    expect(scoreRaceDuel(10, 7, 10)).toBe('win');
    expect(scoreRaceDuel(8, 10, 10)).toBe('loss');
    expect(scoreRaceDuel(7, 5, 10)).toBe('win');
    expect(scoreRaceDuel(5, 5, 10)).toBe('draw');
  });
});
