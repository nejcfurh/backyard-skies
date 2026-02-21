import { seededRandom } from '@/utils/seededRandom';
import {
  CHUNK_SIZE,
  HOUSES_PER_CHUNK,
  TREES_PER_CHUNK,
  HOUSE_MODELS,
  LAWN_COLORS,
  DARK_LAWN,
  LIGHT_LAWN,
  ROOF_COLORS,
  WALL_COLORS,
  FENCE_COLORS,
} from './chunkConstants';

export interface GrassPatch {
  x: number;
  z: number;
  w: number;
  h: number;
  rot: number;
  color: string;
}

export interface MowStripe {
  x: number;
  z: number;
  w: number;
  h: number;
  rot: number;
  color: string;
}

export interface HouseData {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  roofColor: string;
  wallColor: string;
  rot: number;
  fenceColor: string;
  hasPatio: boolean;
  modelIndex: number;
}

export interface TreeData {
  x: number;
  z: number;
  height: number;
  type: 'pine' | 'round' | 'oak';
}

export interface GardenBedData {
  x: number;
  z: number;
  rot: number;
  w: number;
}

export interface ChunkData {
  grassPatches: GrassPatch[];
  mowStripes: MowStripe[];
  hasRoadX: boolean;
  hasRoadZ: boolean;
  houses: HouseData[];
  trees: TreeData[];
  gardenBeds: GardenBedData[];
}

export function generateChunkData(cx: number, cz: number): ChunkData {
  const seed = cx * 73856093 + cz * 19349663;
  const rng = seededRandom(Math.abs(seed) + 1);

  // GRASS PATCHES
  const grassPatches: GrassPatch[] = [];
  for (let i = 0; i < 5; i++) {
    grassPatches.push({
      x: (rng() - 0.5) * CHUNK_SIZE * 0.9,
      z: (rng() - 0.5) * CHUNK_SIZE * 0.9,
      w: 3 + rng() * 8,
      h: 3 + rng() * 8,
      rot: rng() * 0.3,
      color: LAWN_COLORS[Math.floor(rng() * LAWN_COLORS.length)],
    });
  }

  // MOW STRIPES
  const mowStripes: MowStripe[] = [];
  for (let i = 0; i < 4; i++) {
    const isLight = i % 2 === 0;
    mowStripes.push({
      x: (rng() - 0.5) * CHUNK_SIZE * 0.8,
      z: (rng() - 0.5) * CHUNK_SIZE * 0.8,
      w: 1.2 + rng() * 0.8,
      h: 6 + rng() * 10,
      rot: (Math.floor(rng() * 2) * Math.PI) / 2 + (rng() - 0.5) * 0.1,
      color: isLight
        ? LIGHT_LAWN[Math.floor(rng() * LIGHT_LAWN.length)]
        : DARK_LAWN[Math.floor(rng() * DARK_LAWN.length)],
    });
  }

  // ROADS
  const hasRoadX = true;
  const hasRoadZ = Math.abs(cx) % 2 === 0;

  // HOUSES
  const houses: HouseData[] = [];

  if (hasRoadX && hasRoadZ) {
    // INTERSECTION: 4 QUADRANT CORNERS
    for (let qi = 0; qi < 4; qi++) {
      const sx = qi < 2 ? 1 : -1;
      const sz = qi % 2 === 0 ? 1 : -1;
      houses.push({
        x: sx * (6 + rng() * 5),
        z: sz * (6 + rng() * 5),
        w: 3.5 + rng() * 2,
        h: 2.8 + rng() * 1.5,
        d: 3.5 + rng() * 2,
        roofColor: ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)],
        wallColor: WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)],
        rot: sz > 0 ? Math.PI : 0,
        fenceColor: FENCE_COLORS[Math.floor(rng() * FENCE_COLORS.length)],
        hasPatio: rng() > 0.65,
        modelIndex: Math.floor(rng() * HOUSE_MODELS.length),
      });
    }
  } else {
    // HOUSES ALONG HORIZONTAL ROAD
    for (let i = 0; i < HOUSES_PER_CHUNK; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const baseX =
        (i / HOUSES_PER_CHUNK - 0.5) * CHUNK_SIZE * 0.8 + (rng() - 0.5) * 4;
      houses.push({
        x: baseX,
        z: side * (6 + rng() * 5),
        w: 3.5 + rng() * 2,
        h: 2.8 + rng() * 1.5,
        d: 3.5 + rng() * 2,
        roofColor: ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)],
        wallColor: WALL_COLORS[Math.floor(rng() * WALL_COLORS.length)],
        rot: side > 0 ? Math.PI : 0,
        fenceColor: FENCE_COLORS[Math.floor(rng() * FENCE_COLORS.length)],
        hasPatio: rng() > 0.65,
        modelIndex: Math.floor(rng() * HOUSE_MODELS.length),
      });
    }
  }

  // TREES
  const trees: TreeData[] = [];
  const types: Array<'pine' | 'round' | 'oak'> = ['pine', 'round', 'oak'];
  for (let i = 0; i < TREES_PER_CHUNK; i++) {
    trees.push({
      x: (rng() - 0.5) * CHUNK_SIZE,
      z: (rng() - 0.5) * CHUNK_SIZE,
      height: 3 + rng() * 4,
      type: types[Math.floor(rng() * types.length)],
    });
  }

  // GARDEN BEDS
  const gardenBeds: GardenBedData[] = [];
  for (let i = 0; i < houses.length; i++) {
    if (rng() > 0.7) {
      gardenBeds.push({
        x: houses[i].x + (rng() - 0.5) * 3,
        z: houses[i].z + (rng() > 0.5 ? 4 : -4),
        rot: houses[i].rot,
        w: 1.5 + rng() * 2,
      });
    }
  }

  return {
    grassPatches,
    mowStripes,
    hasRoadX,
    hasRoadZ,
    houses,
    trees,
    gardenBeds,
  };
}
