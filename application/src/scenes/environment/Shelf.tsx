import React, { useMemo } from 'react';
import { FurnitureObstacle } from '@/types/map.types';

interface ShelfProps {
  obstacle: FurnitureObstacle;
}

/**
 * 2-Tier Architectural Display Shelf with Integrated Ladder
 * (Repisa de 2 Niveles con Escalera para Acceso y Exhibición de Ítems)
 *
 * Características:
 * - Nivel 1 (Inferior): Y ≈ 0.85m, accesible a nivel de piso.
 * - Nivel 2 (Superior): Y ≈ 1.70m, para ítems de alto valor / alcance con escalera.
 * - Escalera inclinada con peldaños detallados y ganchos superiores.
 * - Postes de soporte, refuerzos diagonales / travesaños y ménsulas.
 * - Iluminación cálida integrada tipo vitrina para destacar los ítems exhibidos.
 */
export const Shelf: React.FC<ShelfProps> = ({ obstacle }) => {
  const { position, size, shelfConfig } = obstacle;
  const [width, height, depth] = size;

  const tier1Y = shelfConfig?.tierHeights?.[0] ?? 0.85;
  const tier2Y = shelfConfig?.tierHeights?.[1] ?? 1.7;
  const ladderSide = shelfConfig?.ladderSide ?? 'right';
  const style = shelfConfig?.style ?? 'modern_wood';

  // Aesthetic colors based on style
  const colors = useMemo(() => {
    switch (style) {
      case 'classic_library':
        return {
          wood: '#5c2c16',
          frame: '#2d1810',
          ladder: '#854d0e',
          accent: '#d97706',
          light: '#fef08a',
        };
      case 'industrial_metal':
        return {
          wood: '#78350f',
          frame: '#1e293b',
          ladder: '#475569',
          accent: '#94a3b8',
          light: '#e2e8f0',
        };
      case 'chic_white':
        return {
          wood: '#f1f5f9',
          frame: '#cbd5e1',
          ladder: '#94a3b8',
          accent: '#38bdf8',
          light: '#bae6fd',
        };
      case 'modern_wood':
      default:
        return {
          wood: '#a16207',
          frame: '#18181b',
          ladder: '#ca8a04',
          accent: '#eab308',
          light: '#fef3c7',
        };
    }
  }, [style]);

  const postRadius = 0.025;
  const plankThickness = 0.05;
  const halfW = width / 2;
  const halfD = depth / 2;

  // Ladder dimensions
  const ladderWidth = Math.min(0.48, width * 0.22);
  const ladderHeight = tier2Y + 0.15;
  const ladderXOffset =
    ladderSide === 'right'
      ? halfW - ladderWidth / 2 - 0.15
      : -halfW + ladderWidth / 2 + 0.15;
  const ladderZOffset = halfD + 0.06;
  const ladderTiltAngle = 0.14; // ~8 degrees lean

  // Ladder rungs (peldaños)
  const rungCount = 5;
  const rungSpacing = ladderHeight / (rungCount + 1);

  return (
    <group position={position} name={`Shelf-${obstacle.id}`}>
      {/* ── 4 Main Vertical Posts (Corner Pillars) ── */}
      {[
        [-halfW + postRadius, -halfD + postRadius],
        [halfW - postRadius, -halfD + postRadius],
        [-halfW + postRadius, halfD - postRadius],
        [halfW - postRadius, halfD - postRadius],
      ].map(([px, pz], idx) => (
        <mesh key={`post-${idx}`} position={[px, height / 2, pz]} castShadow receiveShadow>
          <boxGeometry args={[postRadius * 2, height, postRadius * 2]} />
          <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
        </mesh>
      ))}

      {/* ── Top Connecting Frame Rails ── */}
      <mesh position={[0, height - 0.02, -halfD + postRadius]}>
        <boxGeometry args={[width, 0.04, 0.04]} />
        <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, height - 0.02, halfD - postRadius]}>
        <boxGeometry args={[width, 0.04, 0.04]} />
        <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* ── Back Cross-Brace (X-Frame Reinforcement) ── */}
      <mesh
        position={[0, height / 2, -halfD + postRadius + 0.01]}
        rotation={[0, 0, Math.atan2(height, width)]}
      >
        <boxGeometry args={[Math.hypot(width, height) * 0.95, 0.02, 0.015]} />
        <meshStandardMaterial color={colors.frame} roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh
        position={[0, height / 2, -halfD + postRadius + 0.01]}
        rotation={[0, 0, -Math.atan2(height, width)]}
      >
        <boxGeometry args={[Math.hypot(width, height) * 0.95, 0.02, 0.015]} />
        <meshStandardMaterial color={colors.frame} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* ── NIVEL 1 (Lower Tier Board at Y ≈ 0.85m) ── */}
      <group position={[0, tier1Y, 0]}>
        {/* Support Steel Rails Underneath */}
        <mesh position={[0, -plankThickness / 2 - 0.015, -halfD + postRadius]}>
          <boxGeometry args={[width - 0.02, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, -plankThickness / 2 - 0.015, halfD - postRadius]}>
          <boxGeometry args={[width - 0.02, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Thick Beveled Shelf Plank */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width - 0.04, plankThickness, depth - 0.02]} />
          <meshStandardMaterial color={colors.wood} roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Decorative Front Bevel Trim */}
        <mesh position={[0, 0, halfD - 0.01]}>
          <boxGeometry args={[width - 0.04, plankThickness * 0.7, 0.015]} />
          <meshStandardMaterial color={colors.accent} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* ── NIVEL 2 (Upper Tier Board at Y ≈ 1.70m) ── */}
      <group position={[0, tier2Y, 0]}>
        {/* Support Steel Rails Underneath */}
        <mesh position={[0, -plankThickness / 2 - 0.015, -halfD + postRadius]}>
          <boxGeometry args={[width - 0.02, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, -plankThickness / 2 - 0.015, halfD - postRadius]}>
          <boxGeometry args={[width - 0.02, 0.03, 0.03]} />
          <meshStandardMaterial color={colors.frame} roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Thick Beveled Shelf Plank */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width - 0.04, plankThickness, depth - 0.02]} />
          <meshStandardMaterial color={colors.wood} roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Decorative Front Bevel Trim */}
        <mesh position={[0, 0, halfD - 0.01]}>
          <boxGeometry args={[width - 0.04, plankThickness * 0.7, 0.015]} />
          <meshStandardMaterial color={colors.accent} roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* ── Integrated Showcase Accent Downlight ── */}
      <pointLight
        position={[0, tier2Y - 0.1, 0]}
        color={colors.light}
        intensity={0.4}
        distance={2.5}
        decay={2}
      />

      {/* ── Integrated Library Ladder ("Escalera") ── */}
      <group
        position={[ladderXOffset, 0, ladderZOffset]}
        rotation={[-ladderTiltAngle, 0, 0]}
      >
        {/* Left Side Rail */}
        <mesh
          position={[-ladderWidth / 2, ladderHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.035, ladderHeight, 0.04]} />
          <meshStandardMaterial color={colors.ladder} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Right Side Rail */}
        <mesh
          position={[ladderWidth / 2, ladderHeight / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.035, ladderHeight, 0.04]} />
          <meshStandardMaterial color={colors.ladder} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Top Brass Hanging Hooks / Slider Rail Mounting */}
        <mesh position={[-ladderWidth / 2, ladderHeight - 0.02, -0.04]}>
          <boxGeometry args={[0.04, 0.05, 0.08]} />
          <meshStandardMaterial color={colors.accent} roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[ladderWidth / 2, ladderHeight - 0.02, -0.04]}>
          <boxGeometry args={[0.04, 0.05, 0.08]} />
          <meshStandardMaterial color={colors.accent} roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Horizontal Rungs (Peldaños) */}
        {Array.from({ length: rungCount }).map((_, idx) => {
          const rungY = rungSpacing * (idx + 1);
          return (
            <mesh
              key={`rung-${idx}`}
              position={[0, rungY, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.012, 0.012, ladderWidth - 0.03, 12]} />
              <meshStandardMaterial color={colors.accent} roughness={0.4} metalness={0.7} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
