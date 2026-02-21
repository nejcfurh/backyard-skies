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
const TARGET_NEARBY = 4;
const SPAWN_COOLDOWN = 0.5; // SECONDS — ONLY USED ONCE AREA IS FULLY POPULATED

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

  // SEED FROM STORE FEEDERS ON GAME START SO THEY'RE VISIBLE IMMEDIATELY
  useEffect(() => {
    const unsub = useGameStore.subscribe((state, prev) => {
      if (state.gameState === 'flight' && prev.gameState !== 'flight') {
        initializedRef.current = false;
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    const {
      position,
      gameState,
      feeders: storeFeeders,
    } = useGameStore.getState();
    if (gameState !== 'flight') return;

    // ON FIRST FRAME OF FLIGHT, SEED VISUAL FEEDERS FROM STORE
    if (!initializedRef.current) {
      initializedRef.current = true;
      setFeeders(storeFeeders);
      return;
    }

    const px = position[0];
    const pz = position[2];

    // REMOVE DISTANT FEEDERS
    const kept = feeders.filter(f => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < DESPAWN_DISTANCE;
    });

    // COUNT NEARBY FEEDERS
    const nearbyCount = kept.filter(f => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < SPAWN_DISTANCE;
    }).length;

    // SKIP SPAWNING ONLY IF AREA IS FULLY POPULATED AND COOLDOWN HASN'T ELAPSED
    spawnTimerRef.current += delta;
    if (nearbyCount >= TARGET_NEARBY && spawnTimerRef.current < SPAWN_COOLDOWN) {
      if (kept.length !== feeders.length) setFeeders(kept);
      return;
    }
    spawnTimerRef.current = 0;

    let updated = kept;
    const toSpawn = TARGET_NEARBY - nearbyCount;

    if (toSpawn > 0) {
      const rand = seededRand(nextIdRef.current + Date.now());

      for (let s = 0; s < toSpawn; s++) {
        let placed = false;
        for (let attempt = 0; attempt < 20 && !placed; attempt++) {
          const angle = rand() * Math.PI * 2;
          const dist = 15 + rand() * 35;
          const nx = px + Math.sin(angle) * dist;
          const nz = pz + Math.cos(angle) * dist;

          const tooClose = updated.some(f => {
            const dx = f.position[0] - nx;
            const dz = f.position[2] - nz;
            return Math.sqrt(dx * dx + dz * dz) < MIN_SPACING;
          });

          if (tooClose) continue;
          if (!isSafeFeederPosition(nx, nz)) continue;

          const isBath = rand() > 0.55;
          updated = [...updated, {
            id: nextIdRef.current++,
            position: [nx, 0, nz] as [number, number, number],
            hasCat: rand() > 0.65,
            type: isBath ? 'birdbath' : 'feeder',
          }];
          placed = true;
        }
      }
    }

    // BATCH BOTH UPDATES OUTSIDE OF RENDER
    setFeeders(updated);

    // SYNC TO STORE SO GAME LOOP CAN DETECT PROXIMITY
    const currentStoreFeeders = useGameStore.getState().feeders;
    const cleanedStore = currentStoreFeeders.filter(f => {
      const dx = f.position[0] - px;
      const dz = f.position[2] - pz;
      return Math.sqrt(dx * dx + dz * dz) < DESPAWN_DISTANCE;
    });
    const newStoreEntries = updated.filter(
      f => !cleanedStore.some(sf => sf.id === f.id),
    );
    if (
      newStoreEntries.length > 0 ||
      cleanedStore.length !== currentStoreFeeders.length
    ) {
      useGameStore.setState({ feeders: [...cleanedStore, ...newStoreEntries] });
    }
  });

  return (
    <>
      {feeders.map(f => (
        <Feeder key={f.id} data={f} />
      ))}
    </>
  );
}
