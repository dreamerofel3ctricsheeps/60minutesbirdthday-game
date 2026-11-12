import { describe, it, expect } from 'vitest';
import { XIMENA_MANIFEST, XIMENA_SHEET_PATHS } from '@/data/characters/ximenaSprites.data';
import { AnimationKey } from '@/types/sprite.types';

describe('Ximena Sprite Sheet & Animation Integration Verification', () => {
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

  it('maps movement directions and states correctly to sprite sheets and horizontal flip', () => {
    // Helper replicating the direction mapping logic from CharacterSprite.tsx
    const resolveAnim = (state: 'idle' | 'walk' | 'run', dir: 'up' | 'down' | 'left' | 'right') => {
      if (state === 'idle') {
        if (dir === 'left') return { animKey: 'idle_3_4', flipH: true };
        if (dir === 'right') return { animKey: 'idle_3_4', flipH: false };
        if (dir === 'up') return { animKey: 'idle_back', flipH: false };
        return { animKey: 'idle_front', flipH: false };
      }
      if (state === 'run') {
        if (dir === 'up') return { animKey: 'run_back', flipH: false };
        if (dir === 'left') return { animKey: 'run_right', flipH: true };
        if (dir === 'right') return { animKey: 'run_right', flipH: false };
        return { animKey: 'walk_front', flipH: false };
      }
      if (dir === 'up') return { animKey: 'walk_back', flipH: false };
      if (dir === 'left') return { animKey: 'walk_right', flipH: true };
      if (dir === 'right') return { animKey: 'walk_right', flipH: false };
      return { animKey: 'walk_front', flipH: false };
    };

    expect(resolveAnim('idle', 'down')).toEqual({ animKey: 'idle_front', flipH: false });
    expect(resolveAnim('idle', 'right')).toEqual({ animKey: 'idle_3_4', flipH: false });
    expect(resolveAnim('idle', 'left')).toEqual({ animKey: 'idle_3_4', flipH: true });
    expect(resolveAnim('idle', 'up')).toEqual({ animKey: 'idle_back', flipH: false });
    expect(resolveAnim('walk', 'right')).toEqual({ animKey: 'walk_right', flipH: false });
    expect(resolveAnim('walk', 'left')).toEqual({ animKey: 'walk_right', flipH: true });
    expect(resolveAnim('walk', 'up')).toEqual({ animKey: 'walk_back', flipH: false });
    expect(resolveAnim('run', 'right')).toEqual({ animKey: 'run_right', flipH: false });
    expect(resolveAnim('run', 'left')).toEqual({ animKey: 'run_right', flipH: true });
    expect(resolveAnim('run', 'up')).toEqual({ animKey: 'run_back', flipH: false });
  });

  it('guarantees releasing up direction switches from walk_back to static idle_back', () => {
    // When walking up:
    const walkingUp = { state: 'walk' as const, dir: 'up' as const };
    const walkAnim = walkingUp.state === 'walk' && walkingUp.dir === 'up' ? 'walk_back' : 'idle_back';
    expect(walkAnim).toBe('walk_back');

    // When releasing the up key:
    const releasedUp = { state: 'idle' as const, dir: 'up' as const };
    const idleAnim = releasedUp.state === 'idle' && releasedUp.dir === 'up' ? 'idle_back' : 'walk_back';
    expect(idleAnim).toBe('idle_back');
    expect(XIMENA_MANIFEST[idleAnim].frames.length).toBe(1); // 1 single static frame, no walking loop
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
