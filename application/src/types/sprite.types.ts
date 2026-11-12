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
