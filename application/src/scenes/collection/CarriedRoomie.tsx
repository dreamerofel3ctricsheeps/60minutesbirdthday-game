import React from 'react';
import { Direction, MovementState } from '@/types/sprite.types';
import { CharacterSprite } from './CharacterSprite';

interface CarriedRoomieProps {
  characterId: string;
  direction: Direction;
  movementState: MovementState;
}

/**
 * Roomie cargado al hombro del protagonista (Fase 2).
 * Va elevado y lateral, inclinado como quien va cargado a la espalda /
 * al hombro; hereda la dirección y el estado del protagonista (sus
 * piernas se mueven con el mismo ciclo y el bob de CharacterSprite).
 * Los ítems extra que quepan los lleva ESTE roomie en las manos: el
 * Player monta los CarriedItems dentro de este mismo grupo visual.
 */
export const CarriedRoomie: React.FC<CarriedRoomieProps> = ({
  characterId,
  direction,
  movementState,
}) => {
  return (
    <group position={[0.42, 0.55, -0.1]} rotation={[0, 0, -0.38]} scale={0.8}>
      <CharacterSprite
        characterId={characterId}
        direction={direction}
        state={movementState}
      />
    </group>
  );
};

/** Desplazamiento donde el roomie cargado "sostiene" los ítems extra. */
export const CARRIED_ROOMIE_HANDS_OFFSET: [number, number, number] = [0.42, 0.62, 0.15];
