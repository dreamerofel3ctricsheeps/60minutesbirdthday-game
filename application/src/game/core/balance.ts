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

// ---------------------------------------------------------------------------
// Fase 3: gestión por horas en la escena 2D (decisiones de Jose, 2026-11-12)
// La gestión va de las 7:00 a las 00:00 del día del cumpleaños (17 horas).
// Ximena duerme en su cuarto: el medidor clave es DESPERTAR, no sospecha.
// ---------------------------------------------------------------------------

/** Hora en que empieza la gestión (Ximena llega de la guardia y se duerme). */
export const MANAGEMENT_START_HOUR = 7;

/** Hora final: a las 24 (00:00) empieza el cumpleaños y se evalúa el final. */
export const MANAGEMENT_END_HOUR = 24;

/** Preparación mínima para la victoria estándar a las 00:00. */
export const VICTORY_PREPARATION_THRESHOLD = 70;

/** Despertar inicial: llega cansada, duerme profundo pero no es de piedra. */
export const INITIAL_DESPERTAR = 5;

/**
 * En una hora SIN ruido nuevo (ninguna tarea ruidosa se completó),
 * Ximena se vuelve a dormir profundo: Despertar baja esto.
 */
export const DESPERTAR_QUIET_DECAY = 4;

/** Moral que pierde el grupo por cada hora de gestión (cansancio). */
export const MORALE_HOURLY_DECAY = 1;

/** Probabilidad de que una hora sin beat dispare un evento aleatorio. */
export const RANDOM_EVENT_PROBABILITY = 0.35;

/** Preparación que aporta cada ítem recogido exhibido en la repisa (tope). */
export const ITEM_PREPARATION_BONUS = 3;
export const ITEM_PREPARATION_BONUS_CAP = 18;

// --- Minijuego QTE "¡Que no la despierten!" ---
/** Teclas de la secuencia del QTE. */
export const QTE_SEQUENCE_LENGTH = 5;
/** Tiempo base por tecla (ms), antes del bonus por Sigilo. */
export const QTE_BASE_MS_PER_KEY = 1200;
/** Bonus de tiempo por cada punto de Sigilo del que intercepta. */
export const QTE_STEALTH_MS_PER_POINT = 70;
/** Si NADIE puede interceptar: tiempo por tecla (castigo) y teclas extra. */
export const QTE_NO_INTERCEPTOR_MS_PER_KEY = 800;
export const QTE_NO_INTERCEPTOR_EXTRA_KEYS = 1;

// --- Minijuego TIMING "Sin hacer ruido" ---
/** Intentos del minijuego de timing. */
export const TIMING_ATTEMPTS = 3;
/** Zona verde de la barra de timing (porcentaje, centro 50). */
export const TIMING_GREEN_MIN = 40;
export const TIMING_GREEN_MAX = 60;
/** Zona amarilla alrededor de la verde. */
export const TIMING_YELLOW_MIN = 25;
export const TIMING_YELLOW_MAX = 75;
