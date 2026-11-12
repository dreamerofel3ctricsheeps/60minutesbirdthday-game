/**
 * Constantes de balance de la fase de recolección (Fase 2).
 * Único lugar donde viven estos números: stores y lógica los importan
 * de aquí, sin valores mágicos repartidos por el código.
 *
 * Decisiones de diseño cerradas por Jose (2026-11-12):
 * - Capacidad de carga total del protagonista: 5 espacios.
 * - Un roomie cargado ocupa 3 espacios (va al hombro) y los ítems que
 *   quepan en los 2 restantes los lleva ÉL en las manos.
 * - Máximo 1 roomie cargado a la vez (3 + 3 = 6 > 5).
 * - Grupo por partida: protagonista + máximo 3 roomies recolectados.
 */

/** Espacios totales que puede cargar el protagonista. */
export const CARRY_CAPACITY = 5;

/** Espacios que ocupa un roomie cargado al hombro. */
export const ROOMIE_CARRY_SLOTS = 3;

/** Máximo de roomies recolectados (entregados) por partida. */
export const MAX_COLLECTED_ROOMIES = 3;

/** Seed determinista cuando una escena se abre sin run activa (p. ej. explorador). */
export const DEFAULT_COLLECTION_SEED = 20261112;
