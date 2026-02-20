'use client';

import { useEffect, useState } from 'react';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import type { Group } from 'three';

interface ObjMtlModelProps {
  /** Base URL without extension, e.g. "/models/cat/model". Loads model.obj and model.mtl from same folder. */
  baseUrl: string;
  /** Optional scale applied to the whole model. */
  scale?: number | [number, number, number];
  /** Optional position [x, y, z]. */
  position?: [number, number, number];
  /** Optional rotation [x, y, z] in radians. */
  rotation?: [number, number, number];
  children?: React.ReactNode;
}

/**
 * Loads an OBJ model with its MTL materials (and any JPG/PNG textures referenced in the MTL).
 * Put your files in public/, e.g.:
 *   public/models/cat/model.obj
 *   public/models/cat/model.mtl
 *   public/models/cat/yourcolor.jpg   (same folder; name must match map_Kd in .mtl)
 * Then use: <ObjMtlModel baseUrl="/models/cat/model" />
 */
export function ObjMtlModel({
  baseUrl,
  scale = 0.2,
  position,
  rotation,
  children,
}: ObjMtlModelProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const objUrl = `${baseUrl}.obj`;
    const mtlUrl = `${baseUrl}.mtl`;
    const baseDir = baseUrl.slice(0, baseUrl.lastIndexOf('/') + 1) || '/';
    const mtlFilename = mtlUrl.split('/').pop()!;

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath(baseDir);

    mtlLoader.load(
      mtlFilename,
      materials => {
        if (cancelled) return;
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          objUrl,
          object => {
            if (!cancelled) setGroup(object);
          },
          undefined,
          err => setError((err as Error)?.message || 'Failed to load OBJ'),
        );
      },
      undefined,
      err => setError((err as Error)?.message || 'Failed to load MTL'),
    );

    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  if (error) {
    return (
      <group position={position} rotation={rotation}>
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      </group>
    );
  }

  if (!group) return null;

  const scaleArr = Array.isArray(scale) ? scale : [scale, scale, scale];

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scaleArr as [number, number, number]}
    >
      <primitive object={group} />
      {children}
    </group>
  );
}
