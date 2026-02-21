'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import * as THREE from 'three';

const CLOUD_COUNT = 12;
const CLOUD_Y_MIN = 25;
const CLOUD_Y_MAX = 35;
const CLOUD_SPREAD = 120;
const DRIFT_SPEED = 1.5;

interface CloudData {
  offset: THREE.Vector3;
  scale: THREE.Vector3;
  opacity: number;
}

export default function Clouds() {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo<CloudData[]>(() => {
    return Array.from({ length: CLOUD_COUNT }, () => ({
      offset: new THREE.Vector3(
        (Math.random() - 0.5) * CLOUD_SPREAD,
        CLOUD_Y_MIN + Math.random() * (CLOUD_Y_MAX - CLOUD_Y_MIN),
        (Math.random() - 0.5) * CLOUD_SPREAD
      ),
      scale: new THREE.Vector3(
        8 + Math.random() * 12,
        2 + Math.random() * 3,
        1
      ),
      opacity: 0.15 + Math.random() * 0.2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const playerPos = useGameStore.getState().position;

    // Drift clouds and keep them around player
    groupRef.current.children.forEach((child, i) => {
      const cloud = clouds[i];
      if (!cloud) return;

      // Drift
      cloud.offset.x += DRIFT_SPEED * delta;

      // Wrap around player
      let cx = playerPos[0] + cloud.offset.x;
      const cz = playerPos[2] + cloud.offset.z;

      // Wrap X around player
      const halfSpread = CLOUD_SPREAD / 2;
      if (cx - playerPos[0] > halfSpread) {
        cloud.offset.x -= CLOUD_SPREAD;
        cx -= CLOUD_SPREAD;
      } else if (cx - playerPos[0] < -halfSpread) {
        cloud.offset.x += CLOUD_SPREAD;
        cx += CLOUD_SPREAD;
      }

      child.position.set(cx, cloud.offset.y, cz);
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          position={[cloud.offset.x, cloud.offset.y, cloud.offset.z]}
          scale={[cloud.scale.x, cloud.scale.y, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={cloud.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
