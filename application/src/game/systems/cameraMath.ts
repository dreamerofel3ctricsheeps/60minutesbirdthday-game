import { Direction } from '@/types/sprite.types';

/**
 * Matemáticas puras de la cámara rotativa (Fase 1).
 *
 * Convención de yaw (radianes, rotación alrededor del eje Y):
 * - yaw = 0: la cámara está al sur del jugador (+Z) y mira hacia -Z.
 *   En pantalla: arriba = -Z (mundo), derecha = +X (mundo).
 * - El offset de cámara rota con el yaw: offset = (sin(yaw), cos(yaw)) * dist
 *   en el plano XZ, manteniendo la altura.
 * - "Forward" (W) siempre ALEJA al personaje de la cámara.
 */

export interface InputVector {
  /** Eje de pantalla: +1 = derecha (D), -1 = izquierda (A) */
  right: number;
  /** Eje de pantalla: +1 = alejar de la cámara (W), -1 = acercar (S) */
  forward: number;
}

export interface WorldVector {
  x: number;
  z: number;
}

/** Vector "hacia adelante" de la cámara (a dónde mira) en el plano XZ. */
export function cameraForward(yaw: number): WorldVector {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

/** Vector "derecha" de la cámara en el plano XZ. */
export function cameraRight(yaw: number): WorldVector {
  const f = cameraForward(yaw);
  return { x: -f.z, z: f.x };
}

/**
 * Rotación del input por el yaw: convierte el input en espacio de pantalla
 * (right/forward) a un vector de movimiento en el mundo. El resultado viene
 * normalizado cuando hay movimiento (para que las diagonales no corran más).
 */
export function cameraRelativeMove(input: InputVector, yaw: number): WorldVector {
  const f = cameraForward(yaw);
  const r = cameraRight(yaw);
  const x = r.x * input.right + f.x * input.forward;
  const z = r.z * input.right + f.z * input.forward;
  const len = Math.hypot(x, z);
  if (len === 0) return { x: 0, z: 0 };
  return { x: x / len, z: z / len };
}

/**
 * Dirección de animación en ESPACIO DE CÁMARA para un movimiento del mundo:
 * alejarse de la cámara (pantalla-arriba) = 'up' (sprite de espaldas),
 * acercarse = 'down' (sprite de frente), y laterales según pantalla.
 * Con empate entre ejes gana el eje forward/back (criterio histórico).
 */
export function directionInCameraSpace(move: WorldVector, yaw: number): Direction {
  const f = cameraForward(yaw);
  const r = cameraRight(yaw);
  const forwardComp = move.x * f.x + move.z * f.z;
  const rightComp = move.x * r.x + move.z * r.z;
  if (Math.abs(forwardComp) >= Math.abs(rightComp)) {
    return forwardComp > 0 ? 'up' : 'down';
  }
  return rightComp > 0 ? 'right' : 'left';
}

/** Diferencia angular más corta entre dos ángulos, en (-PI, PI]. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Avanza `current` hacia `target` por el camino más corto con amortiguación
 * exponencial (equivalente a THREE.MathUtils.damp, sin depender de three).
 */
export function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  const d = angleDelta(current, target);
  const t = 1 - Math.exp(-lambda * delta);
  return current + d * t;
}
