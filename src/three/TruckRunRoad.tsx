/* eslint-disable react/no-unknown-property -- three.js JSX elements are declared by @react-three/fiber, not the DOM. */
/**
 * THE TRAINING ROAD, IN 3D.
 *
 * Everything inside the Truck Run canvas: a level camera looking straight down
 * a three-lane road, the child's own engine from `TruckModel`, and the hazards,
 * ramps, boost pads and answer gates the sim says are in view.
 *
 * Two rules keep this honest:
 *
 *  1. **The renderer never decides anything.** It calls `sample()` once a frame
 *     and draws what comes back. The sim (`minigames/tactile/TruckRun/run.ts`)
 *     owns every rule, and the 2D fallback draws the same list.
 *  2. **The camera is the simplest one that can exist** — level, no pitch, no
 *     roll — because the gate *labels* are real `@/ui` `<Text>` in an overlay
 *     above the canvas, placed by the plain pinhole maths in `projection.ts`.
 *     A tilted camera would need a matrix the overlay cannot reproduce. The
 *     bump jolt shakes the whole play area instead of the camera, so the two
 *     layers can never drift apart.
 *
 * Draw calls: road + verges + horizon (4), instanced stripes and trees (3),
 * up to ~16 props and 3 gates, plus the truck's 32 — about 55 in the worst
 * case, above the 40 in docs/THREE.md but every one of them is a handful of
 * triangles with a shared material.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { palette } from '@/theme';
import type { TruckStyle } from '@/state/store';
import type { RunFrame, VisibleItem } from '@/minigames/tactile/TruckRun/run';
import { CAMERA, LANE_WIDTH, ROAD_HALF, cameraX, fovFor, laneX } from '@/minigames/tactile/TruckRun/projection';
import { TruckModel } from './TruckModel';

/** How far the tarmac is modelled — well past the fog, so it never runs out. */
const ROAD_LENGTH = 260;
const STRIPE_LENGTH = 3;
const STRIPE_GAP = 5;
const STRIPE_COUNT = 26;
const TREE_COUNT = 18;
const TREE_SPACING = 14;
/** Matches `GATE_BANNER_Y` in the 2D road, so both put the label in one place. */
const GATE_BANNER_Y = 2.9;
const GATE_BANNER_BOTTOM = 1.55;

const tarmacColor = '#6E778F';
const kerbColor = '#8A93AB';

export interface TruckRunRoadProps {
  /** the live sim, sampled once a frame — never through React state */
  sample: () => RunFrame;
  truck: TruckStyle;
  reduced?: boolean;
}

/* ------------------------------------------------------------------ */
/* Shared geometry + materials                                          */
/* ------------------------------------------------------------------ */

interface RoadAssets {
  geo: Record<string, THREE.BufferGeometry>;
  mat: Record<string, THREE.Material>;
}

function buildAssets(): RoadAssets {
  const plane = () => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  };
  const flat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });

  const ramp = new THREE.BufferGeometry();
  /* a wedge: 2.5 wide, 1.15 tall, rising towards the truck */
  const w = 1.25;
  const verts = new Float32Array([
    -w, 0, 1.3, w, 0, 1.3, w, 1.15, -1.3, -w, 1.15, -1.3, /* deck */
    -w, 0, 1.3, -w, 1.15, -1.3, -w, 0, -1.3, /* left cheek */
    w, 0, 1.3, w, 0, -1.3, w, 1.15, -1.3, /* right cheek */
  ]);
  ramp.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  ramp.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 7, 8, 9]);
  ramp.computeVertexNormals();

  return {
    geo: {
      plane: plane(),
      stripe: new THREE.BoxGeometry(0.34, 0.02, STRIPE_LENGTH),
      pothole: new THREE.CylinderGeometry(0.95, 0.8, 0.12, 16),
      puddle: new THREE.CylinderGeometry(1.15, 1.15, 0.06, 18),
      cone: new THREE.ConeGeometry(0.46, 1.3, 12),
      coneBase: new THREE.BoxGeometry(1.1, 0.14, 1.1),
      hose: new THREE.TorusGeometry(0.85, 0.24, 8, 20),
      car: new THREE.BoxGeometry(1.8, 1.5, 3.4),
      carRoof: new THREE.BoxGeometry(1.5, 0.62, 1.8),
      ramp,
      boost: new THREE.BoxGeometry(2.2, 0.08, 2.6),
      chevron: new THREE.BoxGeometry(1.4, 0.1, 0.42),
      post: new THREE.CylinderGeometry(0.11, 0.11, GATE_BANNER_Y, 8),
      board: new THREE.BoxGeometry(2.35, GATE_BANNER_Y - GATE_BANNER_BOTTOM, 0.14),
      trunk: new THREE.CylinderGeometry(0.22, 0.28, 1.6, 6),
      hill: new THREE.ConeGeometry(26, 11, 7),
      leaves: new THREE.ConeGeometry(1.35, 2.9, 7),
    },
    mat: {
      tarmac: flat(tarmacColor, { roughness: 0.95 }),
      kerb: flat(kerbColor),
      grass: flat(palette.grass),
      stripe: flat(palette.cream, { roughness: 0.6 }),
      dark: flat(palette.charcoalDark, { roughness: 1 }),
      water: new THREE.MeshStandardMaterial({
        color: palette.waterCyanLight,
        roughness: 0.15,
        metalness: 0.2,
        transparent: true,
        opacity: 0.8,
      }),
      cone: flat(palette.orange),
      coneBase: flat(palette.orangeDark),
      hose: flat(palette.safetyYellow),
      car: flat(palette.waterCyanDark),
      carRoof: flat(palette.navy),
      ramp: flat(palette.safetyYellow, { roughness: 0.7 }),
      boost: flat(palette.waterCyan, { emissive: new THREE.Color(palette.waterCyan), emissiveIntensity: 0.35 }),
      white: flat(palette.white),
      post: flat(palette.slate, { metalness: 0.25, roughness: 0.5 }),
      board: flat(palette.white, { roughness: 0.6 }),
      boardAssist: flat(palette.safetyYellow, {
        emissive: new THREE.Color(palette.safetyYellow),
        emissiveIntensity: 0.45,
      }),
      trunk: flat(palette.wood),
      hill: flat(palette.grassDark),
      leaves: flat(palette.leafGreen),
    },
  };
}

/* ------------------------------------------------------------------ */
/* One prop on the tarmac                                               */
/* ------------------------------------------------------------------ */

const RoadProp = React.memo(function RoadProp({ kind, assets }: { kind: VisibleItem['kind']; assets: RoadAssets }) {
  const { geo, mat } = assets;
  switch (kind) {
    case 'pothole':
      return <mesh geometry={geo.pothole} material={mat.dark} position={[0, 0.02, 0]} />;
    case 'puddle':
      return <mesh geometry={geo.puddle} material={mat.water} position={[0, 0.03, 0]} />;
    case 'cone':
      return (
        <group>
          <mesh geometry={geo.coneBase} material={mat.coneBase} position={[0, 0.07, 0]} />
          <mesh geometry={geo.cone} material={mat.cone} position={[0, 0.78, 0]} />
        </group>
      );
    case 'hose':
      return <mesh geometry={geo.hose} material={mat.hose} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.24, 0]} />;
    case 'car':
      return (
        <group>
          <mesh geometry={geo.car} material={mat.car} position={[0, 0.78, 0]} />
          <mesh geometry={geo.carRoof} material={mat.carRoof} position={[0, 1.66, -0.2]} />
        </group>
      );
    case 'ramp':
      return <mesh geometry={geo.ramp} material={mat.ramp} />;
    case 'boost':
      return (
        <group>
          <mesh geometry={geo.boost} material={mat.boost} position={[0, 0.04, 0]} />
          <mesh geometry={geo.chevron} material={mat.white} position={[0, 0.1, -0.5]} />
          <mesh geometry={geo.chevron} material={mat.white} position={[0, 0.1, 0.4]} />
        </group>
      );
    default:
      return null;
  }
});

const GateFrame = React.memo(function GateFrame({ assets, assist }: { assets: RoadAssets; assist: boolean }) {
  const { geo, mat } = assets;
  const boardY = (GATE_BANNER_Y + GATE_BANNER_BOTTOM) / 2;
  return (
    <group>
      <mesh geometry={geo.post} material={mat.post} position={[-1.25, GATE_BANNER_Y / 2, 0]} />
      <mesh geometry={geo.post} material={mat.post} position={[1.25, GATE_BANNER_Y / 2, 0]} />
      <mesh geometry={geo.board} material={assist ? mat.boardAssist : mat.board} position={[0, boardY, 0]} />
    </group>
  );
});

/* ------------------------------------------------------------------ */
/* The scene                                                            */
/* ------------------------------------------------------------------ */

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3(1, 1, 1);

export function TruckRunRoad({ sample, truck, reduced = false }: TruckRunRoadProps) {
  const assets = useMemo(() => buildAssets(), []);
  useEffect(
    () => () => {
      for (const g of Object.values(assets.geo)) g.dispose();
      for (const m of Object.values(assets.mat)) m.dispose();
    },
    [assets],
  );

  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  /**
   * The camera is the projection in `projection.ts`, expressed in three: level,
   * on the road, with the field of view that makes the tarmac fit this canvas.
   * Any drift here and the gate labels would sit off their banners.
   */
  useLayoutEffect(() => {
    camera.position.set(0, CAMERA.height, 0);
    camera.rotation.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.near = CAMERA.near;
    camera.far = CAMERA.far;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fovFor({ w: size.width, h: size.height });
    }
    camera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

  const truckRef = useRef<THREE.Group>(null);
  const stripes = useRef<THREE.InstancedMesh>(null);
  const trees = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const nodes = useRef(new Map<string, THREE.Group>());

  /** membership only — positions are set imperatively every frame */
  const [shown, setShown] = useState<{ id: string; kind: VisibleItem['kind']; lane: number }[]>([]);
  const signature = useRef('');
  const assistLane = useRef<number | null>(null);
  const [assist, setAssist] = useState<number | null>(null);

  useFrame(() => {
    const frame = sample();

    /* own the camera every frame so nothing else can move it — it follows the
       truck sideways just enough to keep it off the edge of a phone screen */
    camera.position.set(cameraX(frame.lane), CAMERA.height, 0);
    camera.rotation.set(0, 0, 0);

    /* what is on the road */
    const sig = frame.items.map((i) => i.id).join('|');
    if (sig !== signature.current) {
      signature.current = sig;
      setShown(frame.items.map((i) => ({ id: i.id, kind: i.kind, lane: i.lane })));
    }
    if (assistLane.current !== frame.assistLane) {
      assistLane.current = frame.assistLane;
      setAssist(frame.assistLane);
    }

    for (const item of frame.items) {
      const node = nodes.current.get(item.id);
      if (!node) continue;
      node.position.set(laneX(item.lane), 0, -(CAMERA.back + item.ahead));
      node.visible = true;
      if (item.spent && item.kind === 'cone') node.rotation.x = 1.15;
    }

    /* the truck */
    if (truckRef.current) {
      truckRef.current.position.set(laneX(frame.lane), frame.jump * (reduced ? 0.8 : 2.1), -CAMERA.back);
      truckRef.current.rotation.z = (frame.target - frame.lane) * (reduced ? 0 : 0.16);
    }

    /* lane markings scroll towards the camera */
    const period = STRIPE_LENGTH + STRIPE_GAP;
    const first = Math.ceil(frame.distance / period) * period;
    if (stripes.current) {
      for (let i = 0; i < STRIPE_COUNT; i += 1) {
        const half = Math.floor(i / 2);
        const ahead = first + half * period - frame.distance;
        tmpPos.set((i % 2 === 0 ? -0.5 : 0.5) * LANE_WIDTH, 0.02, -(CAMERA.back + ahead));
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        stripes.current.setMatrixAt(i, tmpMatrix);
      }
      stripes.current.instanceMatrix.needsUpdate = true;
    }

    /* trees on the verge, for the sense of speed */
    const treeFirst = Math.ceil(frame.distance / TREE_SPACING) * TREE_SPACING;
    for (const mesh of [trees.current, trunks.current]) {
      if (!mesh) continue;
      for (let i = 0; i < TREE_COUNT; i += 1) {
        const half = Math.floor(i / 2);
        const ahead = treeFirst + half * TREE_SPACING - frame.distance;
        const side = i % 2 === 0 ? -1 : 1;
        const y = mesh === trees.current ? 2.4 : 0.8;
        tmpPos.set(side * (ROAD_HALF + 3.4 + (half % 3) * 0.9), y, -(CAMERA.back + ahead));
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        mesh.setMatrixAt(i, tmpMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  /**
   * One ref callback per id, kept for the life of the item. A fresh closure
   * every render would make React detach and re-attach every prop whenever a
   * single one entered the view — and each re-attach hides the object for a
   * frame, which reads as the whole road flickering.
   */
  const registrars = useRef(new Map<string, (node: THREE.Group | null) => void>());
  const register = useCallback((id: string) => {
    const existing = registrars.current.get(id);
    if (existing) return existing;
    const fn = (node: THREE.Group | null) => {
      if (node) {
        node.visible = false;
        nodes.current.set(id, node);
      } else {
        nodes.current.delete(id);
        registrars.current.delete(id);
      }
    };
    registrars.current.set(id, fn);
    return fn;
  }, []);

  return (
    <>
      <fog attach="fog" args={[palette.skyBottom, CAMERA.back + 34, CAMERA.back + 74]} />
      <hemisphereLight args={[palette.skyBottom, palette.grass, 1.9]} />
      <directionalLight position={[6, 9, 4]} intensity={1.5} />
      <directionalLight position={[-6, 3, -6]} intensity={0.4} color={palette.waterCyanLight} />

      {/* the yard, the tarmac and its kerbs */}
      <mesh
        geometry={assets.geo.plane}
        material={assets.mat.grass}
        position={[0, -0.06, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
        scale={[240, 1, ROAD_LENGTH]}
      />
      <mesh
        geometry={assets.geo.plane}
        material={assets.mat.tarmac}
        position={[0, 0, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
        scale={[ROAD_HALF * 2, 1, ROAD_LENGTH]}
      />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={assets.geo.plane}
          material={assets.mat.kerb}
          position={[side * (ROAD_HALF - 0.2), 0.01, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
          scale={[0.4, 1, ROAD_LENGTH]}
        />
      ))}

      {/* the skyline: far enough out that the fog turns them into haze */}
      {[-1, 1].map((side) => (
        <mesh
          key={`hill${side}`}
          geometry={assets.geo.hill}
          material={assets.mat.hill}
          position={[side * 30, 0, -(CAMERA.back + 62)]}
        />
      ))}
      <mesh geometry={assets.geo.hill} material={assets.mat.hill} position={[2, -1.5, -(CAMERA.back + 78)]} scale={[1.4, 0.9, 1]} />

      <instancedMesh ref={stripes} args={[assets.geo.stripe, assets.mat.stripe, STRIPE_COUNT]} frustumCulled={false} />
      <instancedMesh ref={trunks} args={[assets.geo.trunk, assets.mat.trunk, TREE_COUNT]} frustumCulled={false} />
      <instancedMesh ref={trees} args={[assets.geo.leaves, assets.mat.leaves, TREE_COUNT]} frustumCulled={false} />

      {shown.map((item) => (
        <group key={item.id} ref={register(item.id)}>
          {item.kind === 'gate' ? (
            <GateFrame assets={assets} assist={assist === item.lane} />
          ) : (
            <RoadProp kind={item.kind} assets={assets} />
          )}
        </group>
      ))}

      <group ref={truckRef} position={[0, 0, -CAMERA.back]}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <TruckModel style={truck} spinning reduced={reduced} />
        </group>
      </group>
    </>
  );
}
