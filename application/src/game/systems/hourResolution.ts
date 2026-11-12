import { GameRun, VillainId } from '@/types/game.types';
import {
  CAT_ADVANCE_DESPERTAR,
  JOSE_ADVANCE_DESPERTAR,
  CAT_BREACH_DESPERTAR,
} from '@/game/core/balance';
import {
  tickHour,
  isGuardianActive,
  CompletedTask,
} from '@/game/systems/managementSystem';
import { MinigameOutcome } from '@/game/systems/minigames';
import {
  getHourMinigame,
  HOUR_MINIGAME_EFFECTS,
  HourMinigamePlan,
} from '@/game/systems/hourMinigames';
import {
  getVillains,
  isVillainActive,
  dueToAdvance,
  DOOR_ZONE_INDEX,
} from '@/game/systems/villainSystem';

/**
 * Fase 4: resolución COMPLETA de una hora de gestión (lógica pura).
 * Compone, en orden:
 *  a. El plan de minijuego se decide con el estado PRE-tick (el showdown
 *     depende de las zonas al INICIO de la hora).
 *  b. El vigía que cuenta es el que está de guardia DURANTE esta hora.
 *  c. tickHour avanza el reloj y completa las tareas que terminan.
 *  d. Si NO es showdown, el resultado del minijuego aplica su tabla de
 *     efectos (HOUR_MINIGAME_EFFECTS) a Preparación/Despertar.
 *  e. Los villanos se mueven (showdown, bloqueo del vigía y avances).
 */

export interface HourResolutionResult {
  run: GameRun;
  completedTasks: CompletedTask[];
  plan: HourMinigamePlan;
  summary: string[];
  /** Jose ganó su showdown y entró: final rival (ver endingSystem). */
  rivalDefeat: boolean;
  /** El gato ganó su showdown y entró: Despertar += CAT_BREACH_DESPERTAR. */
  catBreach: boolean;
  /** Villano al que el vigía retrasó este tick (no avanzó ni sumó Despertar). */
  blockedVillain?: VillainId;
  /** Villanos que sí avanzaron una zona este tick. */
  advancedVillains: VillainId[];
}

const clampMeter = (v: number) => Math.max(0, Math.min(100, v));

const VILLAIN_IDS: VillainId[] = ['gato', 'jose'];

const VILLAIN_LABEL: Record<VillainId, string> = {
  gato: 'el gato',
  jose: 'Jose',
};

const advanceDespertar = (id: VillainId) =>
  id === 'gato' ? CAT_ADVANCE_DESPERTAR : JOSE_ADVANCE_DESPERTAR;

export function resolveHour(run: GameRun, outcome: MinigameOutcome): HourResolutionResult {
  // a. Plan PRE-tick.
  const plan = getHourMinigame(run);
  const isShowdown = plan.kind === 'showdown';

  // b. Vigía durante ESTA hora (antes del tick que podría liberarlo).
  const guardianActive = isGuardianActive(run);

  // c. Tick de la hora: reloj + tareas completadas.
  const { run: ticked, completedTasks } = tickHour(run);
  const newHour = ticked.hour;

  const summary: string[] = [];
  let preparacion = ticked.meters.preparacion;
  let despertar = ticked.meters.despertar;

  // d. Efectos del minijuego de la hora (nunca en showdown).
  if (!isShowdown) {
    const effect = HOUR_MINIGAME_EFFECTS[outcome];
    preparacion = clampMeter(preparacion + effect.preparacion);
    despertar = clampMeter(despertar + effect.despertar);
  }

  // e. Paso de villanos sobre una copia del estado.
  const villains = { ...getVillains(ticked) };
  const zoneOf = (id: VillainId) => (id === 'gato' ? villains.gatoZone : villains.joseZone);
  const setZone = (id: VillainId, zone: number) => {
    if (id === 'gato') villains.gatoZone = zone;
    else villains.joseZone = zone;
  };

  let rivalDefeat = false;
  let rivalBreach = ticked.rivalBreach ?? false;
  let catBreach = false;
  let blockedVillain: VillainId | undefined;
  const advancedVillains: VillainId[] = [];
  let showdownVillain: VillainId | null = null;

  if (isShowdown && plan.villain) {
    showdownVillain = plan.villain;
    const v = plan.villain;
    if (outcome !== 'fail') {
      // Showdown GANADO: el villano vuelve a la zona exterior.
      setZone(v, 0);
      summary.push(
        v === 'gato'
          ? 'Interceptaron al gato en la puerta y lo distrajeron con un ovillo de lana: volvió al exterior.'
          : 'Interceptaron a Jose en la puerta y lo echaron de vuelta al balcón: su plan rival tendrá que esperar.'
      );
    } else if (v === 'jose') {
      // Showdown PERDIDO contra Jose: entra y despierta a Ximena. Final rival.
      rivalBreach = true;
      rivalDefeat = true;
      summary.push(
        'Jose pasó al vigía, entró al cuarto y despertó a Ximena: se la llevó a SU fiesta sorpresa.'
      );
    } else {
      // Showdown PERDIDO contra el gato: entra, hace ruido y sale corriendo.
      despertar = clampMeter(despertar + CAT_BREACH_DESPERTAR);
      setZone('gato', 0);
      catBreach = true;
      summary.push(
        `El gato se coló al cuarto y saltó sobre la cama: el ruido acercó mucho a Ximena a despertar (+${CAT_BREACH_DESPERTAR} Despertar). El gato huyó al exterior.`
      );
    }
  }

  // Avance normal: villanos no resueltos por el showdown, activos en la
  // hora PRE-tick, con avance debido y sin estar ya en la puerta.
  const candidates = VILLAIN_IDS.filter(
    (id) =>
      id !== showdownVillain &&
      isVillainActive(id, run.hour) &&
      dueToAdvance(id, run.hour, newHour) &&
      zoneOf(id) < DOOR_ZONE_INDEX
  );

  let advancing = [...candidates];
  if (guardianActive && candidates.length > 0) {
    // El vigía bloquea a UNO: el de zona más avanzada (empate → Jose).
    const blocked = [...candidates].sort((a, b) => {
      const byZone = zoneOf(b) - zoneOf(a);
      if (byZone !== 0) return byZone;
      return a === 'jose' ? -1 : 1;
    })[0];
    blockedVillain = blocked;
    advancing = advancing.filter((id) => id !== blocked);
    summary.push(`El vigía retrasó a ${VILLAIN_LABEL[blocked]}: no pudo avanzar esta hora.`);
  }

  for (const id of advancing) {
    setZone(id, zoneOf(id) + 1);
    despertar = clampMeter(despertar + advanceDespertar(id));
    advancedVillains.push(id);
    summary.push(
      `${id === 'gato' ? 'El gato' : 'Jose'} avanzó sigilosamente hacia el cuarto (+${advanceDespertar(id)} Despertar).`
    );
  }

  // f. Run final: villains actualizados, medidores clampados, breach si aplica.
  const finalRun: GameRun = {
    ...ticked,
    villains,
    rivalBreach,
    meters: {
      ...ticked.meters,
      preparacion: clampMeter(preparacion),
      despertar: clampMeter(despertar),
    },
  };

  return {
    run: finalRun,
    completedTasks,
    plan,
    summary,
    rivalDefeat,
    catBreach,
    blockedVillain,
    advancedVillains,
  };
}
