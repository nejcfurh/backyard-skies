'use client';

import { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { BIRD_SPECIES } from '@/lib/birdSpecies';
import {
  GRAVITY,
  FORWARD_SPEED_BASE,
  TURN_SPEED,
  MAX_ALTITUDE,
  MIN_ALTITUDE,
  SCORE_PER_SECOND,
  FEEDER_PROXIMITY,
  EAGLE_WARNING_TIME,
  EAGLE_DODGE_WINDOW,
  EAGLE_ALTITUDE_THRESHOLD,
  THREAT_METER_BASE_RATE,
  THREAT_METER_CAT_MULTIPLIER,
  THREAT_METER_MAX,
} from '@/utils/constants';
import * as THREE from 'three';
import { audioManager } from '@/lib/audioManager';

export function useGameLoop(joystickXRef: MutableRefObject<number>) {
  const scoreAccumulator = useRef(0);
  const lastPosition = useRef(new THREE.Vector3());
  const feederRefreshTimer = useRef(0);
  const flapApplied = useRef(false);
  const windStarted = useRef(false);
  const eagleSoundPlayed = useRef(false);

  useFrame((_, delta) => {
    const state = useGameStore.getState();
    if (state.isPaused) {
      windStarted.current = false;
      return;
    }

    // Reset wind flag when not in flight
    if (state.gameState !== 'flight') {
      windStarted.current = false;
    }

    const clamped = Math.min(delta, 0.05);
    const species = BIRD_SPECIES[state.selectedSpecies];
    const joystickX = joystickXRef.current;

    if (state.gameState === 'flight') {
      // Start wind loop if not already playing
      if (!windStarted.current) {
        windStarted.current = true;
        audioManager.play('wind', { loop: true, volume: 0.08 });
      }

      // Modulate wind volume based on speed
      const speed = Math.sqrt(
        state.velocity[0] * state.velocity[0] +
        state.velocity[1] * state.velocity[1] +
        state.velocity[2] * state.velocity[2]
      );
      audioManager.setWindVolume(Math.min(0.15, speed * 0.012));

      // Play eagle screech when threat appears
      if (state.threatType === 'eagle' && !eagleSoundPlayed.current) {
        eagleSoundPlayed.current = true;
        audioManager.play('eagle', { volume: 0.2 });
      }
      if (state.threatType !== 'eagle') {
        eagleSoundPlayed.current = false;
      }

      updateFlight(
        state,
        species,
        joystickX,
        clamped,
        scoreAccumulator,
        lastPosition,
        flapApplied,
      );

      // Periodically refresh feeders for infinite terrain
      feederRefreshTimer.current += clamped;
      if (feederRefreshTimer.current > 3) {
        feederRefreshTimer.current = 0;
        state.refreshFeeders();
      }
    } else if (
      state.gameState === 'feeding' ||
      state.gameState === 'drinking'
    ) {
      updateFeeding(state, species, clamped);
    }
  });
}

function updateFlight(
  state: ReturnType<typeof useGameStore.getState>,
  species: (typeof BIRD_SPECIES)[string],
  joystickX: number,
  delta: number,
  scoreAccumulator: MutableRefObject<number>,
  lastPosition: MutableRefObject<THREE.Vector3>,
  flapApplied: MutableRefObject<boolean>,
) {
  const {
    position,
    velocity,
    rotation,
    isFlapping,
    flapCooldown,
    flapStrength,
  } = state;
  const attrs = species.attributes;

  // Update rotation from joystick
  const newRotation = rotation + joystickX * TURN_SPEED * delta;
  state.setRotation(newRotation);

  // Calculate forward direction
  const forwardX = Math.sin(newRotation);
  const forwardZ = Math.cos(newRotation);

  // Forward speed based on species
  const forwardSpeed = (FORWARD_SPEED_BASE * attrs.speed) / 20;

  // Vertical velocity from previous frame
  let vy = velocity[1];

  // Apply gravity (strong pull when not flapping)
  vy += GRAVITY * 0.6 * delta;

  // Apply flap impulse ONCE per tap — frame-rate independent
  if (isFlapping && !flapApplied.current) {
    flapApplied.current = true;
    vy += 6.0 * attrs.flapPower * flapStrength;
    state.depleteStamina(2);
  }
  if (!isFlapping) {
    flapApplied.current = false;
  }

  // Frame-rate independent drag: 0.97 per frame at 60fps → exp(-1.82 * dt)
  vy *= Math.exp(-1.82 * delta);

  // Calculate new position
  const newX = position[0] + forwardX * forwardSpeed * delta;
  let newY = position[1] + vy * delta;
  const newZ = position[2] + forwardZ * forwardSpeed * delta;

  // Clamp altitude
  newY = Math.max(MIN_ALTITUDE, Math.min(MAX_ALTITUDE, newY));

  // Ground collision — bird hit the ground
  if (newY <= MIN_ALTITUDE && vy <= 0) {
    vy = Math.max(0, vy);
    // If the bird is sitting at ground level, game over
    if (position[1] <= MIN_ALTITUDE + 0.1 && velocity[1] <= 0) {
      state.gameOver('ground');
      return;
    }
  }

  state.updatePosition([newX, newY, newZ]);
  state.updateVelocity([forwardX * forwardSpeed, vy, forwardZ * forwardSpeed]);

  // Update flap cooldown
  if (flapCooldown > 0) {
    state.setFlapCooldown(Math.max(0, flapCooldown - delta));
  }

  // Deplete resources
  state.depleteFood(attrs.foodDrain * delta);
  state.depleteWater(attrs.waterDrain * delta);

  // Regenerate stamina slowly during flight
  state.replenishStamina(3 * delta);

  // Score
  scoreAccumulator.current += SCORE_PER_SECOND * delta;
  if (scoreAccumulator.current >= 1) {
    const points = Math.floor(scoreAccumulator.current);
    state.addScore(points);
    scoreAccumulator.current -= points;
  }

  // Distance — reuse lastPosition ref, avoid allocation
  const dx = newX - lastPosition.current.x;
  const dy = newY - lastPosition.current.y;
  const dz = newZ - lastPosition.current.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist > 0.01) {
    state.addDistance(dist);
    lastPosition.current.set(newX, newY, newZ);
  }

  // Tick down feeder cooldown (prevents immediate re-landing after flyAway)
  if (state.feederCooldown > 0) {
    state.setFeederCooldown(Math.max(0, state.feederCooldown - delta));
  }

  // Check feeder proximity (only if cooldown expired, skip locked feeders)
  if (state.feederCooldown <= 0) {
    const now = Date.now();
    for (const feeder of state.feeders) {
      if (feeder.lockedUntil && feeder.lockedUntil > now) continue;
      const dx = newX - feeder.position[0];
      const dy = newY - feeder.position[1];
      const dz = newZ - feeder.position[2];
      const distToFeeder = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distToFeeder < FEEDER_PROXIMITY && newY < feeder.position[1] + 4) {
        state.landOnFeeder(feeder);
        return;
      }
    }
  }

  // Altitude-based eagle hunting
  if (newY > EAGLE_ALTITUDE_THRESHOLD && !state.eagleAltitudeHunt) {
    // Too high — eagle starts hunting immediately
    state.setEagleAltitudeHunt(true);
    state.setThreatWarning(true);
    state.setThreat('eagle');
    state.setEagleTimer(4); // 4 seconds to descend or get caught
    return; // skip timer logic this frame so the 4s doesn't get overwritten
  } else if (newY <= EAGLE_ALTITUDE_THRESHOLD && state.eagleAltitudeHunt && state.eagleDodgeWindow <= 0) {
    // Dropped to safe altitude — eagle backs off
    state.setEagleAltitudeHunt(false);
    state.setThreat(null);
    state.setThreatWarning(false);
    state.setEagleTimer(30 + Math.random() * 60);
  }

  // Eagle threat timer
  const newEagleTimer = state.eagleTimer - delta;
  state.setEagleTimer(newEagleTimer);

  // Altitude hunt — 4 second timer expired, eagle catches you
  if (state.eagleAltitudeHunt && newEagleTimer <= 0) {
    state.gameOver('eagle');
    return;
  }

  if (
    newEagleTimer <= EAGLE_WARNING_TIME &&
    newEagleTimer > 0 &&
    !state.threatWarningActive
  ) {
    state.setThreatWarning(true);
    state.setThreat('eagle');
  }

  if (!state.eagleAltitudeHunt && newEagleTimer <= 0 && state.threatType === 'eagle') {
    const nearAltitudeLimit = newY > EAGLE_ALTITUDE_THRESHOLD - 5;

    // Start dodge window exactly once
    if (state.eagleDodgeWindow <= 0) {
      state.setEagleDodgeWindow(EAGLE_DODGE_WINDOW);
      useGameStore.setState({
        eagleDodgeStartRotation: newRotation,
        eagleDodgeTaps: 0,
      });
      return; // give player a full frame before countdown starts
    }

    if (nearAltitudeLimit) {
      // Near altitude limit — 3 taps to dodge (checked via flap counting)
      if (state.eagleDodgeTaps >= 3) {
        state.dodgeEagle();
        return;
      }
    } else {
      // Safe altitude — turn ≥90° to dodge
      let angleDiff = Math.abs(newRotation - state.eagleDodgeStartRotation) % (Math.PI * 2);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      if (angleDiff >= Math.PI / 2) {
        state.dodgeEagle();
        return;
      }
    }

    // Countdown the dodge window
    const newDodgeWindow = state.eagleDodgeWindow - delta;
    state.setEagleDodgeWindow(newDodgeWindow);
    if (newDodgeWindow <= 0) {
      state.gameOver('eagle');
    }
  }
}

function updateFeeding(
  state: ReturnType<typeof useGameStore.getState>,
  species: (typeof BIRD_SPECIES)[string],
  delta: number,
) {
  const { activeFeeder, threatMeter, gameState, perchTime } = state;
  if (!activeFeeder) return;

  // Track time spent perched (used for fly-away delay)
  useGameStore.setState({ perchTime: perchTime + delta });

  const attrs = species.attributes;

  if (gameState === 'feeding') {
    const amount = attrs.feedRate * delta;
    state.replenishFood(amount);
    state.addScore(amount * 2);
  } else if (gameState === 'drinking') {
    const amount = attrs.drinkRate * delta;
    state.replenishWater(amount);
    state.addScore(amount * 2);
  }

  const threatRate = activeFeeder.hasCat
    ? THREAT_METER_BASE_RATE * THREAT_METER_CAT_MULTIPLIER
    : THREAT_METER_BASE_RATE;

  const newThreatMeter = threatMeter + threatRate * delta;
  state.setThreatMeter(newThreatMeter);

  if (newThreatMeter >= THREAT_METER_MAX) {
    state.setThreat('cat');
    state.gameOver('cat');
  }

  const warningThreshold = activeFeeder.hasCat ? 20 : 60;
  if (newThreatMeter > warningThreshold && !state.threatWarningActive) {
    state.setThreatWarning(true);
    state.setThreat('cat');
  }
}
