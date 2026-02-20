# Backyard Skies (by Birdbuddy) — Hackathon Technical Plan

## Context

A 3D survival game where players control a bird flying between feeders in a suburban environment. **This is a hackathon project** — speed to a playable demo is the #1 priority. Polish, performance optimization, and production concerns come later (or never, if the concept doesn't resonate).

---

## 1. Technology Recommendation

### Recommended: **Web (Three.js + React) → deployed as PWA**

**Why not pure native (React Native / Unity)?**

| Option | Pros | Cons |
|--------|------|------|
| **Unity** | Best 3D perf, huge asset store | C# (different skill set), slow iteration, heavy app size (~50MB+), app store review cycles |
| **React Native + expo-gl + react-three-fiber** | JS ecosystem | Poor 3D performance on mobile, limited shader support, WebGL over native bridge = bottleneck, tiny community for 3D games |
| **Godot** | Lightweight, open source | GDScript/C#, still needs app store deploy |
| **Three.js (web) as PWA** | Instant deploy, no app store, fast iteration, huge Three.js ecosystem | WebGL perf ceiling on low-end phones (acceptable for hackathon scope) |

**Verdict:** For a hackathon where you need something playable fast — **Three.js on the web** is the no-brainer:
- Share a URL with judges/testers — zero install friction
- Deploy to Vercel in 30 seconds
- Works on any device with a browser (phones, laptops, tablets)
- PWA "Add to Home Screen" gives native-app feel without any app store process
- If the concept wins/validates, port to Unity or wrap with Capacitor for app stores later

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **3D Engine** | Three.js via `@react-three/fiber` (R3F) |
| **Physics** | `@react-three/rapier` (Rust-based, WASM, fast) |
| **UI/HUD** | React (HTML overlay) — not in-canvas, for crisp text/gauges |
| **State** | Zustand |
| **Animation** | Three.js AnimationMixer + `@react-three/drei` helpers |
| **Models** | GLTF/GLB format (Blender → glTF pipeline) |
| **Audio** | Howler.js or Web Audio API |
| **Build** | Vite + vite-plugin-glsl for shaders |
| **Deploy** | Vercel (static site) or Cloudflare Pages |
| **Mobile wrap** | PWA manifest + optional Capacitor for app store |

---

## 3. Game Architecture

### 3.1 State Machine

```
[START_MENU] → [FLIGHT] ⇄ [FEEDING] → [THREAT_EVENT] → [GAME_OVER]
                  ↑                          |
                  └──────────────────────────┘ (survive)
```

**States managed in Zustand:**

```ts
gameState: "menu" | "flight" | "feeding" | "threat" | "gameOver"
food: number        // 0-100
water: number       // 0-100
stamina: number     // 0-100
score: number
threatMeter: number // 0-100
activeFeeder: Feeder | null
threatType: "eagle" | "cat" | null
```

### 3.2 Scene Hierarchy

```tsx
<Canvas>
  ├── <Environment />          — skybox, ambient light, sun
  ├── <SuburbanWorld />        — ground plane, houses, trees (instanced)
  │   ├── <Feeder id={1} />   — interactive bird feeder
  │   ├── <Feeder id={2} />
  │   └── ...
  ├── <PlayerBird />           — animated bird model + flight physics
  │   └── <ThirdPersonCamera /> — chase cam (lerped follow)
  ├── <Threats />
  │   ├── <Eagle />            — swooping predator (flight phase)
  │   └── <Cat />              — ground predator (feeder phase)
  └── <PostProcessing />       — vignette, motion blur, danger effects
</Canvas>

{/* HTML overlay (not in canvas) */}
<HUD />                        — food/water/stamina gauges, score
<ThreatWarning />              — red flash + "!" icon
<StartMenu />                  — title screen, leaderboard
<GameOverScreen />             — score, retry
```

### 3.3 Core Systems

#### Flight Controller
- **Input:** Mouse position (desktop) / touch drag (mobile) / gyroscope (optional)
- **Movement:** Bird follows a forward vector; mouse/touch offsets pitch + yaw
- **Speed:** Constant forward speed with slight acceleration/deceleration
- **Barrel Roll:** Spacebar/double-tap → 360° roll animation + brief invincibility window
- **Stamina:** Barrel roll costs stamina; stamina regenerates slowly during flight

#### Resource Depletion
- Food: -2/sec during flight, +10/sec while feeding
- Water: -1.5/sec during flight, +8/sec while feeding
- Either hitting 0 = Game Over (starvation/dehydration)

#### Feeder Interaction
- **Detection:** Proximity trigger (sphere collider around feeder)
- **Landing:** Smooth transition from flight cam → bird-cam (front close-up)
- **Threat Meter:** Starts at 0, fills at variable rate (faster at "dangerous" feeders)
- **Fly Away:** Button/swipe to exit → back to flight phase

#### Threat Events
- **Eagle (flight):** Random timer (30-90s). Red vignette + "!" warning → 2s window to barrel roll. Fail = caught = Game Over
- **Cat (feeder):** Some feeders have cat proximity. Red glow aura visible before landing. Threat meter fills 2x faster. Cat silhouette animation plays as meter nears 100%

#### Scoring
- +1 point per second of survival
- +bonus for each successful feeding (proportional to time spent)
- +bonus for eagle dodge
- Leaderboard: localStorage for hackathon, backend API later

---

## 4. Hackathon Sprint Plan

### Sprint 1: Flyable Bird — "Can I fly?" (Day 1 morning)
- [ ] Vite + R3F project scaffold + deploy to Vercel
- [ ] Ground plane with color/basic texture
- [ ] Placeholder bird (cone/sphere primitive or free low-poly GLB)
- [ ] Third-person chase camera (lerped follow)
- [ ] Mouse/touch flight controls (pitch + yaw)
- [ ] Constant forward movement

**Demo checkpoint:** Bird flies around a flat world. Shareable URL.

### Sprint 2: Feeders & Resources — "Why do I fly?" (Day 1 afternoon)
- [ ] Place 3-5 feeder objects with proximity trigger
- [ ] Landing transition → bird-cam close-up view
- [ ] Food + Water HUD gauges (HTML overlay, CSS-only)
- [ ] Resources deplete during flight, replenish while perched
- [ ] Game Over when food or water hits 0
- [ ] "Fly Away" button to leave feeder

**Demo checkpoint:** Core gameplay loop works — fly, eat, survive.

### Sprint 3: Threats — "What can kill me?" (Day 2 morning)
- [ ] Threat meter UI while perched (fills over time)
- [ ] Cat: red glow on dangerous feeders, meter fills 2x faster
- [ ] Eagle: random timer, red vignette + "!" warning
- [ ] Barrel roll mechanic (spacebar/double-tap) to dodge eagle
- [ ] Game Over on threat catch

**Demo checkpoint:** Full survival loop — resource management + threat avoidance.

### Sprint 4: Polish & Presentation — "Make it feel good" (Day 2 afternoon)
- [ ] Start menu: title "Backyard Skies (by Birdbuddy)" + "Start Flight" button
- [ ] Score display (survival time + bonuses)
- [ ] Local leaderboard (localStorage)
- [ ] Post-processing: vignette, bloom
- [ ] Sound effects (free assets: wing flaps, ambient, warning)
- [ ] Difficulty ramp: threats increase frequency over time
- [ ] PWA manifest for "install to home screen"

**Demo checkpoint:** Presentable hackathon demo.

---

## 5. Visual Style

- **Aesthetic:** Low-poly stylized (think Alto's Adventure meets Crossy Road)
- **Color Palette:**
  - Birdbuddy Blue: `#00AEEF` (UI accents, sky)
  - Sunflower Yellow: `#FFD700` (food gauge, score)
  - Nature Greens: `#4CAF50` / `#2E7D32` (trees, grass)
  - Danger Red: `#FF3D00` (threat vignette, cat glow)
  - Warm White: `#FFF8E1` (houses, fences)
- **Lighting:** Warm afternoon sun, soft ambient occlusion
- **Bird model:** Stylized, Birdbuddy-branded (round, friendly, similar to hardware aesthetic)

---

## 6. Project Structure

```
backyard-skies/
├── public/
│   ├── models/          — .glb bird, feeder, environment assets
│   ├── textures/        — terrain, skybox
│   ├── sounds/          — SFX + music
│   └── manifest.json    — PWA manifest
├── src/
│   ├── main.tsx         — entry point
│   ├── App.tsx          — canvas + HTML overlay root
│   ├── store/
│   │   └── gameStore.ts — Zustand state (game state, resources, score)
│   ├── scene/
│   │   ├── PlayerBird.tsx
│   │   ├── ThirdPersonCamera.tsx
│   │   ├── SuburbanWorld.tsx
│   │   ├── Feeder.tsx
│   │   ├── Eagle.tsx
│   │   ├── Cat.tsx
│   │   ├── Environment.tsx
│   │   └── PostProcessing.tsx
│   ├── systems/
│   │   ├── flightController.ts   — input → bird movement
│   │   ├── resourceSystem.ts     — depletion/replenishment logic
│   │   ├── threatSystem.ts       — eagle/cat spawn logic
│   │   └── scoringSystem.ts      — score calculation
│   ├── ui/
│   │   ├── HUD.tsx               — food/water/stamina gauges
│   │   ├── StartMenu.tsx
│   │   ├── GameOverScreen.tsx
│   │   ├── ThreatWarning.tsx
│   │   └── Leaderboard.tsx
│   ├── hooks/
│   │   ├── useFlightInput.ts     — mouse/touch/gyro input
│   │   └── useGameLoop.ts        — per-frame update orchestration
│   └── utils/
│       ├── constants.ts          — tuning values, colors, timings
│       └── math.ts               — lerp, clamp, vector helpers
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 7. Key Technical Decisions

1. **HTML overlay for HUD** (not in-canvas) — crisp text, easy styling, accessibility, no texture rendering cost
2. **Zustand for state** — minimal boilerplate, works seamlessly with R3F's render loop via `useFrame` subscriptions
3. **Rapier physics** — WASM-based, fast enough for mobile WebGL, handles collisions for feeder proximity and threat detection
4. **Instanced meshes** for repeated geometry (trees, houses) — critical for mobile GPU performance
5. **Progressive enhancement** — start with simple primitives, swap in real models as art assets become available

---

## 8. Future (Post-Hackathon)

- **Multiplayer:** WebSocket server, see other birds flying
- **Bird species:** Unlock different birds with unique stats
- **Seasonal worlds:** Winter, spring, autumn environments
- **Real Birdbuddy integration:** Connect to physical feeder data, see your real birds
- **Backend leaderboard:** Supabase or existing Birdbuddy API
- **App store:** Wrap with Capacitor (iOS/Android) or port to Unity for native performance
- **AR mode:** Point camera at real yard, overlay game elements

---

## 9. Verification / Testing Plan

- **Manual playtest:** Fly bird, land on feeder, survive eagle attack, game over on resource depletion
- **Mobile test:** Open on iPhone/Android Chrome, verify touch controls + performance (target 30fps minimum)
- **PWA test:** Install to home screen, verify offline capability
- **Performance:** Chrome DevTools → Performance tab, ensure frame budget < 16ms on mid-range phone
