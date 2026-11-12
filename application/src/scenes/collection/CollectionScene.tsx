import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Apartment } from '../environment/Apartment';
import { Lighting } from '../environment/Lighting';
import { Player, RoomieNpcData } from './Player';
import { Collectible } from './Collectible';
import { ThrownItems } from './ThrownItems';
import { RoomieNpc } from './RoomieNpc';
import { CameraController } from './CameraController';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { ITEMS_DATA } from '@/data/items/items.data';
import { useInventoryStore } from '@/stores/inventory.store';
import { useRunStore } from '@/stores/run.store';
import { useGameStore } from '@/stores/game.store';
import { DEFAULT_COLLECTION_SEED } from '@/game/core/balance';
import { assignSpawnItems, SpawnedItem } from '@/game/systems/spawnAssignment';
import { placeRoomieNpcs } from '@/game/systems/roomiePlacement';

interface CollectionSceneProps {
  onRoomChange?: (roomName: string, isRisk: boolean) => void;
  onNearbyPrompt?: (prompt: string | null) => void;
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
  const pickupRoomie = useInventoryStore((s) => s.pickupRoomie);
  const carriedRoomieId = useInventoryStore((s) => s.carriedRoomieId);
  const collectedRoomieIds = useInventoryStore((s) => s.collectedRoomieIds);

  const [spawnedItems, setSpawnedItems] = useState<SpawnedItem[]>([]);
  const [roomieNpcs, setRoomieNpcs] = useState<RoomieNpcData[]>([]);

  // Arranque de la escena (Fase 2): TODO sale de la seed de la partida.
  // - Ítems: pool completo barajado entre los spawn points.
  // - Roomies NPC: los 6 no seleccionados, repartidos por el depa.
  useEffect(() => {
    const seed = useRunStore.getState().currentRun?.seed ?? DEFAULT_COLLECTION_SEED;
    const protagonistId = useGameStore.getState().selectedCharacterId;

    setSpawnedItems(assignSpawnItems(seed));
    setRoomieNpcs(
      placeRoomieNpcs(seed, protagonistId).map((p) => ({
        characterId: p.characterId,
        position: p.position,
      }))
    );
  }, []);

  const handlePickup = useCallback(
    (spawnId: string, itemId: string): boolean => {
      const success = pickupItem(itemId);
      if (success) {
        setSpawnedItems((prev) => prev.filter((it) => it.id !== spawnId));
      }
      return success;
    },
    [pickupItem]
  );

  const handlePickupRoomie = useCallback(
    (characterId: string): boolean => {
      const success = pickupRoomie(characterId);
      if (success) {
        setRoomieNpcs((prev) => prev.filter((n) => n.characterId !== characterId));
      }
      return success;
    },
    [pickupRoomie]
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

  // NPCs visibles: los que esperan y no están ya al hombro del jugador
  // ni entregados (estos últimos se renderizan en la zona segura).
  const visibleNpcs = roomieNpcs.filter(
    (n) => n.characterId !== carriedRoomieId && !collectedRoomieIds.includes(n.characterId)
  );

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

        {visibleNpcs.map((npc) => (
          <RoomieNpc
            key={npc.characterId}
            characterId={npc.characterId}
            position={npc.position}
          />
        ))}

        <ThrownItems />

        <Player
          positionRef={playerPositionRef}
          spawnItems={spawnedItems}
          onPickupItem={handlePickup}
          roomieNpcs={visibleNpcs}
          onPickupRoomie={handlePickupRoomie}
          onRoomChange={onRoomChange}
          onNearbyPrompt={onNearbyPrompt}
          teleportTarget={teleportTarget}
        />

        <CameraController targetPosition={playerPositionRef} />
      </Canvas>
    </div>
  );
};
