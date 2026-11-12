import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Direction, MovementState } from '@/types/sprite.types';
import {
  getRoomieSpriteData,
  resolveRoomieAnimation,
} from '@/data/characters/roomieSprites.data';

interface CharacterSpriteProps {
  /** Roomie jugable a renderizar (placeholders genéricos 64x64, Fase 1). */
  characterId: string;
  /** Dirección de animación ya expresada en ESPACIO DE CÁMARA. */
  direction: Direction;
  state: MovementState;
}

/** Cache de texturas por hoja (una por roomie), compartida entre montajes. */
const textureCache = new Map<string, THREE.Texture>();

function loadSheetTexture(sheetUrl: string): THREE.Texture {
  const cached = textureCache.get(sheetUrl);
  if (cached) return cached;
  const tex = new THREE.TextureLoader().load(sheetUrl);
  // Pixel art puro: sin suavizado ni mipmaps
  tex.generateMipmaps = false;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  textureCache.set(sheetUrl, tex);
  return tex;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  characterId,
  direction,
  state,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const animTimeRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const bobTimeRef = useRef<number>(0);
  const worldPosRef = useRef(new THREE.Vector3());

  const spriteData = useMemo(() => getRoomieSpriteData(characterId), [characterId]);
  const texture = useMemo(() => loadSheetTexture(spriteData.sheet), [spriteData]);

  const { animKey, flipH } = resolveRoomieAnimation(state, direction);
  const manifestEntry = spriteData.manifest[animKey];
  const numFrames = manifestEntry.frames.length;

  // Frame rate config (seconds per frame)
  const frameDuration = state === 'run' ? 0.12 : state === 'walk' ? 0.16 : 0.28;

  // Update UV coordinates of the plane geometry (recorte del grid 64x64)
  const updateUVs = (frameIdx: number, flip: boolean) => {
    if (!geoRef.current) return;

    const frame = manifestEntry.frames[frameIdx % manifestEntry.frames.length];
    const sheetW = manifestEntry.width;
    const sheetH = manifestEntry.height;

    // UV coordinates (Three.js origin is bottom-left (0,0))
    const u0 = frame.x / sheetW;
    const u1 = (frame.x + frame.width) / sheetW;
    const v0 = 1.0 - (frame.y + frame.height) / sheetH; // bottom
    const v1 = 1.0 - frame.y / sheetH;                  // top

    const uLeft = flip ? u1 : u0;
    const uRight = flip ? u0 : u1;

    // PlaneGeometry vertices:
    // 0: top-left (-x, +y)
    // 1: top-right (+x, +y)
    // 2: bottom-left (-x, -y)
    // 3: bottom-right (+x, -y)
    const uvAttr = geoRef.current.attributes.uv;
    if (uvAttr) {
      uvAttr.setXY(0, uLeft, v1);
      uvAttr.setXY(1, uRight, v1);
      uvAttr.setXY(2, uLeft, v0);
      uvAttr.setXY(3, uRight, v0);
      uvAttr.needsUpdate = true;
    }
  };

  // Reset animation when animation or character changes
  useEffect(() => {
    animTimeRef.current = 0;
    currentFrameRef.current = 0;
    updateUVs(0, flipH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey, flipH, characterId]);

  // Reset animation accumulators on window blur / focus / tab switch
  // to avoid fast-forward frame catch-up when returning to the game window
  useEffect(() => {
    const resetTime = () => {
      animTimeRef.current = 0;
    };

    window.addEventListener('blur', resetTime);
    window.addEventListener('focus', resetTime);
    document.addEventListener('visibilitychange', resetTime);

    return () => {
      window.removeEventListener('blur', resetTime);
      window.removeEventListener('focus', resetTime);
      document.removeEventListener('visibilitychange', resetTime);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const clampedDelta = Math.min(delta, 0.1);

    // --- Billboard cilíndrico: rotar SOLO en Y para enfrentar a la cámara ---
    group.getWorldPosition(worldPosRef.current);
    const dx = camera.position.x - worldPosRef.current.x;
    const dz = camera.position.z - worldPosRef.current.z;
    group.rotation.y = Math.atan2(dx, dz);

    // --- Peso: bob sutil según estado (la sombra blob queda en el suelo) ---
    if (state === 'idle') {
      group.position.y = 0.9;
      bobTimeRef.current = 0;
    } else {
      bobTimeRef.current += clampedDelta;
      const freq = state === 'run' ? 13 : 9;
      const amp = state === 'run' ? 0.06 : 0.035;
      group.position.y = 0.9 + Math.abs(Math.sin(bobTimeRef.current * freq)) * amp;
    }

    // --- Ticker de frames (con delta clamp, sin ráfaga al volver de fondo) ---
    if (numFrames <= 1) return;
    animTimeRef.current += clampedDelta;

    if (animTimeRef.current >= frameDuration) {
      animTimeRef.current = animTimeRef.current % frameDuration;
      currentFrameRef.current = (currentFrameRef.current + 1) % numFrames;
      updateUVs(currentFrameRef.current, flipH);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
      {/* Sprite Billboard Plane */}
      <mesh castShadow>
        <planeGeometry ref={geoRef} args={[1.5, 1.8]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          roughness={0.7}
          metalness={0.0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
