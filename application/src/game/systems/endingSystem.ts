import { GameRun, EndingDefinition } from '@/types/game.types';
import { ENDINGS_DATA } from '@/data/endings/endings.data';

export class EndingSystem {
  static evaluateEnding(run: GameRun): EndingDefinition | null {
    // 1. Prioridad: Derrotas absolutas por medidores
    if (run.meters.suspicion >= 100) {
      return ENDINGS_DATA.SUSPICION_DEFEAT;
    }

    if (run.meters.morale <= 0) {
      return ENDINGS_DATA.MORALE_DEFEAT;
    }

    if (run.meters.noise >= 100) {
      return ENDINGS_DATA.POLICE_RAID;
    }

    if (run.resources.food <= 0 && run.resources.water <= 0) {
      return ENDINGS_DATA.STARVATION_DEFEAT;
    }

    // 2. Cadenas especiales (WASP-103b)
    const spaceChain = run.activeChains.find((c) => c.id === 'chain_space');
    if (spaceChain && spaceChain.status === 'COMPLETED') {
      return ENDINGS_DATA.SPACE_VICTORY;
    }

    // 3. Si sobrevivieron hasta el día final (Día 5 o 7 de fiesta)
    if (run.day >= 5) {
      return ENDINGS_DATA.STANDARD_VICTORY;
    }

    return null;
  }
}
