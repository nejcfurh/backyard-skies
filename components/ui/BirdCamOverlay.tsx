'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function BirdCamOverlay() {
  const gameState = useGameStore((s) => s.gameState);
  const [elapsed, setElapsed] = useState(0);
  const [blinkOn, setBlinkOn] = useState(true);

  const isActive = gameState === 'feeding' || gameState === 'drinking';

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }

    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const blink = setInterval(() => setBlinkOn((v) => !v), 800);
    return () => clearInterval(blink);
  }, [isActive]);

  if (!isActive) return null;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timestamp = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
    >
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Rounded inner frame */}
      <div
        className="absolute border border-white/20 rounded-3xl"
        style={{
          top: '12px',
          left: '12px',
          right: '12px',
          bottom: '12px',
        }}
      />

      {/* Top-left: REC indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: blinkOn ? '#FF3333' : 'transparent',
            boxShadow: blinkOn ? '0 0 6px #FF3333' : 'none',
            transition: 'opacity 0.2s',
          }}
        />
        <span
          className="text-xs font-mono tracking-wider"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          REC
        </span>
      </div>

      {/* Top-right: Timestamp */}
      <div className="absolute top-6 right-6">
        <span
          className="text-xs font-mono tracking-wider"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {timestamp}
        </span>
      </div>

      {/* Bottom-center: Branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <span
          className="text-xs font-light tracking-widest"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          birdbuddy
        </span>
      </div>
    </div>
  );
}
