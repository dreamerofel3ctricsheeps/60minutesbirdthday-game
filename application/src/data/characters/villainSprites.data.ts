/**
 * GENERADO por scripts/process_villains.py — no editar a mano.
 * Sprites de los VILLANOS de la Fase 4: Jose y su gato calicó,
 * cómplices cuyo plan rival es despertar a Ximena para llevarla
 * ELLOS a darle el mejor cumpleaños. Mismo formato que los
 * bundles definidos de los roomies: una imagen por animación
 * + manifest de frames irregulares segmentados del strip.
 *
 * DECISIÓN DE ESPEJO (Fase 4, innegociable):
 * - EL GATO NO SE ESPEJA NUNCA en runtime. Su rasgo de identidad
 *   es la mancha naranja/crema en su CACHETE IZQUIERDO anatómico;
 *   un flipH la pasaría al cachete derecho y dejaría de ser él.
 *   Sus strips de perfil (prowl) miran a la DERECHA y se usan
 *   tal cual en todas las direcciones; si el gameplay necesita
 *   que se desplace a la izquierda, se mueve con el sprite de
 *   perfil derecho sin espejar (o se rota/traslada, nunca flipH).
 * - JOSE SÍ PUEDE ESPEJARSE: no tiene rasgos asimétricos (camisa
 *   verde a rayas simétrica, lentes redondos, audífonos con cable
 *   a ambos lados); su walk_right se espeja para caminar a la
 *   izquierda como con los roomies.
 */
import type { DefinedSpriteAnim } from '@/types/sprite.types';

import img_jose_idle from '@/assets/sprites/characters/villains/jose/idle.png';
import img_jose_walk_right from '@/assets/sprites/characters/villains/jose/walk_right.png';
import img_jose_sneak from '@/assets/sprites/characters/villains/jose/sneak.png';
import img_jose_celebrate from '@/assets/sprites/characters/villains/jose/celebrate.png';
import img_gato_idle from '@/assets/sprites/characters/villains/gato/idle.png';
import img_gato_prowl from '@/assets/sprites/characters/villains/gato/prowl.png';
import img_gato_pounce from '@/assets/sprites/characters/villains/gato/pounce.png';

export type JoseAnimKey = 'idle' | 'walk_right' | 'sneak' | 'celebrate';
export type CatAnimKey = 'idle' | 'prowl' | 'pounce';

export const JOSE_SPRITES: Record<JoseAnimKey, DefinedSpriteAnim> = {
  idle: { image: img_jose_idle, entry: {"width": 1280, "height": 640, "frames": [{"x": 233, "y": 32, "width": 310, "height": 588}, {"x": 727, "y": 38, "width": 313, "height": 582}]} },
  walk_right: { image: img_jose_walk_right, entry: {"width": 1920, "height": 640, "frames": [{"x": 154, "y": 24, "width": 401, "height": 599}, {"x": 790, "y": 22, "width": 335, "height": 602}, {"x": 1360, "y": 24, "width": 400, "height": 599}]} },
  sneak: { image: img_jose_sneak, entry: {"width": 1280, "height": 640, "frames": [{"x": 118, "y": 68, "width": 538, "height": 534}, {"x": 701, "y": 42, "width": 541, "height": 560}]} },
  celebrate: { image: img_jose_celebrate, entry: {"width": 1280, "height": 640, "frames": [{"x": 66, "y": 38, "width": 486, "height": 585}, {"x": 681, "y": 23, "width": 412, "height": 599}]} },
};

export const CAT_SPRITES: Record<CatAnimKey, DefinedSpriteAnim> = {
  idle: { image: img_gato_idle, entry: {"width": 1280, "height": 640, "frames": [{"x": 144, "y": 68, "width": 428, "height": 524}, {"x": 683, "y": 42, "width": 445, "height": 551}]} },
  prowl: { image: img_gato_prowl, entry: {"width": 1920, "height": 640, "frames": [{"x": 56, "y": 99, "width": 558, "height": 449}, {"x": 655, "y": 115, "width": 585, "height": 435}, {"x": 1274, "y": 115, "width": 582, "height": 427}]} },
  pounce: { image: img_gato_pounce, entry: {"width": 1280, "height": 640, "frames": [{"x": 21, "y": 53, "width": 681, "height": 474}, {"x": 764, "y": 81, "width": 442, "height": 520}]} },
};
