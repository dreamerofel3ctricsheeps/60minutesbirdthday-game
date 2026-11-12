import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThrowStore, ThrownItemData, LandedItem } from '@/stores/throw.store';
import { getItemSpriteUrl, getItemScale } from '@/data/items/itemSprites.data';
import { audio } from '@/services/audio.service';
import { CharacterSprite } from './CharacterSprite';

interface ImpactRing {
  id: string;
  x: number;
  z: number;
  startTime: number;
}

export const ThrownItems: React.FC = () => {
  const activeThrows = useThrowStore((s) => s.activeThrows);
  const landedItems = useThrowStore((s) => s.landedItems);
  const onLanded = useThrowStore((s) => s.onLanded);

  const [impactRings, setImpactRings] = useState<ImpactRing[]>([]);

  // Unique item textures loaded with NearestFilter
  const allItemIds = useMemo(() => {
    const ids = new Set<string>();
    activeThrows.forEach((t) => {
      if (t.kind === 'item') ids.add(t.itemId);
    });
    landedItems.forEach((l) => {
      if (l.kind === 'item') ids.add(l.itemId);
    });
    return Array.from(ids);
  }, [activeThrows, landedItems]);

  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map<string, THREE.Texture>();
    allItemIds.forEach((id) => {
      const url = getItemSpriteUrl(id);
      const tex = loader.load(url);
      tex.generateMipmaps = false;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      map.set(id, tex);
    });
    return map;
  }, [allItemIds]);

  return (
    <group>
      {/* 1. Active flying projectiles in parabolic arc */}
      {activeThrows.map((itemThrow) =>
        itemThrow.kind === 'roomie' && itemThrow.characterId ? (
          <FlyingRoomieProjectile
            key={itemThrow.id}
            data={itemThrow}
            onHitFloor={() => {
              onLanded(itemThrow.id);
              audio.play('ITEM_DEPOSIT');
              setImpactRings((prev) => [
                ...prev,
                {
                  id: `ring_${itemThrow.id}_${Date.now()}`,
                  x: itemThrow.targetX,
                  z: itemThrow.targetZ,
                  startTime: performance.now() / 1000,
                },
              ]);
            }}
          />
        ) : (
        <FlyingProjectile
          key={itemThrow.id}
          data={itemThrow}
          texture={textures.get(itemThrow.itemId)}
          onHitFloor={() => {
            onLanded(itemThrow.id);
            audio.play('ITEM_DEPOSIT');
            setImpactRings((prev) => [
              ...prev,
              {
                id: `ring_${itemThrow.id}_${Date.now()}`,
                x: itemThrow.targetX,
                z: itemThrow.targetZ,
                startTime: performance.now() / 1000,
              },
            ]);
          }}
        />
        )
      )}

      {/* 2. Resting deposited items inside the elevator + roomies entregados */}
      {landedItems.map((landed) =>
        landed.kind === 'roomie' && landed.characterId ? (
          <LandedRoomieMesh key={landed.id} data={landed} />
        ) : (
          <LandedItemMesh
            key={landed.id}
            data={landed}
            texture={textures.get(landed.itemId)}
          />
        )
      )}

      {/* 3. Expanding landing impact rings */}
      <ImpactRings rings={impactRings} onRemoveRing={(id) => {
        setImpactRings((prev) => prev.filter((r) => r.id !== id));
      }} />
    </group>
  );
};

// -------------------------------------------------------------
// Individual flying projectile
// -------------------------------------------------------------
const FlyingProjectile: React.FC<{
  data: ThrownItemData;
  texture?: THREE.Texture;
  onHitFloor: () => void;
}> = ({ data, texture, onHitFloor }) => {
  const meshRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const hasHit = useRef(false);

  const baseScale = getItemScale(data.itemId);
  const scale: [number, number] = [baseScale[0] * 0.75, baseScale[1] * 0.75];

  useFrame(({ clock, camera }) => {
    if (!meshRef.current || hasHit.current) return;

    const now = clock.getElapsedTime();
    if (now < data.startTime) return; // delayed launch

    const elapsed = now - data.startTime;
    const t = Math.min(1.0, elapsed / data.duration);

    // Parabolic trajectory
    const currentX = THREE.MathUtils.lerp(data.startX, data.targetX, t);
    const currentZ = THREE.MathUtils.lerp(data.startZ, data.targetZ, t);
    const linearY = THREE.MathUtils.lerp(data.startY, data.targetY, t);
    // Parabolic arc height formula: 4 * h * t * (1 - t)
    const arcY = linearY + 4 * data.apexHeight * t * (1 - t);

    meshRef.current.position.set(currentX, arcY, currentZ);

    // Face camera + tumble spin
    meshRef.current.quaternion.copy(camera.quaternion);
    const spinAngle = t * Math.PI * 3.5;
    meshRef.current.rotateZ(spinAngle);

    // Shadow on the floor directly beneath
    if (shadowRef.current) {
      shadowRef.current.position.set(currentX, 0.03, currentZ);
      const heightAboveFloor = Math.max(0, arcY - 0.05);
      const shadowFactor = Math.max(0.2, 1.0 - heightAboveFloor / 2.0);
      shadowRef.current.scale.set(shadowFactor, shadowFactor, shadowFactor);
      (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * shadowFactor;
    }

    // Impact floor
    if (t >= 1.0 && !hasHit.current) {
      hasHit.current = true;
      onHitFloor();
    }
  });

  return (
    <>
      <group ref={meshRef}>
        {texture && (
          <mesh castShadow>
            <planeGeometry args={[scale[0], scale[1]]} />
            <meshStandardMaterial
              map={texture}
              transparent
              alphaTest={0.05}
              roughness={0.5}
              metalness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Cast Shadow on Floor */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </>
  );
};

// -------------------------------------------------------------
// Resting Landed Item in the Elevator
// -------------------------------------------------------------
const LandedItemMesh: React.FC<{
  data: LandedItem;
  texture?: THREE.Texture;
}> = ({ data, texture }) => {
  const groupRef = useRef<THREE.Group>(null);
  const baseScale = getItemScale(data.itemId);
  const scale: [number, number] = [baseScale[0] * 0.68, baseScale[1] * 0.68];

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }
  });

  return (
    <group position={data.position}>
      {/* Billboard item plane */}
      <group ref={groupRef} position={[0, scale[1] / 2 + 0.05, 0]}>
        {texture && (
          <mesh castShadow>
            <planeGeometry args={[scale[0], scale[1]]} />
            <meshStandardMaterial
              map={texture}
              transparent
              alphaTest={0.05}
              roughness={0.6}
              metalness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Resting shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.24, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};

// -------------------------------------------------------------
// Impact rings on landing
// -------------------------------------------------------------
const ImpactRings: React.FC<{
  rings: ImpactRing[];
  onRemoveRing: (id: string) => void;
}> = ({ rings, onRemoveRing }) => {
  return (
    <group>
      {rings.map((ring) => (
        <SingleRing
          key={ring.id}
          ring={ring}
          onDone={() => onRemoveRing(ring.id)}
        />
      ))}
    </group>
  );
};

const SingleRing: React.FC<{ ring: ImpactRing; onDone: () => void }> = ({
  ring,
  onDone,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const duration = 0.38;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const now = clock.getElapsedTime();
    const age = now - ring.startTime;
    const progress = Math.min(1.0, age / duration);

    const scale = 1.0 + progress * 2.2;
    meshRef.current.scale.set(scale, scale, 1);

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, 0.7 * (1.0 - progress));

    if (progress >= 1.0) {
      onDone();
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[ring.x, 0.04, ring.z]}
    >
      <ringGeometry args={[0.15, 0.3, 24]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
};

// -------------------------------------------------------------
// Flying ROOMIE projectile (Fase 2): sale volando girando leve,
// abrazando los ítems extra que llevaba en las manos.
// -------------------------------------------------------------
const FlyingRoomieProjectile: React.FC<{
  data: ThrownItemData;
  onHitFloor: () => void;
}> = ({ data, onHitFloor }) => {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const hasHit = useRef(false);

  useFrame(({ clock }) => {
    if (!groupRef.current || hasHit.current) return;

    const now = clock.getElapsedTime();
    if (now < data.startTime) return;

    const elapsed = now - data.startTime;
    const t = Math.min(1.0, elapsed / data.duration);

    const currentX = THREE.MathUtils.lerp(data.startX, data.targetX, t);
    const currentZ = THREE.MathUtils.lerp(data.startZ, data.targetZ, t);
    const linearY = THREE.MathUtils.lerp(data.startY, data.targetY, t);
    const arcY = linearY + 4 * data.apexHeight * t * (1 - t);

    groupRef.current.position.set(currentX, arcY, currentZ);

    // Giro leve de voltereta (el sprite billboardea en Y por dentro)
    if (spinRef.current) {
      spinRef.current.rotation.z = t * Math.PI * 1.5;
    }

    if (shadowRef.current) {
      shadowRef.current.position.set(currentX, 0.03, currentZ);
      const heightAboveFloor = Math.max(0, arcY - 0.05);
      const shadowFactor = Math.max(0.2, 1.0 - heightAboveFloor / 2.5);
      shadowRef.current.scale.set(shadowFactor, shadowFactor, shadowFactor);
      (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * shadowFactor;
    }

    if (t >= 1.0 && !hasHit.current) {
      hasHit.current = true;
      onHitFloor();
    }
  });

  if (!data.characterId) return null;

  return (
    <>
      <group ref={groupRef}>
        <group ref={spinRef}>
          {/* Centrado en el cuerpo para que la voltereta se vea bien */}
          <group position={[0, -0.9, 0]}>
            <CharacterSprite
              characterId={data.characterId}
              direction="down"
              state="run"
            />
          </group>
        </group>
      </group>

      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </>
  );
};

// -------------------------------------------------------------
// Roomie ya entregado, de pie en la zona segura (Fase 2)
// -------------------------------------------------------------
const LandedRoomieMesh: React.FC<{ data: LandedItem }> = ({ data }) => {
  if (!data.characterId) return null;
  return (
    <group position={data.position}>
      <CharacterSprite characterId={data.characterId} direction="down" state="idle" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};
