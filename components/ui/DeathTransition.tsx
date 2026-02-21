'use client';

import { useEffect, useState } from 'react';

export default function DeathTransition() {
  const [phase, setPhase] = useState<'flash' | 'fade'>('flash');
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  useEffect(() => {
    // Phase 1: Brief red/white flash (0-200ms)
    let raf: number;
    const start = performance.now();

    function animateFlash() {
      const elapsed = performance.now() - start;
      if (elapsed < 100) {
        // Ramp up
        setFlashOpacity(Math.min(0.6, (elapsed / 100) * 0.6));
      } else if (elapsed < 200) {
        // Ramp down
        setFlashOpacity(0.6 * (1 - (elapsed - 100) / 100));
      } else {
        setFlashOpacity(0);
        setPhase('fade');
        return;
      }
      raf = requestAnimationFrame(animateFlash);
    }
    raf = requestAnimationFrame(animateFlash);

    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== 'fade') return;

    // Phase 2: Gradual dark overlay fade-in (200ms-2000ms)
    let raf: number;
    const start = performance.now();
    const duration = 1800;

    function animateFade() {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-in curve for natural darkening
      setFadeOpacity(t * t * 0.85);
      if (t < 1) {
        raf = requestAnimationFrame(animateFade);
      }
    }
    raf = requestAnimationFrame(animateFade);

    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <>
      {/* Red/white flash */}
      {flashOpacity > 0 && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.8), rgba(200,50,50,0.6))',
            opacity: flashOpacity,
          }}
        />
      )}
      {/* Dark fade overlay */}
      <div
        className="fixed inset-0 z-40 pointer-events-none"
        style={{
          background: '#000',
          opacity: fadeOpacity,
        }}
      />
    </>
  );
}
