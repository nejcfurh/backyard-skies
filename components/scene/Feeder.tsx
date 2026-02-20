'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { FeederData } from '@/types';
import { ObjMtlModel } from '@/components/scene/ObjMtlModel';
import * as THREE from 'three';

/** Basin dish with indented bottom edge (recessed rim, not extruded). */
function createBasinGeometry(): THREE.LatheGeometry {
  // Profile (radius, height): bottom edge indented, then flare out to bowl
  const pts = [
    new THREE.Vector2(1.0, 0), // indented bottom rim
    new THREE.Vector2(1.08, 0.04),
    new THREE.Vector2(1.35, 0.1), // flare to main bowl
    new THREE.Vector2(1.3, 0.2),
    new THREE.Vector2(1.25, 0.25), // top rim
  ];
  return new THREE.LatheGeometry(pts, 32);
}

/** Flat strip with rounded corners (2D rounded rect extruded by depth). */
function createRoundedStripGeometry(
  width: number,
  height: number,
  depth: number,
  cornerRadius: number,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const r = Math.min(cornerRadius, width / 2, height / 2);
  shape.moveTo(r, 0);
  shape.lineTo(width - r, 0);
  shape.absarc(width - r, r, r, -Math.PI / 2, 0);
  shape.lineTo(width, height - r);
  shape.absarc(width - r, height - r, r, 0, Math.PI / 2);
  shape.lineTo(r, height);
  shape.absarc(r, height - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(0, r);
  shape.absarc(r, r, r, Math.PI, -Math.PI / 2);
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geom.translate(0, 0, -depth / 2);
  return geom;
}

interface FeederProps {
  data: FeederData;
}

export default function Feeder({ data }: FeederProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);
  const position = useGameStore(s => s.position);
  const [isLocked, setIsLocked] = useState(false);
  const prevLockedRef = useRef(false);

  // Pulsing glow for dangerous feeders
  useFrame(({ clock }) => {
    // Compute isLocked here (impure Date.now is allowed in useFrame)
    const now = Date.now();
    const newLocked = !!(data.lockedUntil && data.lockedUntil > now);
    if (newLocked !== prevLockedRef.current) {
      prevLockedRef.current = newLocked;
      setIsLocked(newLocked);
    }
    if (glowRef.current && data.hasCat) {
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.3 + 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }

    // Float marker up/down
    if (markerRef.current) {
      markerRef.current.position.y =
        5 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
      markerRef.current.rotation.y += 0.02;
    }
  });

  const isBirdbath = data.type === 'birdbath';

  // Calculate distance to player for marker visibility
  const dx = position[0] - data.position[0];
  const dz = position[2] - data.position[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const showMarker = dist < 40 && !isLocked;

  return (
    <group position={data.position}>
      {isBirdbath ? <BirdbuddyBath /> : <BirdbuddyFeeder />}

      {/* Danger glow for cat feeders or locked feeders */}
      {(data.hasCat || isLocked) && (
        <mesh ref={glowRef} position={[0, 1.5, 0]}>
          <sphereGeometry args={[3.5, 16, 12]} />
          <meshBasicMaterial
            color={isLocked ? '#FF9800' : '#FF3D00'}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Floating marker (hidden when locked) */}
      {showMarker && (
        <group ref={markerRef} position={[0, 5, 0]}>
          <mesh>
            <octahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial
              color={isBirdbath ? '#00AEEF' : '#4CAF50'}
              emissive={isBirdbath ? '#00AEEF' : '#4CAF50'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )}

      {/* Locked indicator */}
      {isLocked && showMarker && (
        <group position={[0, 6, 0]}>
          <mesh>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial
              color="#FF9800"
              emissive="#FF9800"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Cat 3D model for dangerous feeders */}
      {data.hasCat && (
        <ObjMtlModel
          baseUrl="/models/mycat/model"
          scale={0.03}
          position={[2.5, 0, 1.5]}
          rotation={[1.5, -3.15, -3]}
        />
      )}
    </group>
  );
}

// Birdbuddy-style smart feeder — teal house-shape body with peaked roof,
// white camera strip, orange tray, seed chambers with glass walls
export function BirdbuddyFeeder() {
  return (
    <group>
      {/* Gray pole from ground */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.1, 12]} />
        <meshStandardMaterial color="#6B6B6B" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Main body — teal house shape, open front */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[0.9, 1, 0.6]} />
        <meshStandardMaterial color="#2D6B73" roughness={0.3} />
      </mesh>

      {/* Peaked A-frame roof — teal with dark underside overhang */}
      {/* Roof left slope */}
      <mesh position={[-0.4, 2.8, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.85, 0.06, 1.0]} />
        <meshStandardMaterial color="#2D6B73" roughness={0.4} />
      </mesh>
      {/* Roof right slope */}
      <mesh position={[0.4, 2.8, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.85, 0.06, 1.0]} />
        <meshStandardMaterial color="#2D6B73" roughness={0.4} />
      </mesh>
      {/* Roof ridge cap */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[0.12, 0.08, 1.0]} />
        <meshStandardMaterial color="#2D6B73" roughness={0.4} />
      </mesh>
      {/* Camera strip — tall white/silver with rounded corners */}
      <mesh
        position={[-0.125, 1.95, 0.3]}
        geometry={useMemo(
          () => createRoundedStripGeometry(0.25, 0.6, 0.02, 0.5),
          [],
        )}
      >
        <meshStandardMaterial color="#E8E4E0" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Indicator dot near top of strip */}
      <mesh position={[0, 2.35, 0.3]}>
        <sphereGeometry args={[0.02, 6, 8]} />
        <meshStandardMaterial
          color="#0d0e0d"
          emissive="#151615"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Camera lens — large black cylinder lower-center */}
      <mesh position={[0, 2.07, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.1, 0.05, 16]} />
        <meshStandardMaterial
          color="#1A1A1A"
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
      {/* Orange/coral tray — extends forward from bottom, birds perch here */}
      <mesh position={[0, 1.78, 0.5]}>
        <boxGeometry args={[0.9, 0.02, 0.6]} />
        <meshStandardMaterial color="#f33737" roughness={0.5} />
      </mesh>
      {/* Tray lip — front edge */}
      <mesh position={[0, 1.8, 0.82]}>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshStandardMaterial color="#f33737" roughness={0.6} />
      </mesh>
      {/* Tray lip — sides */}
      {[-1, 1].map(side => (
        <mesh key={`tl${side}`} position={[side * 0.48, 1.8, 0.44]}>
          <boxGeometry args={[0.06, 0.06, 0.8]} />
          <meshStandardMaterial color="#f33737" roughness={0.6} />
        </mesh>
      ))}

      {/* Seeds scattered on tray (between the two side lines) */}
      {useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        const rng = () => Math.random();
        const xMin = -0.42,
          xMax = 0.42;
        const zMin = 0.22,
          zMax = 0.78;
        const colors = ['#8D7E63', '#5C4A32', '#A09070'];
        return Array.from({ length: 50 }, (_, i) => ({
          key: `ts${i}`,
          x: xMin + rng() * (xMax - xMin),
          z: zMin + rng() * (zMax - zMin),
          color: colors[i % 3],
        }));
      }, []).map(({ key, x, z, color }) => (
        <mesh key={key} position={[x, 1.82, z]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// Birdbuddy-style birdbath — large shallow teal dish on pole (like feeder)
// camera unit on back rim, white disc inside basin
const BATH_POLE_TOP = 2.0;

export function BirdbuddyBath() {
  return (
    <group>
      {/* Gray pole from ground — same as regular feeder */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.08, 12]} />
        <meshStandardMaterial color="#6B6B6B" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.3, 8]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Basin — large shallow teal dish on top of pole, indented bottom edge */}
      <mesh
        position={[0, BATH_POLE_TOP + 0.1, 0]}
        geometry={useMemo(() => createBasinGeometry(), [])}
      >
        <meshStandardMaterial color="#4A8B96" roughness={0.4} />
      </mesh>
      {/* Basin inner depression */}
      <mesh position={[0, BATH_POLE_TOP + 0.2, 0]}>
        <cylinderGeometry args={[1.15, 1.2, 0.12, 24]} />
        <meshStandardMaterial color="#3D7580" roughness={0.5} />
      </mesh>
      {/* Smooth rim edge */}
      <mesh
        position={[0, BATH_POLE_TOP + 0.25, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[1.25, 0.06, 8, 28]} />
        <meshStandardMaterial color="#4A8B96" roughness={0.35} />
      </mesh>

      {/* Water surface */}
      <mesh
        position={[0, BATH_POLE_TOP + 0.27, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial
          color="#43a5cc"
          roughness={0.05}
          metalness={0.4}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Camera unit — house-shaped teal module on back rim */}
      <group position={[0, BATH_POLE_TOP + 0.22, -1.05]}>
        {/* Camera body — smaller house shape */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.6, 0.7, 0.45]} />
          <meshStandardMaterial color="#2D6B73" roughness={0.4} />
        </mesh>

        {/* Peaked roof on camera unit */}
        <mesh position={[-0.3, 0.69, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.6, 0.04, 0.5]} />
          <meshStandardMaterial color="#2D6B73" roughness={0.4} />
        </mesh>
        <mesh position={[0.3, 0.69, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.6, 0.04, 0.5]} />
          <meshStandardMaterial color="#2D6B73" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.84, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.5]} />
          <meshStandardMaterial color="#2D6B73" roughness={0.4} />
        </mesh>

        {/* White camera strip on front (facing basin center) — rounded corners */}
        <mesh
          position={[-0.09, 0.19, 0.22]}
          geometry={useMemo(
            () => createRoundedStripGeometry(0.18, 0.45, 0.04, 0.5),
            [],
          )}
        >
          <meshStandardMaterial
            color="#E8E4E0"
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        {/* Indicator dot */}
        <mesh position={[0, 0.5, 0.23]}>
          <sphereGeometry args={[0.02, 12, 8]} />
          <meshStandardMaterial
            color="#0d0e0d"
            emissive="#151615"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Camera lens */}
        <mesh position={[0, 0.3, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 12]} />
          <meshStandardMaterial
            color="#1A1A1A"
            roughness={0.15}
            metalness={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}

export function CatSilhouette() {
  return (
    <group position={[2.5, 0, 1.5]} scale={0.7}>
      {/* Cat body */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>
      {/* Cat head */}
      <mesh position={[0, 0.7, 0.3]}>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.12, 0.95, 0.3]} rotation={[0, 0, 0.2]}>
        <coneGeometry args={[0.08, 0.15, 4]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.95, 0.3]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.08, 0.15, 4]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.1, 0.75, 0.5]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[-0.1, 0.75, 0.5]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.3, 0.5, -0.3]} rotation={[0.5, 0.3, -0.8]}>
        <cylinderGeometry args={[0.04, 0.02, 0.6, 6]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.9} />
      </mesh>
    </group>
  );
}
