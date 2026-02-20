'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BIRD_SPECIES } from '@/lib/birdSpecies';
import { PiBird } from 'react-icons/pi';

const DEATH_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  food: {
    title: 'Starved Mid-Flight',
    subtitle: 'Your bird could not fly anymore due to not being fed enough',
  },
  water: {
    title: 'Dehydrated',
    subtitle: 'Lack of hydration brought your bird down',
  },
  ground: {
    title: 'Grounded!',
    subtitle: 'A cat caught your bird on the ground',
  },
  eagle: { title: 'Snatched!', subtitle: 'An eagle caught your bird mid-air' },
  cat: { title: 'Ambushed!', subtitle: 'A cat caught your bird at the feeder' },
};

const DEFAULT_DEATH = {
  title: 'Flight Over',
  subtitle: 'Your bird has landed',
};

export default function GameOverScreen() {
  const score = useGameStore(s => s.score);
  const distance = useGameStore(s => s.distance);
  const selectedSpecies = useGameStore(s => s.selectedSpecies);
  const deathReason = useGameStore(s => s.deathReason);
  const leaderboard = useGameStore(s => s.leaderboard);
  const setGameState = useGameStore(s => s.setGameState);
  const startGame = useGameStore(s => s.startGame);
  const saveScore = useGameStore(s => s.saveScore);
  const storedName = useGameStore(s => s.playerName);
  const [playerName, setPlayerName] = useState(storedName || '');
  const [saved, setSaved] = useState(false);

  const species = BIRD_SPECIES[selectedSpecies];
  const topPlayers = leaderboard.slice(0, 5);
  const death = (deathReason && DEATH_MESSAGES[deathReason]) || DEFAULT_DEATH;

  const handleSave = () => {
    if (playerName.trim()) {
      saveScore(playerName.trim());
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-b from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
      <div className="flex flex-col items-center justify-between h-full pt-12 px-6 pb-8">
        {/* Title */}
        <div className="text-center mt-4">
          <h1 className="text-4xl font-black text-white">{death.title}</h1>
          <p className="text-white/35 text-[13px] mt-1">{death.subtitle}</p>
        </div>

        {/* Score summary */}
        <div className="w-full max-w-80 bg-white/4 backdrop-blur-xl rounded-[18px] p-6 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] text-white/35 uppercase tracking-[0.15em] mb-1">
              Final Score
            </p>
            <p className="text-5xl font-black text-white">
              {Math.floor(score).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-[9px] text-white/35 uppercase tracking-wider">
                Distance
              </p>
              <p className="text-lg font-bold text-[#00AEEF]">
                {distance.toFixed(1)} km
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-white/35 uppercase tracking-wider">
                Species
              </p>
              <p className="text-lg font-bold text-white">
                {species.name.split(' ').pop()}
              </p>
            </div>
          </div>

          {!saved ? (
            <div className="w-full flex gap-2 mt-1">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
                className="flex-1 py-2.5 px-3.5 rounded-xl bg-white/8 border-none text-white text-[13px] outline-none"
              />
              <button
                onClick={handleSave}
                className="py-2.5 px-[18px] rounded-xl bg-[#00AEEF] border-none text-white text-[13px] font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#4CAF50]">Score saved!</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-80 bg-white/4 backdrop-blur-xl rounded-[18px] py-4 px-[18px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-white">High Flyers</span>
            <span className="text-[9px] font-bold text-[#FFD700] uppercase tracking-wider bg-[rgba(255,215,0,0.1)] py-[3px] px-2 rounded-[10px]">
              World Records
            </span>
          </div>

          {topPlayers.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {topPlayers.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/30 w-4 font-bold">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-[13px] text-white font-medium">
                        {entry.name}
                      </p>
                      <p className="text-[9px] text-white/30 capitalize">
                        {entry.species}
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] text-white font-bold">
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/20 text-center py-3">
              No records yet
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="w-full max-w-80 flex flex-col gap-2.5">
          <button
            onClick={() => startGame()}
            className="w-full py-[18px] rounded-2xl font-bold text-[17px] text-white bg-linear-to-br from-[#00AEEF] to-[#0077BB] shadow-[0_6px_30px_rgba(0,174,239,0.35)] border-none cursor-pointer flex items-center justify-center gap-2"
          >
            FLY AGAIN{' '}
            <span>
              <PiBird />
            </span>
          </button>

          <button
            onClick={() => setGameState('menu')}
            className="w-full py-3.5 rounded-2xl font-bold text-[13px] text-white/50 bg-white/4 border-none cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
