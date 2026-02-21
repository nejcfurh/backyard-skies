'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import * as THREE from 'three';

const CHASE_DISTANCE = 10;
const CHASE_HEIGHT = 4;
const LOOK_AHEAD = 8;
const LERP_SPEED = 3;

// Death camera
const DEATH_CHASE_DISTANCE = 18;
const DEATH_CHASE_HEIGHT = 8;

// Reusable Vector3 — avoids allocations in the render loop
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();

export default function ThirdPersonCamera() {
  const cameraTarget = useRef(new THREE.Vector3());
  const cameraPosition = useRef(new THREE.Vector3(0, 15, -10));
  const dyingTimer = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const { position, rotation, gameState, activeFeeder } = useGameStore.getState();
    const dt = Math.min(delta, 0.05);

    const sinR = Math.sin(rotation);
    const cosR = Math.cos(rotation);

    // Reset dying timer when returning to flight
    if (gameState === 'flight' && dyingTimer.current > 0) {
      dyingTimer.current = 0;
    }

    if (gameState === 'dying') {
      dyingTimer.current += dt;
      const t = Math.min(dyingTimer.current / 2, 1); // 0 to 1 over 2 seconds

      // Interpolate chase distance and height
      const dist = CHASE_DISTANCE + (DEATH_CHASE_DISTANCE - CHASE_DISTANCE) * t;
      const height = CHASE_HEIGHT + (DEATH_CHASE_HEIGHT - CHASE_HEIGHT) * t;

      _targetPos.set(
        position[0] - sinR * dist,
        position[1] + height,
        position[2] - cosR * dist
      );
      // Slower lerp for cinematic feel
      cameraPosition.current.lerp(_targetPos, LERP_SPEED * dt * 0.4);

      // Look at the falling bird
      _targetLook.set(position[0], position[1], position[2]);
      cameraTarget.current.lerp(_targetLook, LERP_SPEED * dt * 0.6);
    } else if ((gameState === 'feeding' || gameState === 'drinking') && activeFeeder) {
      // Fixed 45-degree diagonal view — avoids clipping through feeder planes
      const fx = activeFeeder.position[0];
      const fy = activeFeeder.position[1];
      const fz = activeFeeder.position[2];

      if (activeFeeder.type === 'feeder') {
        // Diagonal front-right, elevated above tray level
        _targetPos.set(fx + 2.2, fy + 3.0, fz + 2.2);
        // Look at tray area (not the bird — fixed point)
        _targetLook.set(fx, fy + 1.7, fz + 0.5);
      } else {
        // Diagonal front-right of basin — further back for better view
        _targetPos.set(fx + 3.5, fy + 4.0, fz + 3.5);
        // Look at basin rim area
        _targetLook.set(fx, fy + 2.2, fz);
      }

      cameraPosition.current.lerp(_targetPos, LERP_SPEED * dt * 0.5);
      cameraTarget.current.lerp(_targetLook, LERP_SPEED * dt);
    } else {
      // Chase camera BEHIND the bird
      _targetPos.set(
        position[0] - sinR * CHASE_DISTANCE,
        position[1] + CHASE_HEIGHT,
        position[2] - cosR * CHASE_DISTANCE
      );
      cameraPosition.current.lerp(_targetPos, LERP_SPEED * dt);

      // Look ahead of bird in its flight direction
      _targetLook.set(
        position[0] + sinR * LOOK_AHEAD,
        position[1],
        position[2] + cosR * LOOK_AHEAD
      );
      cameraTarget.current.lerp(_targetLook, LERP_SPEED * dt);
    }

    camera.position.copy(cameraPosition.current);
    camera.lookAt(cameraTarget.current);
  });

  return null;
}
