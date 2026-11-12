import React from 'react';
import { DoorConfig } from '@/types/map.types';

interface DoorsProps {
  doors: DoorConfig[];
}

export const Doors: React.FC<DoorsProps> = ({ doors }) => {
  return (
    <group name="Doors">
      {doors.map((door, index) => {
        const [x, z] = door.position;
        const width = door.width || 1.2;
        const isFacingZ = door.direction !== 'x'; // default faces along Z axis (opening is in X)

        const thresholdSize: [number, number, number] = isFacingZ
          ? [width, 0.015, 0.3]
          : [0.3, 0.015, width];

        const postRadius = 0.06;
        const postHeight = 2.4;

        // Positions for the two jamb posts flanking the doorway
        const post1Pos: [number, number, number] = isFacingZ
          ? [x - width / 2, postHeight / 2, z]
          : [x, postHeight / 2, z - width / 2];

        const post2Pos: [number, number, number] = isFacingZ
          ? [x + width / 2, postHeight / 2, z]
          : [x, postHeight / 2, z + width / 2];

        // Lintel beam across top
        const lintelSize: [number, number, number] = isFacingZ
          ? [width + 0.12, 0.12, 0.18]
          : [0.18, 0.12, width + 0.12];

        return (
          <group key={`door-${index}`}>
            {/* Floor Threshold Strip (warm wood / brass transition) */}
            <mesh position={[x, 0.016, z]} receiveShadow>
              <boxGeometry args={thresholdSize} />
              <meshStandardMaterial color="#78350f" roughness={0.6} />
            </mesh>

            {/* Left/Top Door Post */}
            <mesh position={post1Pos} castShadow receiveShadow>
              <boxGeometry args={[postRadius * 2, postHeight, postRadius * 2]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>

            {/* Right/Bottom Door Post */}
            <mesh position={post2Pos} castShadow receiveShadow>
              <boxGeometry args={[postRadius * 2, postHeight, postRadius * 2]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>

            {/* Top Lintel Beam */}
            <mesh position={[x, postHeight, z]} castShadow receiveShadow>
              <boxGeometry args={lintelSize} />
              <meshStandardMaterial color="#334155" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
