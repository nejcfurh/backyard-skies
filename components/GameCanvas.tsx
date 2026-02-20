'use client';

import { memo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import PlayerBird from '@/components/scene/PlayerBird';
import ThirdPersonCamera from '@/components/scene/ThirdPersonCamera';
import SuburbanWorld from '@/components/scene/SuburbanWorld';
import FeederSpawner from '@/components/scene/FeederSpawner';
import Eagle from '@/components/scene/Eagle';
import GameEnvironment from '@/components/scene/GameEnvironment';
import GameLoopRunner from '@/components/GameLoopRunner';

function SceneContent() {
  const gameState = useGameStore((s) => s.gameState);
  const isPlaying = gameState === 'flight' || gameState === 'feeding' || gameState === 'drinking';

  if (!isPlaying) return null;

  return (
    <>
      <GameEnvironment />
      <SuburbanWorld />
      <FeederSpawner />
      <Suspense fallback={null}>
        <PlayerBird />
      </Suspense>
      <Eagle />
      <ThirdPersonCamera />
      <GameLoopRunner />
    </>
  );
}

const StableCanvas = memo(function StableCanvas() {
  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 180 }}
      gl={{ antialias: false, alpha: false }}
      dpr={[1, 1]}
    >
      <SceneContent />
    </Canvas>
  );
});

export default function GameCanvas() {
  const gameState = useGameStore((s) => s.gameState);
  const showCanvas = gameState === 'flight' || gameState === 'feeding' || gameState === 'drinking';

  if (!showCanvas) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <StableCanvas />
    </div>
  );
}
