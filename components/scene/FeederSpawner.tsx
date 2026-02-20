'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { FeederData } from '@/types';
import { isSafeFeederPosition } from '@/utils/chunkLayout';
import Feeder from './Feeder';

const SPAWN_DISTANCE = 50;
const DESPAWN_DISTANCE = 80;
const MIN_SPACING = 15;
const SPAWN_INTERVAL = 2; // seconds

function seededRand(seed: number) {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function FeederSpawner() {
  const [feeders, setFeeders] = useState<FeederData[]>([]);
  const nextIdRef = useRef(100);
  const spawnTimerRef = useRef(0);
  const initializedRef = useRef(false);

  // Seed from store feeders on game start so they're visible immediately
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.gameState === 'flight' && prev.gameState !== 'flight') {
        initializedRef.current = false;
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    const { position, gameState, feeders: storeFeeders } = useGameStore.getState();
    if (gameState !== 'flight') return;

    // On first frame of flight, seed visual feeders from store
    if (!initializedRef.current) {
      initializedRef.current = true;
      setFeeders(storeFeeders);
      return;
    }

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current < SPAWN_INTERVAL) return;
    spawnTimerRef.current = 0;

    const px = position[0];
    const pz = position[2];

    // Remove distant feeders
    const kept = feeders.filter((f) => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < DESPAWN_DISTANCE;
    });

    // Count nearby feeders
    const nearbyCount = kept.filter((f) => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < SPAWN_DISTANCE;
    }).length;

    let updated = kept;

    // Spawn new ones if too few
    if (nearbyCount < 4) {
      const rand = seededRand(nextIdRef.current + Date.now());
      // Try several candidate positions to find one that avoids houses/roads
      let placed = false;
      for (let attempt = 0; attempt < 8 && !placed; attempt++) {
        const angle = rand() * Math.PI * 2;
        const dist = 20 + rand() * 30;
        const nx = px + Math.sin(angle) * dist;
        const nz = pz + Math.cos(angle) * dist;

        // Check spacing from existing feeders
        const tooClose = kept.some((f) => {
          const dx = f.position[0] - nx;
          const dz = f.position[2] - nz;
          return Math.sqrt(dx * dx + dz * dz) < MIN_SPACING;
        });

        if (tooClose) continue;

        // Check house/road collision
        if (!isSafeFeederPosition(nx, nz)) continue;

        const isBath = rand() > 0.55;
        const newFeeder: FeederData = {
          id: nextIdRef.current++,
          position: [nx, 0, nz],
          hasCat: rand() > 0.65,
          type: isBath ? 'birdbath' : 'feeder',
        };

        updated = [...kept, newFeeder];
        placed = true;
      }
    }

    // Batch both updates outside of render
    setFeeders(updated);

    // Sync to store so game loop can detect proximity
    const currentStoreFeeders = useGameStore.getState().feeders;
    const cleanedStore = currentStoreFeeders.filter((f) => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < DESPAWN_DISTANCE;
    });
    const newStoreEntries = updated.filter(
      (f) => !cleanedStore.some((sf) => sf.id === f.id)
    );
    if (newStoreEntries.length > 0 || cleanedStore.length !== currentStoreFeeders.length) {
      useGameStore.setState({ feeders: [...cleanedStore, ...newStoreEntries] });
    }
  });

  return (
    <>
      {feeders.map((f) => (
        <Feeder key={f.id} data={f} />
      ))}
    </>
  );
}
