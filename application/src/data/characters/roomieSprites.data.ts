import {
  Direction,
  MovementState,
  RoomieAnimationKey,
  RoomieSpritesManifest,
  SheetManifestEntry,
} from '@/types/sprite.types';

import nataliaSheet from '@/assets/sprites/characters/placeholders/natalia.png';
import sauloSheet from '@/assets/sprites/characters/placeholders/saulo.png';
import itzelSheet from '@/assets/sprites/characters/placeholders/itzel.png';
import fatimaSheet from '@/assets/sprites/characters/placeholders/fatima.png';
import samanthaSheet from '@/assets/sprites/characters/placeholders/samantha.png';
import majoSheet from '@/assets/sprites/characters/placeholders/majo.png';
import alanSheet from '@/assets/sprites/characters/placeholders/alan.png';

/**
 * Sistema GENÉRICO de sprites de roomies (Fase 1).
 *
 * Cada roomie tiene UNA hoja placeholder en grid regular de 64x64
 * (generada por scripts/generate_placeholder_sprites.py):
 *   512x192 = 8 columnas x 3 filas
 *   Fila 0: frente | Fila 1: espalda | Fila 2: lateral (perfil derecho)
 *   Columnas: [0] idle, [1..3] walk, [4..7] run
 *
 * Los manifests se CALCULAN desde el grid: nada de coordenadas a mano.
 */
export const ROOMIE_FRAME_SIZE = 64;
export const ROOMIE_SHEET_WIDTH = 512;
export const ROOMIE_SHEET_HEIGHT = 192;

const ROW = { front: 0, back: 1, side: 2 } as const;
const IDLE_COLS = [0];
const WALK_COLS = [1, 2, 3];
const RUN_COLS = [4, 5, 6, 7];

function gridEntry(row: number, cols: number[]): SheetManifestEntry {
  return {
    width: ROOMIE_SHEET_WIDTH,
    height: ROOMIE_SHEET_HEIGHT,
    frames: cols.map((col) => ({
      x: col * ROOMIE_FRAME_SIZE,
      y: row * ROOMIE_FRAME_SIZE,
      width: ROOMIE_FRAME_SIZE,
      height: ROOMIE_FRAME_SIZE,
    })),
  };
}

export const ROOMIE_MANIFEST: RoomieSpritesManifest = {
  idle_front: gridEntry(ROW.front, IDLE_COLS),
  idle_back: gridEntry(ROW.back, IDLE_COLS),
  idle_right: gridEntry(ROW.side, IDLE_COLS),
  walk_front: gridEntry(ROW.front, WALK_COLS),
  walk_back: gridEntry(ROW.back, WALK_COLS),
  walk_right: gridEntry(ROW.side, WALK_COLS),
  run_front: gridEntry(ROW.front, RUN_COLS),
  run_back: gridEntry(ROW.back, RUN_COLS),
  run_right: gridEntry(ROW.side, RUN_COLS),
};

export interface RoomieSpriteData {
  sheet: string;
  manifest: RoomieSpritesManifest;
}

const spriteData = (sheet: string): RoomieSpriteData => ({ sheet, manifest: ROOMIE_MANIFEST });

export const ROOMIE_SPRITES: Record<string, RoomieSpriteData> = {
  natalia: spriteData(nataliaSheet),
  saulo: spriteData(sauloSheet),
  itzel: spriteData(itzelSheet),
  fatima: spriteData(fatimaSheet),
  samantha: spriteData(samanthaSheet),
  majo: spriteData(majoSheet),
  alan: spriteData(alanSheet),
};

export const getRoomieSpriteData = (characterId: string): RoomieSpriteData =>
  ROOMIE_SPRITES[characterId] ?? ROOMIE_SPRITES.natalia;

/**
 * Mapeo estado+dirección (en espacio de cámara) → animación del grid.
 * La izquierda reutiliza la fila lateral con flip horizontal.
 * A diferencia del set histórico de Ximena, aquí SÍ hay run_front e
 * idle_right propios, así que correr hacia la cámara ya no usa walk_front.
 */
export function resolveRoomieAnimation(
  state: MovementState,
  direction: Direction
): { animKey: RoomieAnimationKey; flipH: boolean } {
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
