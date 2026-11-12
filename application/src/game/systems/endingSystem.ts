import { GameRun, EndingDefinition } from '@/types/game.types';
import { ENDINGS_DATA } from '@/data/endings/endings.data';
import {
  MANAGEMENT_END_HOUR,
  VICTORY_PREPARATION_THRESHOLD,
} from '@/game/core/balance';

/**
 * Evaluación de finales de la gestión por horas (Fase 3).
 * Solo final estándar en esta fase (sin cadenas atípicas):
 * 1. Despertar = 100 en cualquier momento → se despertó (derrota).
 * 2. Moral = 0 → el grupo abandona (derrota).
 * 3. Al llegar a las 24:00 → victoria si Preparación >= umbral;
 *    si no, la fiesta floja (final parcial / derrota suave).
 */
export class EndingSystem {
  static evaluateEnding(run: GameRun): EndingDefinition | null {
    // Fase 4: si Jose ganó su showdown y entró, el final es el rival,
    // antes que cualquier otro chequeo (incluso Despertar/Moral).
    if (run.rivalBreach) {
      return ENDINGS_DATA.RIVAL_PARTY_DEFEAT;
    }

    if (run.meters.despertar >= 100) {
      return ENDINGS_DATA.WAKE_DEFEAT;
    }

    if (run.meters.morale <= 0) {
      return ENDINGS_DATA.MORALE_DEFEAT;
    }

    if (run.hour >= MANAGEMENT_END_HOUR) {
      return run.meters.preparacion >= VICTORY_PREPARATION_THRESHOLD
        ? ENDINGS_DATA.STANDARD_VICTORY
        : ENDINGS_DATA.WEAK_PARTY_ENDING;
    }

    return null;
  }
}
