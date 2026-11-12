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
import { CarriedRoomie, CARRIED_ROOMIE_HANDS_OFFSET } from './CarriedRoomie';
import { useThrowStore } from '@/stores/throw.store';
import { ITEMS_DATA } from '@/data/items/items.data';
import { CHARACTERS_DATA } from '@/data/characters/characters.data';
import { canThrowLoad } from '@/game/systems/carryLogic';

export interface RoomieNpcData {
  characterId: string;
  position: [number, number, number];
}

interface PlayerProps {
  positionRef: React.MutableRefObject<THREE.Vector3>;
  spawnItems: { id: string; itemId: string; position: [number, number, number] }[];
  onPickupItem: (spawnId: string, itemId: string) => boolean;
  roomieNpcs: RoomieNpcData[];
  onPickupRoomie: (characterId: string) => boolean;
  onRoomChange?: (roomName: string, isRisk: boolean) => void;
  onNearbyPrompt?: (prompt: string | null) => void;
  teleportTarget?: [number, number] | null;
}

const PICKUP_RADIUS = 1.8;

export const Player: React.FC<PlayerProps> = ({
  positionRef,
  spawnItems,
  onPickupItem,
  roomieNpcs,
  onPickupRoomie,
  onRoomChange,
  onNearbyPrompt,
  teleportTarget,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const heldItemIds = useInventoryStore((s) => s.heldItemIds);
  const carriedRoomieId = useInventoryStore((s) => s.carriedRoomieId);
  const launchThrows = useThrowStore((s) => s.launchThrows);
  const launchRoomieThrow = useThrowStore((s) => s.launchRoomieThrow);
  const modifyMeter = useRunStore((s) => s.modifyMeter);
  /** Último tiempo del reloj 3D, para lanzar arrojos desde el teclado. */
  const clockTimeRef = useRef(0);
  const lastPromptRef = useRef<string | null>(null);
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

        // La entidad recogible MÁS CERCANA gana: ítem o roomie.
        let nearestItem: { id: string; itemId: string } | null = null;
        let nearestItemDist = PICKUP_RADIUS;
        for (const item of spawnItems) {
          const dist = Math.hypot(item.position[0] - pPos.x, item.position[2] - pPos.z);
          if (dist < nearestItemDist) {
            nearestItemDist = dist;
            nearestItem = item;
          }
        }

        let nearestRoomieId: string | null = null;
        let nearestRoomieDist = PICKUP_RADIUS;
        for (const npc of roomieNpcs) {
          const dist = Math.hypot(npc.position[0] - pPos.x, npc.position[2] - pPos.z);
          if (dist < nearestRoomieDist) {
            nearestRoomieDist = dist;
            nearestRoomieId = npc.characterId;
          }
        }

        if (nearestRoomieId && (!nearestItem || nearestRoomieDist <= nearestItemDist)) {
          if (onPickupRoomie(nearestRoomieId)) audio.play('ITEM_PICKUP');
        } else if (nearestItem) {
          if (onPickupItem(nearestItem.id, nearestItem.itemId)) audio.play('ITEM_PICKUP');
        }
      }

      // Botón de ARROJAR (Fase 2): solo dentro de la zona segura.
      if (e.code === 'KeyF') {
        const pPos = positionRef.current;
        const dz = APARTMENT_MAP.dropZone;
        const distToDrop = Math.hypot(pPos.x - dz.center[0], pPos.z - dz.center[1]);
        const thrown = useInventoryStore.getState().attemptThrow(distToDrop <= dz.radius);
        if (thrown) {
          if (thrown.roomieId) {
            launchRoomieThrow(
              thrown.roomieId,
              [pPos.x, 0, pPos.z],
              dz.center,
              clockTimeRef.current
            );
          }
          if (thrown.items.length > 0) {
            launchThrows(
              thrown.items,
              [pPos.x, 0, pPos.z],
              dz.center,
              clockTimeRef.current + (thrown.roomieId ? 0.15 : 0)
            );
          }
          if (thrown.roomieId || thrown.items.length > 0) audio.play('ITEM_THROW');
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
  }, [spawnItems, onPickupItem, roomieNpcs, onPickupRoomie, launchThrows, launchRoomieThrow, positionRef]);

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
    clockTimeRef.current = _.clock.getElapsedTime();

    // Prompt contextual (Fase 2): SIN depósito automático. Prioridad:
    // 1) En la zona segura con carga → "F Arrojar"
    // 2) Roomie cercano → "ESPACIO Cargar a {nombre}"
    // 3) Ítem cercano → "ESPACIO Recoger {ítem}"
    const inv = useInventoryStore.getState();
    const dz = APARTMENT_MAP.dropZone;
    const distToDrop = Math.hypot(currentX - dz.center[0], currentZ - dz.center[1]);
    const inDropZone = distToDrop <= dz.radius;

    let prompt: string | null = null;
    if (canThrowLoad(inv, inDropZone)) {
      prompt = inv.carriedRoomieId
        ? `F Arrojar a ${CHARACTERS_DATA[inv.carriedRoomieId]?.name ?? 'roomie'} y la carga`
        : 'F Arrojar la carga';
    } else {
      let nearestRoomie: { name: string; dist: number } | null = null;
      for (const npc of roomieNpcs) {
        const dist = Math.hypot(npc.position[0] - currentX, npc.position[2] - currentZ);
        if (dist < PICKUP_RADIUS && (!nearestRoomie || dist < nearestRoomie.dist)) {
          nearestRoomie = {
            name: CHARACTERS_DATA[npc.characterId]?.name ?? npc.characterId,
            dist,
          };
        }
      }
      let nearestItem: { name: string; dist: number } | null = null;
      for (const item of spawnItems) {
        const dist = Math.hypot(item.position[0] - currentX, item.position[2] - currentZ);
        if (dist < PICKUP_RADIUS && (!nearestItem || dist < nearestItem.dist)) {
          nearestItem = { name: ITEMS_DATA[item.itemId]?.name ?? item.itemId, dist };
        }
      }
      if (nearestRoomie && (!nearestItem || nearestRoomie.dist <= nearestItem.dist)) {
        prompt = `ESPACIO Cargar a ${nearestRoomie.name}`;
      } else if (nearestItem) {
        prompt = `ESPACIO Recoger ${nearestItem.name}`;
      }
    }

    if (prompt !== lastPromptRef.current) {
      lastPromptRef.current = prompt;
      onNearbyPrompt?.(prompt);
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

      {/* Roomie cargado al hombro (Fase 2) */}
      {carriedRoomieId && (
        <CarriedRoomie
          characterId={carriedRoomieId}
          direction={spriteDirection}
          movementState={movementState}
        />
      )}

      {/* Ítems cargados: si hay roomie al hombro, los lleva ÉL en las
          manos (se montan en su posición); si no, los lleva el
          protagonista como siempre. */}
      {carriedRoomieId ? (
        <group position={CARRIED_ROOMIE_HANDS_OFFSET}>
          <CarriedItems
            heldItemIds={heldItemIds}
            direction={spriteDirection}
            movementState={movementState}
          />
        </group>
      ) : (
        <CarriedItems
          heldItemIds={heldItemIds}
          direction={spriteDirection}
          movementState={movementState}
        />
      )}

      {/* Floor Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};
