import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInventoryStore } from '@/stores/inventory.store';
import { useRunStore } from '@/stores/run.store';
import { useGameStore } from '@/stores/game.store';
import { useCameraStore } from '@/stores/camera.store';
import { cameraRelativeMove, directionInCameraSpace } from '@/game/systems/cameraMath';
import { APARTMENT_MAP } from '@/data/maps/apartment.data';
import { audio } from '@/services/audio.service';
import { Direction, MovementState } from '@/types/sprite.types';
import { CharacterSprite } from './CharacterSprite';
import { CarriedItems } from './CarriedItems';
import { useThrowStore } from '@/stores/throw.store';

interface PlayerProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  spawnItems: { id: string; itemId: string; position: [number, number, number] }[];
  onPickupItem: (spawnId: string, itemId: string) => void;
  onRoomChange?: (roomName: string, isRisk: boolean) => void;
  onNearbyPrompt?: (itemName: string | null) => void;
  teleportTarget?: [number, number] | null;
}

export const Player: React.FC<PlayerProps> = ({
  positionRef,
  spawnItems,
  onPickupItem,
  onRoomChange,
  onNearbyPrompt,
  teleportTarget,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const heldItemIds = useInventoryStore((s) => s.heldItemIds);
  const dropInSafetyZone = useInventoryStore((s) => s.dropInSafetyZone);
  const launchThrows = useThrowStore((s) => s.launchThrows);
  const modifyMeter = useRunStore((s) => s.modifyMeter);
  const selectedCharacterId = useGameStore((s) => s.selectedCharacterId);
  // El movimiento se orienta con el yaw OBJETIVO: responde al instante
  // aunque el giro visual de la cámara todavía esté animándose.
  const targetYaw = useCameraStore((s) => s.targetYaw);
  const lastRoomRef = useRef<string>('');
  const spriteStateRef = useRef<{ direction: Direction; state: MovementState }>({
    direction: 'down',
    state: 'idle',
  });

  // Sprite animation states
  const [spriteDirection, setSpriteDirection] = useState<Direction>('down');
  const [movementState, setMovementState] = useState<MovementState>('idle');

  // Collect all obstacle AABBs (furniture & ALL walls: exterior, load and partition)
  const obstacles = useRef<
    { xMin: number; xMax: number; zMin: number; zMax: number }[]
  >([]);

  useEffect(() => {
    const list: { xMin: number; xMax: number; zMin: number; zMax: number }[] = [];
    const playerRadius = 0.22;

    // 1. Furniture obstacles
    APARTMENT_MAP.rooms.forEach((room) => {
      room.furniture.forEach((f) => {
        const halfW = f.size[0] / 2;
        const halfD = f.size[2] / 2;
        list.push({
          xMin: f.position[0] - halfW - playerRadius,
          xMax: f.position[0] + halfW + playerRadius,
          zMin: f.position[2] - halfD - playerRadius,
          zMax: f.position[2] + halfD + playerRadius,
        });
      });
    });

    // 2. All Wall collisions (BOTH interior AND exterior perimeter walls)
    APARTMENT_MAP.walls.forEach((w) => {
      const thickness = w.thickness || (w.type === 'partition' ? 0.15 : 0.3);
      const halfT = thickness / 2;

      const isHorizontal = Math.abs(w.from[1] - w.to[1]) < 0.01;
      const isVertical = Math.abs(w.from[0] - w.to[0]) < 0.01;

      if (isHorizontal) {
        const z = w.from[1];
        list.push({
          xMin: Math.min(w.from[0], w.to[0]) - playerRadius,
          xMax: Math.max(w.from[0], w.to[0]) + playerRadius,
          zMin: z - halfT - playerRadius,
          zMax: z + halfT + playerRadius,
        });
      } else if (isVertical) {
        const x = w.from[0];
        list.push({
          xMin: x - halfT - playerRadius,
          xMax: x + halfT + playerRadius,
          zMin: Math.min(w.from[1], w.to[1]) - playerRadius,
          zMax: Math.max(w.from[1], w.to[1]) + playerRadius,
        });
      }
    });

    obstacles.current = list;
  }, []);

  // Handle external teleportation
  useEffect(() => {
    if (teleportTarget && meshRef.current) {
      meshRef.current.position.x = teleportTarget[0];
      meshRef.current.position.z = teleportTarget[1];
      positionRef.current.copy(meshRef.current.position);
    }
  }, [teleportTarget, positionRef]);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.code === 'Space') {
        const pPos = positionRef.current;
        for (const item of spawnItems) {
          const dist = Math.hypot(item.position[0] - pPos.x, item.position[2] - pPos.z);
          if (dist < 1.8) {
            onPickupItem(item.id, item.itemId);
            audio.play('ITEM_PICKUP');
            break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleWindowBlur = () => {
      // Clear key states when tab or window loses focus
      keysPressed.current = {};
      setMovementState('idle');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        keysPressed.current = {};
        setMovementState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [spawnItems, onPickupItem, positionRef]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Clamp delta to prevent physics tunneling or movement jump when returning from background tab
    const clampedDelta = Math.min(delta, 0.1);

    // Movement calculation: Shift key runs!
    // TODOS los roomies se mueven a la misma velocidad (decisión de diseño):
    // el atributo speed del personaje NO afecta el movimiento.
    const isRunning = keysPressed.current['shift'] || keysPressed.current['shiftleft'] || keysPressed.current['shiftright'];
    const baseSpeed = isRunning ? 9.2 : 6.2;

    // Input en espacio de pantalla → mundo, rotado por el yaw de la cámara:
    // W siempre aleja al personaje de la cámara, sea cual sea la rotación.
    let inputRight = 0;
    let inputForward = 0;

    if (keysPressed.current['w'] || keysPressed.current['arrowup']) inputForward += 1;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) inputForward -= 1;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) inputRight -= 1;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) inputRight += 1;

    const move = cameraRelativeMove({ right: inputRight, forward: inputForward }, targetYaw);
    const moveX = move.x;
    const moveZ = move.z;

    const isMoving = moveX !== 0 || moveZ !== 0;

    // Dirección de animación en espacio de cámara (pantalla-arriba = espaldas)
    const nextDirection: Direction = isMoving ? directionInCameraSpace(move, targetYaw) : spriteDirection;
    const nextState: MovementState = isMoving ? (isRunning ? 'run' : 'walk') : 'idle';
    if (
      spriteStateRef.current.direction !== nextDirection ||
      spriteStateRef.current.state !== nextState
    ) {
      spriteStateRef.current = { direction: nextDirection, state: nextState };
      setSpriteDirection(nextDirection);
      setMovementState(nextState);
    }

    const currentX = meshRef.current.position.x;
    const currentZ = meshRef.current.position.z;

    // Identify current room
    const currentRoom = APARTMENT_MAP.rooms.find(
      (r) =>
        currentX >= r.bounds.x &&
        currentX <= r.bounds.x + r.bounds.width &&
        currentZ >= r.bounds.z &&
        currentZ <= r.bounds.z + r.bounds.depth
    );

    if (currentRoom && currentRoom.name !== lastRoomRef.current) {
      lastRoomRef.current = currentRoom.name;
      onRoomChange?.(currentRoom.name, !!currentRoom.isRiskArea);
    }

    if (isMoving) {
      const length = Math.hypot(moveX, moveZ);
      const stepX = (moveX / length) * baseSpeed * clampedDelta;
      const stepZ = (moveZ / length) * baseSpeed * clampedDelta;

      // Sliding collision resolution with furniture AND walls (exterior + interior)
      let nextX = currentX + stepX;
      let nextZ = currentZ + stepZ;

      for (const obs of obstacles.current) {
        if (nextX >= obs.xMin && nextX <= obs.xMax && currentZ >= obs.zMin && currentZ <= obs.zMax) {
          nextX = currentX; // Block X
        }
        if (currentX >= obs.xMin && currentX <= obs.xMax && nextZ >= obs.zMin && nextZ <= obs.zMax) {
          nextZ = currentZ; // Block Z
        }
      }

      meshRef.current.position.x = nextX;
      meshRef.current.position.z = nextZ;

      // Noise buildup when moving in risk areas (neighbor apartment)
      if (currentRoom?.isRiskArea) {
        modifyMeter('noise', isRunning ? 0.22 : 0.12);
      }
    }

    positionRef.current.copy(meshRef.current.position);

    // Nearby item prompt check
    let closestItem: string | null = null;
    let minDistance = 1.8;
    for (const item of spawnItems) {
      const dist = Math.hypot(item.position[0] - currentX, item.position[2] - currentZ);
      if (dist < minDistance) {
        minDistance = dist;
        closestItem = item.itemId;
      }
    }
    onNearbyPrompt?.(closestItem);

    // Drop Zone deposit
    const dz = APARTMENT_MAP.dropZone;
    const distToDrop = Math.hypot(currentX - dz.center[0], currentZ - dz.center[1]);
    if (distToDrop <= dz.radius) {
      if (heldItemIds.length > 0) {
        const deposited = dropInSafetyZone();
        if (deposited.length > 0) {
          launchThrows(
            deposited,
            [currentX, 0, currentZ],
            dz.center,
            _.clock.getElapsedTime()
          );
          audio.play('ITEM_THROW');
        }
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={[
        APARTMENT_MAP.playerSpawn[0],
        APARTMENT_MAP.playerSpawn[1],
        APARTMENT_MAP.playerSpawn[2],
      ]}
    >
      {/* 2.5D Animated Pixel Character Sprite (roomie seleccionado) */}
      <CharacterSprite
        characterId={selectedCharacterId}
        direction={spriteDirection}
        state={movementState}
      />

      {/* Carried items visual representation */}
      <CarriedItems
        heldItemIds={heldItemIds}
        direction={spriteDirection}
        movementState={movementState}
      />

      {/* Floor Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
