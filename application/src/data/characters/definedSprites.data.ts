import type React from 'react';
import {
  DefinedAnimationKey,
  DefinedSpriteAnim,
  DefinedSpriteBundle,
  Direction,
  MovementState,
} from '@/types/sprite.types';
import { DEFINED_BUNDLES, XIMENA_SLEEP } from './definedSprites.generated';

export type { DefinedSpriteAnim, DefinedSpriteBundle };
export { XIMENA_SLEEP };

/**
 * Sistema de sprites con DISEÑO DEFINIDO (corrección de arte).
 *
 * Reemplaza al grid de placeholders 64x64 de la Fase 1 (rectángulos que
 * perdían la identidad de los personajes). Cada roomie tiene un bundle de
 * strips generados desde su draft v1.2 (diseños de Jose) en el mismo
 * formato imagen-por-animación + manifest de Ximena:
 * ver scripts/process_defined_sprites.py y los manifest.json junto a los
 * PNG en src/assets/sprites/characters/defined/<id>/.
 *
 * Derivaciones (documentadas en el procesador):
 *   run_front = frames de walk_front (el estado run acelera el ciclo y el bob)
 *   run_back  = frames de walk_back (idem)
 *   idle_back = frame 0 de walk_back · idle_right = frame 0 de walk_right
 *   izquierda = espejo horizontal de la animación derecha (flipH)
 *   idle_front = diseño base EXTRAÍDO del draft v1.2 (sin damero)
 */
export const DEFINED_ANIMATION_KEYS: DefinedAnimationKey[] = [
  'idle_front',
  'idle_back',
  'idle_right',
  'walk_front',
  'walk_back',
  'walk_right',
  'run_front',
  'run_back',
  'run_right',
  'carried',
  'action',
];

export const getDefinedSpriteBundle = (characterId: string): DefinedSpriteBundle =>
  DEFINED_BUNDLES[characterId] ?? DEFINED_BUNDLES.natalia;

/**
 * Mapeo estado+dirección (en espacio de cámara) → animación del bundle.
 * Mismo contrato que tenía el sistema de placeholders (Fase 1) para no
 * tocar la lógica de cámara/movimiento: la izquierda reutiliza la
 * animación derecha con flip horizontal.
 */
export function resolveDefinedAnimation(
  state: MovementState,
  direction: Direction
): { animKey: DefinedAnimationKey; flipH: boolean } {
  const flipH = direction === 'left';
  const side: Direction = flipH ? 'right' : direction;

  if (state === 'idle') {
    if (side === 'up') return { animKey: 'idle_back', flipH: false };
    if (side === 'right') return { animKey: 'idle_right', flipH };
    return { animKey: 'idle_front', flipH: false };
  }
  if (state === 'run') {
    if (side === 'up') return { animKey: 'run_back', flipH: false };
    if (side === 'right') return { animKey: 'run_right', flipH };
    return { animKey: 'run_front', flipH: false };
  }
  // walk
  if (side === 'up') return { animKey: 'walk_back', flipH: false };
  if (side === 'right') return { animKey: 'walk_right', flipH };
  return { animKey: 'walk_front', flipH: false };
}

/**
 * Estilo CSS para mostrar UN frame de una animación definida en un div
 * (escena 2D de gestión, Ximena dormida, modal QTE). Fija el ALTO en px y
 * deriva el ancho del aspect del frame para no deformar el diseño.
 */
export function definedFrameStyle(
  anim: DefinedSpriteAnim,
  frameIndex: number,
  heightPx: number
): React.CSSProperties {
  const frame = anim.entry.frames[frameIndex % anim.entry.frames.length];
  const scale = heightPx / frame.height;
  return {
    width: Math.round(frame.width * scale),
    height: heightPx,
    backgroundImage: `url(${anim.image})`,
    backgroundSize: `${Math.round(anim.entry.width * scale)}px ${Math.round(anim.entry.height * scale)}px`,
    backgroundPosition: `${-Math.round(frame.x * scale)}px ${-Math.round(frame.y * scale)}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
}
