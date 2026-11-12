import { GameRun, VillainId, VillainRunState } from '@/types/game.types';
import { MANAGEMENT_START_HOUR } from '@/game/core/balance';

/**
 * Lógica PURA de los villanos: Jose y su gato calicó.
 *
 * Los villanos quieren llegar al cuarto de Ximena para despertarla y
 * llevársela a ELLOS darle el mejor cumpleaños (el plan rival).
 * Avanzan por zonas: exterior → cocina → sala → puerta → cuarto.
 * Al llegar a la PUERTA (índice 3) no avanzan más: la hora siguiente se
 * resuelve como SHOWDOWN (ver hourMinigames / hourResolution).
 *
 * MEJORA Fase 4 (playtest de Jose): los villanos son una amenaza DESDE
 * EL INICIO y son el rival en CADA minijuego de la hora (los duelos en
 * escena viven en game/systems/duelSystem.ts). Ambos parten de la zona
 * exterior a las 7:00 y avanzan con este ritmo:
 * - GATO: 1 zona por hora (es el espía rápido de Jose).
 * - JOSE: 1 zona cada 2 horas (avanza al resolver las horas que dejan
 *   el reloj en hora par contando desde las 7: res 8→9, 10→11, …).
 *
 * Simulación de presión (medida con la suite de simulación):
 * sin vigía, el gato llega a la puerta a las 10, 14, 18 y 22 y Jose a
 * las 13 y 19 (showdowns); avances totales: gato 13 × +4 y Jose
 * 8 × +6 = 100 de Despertar acumulado si NADIE los frena — por eso el
 * vigía (bloquea al más avanzado cada hora) y ganar los showdowns son
 * el contrajuego: con vigía constante la presión de avances cae a 36
 * (gato 6 avances + Jose 2) y los showdowns se espacian (17 y 23).
 */

export const VILLAIN_ZONES = ['exterior', 'cocina', 'sala', 'puerta', 'cuarto'] as const;

export type VillainZoneId = (typeof VILLAIN_ZONES)[number];

/** Índice de la zona puerta: ahí el villano espera su showdown. */
export const DOOR_ZONE_INDEX = 3;

/** Índice de la zona del cuarto de Ximena (destino final del villano). */
export const ROOM_ZONE_INDEX = 4;

/** Estado inicial: ambos villanos en el exterior, listos desde las 7:00. */
export const INITIAL_VILLAINS: VillainRunState = { joseZone: 0, gatoZone: 0 };

/** Estado de villanos del run, con fallback para runs sin el campo (Fase 3). */
export function getVillains(run: GameRun): VillainRunState {
  return run.villains ?? INITIAL_VILLAINS;
}

/**
 * ¿El villano está activo a esta hora?
 * MEJORA Fase 4: AMBOS están activos desde el inicio de la gestión
 * (7:00). Las antiguas "apariciones" de las 13/15 son ahora escaladas
 * de la IA de los duelos (ver duelSystem y balance: *_ESCALATION_HOUR).
 */
export function isVillainActive(_id: VillainId, hour: number): boolean {
  return hour >= MANAGEMENT_START_HOUR;
}

/** Índice de zona actual del villano. */
export function villainZoneIndex(run: GameRun, id: VillainId): number {
  const villains = getVillains(run);
  return id === 'gato' ? villains.gatoZone : villains.joseZone;
}

/** ¿El villano está esperando en la puerta (listo para el showdown)? */
export function villainAtDoor(run: GameRun, id: VillainId): boolean {
  return villainZoneIndex(run, id) === DOOR_ZONE_INDEX;
}

/**
 * ¿Le toca avanzar al villano al resolver la hora currentHour → newHour?
 * - Gato: avanza CADA hora desde las 7:00 (activo en currentHour).
 * - Jose: avanza cada 2 horas desde las 7:00: cuando el nuevo reloj
 *   marca un número par de horas transcurridas (res 8→9 sí, 7→8 no).
 */
export function dueToAdvance(id: VillainId, currentHour: number, newHour: number): boolean {
  if (!isVillainActive(id, currentHour)) return false;
  if (id === 'gato') return true;
  return newHour > MANAGEMENT_START_HOUR && (newHour - MANAGEMENT_START_HOUR) % 2 === 0;
}

/**
 * Villano del showdown de esta hora: si algún villano está en la
 * puerta, ese. Si están los dos, manda Jose (es el cerebro del plan
 * rival). Si no hay nadie en la puerta, null (la hora se juega con el
 * duelo normal de su zona).
 */
export function pickShowdownVillain(run: GameRun): VillainId | null {
  if (villainAtDoor(run, 'jose')) return 'jose';
  if (villainAtDoor(run, 'gato')) return 'gato';
  return null;
}
