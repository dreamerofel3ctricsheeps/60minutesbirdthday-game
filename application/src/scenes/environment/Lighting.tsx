import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <group name="Lighting">
      {/* Soft Ambient Light for overall base visibility */}
      <ambientLight intensity={0.7} color="#f8fafc" />

      {/* Main Directional Sun/Skylight with soft shadows across full expanded apartment */}
      <directionalLight
        position={[24, 38, 28]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-bias={-0.0005}
      />

      {/* Habitación Principal: Lámpara cálida (X=31.5, Z=4.0) */}
      <pointLight
        position={[31.5, 2.6, 4.0]}
        intensity={0.75}
        distance={15.0}
        color="#fef3c7"
      />

      {/* Sala: Iluminación ambiental cálida (X=13.0, Z=16.5) */}
      <pointLight
        position={[13.0, 2.6, 16.5]}
        intensity={0.7}
        distance={16.0}
        color="#fb923c"
      />
      {/* Sala: Acento de letrero neón rojizo en pared este */}
      <pointLight
        position={[18.2, 2.2, 16.5]}
        intensity={0.45}
        distance={8.0}
        color="#f43f5e"
      />

      {/* Comedor: Lámpara colgante cálida sobre la mesa (X=30.5, Z=16.5) */}
      <pointLight
        position={[30.5, 2.6, 16.5]}
        intensity={0.75}
        distance={15.0}
        color="#fed7aa"
      />

      {/* Cocina: Luz brillante de trabajo (X=13.0, Z=4.0) */}
      <pointLight
        position={[13.0, 2.6, 4.0]}
        intensity={0.7}
        distance={15.0}
        color="#ffffff"
      />

      {/* Librería / Estudio: Atmósfera ámbar de lectura (X=13.0, Z=34.0) */}
      <pointLight
        position={[13.0, 2.6, 34.0]}
        intensity={0.65}
        distance={15.0}
        color="#f59e0b"
      />

      {/* Departamento del Vecino: Luz tensa de advertencia rojiza (X=29.0, Z=34.0) */}
      <pointLight
        position={[29.0, 2.4, 34.0]}
        intensity={0.7}
        distance={16.0}
        color="#ef4444"
      />

      {/* Ascensor / Drop Zone: Luz fría industrial (X=4.0, Z=24.5) */}
      <pointLight
        position={[4.0, 2.4, 24.5]}
        intensity={0.6}
        distance={10.0}
        color="#86efac"
      />
    </group>
  );
};
