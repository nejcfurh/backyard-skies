'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import GltfBirdModel from './GltfBirdModel';
import * as THREE from 'three';

// Reusable Vector3 for position lerp — avoids allocation per frame
const _birdTarget = new THREE.Vector3();

export default function PlayerBird() {
  const groupRef = useRef<THREE.Group>(null);
  const birdRef = useRef<THREE.Group>(null);
  const dyingTimer = useRef(0);
  const dyingFallSpeed = useRef(0);
  const dyingFinalized = useRef(false);

  const position = useGameStore((s) => s.position);
  const rotation = useGameStore((s) => s.rotation);
  const isFlapping = useGameStore((s) => s.isFlapping);
  const selectedSpecies = useGameStore((s) => s.selectedSpecies);
  const gameState = useGameStore((s) => s.gameState);

  const isPerched = gameState === 'feeding' || gameState === 'drinking';
  const isDying = gameState === 'dying';

  // Bird scale: small when perched, larger in flight for visibility
  // GltfBirdModel has base scale=5, outer group multiplies on top
  const targetScale = isPerched
    ? (gameState === 'feeding' ? 0.6 : 0.8)
    : 2.4;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // Reset dying state when starting a new game
    if (gameState === 'flight' && dyingTimer.current > 0) {
      dyingTimer.current = 0;
      dyingFallSpeed.current = 0;
      dyingFinalized.current = false;
    }

    // Dying tumble animation
    if (isDying) {
      dyingTimer.current += delta;

      // Tumble rotation — spin on X and Z axes
      groupRef.current.rotation.x += delta * 3;
      groupRef.current.rotation.z += delta * 2;

      // Accelerating fall (gravity)
      dyingFallSpeed.current += 9.8 * delta;
      groupRef.current.position.y -= dyingFallSpeed.current * delta;

      // Transition after 2s or ground hit
      if (!dyingFinalized.current && (dyingTimer.current > 2 || groupRef.current.position.y < 0.5)) {
        dyingFinalized.current = true;
        useGameStore.getState().finalizeDeath();
      }
      return;
    }

    // Smooth scale transition
    const curScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(curScale, targetScale, 0.08);
    groupRef.current.scale.setScalar(newScale);

    // Smooth position interpolation
    _birdTarget.set(position[0], position[1], position[2]);
    groupRef.current.position.lerp(_birdTarget, 0.15);

    // Rotate bird to face direction of travel
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      rotation,
      0.1
    );

    // Keep bird level — no pitch rotation on flap
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0,
      0.1
    );

    // Subtle bank on turns only (no bank when perched)
    const bankTarget = gameState === 'flight' ? -Math.sin(rotation - groupRef.current.rotation.y) * 0.15 : 0;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      bankTarget,
      0.08
    );

    // Perched pecking/bobbing animation
    if (birdRef.current) {
      if (isPerched) {
        const t = clock.getElapsedTime();
        // Head-bob: quick dip down then back up, repeating
        const bobCycle = (t * 2.5) % 1; // 2.5 bobs per second
        const dip = bobCycle < 0.3 ? Math.sin(bobCycle / 0.3 * Math.PI) * 0.15 : 0;
        birdRef.current.rotation.x = THREE.MathUtils.lerp(birdRef.current.rotation.x, dip, 0.25);
        // Slight side-to-side look between bobs
        const look = Math.sin(t * 0.8) * 0.1;
        birdRef.current.rotation.y = THREE.MathUtils.lerp(birdRef.current.rotation.y, look, 0.1);
      } else {
        birdRef.current.rotation.x = THREE.MathUtils.lerp(birdRef.current.rotation.x, 0, 0.15);
        birdRef.current.rotation.y = THREE.MathUtils.lerp(birdRef.current.rotation.y, 0, 0.15);
      }
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      <group ref={birdRef}>
        <GltfBirdModel isFlapping={isDying ? false : isFlapping} isPerched={isPerched} scale={5} speciesId={selectedSpecies} />
      </group>
    </group>
  );
}
