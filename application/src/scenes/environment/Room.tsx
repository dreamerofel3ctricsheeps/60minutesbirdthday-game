import React, { useMemo } from 'react';
import * as THREE from 'three';
import { RoomDefinition, FloorMaterial } from '@/types/map.types';
import { Shelf } from './Shelf';

interface RoomProps {
  room: RoomDefinition;
}

/** Generates procedural texture for wood planks / parquet */
function createWoodTexture(
  baseColor: string,
  width = 256,
  height = 256,
  pattern: 'planks' | 'parquet' = 'planks'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseColor);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  if (pattern === 'planks') {
    const plankCount = 6;
    const plankH = height / plankCount;
    for (let i = 0; i < plankCount; i++) {
      const variation = (Math.random() - 0.5) * 0.08;
      const c = base.clone().offsetHSL(0, 0, variation);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(0, i * plankH + 1, width, plankH - 2);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const y = i * plankH + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y + (Math.random() - 0.5) * 4);
        ctx.stroke();
      }
    }
    // Gap lines between planks
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 2;
    for (let i = 1; i < plankCount; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * plankH);
      ctx.lineTo(width, i * plankH);
      ctx.stroke();
    }
  } else if (pattern === 'parquet') {
    const tileW = width / 4;
    const tileH = height / 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const variation = (Math.random() - 0.5) * 0.1;
        const c = base.clone().offsetHSL(0, 0, variation);
        ctx.fillStyle = `#${c.getHexString()}`;
        ctx.fillRect(col * tileW + 1, row * tileH + 1, tileW - 2, tileH - 2);
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * tileH);
      ctx.lineTo(width, i * tileH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * tileW, 0);
      ctx.lineTo(i * tileW, height);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/** Generates a vintage Persian/geometric rug texture for Sala */
function createVintageRugTexture(width = 256, height = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dark red base with ornamental borders
  ctx.fillStyle = '#6b1d1d';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, width - 12, height - 12);

  // Second border in slate/grey
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Diamond medallion in the center
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(width / 2, 30);
  ctx.lineTo(width - 30, height / 2);
  ctx.lineTo(width / 2, height - 30);
  ctx.lineTo(30, height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center motif
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Generates a hexagonal terracotta tile pattern for bathrooms */
function createHexagonalTexture(baseColor: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseColor);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, size, size);

  const hexR = size / 8;
  const hexH = hexR * Math.sqrt(3);

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 8; col++) {
      const offsetX = row % 2 === 0 ? 0 : hexR * 1.5;
      const cx = col * hexR * 3 + offsetX;
      const cy = (row * hexH) / 2;
      const variation = (Math.random() - 0.5) * 0.12;
      const c = base.clone().offsetHSL(0, 0, variation);

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + (hexR - 2) * Math.cos(angle);
        const y = cy + (hexR - 2) * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/** Generates carpet texture with soft fiber noise */
function createCarpetTexture(baseColor: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseColor);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 3) {
    for (let y = 0; y < size; y += 3) {
      const variation = (Math.random() - 0.5) * 0.08;
      const c = base.clone().offsetHSL(0, 0, variation);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, 3, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/** Generates concrete texture with fine cement grain */
function createConcreteTexture(baseColor: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseColor);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x += 3) {
    for (let y = 0; y < size; y += 3) {
      const variation = (Math.random() - 0.5) * 0.06;
      const c = base.clone().offsetHSL(0, 0, variation);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, 3, 3);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/** Kitchen backsplash tile pattern (checkerboard bordeaux & white) */
function createBacksplashTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const tileCount = 8;
  const tileSize = size / tileCount;

  for (let row = 0; row < tileCount; row++) {
    for (let col = 0; col < tileCount; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#f8fafc' : '#7f1d1d';
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  return texture;
}

function createFloorTexture(mat: FloorMaterial): THREE.CanvasTexture | null {
  switch (mat.pattern) {
    case 'planks':
      return createWoodTexture(mat.baseColor, 256, 256, 'planks');
    case 'parquet':
      return createWoodTexture(mat.baseColor, 256, 256, 'parquet');
    case 'hexagonal':
      return createHexagonalTexture(mat.baseColor);
    case 'carpet':
      return createCarpetTexture(mat.baseColor);
    case 'plain':
      return createConcreteTexture(mat.baseColor);
    default:
      return null;
  }
}

export const Room: React.FC<RoomProps> = ({ room }) => {
  const centerX = room.bounds.x + room.bounds.width / 2;
  const centerZ = room.bounds.z + room.bounds.depth / 2;

  // Floor texture cached per room
  const floorTexture = useMemo(() => {
    if (room.floorMaterial) {
      return createFloorTexture(room.floorMaterial);
    }
    return null;
  }, [room.id, room.floorMaterial]);

  // Special decorative textures
  const vintageRugTexture = useMemo(() => {
    return room.id === 'living_room' ? createVintageRugTexture() : null;
  }, [room.id]);

  const backsplashTexture = useMemo(() => {
    return room.id === 'kitchen' ? createBacksplashTexture() : null;
  }, [room.id]);

  return (
    <group name={`Room-${room.id}`}>
      {/* ── Floor Plane (Y = 0.01) ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.01, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[room.bounds.width, room.bounds.depth]} />
        {floorTexture ? (
          <meshStandardMaterial
            map={floorTexture}
            roughness={room.floorMaterial?.roughness ?? 0.7}
            metalness={room.floorMaterial?.metalness ?? 0.05}
          />
        ) : (
          <meshStandardMaterial
            color={room.floorColor}
            roughness={0.7}
            metalness={0.1}
          />
        )}
      </mesh>

      {/* ── Sala: Vintage Rug in front of TV & Sofa (Y = 0.015) ── */}
      {room.id === 'living_room' && vintageRugTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX - 0.4, 0.015, centerZ - 0.4]}>
          <planeGeometry args={[6.0, 4.8]} />
          <meshStandardMaterial
            map={vintageRugTexture}
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* ── Habitación: Fluffy Cream Carpet under bed (Y = 0.015) ── */}
      {room.id === 'bedroom' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.015, centerZ]}>
          <planeGeometry args={[room.bounds.width * 0.85, room.bounds.depth * 0.85]} />
          <meshStandardMaterial
            color="#fafaf9"
            roughness={0.98}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* ── Cocina: Salpicadero (Backsplash) behind kitchen counter ── */}
      {room.id === 'kitchen' && backsplashTexture && (
        <mesh position={[13.0, 1.4, -2.96]}>
          <boxGeometry args={[6.0, 1.0, 0.04]} />
          <meshStandardMaterial
            map={backsplashTexture}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* ── Ascensor / Drop Zone: Floor Boundary & Accent (Y = 0.02) ── */}
      {room.isDropZone && (
        <group position={[centerX, 0.02, centerZ]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[room.bounds.width * 0.9, room.bounds.depth * 0.9]} />
            <meshBasicMaterial color="#16a34a" transparent opacity={0.2} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <planeGeometry args={[room.bounds.width * 0.9, room.bounds.depth * 0.9]} />
            <meshBasicMaterial color="#4ade80" wireframe />
          </mesh>
        </group>
      )}

      {/* ── Departamento de Vecino: ÁREA DE RIESGO (Y = 0.02) ── */}
      {room.isRiskArea && (
        <group position={[centerX, 0.02, centerZ]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[room.bounds.width * 0.95, room.bounds.depth * 0.95]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <planeGeometry args={[room.bounds.width * 0.95, room.bounds.depth * 0.95]} />
            <meshBasicMaterial color="#dc2626" wireframe />
          </mesh>
        </group>
      )}

      {/* ── Furniture Obstacles & 2-Tier Shelves ── */}
      {room.furniture.map((f) => {
        if (f.isShelf) {
          return <Shelf key={f.id} obstacle={f} />;
        }
        return (
          <mesh
            key={f.id}
            position={[f.position[0], f.position[1], f.position[2]]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={f.size} />
            <meshStandardMaterial
              color={f.color || '#475569'}
              roughness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};
