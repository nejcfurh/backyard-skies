// Shared chunk layout utilities — used by SuburbanWorld and FeederSpawner
// to keep house positions and road zones consistent.

const CHUNK_SIZE = 60;
const HOUSES_PER_CHUNK = 3;

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

/**
 * Returns world-space bounding rectangles for all houses in a given chunk,
 * plus whether the chunk has vertical roads.
 * The RNG call sequence MUST match generateChunkData in SuburbanWorld.tsx.
 */
export function getChunkHouses(cx: number, cz: number): { houses: HouseRect[]; hasRoadZ: boolean } {
  const seed = cx * 73856093 + cz * 19349663;
  const rng = seededRandom(Math.abs(seed) + 1);
  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  // Skip grass patches (5 patches × 6 rng calls each)
  for (let i = 0; i < 5; i++) {
    rng(); rng(); rng(); rng(); rng(); rng();
  }

  // Skip mow stripes (4 stripes × 6 rng calls each)
  for (let i = 0; i < 4; i++) {
    rng(); rng(); rng(); rng(); rng(); rng();
  }

  const hasRoadZ = Math.abs(cx) % 2 === 0;
  const hasRoadX = true;

  const houses: HouseRect[] = [];

  if (hasRoadX && hasRoadZ) {
    // Intersection: 4 quadrant corners
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
      rng(); // rot (unused — computed from sz)
      rng(); // fenceColor
      rng(); // hasPatio
      houses.push({ x: ox + hx, z: oz + hz, hw: (w + 4) / 2, hd: (d + 6) / 2 });
    }
  } else {
    for (let i = 0; i < HOUSES_PER_CHUNK; i++) {
      const baseX = ((i / HOUSES_PER_CHUNK) - 0.5) * CHUNK_SIZE * 0.8 + (rng() - 0.5) * 4;
      const side = i % 2 === 0 ? 1 : -1;
      const hz = side * (6 + rng() * 5);
      const w = 3.5 + rng() * 2;
      rng(); // h
      const d = 3.5 + rng() * 2;
      rng(); // roofColor
      rng(); // wallColor
      rng(); // rot
      rng(); // fenceColor
      rng(); // hasPatio
      houses.push({ x: ox + baseX, z: oz + hz, hw: (w + 4) / 2, hd: (d + 6) / 2 });
    }
  }

  return { houses, hasRoadZ };
}

/**
 * Checks if a world position collides with any house or road in its chunk.
 * Returns true if the position is SAFE (no collision).
 */
export function isSafeFeederPosition(wx: number, wz: number): boolean {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);

  // Check the chunk the point is in plus adjacent chunks (houses near edges)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const { houses, hasRoadZ } = getChunkHouses(cx + dx, cz + dz);

      // Check house collision
      for (const h of houses) {
        if (Math.abs(wx - h.x) < h.hw && Math.abs(wz - h.z) < h.hd) {
          return false;
        }
      }

      // Check road collision for this neighbor chunk
      const neighborOx = (cx + dx) * CHUNK_SIZE;
      const neighborOz = (cz + dz) * CHUNK_SIZE;

      // Horizontal road (every chunk): z within ±3.5 of chunk center
      const localZ = wz - neighborOz;
      if (Math.abs(localZ) < 3.5) return false;

      // Vertical road (if present): x within ±3.5 of chunk center
      if (hasRoadZ) {
        const localX = wx - neighborOx;
        if (Math.abs(localX) < 3.5) return false;
      }
    }
  }

  return true;
}
