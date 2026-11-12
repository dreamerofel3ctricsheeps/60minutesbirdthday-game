import { GameRun, VillainId, VillainRunState } from '@/types/game.types';
import {
  VILLAIN_CAT_INTRO_HOUR,
  VILLAIN_JOSE_INTRO_HOUR,
} from '@/game/core/balance';

/**
 * Lógica PURA de los villanos de la Fase 4: Jose y su gato calicó.
 *
 * Los villanos quieren llegar al cuarto de Ximena para despertarla y
 * llevársela a ELLOS darle el mejor cumpleaños (el plan rival).
 * Avanzan por zonas: exterior → cocina → sala → puerta → cuarto.
 * Al llegar a la PUERTA (índice 3) no avanzan más: la hora siguiente se
 * resuelve como SHOWDOWN (ver hourMinigames / hourResolution).
 *
 * La ACTIVACIÓN es derivada de la hora (no hay flag guardado):
 * el gato aparece a las 13 y Jose a las 15, ambos en la zona exterior.
 * Un villano inactivo nunca avanza ni se renderiza.
 */

export const VILLAIN_ZONES = ['exterior', 'cocina', 'sala', 'puerta', 'cuarto'] as const;

export type VillainZoneId = (typeof VILLAIN_ZONES)[number];

/** Índice de la zona puerta: ahí el villano espera su showdown. */
export const DOOR_ZONE_INDEX = 3;

/** Índice de la zona del cuarto de Ximena (destino final del villano). */
export const ROOM_ZONE_INDEX = 4;

/** Estado inicial: ambos villanos fuera de la casa. */
export const INITIAL_VILLAINS: VillainRunState = { joseZone: 0, gatoZone: 0 };

/** Estado de villanos del run, con fallback para runs sin el campo (Fase 3). */
export function getVillains(run: GameRun): VillainRunState {
  return run.villains ?? INITIAL_VILLAINS;
}

/**
 * ¿El villano ya apareció a esta hora?
 * Gato desde las 13, Jose desde las 15.
 */
export function isVillainActive(id: VillainId, hour: number): boolean {
  return id === 'gato' ? hour >= VILLAIN_CAT_INTRO_HOUR : hour >= VILLAIN_JOSE_INTRO_HOUR;
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
 * - Gato: avanza CADA hora desde su aparición (activo en currentHour).
 * - Jose: avanza cada 2 horas desde su aparición: solo cuando el avance
 *   cae en su ritmo (resolver 15→16 no, 16→17 sí, 17→18 no, 18→19 sí…).
 */
export function dueToAdvance(id: VillainId, currentHour: number, newHour: number): boolean {
  if (id === 'gato') {
    return isVillainActive('gato', currentHour);
  }
  return (
    isVillainActive('jose', currentHour) &&
    newHour > VILLAIN_JOSE_INTRO_HOUR &&
    (newHour - VILLAIN_JOSE_INTRO_HOUR) % 2 === 0
  );
}

/**
 * Villano del showdown de esta hora: si algún villano ACTIVO está en la
 * puerta, ese. Si están los dos, manda Jose (es el cerebro del plan rival).
 * Si no hay nadie en la puerta, null (la hora se juega con su minijuego normal).
 */
export function pickShowdownVillain(run: GameRun): VillainId | null {
  if (isVillainActive('jose', run.hour) && villainAtDoor(run, 'jose')) return 'jose';
  if (isVillainActive('gato', run.hour) && villainAtDoor(run, 'gato')) return 'gato';
  return null;
}
