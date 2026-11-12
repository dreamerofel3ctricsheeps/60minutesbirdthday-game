import React from 'react';
import {
  getRoomieSpriteData,
  ROOMIE_FRAME_SIZE,
  ROOMIE_SHEET_WIDTH,
  ROOMIE_SHEET_HEIGHT,
} from '@/data/characters/roomieSprites.data';

interface RoomieSprite2DProps {
  characterId: string;
  /** Tamaño en pantalla del frame (el frame nativo es 64x64). */
  size?: number;
  bob?: boolean;
  title?: string;
}

/**
 * Roomie en la escena 2D de gestión (Fase 3): reutiliza la MISMA hoja
 * placeholder 64x64 de la recolección 3D (Fase 1), mostrando el frame
 * idle frontal (fila 0, columna 0 del grid) con background-position.
 */
export const RoomieSprite2D: React.FC<RoomieSprite2DProps> = ({
  characterId,
  size = 72,
  bob = true,
  title,
}) => {
  const data = getRoomieSpriteData(characterId);
  const scale = size / ROOMIE_FRAME_SIZE;

  return (
    <div
      title={title}
      className={bob ? 'sprite-bob' : undefined}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${data.sheet})`,
        backgroundSize: `${ROOMIE_SHEET_WIDTH * scale}px ${ROOMIE_SHEET_HEIGHT * scale}px`,
        // Frame idle frontal: x=0, y=0 del grid.
        backgroundPosition: '0px 0px',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  );
};
