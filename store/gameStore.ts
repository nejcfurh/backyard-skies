import { create } from 'zustand';
import {
  BirdSpeciesId,
  GameState,
  ThreatType,
  DeathReason,
  LeaderboardEntry,
  FeederData,
} from '@/types';
import { BIRD_SPECIES } from '@/lib/birdSpecies';
import {
  FEEDER_COUNT,
  BIRDBATH_COUNT,
  SCORE_FEED_BONUS,
  SCORE_DRINK_BONUS,
  SCORE_EAGLE_DODGE_BONUS,
  DISTANCE_PER_UNIT,
} from '@/utils/constants';
import { isSafeFeederPosition } from '@/utils/chunkLayout';

interface GameStore {
  // Game state
  gameState: GameState;
  selectedSpecies: BirdSpeciesId;
  isPaused: boolean;
  playerName: string;
  controlScheme: 'buttons' | 'tap-steer';
  deathReason: DeathReason;

  // Player resources
  food: number;
  water: number;
  stamina: number;
  score: number;
  distance: number;

  // Player position & movement
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: number;
  isFlapping: boolean;
  flapCooldown: number;
  flapStrength: number;

  // Threats
  threatType: ThreatType;
  threatMeter: number;
  threatWarningActive: boolean;
  eagleTimer: number;
  eagleDodgeWindow: number;
  eagleDodgeStartRotation: number;
  eagleDodgeTaps: number;
  eagleAltitudeHunt: boolean;

  // Feeders
  feeders: FeederData[];
  activeFeeder: FeederData | null;
  feederCooldown: number;
  perchTime: number;

  // Leaderboard
  leaderboard: LeaderboardEntry[];

  // Actions
  setGameState: (state: GameState) => void;
  selectSpecies: (species: BirdSpeciesId) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  gameOver: (reason?: DeathReason) => void;

  // Player actions
  flap: () => void;
  setRotation: (rotation: number) => void;
  updatePosition: (pos: [number, number, number]) => void;
  updateVelocity: (vel: [number, number, number]) => void;
  setFlapCooldown: (cooldown: number) => void;

  // Resource actions
  depleteFood: (amount: number) => void;
  depleteWater: (amount: number) => void;
  depleteStamina: (amount: number) => void;
  replenishFood: (amount: number) => void;
  replenishWater: (amount: number) => void;
  replenishStamina: (amount: number) => void;
  addScore: (amount: number) => void;
  addDistance: (amount: number) => void;

  // Threat actions
  setThreat: (type: ThreatType) => void;
  setThreatMeter: (value: number) => void;
  setThreatWarning: (active: boolean) => void;
  setEagleTimer: (time: number) => void;
  setEagleDodgeWindow: (time: number) => void;
  setEagleAltitudeHunt: (active: boolean) => void;
  dodgeEagle: () => void;

  // Feeder actions
  landOnFeeder: (feeder: FeederData) => void;
  flyAway: () => void;
  refreshFeeders: () => void;
  setFeederCooldown: (time: number) => void;

  // Player profile
  setPlayerName: (name: string) => void;
  setControlScheme: (scheme: 'buttons' | 'tap-steer') => void;

  // Leaderboard
  loadLeaderboard: () => void;
  saveScore: (name: string) => void;
}

let feederIdCounter = 0;

function generateFeeders(centerX = 0, centerZ = 0): FeederData[] {
  const feeders: FeederData[] = [];
  const spread = 80; // spawn radius around center
  const MIN_SPACING = 10; // minimum distance between feeders (~5 feeder widths)

  function isFarEnough(x: number, z: number): boolean {
    for (const f of feeders) {
      const dx = f.position[0] - x;
      const dz = f.position[2] - z;
      if (dx * dx + dz * dz < MIN_SPACING * MIN_SPACING) return false;
    }
    return true;
  }

  function safePosition(): [number, number, number] {
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = centerX + (Math.random() - 0.5) * spread;
      const z = centerZ + (Math.random() - 0.5) * spread;
      if (isSafeFeederPosition(x, z) && isFarEnough(x, z)) return [x, 0, z];
    }
    // Fallback: place in front-yard band, still check spacing
    for (let attempt = 0; attempt < 10; attempt++) {
      const x = centerX + (Math.random() - 0.5) * spread;
      const chunkZ = Math.floor(x / 60) * 60;
      const z = chunkZ + (Math.random() > 0.5 ? 4.5 : -4.5);
      if (isFarEnough(x, z)) return [x, 0, z];
    }
    // Last resort fallback
    const x = centerX + (Math.random() - 0.5) * spread;
    const chunkZ = Math.floor(x / 60) * 60;
    return [x, 0, chunkZ + (Math.random() > 0.5 ? 4.5 : -4.5)];
  }

  for (let i = 0; i < FEEDER_COUNT; i++) {
    feeders.push({
      id: feederIdCounter++,
      position: safePosition(),
      hasCat: Math.random() > 0.6,
      type: 'feeder',
    });
  }

  for (let i = 0; i < BIRDBATH_COUNT; i++) {
    feeders.push({
      id: feederIdCounter++,
      position: safePosition(),
      hasCat: Math.random() > 0.7,
      type: 'birdbath',
    });
  }

  return feeders;
}

function loadLeaderboardFromStorage(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('backyard-skies-leaderboard');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: 'menu',
  selectedSpecies: 'cardinal',
  isPaused: false,
  playerName:
    typeof window !== 'undefined'
      ? localStorage.getItem('backyard-skies-name') || ''
      : '',
  controlScheme:
    (typeof window !== 'undefined'
      ? (localStorage.getItem('backyard-skies-controls') as
          | 'buttons'
          | 'tap-steer')
      : null) || 'tap-steer',
  deathReason: null,

  food: 100,
  water: 100,
  stamina: 100,
  score: 0,
  distance: 0,

  position: [0, 10, 0],
  velocity: [0, 0, 0],
  rotation: 0,
  isFlapping: false,
  flapCooldown: 0,
  flapStrength: 1,

  threatType: null,
  threatMeter: 0,
  threatWarningActive: false,
  eagleTimer: 45,
  eagleDodgeWindow: 0,
  eagleDodgeStartRotation: 0,
  eagleDodgeTaps: 0,
  eagleAltitudeHunt: false,

  feeders: [],
  activeFeeder: null,
  feederCooldown: 0,
  perchTime: 0,

  leaderboard: [],

  // State transitions
  setGameState: state => set({ gameState: state }),

  selectSpecies: species => set({ selectedSpecies: species }),

  startGame: () => {
    const species = BIRD_SPECIES[get().selectedSpecies];
    set({
      gameState: 'flight',
      food: species.attributes.maxFood,
      water: species.attributes.maxWater,
      stamina: species.attributes.stamina,
      score: 0,
      distance: 0,
      position: [0, 15, 0],
      velocity: [0, 0, 0],
      rotation: 0,
      isFlapping: false,
      flapCooldown: 0,
      flapStrength: 1,
      threatType: null,
      threatMeter: 0,
      threatWarningActive: false,
      eagleTimer: 30 + Math.random() * 60,
      eagleDodgeWindow: 0,
      eagleDodgeStartRotation: 0,
      eagleDodgeTaps: 0,
      eagleAltitudeHunt: false,
      activeFeeder: null,
      feederCooldown: 0,
      feeders: generateFeeders(),
      isPaused: false,
      deathReason: null,
    });
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  gameOver: reason => {
    const { score, distance, selectedSpecies } = get();
    set({ gameState: 'game-over', deathReason: reason || null });
    // Auto-save anonymous entry
    const leaderboard = loadLeaderboardFromStorage();
    leaderboard.push({
      name: get().playerName || 'Player',
      species: selectedSpecies,
      score,
      distance: Math.round(distance * 100) / 100,
      date: new Date().toISOString(),
    });
    leaderboard.sort((a, b) => b.score - a.score);
    const top20 = leaderboard.slice(0, 20);
    localStorage.setItem('backyard-skies-leaderboard', JSON.stringify(top20));
    set({ leaderboard: top20 });
  },

  // Player actions
  flap: () => {
    const {
      flapCooldown,
      stamina,
      gameState,
      eagleDodgeWindow,
      eagleDodgeTaps,
    } = get();
    if (flapCooldown > 0 || stamina <= 0) return;
    if (gameState !== 'flight') return;
    set({ isFlapping: true, flapCooldown: 0.15 });
    if (eagleDodgeWindow > 0) {
      set({ eagleDodgeTaps: eagleDodgeTaps + 1 });
    }
    setTimeout(() => set({ isFlapping: false }), 200);
  },

  setRotation: rotation => set({ rotation }),
  updatePosition: position => set({ position }),
  updateVelocity: velocity => set({ velocity }),
  setFlapCooldown: cooldown => set({ flapCooldown: cooldown }),

  // Resources
  depleteFood: amount => {
    const food = Math.max(0, get().food - amount);
    set({ food });
    if (food <= 0) get().gameOver('food');
  },

  depleteWater: amount => {
    const water = Math.max(0, get().water - amount);
    set({ water });
    if (water <= 0) get().gameOver('water');
  },

  depleteStamina: amount =>
    set({ stamina: Math.max(0, get().stamina - amount) }),

  replenishFood: amount => {
    const species = BIRD_SPECIES[get().selectedSpecies];
    set({ food: Math.min(species.attributes.maxFood, get().food + amount) });
  },

  replenishWater: amount => {
    const species = BIRD_SPECIES[get().selectedSpecies];
    set({ water: Math.min(species.attributes.maxWater, get().water + amount) });
  },

  replenishStamina: amount => {
    const species = BIRD_SPECIES[get().selectedSpecies];
    set({
      stamina: Math.min(species.attributes.stamina, get().stamina + amount),
    });
  },

  addScore: amount => set({ score: get().score + amount }),

  addDistance: amount =>
    set({ distance: get().distance + amount * DISTANCE_PER_UNIT }),

  // Threats
  setThreat: type => set({ threatType: type }),
  setThreatMeter: value =>
    set({ threatMeter: Math.min(100, Math.max(0, value)) }),
  setThreatWarning: active => set({ threatWarningActive: active }),
  setEagleTimer: time => set({ eagleTimer: time }),
  setEagleDodgeWindow: time => set({ eagleDodgeWindow: time }),
  setEagleAltitudeHunt: active => set({ eagleAltitudeHunt: active }),

  dodgeEagle: () => {
    set({
      threatType: null,
      threatWarningActive: false,
      eagleDodgeWindow: 0,
      eagleAltitudeHunt: false,
      eagleTimer: 30 + Math.random() * 60,
    });
    get().addScore(SCORE_EAGLE_DODGE_BONUS);
  },

  // Feeders
  landOnFeeder: feeder => {
    const newState = feeder.type === 'feeder' ? 'feeding' : 'drinking';

    let perchX: number, perchY: number, perchZ: number, perchRotation: number;

    if (feeder.type === 'feeder') {
      // Bird lands on the orange tray, directly in front of the camera lens
      // Camera is at z + 0.45 on the feeder body; bird sits closer to body, raised
      perchX = feeder.position[0];
      perchY = feeder.position[1] + 1.85; // slightly above tray level
      perchZ = feeder.position[2] + 0.9; // on the tray edge, outside the housing
      perchRotation = Math.PI; // face back toward camera (toward -z)
    } else {
      // Bird lands on the basin rim, opposite the camera unit
      // Bath is on pole: rim at y + 2.25, camera unit at z - 1.05
      perchX = feeder.position[0];
      perchY = feeder.position[1] + 2.35; // just above rim level (2.25)
      perchZ = feeder.position[2] + 1.1; // front rim, opposite camera on back
      perchRotation = Math.PI; // face back toward camera
    }

    set({
      gameState: newState as GameState,
      activeFeeder: feeder,
      threatMeter: 0,
      perchTime: 0,
      position: [perchX, perchY, perchZ],
      rotation: perchRotation,
      velocity: [0, 0, 0],
    });
  },

  flyAway: () => {
    const { activeFeeder, position, feeders } = get();
    if (!activeFeeder) return;
    const bonus =
      activeFeeder.type === 'feeder' ? SCORE_FEED_BONUS : SCORE_DRINK_BONUS;
    // Lock this feeder for 60 seconds (predator assumed nearby)
    const lockTime = Date.now() + 60_000;
    const updatedFeeders = feeders.map(f =>
      f.id === activeFeeder.id ? { ...f, lockedUntil: lockTime } : f,
    );
    set({
      gameState: 'flight',
      activeFeeder: null,
      threatMeter: 0,
      threatType: null,
      threatWarningActive: false,
      feederCooldown: 1.5,
      feeders: updatedFeeders,
      position: [position[0], position[1] + 5, position[2]],
      velocity: [0, 3, 0],
    });
    get().addScore(bonus);
  },

  setFeederCooldown: time => set({ feederCooldown: time }),

  refreshFeeders: () => {
    const { position, feeders } = get();
    // Remove feeders that are far away, spawn new ones nearby
    const maxDist = 80;
    const nearby = feeders.filter(f => {
      const dx = f.position[0] - position[0];
      const dz = f.position[2] - position[2];
      return Math.sqrt(dx * dx + dz * dz) < maxDist;
    });

    // If too few feeders nearby, spawn more ahead of the player
    if (nearby.length < 6) {
      const newFeeders = generateFeeders(position[0], position[2]);
      set({ feeders: [...nearby, ...newFeeders] });
    } else {
      set({ feeders: nearby });
    }
  },

  // Player profile
  setPlayerName: name => {
    localStorage.setItem('backyard-skies-name', name);
    set({ playerName: name });
  },

  setControlScheme: scheme => {
    localStorage.setItem('backyard-skies-controls', scheme);
    set({ controlScheme: scheme });
  },

  // Leaderboard
  loadLeaderboard: () => set({ leaderboard: loadLeaderboardFromStorage() }),

  saveScore: name => {
    const { score, distance, selectedSpecies } = get();
    const leaderboard = loadLeaderboardFromStorage();
    leaderboard.push({
      name,
      species: selectedSpecies,
      score,
      distance: Math.round(distance * 100) / 100,
      date: new Date().toISOString(),
    });
    leaderboard.sort((a, b) => b.score - a.score);
    const top20 = leaderboard.slice(0, 20);
    localStorage.setItem('backyard-skies-leaderboard', JSON.stringify(top20));
    set({ leaderboard: top20 });
  },
}));
