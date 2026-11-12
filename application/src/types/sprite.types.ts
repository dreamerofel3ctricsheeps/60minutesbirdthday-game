export type Direction = 'down' | 'up' | 'left' | 'right';
export type MovementState = 'idle' | 'walk' | 'run';

export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SheetManifestEntry {
  width: number;
  height: number;
  frames: FrameRect[];
}

export type AnimationKey =
  | 'idle_front'
  | 'idle_3_4'
  | 'idle_back'
  | 'walk_front'
  | 'walk_right'
  | 'walk_back'
  | 'run_right'
  | 'run_back';

export type SpritesManifest = Record<AnimationKey, SheetManifestEntry>;

/**
 * Animaciones del sistema GENÉRICO de roomies (Fase 1): una sola hoja en
 * grid regular de 64x64 por personaje. RETIRADO en la corrección de arte:
 * los placeholders de rectángulos perdían la identidad de los diseños.
 * Se conserva el tipo porque el mapeo estado+dirección lo reutiliza el
 * sistema de bundles definidos (definedSprites.data.ts).
 */
export type RoomieAnimationKey =
  | 'idle_front'
  | 'idle_back'
  | 'idle_right'
  | 'walk_front'
  | 'walk_back'
  | 'walk_right'
  | 'run_front'
  | 'run_back'
  | 'run_right';

export type RoomieSpritesManifest = Record<RoomieAnimationKey, SheetManifestEntry>;

/**
 * Animaciones del sistema de sprites con DISEÑO DEFINIDO (corrección de
 * arte): un strip por animación generado desde los drafts v1.2 de Jose,
 * en el mismo formato imagen+manifest que el set histórico de Ximena.
 * Incluye carried (siendo cargado) y action (tareas de gestión / QTE),
 * que el grid de placeholders no tenía.
 */
export type DefinedAnimationKey =
  | RoomieAnimationKey
  | 'carried'
  | 'action';

/** Una animación de un bundle definido: imagen propia + manifest de frames. */
export interface DefinedSpriteAnim {
  image: string;
  entry: SheetManifestEntry;
}

export type DefinedSpriteBundle = Record<DefinedAnimationKey, DefinedSpriteAnim>;
