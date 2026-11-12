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
 * grid regular de 64x64 por personaje (ver roomieSprites.data.ts).
 * Incluye run_front e idle_right, que el set histórico de Ximena no tenía.
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
