import { GameRun, TaskDefinition } from '@/types/game.types';
import { TASKS_DATA } from '@/data/management/tasks.data';
import { RANDOM_EVENT_POOL, getManagementEvent } from '@/data/events/managementEvents.data';
import { ManagementEventDefinition } from '@/types/game.types';
import {
  MANAGEMENT_END_HOUR,
  DESPERTAR_QUIET_DECAY,
  MORALE_HOURLY_DECAY,
  RANDOM_EVENT_PROBABILITY,
} from '@/game/core/balance';

/**
 * Lógica PURA de la fase de gestión por horas (Fase 3).
 * Nada de esto toca stores ni React: recibe un GameRun y devuelve uno
 * nuevo, para poder probarlo todo con tests unitarios.
 */

const clampMeter = (v: number) => Math.max(0, Math.min(100, v));

/** Formatea la hora del reloj de gestión: 7 → "07:00", 24 → "00:00". */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  return `${h.toString().padStart(2, '0')}:00`;
}

/** ¿El personaje está libre a la hora actual del run? */
export function isCharacterFree(run: GameRun, characterId: string): boolean {
  const c = run.characters.find((x) => x.characterId === characterId);
  if (!c || !c.available) return false;
  return !c.currentTaskId || (c.busyUntilHour !== undefined && c.busyUntilHour <= run.hour);
}

/** Personajes del grupo (disponibles tras la recolección). */
export function getPartyCharacters(run: GameRun) {
  return run.characters.filter((c) => c.available);
}

/**
 * Asigna una tarea a un roomie libre.
 * Devuelve el run actualizado o null si la asignación no es válida
 * (personaje ocupado/inexistente, tarea inexistente o no cabe antes
 * de las 00:00: una tarea debe poder COMPLETARSE dentro del día).
 */
export function assignTask(run: GameRun, characterId: string, taskId: string): GameRun | null {
  const task = TASKS_DATA[taskId];
  if (!task) return null;
  if (!isCharacterFree(run, characterId)) return null;
  if (run.hour + task.durationHours > MANAGEMENT_END_HOUR) return null;

  const characters = run.characters.map((c) =>
    c.characterId === characterId
      ? {
          ...c,
          currentTaskId: taskId,
          taskStartedHour: run.hour,
          busyUntilHour: run.hour + task.durationHours,
        }
      : c
  );
  return { ...run, characters };
}

export interface CompletedTask {
  characterId: string;
  task: TaskDefinition;
  preparationGained: number;
  despertarDelta: number;
}

export interface HourTickResult {
  run: GameRun;
  completedTasks: CompletedTask[];
}

/** Ganancia real de una tarea al completarla (aplica bonus por afinidad). */
export function taskOutcome(task: TaskDefinition, characterId: string) {
  const isAffinity = task.affinityCharacterIds?.includes(characterId) ?? false;
  const preparationGained = isAffinity
    ? Math.ceil(task.preparationGain * 1.5)
    : task.preparationGain;
  const noiseApplied = isAffinity ? Math.max(0, task.noise - 2) : task.noise;
  return { isAffinity, preparationGained, noiseApplied };
}

/**
 * Avanza el reloj UNA hora:
 * 1. hour + 1 (tope MANAGEMENT_END_HOUR).
 * 2. Las tareas que cumplen su duración se COMPLETAN: aplican
 *    Preparación, ruido→Despertar y Moral de la tarea.
 * 3. Si ninguna tarea completada hizo ruido nuevo, Ximena se vuelve a
 *    dormir profundo: Despertar -= DESPERTAR_QUIET_DECAY.
 * 4. La Moral del grupo baja MORALE_HOURLY_DECAY por el cansancio.
 */
export function tickHour(run: GameRun): HourTickResult {
  if (run.hour >= MANAGEMENT_END_HOUR) {
    return { run, completedTasks: [] };
  }
  const newHour = run.hour + 1;
  const completedTasks: CompletedTask[] = [];

  let preparacion = run.meters.preparacion;
  let despertar = run.meters.despertar;
  let morale = run.meters.morale;
  let noiseThisHour = 0;

  const characters = run.characters.map((c) => {
    if (
      c.currentTaskId &&
      c.busyUntilHour !== undefined &&
      c.busyUntilHour <= newHour
    ) {
      const task = TASKS_DATA[c.currentTaskId];
      if (task) {
        const { preparationGained, noiseApplied } = taskOutcome(task, c.characterId);
        const despertarDelta = noiseApplied + (task.despertarDelta ?? 0);
        preparacion += preparationGained;
        despertar += despertarDelta;
        noiseThisHour += noiseApplied;
        if (task.moraleDelta) morale += task.moraleDelta;
        completedTasks.push({
          characterId: c.characterId,
          task,
          preparationGained,
          despertarDelta,
        });
      }
      return { ...c, currentTaskId: undefined, taskStartedHour: undefined, busyUntilHour: undefined };
    }
    return c;
  });

  if (noiseThisHour === 0) {
    despertar -= DESPERTAR_QUIET_DECAY;
  }
  morale -= MORALE_HOURLY_DECAY;

  return {
    run: {
      ...run,
      hour: newHour,
      characters,
      meters: {
        ...run.meters,
        preparacion: clampMeter(preparacion),
        despertar: clampMeter(despertar),
        morale: clampMeter(morale),
      },
    },
    completedTasks,
  };
}

/** ¿Hay un vigía activo AHORA (tarea 'vigia' en curso)? */
export function getActiveGuardian(run: GameRun) {
  return (
    run.characters.find(
      (c) =>
        c.available &&
        c.currentTaskId === 'vigia' &&
        c.busyUntilHour !== undefined &&
        c.busyUntilHour > run.hour
    ) ?? null
  );
}

export function isGuardianActive(run: GameRun): boolean {
  return getActiveGuardian(run) !== null;
}

export interface Interceptor {
  characterId: string;
  stealth: number;
  isGuardian: boolean;
}

/**
 * Quién intercepta un disturbio:
 * 1. El VIGÍA activo, si lo hay (intercepta con ventaja: es su trabajo).
 * 2. Si no, el roomie LIBRE con más Sigilo.
 * 3. Si no hay nadie libre, null (el minijuego se juega en modo duro).
 */
export function pickInterceptor(
  run: GameRun,
  stealthByCharacter: Record<string, number>
): Interceptor | null {
  const guardian = getActiveGuardian(run);
  if (guardian) {
    return {
      characterId: guardian.characterId,
      stealth: stealthByCharacter[guardian.characterId] ?? 5,
      isGuardian: true,
    };
  }
  const free = run.characters.filter((c) => isCharacterFree(run, c.characterId));
  if (free.length === 0) return null;
  const best = [...free].sort(
    (a, b) =>
      (stealthByCharacter[b.characterId] ?? 0) - (stealthByCharacter[a.characterId] ?? 0)
  )[0];
  return {
    characterId: best.characterId,
    stealth: stealthByCharacter[best.characterId] ?? 5,
    isGuardian: false,
  };
}

/**
 * Sorteo de evento aleatorio de la hora. Función pura con RNG inyectado:
 * si rng() < probabilidad, devuelve un evento del pool (elegido con el
 * mismo rng); si no, null.
 */
export function rollRandomEvent(
  rng: () => number,
  probability: number = RANDOM_EVENT_PROBABILITY
): ManagementEventDefinition | null {
  if (rng() >= probability) return null;
  const idx = Math.floor(rng() * RANDOM_EVENT_POOL.length) % RANDOM_EVENT_POOL.length;
  return getManagementEvent(RANDOM_EVENT_POOL[idx]) ?? null;
}
