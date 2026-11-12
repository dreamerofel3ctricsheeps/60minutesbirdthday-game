import React from 'react';
import { CharacterSprite } from './CharacterSprite';

interface RoomieNpcProps {
  characterId: string;
  position: [number, number, number];
}

/**
 * Roomie NPC esperando en el departamento (Fase 2): sprite genérico en
 * idle con el billboard cilíndrico de CharacterSprite y sombra blob.
 * Sin colisión: el jugador lo recoge acercándose y pulsando Espacio.
 */
export const RoomieNpc: React.FC<RoomieNpcProps> = ({ characterId, position }) => {
  return (
    <group position={position}>
      <CharacterSprite characterId={characterId} direction="down" state="idle" />
      {/* Floor Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
