// Shared chunk layout utilities — used by SuburbanWorld and FeederSpawner
// to keep house positions and road zones consistent.
//
// The RNG call sequence MUST exactly match generateChunkData in SuburbanWorld.tsx.
// Any change to SuburbanWorld's generation order requires updating this file.

const CHUNK_SIZE = 40;
const HOUSES_PER_CHUNK = 3.5; // loop runs for i=0,1,2,3 → 4 houses
const TREES_PER_CHUNK = 6;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface HouseRect {
  x: number; // world x center
  z: number; // world z center
  hw: number; // half-width (includes fence buffer)
  hd: number; // half-depth (includes fence buffer)
}

interface TreePos {
  x: number; // world x
  z: number; // world z
}

export function getChunkHouses(cx: number, cz: number): {
  houses: HouseRect[];
  trees: TreePos[];
  hasRoadZ: boolean;
} {
  const seed = cx * 73856093 + cz * 19349663;
  const rng = seededRandom(Math.abs(seed) + 1);
  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  // Skip grass patches (5 patches × 6 rng calls each = 30)
  for (let i = 0; i < 30; i++) rng();

  // Skip mow stripes (4 stripes × 7 rng calls each = 28)
  // Each stripe: x, z, w, h, rot(2 calls), color = 7
  for (let i = 0; i < 28; i++) rng();

  const hasRoadZ = Math.abs(cx) % 2 === 0;
  const hasRoadX = true;

  const houses: HouseRect[] = [];

  if (hasRoadX && hasRoadZ) {
    // Intersection: 4 quadrant corners
    // Per house: x, z, w, h, d, roofColor, wallColor, fenceColor, hasPatio, modelIndex = 10 calls
    // rot is deterministic (NO rng call)
    for (let qi = 0; qi < 4; qi++) {
      const sx = qi < 2 ? 1 : -1;
      const sz = qi % 2 === 0 ? 1 : -1;
      const hx = sx * (6 + rng() * 5);
      const hz = sz * (6 + rng() * 5);
      const w = 3.5 + rng() * 2;
      rng(); // h
      const d = 3.5 + rng() * 2;
      rng(); // roofColor
      rng(); // wallColor
      // rot: sz > 0 ? Math.PI : 0 — deterministic, NO rng call
      rng(); // fenceColor
      rng(); // hasPatio
      rng(); // modelIndex
      houses.push({ x: ox + hx, z: oz + hz, hw: (w + 8) / 2, hd: (d + 10) / 2 });
    }
  } else {
    // Non-intersection: HOUSES_PER_CHUNK (3.5 → loop runs 4 times: i=0,1,2,3)
    for (let i = 0; i < HOUSES_PER_CHUNK; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const baseX =
        (i / HOUSES_PER_CHUNK - 0.5) * CHUNK_SIZE * 0.8 + (rng() - 0.5) * 4;
      const hz = side * (6 + rng() * 5);
      const w = 3.5 + rng() * 2;
      rng(); // h
      const d = 3.5 + rng() * 2;
      rng(); // roofColor
      rng(); // wallColor
      // rot: side > 0 ? Math.PI : 0 — deterministic, NO rng call
      rng(); // fenceColor
      rng(); // hasPatio
      rng(); // modelIndex
      houses.push({ x: ox + baseX, z: oz + hz, hw: (w + 8) / 2, hd: (d + 10) / 2 });
    }
  }

  // Trees: 6 × 4 rng calls (x, z, height, type)
  const trees: TreePos[] = [];
  for (let i = 0; i < TREES_PER_CHUNK; i++) {
    const tx = (rng() - 0.5) * CHUNK_SIZE;
    const tz = (rng() - 0.5) * CHUNK_SIZE;
    rng(); // height
    rng(); // type
    trees.push({ x: ox + tx, z: oz + tz });
  }

  return { houses, trees, hasRoadZ };
}

/**
 * Checks if a world position collides with any house, road, or tree.
 * Returns true if the position is SAFE (no collision).
 */
export function isSafeFeederPosition(wx: number, wz: number): boolean {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const { houses, trees, hasRoadZ } = getChunkHouses(cx + dx, cz + dz);

      // House collision
      for (const h of houses) {
        if (Math.abs(wx - h.x) < h.hw && Math.abs(wz - h.z) < h.hd) {
          return false;
        }
      }

      // Tree collision (~4 unit radius for canopy)
      for (const t of trees) {
        const tdx = wx - t.x;
        const tdz = wz - t.z;
        if (tdx * tdx + tdz * tdz < 16) {
          return false;
        }
      }
    }
  }

  return true;
}
