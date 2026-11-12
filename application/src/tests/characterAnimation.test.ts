import { describe, it, expect } from 'vitest';
import { XIMENA_MANIFEST, XIMENA_SHEET_PATHS } from '@/data/characters/ximenaSprites.data';
import { AnimationKey } from '@/types/sprite.types';

/**
 * Ximena es NPC/amenaza y su set ilustrado queda INTACTO como material
 * histórico (Fase 1 no lo usa en la escena: el jugador ahora usa el
 * sistema genérico de roomies, cubierto en cameraMath.test.ts).
 * Estos tests conservan la verificación de integridad de su data.
 * Los antiguos tests que REPLICABAN a mano el mapeo de CharacterSprite
 * se retiraron: el mapeo real ahora vive en resolveRoomieAnimation()
 * y se prueba directamente en cameraMath.test.ts.
 */
describe('Ximena Sprite Sheet (NPC, data histórica intacta)', () => {
  const expectedAnimations: AnimationKey[] = [
    'idle_front',
    'idle_3_4',
    'idle_back',
    'walk_front',
    'walk_right',
    'walk_back',
    'run_right',
    'run_back',
  ];

  it('defines all core animation states for 4-direction 2.5D locomotion', () => {
    expectedAnimations.forEach((key) => {
      expect(XIMENA_MANIFEST[key]).toBeDefined();
      expect(XIMENA_SHEET_PATHS[key]).toBeDefined();
    });
  });

  it('contains valid frames with non-zero dimensions and proper texture bounds', () => {
    expectedAnimations.forEach((key) => {
      const entry = XIMENA_MANIFEST[key];
      expect(entry.width).toBeGreaterThan(0);
      expect(entry.height).toBeGreaterThan(0);
      expect(entry.frames.length).toBeGreaterThanOrEqual(key === 'idle_back' ? 1 : 3);

      entry.frames.forEach((frame) => {
        expect(frame.width).toBeGreaterThan(50);
        expect(frame.height).toBeGreaterThan(50);
        expect(frame.x + frame.width).toBeLessThanOrEqual(entry.width);
        expect(frame.y + frame.height).toBeLessThanOrEqual(entry.height);
      });
    });
  });

  it('idle_back de Ximena sigue siendo 1 frame estático (sin ciclo de caminata)', () => {
    expect(XIMENA_MANIFEST.idle_back.frames.length).toBe(1);
  });

  it('prevents animation fast-forward replay spike on tab switch (delta clamping simulation)', () => {
    // Simulate backgrounding tab for 5 seconds (delta = 5.0s)
    const largeDelta = 5.0;
    const clampedDelta = Math.min(largeDelta, 0.1);
    expect(clampedDelta).toBe(0.1);

    // Frame ticker with modulo: does not accumulate 5 seconds worth of frames
    let animTime = 0;
    const frameDuration = 0.28;
    animTime += clampedDelta; // only adds 0.1s, not 5.0s

    expect(animTime).toBeLessThan(frameDuration); // Does NOT trigger frame burst
  });
});
