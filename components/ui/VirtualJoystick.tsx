'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

interface VirtualJoystickProps {
  onMove: (x: number) => void;
}

export default function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const gameState = useGameStore((s) => s.gameState);
  const controlScheme = useGameStore((s) => s.controlScheme);
  const [active, setActive] = useState<'left' | 'right' | null>(null);

  const start = useCallback((dir: 'left' | 'right') => {
    setActive(dir);
    onMove(dir === 'left' ? 1 : -1);
  }, [onMove]);

  const stop = useCallback(() => {
    setActive(null);
    onMove(0);
  }, [onMove]);

  // Reset on global touch end (handles finger sliding off button)
  useEffect(() => {
    const handler = () => {
      setActive((prev) => {
        if (prev !== null) onMove(0);
        return null;
      });
    };
    window.addEventListener('touchend', handler);
    window.addEventListener('touchcancel', handler);
    return () => {
      window.removeEventListener('touchend', handler);
      window.removeEventListener('touchcancel', handler);
    };
  }, [onMove]);

  if (gameState !== 'flight' || controlScheme === 'tap-steer') return null;

  return (
    <>
      {/* Left steer button */}
      <div className="fixed bottom-[110px] left-5 z-20 pointer-events-auto">
        <button
          className={`w-[72px] h-[72px] rounded-full flex items-center justify-center backdrop-blur-[10px] cursor-pointer select-none touch-none ${
            active === 'left'
              ? 'bg-[rgba(0,174,239,0.35)] border-2 border-[rgba(0,174,239,0.6)]'
              : 'bg-white/8 border-[1.5px] border-white/12'
          }`}
          onTouchStart={(e) => { e.stopPropagation(); start('left'); }}
          onMouseDown={(e) => { e.stopPropagation(); start('left'); }}
          onMouseUp={(e) => { e.stopPropagation(); stop(); }}
          onMouseLeave={() => stop()}
        >
          <span className={`text-[28px] font-black leading-none ${
            active === 'left' ? 'text-[#00AEEF]' : 'text-white/40'
          }`}>&#9664;</span>
        </button>
        <p className="text-center text-[8px] text-white/25 mt-1.5 tracking-[0.15em] font-medium">LEFT</p>
      </div>

      {/* Right steer button */}
      <div className="fixed bottom-[110px] right-5 z-20 pointer-events-auto">
        <button
          className={`w-[72px] h-[72px] rounded-full flex items-center justify-center backdrop-blur-[10px] cursor-pointer select-none touch-none ${
            active === 'right'
              ? 'bg-[rgba(0,174,239,0.35)] border-2 border-[rgba(0,174,239,0.6)]'
              : 'bg-white/8 border-[1.5px] border-white/12'
          }`}
          onTouchStart={(e) => { e.stopPropagation(); start('right'); }}
          onMouseDown={(e) => { e.stopPropagation(); start('right'); }}
          onMouseUp={(e) => { e.stopPropagation(); stop(); }}
          onMouseLeave={() => stop()}
        >
          <span className={`text-[28px] font-black leading-none ${
            active === 'right' ? 'text-[#00AEEF]' : 'text-white/40'
          }`}>&#9654;</span>
        </button>
        <p className="text-center text-[8px] text-white/25 mt-1.5 tracking-[0.15em] font-medium">RIGHT</p>
      </div>
    </>
  );
}
