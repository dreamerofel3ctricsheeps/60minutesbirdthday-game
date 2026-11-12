import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  targetPosition: React.RefObject<THREE.Vector3>;
}

export const CameraController: React.FC<CameraControllerProps> = ({ targetPosition }) => {
  const currentCameraPos = useRef(new THREE.Vector3(7.5, 14, 15));
  const cameraTarget = useRef(new THREE.Vector3(7.5, 0, 7.5));

  useFrame(({ camera }) => {
    if (targetPosition.current) {
      // Offset for angled top-down perspective
      const desiredX = targetPosition.current.x;
      const desiredZ = targetPosition.current.z + 7.5;
      const desiredY = 12.0;

      currentCameraPos.current.lerp(
        new THREE.Vector3(desiredX, desiredY, desiredZ),
        0.08
      );
      cameraTarget.current.lerp(targetPosition.current, 0.08);

      camera.position.copy(currentCameraPos.current);
      camera.lookAt(cameraTarget.current);
    }
  });

  return null;
};
