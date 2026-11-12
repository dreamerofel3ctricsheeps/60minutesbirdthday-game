import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DefinedAnimationKey, Direction, MovementState } from '@/types/sprite.types';
import {
  getDefinedSpriteBundle,
  resolveDefinedAnimation,
} from '@/data/characters/definedSprites.data';

interface CharacterSpriteProps {
  /** Roomie a renderizar con su bundle de sprites de DISEÑO DEFINIDO. */
  characterId: string;
  /** Dirección de animación ya expresada en ESPACIO DE CÁMARA. */
  direction: Direction;
  state: MovementState;
  /**
   * Animación forzada que ignora estado/dirección (p. ej. 'carried' para
   * el roomie cargado al hombro). Sin ella se resuelve por locomoción.
   */
  animOverride?: DefinedAnimationKey;
  /**
   * El personaje lleva a un roomie al hombro (solo el jugador): usa la
   * familia carrywalk_* (brazos arriba sujetando) en vez de caminar
   * "normal" con los brazos abajo. En idle cargando se congela el
   * frame 0 de la pose de carga.
   */
  carrying?: boolean;
  /** Alto del plano en unidades de mundo (el ancho sale del aspect del frame). */
  planeHeight?: number;
}

/** Cache de texturas por imagen (una por strip de animación), compartida. */
const textureCache = new Map<string, THREE.Texture>();

function loadStripTexture(imageUrl: string): THREE.Texture {
  const cached = textureCache.get(imageUrl);
  if (cached) return cached;
  const tex = new THREE.TextureLoader().load(imageUrl);
  // Pixel art: sin suavizado ni mipmaps
  tex.generateMipmaps = false;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  textureCache.set(imageUrl, tex);
  return tex;
}

/**
 * Sprite 3D de un roomie con el set de DISEÑO DEFINIDO (corrección de
 * arte): una textura por animación (como el set histórico de Ximena) en
 * vez de la hoja placeholder en grid de la Fase 1.
 *
 * Se mantiene intacta la lógica de la Fase 1: billboard cilíndrico
 * (rotación Y hacia la cámara), dirección en espacio de cámara, bob con
 * peso al caminar/correr y ticker de frames con delta clamp.
 * Diferencia clave: el plano RESPETA el aspect del frame activo (los
 * frames definidos son irregulares, no celdas de 64x64).
 */
export const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  characterId,
  direction,
  state,
  animOverride,
  carrying = false,
  planeHeight = 1.8,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const animTimeRef = useRef<number>(0);
  const currentFrameRef = useRef<number>(0);
  const bobTimeRef = useRef<number>(0);
  const worldPosRef = useRef(new THREE.Vector3());

  const bundle = useMemo(() => getDefinedSpriteBundle(characterId), [characterId]);

  const { animKey, flipH } = animOverride
    ? { animKey: animOverride, flipH: false }
    : resolveDefinedAnimation(state, direction, carrying);
  /** Idle cargando: la pose de carga queda congelada en su frame 0. */
  const freezeFrame = carrying && state === 'idle' && !animOverride ? 0 : undefined;
  const anim = bundle[animKey];
  const manifestEntry = anim.entry;
  const numFrames = manifestEntry.frames.length;

  const texture = useMemo(() => loadStripTexture(anim.image), [anim.image]);
  useEffect(() => {
    if (matRef.current) {
      matRef.current.map = texture;
      matRef.current.needsUpdate = true;
    }
  }, [texture]);

  // Frame rate config (seconds per frame)
  // - idle: 0.9s por frame — el idle definido tiene 2 frames pensados
  //   como respiración/gesto en bucle lento (no pose T estática).
  // - run: 0.085s ≈ 11.8 fps — subido en la 2ª corrección de arte para
  //   que el ciclo de zancada (4 frames reales con alternancia de
  //   piernas) acompañe la velocidad de desplazamiento y no se deslice.
  const frameDuration = animOverride
    ? 0.24
    : state === 'run'
      ? 0.085
      : state === 'walk'
        ? 0.16
        : 0.9;

  // UVs del frame activo + escala del plano según su aspect (sin deformar)
  const updateUVs = (frameIdx: number, flip: boolean) => {
    if (!geoRef.current) return;

    const frame = manifestEntry.frames[frameIdx % manifestEntry.frames.length];
    const sheetW = manifestEntry.width;
    const sheetH = manifestEntry.height;

    const u0 = frame.x / sheetW;
    const u1 = (frame.x + frame.width) / sheetW;
    const v0 = 1.0 - (frame.y + frame.height) / sheetH; // bottom
    const v1 = 1.0 - frame.y / sheetH;                  // top

    const uLeft = flip ? u1 : u0;
    const uRight = flip ? u0 : u1;

    const uvAttr = geoRef.current.attributes.uv;
    if (uvAttr) {
      uvAttr.setXY(0, uLeft, v1);
      uvAttr.setXY(1, uRight, v1);
      uvAttr.setXY(2, uLeft, v0);
      uvAttr.setXY(3, uRight, v0);
      uvAttr.needsUpdate = true;
    }

    if (meshRef.current) {
      const aspect = frame.width / frame.height;
      meshRef.current.scale.set(planeHeight * aspect, planeHeight, 1);
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
    if (state === 'idle' && !animOverride) {
      group.position.y = 0.9;
      bobTimeRef.current = 0;
    } else {
      bobTimeRef.current += clampedDelta;
      // Carrera: bob más marcado (amp 0.075, freq 15) para que el cuerpo
      // acompañe el ciclo de zancada de 11.8 fps y no "patine".
      const freq = state === 'run' ? 15 : 9;
      const amp = state === 'run' ? 0.075 : 0.035;
      group.position.y = 0.9 + Math.abs(Math.sin(bobTimeRef.current * freq)) * amp;
    }

    // --- Ticker de frames (con delta clamp, sin ráfaga al volver de fondo) ---
    if (numFrames <= 1 || freezeFrame !== undefined) return;
    animTimeRef.current += clampedDelta;

    if (animTimeRef.current >= frameDuration) {
      animTimeRef.current = animTimeRef.current % frameDuration;
      currentFrameRef.current = (currentFrameRef.current + 1) % numFrames;
      updateUVs(currentFrameRef.current, flipH);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.9, 0]}>
      {/* Sprite Billboard Plane (1x1; la escala por frame la pone updateUVs) */}
      <mesh ref={meshRef} castShadow>
        <planeGeometry ref={geoRef} args={[1, 1]} />
        <meshStandardMaterial
          ref={matRef}
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
