# Backyard Skies

A 3D bird flight survival game built with React Three Fiber and Next.js. Fly as one of four bird species through a suburban neighborhood, land on feeders and birdbaths to refuel, dodge eagles, and avoid cats — all while racking up the highest score.

## Gameplay

You control a small bird flying over a procedurally generated suburban world. Tap to flap, steer to turn, and manage your food and water to stay airborne as long as possible.

### Controls

- **Tap/Click** — Flap wings to gain altitude
- **Left/Right buttons** — Steer (or tap screen sides in Tap-to-Steer mode)
- **Stop tapping** — Glide and descend

### Survival Mechanics

- **Food & Water** drain continuously during flight. If either reaches zero, your bird goes down.
- **Feeders** (green edge glow) replenish food. **Birdbaths** (blue edge glow) replenish water.
- Fly near a feeder or birdbath to land automatically. Your bird eats/drinks while perched.
- A **threat meter** fills while perched — leave before it maxes out or a cat catches you.
- Some feeders have a **cat lurking nearby** — the threat meter fills 5x faster.

### Eagle Attacks

- Eagles hunt you periodically during flight (every 30–90 seconds).
- Flying too high (above the altitude limit) triggers an immediate eagle hunt — you have **4 seconds** to descend.
- During the dodge window: **turn 90 degrees** to evade, or **tap 3 times** if near the altitude limit.
- Dodging an eagle earns bonus points.

### Scoring

| Action | Points |
|--------|--------|
| Flying (per second) | 1 |
| Landing on feeder | 50 |
| Landing on birdbath | 40 |
| Feeding/drinking (per second) | 2x feed/drink rate |
| Dodging an eagle | 100 |

## Bird Species

Four species with different stats — choose your playstyle:

| Species | Speed | Flap Power | Max Food | Max Water | Food Drain | Water Drain |
|---------|-------|------------|----------|-----------|------------|-------------|
| **Northern Cardinal** | 7 | 1.0 | 85 | 75 | 2.0/s | 1.5/s |
| **Scarlet Tanager** | 9 | 1.2 | 70 | 65 | 2.8/s | 2.0/s |
| **Indigo Bunting** | 8 | 1.1 | 60 | 60 | 1.5/s | 1.2/s |
| **European Starling** | 6 | 0.9 | 100 | 100 | 1.8/s | 1.3/s |

- **Cardinal** — Balanced all-rounder, great for beginners
- **Tanager** — Fastest but burns energy quickly
- **Bunting** — Agile with great stamina, but limited food capacity
- **Starling** — Slow but can store the most food and water

## Tech Stack

- **Framework** — [Next.js](https://nextjs.org) 16 with App Router
- **3D Rendering** — [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Three.js](https://threejs.org)
- **3D Helpers** — [@react-three/drei](https://github.com/pmndrs/drei)
- **State Management** — [Zustand](https://github.com/pmndrs/zustand)
- **Styling** — [Tailwind CSS](https://tailwindcss.com) 4
- **Language** — TypeScript 5

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
app/                    # Next.js app router pages
components/
  scene/                # 3D scene components (bird, camera, world, feeders, eagle)
  ui/                   # UI overlays (HUD, menus, warnings, settings)
  Game.tsx              # Main game component
  GameCanvas.tsx        # R3F Canvas wrapper
  GameLoopRunner.tsx    # Frame-loop bridge
hooks/
  useGameLoop.ts        # Core game physics and logic
store/
  gameStore.ts          # Zustand game state
lib/
  birdSpecies.ts        # Species definitions and stats
types/
  index.ts              # TypeScript types
utils/
  constants.ts          # Game constants
public/
  models/               # 3D model assets (GLTF, OBJ)
```

## Asset Attributions

### Bird Model

"Low Poly Bird" by [Dani Ortega](https://sketchfab.com/I_starboy_I) — [View on Sketchfab](https://sketchfab.com/3d-models/low-poly-bird-651a09f1866447688ab88b06090b054d)
Licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/)

### Eagle Model

"Wind Eagle" by [Robert Mirabelle](https://poly.pizza) — via Poly Pizza
Licensed under [CC-BY](https://creativecommons.org/licenses/by/3.0/)
