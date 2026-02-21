'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { FeederData } from '@/types';
import { isSafeFeederPosition } from '@/utils/chunkLayout';
import Feeder from './Feeder';

const SPAWN_DISTANCE = 50;
const DESPAWN_DISTANCE = 80;
const MIN_SPACING = 20;
const SPAWN_INTERVAL = 2; // SECONDS

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

    spawnTimerRef.current += delta;
    if (spawnTimerRef.current < SPAWN_INTERVAL) return;
    spawnTimerRef.current = 0;

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

    let updated = kept;

    // SPAWN NEW ONES IF TOO FEW
    if (nearbyCount < 2) {
      const rand = seededRand(nextIdRef.current + Date.now());
      // TRY SEVERAL CANDIDATE POSITIONS TO FIND ONE THAT AVOIDES HOUSES/ROADS
      let placed = false;
      for (let attempt = 0; attempt < 8 && !placed; attempt++) {
        const angle = rand() * Math.PI * 2;
        const dist = 20 + rand() * 30;
        const nx = px + Math.sin(angle) * dist;
        const nz = pz + Math.cos(angle) * dist;

        // CHECK SPACING FROM EXISTING FEEDERS
        const tooClose = kept.some(f => {
          const dx = f.position[0] - nx;
          const dz = f.position[2] - nz;
          return Math.sqrt(dx * dx + dz * dz) < MIN_SPACING;
        });

        if (tooClose) continue;

        // CHECK HOUSE/ROAD COLLISION
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
