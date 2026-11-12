import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraStore } from '@/stores/camera.store';

interface CameraControllerProps {
  targetPosition: React.RefObject<THREE.Vector3>;
}

/** Altura de la cámara y distancia horizontal al jugador (inclinación histórica). */
const CAMERA_HEIGHT = 12.0;
const CAMERA_DISTANCE = 7.5;

export const CameraController: React.FC<CameraControllerProps> = ({ targetPosition }) => {
  const currentCameraPos = useRef(new THREE.Vector3(7.5, 14, 15));
  const cameraTarget = useRef(new THREE.Vector3(7.5, 0, 7.5));
  const desiredPos = useRef(new THREE.Vector3());

  // Q / E: rotar la cámara 90° alrededor del jugador (pasos, con animación suave)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === 'q') useCameraStore.getState().rotateLeft();
      else if (key === 'e') useCameraStore.getState().rotateRight();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame(({ camera }, delta) => {
    if (!targetPosition.current) return;

    // Avanzar el yaw suavizado hacia el objetivo (giro animado de 90°)
    useCameraStore.getState().advanceYaw(delta);
    const yaw = useCameraStore.getState().yaw;

    // Órbita: la cámara rodea al jugador manteniendo altura y distancia
    desiredPos.current.set(
      targetPosition.current.x + Math.sin(yaw) * CAMERA_DISTANCE,
      CAMERA_HEIGHT,
      targetPosition.current.z + Math.cos(yaw) * CAMERA_DISTANCE
    );

    const posLerp = 1 - Math.exp(-10 * Math.min(delta, 0.1));
    currentCameraPos.current.lerp(desiredPos.current, posLerp);
    cameraTarget.current.lerp(targetPosition.current, 0.12);

    camera.position.copy(currentCameraPos.current);
    camera.lookAt(cameraTarget.current);
  });

  return null;
};
