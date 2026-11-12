import React from 'react';
import { WallConfig } from '@/types/map.types';

interface WallsProps {
  walls: WallConfig[];
}

export const Walls: React.FC<WallsProps> = ({ walls }) => {
  return (
    <group name="Walls">
      {walls.map((wall, index) => {
        const dx = wall.to[0] - wall.from[0];
        const dz = wall.to[1] - wall.from[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        if (length < 0.05) return null;

        const midX = (wall.from[0] + wall.to[0]) / 2;
        const midZ = (wall.from[1] + wall.to[1]) / 2;
        const angle = Math.atan2(dz, dx);
        const height = wall.height || 2.4;
        const thickness = wall.thickness || (wall.type === 'partition' ? 0.15 : 0.3);

        const wallColor =
          wall.color ||
          (wall.type === 'exterior'
            ? '#1e293b'
            : wall.type === 'load'
            ? '#334155'
            : '#64748b');

        return (
          <group key={`wall-${index}`} position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
            {/* Main Wall Body */}
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[length, height, thickness]} />
              <meshStandardMaterial
                color={wallColor}
                roughness={0.8}
                metalness={0.05}
              />
            </mesh>

            {/* Top Wall Cap Trim (albardilla) */}
            <mesh position={[0, height + 0.03, 0]}>
              <boxGeometry args={[length + 0.02, 0.06, thickness + 0.04]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.6}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
