'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { ObjMtlModel } from '@/components/scene/ObjMtlModel';
import * as THREE from 'three';

// Eagle by Robert Mirabelle [CC-BY] via Poly Pizza

const _eagleTarget = new THREE.Vector3();

export default function Eagle() {
  const groupRef = useRef<THREE.Group>(null);

  const threatType = useGameStore(s => s.threatType);
  const position = useGameStore(s => s.position);
  const rotation = useGameStore(s => s.rotation);
  const eagleDodgeWindow = useGameStore(s => s.eagleDodgeWindow);
  const eagleAltitudeHunt = useGameStore(s => s.eagleAltitudeHunt);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (threatType !== 'eagle') {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const t = clock.getElapsedTime();

    // Direction the bird is facing
    const forwardX = Math.sin(rotation);
    const forwardZ = Math.cos(rotation);

    if (eagleDodgeWindow > 0) {
      // Swooping attack — dive from the front toward player
      const swoopProgress = 1 - eagleDodgeWindow / 1.5;
      const dist = 8 - swoopProgress * 8;
      groupRef.current.position.set(
        position[0] + forwardX * dist + Math.sin(t * 3) * 0.5,
        position[1] + 3 - swoopProgress * 5,
        position[2] + forwardZ * dist + Math.cos(t * 3) * 0.5,
      );
    } else if (eagleAltitudeHunt) {
      // Altitude hunt — eagle hovers ahead of the bird, facing it
      const dist = 10 + Math.sin(t * 1.2) * 2;
      groupRef.current.position.set(
        position[0] + forwardX * dist,
        position[1] + 1 + Math.sin(t * 1.5) * 0.5,
        position[2] + forwardZ * dist,
      );
    } else {
      // Circling near player — slightly above, tight orbit
      const circleRadius = 5;
      groupRef.current.position.set(
        position[0] + Math.sin(t * 0.8) * circleRadius,
        position[1] + 1.5,
        position[2] + Math.cos(t * 0.8) * circleRadius,
      );
    }

    if (eagleAltitudeHunt && eagleDodgeWindow <= 0) {
      // Face the player from the side — offset perpendicular to forward direction
      const perpX = Math.cos(rotation);
      const perpZ = -Math.sin(rotation);
      _eagleTarget.set(
        position[0] + perpX * 3,
        position[1],
        position[2] + perpZ * 3,
      );
    } else {
      // Face the direction of travel (tangent to circle)
      _eagleTarget.set(
        position[0] + Math.sin(t * 0.8 + 0.1) * 5,
        groupRef.current.position.y,
        position[2] + Math.cos(t * 0.8 + 0.1) * 5,
      );
    }
    groupRef.current.lookAt(_eagleTarget);
  });

  return (
    <group ref={groupRef} visible={false}>
      <ObjMtlModel
        baseUrl="/models/myeagle/wind_eagle"
        scale={0.06}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  );
}
