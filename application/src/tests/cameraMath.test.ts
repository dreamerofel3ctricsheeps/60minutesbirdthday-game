import { describe, it, expect } from 'vitest';
import {
  cameraForward,
  cameraRelativeMove,
  directionInCameraSpace,
  angleDelta,
  dampAngle,
} from '@/game/systems/cameraMath';
import {
  ROOMIE_MANIFEST,
  resolveRoomieAnimation,
} from '@/data/characters/roomieSprites.data';
import { RoomieAnimationKey } from '@/types/sprite.types';

const EPS = 1e-9;
const close = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('cameraMath: rotación del input por yaw (Fase 1)', () => {
  it('con yaw=0, W aleja de la cámara hacia -Z y D va a +X (comportamiento histórico)', () => {
    const w = cameraRelativeMove({ right: 0, forward: 1 }, 0);
    expect(close(w.x, 0)).toBe(true);
    expect(close(w.z, -1)).toBe(true);

    const d = cameraRelativeMove({ right: 1, forward: 0 }, 0);
    expect(close(d.x, 1)).toBe(true);
    expect(close(d.z, 0)).toBe(true);
  });

  it('con yaw=90°, W mueve hacia -X y D hacia -Z (la pantalla manda, no el mundo)', () => {
    const w = cameraRelativeMove({ right: 0, forward: 1 }, Math.PI / 2);
    expect(close(w.x, -1)).toBe(true);
    expect(close(w.z, 0)).toBe(true);

    const d = cameraRelativeMove({ right: 1, forward: 0 }, Math.PI / 2);
    expect(close(d.x, 0)).toBe(true);
    expect(close(d.z, -1)).toBe(true);
  });

  it('con yaw=180°, W mueve hacia +Z (la cámara está al otro lado)', () => {
    const w = cameraRelativeMove({ right: 0, forward: 1 }, Math.PI);
    expect(close(w.x, 0)).toBe(true);
    expect(close(w.z, 1)).toBe(true);
  });

  it('normaliza las diagonales y devuelve cero sin input', () => {
    const diag = cameraRelativeMove({ right: 1, forward: 1 }, 0);
    expect(Math.hypot(diag.x, diag.z)).toBeCloseTo(1, 6);
    expect(cameraRelativeMove({ right: 0, forward: 0 }, 1.3)).toEqual({ x: 0, z: 0 });
  });

  it('cameraForward con yaw=0 mira a -Z', () => {
    const f = cameraForward(0);
    expect(close(f.x, 0) && close(f.z, -1)).toBe(true);
  });
});

describe('cameraMath: dirección de animación en espacio de cámara', () => {
  it('con yaw=0: pantalla-arriba = up (espaldas), abajo = down (frente)', () => {
    expect(directionInCameraSpace({ x: 0, z: -1 }, 0)).toBe('up');
    expect(directionInCameraSpace({ x: 0, z: 1 }, 0)).toBe('down');
    expect(directionInCameraSpace({ x: 1, z: 0 }, 0)).toBe('right');
    expect(directionInCameraSpace({ x: -1, z: 0 }, 0)).toBe('left');
  });

  it('al rotar la cámara 180°, el MISMO movimiento del mundo cambia de sprite', () => {
    // Alejarse de la cámara con yaw=PI es moverse a +Z en el mundo
    expect(directionInCameraSpace({ x: 0, z: 1 }, Math.PI)).toBe('up');
    expect(directionInCameraSpace({ x: 0, z: -1 }, Math.PI)).toBe('down');
  });

  it('con yaw=90°, moverse a -X en el mundo es alejarse (up)', () => {
    expect(directionInCameraSpace({ x: -1, z: 0 }, Math.PI / 2)).toBe('up');
    expect(directionInCameraSpace({ x: 0, z: -1 }, Math.PI / 2)).toBe('right');
  });

  it('es consistente: la dirección del input W siempre es up, en cualquier yaw', () => {
    [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4].forEach((yaw) => {
      const move = cameraRelativeMove({ right: 0, forward: 1 }, yaw);
      expect(directionInCameraSpace(move, yaw)).toBe('up');
    });
  });
});

describe('cameraMath: suavizado del giro', () => {
  it('angleDelta toma el camino más corto', () => {
    expect(angleDelta(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2, 6);
    expect(angleDelta(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 6);
  });

  it('dampAngle converge al objetivo sin pasarse en pasos grandes', () => {
    let angle = 0;
    for (let i = 0; i < 120; i++) angle = dampAngle(angle, Math.PI / 2, 7, 1 / 60);
    expect(Math.abs(angleDelta(angle, Math.PI / 2))).toBeLessThan(0.01);
    expect(EPS).toBeGreaterThan(0); // sanity del helper de precisión
  });
});

describe('Sistema genérico de sprites de roomies (grid 64x64)', () => {
  const keys = Object.keys(ROOMIE_MANIFEST) as RoomieAnimationKey[];

  it('el manifest se calcula desde el grid: celdas de 64x64 dentro de 512x192', () => {
    expect(keys.length).toBe(9);
    keys.forEach((key) => {
      const entry = ROOMIE_MANIFEST[key];
      expect(entry.width).toBe(512);
      expect(entry.height).toBe(192);
      entry.frames.forEach((frame) => {
        expect(frame.width).toBe(64);
        expect(frame.height).toBe(64);
        expect(frame.x % 64).toBe(0);
        expect(frame.y % 64).toBe(0);
        expect(frame.x + frame.width).toBeLessThanOrEqual(512);
        expect(frame.y + frame.height).toBeLessThanOrEqual(192);
      });
    });
  });

  it('conteo de frames por animación: idle 1, walk 3, run 4', () => {
    expect(ROOMIE_MANIFEST.idle_front.frames.length).toBe(1);
    expect(ROOMIE_MANIFEST.walk_front.frames.length).toBe(3);
    expect(ROOMIE_MANIFEST.run_front.frames.length).toBe(4);
    expect(ROOMIE_MANIFEST.run_back.frames.length).toBe(4);
    expect(ROOMIE_MANIFEST.run_right.frames.length).toBe(4);
  });

  it('mapea dirección+estado a animación usando la función real (incluye run_front)', () => {
    expect(resolveRoomieAnimation('idle', 'down')).toEqual({ animKey: 'idle_front', flipH: false });
    expect(resolveRoomieAnimation('idle', 'up')).toEqual({ animKey: 'idle_back', flipH: false });
    expect(resolveRoomieAnimation('idle', 'right')).toEqual({ animKey: 'idle_right', flipH: false });
    expect(resolveRoomieAnimation('idle', 'left')).toEqual({ animKey: 'idle_right', flipH: true });
    expect(resolveRoomieAnimation('walk', 'left')).toEqual({ animKey: 'walk_right', flipH: true });
    expect(resolveRoomieAnimation('walk', 'up')).toEqual({ animKey: 'walk_back', flipH: false });
    // Cambio de Fase 1: correr hacia la cámara ya NO reutiliza walk_front
    expect(resolveRoomieAnimation('run', 'down')).toEqual({ animKey: 'run_front', flipH: false });
    expect(resolveRoomieAnimation('run', 'right')).toEqual({ animKey: 'run_right', flipH: false });
    expect(resolveRoomieAnimation('run', 'left')).toEqual({ animKey: 'run_right', flipH: true });
    expect(resolveRoomieAnimation('run', 'up')).toEqual({ animKey: 'run_back', flipH: false });
  });
});
