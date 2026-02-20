'use client';

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { BirdSpeciesId } from '@/types';
import * as THREE from 'three';

// Map species ID to texture file name
const SPECIES_TEXTURE: Record<BirdSpeciesId, string> = {
  cardinal: '/models/mybird/textures/lambert2_baseColor.png',
  tanager: '/models/mybird/textures/lambert2_baseColor-scarlet.png',
  bunting: '/models/mybird/textures/lambert2_baseColor-indigo.png',
  starling: '/models/mybird/textures/lambert2_baseColor-starling.png',
};

interface GltfBirdModelProps {
  isFlapping: boolean;
  isPerched?: boolean;
  scale?: number;
  speciesId?: BirdSpeciesId;
}

const WING_THRESHOLD = 0.8;
const FLAP_DURATION = 0.3;
const FLAP_LIFT = 0.8; // max Y displacement at wingtip

export default function GltfBirdModel({
  isFlapping,
  isPerched = false,
  scale = 1,
  speciesId = 'cardinal',
}: GltfBirdModelProps) {
  const { scene } = useGLTF('/models/mybird/scene.gltf');
  const speciesTexture = useTexture(
    SPECIES_TEXTURE[speciesId] || SPECIES_TEXTURE.cardinal,
  );

  // Deep clone including geometry buffers so vertex edits don't corrupt the cached original
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry = child.geometry.clone();
      }
    });
    return clone;
  }, [scene]);

  // Apply species base color texture to all mesh materials
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    speciesTexture.flipY = false;
    speciesTexture.colorSpace = THREE.SRGBColorSpace;
    speciesTexture.needsUpdate = true;
    clonedScene.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.map = speciesTexture;
        mat.color.set(1, 1, 1); // reset tint so texture shows true colors
        mat.needsUpdate = true;
      }
    });
  }, [clonedScene, speciesTexture]);
  const groupRef = useRef<THREE.Group>(null);
  const flapTime = useRef(-1);
  const flapActive = useRef(false);
  const originalPositions = useRef<Map<THREE.BufferGeometry, Float32Array>>(
    new Map(),
  );

  const initOriginals = useCallback(() => {
    if (originalPositions.current.size > 0) return;
    clonedScene.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const pos = child.geometry.attributes.position;
        if (pos) {
          originalPositions.current.set(
            child.geometry,
            new Float32Array(pos.array),
          );
        }
      }
    });
  }, [clonedScene]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    initOriginals();

    // Trigger new flap
    if (isFlapping && !flapActive.current) {
      flapActive.current = true;
      flapTime.current = 0;
    }

    if (flapTime.current >= 0) {
      flapTime.current += delta;
      const progress = Math.min(flapTime.current / FLAP_DURATION, 1);
      // Smooth up-down: sin gives 0→1→0 over the flap
      const lift = Math.sin(progress * Math.PI) * FLAP_LIFT;

      applyWingLift(clonedScene, originalPositions.current, lift);

      if (progress >= 1) {
        flapTime.current = -1;
        flapActive.current = false;
        resetVertices(clonedScene, originalPositions.current);
      }
    } else if (isPerched) {
      // Wings tucked down when perched
      flapActive.current = false;
      applyWingLift(clonedScene, originalPositions.current, -FLAP_LIFT);
    } else {
      // Not flapping — keep wings in original model position
      flapActive.current = false;
      resetVertices(clonedScene, originalPositions.current);
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// Simple Y-offset lift: wing vertices move up proportional to distance from wing root
function applyWingLift(
  scene: THREE.Object3D,
  originals: Map<THREE.BufferGeometry, Float32Array>,
  lift: number,
) {
  scene.traverse(child => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const posAttr = child.geometry.attributes.position;
      const orig = originals.get(child.geometry);
      if (!posAttr || !orig) return;

      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < orig.length; i += 3) {
        const ox = orig[i];

        if (Math.abs(ox) > WING_THRESHOLD) {
          // How far this vertex is from the wing root (0 at root, 1+ at tip)
          const dist = Math.abs(ox) - WING_THRESHOLD;
          // Y offset scales with distance — wingtip moves most
          arr[i + 1] = orig[i + 1] + lift * dist;
        }
      }
      posAttr.needsUpdate = true;
    }
  });
}

function resetVertices(
  scene: THREE.Object3D,
  originals: Map<THREE.BufferGeometry, Float32Array>,
) {
  scene.traverse(child => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const posAttr = child.geometry.attributes.position;
      const orig = originals.get(child.geometry);
      if (posAttr && orig) {
        (posAttr.array as Float32Array).set(orig);
        posAttr.needsUpdate = true;
      }
    }
  });
}

// Preload all species textures
Object.values(SPECIES_TEXTURE).forEach(url => useTexture.preload(url));
