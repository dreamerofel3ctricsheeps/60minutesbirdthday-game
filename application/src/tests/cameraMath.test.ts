import { describe, it, expect } from 'vitest';
import {
  cameraForward,
  cameraRelativeMove,
  directionInCameraSpace,
  angleDelta,
  dampAngle,
} from '@/game/systems/cameraMath';
import { resolveDefinedAnimation } from '@/data/characters/definedSprites.data';

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

describe('Mapeo dirección+estado → animación (bundles definidos)', () => {
  // La integridad de los bundles (animaciones presentes, frames dentro de
  // su imagen, conteos) vive en definedSprites.test.ts. Aquí queda el
  // mapeo de locomoción, con el mismo contrato que tenía el grid de
  // placeholders retirado en la corrección de arte.
  it('mapea dirección+estado a animación usando la función real (incluye run_front)', () => {
    expect(resolveDefinedAnimation('idle', 'down')).toEqual({ animKey: 'idle_front', flipH: false });
    expect(resolveDefinedAnimation('idle', 'up')).toEqual({ animKey: 'idle_back', flipH: false });
    expect(resolveDefinedAnimation('idle', 'right')).toEqual({ animKey: 'idle_right', flipH: false });
    expect(resolveDefinedAnimation('idle', 'left')).toEqual({ animKey: 'idle_right', flipH: true });
    expect(resolveDefinedAnimation('walk', 'left')).toEqual({ animKey: 'walk_right', flipH: true });
    expect(resolveDefinedAnimation('walk', 'up')).toEqual({ animKey: 'walk_back', flipH: false });
    // Correr usa los strips REALES de carrera (2ª corrección de arte):
    // run_front/run_back ya NO derivan de walk (eso deslizaba los pies).
    expect(resolveDefinedAnimation('run', 'down')).toEqual({ animKey: 'run_front', flipH: false });
    expect(resolveDefinedAnimation('run', 'right')).toEqual({ animKey: 'run_right', flipH: false });
    expect(resolveDefinedAnimation('run', 'left')).toEqual({ animKey: 'run_right', flipH: true });
    expect(resolveDefinedAnimation('run', 'up')).toEqual({ animKey: 'run_back', flipH: false });
  });

  it('cargando a un roomie: familia carrywalk_* (brazos arriba) en todo estado', () => {
    // El portador no camina "normal": idle/walk/run cargando resuelven a
    // las poses de carga según dirección (izquierda espeja la derecha).
    expect(resolveDefinedAnimation('idle', 'down', true)).toEqual({ animKey: 'carrywalk_front', flipH: false });
    expect(resolveDefinedAnimation('idle', 'up', true)).toEqual({ animKey: 'carrywalk_back', flipH: false });
    expect(resolveDefinedAnimation('walk', 'down', true)).toEqual({ animKey: 'carrywalk_front', flipH: false });
    expect(resolveDefinedAnimation('walk', 'up', true)).toEqual({ animKey: 'carrywalk_back', flipH: false });
    expect(resolveDefinedAnimation('walk', 'right', true)).toEqual({ animKey: 'carrywalk_right', flipH: false });
    expect(resolveDefinedAnimation('walk', 'left', true)).toEqual({ animKey: 'carrywalk_right', flipH: true });
    expect(resolveDefinedAnimation('run', 'down', true)).toEqual({ animKey: 'carrywalk_front', flipH: false });
    expect(resolveDefinedAnimation('run', 'left', true)).toEqual({ animKey: 'carrywalk_right', flipH: true });
    // Sin carga (default), el mapeo de locomoción no cambia.
    expect(resolveDefinedAnimation('walk', 'down')).toEqual({ animKey: 'walk_front', flipH: false });
  });
});
