/* eslint-disable react/no-unknown-property -- three.js JSX elements are declared by @react-three/fiber, not the DOM. */
/**
 * THE ROAD THROUGH SPARK CITY, IN 3D.
 *
 * Everything inside the Truck Run canvas: a level camera looking straight down
 * a three-lane street, the child's own engine from `TruckModel`, the hazards,
 * ramps, boost pads and answer gates the sim says are in view — and the town
 * itself, which `TruckRunTown` draws from the same distance the sim reports.
 *
 * Three rules keep this honest:
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
 *  3. **One solid, one draw.** Every prop, every gate and every building is a
 *     single merged vertex-coloured geometry from `truckRunKit`, so dressing
 *     the drive as a neighbourhood cost fewer draw calls than the empty road
 *     used to, not more.
 *
 * Draw calls, counted in headless Chromium over a band-C drive at 390×844:
 * median 62, peak 66 — against median 61, peak 63 for the empty country road
 * this replaced. The whole neighbourhood costs about eighteen calls, and
 * merging the props, the gates and each building down to one geometry apiece
 * gave back about eighteen, so a street full of shops costs what a verge full
 * of trees used to. See docs/THREE.md.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { palette } from '@/theme';
import type { TruckStyle } from '@/state/store';
import type { RunFrame, VisibleItem } from '@/minigames/tactile/TruckRun/run';
import { CAMERA, LANE_WIDTH, ROAD_HALF, cameraX, fovFor, laneX } from '@/minigames/tactile/TruckRun/projection';
import { destinationFor, streetSeed } from '@/minigames/tactile/TruckRun/neighbourhood';
import { TruckModel } from './TruckModel';
import { TruckRunTown, type TruckRunTownHandle } from './TruckRunTown';
import { gateGeometry, kitMaterial, propGeometries } from './truckRunKit';

/** How far the tarmac is modelled — well past the fog, so it never runs out. */
const ROAD_LENGTH = 260;
const STRIPE_LENGTH = 3;
const STRIPE_GAP = 5;
const STRIPE_COUNT = 26;
/** Matches `GATE_BANNER_Y` in the 2D road, so both put the label in one place. */
const GATE_BANNER_Y = 2.9;
const GATE_BANNER_BOTTOM = 1.55;

const tarmacColor = '#6E778F';
const kerbColor = '#E8ECF6';

export interface TruckRunRoadProps {
  /** the live sim, sampled once a frame — never through React state */
  sample: () => RunFrame;
  truck: TruckStyle;
  reduced?: boolean;
  /** the run's scene: which corner of Spark City it drives through, and to what */
  scene?: string;
}

/* ------------------------------------------------------------------ */
/* Shared geometry + materials                                          */
/* ------------------------------------------------------------------ */

interface RoadAssets {
  plane: THREE.BufferGeometry;
  stripe: THREE.BufferGeometry;
  props: Record<string, THREE.BufferGeometry>;
  gate: THREE.BufferGeometry;
  gateAssist: THREE.BufferGeometry;
  kit: THREE.Material;
  tarmac: THREE.Material;
  kerb: THREE.Material;
  grass: THREE.Material;
  stripeMat: THREE.Material;
}

function buildAssets(): RoadAssets {
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.rotateX(-Math.PI / 2);
  const flat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });

  return {
    plane,
    stripe: new THREE.BoxGeometry(0.34, 0.02, STRIPE_LENGTH),
    props: propGeometries(),
    gate: gateGeometry(GATE_BANNER_Y, GATE_BANNER_BOTTOM, false),
    gateAssist: gateGeometry(GATE_BANNER_Y, GATE_BANNER_BOTTOM, true),
    kit: kitMaterial(),
    tarmac: flat(tarmacColor, { roughness: 0.95 }),
    kerb: flat(kerbColor),
    grass: flat(palette.grass),
    stripeMat: flat(palette.cream, { roughness: 0.6 }),
  };
}

function disposeAssets(a: RoadAssets): void {
  a.plane.dispose();
  a.stripe.dispose();
  for (const g of Object.values(a.props)) g.dispose();
  a.gate.dispose();
  a.gateAssist.dispose();
  a.kit.dispose();
  a.tarmac.dispose();
  a.kerb.dispose();
  a.grass.dispose();
  a.stripeMat.dispose();
}

/* ------------------------------------------------------------------ */
/* One prop on the tarmac — one merged geometry, one draw               */
/* ------------------------------------------------------------------ */

const RoadProp = React.memo(function RoadProp({ kind, assets }: { kind: VisibleItem['kind']; assets: RoadAssets }) {
  const geo = assets.props[kind];
  if (!geo) return null;
  return <mesh geometry={geo} material={assets.kit} />;
});

const GateFrame = React.memo(function GateFrame({ assets, assist }: { assets: RoadAssets; assist: boolean }) {
  return <mesh geometry={assist ? assets.gateAssist : assets.gate} material={assets.kit} />;
});

/* ------------------------------------------------------------------ */
/* The scene                                                            */
/* ------------------------------------------------------------------ */

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3(1, 1, 1);

export function TruckRunRoad({ sample, truck, reduced = false, scene }: TruckRunRoadProps) {
  const assets = useMemo(() => buildAssets(), []);
  useEffect(() => () => disposeAssets(assets), [assets]);

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
  const town = useRef<TruckRunTownHandle>(null);
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

    /* the town beside the road, from the same distance the sim reports */
    town.current?.update(frame.distance, frame.finishAhead);

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
      <fog attach="fog" args={[palette.skyBottom, CAMERA.back + 34, CAMERA.back + 78]} />
      {/* the light falls from the left, exactly as it does on the town map, so
          a wall facing left is the lit one here and in the SVG town too */}
      <hemisphereLight args={[palette.skyBottom, palette.grass, 1.75]} />
      <directionalLight position={[-8, 11, 5]} intensity={1.5} />
      <directionalLight position={[7, 3, -6]} intensity={0.35} color={palette.waterCyanLight} />

      {/* the ground, the tarmac and its kerbs */}
      <mesh
        geometry={assets.plane}
        material={assets.grass}
        position={[0, -0.06, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
        scale={[240, 1, ROAD_LENGTH]}
      />
      <mesh
        geometry={assets.plane}
        material={assets.tarmac}
        position={[0, 0, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
        scale={[ROAD_HALF * 2, 1, ROAD_LENGTH]}
      />
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={assets.plane}
          material={assets.kerb}
          position={[side * (ROAD_HALF - 0.2), 0.01, -(CAMERA.back + ROAD_LENGTH / 2 - 30)]}
          scale={[0.4, 1, ROAD_LENGTH]}
        />
      ))}

      <TruckRunTown ref={town} seed={streetSeed(scene)} destination={destinationFor(scene)} />

      <instancedMesh ref={stripes} args={[assets.stripe, assets.stripeMat, STRIPE_COUNT]} frustumCulled={false} />

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
