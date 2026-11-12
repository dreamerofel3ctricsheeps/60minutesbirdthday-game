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

// ---------------------------------------------------------------------------
// Fase 4: villanos (Jose y su gato calicó) y minijuego por hora
// Los villanos avanzan por zonas hacia el cuarto de Ximena para despertarla
// y llevarla a SU fiesta rival. El vigía puede retrasar a uno por hora.
// ---------------------------------------------------------------------------

/**
 * MEJORA Fase 4 (playtest de Jose): los villanos son una amenaza DESDE
 * EL INICIO. Ambos están activos desde las 7:00, partiendo de la zona
 * exterior; ya no hay "apariciones" a mitad de partida.
 * Las horas 13 y 15 quedan como ESCALADAS narrativas y de IA:
 * - 13:00 — el gato se pone atrevido: en los duelos se equivoca menos.
 * - 15:00 — Jose redobla su plan: en los duelos corre/atrapa más rápido.
 */
export const CAT_ESCALATION_HOUR = 13;
export const JOSE_ESCALATION_HOUR = 15;

/** Despertar que suma cada avance del gato. */
export const CAT_ADVANCE_DESPERTAR = 4;

/** Despertar que suma cada avance de Jose. */
export const JOSE_ADVANCE_DESPERTAR = 6;

/** Despertar que suma el gato si PIERDE su showdown y entra al cuarto. */
export const CAT_BREACH_DESPERTAR = 25;

/** Buenos que hay que atrapar en "Atrapa la cena" para un resultado sólido. */
export const CATCH_GOOD_TARGET = 8;

// ---------------------------------------------------------------------------
// MEJORA Fase 4: DUELOS en escena contra los villanos (inspiración
// Mario Party investigada — ver game/systems/duelSystem.ts y
// game/systems/hourMinigames.ts para el mapeo inspiración → duelo).
// Cada duelo dura ~25–45 s o se estructura en rondas (mejor de 5).
// ---------------------------------------------------------------------------

/** Ítems que caen en el "Duelo de la cena" (cocina vs Jose), ~30 s. */
export const CATCH_DUEL_TOTAL_ITEMS = 30;
/** Intervalo entre ítems que caen en el duelo de la cena (ms). */
export const CATCH_DUEL_SPAWN_MS = 780;
/** Rondas del duelo de alfombras (sala vs gato): gana quien llegue a 3. */
export const CARPETS_DUEL_MAX_ROUNDS = 5;
export const CARPETS_DUEL_ROUNDS_TO_WIN = 3;
/** Pasos de pasillo por manga en la "Carrera al timbre" (puerta/showdown). */
export const RACE_DUEL_TARGET_STEPS = 10;
/** La carrera se corre en mangas: gana quien se lleve 2 de hasta 3 mangas. */
export const RACE_DUEL_MAX_HEATS = 3;
export const RACE_DUEL_HEATS_TO_WIN = 2;
/** Ventaja inicial de Jose en su showdown de la puerta (pasos). */
export const RACE_DUEL_SHOWDOWN_JOSE_HEAD_START = 4;
/** Ventaja inicial del gato en su showdown de la puerta (pasos). */
export const RACE_DUEL_SHOWDOWN_CAT_HEAD_START = 3;
/** Rondas de la "Ducha silenciosa" (baño vs gato): gana quien llegue a 3. */
export const SHOWER_DUEL_ROUNDS = 5;
export const SHOWER_DUEL_ROUNDS_TO_WIN = 3;

// --- Minijuego TIMING "Sin hacer ruido" ---
/** Intentos del minijuego de timing. */
export const TIMING_ATTEMPTS = 3;
/** Zona verde de la barra de timing (porcentaje, centro 50). */
export const TIMING_GREEN_MIN = 40;
export const TIMING_GREEN_MAX = 60;
/** Zona amarilla alrededor de la verde. */
export const TIMING_YELLOW_MIN = 25;
export const TIMING_YELLOW_MAX = 75;
