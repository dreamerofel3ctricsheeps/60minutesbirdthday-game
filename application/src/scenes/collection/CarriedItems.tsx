import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Direction, MovementState } from '@/types/sprite.types';
import { getItemSpriteUrl, getItemScale } from '@/data/items/itemSprites.data';

interface CarriedItemsProps {
  heldItemIds: string[];
  direction: Direction;
  movementState: MovementState;
}

export const CarriedItems: React.FC<CarriedItemsProps> = ({
  heldItemIds,
  direction,
  movementState,
}) => {
  const containerRef = useRef<THREE.Group>(null);

  // Pre-load and cache textures with NearestFilter for crisp pixel art
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map<string, THREE.Texture>();
    heldItemIds.forEach((id) => {
      if (!map.has(id)) {
        const url = getItemSpriteUrl(id);
        const tex = loader.load(url);
        tex.generateMipmaps = false;
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        map.set(id, tex);
      }
    });
    return map;
  }, [heldItemIds]);

  useFrame(({ clock, camera }) => {
    if (!containerRef.current) return;

    // Face the isometric camera perfectly
    containerRef.current.quaternion.copy(camera.quaternion);

    // Dynamic bobbing matching Ximena's footsteps
    const time = clock.getElapsedTime();
    const bob =
      movementState === 'run'
        ? Math.sin(time * 14) * 0.06
        : movementState === 'walk'
        ? Math.sin(time * 9) * 0.035
        : Math.sin(time * 3) * 0.015;

    // Adjust position relative to player group based on facing direction
    let offsetX = 0;
    let offsetY = 0.88 + bob;
    let offsetZ = 0.28;

    switch (direction) {
      case 'left':
        offsetX = -0.28;
        offsetY = 0.86 + bob;
        offsetZ = 0.12;
        break;
      case 'right':
        offsetX = 0.28;
        offsetY = 0.86 + bob;
        offsetZ = 0.12;
        break;
      case 'up':
        offsetX = 0;
        offsetY = 1.08 + bob;
        offsetZ = -0.16;
        break;
      case 'down':
      default:
        offsetX = 0;
        offsetY = 0.88 + bob;
        offsetZ = 0.28;
        break;
    }

    containerRef.current.position.set(offsetX, offsetY, offsetZ);
  });

  if (heldItemIds.length === 0) return null;

  return (
    <group ref={containerRef}>
      {heldItemIds.map((itemId, idx) => {
        const tex = textures.get(itemId);
        if (!tex) return null;

        const baseScale = getItemScale(itemId);
        // Slightly scale down carried item to fit neatly in hands
        const scale: [number, number] = [baseScale[0] * 0.72, baseScale[1] * 0.72];

        // If carrying 2 items, stack them neatly
        const stackY = idx * 0.38;
        const stackZ = idx * 0.04;

        return (
          <group key={`${itemId}-${idx}`} position={[0, stackY, stackZ]}>
            <mesh castShadow>
              <planeGeometry args={[scale[0], scale[1]]} />
              <meshStandardMaterial
                map={tex}
                transparent
                alphaTest={0.05}
                roughness={0.6}
                metalness={0.0}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Small shadow beneath upper carried items in the stack */}
            {idx > 0 && (
              <mesh position={[0, -0.18, -0.01]}>
                <planeGeometry args={[scale[0] * 0.6, 0.08]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.25} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};
