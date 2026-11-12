import {
  QTE_SEQUENCE_LENGTH,
  QTE_BASE_MS_PER_KEY,
  QTE_STEALTH_MS_PER_POINT,
  QTE_NO_INTERCEPTOR_MS_PER_KEY,
  QTE_NO_INTERCEPTOR_EXTRA_KEYS,
  TIMING_GREEN_MIN,
  TIMING_GREEN_MAX,
  TIMING_YELLOW_MIN,
  TIMING_YELLOW_MAX,
} from '@/game/core/balance';

/**
 * Lógica PURA de los minijuegos de disturbio (Fase 3).
 * Los componentes solo capturan la entrada; toda la puntuación vive aquí
 * y está cubierta por tests.
 */

// ---------------------------------------------------------------------------
// QTE "¡Que no la despierten!"
// ---------------------------------------------------------------------------

export type QteDirection = 'up' | 'down' | 'left' | 'right';
export const QTE_DIRECTIONS: QteDirection[] = ['up', 'down', 'left', 'right'];

export const QTE_DIRECTION_LABEL: Record<QteDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

/** Mapea una tecla (flechas o WASD) a dirección del QTE. */
export function keyToDirection(key: string): QteDirection | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    default:
      return null;
  }
}

/** Genera la secuencia de direcciones con un RNG inyectado (testeable). */
export function generateQteSequence(
  rng: () => number,
  hasInterceptor: boolean,
  length: number = QTE_SEQUENCE_LENGTH
): QteDirection[] {
  const total = hasInterceptor ? length : length + QTE_NO_INTERCEPTOR_EXTRA_KEYS;
  return Array.from(
    { length: total },
    () => QTE_DIRECTIONS[Math.floor(rng() * QTE_DIRECTIONS.length) % QTE_DIRECTIONS.length]
  );
}

/**
 * Tiempo por tecla: el Sigilo del que intercepta da más aire.
 * Sin nadie que intercepte, el tiempo cae al mínimo de castigo.
 */
export function qteTimePerKeyMs(interceptorStealth: number | null): number {
  if (interceptorStealth === null) return QTE_NO_INTERCEPTOR_MS_PER_KEY;
  return QTE_BASE_MS_PER_KEY + interceptorStealth * QTE_STEALTH_MS_PER_POINT;
}

export type MinigameOutcome = 'perfect' | 'partial' | 'fail';

/** Resultado del QTE según aciertos y fallos de la secuencia completa. */
export function scoreQte(hits: number, misses: number, total: number): MinigameOutcome {
  if (misses === 0 && hits >= total) return 'perfect';
  if (hits >= Math.ceil(total / 2)) return 'partial';
  return 'fail';
}

/** Cuánto DESPERTAR aplica cada resultado del QTE. */
export const QTE_DESPERTAR_DELTAS: Record<MinigameOutcome, number> = {
  perfect: -5,
  partial: 8,
  fail: 20,
};

// ---------------------------------------------------------------------------
// TIMING "Sin hacer ruido"
// ---------------------------------------------------------------------------

export type TimingZone = 'green' | 'yellow' | 'red';

/** Zona en la que cayó el marcador (0-100) al detenerlo. */
export function timingZoneAt(position: number): TimingZone {
  if (position >= TIMING_GREEN_MIN && position <= TIMING_GREEN_MAX) return 'green';
  if (position >= TIMING_YELLOW_MIN && position <= TIMING_YELLOW_MAX) return 'yellow';
  return 'red';
}

/** Precisión 0-100 de una detención: 100 = centro exacto de la zona verde. */
export function timingPrecision(position: number): number {
  const center = (TIMING_GREEN_MIN + TIMING_GREEN_MAX) / 2;
  const distance = Math.abs(position - center);
  return Math.max(0, Math.round(100 - distance * 2));
}

/** Resultado global del timing tras todos los intentos (promedio). */
export function scoreTiming(positions: number[]): MinigameOutcome {
  if (positions.length === 0) return 'fail';
  const avg =
    positions.reduce((sum, p) => sum + timingPrecision(p), 0) / positions.length;
  if (avg >= 80) return 'perfect';
  if (avg >= 50) return 'partial';
  return 'fail';
}

/** Cuánto DESPERTAR aplica cada resultado del timing. */
export const TIMING_DESPERTAR_DELTAS: Record<MinigameOutcome, number> = {
  perfect: -2,
  partial: 6,
  fail: 16,
};
