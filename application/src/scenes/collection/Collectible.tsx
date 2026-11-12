import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ItemDefinition } from '@/types/game.types';
import { getItemSpriteUrl, getItemScale } from '@/data/items/itemSprites.data';

interface CollectibleProps {
  id: string;
  item: ItemDefinition;
  position: [number, number, number];
  isNearby?: boolean;
  playerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

export const Collectible: React.FC<CollectibleProps> = ({
  item,
  position,
  isNearby = false,
  playerPositionRef,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [isClose, setIsClose] = useState(isNearby);

  // Load and cache texture with NearestFilter for authentic pixel art
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const url = getItemSpriteUrl(item.id);
    const tex = loader.load(url);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    return tex;
  }, [item.id]);

  const baseScale = getItemScale(item.id);

  // Distinct category aura color
  const auraColor = useMemo(() => {
    switch (item.category) {
      case 'SURVIVAL':
        return '#f97316'; // orange
      case 'COMMUNICATION':
        return '#38bdf8'; // sky blue
      case 'DEFENSE':
        return '#10b981'; // emerald
      case 'ENTERTAINMENT':
        return '#ec4899'; // pink
      default:
        return '#fbbf24'; // amber/gold
    }
  }, [item.category]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Calculate proximity dynamically if playerPositionRef is provided
    if (playerPositionRef && playerPositionRef.current) {
      const p = playerPositionRef.current;
      const dist = Math.hypot(position[0] - p.x, position[2] - p.z);
      const close = dist < 1.85;
      if (close !== isClose) {
        setIsClose(close);
      }
    }

    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y =
        0.35 + Math.sin(time * 2.8 + position[0] * 1.5) * 0.07;

      // Perfectly face the isometric camera
      meshRef.current.quaternion.copy(state.camera.quaternion);

      // Subtle breathing scale pulse when player is nearby
      const targetScale = isClose || isNearby ? 1.08 + Math.sin(time * 6) * 0.04 : 1.0;
      meshRef.current.scale.set(targetScale, targetScale, targetScale);
    }

    // Pulsing aura ring animation
    if (ringRef.current && (isClose || isNearby)) {
      const ringScale = 1.0 + Math.sin(time * 4) * 0.12;
      ringRef.current.scale.set(ringScale, ringScale, 1);
    }
  });

  const activeNearby = isClose || isNearby;

  return (
    <group position={position}>
      {/* 2.5D Item Sprite Billboard */}
      <group ref={meshRef}>
        <mesh castShadow>
          <planeGeometry args={[baseScale[0], baseScale[1]]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.05}
            roughness={0.5}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating Floor/Shelf Shadow */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, position[1] <= 0.4 ? 0.02 : 0.01, 0]}
      >
        <circleGeometry args={[baseScale[0] * 0.35, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* Interactive Beacon / Aura Ring when player is nearby */}
      {activeNearby && (
        <mesh
          ref={ringRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, position[1] <= 0.4 ? 0.03 : 0.02, 0]}
        >
          <ringGeometry args={[0.35, 0.55, 32]} />
          <meshBasicMaterial
            color={auraColor}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
