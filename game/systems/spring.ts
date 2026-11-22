/**
 * Resorte (spring) unidimensional para FÍSICA SECUNDARIA visual
 * (segunda corrección de arte): lo cargado —roomie al hombro, ítems en
 * las manos— ya no va "pegado" al portador; rebota con retardo al
 * caminar, se balancea al girar/correr y se asienta suave al detenerse.
 *
 * Integración semi-implícita de Euler con amortiguamiento exponencial:
 * estable con los dt del loop de render (se clampa a 50ms) y sin
 * dependencias de three.js, para poder probarlo en unit tests puros.
 */
export interface SpringState {
  value: number;
  velocity: number;
}

export const createSpring = (initial = 0): SpringState => ({
  value: initial,
  velocity: 0,
});

/**
 * Avanza el resorte hacia `target`.
 * - stiffness: rigidez (qué tan rápido persigue el objetivo).
 * - damping: amortiguamiento (mayor = menos rebote residual).
 * Devuelve el mismo estado mutado, pensado para refs en useFrame.
 */
export function stepSpring(
  s: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  dt: number
): SpringState {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (step === 0) return s;
  const force = (target - s.value) * stiffness;
  s.velocity += force * step;
  s.velocity *= Math.exp(-damping * step);
  s.value += s.velocity * step;
  return s;
}

/**
 * Señal de balanceo de la carga según el estado de movimiento del
 * portador: amplitud y frecuencia del objetivo que persiguen los
 * resortes. Al correr el balanceo aumenta; en idle el objetivo es 0 y
 * los resortes asientan la carga a reposo.
 */
export function carrySwayTarget(
  state: 'idle' | 'walk' | 'run',
  phase: number
): { y: number; rotZ: number } {
  if (state === 'idle') return { y: 0, rotZ: 0 };
  const amp = state === 'run' ? 1 : 0.55;
  // Desfase respecto al bob del portador: la carga llega TARDE, no va
  // sincronizada como si estuviera pegada.
  return {
    y: Math.sin(phase - 0.9) * 0.055 * amp,
    rotZ: Math.sin(phase - 1.25) * 0.085 * amp,
  };
}

/** Frecuencia de fase del balanceo por estado (rad/s). */
export function carrySwayFrequency(state: 'idle' | 'walk' | 'run'): number {
  return state === 'run' ? 13 : 9;
}
