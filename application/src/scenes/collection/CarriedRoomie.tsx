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
 *
 * Corrección de arte: usa la animación DEDICADA 'carried' del bundle
 * definido (el personaje ya viene horizontal en el aire, pateando y
 * agarrándose, generado desde su draft v1.2) en vez del sprite común
 * inclinado a la fuerza. Por eso la rotación del grupo es mínima: la
 * pose ya trae la horizontalidad. Hereda el estado del protagonista
 * solo para el bob (el cuerpo se mece al caminar/correr).
 * Los ítems extra que quepan los lleva ESTE roomie en las manos: el
 * Player monta los CarriedItems dentro de este mismo grupo visual.
 */
export const CarriedRoomie: React.FC<CarriedRoomieProps> = ({
  characterId,
  direction,
  movementState,
}) => {
  return (
    <group position={[0.42, 0.55, -0.1]} rotation={[0, 0, -0.1]} scale={0.85}>
      <CharacterSprite
        characterId={characterId}
        direction={direction}
        state={movementState}
        animOverride="carried"
        planeHeight={1.05}
      />
    </group>
  );
};

/** Desplazamiento donde el roomie cargado "sostiene" los ítems extra. */
export const CARRIED_ROOMIE_HANDS_OFFSET: [number, number, number] = [0.42, 0.62, 0.15];
