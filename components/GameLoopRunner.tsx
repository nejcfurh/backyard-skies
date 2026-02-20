'use client';

import { useRef, useEffect } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameStore } from '@/store/gameStore';

export default function GameLoopRunner() {
  const joystickXRef = useRef(0);
  const tapSteerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for joystick updates via custom event from VirtualJoystick (buttons mode)
  useEffect(() => {
    const handler = (e: Event) => {
      joystickXRef.current = (e as CustomEvent<number>).detail;
    };
    window.addEventListener('joystick-move', handler);
    return () => window.removeEventListener('joystick-move', handler);
  }, []);

  // Keyboard controls for desktop (works in both modes)
  useEffect(() => {
    const keys = new Set<string>();

    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      update();

      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        const s = useGameStore.getState();
        if (s.gameState === 'feeding' || s.gameState === 'drinking') {
          if (s.perchTime >= 2) s.flyAway();
        } else {
          s.flap();
        }
      }
    };

    const onUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      update();
    };

    const update = () => {
      let x = 0;
      if (keys.has('arrowleft') || keys.has('a')) x -= 1;
      if (keys.has('arrowright') || keys.has('d')) x += 1;
      joystickXRef.current = x;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // Touch handling — behavior depends on control scheme
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const state = useGameStore.getState();

      // Only handle canvas touches (UI buttons handle themselves)
      if (target.tagName !== 'CANVAS') return;

      // Any tap while feeding/drinking → fly away (after landing animation)
      if (state.gameState === 'feeding' || state.gameState === 'drinking') {
        if (state.perchTime >= 2) state.flyAway();
        return;
      }

      if (state.controlScheme === 'tap-steer') {
        // Tap-steer: gradient steering + inverse flap strength
        // Center of screen = no turn, full flap
        // Edge of screen = max turn, minimal flap
        const touch = e.touches[0];
        const w = window.innerWidth;
        const x = touch.clientX;
        const center = w / 2;

        // -1 (left edge) to +1 (right edge)
        const normalized = (x - center) / center;
        // How far from center (0 = center, 1 = edge)
        const edgeness = Math.abs(normalized);

        // Steering: gradient from 0 at center to full at edges
        // Negative = turn right, positive = turn left (camera-behind perspective)
        joystickXRef.current = -normalized;

        // Flap strength: 1.0 at center, 0.25 at edges
        useGameStore.setState({ flapStrength: 1.0 - edgeness * 0.75 });

        // Clear previous timer
        if (tapSteerTimerRef.current) clearTimeout(tapSteerTimerRef.current);

        // Reset steering after a short duration
        tapSteerTimerRef.current = setTimeout(() => {
          joystickXRef.current = 0;
          tapSteerTimerRef.current = null;
        }, 300);

        // Flap
        state.flap();
      } else {
        // Buttons mode: tap canvas just flaps
        state.flap();
      }
    };

    window.addEventListener('touchstart', handler);
    return () => {
      window.removeEventListener('touchstart', handler);
      if (tapSteerTimerRef.current) clearTimeout(tapSteerTimerRef.current);
    };
  }, []);

  useGameLoop(joystickXRef);

  return null;
}
