/* eslint-disable react/no-unknown-property -- three.js JSX elements are declared by @react-three/fiber, not the DOM. */
/**
 * SPARK CITY, IN 3D.
 *
 * The street the truck drives down: pavements and kerbs, the town's own shops
 * and houses lining both sides, street lamps leaning over the kerb, hydrants on
 * the corners, cars parked clear of every lane, zebra crossings, and side
 * streets opening off at every third block.
 *
 * It draws **only what `neighbourhood.ts` says is there**, which is the same
 * list the 2D road draws, so a child who loses WebGL halfway down the street
 * keeps driving through the same town.
 *
 * ### Why this is cheap
 *
 * One `InstancedMesh` per building type and per piece of furniture, each fed a
 * geometry that has already been merged down to a single draw (`truckRunKit`).
 * A type that is not on screen has its `count` set to 0, and three skips the
 * draw entirely — so a street of a dozen buildings and thirty pieces of
 * furniture costs about a dozen calls, not a hundred, and the cost falls as the
 * town thins out rather than being paid up front.
 *
 * Nothing here is a game rule: the town cannot be hit, cannot block a lane and
 * never changes what the sim does. There are no people on the road (safety —
 * see docs/ART_DIRECTION.md); the crossings are painted and empty.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  BUILDINGS,
  BUILD_LINE,
  CROSSING_BARS,
  PAVEMENT_W,
  SIDE_STREET_LENGTH,
  streetView,
  type BuildingId,
  type FurnitureKind,
} from '@/minigames/tactile/TruckRun/neighbourhood';
import { CAMERA, ROAD_HALF } from '@/minigames/tactile/TruckRun/projection';
import { arrivalArchGeometry, buildingGeometry, crossingBarGeometry, furnitureGeometry, kitMaterial } from './truckRunKit';

/** How far down the street the town is built. Past this the fog has it. */
export const TOWN_DEPTH = 62;
/** How long the pavements are modelled — well past the fog, like the tarmac. */
const PAVEMENT_LENGTH = 260;
/** Road units between the bars of a zebra crossing. */
const CROSSING_PITCH = 1.7;

/** How many of one thing can be on screen at once, with room to spare. */
const BUILDING_CAP = 5;
const FURNITURE_CAP: Record<FurnitureKind, number> = {
  lamp: 8,
  hydrant: 4,
  tree: 16,
  bench: 8,
  planter: 8,
  car: 8,
  van: 6,
  postbox: 4,
};
const CROSSING_CAP = CROSSING_BARS * 3;
const SIDE_STREET_CAP = 6;

const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];
const FURNITURE_IDS = Object.keys(FURNITURE_CAP) as FurnitureKind[];

export interface TruckRunTownHandle {
  /** called once a frame by the road, from its own `useFrame` */
  update(distance: number, finishAhead: number | null): void;
}

export interface TruckRunTownProps {
  /** which corner of town this drive starts from */
  seed?: number;
  /** the building waiting at the end of the run */
  destination?: BuildingId;
}

/* ------------------------------------------------------------------ */

const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpScale = new THREE.Vector3(1, 1, 1);
const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

/** Place one instance; `turn` is a spin about its own upright axis. */
function place(mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, turn: number): void {
  tmpPos.set(x, y, z);
  tmpEuler.set(0, turn, 0);
  tmpQuat.setFromEuler(tmpEuler);
  tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
  mesh.setMatrixAt(index, tmpMatrix);
}

export const TruckRunTown = forwardRef<TruckRunTownHandle, TruckRunTownProps>(function TruckRunTown(
  { seed = 0, destination },
  ref,
) {
  /* Geometry and materials are built once per mount and disposed with it —
     the same contract the road's own assets follow. */
  const assets = useMemo(() => {
    const buildings = BUILDING_IDS.map((id) => ({ id, geo: buildingGeometry(id) }));
    const furniture = FURNITURE_IDS.map((id) => ({ id, geo: furnitureGeometry(id) }));

    const pavement = new THREE.BoxGeometry(PAVEMENT_W, 0.16, PAVEMENT_LENGTH);
    const sideStreet = new THREE.BoxGeometry(SIDE_STREET_LENGTH, 0.18, 1);
    return {
      buildings,
      furniture,
      crossing: crossingBarGeometry(),
      arch: arrivalArchGeometry(),
      pavement,
      sideStreet,
      kit: kitMaterial(),
      paving: new THREE.MeshStandardMaterial({ color: '#D6DCE9', roughness: 0.95, flatShading: true }),
      tarmac: new THREE.MeshStandardMaterial({ color: '#6E778F', roughness: 0.95, flatShading: true }),
    };
  }, []);

  useEffect(
    () => () => {
      for (const b of assets.buildings) b.geo.dispose();
      for (const f of assets.furniture) f.geo.dispose();
      assets.crossing.dispose();
      assets.arch.dispose();
      assets.pavement.dispose();
      assets.sideStreet.dispose();
      assets.kit.dispose();
      assets.paving.dispose();
      assets.tarmac.dispose();
    },
    [assets],
  );

  const buildingRefs = useRef(new Map<BuildingId, THREE.InstancedMesh>());
  const furnitureRefs = useRef(new Map<FurnitureKind, THREE.InstancedMesh>());
  const crossings = useRef<THREE.InstancedMesh>(null);
  const sideStreets = useRef<THREE.InstancedMesh>(null);
  const arch = useRef<THREE.Mesh>(null);

  /* one stable ref callback per key: a fresh closure each render would make
     three detach and re-attach every mesh, which reads as the town blinking */
  const buildingRegistrars = useRef(new Map<BuildingId, (node: THREE.InstancedMesh | null) => void>());
  const registerBuilding = (id: BuildingId) => {
    const existing = buildingRegistrars.current.get(id);
    if (existing) return existing;
    const fn = (node: THREE.InstancedMesh | null) => {
      if (node) {
        node.count = 0;
        buildingRefs.current.set(id, node);
      } else buildingRefs.current.delete(id);
    };
    buildingRegistrars.current.set(id, fn);
    return fn;
  };

  const furnitureRegistrars = useRef(new Map<FurnitureKind, (node: THREE.InstancedMesh | null) => void>());
  const registerFurniture = (id: FurnitureKind) => {
    const existing = furnitureRegistrars.current.get(id);
    if (existing) return existing;
    const fn = (node: THREE.InstancedMesh | null) => {
      if (node) {
        node.count = 0;
        furnitureRefs.current.set(id, node);
      } else furnitureRefs.current.delete(id);
    };
    furnitureRegistrars.current.set(id, fn);
    return fn;
  };

  useImperativeHandle(
    ref,
    () => ({
      update(distance: number, finishAhead: number | null) {
        const street = streetView(distance, TOWN_DEPTH, { seed, destination, finishAhead });

        /* ---- buildings ------------------------------------------- */
        const used = new Map<BuildingId, number>();
        for (const item of street.buildings) {
          const mesh = buildingRefs.current.get(item.kind);
          if (!mesh) continue;
          const n = used.get(item.kind) ?? 0;
          if (n >= BUILDING_CAP) continue;
          place(
            mesh,
            n,
            item.side * BUILD_LINE,
            0,
            -(CAMERA.back + item.ahead + item.length / 2),
            item.side < 0 ? Math.PI : 0,
          );
          used.set(item.kind, n + 1);
        }
        for (const [kind, mesh] of buildingRefs.current) {
          mesh.count = used.get(kind) ?? 0;
          mesh.instanceMatrix.needsUpdate = true;
        }

        /* ---- lamps, trees, hydrants, parked cars ------------------ */
        const props = new Map<FurnitureKind, number>();
        for (const item of street.furniture) {
          const mesh = furnitureRefs.current.get(item.kind);
          if (!mesh) continue;
          const n = props.get(item.kind) ?? 0;
          if (n >= FURNITURE_CAP[item.kind]) continue;
          place(mesh, n, item.x, 0.14, -(CAMERA.back + item.ahead), (item.side < 0 ? Math.PI : 0) + item.turn);
          props.set(item.kind, n + 1);
        }
        for (const [kind, mesh] of furnitureRefs.current) {
          mesh.count = props.get(kind) ?? 0;
          mesh.instanceMatrix.needsUpdate = true;
        }

        /* ---- crossings and the side streets they belong to -------- */
        let bar = 0;
        let mouth = 0;
        for (const junction of street.junctions) {
          for (let i = 0; i < CROSSING_BARS && bar < CROSSING_CAP; i += 1, bar += 1) {
            const at = junction.ahead + (i - (CROSSING_BARS - 1) / 2) * CROSSING_PITCH;
            if (crossings.current) place(crossings.current, bar, 0, 0.01, -(CAMERA.back + at), 0);
          }
          for (const side of [-1, 1] as const) {
            if (mouth >= SIDE_STREET_CAP || !sideStreets.current) continue;
            tmpPos.set(side * (ROAD_HALF + SIDE_STREET_LENGTH / 2), 0.06, -(CAMERA.back + junction.ahead));
            tmpQuat.identity();
            tmpScale.set(1, 1, junction.width);
            tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
            sideStreets.current.setMatrixAt(mouth, tmpMatrix);
            tmpScale.set(1, 1, 1);
            mouth += 1;
          }
        }
        if (crossings.current) {
          crossings.current.count = bar;
          crossings.current.instanceMatrix.needsUpdate = true;
        }
        if (sideStreets.current) {
          for (let i = mouth; i < SIDE_STREET_CAP; i += 1) sideStreets.current.setMatrixAt(i, HIDDEN);
          sideStreets.current.count = SIDE_STREET_CAP;
          sideStreets.current.instanceMatrix.needsUpdate = true;
        }

        /* ---- the banner the drive finishes under ------------------ */
        if (arch.current) {
          const arrival = street.arrival;
          arch.current.visible = arrival !== null;
          if (arrival) arch.current.position.set(0, 0, -(CAMERA.back + arrival.ahead));
        }
      },
    }),
    [destination, seed],
  );

  return (
    <>
      {/* the pavement each side, with the kerb face the box gives for free */}
      {[-1, 1].map((side) => (
        <mesh
          key={`pave${side}`}
          geometry={assets.pavement}
          material={assets.paving}
          position={[side * (ROAD_HALF + PAVEMENT_W / 2), 0.06, -(CAMERA.back + PAVEMENT_LENGTH / 2 - 30)]}
        />
      ))}

      <instancedMesh ref={sideStreets} args={[assets.sideStreet, assets.tarmac, SIDE_STREET_CAP]} frustumCulled={false} />
      <instancedMesh ref={crossings} args={[assets.crossing, assets.kit, CROSSING_CAP]} frustumCulled={false} />

      {assets.buildings.map((b) => (
        <instancedMesh key={b.id} ref={registerBuilding(b.id)} args={[b.geo, assets.kit, BUILDING_CAP]} frustumCulled={false} />
      ))}

      {assets.furniture.map((f) => (
        <instancedMesh
          key={f.id}
          ref={registerFurniture(f.id)}
          args={[f.geo, assets.kit, FURNITURE_CAP[f.id]]}
          frustumCulled={false}
        />
      ))}

      <mesh ref={arch} geometry={assets.arch} material={assets.kit} visible={false} />
    </>
  );
});
