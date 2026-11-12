import { create } from 'zustand';
import { dampAngle } from '@/game/systems/cameraMath';

/**
 * Estado compartido de la cámara rotativa (Fase 1).
 * - targetYaw: a dónde debe apuntar la cámara (múltiplos de 90°, Q/E).
 * - yaw: ángulo suavizado que usa el render; lo avanza CameraController
 *   cada frame vía advanceYaw (los componentes lo leen con getState()
 *   para no re-renderizar por frame).
 */
interface CameraState {
  targetYaw: number;
  yaw: number;
  rotateLeft: () => void;
  rotateRight: () => void;
  advanceYaw: (delta: number) => void;
  resetCamera: () => void;
}

const QUARTER_TURN = Math.PI / 2;
/** Velocidad de la amortiguación del giro (mayor = giro más rápido). */
const YAW_DAMP_LAMBDA = 7;

export const useCameraStore = create<CameraState>((set, get) => ({
  targetYaw: 0,
  yaw: 0,

  // Q: la cámara orbita 90° hacia la izquierda del jugador; E: a la derecha.
  rotateLeft: () => set((s) => ({ targetYaw: s.targetYaw - QUARTER_TURN })),
  rotateRight: () => set((s) => ({ targetYaw: s.targetYaw + QUARTER_TURN })),

  advanceYaw: (delta) => {
    const { yaw, targetYaw } = get();
    const next = dampAngle(yaw, targetYaw, YAW_DAMP_LAMBDA, Math.min(delta, 0.1));
    if (Math.abs(next - yaw) > 1e-6) set({ yaw: next });
  },

  resetCamera: () => set({ targetYaw: 0, yaw: 0 }),
}));
