import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Apartment } from '../environment/Apartment';
import { Lighting } from '../environment/Lighting';
import { Player } from './Player';
import { Collectible } from './Collectible';
import { ThrownItems } from './ThrownItems';
import { CameraController } from './CameraController';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { useInventoryStore } from '@/stores/inventory.store';

interface SpawnedItem {
  id: string;
  itemId: string;
  position: [number, number, number];
}

interface CollectionSceneProps {
  onRoomChange?: (roomName: string, isRisk: boolean) => void;
  onNearbyPrompt?: (itemName: string | null) => void;
  onPositionUpdate?: (coords: { x: number; z: number }) => void;
  teleportTarget?: [number, number] | null;
}

export const CollectionScene: React.FC<CollectionSceneProps> = ({
  onRoomChange,
  onNearbyPrompt,
  onPositionUpdate,
  teleportTarget,
}) => {
  const playerPositionRef = useRef(new THREE.Vector3(...APARTMENT_MAP.playerSpawn));
  const pickupItem = useInventoryStore((s) => s.pickupItem);

  const [spawnedItems, setSpawnedItems] = useState<SpawnedItem[]>([]);

  useEffect(() => {
    const initialItems: SpawnedItem[] = [];
    APARTMENT_MAP.rooms.forEach((room) => {
      room.spawnPoints.forEach((sp) => {
        if (sp.candidateItemIds && sp.candidateItemIds.length > 0) {
          const chosenItemId = sp.candidateItemIds[0];
          initialItems.push({
            id: sp.id,
            itemId: chosenItemId,
            position: sp.position,
          });
        }
      });
    });
    setSpawnedItems(initialItems);
  }, []);

  const handlePickup = useCallback(
    (spawnId: string, itemId: string) => {
      const success = pickupItem(itemId);
      if (success) {
        setSpawnedItems((prev) => prev.filter((it) => it.id !== spawnId));
      }
    },
    [pickupItem]
  );

  useEffect(() => {
    if (!onPositionUpdate) return;
    const interval = setInterval(() => {
      if (playerPositionRef.current) {
        onPositionUpdate({
          x: playerPositionRef.current.x,
          z: playerPositionRef.current.z,
        });
      }
    }, 150);
    return () => clearInterval(interval);
  }, [onPositionUpdate]);

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [7.5, 14, 15], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Lighting />
        <Apartment />

        {spawnedItems.map((spawn) => {
          const itemDef = ITEMS_DATA[spawn.itemId];
          if (!itemDef) return null;
          return (
            <Collectible
              key={spawn.id}
              id={spawn.id}
              item={itemDef}
              position={spawn.position}
              playerPositionRef={playerPositionRef}
            />
          );
        })}

        <ThrownItems />

        <Player
          positionRef={playerPositionRef}
          spawnItems={spawnedItems}
          onPickupItem={handlePickup}
          onRoomChange={onRoomChange}
          onNearbyPrompt={onNearbyPrompt}
          teleportTarget={teleportTarget}
        />

        <CameraController targetPosition={playerPositionRef} />
      </Canvas>
    </div>
  );
};
