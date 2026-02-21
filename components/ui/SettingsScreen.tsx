'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { BsQuestion } from 'react-icons/bs';

export default function SettingsScreen() {
  const setGameState = useGameStore(s => s.setGameState);
  const playerName = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const [name, setName] = useState(playerName);
  const controlScheme = useGameStore(s => s.controlScheme);
  const setControlScheme = useGameStore(s => s.setControlScheme);
  const [saved, setSaved] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const isFirstTime = !playerName;

  const handleSave = () => {
    if (name.trim()) {
      setPlayerName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (showTips) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
        <div className="flex flex-col h-full pt-7 px-6">
          <div className="relative flex items-center justify-center mb-6">
            <button
              onClick={() => setShowTips(false)}
              className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-lg cursor-pointer"
            >
              <BiChevronLeft />
            </button>
            <span className="text-lg font-bold text-black/70 tracking-[0.25em] uppercase">
              Tips & Tricks
            </span>
          </div>

          <div
            style={{ scrollbarWidth: 'none' }}
            className="flex-1 overflow-auto flex flex-col gap-3"
          >
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
                A threat meter fills while perched — leave before it maxes out!
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
    );
  }

  if (showTerms) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
        <div className="flex flex-col h-full pt-6 px-6 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button
              onClick={() => setShowTerms(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-base cursor-pointer"
            >
              <BiChevronLeft />
            </button>
            <span className="text-lg font-bold uppercase text-black/70 tracking-[0.05em]">
              Terms & Conditions
            </span>
            <div className="w-10 h-10" />
          </div>

          {/* Terms content */}
          <div
            style={{ scrollbarWidth: 'none' }}
            className="flex-1 overflow-auto bg-black/5 backdrop-blur-2xl rounded-2xl p-5 border border-black/6"
          >
            <div className="text-xs text-black/60 leading-[1.8]">
              <p className="font-bold text-black text-sm mb-3">
                Backyard Skies - Terms & Conditions
              </p>
              <p className="mb-3">Last updated: February 2026</p>

              <p className="font-bold text-black/80 mb-1.5">
                1. Acceptance of Terms
              </p>
              <p className="mb-4">
                By downloading, installing, or using Backyard Skies (&quot;the
                Game&quot;), you agree to be bound by these Terms and
                Conditions. If you do not agree, please do not use the Game.
              </p>

              <p className="font-bold text-black/80 mb-1.5">
                2. Game Description
              </p>
              <p className="mb-4">
                Backyard Skies is a casual bird flight simulation game developed
                by Birdbuddy. The Game allows users to control virtual birds,
                explore procedurally generated environments, and compete on
                leaderboards.
              </p>

              <p className="font-bold text-black/80 mb-1.5">3. User Data</p>
              <p className="mb-4">
                The Game stores your player name and high scores locally on your
                device using browser storage. No personal data is transmitted to
                external servers. You may clear this data at any time by
                clearing your browser storage.
              </p>

              <p className="font-bold text-black/80 mb-1.5">
                4. Intellectual Property
              </p>
              <p className="mb-4">
                All content within the Game, including but not limited to
                graphics, designs, game mechanics, and audio, is the property of
                Birdbuddy and is protected by applicable intellectual property
                laws.
              </p>

              <p className="font-bold text-black/80 mb-1.5">5. User Conduct</p>
              <p className="mb-4">
                You agree not to exploit bugs, use automated tools, or engage in
                any activity that disrupts the intended gameplay experience.
                Leaderboard manipulation or fraudulent score submissions are
                prohibited.
              </p>

              <p className="font-bold text-black/80 mb-1.5">
                6. Disclaimer of Warranties
              </p>
              <p className="mb-4">
                The Game is provided &quot;as is&quot; without warranties of any
                kind, express or implied. Birdbuddy does not guarantee
                uninterrupted or error-free gameplay.
              </p>

              <p className="font-bold text-black/80 mb-1.5">
                7. Limitation of Liability
              </p>
              <p className="mb-4">
                In no event shall Birdbuddy be liable for any indirect,
                incidental, or consequential damages arising from your use of
                the Game.
              </p>

              <p className="font-bold text-black/80 mb-1.5">
                8. Changes to Terms
              </p>
              <p className="mb-4">
                Birdbuddy reserves the right to modify these Terms at any time.
                Continued use of the Game after changes constitutes acceptance
                of the updated Terms.
              </p>

              <p className="font-bold text-black/80 mb-1.5">9. Contact</p>
              <p className="mb-4">
                For questions regarding these Terms, please contact us at
                support@birdbuddy.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100vw h-100dvh z-50 flex flex-col bg-[url('/menu-bg.jpg')] bg-no-repeat bg-center bg-cover bg-fixed">
      <div className="flex flex-col h-full pt-6 px-6 pb-10 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!isFirstTime ? (
            <button
              onClick={() => setGameState('menu')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-lg cursor-pointer"
            >
              <BiChevronLeft />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <span className="text-lg font-bold text-black/70 tracking-[0.25em] uppercase">
            {isFirstTime ? 'Welcome' : 'Settings'}
          </span>
          <button
            onClick={() => setShowTips(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-black/8 border border-black/10 text-black text-lg cursor-pointer"
          >
            <BsQuestion />
          </button>
        </div>

        {/* Player Name Section */}
        <div className="w-full max-w-[360px] mx-auto mb-4 bg-black/40 backdrop-blur-xl rounded-[20px] p-5 border border-black/6">
          <p className="text-base text-white/70 tracking-[0.2em] uppercase font-semibold mb-3">
            Player Name
          </p>

          <div className="flex gap-2">
            <div
              className="flex-1 relative"
              onPointerDown={e => e.stopPropagation()}
            >
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                placeholder="Enter your name..."
                maxLength={16}
                className="w-full py-3 px-3.5 rounded-xl bg-white/40 border border-black/10 text-black text-sm outline-none font-[inherit] placeholder:text-black/30"
              />
            </div>
            <button
              onClick={handleSave}
              className={`py-3 px-5 rounded-xl border-none text-white text-[13px] font-bold cursor-pointer transition-colors ${
                saved ? 'bg-[#4CAF50]' : 'bg-[#3f494c]'
              }`}
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
          <button
            onClick={() => setShowTerms(true)}
            className="w-full mt-3.5 flex items-center justify-between py-3.5 px-4 rounded-xl bg-black/3 border border-white/40 text-white cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-white/80">
                Terms & Conditions
              </span>
            </div>
            <span className="text-sm text-white/50">
              <BiChevronRight />
            </span>
          </button>
        </div>

        {/* Control Scheme */}
        <div className="w-full max-w-[360px] mx-auto mb-4 bg-black/30 backdrop-blur-xl rounded-[20px] p-5 border border-black/6">
          <p className="text-base text-white/70 tracking-[0.2em] uppercase font-semibold mb-3.5">
            Controls
          </p>

          <div className="flex flex-col gap-2.5">
            {/* Buttons option */}
            <button
              onClick={() => setControlScheme('buttons')}
              className={`w-full py-3.5 px-4 rounded-xl flex items-center gap-3.5 cursor-pointer text-left ${
                controlScheme === 'buttons'
                  ? 'bg-[rgba(0,174,239,0.12)] border-2 border-[#00AEEF]'
                  : 'bg-black/3 border-2 border-white/6'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shrink-0 ${
                  controlScheme === 'buttons'
                    ? 'border-[6px] border-[#00AEEF]'
                    : 'border-2 border-white/20'
                }`}
              />
              <div>
                <p className="text-[13px] font-bold text-white/80 m-0">
                  Directional Buttons
                </p>
                <p className="text-sm text-white/50 mt-[3px] m-0">
                  Hold L/R buttons to steer, tap screen to flap
                </p>
              </div>
            </button>

            {/* Tap-steer option */}
            <button
              onClick={() => setControlScheme('tap-steer')}
              className={`w-full py-3.5 px-4 rounded-[14px] flex items-center gap-3.5 cursor-pointer text-left ${
                controlScheme === 'tap-steer'
                  ? 'bg-[rgba(0,174,239,0.12)] border-2 border-[#00AEEF]'
                  : 'bg-black/3 border-2 border-white/6'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shrink-0 ${
                  controlScheme === 'tap-steer'
                    ? 'border-[6px] border-[#00AEEF]'
                    : 'border-2 border-white/20'
                }`}
              />
              <div>
                <p className="text-[13px] font-bold text-white/80 m-0">
                  Tap to Steer
                </p>
                <p className="text-sm text-white/50 mt-[3px] m-0">
                  Tap left side to turn left, right side to turn right, center
                  to go straight — all flap
                </p>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            if (name.trim()) {
              setPlayerName(name.trim());
            }
            setGameState('species-select');
          }}
          className="w-full max-w-[360px] mx-auto mb-2 py-[18px] rounded-2xl font-extrabold text-[17px] text-white bg-linear-to-br from-[#00AEEF] to-[#0077BB] shadow-[0_6px_28px_rgba(0,174,239,0.40)] border-none cursor-pointer flex items-center justify-center gap-2.5 tracking-wide"
        >
          CHOOSE YOUR BIRD
        </button>

        {/* App info */}
        <div className="text-center mt-2 mb-4">
          <p className="text-[10px] text-white/20 mt-1">
            Version 0.0.1 · by Nejc Furh
          </p>
        </div>
      </div>
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
