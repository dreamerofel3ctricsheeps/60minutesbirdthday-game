import { describe, it, expect } from 'vitest';
import {
  DEFINED_ANIMATION_KEYS,
  XIMENA_SLEEP,
  getDefinedSpriteBundle,
} from '@/data/characters/definedSprites.data';
import { DEFINED_BUNDLES } from '@/data/characters/definedSprites.generated';
import type { DefinedAnimationKey } from '@/types/sprite.types';

/**
 * Integridad de los bundles de sprites con DISEÑO DEFINIDO (correcciones
 * de arte 1 y 2): reemplaza a las suites del grid de placeholders 64x64.
 * Cada roomie debe traer las 14 animaciones, con los conteos de poses
 * generados desde los drafts v1.2 y todos los frames dentro de los
 * límites de su imagen.
 *
 * Segunda corrección: idle propio de 2 frames (relajado, con gesto de
 * su personalidad — no pose T), carrera REAL front/back (4 frames con
 * alternancia de piernas, ya no derivada de walk) y carrywalk_*
 * (caminar cargando a otro al hombro, brazos arriba).
 */
const ROOMIE_IDS = ['natalia', 'saulo', 'itzel', 'fatima', 'samantha', 'majo', 'alan'];

const EXPECTED_FRAMES: Partial<Record<DefinedAnimationKey, number>> = {
  idle_front: 2, // strip idle propio (2ª corrección): relajado, NO pose T
  idle_back: 1, // derivado de walk_back[0]
  idle_right: 1, // derivado de walk_right[0]
  walk_front: 4,
  walk_back: 3,
  walk_right: 3,
  run_front: 4, // strip REAL de carrera (2ª corrección, ya no deriva de walk)
  run_back: 4, // strip REAL de carrera (2ª corrección, ya no deriva de walk)
  run_right: 4, // regenerado con alternancia de piernas clara
  carried: 2,
  action: 2,
  carrywalk_front: 4,
  carrywalk_back: 3,
  carrywalk_right: 3,
};

describe('Bundles de sprites definidos (correcciones de arte)', () => {
  it('hay bundle para los 7 roomies', () => {
    ROOMIE_IDS.forEach((id) => {
      expect(DEFINED_BUNDLES[id], id).toBeDefined();
    });
  });

  it('cada roomie tiene las 14 animaciones requeridas con imagen y frames', () => {
    ROOMIE_IDS.forEach((id) => {
      const bundle = getDefinedSpriteBundle(id);
      DEFINED_ANIMATION_KEYS.forEach((key) => {
        const anim = bundle[key];
        expect(anim, `${id}.${key}`).toBeDefined();
        expect(typeof anim.image, `${id}.${key} imagen`).toBe('string');
        expect(anim.image.length, `${id}.${key} imagen no vacía`).toBeGreaterThan(0);
        expect(anim.entry.frames.length, `${id}.${key} frames`).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('conteos de frames por animación según lo generado del draft', () => {
    ROOMIE_IDS.forEach((id) => {
      const bundle = getDefinedSpriteBundle(id);
      (Object.entries(EXPECTED_FRAMES) as [DefinedAnimationKey, number][]).forEach(
        ([key, count]) => {
          expect(bundle[key].entry.frames.length, `${id}.${key}`).toBe(count);
        }
      );
    });
  });

  it('todos los frames caen dentro de los límites de su imagen', () => {
    ROOMIE_IDS.forEach((id) => {
      const bundle = getDefinedSpriteBundle(id);
      DEFINED_ANIMATION_KEYS.forEach((key) => {
        const { entry } = bundle[key];
        expect(entry.width, `${id}.${key} ancho`).toBeGreaterThan(0);
        expect(entry.height, `${id}.${key} alto`).toBeGreaterThan(0);
        entry.frames.forEach((frame, i) => {
          expect(frame.width, `${id}.${key}[${i}] w`).toBeGreaterThan(0);
          expect(frame.height, `${id}.${key}[${i}] h`).toBeGreaterThan(0);
          expect(frame.x, `${id}.${key}[${i}] x`).toBeGreaterThanOrEqual(0);
          expect(frame.y, `${id}.${key}[${i}] y`).toBeGreaterThanOrEqual(0);
          expect(frame.x + frame.width, `${id}.${key}[${i}] x+w`).toBeLessThanOrEqual(entry.width);
          expect(frame.y + frame.height, `${id}.${key}[${i}] y+h`).toBeLessThanOrEqual(entry.height);
        });
      });
    });
  });

  it('idle y carrera tienen imagen PROPIA (ya no derivan del draft en T ni de walk)', () => {
    ROOMIE_IDS.forEach((id) => {
      const bundle = getDefinedSpriteBundle(id);
      // 2ª corrección: se acabaron las derivaciones run=walk (deslizamiento)
      // y el idle en pose T extraído de la hoja de diseño.
      expect(bundle.run_front.image, `${id}.run_front`).not.toBe(bundle.walk_front.image);
      expect(bundle.run_back.image, `${id}.run_back`).not.toBe(bundle.walk_back.image);
      expect(bundle.idle_front.image, `${id}.idle_front`).not.toBe(bundle.walk_front.image);
      // Las derivaciones laterales de idle sí se mantienen.
      expect(bundle.idle_back.image, `${id}.idle_back`).toBe(bundle.walk_back.image);
      expect(bundle.idle_right.image, `${id}.idle_right`).toBe(bundle.walk_right.image);
    });
  });

  it('Ximena sleep: 3 estados (profundo / revuelta / sentada) dentro de límites', () => {
    expect(XIMENA_SLEEP.entry.frames.length).toBe(3);
    XIMENA_SLEEP.entry.frames.forEach((frame) => {
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(XIMENA_SLEEP.entry.width);
      expect(frame.y + frame.height).toBeLessThanOrEqual(XIMENA_SLEEP.entry.height);
    });
  });
});
