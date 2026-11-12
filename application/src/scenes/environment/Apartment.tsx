import React from 'react';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { Room } from './Room';
import { Walls } from './Walls';
import { Doors } from './Doors';

export const Apartment: React.FC = () => {
  return (
    <group name="Apartment">
      {/* Surrounding background void plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7.0, -0.02, 7.0]} receiveShadow>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      {/* Rooms with customized floors, textures, rugs & furniture */}
      {APARTMENT_MAP.rooms.map((room) => (
        <Room key={room.id} room={room} />
      ))}

      {/* Structural Walls (Load & Partition) with architectural openings */}
      <Walls walls={APARTMENT_MAP.walls} />

      {/* Door Frames and Thresholds */}
      <Doors doors={APARTMENT_MAP.doors} />

      {/* Drop Zone circular deposit target marker */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          APARTMENT_MAP.dropZone.center[0],
          0.035,
          APARTMENT_MAP.dropZone.center[1],
        ]}
      >
        <circleGeometry args={[APARTMENT_MAP.dropZone.radius, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.35} />
      </mesh>

      {/* Drop Zone pulsing ring marker */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          APARTMENT_MAP.dropZone.center[0],
          0.036,
          APARTMENT_MAP.dropZone.center[1],
        ]}
      >
        <ringGeometry args={[APARTMENT_MAP.dropZone.radius - 0.15, APARTMENT_MAP.dropZone.radius, 32]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};
