/* eslint-disable react/no-unknown-property -- three.js JSX elements are declared by @react-three/fiber, not the DOM. */
/**
 * A Station Spark badge as a real medal: a chunky extruded shield with a
 * coloured rim, a lighter inner face and a gold emblem, that spins twice on its
 * Y axis and throws a burst of sparkles whenever `flipKey` changes.
 *
 * Drop-in for the 2D `<BadgeArt/>` — same silhouette, same colour contract —
 * so `CelebrationOverlay` can swap one for the other without moving anything
 * else. If GL is unavailable it renders `<BadgeArt/>` itself.
 *
 *   <Badge3D color={def.color} icon={def.icon} size={104} flipKey={play} />
 *
 * Draw calls: 5 (rim, face, emblem, sparkles, shadow).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { palette } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { BadgeArt } from '@/ui/kit/BadgeArt';
import { mix } from '@/characters/rig/palettes';
import { Stage } from './Stage';
import { ThreeBoundary } from './ThreeBoundary';
import { badge3DIcons, emblemShapes, shieldShape, type Badge3DIcon } from './shapes';

export type { Badge3DIcon } from './shapes';
export { badge3DIcons } from './shapes';

const BADGE_CAMERA = { position: [0, 0.06, 3.1] as [number, number, number], fov: 30 };
const FLIP_MS = 1150;
const SPARKS = 20;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/* ------------------------------------------------------------------ */
/* Geometry                                                             */
/* ------------------------------------------------------------------ */

function extrudeCentred(shapes: THREE.Shape[], depth: number, centreXY: boolean): THREE.ExtrudeGeometry {
  const bevel = depth * 0.28;
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 14,
  });
  if (centreXY) g.center();
  else g.translate(0, 0, -(depth + bevel * 2) / 2);
  return g;
}

interface BadgeGeometry {
  rim: THREE.ExtrudeGeometry;
  face: THREE.ExtrudeGeometry;
  emblem: THREE.ExtrudeGeometry;
  spark: THREE.SphereGeometry;
}

function buildGeometry(icon: Badge3DIcon): BadgeGeometry {
  return {
    rim: extrudeCentred([shieldShape(1)], 0.24, false),
    face: extrudeCentred([shieldShape(0.84)], 0.07, false),
    emblem: extrudeCentred(emblemShapes(icon), 0.06, true),
    spark: new THREE.SphereGeometry(0.038, 8, 6),
  };
}

interface BadgeMaterials {
  rim: THREE.MeshStandardMaterial;
  face: THREE.MeshStandardMaterial;
  emblem: THREE.MeshStandardMaterial;
  spark: THREE.MeshStandardMaterial;
}

function buildMaterials(color: string): BadgeMaterials {
  return {
    rim: new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.34 }),
    face: new THREE.MeshStandardMaterial({ color: mix(color, '#FFFFFF', 0.22), roughness: 0.42, metalness: 0.16 }),
    emblem: new THREE.MeshStandardMaterial({
      color: palette.safetyYellow,
      emissive: new THREE.Color(palette.gold),
      emissiveIntensity: 0.24,
      roughness: 0.26,
      metalness: 0.55,
    }),
    spark: new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      emissive: new THREE.Color(palette.safetyYellow),
      emissiveIntensity: 1.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0,
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

/** Overshooting ease — the "spring" that lands the medal facing you. */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = t - 1;
  return 1 + c3 * p * p * p + c1 * p * p;
}

interface Spark {
  dir: THREE.Vector3;
  speed: number;
  spin: number;
}

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

export interface Badge3DContentProps {
  color: string;
  icon: Badge3DIcon;
  /** bump to replay the flip + sparkle burst */
  flipKey?: number;
  reduced?: boolean;
}

/** The badge scene graph. Exported for anyone composing it into a bigger canvas. */
export function Badge3DContent({ color, icon, flipKey = 0, reduced = false }: Badge3DContentProps) {
  const geo = useMemo(() => buildGeometry(icon), [icon]);
  const mat = useMemo(() => buildMaterials(color), [color]);
  useEffect(
    () => () => {
      for (const g of Object.values(geo)) g.dispose();
    },
    [geo],
  );
  useEffect(
    () => () => {
      for (const m of Object.values(mat)) m.dispose();
    },
    [mat],
  );

  // Deterministic golden-angle spray: an even burst, and identical every replay.
  const sparks = useMemo<Spark[]>(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        const a = i * GOLDEN_ANGLE;
        const b = (i / SPARKS - 0.5) * 1.2;
        return {
          dir: new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b) * 0.6 + 0.4).normalize(),
          speed: 1.5 + ((i * 7) % 5) * 0.32,
          spin: (i * 1.7) % Math.PI,
        };
      }),
    [],
  );

  const badge = useRef<THREE.Group>(null);
  const burst = useRef<THREE.InstancedMesh>(null);
  const t = useRef(1); // flip progress, 1 = settled
  const lastKey = useRef(flipKey);

  useEffect(() => {
    if (flipKey !== lastKey.current) {
      lastKey.current = flipKey;
      t.current = reduced ? 1 : 0;
    }
  }, [flipKey, reduced]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const clock = state.clock.elapsedTime;

    if (t.current < 1) t.current = Math.min(1, t.current + (dt * 1000) / FLIP_MS);
    const p = t.current;
    const e = easeOutBack(p);

    if (badge.current) {
      // two full turns, landing face-on with a spring settle
      badge.current.rotation.y = (1 - e) * -Math.PI * 4 + (reduced ? 0 : Math.sin(clock * 0.7) * 0.11);
      badge.current.rotation.x = reduced ? 0 : Math.sin(clock * 0.55) * 0.05;
      const pop = 0.72 + 0.28 * e;
      badge.current.scale.setScalar(pop);
    }

    if (burst.current) {
      const life = Math.min(1, p / 0.62);
      const alive = p < 0.75 && !reduced;
      mat.spark.opacity = alive ? 1 - life : 0;
      for (let i = 0; i < SPARKS; i += 1) {
        const s = sparks[i];
        if (!s) continue;
        const d = s.speed * life * 0.7;
        tmpPos.copy(s.dir).multiplyScalar(0.28 + d);
        tmpPos.y -= life * life * 0.34; // a little gravity
        tmpQuat.setFromAxisAngle(s.dir, s.spin + clock * 2);
        tmpScale.setScalar(alive ? 1 - life * 0.7 : 0);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        burst.current.setMatrixAt(i, tmpMatrix);
      }
      burst.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <hemisphereLight args={[palette.skyBottom, palette.cream, 1.7]} />
      <directionalLight position={[-2.4, 3.2, 4.2]} intensity={1.9} />
      <directionalLight position={[3.2, -1.4, 2]} intensity={0.65} color={palette.waterCyanLight} />

      <group ref={badge}>
        <mesh geometry={geo.rim} material={mat.rim} />
        <mesh geometry={geo.face} material={mat.face} position={[0, 0, 0.17]} />
        <mesh geometry={geo.emblem} material={mat.emblem} position={[0, 0.03, 0.26]} scale={0.52} />
      </group>

      <instancedMesh ref={burst} args={[geo.spark, mat.spark, SPARKS]} frustumCulled={false} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */

export interface Badge3DProps {
  /** rim colour — pass `BadgeDef.color`, exactly like `<BadgeArt/>` */
  color?: string;
  /** `BadgeDef.icon`; ids the 3D kit doesn't carry fall back to a star */
  icon?: Badge3DIcon | string;
  /** rendered width in px (default 104); height follows at ×1.3 */
  size?: number;
  /** bump this number to replay the flip + sparkle burst */
  flipKey?: number;
  /** render the 2D `<BadgeArt/>` instead of GL — for QA */
  forceFallback?: boolean;
  testID?: string;
}

const isBadge3DIcon = (v: string): v is Badge3DIcon => (badge3DIcons as readonly string[]).includes(v);

/**
 * The badge, canvas and safety net in one. Sized like `<BadgeArt/>`: pass the
 * same `color`/`icon`/`size` and it drops straight in.
 */
export function Badge3D({ color = palette.engineRed, icon = 'star', size = 104, flipKey = 0, forceFallback, testID }: Badge3DProps) {
  const reduced = useReducedMotion();
  const id = isBadge3DIcon(String(icon)) ? (icon as Badge3DIcon) : 'star';

  return (
    <ThreeBoundary forceFallback={forceFallback} fallback={<BadgeArt color={color} icon={id} size={size} />}>
      <Stage height={size * 1.3} camera={BADGE_CAMERA} style={{ width: size }} touchAction="auto" testID={testID}>
        <Badge3DContent color={color} icon={id} flipKey={flipKey} reduced={reduced} />
      </Stage>
    </ThreeBoundary>
  );
}
