import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Direction, MovementState, AnimationKey } from '@/types/sprite.types';
import { XIMENA_MANIFEST, XIMENA_SHEET_PATHS } from '@/data/characters/ximenaSprites.data';

interface CharacterSpriteProps {
  direction: Direction;
  state: MovementState;
}

export const CharacterSprite: React.FC<CharacterSpriteProps> = ({ direction, state }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const animTimeRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);

  // Determine current active animation key and horizontal flip
  const { animKey, flipH } = useMemo<{ animKey: AnimationKey; flipH: boolean }>(() => {
    if (state === 'idle') {
      if (direction === 'left') return { animKey: 'idle_3_4', flipH: true };
      if (direction === 'right') return { animKey: 'idle_3_4', flipH: false };
      if (direction === 'up') return { animKey: 'idle_back', flipH: false };
      return { animKey: 'idle_front', flipH: false };
    }

    if (state === 'run') {
      if (direction === 'up') return { animKey: 'run_back', flipH: false };
      if (direction === 'left') return { animKey: 'run_right', flipH: true };
      if (direction === 'right') return { animKey: 'run_right', flipH: false };
      return { animKey: 'walk_front', flipH: false };
    }

    // walk state
    if (direction === 'up') return { animKey: 'walk_back', flipH: false };
    if (direction === 'left') return { animKey: 'walk_right', flipH: true };
    if (direction === 'right') return { animKey: 'walk_right', flipH: false };
    return { animKey: 'walk_front', flipH: false };
  }, [state, direction]);

  // Load and cache textures with NearestFilter for crisp pixel art
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map<AnimationKey, THREE.Texture>();

    (Object.keys(XIMENA_SHEET_PATHS) as AnimationKey[]).forEach((key) => {
      const tex = loader.load(XIMENA_SHEET_PATHS[key]);
      tex.generateMipmaps = false;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      map.set(key, tex);
    });

    return map;
  }, []);

  const activeTexture = textures.get(animKey);
  const manifestEntry = XIMENA_MANIFEST[animKey];
  const numFrames = manifestEntry ? manifestEntry.frames.length : 1;

  // Frame rate config (seconds per frame)
  const frameDuration = state === 'run' ? 0.12 : state === 'walk' ? 0.16 : 0.28;

  // Update UV coordinates of the plane geometry
  const updateUVs = (frameIdx: number, flip: boolean) => {
    if (!geoRef.current || !manifestEntry) return;

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

  // Reset animation when animation changes
  useEffect(() => {
    animTimeRef.current = 0;
    currentFrameRef.current = 0;
    updateUVs(0, flipH);
  }, [animKey, flipH]);

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

  // Frame ticker with delta clamping and overflow prevention
  useFrame((_, delta) => {
    // Single-frame static animations (like idle_back) stay on frame 0
    if (numFrames <= 1) return;

    // Clamp delta to prevent animation burst/replay when returning from background tab
    const clampedDelta = Math.min(delta, 0.1);
    animTimeRef.current += clampedDelta;

    if (animTimeRef.current >= frameDuration) {
      animTimeRef.current = animTimeRef.current % frameDuration;
      currentFrameRef.current = (currentFrameRef.current + 1) % numFrames;
      updateUVs(currentFrameRef.current, flipH);
    }
  });

  return (
    <group position={[0, 0.9, 0]}>
      {/* Sprite Billboard Plane */}
      <mesh ref={meshRef} castShadow>
        <planeGeometry ref={geoRef} args={[1.5, 1.8]} />
        {activeTexture && (
          <meshStandardMaterial
            map={activeTexture}
            transparent
            alphaTest={0.05}
            roughness={0.7}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
    </group>
  );
};
