import React from 'react';
import { getDefinedSpriteBundle } from '@/data/characters/definedSprites.data';
import { DefinedSprite2D } from '@/components/common/DefinedSprite2D';

interface RoomieSprite2DProps {
  characterId: string;
  /** Alto en pantalla del sprite en px (el ancho sale del aspect). */
  size?: number;
  bob?: boolean;
  /** Ocupado en una tarea: pose 'action' animada; libre: idle frontal real. */
  busy?: boolean;
  title?: string;
}

/**
 * Roomie en la escena 2D de gestión: sprite de DISEÑO DEFINIDO
 * (corrección de arte). Libre → el idle frontal extraído de su draft
 * v1.2; ocupado en una tarea → su animación 'action' ciclando, para que
 * se le vea TRABAJANDO en la escena.
 */
export const RoomieSprite2D: React.FC<RoomieSprite2DProps> = ({
  characterId,
  size = 72,
  bob = true,
  busy = false,
  title,
}) => {
  const bundle = getDefinedSpriteBundle(characterId);

  if (busy) {
    return (
      <DefinedSprite2D anim={bundle.action} height={size} cycleMs={450} title={title} />
    );
  }

  return (
    <DefinedSprite2D
      anim={bundle.idle_front}
      height={size}
      className={bob ? 'sprite-bob' : undefined}
      title={title}
    />
  );
};
