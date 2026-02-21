'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';

const CHUNK_SIZE = 60;
const RENDER_DISTANCE = 1; // CHUNKS IN EACH DIRECTION (3×3 = 9 CHUNKS)
const HOUSES_PER_CHUNK = 3;
const TREES_PER_CHUNK = 3;

// SEEDED RANDOM FOR DETERMINISTIC CHUNK GENERATION
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function chunkKey(cx: number, cz: number) {
  return `${cx},${cz}`;
}

export default function SuburbanWorld() {
  const [activeChunks, setActiveChunks] = useState<Set<string>>(new Set());
  const lastChunkRef = useRef('');

  useFrame(() => {
    const { position } = useGameStore.getState();
    const cx = Math.floor(position[0] / CHUNK_SIZE);
    const cz = Math.floor(position[2] / CHUNK_SIZE);
    const key = chunkKey(cx, cz);

    if (key === lastChunkRef.current) return;
    lastChunkRef.current = key;

    const newChunks = new Set<string>();
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        newChunks.add(chunkKey(cx + dx, cz + dz));
      }
    }
    setActiveChunks(newChunks);
  });

  const chunks = useMemo(() => Array.from(activeChunks), [activeChunks]);

  return (
    <group>
      {/* BASE GROUND — LAWN GREEN */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#4A8A50" roughness={0.92} />
      </mesh>

      {/* RENDER ACTIVE CHUNKS */}
      {chunks.map(key => {
        const [cx, cz] = key.split(',').map(Number);
        return <Chunk key={key} cx={cx} cz={cz} />;
      })}
    </group>
  );
}

function Chunk({ cx, cz }: { cx: number; cz: number }) {
  const data = useMemo(() => generateChunkData(cx, cz), [cx, cz]);
  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  return (
    <group position={[ox, 0, oz]}>
      {/* GRASS PATCHES — VISIBLE LAWN TEXTURE */}
      {data.grassPatches.map((p, i) => (
        <mesh
          key={`g${i}`}
          rotation={[-Math.PI / 2, 0, p.rot]}
          position={[p.x, 0.01, p.z]}
        >
          <planeGeometry args={[p.w, p.h]} />
          <meshStandardMaterial color={p.color} roughness={0.95} />
        </mesh>
      ))}

      {/* LAWN MOW STRIPES FOR REALISM */}
      {data.mowStripes.map((s, i) => (
        <mesh
          key={`ms${i}`}
          rotation={[-Math.PI / 2, 0, s.rot]}
          position={[s.x, 0.005, s.z]}
        >
          <planeGeometry args={[s.w, s.h]} />
          <meshStandardMaterial color={s.color} roughness={0.98} />
        </mesh>
      ))}

      {/* ROADS */}
      {data.hasRoadX && <RoadX />}
      {data.hasRoadZ && <RoadZ />}

      {/* HOUSES WITH YARDS */}
      {data.houses.map((h, i) => (
        <group key={`hg${i}`}>
          <House {...h} />
          {/* YARD FENCING AROUND EACH HOUSE */}
          <YardFence
            x={h.x}
            z={h.z}
            w={h.w + 4}
            d={h.d + 6}
            rot={h.rot}
            fenceColor={h.fenceColor}
          />
          {/* PATIO / DECK BEHIND HOUSE */}
          {h.hasPatio && <Patio x={h.x} z={h.z} w={h.w} rot={h.rot} />}
        </group>
      ))}

      {/* TREES */}
      {data.trees.map((t, i) => (
        <Tree key={`t${i}`} {...t} />
      ))}

      {/* GARDEN BEDS */}
      {data.gardenBeds.map((g, i) => (
        <GardenBed key={`gb${i}`} {...g} />
      ))}
    </group>
  );
}

interface GrassPatch {
  x: number;
  z: number;
  w: number;
  h: number;
  rot: number;
  color: string;
}
interface MowStripe {
  x: number;
  z: number;
  w: number;
  h: number;
  rot: number;
  color: string;
}
interface HouseData {
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
}
interface TreeData {
  x: number;
  z: number;
  height: number;
  type: 'pine' | 'round' | 'oak';
}
interface GardenBedData {
  x: number;
  z: number;
  rot: number;
  w: number;
}

function generateChunkData(cx: number, cz: number) {
  const seed = cx * 73856093 + cz * 19349663;
  const rng = seededRandom(Math.abs(seed) + 1);

  const lawnColors = [
    '#4A8C5A',
    '#3F8048',
    '#508F55',
    '#458A4E',
    '#559A5C',
    '#3D7A44',
  ];
  const darkLawn = ['#3A7A4A', '#357040', '#406E45'];
  const lightLawn = ['#55995C', '#5AA060', '#60A868'];
  const roofColors = [
    '#7D5E52',
    '#8B3A3A',
    '#4A5568',
    '#6B4226',
    '#3C4F5C',
    '#5A4540',
  ];
  const wallColors = [
    '#F5F0E8',
    '#EDE8DD',
    '#E8E0D0',
    '#F0EBE0',
    '#E5DDD0',
    '#FFF8F0',
  ];
  const fenceColors = ['#F0E8D8', '#E8DFC8', '#D4C8B0', '#C8BCA8'];

  // GRASS PATCHES — LARGER RECTANGULAR LAWN AREAS
  const grassPatches: GrassPatch[] = [];
  for (let i = 0; i < 5; i++) {
    grassPatches.push({
      x: (rng() - 0.5) * CHUNK_SIZE * 0.9,
      z: (rng() - 0.5) * CHUNK_SIZE * 0.9,
      w: 3 + rng() * 8,
      h: 3 + rng() * 8,
      rot: rng() * 0.3,
      color: lawnColors[Math.floor(rng() * lawnColors.length)],
    });
  }

  // MOW STRIPES — ALTERNATING LIGHT/DARK STRIPS ACROSS LAWNS
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
        ? lightLawn[Math.floor(rng() * lightLawn.length)]
        : darkLawn[Math.floor(rng() * darkLawn.length)],
    });
  }

  // ROADS — EVERY CHUNK GETS HORIZONTAL STREET, VERTICAL STREETS EVERY 2 CHUNKS
  const hasRoadX = true;
  const hasRoadZ = Math.abs(cx) % 2 === 0;

  // HOUSES — PLACED SIDE BY SIDE WITH ROADS WITH PROPER SETBACK
  // ROAD WIDTH 4.5 → SIDEWALK AT ~3.5 FROM CENTER → HOUSES AT 6+ FROM ROAD CENTER
  const houses: HouseData[] = [];

  if (hasRoadX && hasRoadZ) {
    // INTERSECTION: PLACE HOUSES IN THE 4 QUADRANT CORNERS
    for (let qi = 0; qi < 4; qi++) {
      const sx = qi < 2 ? 1 : -1;
      const sz = qi % 2 === 0 ? 1 : -1;
      houses.push({
        x: sx * (6 + rng() * 5),
        z: sz * (6 + rng() * 5),
        w: 3.5 + rng() * 2,
        h: 2.8 + rng() * 1.5,
        d: 3.5 + rng() * 2,
        roofColor: roofColors[Math.floor(rng() * roofColors.length)],
        wallColor: wallColors[Math.floor(rng() * wallColors.length)],
        rot: sz > 0 ? Math.PI : 0, // FACE TOWARD NEAREST HORIZONTAL ROAD
        fenceColor: fenceColors[Math.floor(rng() * fenceColors.length)],
        hasPatio: rng() > 0.65,
      });
    }
  } else {
    // HOUSES ALONG HORIZONTAL ROAD (hasRoadX IS ALWAYS TRUE)
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
        roofColor: roofColors[Math.floor(rng() * roofColors.length)],
        wallColor: wallColors[Math.floor(rng() * wallColors.length)],
        rot: side > 0 ? Math.PI : 0, // face toward road
        fenceColor: fenceColors[Math.floor(rng() * fenceColors.length)],
        hasPatio: rng() > 0.65,
      });
    }
  }

  // TREES — IN YARDS AND ALONG STREETS
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

  // GARDEN BEDS NEAR SOME HOUSES
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

function RoadX() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[CHUNK_SIZE, 4.5]} />
        <meshStandardMaterial color="#484848" roughness={0.85} />
      </mesh>
      {/* DASHED CENTER LINE */}
      {[-16, -8, 0, 8, 16].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]}>
          <planeGeometry args={[3, 0.12]} />
          <meshStandardMaterial color="#D4C94A" roughness={0.5} />
        </mesh>
      ))}
      {/* SIDEWALKS */}
      {[-2.8, 2.8].map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, z]}>
          <planeGeometry args={[CHUNK_SIZE, 1.2]} />
          <meshStandardMaterial color="#C4BFA8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function RoadZ() {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[CHUNK_SIZE, 4.5]} />
        <meshStandardMaterial color="#484848" roughness={0.85} />
      </mesh>
      {[-16, -8, 0, 8, 16].map(x => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.03, 0]}>
          <planeGeometry args={[3, 0.12]} />
          <meshStandardMaterial color="#D4C94A" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function House({ x, z, w, h, d, roofColor, wallColor, rot }: HouseData) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* FOUNDATION */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
        <meshStandardMaterial color="#8A8070" roughness={0.9} />
      </mesh>

      {/* WALLS */}
      <mesh position={[0, h / 2 + 0.2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* ROOF — PITCHED GABLE */}
      <mesh position={[0, h + 0.2 + 0.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[Math.max(w, d) * 0.72, 1.4, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.75} />
      </mesh>

      {/* DOOR */}
      <mesh position={[0, 0.95, d / 2 + 0.01]}>
        <boxGeometry args={[0.7, 1.6, 0.05]} />
        <meshStandardMaterial color="#5A3E2B" roughness={0.85} />
      </mesh>

      {/* WINDOWS — SINGLE MESH EACH, NO CROSS BARS (INVISIBLE FROM AIR) */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.3, h * 0.55, d / 2 + 0.01]}>
          <boxGeometry args={[0.55, 0.55, 0.04]} />
          <meshStandardMaterial
            color="#A8D8EA"
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* CHIMNEY */}
      <mesh position={[w * 0.28, h + 1.1, -d * 0.2]}>
        <boxGeometry args={[0.45, 0.9, 0.45]} />
        <meshStandardMaterial color="#7A6055" roughness={0.9} />
      </mesh>
    </group>
  );
}

// SIMPLIFIED YARD FENCE — 4 CORNER POSTS + 4 RAILS = 8 MESHES, NO SHADOWS
function YardFence({
  x,
  z,
  w,
  d,
  rot,
  fenceColor,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  fenceColor: string;
}) {
  const halfW = w / 2;
  const halfD = d / 2;
  const h = 0.85;

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* 4 CORNER POSTS ONLY */}
      {[
        [-halfW, halfD],
        [halfW, halfD],
        [-halfW, -halfD],
        [halfW, -halfD],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, h / 2, pz]}>
          <boxGeometry args={[0.06, h, 0.06]} />
          <meshStandardMaterial color={fenceColor} roughness={0.85} />
        </mesh>
      ))}

      {/* 4 HORIZONTAL RAILS — FRONT, BACK, SIDES */}
      <mesh position={[0, 0.55, halfD]}>
        <boxGeometry args={[w, 0.04, 0.04]} />
        <meshStandardMaterial color={fenceColor} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.55, -halfD]}>
        <boxGeometry args={[w, 0.04, 0.04]} />
        <meshStandardMaterial color={fenceColor} roughness={0.85} />
      </mesh>
      {[-halfW, halfW].map((sx, i) => (
        <mesh
          key={`sr${i}`}
          position={[sx, 0.55, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <boxGeometry args={[d, 0.04, 0.04]} />
          <meshStandardMaterial color={fenceColor} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Patio({
  x,
  z,
  w,
  rot,
}: {
  x: number;
  z: number;
  w: number;
  rot: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* PATIO SLAB */}
      <mesh position={[0, 0.03, -3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w + 1, 2.5]} />
        <meshStandardMaterial color="#B0A898" roughness={0.85} />
      </mesh>
    </group>
  );
}

function GardenBed({ x, z, rot, w }: GardenBedData) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* SOIL BED */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[w, 0.12, 0.8]} />
        <meshStandardMaterial color="#5C4033" roughness={0.95} />
      </mesh>
      {/* BORDER STONES */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[0, 0.08, side * 0.45]}>
          <boxGeometry args={[w + 0.1, 0.1, 0.08]} />
          <meshStandardMaterial color="#9E9690" roughness={0.9} />
        </mesh>
      ))}
      {/* SMALL FLOWERS / PLANTS */}
      {[0, 1, 2].map(i => {
        const px = (i - 1) * w * 0.3;
        const colors = ['#E85D75', '#FFD700', '#FF69B4'];
        return (
          <mesh key={i} position={[px, 0.18, 0]}>
            <sphereGeometry args={[0.1, 4, 4]} />
            <meshStandardMaterial color={colors[i]} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function Tree({ x, z, height, type }: TreeData) {
  return (
    <group position={[x, 0, z]}>
      {/* TRUNK */}
      <mesh position={[0, height * 0.28, 0]}>
        <cylinderGeometry args={[0.12, 0.18, height * 0.55, 6]} />
        <meshStandardMaterial color="#6B4226" roughness={0.9} />
      </mesh>

      {type === 'pine' ? (
        <>
          <mesh position={[0, height * 0.5, 0]}>
            <coneGeometry args={[1.4, height * 0.45, 6]} />
            <meshStandardMaterial color="#2A6B35" roughness={0.85} />
          </mesh>
          <mesh position={[0, height * 0.7, 0]}>
            <coneGeometry args={[1.0, height * 0.35, 6]} />
            <meshStandardMaterial color="#338040" roughness={0.85} />
          </mesh>
          <mesh position={[0, height * 0.85, 0]}>
            <coneGeometry args={[0.6, height * 0.25, 6]} />
            <meshStandardMaterial color="#3D9048" roughness={0.85} />
          </mesh>
        </>
      ) : type === 'round' ? (
        <>
          <mesh position={[0, height * 0.7, 0]}>
            <sphereGeometry args={[1.6, 8, 6]} />
            <meshStandardMaterial color="#3A8A48" roughness={0.9} />
          </mesh>
          <mesh position={[0.5, height * 0.65, 0.3]}>
            <sphereGeometry args={[1.0, 7, 5]} />
            <meshStandardMaterial color="#45994F" roughness={0.9} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, height * 0.65, 0]}>
            <dodecahedronGeometry args={[1.4, 1]} />
            <meshStandardMaterial color="#4E9A58" roughness={0.88} />
          </mesh>
          <mesh position={[0.6, height * 0.6, 0.4]}>
            <dodecahedronGeometry args={[0.9, 1]} />
            <meshStandardMaterial color="#5AAA60" roughness={0.88} />
          </mesh>
          <mesh position={[-0.4, height * 0.72, -0.3]}>
            <dodecahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#42904C" roughness={0.88} />
          </mesh>
        </>
      )}
    </group>
  );
}
