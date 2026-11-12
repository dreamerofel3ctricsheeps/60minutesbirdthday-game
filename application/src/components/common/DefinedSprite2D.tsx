import React, { useEffect, useState } from 'react';
import type { DefinedSpriteAnim } from '@/types/sprite.types';
import { definedFrameStyle } from '@/data/characters/definedSprites.data';

interface DefinedSprite2DProps {
  /** Animación del bundle definido (o el strip sleep de Ximena). */
  anim: DefinedSpriteAnim;
  /** Alto en px; el ancho sale del aspect del frame activo. */
  height: number;
  /** Si se pasa, cicla los frames de la animación a este ritmo (ms). */
  cycleMs?: number;
  frameIndex?: number;
  className?: string;
  title?: string;
}

/**
 * Muestra un frame de un sprite de DISEÑO DEFINIDO en 2D (DOM/CSS) con
 * background-position sobre su strip, respetando el aspect del frame.
 * Pieza compartida: RoomieSprite2D (gestión), XimenaBed (sueño) y el
 * interceptor del QTE.
 */
export const DefinedSprite2D: React.FC<DefinedSprite2DProps> = ({
  anim,
  height,
  cycleMs,
  frameIndex,
  className,
  title,
}) => {
  const [tick, setTick] = useState(0);
  const total = anim.entry.frames.length;

  useEffect(() => {
    if (!cycleMs || total <= 1) return;
    const iv = setInterval(() => setTick((t) => t + 1), cycleMs);
    return () => clearInterval(iv);
  }, [cycleMs, total]);

  const idx = frameIndex !== undefined ? frameIndex : tick % total;

  return (
    <div
      title={title}
      className={className}
      style={definedFrameStyle(anim, idx, height)}
    />
  );
};
