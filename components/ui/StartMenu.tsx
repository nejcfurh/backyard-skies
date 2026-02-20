'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import FloatingParticles from './FloatingParticles';
import { FaTrophy } from 'react-icons/fa6';
import { GoDash } from 'react-icons/go';
import Link from 'next/link';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { PiBird } from 'react-icons/pi';
import { BsQuestion } from 'react-icons/bs';

export default function StartMenu() {
  const setGameState = useGameStore(s => s.setGameState);
  const leaderboard = useGameStore(s => s.leaderboard);
  const loadLeaderboard = useGameStore(s => s.loadLeaderboard);
  const [showTips, setShowTips] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const topPlayers = leaderboard.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
      <FloatingParticles />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full pt-12 px-8 pb-6">
        {/* Title area */}
        <div className="flex flex-col items-center mb-6 mt-16">
          <div className="text-7xl font-black italic font-serif text-white tracking-tighter leading-none text-center drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
            Backyard Skies
          </div>
        </div>

        {/* Start button */}
        <div className="w-full max-w-80">
          <button
            onClick={() => {
              const hasProfile = localStorage.getItem('backyard-skies-name');
              setGameState(hasProfile ? 'species-select' : 'settings');
            }}
            className="mt-20 mb-8 w-full py-[18px] px-6 rounded-2xl font-bold text-[17px] text-white bg-linear-to-br from-[#00AEEF] to-[#0077BB] shadow-[0_6px_30px_rgba(0,174,239,0.35)] border-none cursor-pointer flex items-center justify-center gap-2.5 transition-transform active:scale-[0.96]"
          >
            START FLYING
            <span className="text-xl">
              <PiBird />
            </span>
          </button>
        </div>

        {/* Leaderboard */}
        <div className="mb-10 w-full max-w-80 bg-black/40 backdrop-blur-xl rounded-[18px] py-4 px-[18px]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span>
                <FaTrophy />
              </span>
              <span className="text-lg font-bold text-white">High Flyers</span>
            </div>
            <span className="text-xs font-bold text-[#FFD700] tracking-wider uppercase bg-[rgba(255,217,0,0.34)] py-[3px] px-2 rounded-[10px]">
              World Records
            </span>
          </div>

          {topPlayers.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {topPlayers.map((entry, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-white w-4 font-bold">
                      {i + 1}.
                    </span>
                    <div className="flex gap-1 items-center">
                      <p className="text-base text-white font-medium">
                        {entry.name}
                      </p>
                      <GoDash />
                      <p className="text-sm text-white/80 capitalize">
                        {entry.species}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[13px] text-white font-bold">
                      {entry.distance.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-white/30 ml-[3px]">
                      km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/20 text-center py-4">
              No flights yet. Be the first!
            </p>
          )}

          <button
            onClick={() => setShowRankings(true)}
            className="w-full mt-3.5 text-center text-[11px] text-[#00AEEF] font-semibold bg-transparent border-none cursor-pointer"
          >
            VIEW ALL RANKINGS
          </button>
        </div>

        {/* Bird of the Day */}
        <Link
          href="https://www.onebirdaday.com"
          className="mb-4 flex items-center gap-2.5 bg-black/30 backdrop-blur-[10px] rounded-full py-2 px-4"
        >
          <div>
            <p className="text-lg flex items-center gap-2 text-white/70 font-semibold uppercase tracking-wider text-center animate-pulse">
              Bird of the Day <BiChevronRight />
            </p>
          </div>
        </Link>

        {/* Bottom nav */}
        <div className="flex gap-9 pb-2 items-end">
          <button
            onClick={() => setGameState('settings')}
            className="flex flex-col items-center gap-1 text-white/70 text-base font-semibold tracking-wide bg-transparent border-none cursor-pointer"
          >
            <span className="text-4xl">⚙</span>
            <span>SETTINGS</span>
          </button>
          <button
            onClick={() => setShowTips(true)}
            className="flex flex-col items-center gap-1 text-white/70 text-base font-semibold tracking-wide bg-transparent border-none cursor-pointer"
          >
            <span className="text-2xl">
              <BsQuestion />
            </span>
            <span>TIPS</span>
          </button>
        </div>
      </div>

      {/* All Rankings */}
      {showRankings && (
        <div className="fixed inset-0 z-60 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
          <div className="flex flex-col h-full pt-12 px-6 pb-6">
            {/* Header */}
            <div className="relative flex items-center justify-center mb-6">
              <button
                onClick={() => setShowRankings(false)}
                className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-lg cursor-pointer"
              >
                <BiChevronLeft />
              </button>
              <span className="text-lg font-bold text-black/70 tracking-[0.25em] uppercase">
                All Rankings
              </span>
            </div>

            {/* Rankings list */}
            <div className="flex-1 overflow-auto">
              {leaderboard.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {leaderboard.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl ${
                        i < 3
                          ? 'bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.2)]'
                          : 'bg-black/40 border border-white/6'
                      } backdrop-blur-xl`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold w-7 ${i < 3 ? 'text-[#FFD700]' : 'text-white/50'}`}>
                          {i + 1}.
                        </span>
                        <div>
                          <p className="text-base text-white font-medium">
                            {entry.name}
                          </p>
                          <p className="text-xs text-white/50 capitalize">
                            {entry.species}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base text-white font-bold">
                          {Math.floor(entry.score).toLocaleString()}
                        </p>
                        <p className="text-xs text-white/40">
                          {entry.distance.toFixed(1)} km
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-white/20 text-center py-12">
                  No flights yet. Be the first!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tips & Tricks Modal */}
      {showTips && (
        <div className="fixed inset-0 z-60 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
          <div className="flex flex-col h-full pt-12 px-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowTips(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-lg cursor-pointer"
              >
                <BiChevronLeft />
              </button>
              <span className="text-lg font-bold text-black/70 tracking-[0.25em] uppercase">
                Tips & Tricks
              </span>
              <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex flex-col gap-3">
              <TipSection title="Flying" icon="🕊">
                <li>Tap the screen to flap and gain altitude</li>
                <li>
                  Use L/R buttons to steer, or tap screen sides in Tap-to-Steer
                  mode
                </li>
                <li>Stop flapping to glide and descend</li>
                <li>Hit the ground and a cat catches you — game over!</li>
              </TipSection>

              <TipSection title="Food & Water" icon="🌾">
                <li>Food and water drain as you fly — watch the top gauges</li>
                <li>Land on feeders to eat, birdbaths to drink</li>
                <li>Green glow on screen edge points to nearest feeder</li>
                <li>Blue glow points to nearest birdbath</li>
                <li>If either runs out, your bird goes down!</li>
              </TipSection>

              <TipSection title="Feeding & Drinking" icon="🍽">
                <li>Fly near a feeder or birdbath to land automatically</li>
                <li>Your bird eats or drinks while perched, earning score</li>
                <li>
                  A threat meter fills while perched — leave before it maxes
                  out!
                </li>
                <li>Tap the screen to fly away after a short landing delay</li>
              </TipSection>

              <TipSection title="Dangerous Feeders" icon="🐱">
                <li>Some feeders have a cat lurking nearby</li>
                <li>The threat meter fills much faster — react immediately!</li>
                <li>Stay too long and the cat catches you</li>
              </TipSection>

              <TipSection title="Eagle Attacks" icon="🦅">
                <li>Eagles hunt you periodically during flight</li>
                <li>Turn hard (90°) during the dodge window to evade</li>
                <li>Near the altitude limit? Tap rapidly (3 taps) instead</li>
                <li>Dodging an eagle earns bonus points!</li>
              </TipSection>

              <TipSection title="Altitude Limit" icon="⬆">
                <li>Fly too high and an eagle starts hunting you</li>
                <li>You have 4 seconds to descend — stop flapping!</li>
                <li>Drop below the warning level and the eagle backs off</li>
              </TipSection>

              <TipSection title="Scoring" icon="⭐">
                <li>Score increases over time as you fly</li>
                <li>Eating and drinking earns extra points</li>
                <li>Dodging eagles gives a big score bonus</li>
              </TipSection>

              <TipSection title="Bird Species" icon="🐦">
                <li>
                  Each bird has different stats — speed, power, stamina and more
                </li>
                <li>Some birds are faster but drain food quicker</li>
                <li>Try all four to find your favourite!</li>
              </TipSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TipSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/6">
      <p className="font-bold text-white text-base mb-2.5 flex items-center gap-2.5">
        <span className="text-xl">{icon}</span> {title}
      </p>
      <ul className="list-none pl-0 flex flex-col gap-2 text-[13px] text-white/70 leading-relaxed">
        {children}
      </ul>
    </div>
  );
}
