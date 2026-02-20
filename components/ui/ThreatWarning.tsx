'use client';

import { useGameStore } from '@/store/gameStore';

export default function ThreatWarning() {
  const threatType = useGameStore((s) => s.threatType);
  const threatWarningActive = useGameStore((s) => s.threatWarningActive);
  const eagleDodgeWindow = useGameStore((s) => s.eagleDodgeWindow);
  const eagleAltitudeHunt = useGameStore((s) => s.eagleAltitudeHunt);
  const eagleTimer = useGameStore((s) => s.eagleTimer);
  const eagleDodgeTaps = useGameStore((s) => s.eagleDodgeTaps);
  const position = useGameStore((s) => s.position);
  const gameState = useGameStore((s) => s.gameState);
  const flyAway = useGameStore((s) => s.flyAway);

  if (!threatWarningActive && !threatType) return null;

  const isEagle = threatType === 'eagle';
  const isCat = threatType === 'cat';
  const isPerched = gameState === 'feeding' || gameState === 'drinking';
  const isDodgePhase = isEagle && eagleDodgeWindow > 0;
  const nearAltitudeLimit = position[1] > 20; // EAGLE_ALTITUDE_THRESHOLD(25) - 5
  const tapsRemaining = Math.max(0, 3 - eagleDodgeTaps);

  return (
    <>
      {/* Top warning bar */}
      {isEagle && (
        <div
          className="fixed top-0 left-0 right-0 z-30 py-2.5 text-center text-[13px] font-bold text-white animate-[pulse_0.8s_ease-in-out_infinite]"
          style={{
            background: isDodgePhase
              ? 'linear-gradient(90deg, #B71C1C, #FF3D00, #B71C1C)'
              : 'linear-gradient(90deg, #E65100, #FF9800, #E65100)',
          }}
        >
          {isDodgePhase ? '⚠ PREDATOR DETECTED' : '⚠ THREAT APPROACHING'}
        </div>
      )}

      {isCat && isPerched && (
        <div className="fixed top-0 left-0 right-0 z-30 py-2.5 text-center text-[13px] font-bold text-white bg-linear-to-r from-[#B71C1C] via-[#FF3D00] to-[#B71C1C] animate-[pulse_0.8s_ease-in-out_infinite]">
          ⚠ PREDATOR DETECTED
        </div>
      )}

      {/* Screen vignette */}
      {(isDodgePhase || eagleAltitudeHunt || (isCat && isPerched)) && (
        <div className="fixed inset-0 z-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,61,0,0.35)_100%)] animate-[pulse_1s_ease-in-out_infinite]" />
      )}

      {/* Altitude hunt countdown */}
      {isEagle && eagleAltitudeHunt && !isDodgePhase && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-black/65 backdrop-blur-xl rounded-[18px] py-6 px-9 flex flex-col items-center gap-2 border border-[rgba(255,61,0,0.3)]">
            <span className="text-xs text-[#FF5252] font-bold tracking-wider">TOO HIGH</span>
            <span className="text-[48px] font-black text-white leading-none">
              {Math.ceil(Math.max(0, eagleTimer))}
            </span>
            <span className="text-sm text-white/60 font-semibold">FLY LOWER TO ESCAPE</span>
            <span className="text-[10px] text-white/30">STOP FLAPPING</span>
          </div>
        </div>
      )}

      {/* Eagle dodge prompt */}
      {isDodgePhase && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-black/65 backdrop-blur-xl rounded-[18px] py-6 px-9 flex flex-col items-center gap-2 border border-[rgba(255,61,0,0.3)] animate-[bounce-y_0.6s_ease-in-out_infinite]">
            <span className="text-xs text-[#FF5252] font-bold tracking-wider">ESCAPE NOW</span>
            {nearAltitudeLimit ? (
              <>
                <span className="text-[26px] font-black text-white">TAP TO FLAP</span>
                <span className="text-lg text-white/70 font-bold">{tapsRemaining} {tapsRemaining === 1 ? 'tap' : 'taps'} left</span>
                <span className="text-[10px] text-white/40">FLAP RAPIDLY TO SCARE IT OFF</span>
              </>
            ) : (
              <>
                <span className="text-[26px] font-black text-white">TURN 90°</span>
                <span className="text-[10px] text-white/40">CHANGE DIRECTION TO EVADE</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cat flee prompt — tap anywhere to flee */}
      {isCat && isPerched && (
        <div
          onPointerDown={(e) => { e.stopPropagation(); flyAway(); }}
          className="fixed inset-0 z-30 flex items-end justify-center pb-[140px] pointer-events-auto cursor-pointer"
        >
          <div className="bg-[rgba(183,28,28,0.85)] backdrop-blur-[10px] rounded-[18px] py-4 px-8 flex flex-col items-center gap-1 border border-[rgba(255,61,0,0.3)] animate-[bounce-y_0.6s_ease-in-out_infinite]">
            <span className="text-xs text-[rgba(255,200,200,0.8)] font-bold">ESCAPE!</span>
            <span className="text-[22px] font-black text-white">FLY AWAY</span>
            <span className="text-[9px] text-[rgba(255,200,200,0.5)]">TAP ANYWHERE</span>
          </div>
        </div>
      )}
    </>
  );
}
