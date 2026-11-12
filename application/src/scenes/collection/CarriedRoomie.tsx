import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Direction, MovementState } from '@/types/sprite.types';
import { CharacterSprite } from './CharacterSprite';
import type { CarrySway } from './Player';

interface CarriedRoomieProps {
  characterId: string;
  direction: Direction;
  movementState: MovementState;
  /**
   * Balanceo con física secundaria calculado en Player (resortes con
   * desfase respecto al bob del portador). Compartido con los ítems de
   * las manos para que toda la carga se mueva en fase, no "pegada".
   */
  swayRef?: React.MutableRefObject<CarrySway>;
}

const BASE_POSITION: [number, number, number] = [0.42, 0.55, -0.1];
const BASE_ROT_Z = -0.1;

/**
 * Roomie cargado al hombro del protagonista (Fase 2).
 *
 * Corrección de arte: usa la animación DEDICADA 'carried' del bundle
 * definido (el personaje ya viene horizontal en el aire, pateando y
 * agarrándose, generado desde su draft v1.2) en vez del sprite común
 * inclinado a la fuerza. Por eso la rotación del grupo es mínima: la
 * pose ya trae la horizontalidad.
 *
 * Segunda corrección: el grupo aplica el balanceo por RESORTES de
 * Player (swayRef): rebote vertical con retardo y balanceo lateral que
 * crece al correr y se asienta al detenerse. Ya no va rígido al hombro.
 */
export const CarriedRoomie: React.FC<CarriedRoomieProps> = ({
  characterId,
  direction,
  movementState,
  swayRef,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || !swayRef) return;
    group.position.set(
      BASE_POSITION[0],
      BASE_POSITION[1] + swayRef.current.y,
      BASE_POSITION[2]
    );
    group.rotation.z = BASE_ROT_Z + swayRef.current.rotZ;
  });

  return (
    <group ref={groupRef} position={BASE_POSITION} rotation={[0, 0, BASE_ROT_Z]} scale={0.85}>
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
