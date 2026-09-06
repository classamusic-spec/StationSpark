/**
 * THE TRUCK RUN GEOMETRY KIT.
 *
 * Every solid on the Truck Run road — a bakery, a street lamp, a traffic cone,
 * a gate — is built here as **one merged, vertex-coloured `BufferGeometry`**.
 *
 * That is the whole performance story of the neighbourhood. Spark City is made
 * of chunky little shapes: a shop is a box, a plinth, a gable, an awning, six
 * window panes, a door and a sign — nine meshes if you draw it the obvious way,
 * and a street of nine shops is eighty draw calls before the truck has even
 * arrived. Merging the parts of one building into a single geometry with the
 * colours baked into the vertices turns that shop into **one** geometry, and one
 * `InstancedMesh` per building type then draws every bakery in view in a single
 * call (`docs/THREE.md`: prefer instancing and reuse).
 *
 * Sizes and colours are never invented here: they come from
 * `minigames/tactile/TruckRun/neighbourhood.ts`, which the 2D road reads too, so
 * the two towns are the same town.
 */
import * as THREE from 'three';
import { palette } from '@/theme';
import {
  BUILDINGS,
  CROSSING_BAR_W,
  GARDEN_LENGTH,
  type BuildingId,
  type BuildingSpec,
  type FurnitureKind,
} from '@/minigames/tactile/TruckRun/neighbourhood';
import { ROAD_HALF } from '@/minigames/tactile/TruckRun/projection';

/** The one glass tone the whole town glazes its windows with (matches `TownMap`). */
const GLASS = '#3A5FA8';
const BRICK = '#C9755A';

export interface KitPart {
  geo: THREE.BufferGeometry;
  color: string;
  /** centre of the part, in the object's own units */
  at?: [number, number, number];
  rot?: [number, number, number];
}

/* ------------------------------------------------------------------ */
/* The merge                                                            */
/* ------------------------------------------------------------------ */

/**
 * Fold a pile of coloured primitives into one geometry.
 *
 * Colours are written per vertex, so the whole thing draws with a single
 * shared material. Every input geometry is consumed: the caller builds throwaway
 * boxes and cones and this owns their disposal, which keeps the callers below
 * readable — they are meant to look like a drawing, not like memory management.
 */
export function mergeParts(parts: KitPart[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const matrix = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const quat = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  const color = new THREE.Color();

  for (const part of parts) {
    const flat = part.geo.index ? part.geo.toNonIndexed() : part.geo;
    const [x, y, z] = part.at ?? [0, 0, 0];
    const [rx, ry, rz] = part.rot ?? [0, 0, 0];
    euler.set(rx, ry, rz);
    quat.setFromEuler(euler);
    pos.set(x, y, z);
    matrix.compose(pos, quat, one);

    const geo = flat.clone();
    geo.applyMatrix4(matrix);
    const p = geo.getAttribute('position');
    const n = geo.getAttribute('normal');
    color.set(part.color);
    for (let i = 0; i < p.count; i += 1) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      normals.push(n ? n.getX(i) : 0, n ? n.getY(i) : 1, n ? n.getZ(i) : 0);
      colors.push(color.r, color.g, color.b);
    }
    geo.dispose();
    if (flat !== part.geo) flat.dispose();
    part.geo.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  out.computeBoundingSphere();
  return out;
}

/** The one material every merged solid shares — flat, matte, brand-coloured. */
export const kitMaterial = (): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0 });

/* ------------------------------------------------------------------ */
/* Primitives                                                           */
/* ------------------------------------------------------------------ */

const box = (w: number, h: number, d: number): THREE.BoxGeometry => new THREE.BoxGeometry(w, h, d);

const cyl = (r: number, h: number, seg = 10): THREE.CylinderGeometry => new THREE.CylinderGeometry(r, r, h, seg);

/** A square-based pyramid, `w` × `d` at the foot and `h` tall. */
function pyramid(w: number, h: number, d: number): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(0.5, h, 4, 1);
  g.rotateY(Math.PI / 4);
  /* a 4-sided cone of radius 0.5 has a base square 0.707 across */
  g.scale(w * Math.SQRT2, 1, d * Math.SQRT2);
  return g;
}

/**
 * A gable roof, ridge running **away from the road** so the triangle faces the
 * street exactly as every pitched roof does on the town map.
 * `w` is the frontage, `h` the rise, `d` how far back it reaches.
 */
function gable(w: number, h: number, d: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, h);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -d / 2);
  /* shape-x becomes world-z (along the road), the extrusion becomes world-x */
  g.rotateY(Math.PI / 2);
  g.translate(d / 2, 0, 0);
  return g;
}

/* ------------------------------------------------------------------ */
/* Buildings                                                            */
/* ------------------------------------------------------------------ */

/*
 * Author space for a building:
 *   x = 0 is the wall facing the road, +x reaches away from it
 *   y = 0 is the pavement
 *   z runs along the road, centred on the plot
 *
 * The instance is placed at ±BUILD_LINE and spun a half turn for the left-hand
 * side, so the road-facing wall — the only one that carries detail — is always
 * the one the child sees.
 */

/** Mullioned windows up the front wall, in the town's own frame-and-glass style. */
function windows(spec: BuildingSpec, parts: KitPart[]): void {
  const columns = Math.max(2, Math.round(spec.frontage / 3.4));
  const ground = spec.awning ? 1 : 0;
  const wide = spec.frontage / columns;
  const w = Math.min(1.5, wide * 0.5);
  const h = Math.min(1.35, spec.height / (spec.storeys + 1.1));
  for (let row = ground; row < spec.storeys; row += 1) {
    const y = spec.height * ((row + 0.62) / (spec.storeys + 0.25));
    for (let col = 0; col < columns; col += 1) {
      const z = (col - (columns - 1) / 2) * wide;
      parts.push({ geo: box(0.16, h + 0.3, w + 0.3), color: palette.creamDeep, at: [-0.02, y, z] });
      parts.push({ geo: box(0.14, h, w), color: GLASS, at: [-0.1, y, z] });
      parts.push({ geo: box(0.1, 0.09, w), color: palette.white, at: [-0.14, y, z] });
    }
  }
}

/** A striped shop awning and a lit shop window — what makes a shop a shop. */
function shopFront(spec: BuildingSpec, parts: KitPart[]): void {
  const w = spec.frontage * 0.62;
  parts.push({ geo: box(0.2, 1.5, w), color: palette.creamDeep, at: [-0.04, 1.1, -spec.frontage * 0.16] });
  parts.push({ geo: box(0.16, 1.24, w - 0.26), color: GLASS, at: [-0.12, 1.1, -spec.frontage * 0.16] });
  /* the awning: four bands, the shop's colour and white, as on the map */
  const bands = 4;
  for (let i = 0; i < bands; i += 1) {
    const bw = w / bands;
    parts.push({
      geo: box(1.05, 0.22, bw * 0.96),
      color: i % 2 === 0 ? spec.trim : palette.white,
      at: [-0.5, 2.15, -spec.frontage * 0.16 + (i - (bands - 1) / 2) * bw],
      rot: [0, 0, 0.22],
    });
  }
  /* the door, always to one side so the window can be the shop's face */
  parts.push({ geo: box(0.18, 2.1, 1.15), color: '#8E5A26', at: [-0.05, 1.05, spec.frontage * 0.3] });
  parts.push({ geo: box(0.14, 0.8, 0.85), color: GLASS, at: [-0.12, 1.55, spec.frontage * 0.3] });
}

/** The single motif that says which shop this is at forty kilometres an hour. */
function signage(spec: BuildingSpec, parts: KitPart[]): void {
  const y = spec.height + (spec.roof === 'gable' ? spec.roofHeight * 0.42 : -0.5);
  switch (spec.sign) {
    case 'loaf':
      parts.push({ geo: new THREE.SphereGeometry(0.86, 10, 6), color: '#F0BC63', at: [-0.2, y, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: box(0.16, 0.2, 1.5), color: '#B87A28', at: [-0.5, y + 0.35, 0] });
      break;
    case 'pizza':
      parts.push({ geo: cyl(0.86, 0.16, 14), color: palette.white, at: [-0.16, y, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: cyl(0.62, 0.2, 14), color: '#F3C463', at: [-0.24, y, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: cyl(0.2, 0.24, 8), color: '#E8523F', at: [-0.3, y + 0.24, 0.2], rot: [0, 0, Math.PI / 2] });
      break;
    case 'paw':
      parts.push({ geo: cyl(0.8, 0.16, 14), color: palette.white, at: [-0.16, y, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: cyl(0.32, 0.2, 8), color: palette.navy, at: [-0.24, y - 0.12, 0], rot: [0, 0, Math.PI / 2] });
      for (const dz of [-0.42, -0.14, 0.14, 0.42]) {
        parts.push({ geo: cyl(0.13, 0.2, 6), color: palette.navy, at: [-0.24, y + 0.34, dz], rot: [0, 0, Math.PI / 2] });
      }
      break;
    case 'clock': {
      const cy = spec.height * 0.74;
      parts.push({ geo: cyl(1.32, 0.2, 18), color: '#DCC79F', at: [-0.14, cy, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: cyl(1.12, 0.22, 18), color: palette.white, at: [-0.22, cy, 0], rot: [0, 0, Math.PI / 2] });
      parts.push({ geo: box(0.12, 0.72, 0.14), color: palette.navy, at: [-0.3, cy + 0.34, 0] });
      parts.push({ geo: box(0.12, 0.14, 0.56), color: palette.navy, at: [-0.3, cy, 0.24] });
      break;
    }
    case 'books':
      /* a pediment on two columns — the library's own face */
      parts.push({ geo: box(1.5, 0.5, spec.frontage * 0.7), color: palette.cream, at: [-0.6, spec.height + 0.3, 0] });
      for (const dz of [-spec.frontage * 0.22, 0, spec.frontage * 0.22]) {
        parts.push({ geo: cyl(0.34, spec.height - 0.4, 10), color: palette.cream, at: [-0.7, (spec.height - 0.4) / 2, dz] });
      }
      parts.push({ geo: box(0.18, 0.72, spec.frontage * 0.5), color: spec.trim, at: [-0.1, spec.height - 0.9, 0] });
      break;
    case 'stall': {
      /* the market's canopy on two poles, with crates underneath */
      const bands = 5;
      for (let i = 0; i < bands; i += 1) {
        const bw = (spec.frontage * 0.9) / bands;
        parts.push({
          geo: box(2.2, 0.24, bw * 0.94),
          color: i % 2 === 0 ? spec.trim : palette.white,
          at: [-1, spec.height + 0.6, (i - (bands - 1) / 2) * bw],
          rot: [0, 0, 0.12],
        });
      }
      for (const dz of [-spec.frontage * 0.36, spec.frontage * 0.36]) {
        parts.push({ geo: cyl(0.14, spec.height + 0.6, 8), color: palette.wood, at: [-1.9, (spec.height + 0.6) / 2, dz] });
      }
      for (let i = 0; i < 3; i += 1) {
        parts.push({ geo: box(0.9, 0.7, 0.9), color: palette.wood, at: [-1.2, 0.35 + (i % 2) * 0.72, -2.6 + i * 2.4] });
      }
      break;
    }
    case 'bell':
      parts.push({ geo: box(2, 1.5, 2), color: palette.creamDeep, at: [spec.depth * 0.5, spec.height + spec.roofHeight, 0] });
      parts.push({ geo: pyramid(2.6, 1.2, 2.6), color: spec.roofDark, at: [spec.depth * 0.5, spec.height + spec.roofHeight + 1.3, 0] });
      parts.push({ geo: new THREE.SphereGeometry(0.5, 8, 6), color: palette.safetyYellow, at: [spec.depth * 0.5 - 0.9, spec.height + spec.roofHeight + 0.7, 0] });
      break;
    case 'helmet':
      /* the station's own sign board, and the red engine-bay doors */
      parts.push({ geo: box(0.22, 1.1, spec.frontage * 0.72), color: palette.cream, at: [-0.1, spec.height - 0.9, 0] });
      parts.push({ geo: box(0.24, 3.4, spec.frontage * 0.3), color: palette.creamDeep, at: [-0.08, 1.7, -spec.frontage * 0.24] });
      parts.push({ geo: box(0.24, 3.4, spec.frontage * 0.3), color: palette.creamDeep, at: [-0.08, 1.7, spec.frontage * 0.24] });
      parts.push({ geo: box(0.5, 0.5, 0.5), color: palette.safetyYellow, at: [-0.4, spec.height + 1.1, 0] });
      break;
    default:
      break;
  }
}

/** One whole building, merged into a single geometry. */
export function buildingGeometry(id: BuildingId): THREE.BufferGeometry {
  const spec = BUILDINGS[id];
  const parts: KitPart[] = [];
  const { depth, frontage, height } = spec;

  /* body, plinth and the shaded flank that gives it a corner */
  parts.push({ geo: box(depth, height, frontage), color: spec.wall, at: [depth / 2, height / 2, 0] });
  parts.push({ geo: box(depth + 0.24, 0.42, frontage + 0.24), color: spec.wallShade, at: [depth / 2, 0.21, 0] });
  parts.push({ geo: box(0.2, height, frontage + 0.2), color: spec.wallLight, at: [-0.02, height / 2, 0] });

  switch (spec.roof) {
    case 'gable':
      parts.push({ geo: gable(frontage + 0.7, spec.roofHeight, depth + 0.5), color: spec.roofColor, at: [-0.25, height, 0] });
      parts.push({ geo: box(depth + 0.7, 0.32, frontage + 0.9), color: spec.roofDark, at: [depth / 2, height + 0.05, 0] });
      break;
    case 'hip':
      parts.push({ geo: pyramid(depth + 0.6, spec.roofHeight, frontage + 0.7), color: spec.roofColor, at: [depth / 2, height + spec.roofHeight / 2, 0] });
      parts.push({ geo: box(depth + 0.8, 0.34, frontage + 0.9), color: spec.roofDark, at: [depth / 2, height + 0.06, 0] });
      break;
    case 'pyramid':
      parts.push({ geo: pyramid(depth + 1.4, spec.roofHeight, frontage + 1.4), color: spec.roofColor, at: [depth / 2, height + spec.roofHeight / 2, 0] });
      parts.push({ geo: box(depth + 1.6, 0.4, frontage + 1.6), color: spec.roofDark, at: [depth / 2, height + 0.1, 0] });
      break;
    default:
      parts.push({ geo: box(depth + 0.5, spec.roofHeight, frontage + 0.5), color: spec.roofColor, at: [depth / 2, height + spec.roofHeight / 2, 0] });
      parts.push({ geo: box(depth + 0.7, 0.3, frontage + 0.7), color: spec.roofDark, at: [depth / 2, height + 0.05, 0] });
      break;
  }

  windows(spec, parts);
  if (spec.awning) shopFront(spec, parts);
  else if (spec.storeys < 3) {
    parts.push({ geo: box(0.2, 2, 1.15), color: '#8E5A26', at: [-0.05, 1, frontage * 0.26] });
    parts.push({ geo: box(0.16, 0.62, 0.82), color: GLASS, at: [-0.12, 1.5, frontage * 0.26] });
  }
  signage(spec, parts);
  if (spec.chimney) {
    parts.push({ geo: box(0.85, 1.7, 0.85), color: BRICK, at: [depth * 0.66, height + spec.roofHeight * 0.55, frontage * 0.22] });
  }
  /* the navy contact shadow every object in this world stands on */
  parts.push({ geo: box(depth + 1, 0.05, frontage + 1), color: '#5A6288', at: [depth / 2, 0.02, 0] });

  return mergeParts(parts);
}

/* ------------------------------------------------------------------ */
/* Street furniture                                                     */
/* ------------------------------------------------------------------ */

/*
 * Furniture is authored the same way round as a building — the road is at −x —
 * so the same half turn puts it on the other pavement.
 */

const furniture: Record<FurnitureKind, () => THREE.BufferGeometry> = {
  lamp: () =>
    mergeParts([
      { geo: cyl(0.28, 0.24, 10), color: palette.charcoal, at: [0, 0.12, 0] },
      { geo: cyl(0.13, 4.4, 8), color: palette.slate, at: [0, 2.2, 0] },
      { geo: box(1.5, 0.16, 0.16), color: palette.slate, at: [-0.7, 4.35, 0] },
      { geo: box(0.62, 0.3, 0.42), color: palette.slateLight, at: [-1.4, 4.2, 0] },
      { geo: box(0.5, 0.16, 0.32), color: palette.safetyYellow, at: [-1.4, 4.02, 0] },
    ]),
  hydrant: () =>
    mergeParts([
      { geo: cyl(0.42, 0.14, 10), color: palette.slateLight, at: [0, 0.07, 0] },
      { geo: cyl(0.27, 0.9, 10), color: palette.engineRed, at: [0, 0.5, 0] },
      { geo: new THREE.SphereGeometry(0.28, 10, 7), color: palette.engineRedLight, at: [0, 0.98, 0] },
      { geo: cyl(0.14, 0.7, 8), color: palette.engineRedDark, at: [0, 0.66, 0], rot: [0, 0, Math.PI / 2] },
    ]),
  /* round and blobby, like every tree on the town map — never a conifer */
  tree: () =>
    mergeParts([
      { geo: cyl(0.24, 1.7, 7), color: palette.woodDark, at: [0, 0.85, 0] },
      { geo: new THREE.SphereGeometry(1.45, 9, 6), color: palette.leafGreen, at: [0, 2.5, 0] },
      { geo: new THREE.SphereGeometry(1, 8, 6), color: palette.grassDark, at: [-0.5, 3.3, 0.3] },
    ]),
  bench: () =>
    mergeParts([
      { geo: box(0.7, 0.16, 2.2), color: palette.wood, at: [0, 0.55, 0] },
      { geo: box(0.16, 0.7, 2.2), color: palette.woodDark, at: [0.32, 0.86, 0] },
      { geo: box(0.14, 0.55, 0.14), color: palette.slate, at: [0, 0.27, -0.85] },
      { geo: box(0.14, 0.55, 0.14), color: palette.slate, at: [0, 0.27, 0.85] },
    ]),
  planter: () =>
    mergeParts([
      { geo: box(1, 0.7, 1), color: palette.creamDeep, at: [0, 0.35, 0] },
      { geo: new THREE.SphereGeometry(0.66, 9, 6), color: palette.leafGreen, at: [0, 0.95, 0] },
      { geo: new THREE.SphereGeometry(0.4, 8, 6), color: palette.grassDark, at: [0.3, 1.15, 0.2] },
    ]),
  /* the clipped hedge along a front garden — it closes the gap between two
     plots so the street reads as a street and not as a row of loose boxes */
  hedge: () =>
    mergeParts([
      { geo: box(1.2, 1.25, GARDEN_LENGTH), color: palette.leafGreenDark, at: [-0.6, 0.62, 0] },
      { geo: box(1.32, 0.3, GARDEN_LENGTH + 0.1), color: palette.leafGreen, at: [-0.6, 1.2, 0] },
      { geo: box(0.35, 0.55, GARDEN_LENGTH + 0.3), color: palette.grass, at: [-1.15, 0.28, 0] },
    ]),
  postbox: () =>
    mergeParts([
      { geo: cyl(0.34, 1.5, 10), color: palette.engineRed, at: [0, 0.75, 0] },
      { geo: new THREE.SphereGeometry(0.36, 10, 6), color: palette.engineRedDark, at: [0, 1.5, 0] },
      { geo: box(0.12, 0.16, 0.5), color: palette.charcoalDark, at: [-0.3, 1.2, 0] },
    ]),
  car: () => parkedCar('#3E8FE0', '#25649F'),
  van: () => parkedCar(palette.cream, palette.creamDeep, true),
};

/** A car at the kerb — nose down the road, never in a lane the truck can use. */
function parkedCar(body: string, dark: string, tall = false): THREE.BufferGeometry {
  const h = tall ? 1.7 : 1.05;
  /* 1.75 across and parked 1.55 out from the kerb: a clear road unit of white
     tarmac between it and the outside driving lane, so it can never read as a
     hazard the child has to dodge */
  return mergeParts([
    { geo: box(1.75, h, 4.3), color: body, at: [0, h / 2 + 0.32, 0] },
    { geo: box(1.5, tall ? 0.7 : 0.85, tall ? 2 : 2.1), color: dark, at: [0, h + 0.72, tall ? -0.9 : -0.15] },
    { geo: box(1.38, tall ? 0.42 : 0.5, tall ? 1.7 : 1.8), color: palette.navy, at: [0, h + 0.78, tall ? -0.9 : -0.15] },
    { geo: box(1.8, 0.22, 0.6), color: palette.slateLight, at: [0, 0.68, 2.1] },
    { geo: box(1.8, 0.22, 0.6), color: palette.slateLight, at: [0, 0.68, -2.1] },
    { geo: cyl(0.42, 0.3, 10), color: palette.charcoalDark, at: [0.78, 0.42, 1.35], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.42, 0.3, 10), color: palette.charcoalDark, at: [-0.78, 0.42, 1.35], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.42, 0.3, 10), color: palette.charcoalDark, at: [0.78, 0.42, -1.35], rot: [0, 0, Math.PI / 2] },
    { geo: cyl(0.42, 0.3, 10), color: palette.charcoalDark, at: [-0.78, 0.42, -1.35], rot: [0, 0, Math.PI / 2] },
  ]);
}

export const furnitureGeometry = (kind: FurnitureKind): THREE.BufferGeometry => furniture[kind]();

/* ------------------------------------------------------------------ */
/* Road furniture and the hazards                                       */
/* ------------------------------------------------------------------ */

/** One white bar of a zebra crossing, painted flat on the tarmac. */
export const crossingBarGeometry = (): THREE.BufferGeometry =>
  mergeParts([{ geo: box(ROAD_HALF * 2 - 0.9, 0.05, CROSSING_BAR_W), color: palette.cream, at: [0, 0.025, 0] }]);

/** The banner the drive finishes under: two posts and a red gantry. */
export function arrivalArchGeometry(): THREE.BufferGeometry {
  const span = ROAD_HALF * 2 + 1.6;
  const parts: KitPart[] = [
    { geo: cyl(0.24, 6, 8), color: palette.slate, at: [-span / 2, 3, 0] },
    { geo: cyl(0.24, 6, 8), color: palette.slate, at: [span / 2, 3, 0] },
    { geo: box(span, 1.5, 0.4), color: palette.engineRed, at: [0, 5.4, 0] },
    { geo: box(span, 0.3, 0.5), color: palette.safetyYellow, at: [0, 4.6, 0] },
  ];
  for (let i = 0; i < 5; i += 1) {
    parts.push({ geo: box(1.1, 0.9, 0.5), color: palette.white, at: [(i - 2) * 2.3, 5.4, -0.04], rot: [0, 0, Math.PI / 4] });
  }
  return mergeParts(parts);
}

/** Every prop that stands on the tarmac, each one merged into a single mesh. */
export function propGeometries(): Record<string, THREE.BufferGeometry> {
  return {
    pothole: mergeParts([
      { geo: new THREE.CylinderGeometry(1, 0.85, 0.14, 16), color: palette.charcoalDark, at: [0, 0.03, 0] },
      { geo: new THREE.CylinderGeometry(0.72, 0.6, 0.16, 14), color: palette.charcoal, at: [0, 0.02, 0] },
    ]),
    puddle: mergeParts([
      { geo: new THREE.CylinderGeometry(1.2, 1.2, 0.06, 18), color: palette.waterCyanDark, at: [0, 0.03, 0] },
      { geo: new THREE.CylinderGeometry(0.9, 0.9, 0.08, 16), color: palette.waterCyanLight, at: [0, 0.05, 0] },
    ]),
    cone: mergeParts([
      { geo: box(1.1, 0.16, 1.1), color: palette.orangeDark, at: [0, 0.08, 0] },
      { geo: new THREE.ConeGeometry(0.46, 1.3, 12), color: palette.orange, at: [0, 0.78, 0] },
      { geo: new THREE.ConeGeometry(0.34, 0.24, 12), color: palette.white, at: [0, 0.92, 0] },
    ]),
    hose: mergeParts([
      { geo: new THREE.TorusGeometry(0.85, 0.24, 8, 18), color: palette.safetyYellow, at: [0, 0.24, 0], rot: [Math.PI / 2, 0, 0] },
      { geo: new THREE.TorusGeometry(0.5, 0.2, 8, 14), color: palette.gold, at: [0, 0.42, 0], rot: [Math.PI / 2, 0, 0] },
    ]),
    car: mergeParts([
      { geo: box(1.8, 1.5, 3.4), color: palette.waterCyanDark, at: [0, 0.78, 0] },
      { geo: box(1.5, 0.62, 1.8), color: palette.navy, at: [0, 1.66, -0.2] },
      { geo: box(1.9, 0.22, 0.6), color: palette.slateLight, at: [0, 0.5, 1.7] },
    ]),
    ramp: mergeParts([
      { geo: rampWedge(), color: palette.safetyYellow },
      { geo: box(2.6, 0.18, 0.4), color: palette.goldDark, at: [0, 0.09, 1.25] },
    ]),
    boost: mergeParts([
      { geo: box(2.2, 0.08, 2.6), color: palette.waterCyan, at: [0, 0.04, 0] },
      { geo: box(1.4, 0.12, 0.42), color: palette.white, at: [0, 0.1, -0.5] },
      { geo: box(1.4, 0.12, 0.42), color: palette.white, at: [0, 0.1, 0.4] },
    ]),
  };
}

/** The wedge a ramp is: 2.5 wide, 1.15 tall, rising away from the truck. */
function rampWedge(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const w = 1.25;
  const verts = new Float32Array([
    -w, 0, 1.3, w, 0, 1.3, w, 1.15, -1.3, -w, 0, 1.3, w, 1.15, -1.3, -w, 1.15, -1.3,
    -w, 0, 1.3, -w, 1.15, -1.3, -w, 0, -1.3,
    w, 0, 1.3, w, 0, -1.3, w, 1.15, -1.3,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

/** A gate: two posts and the board the answer is lettered on, as one mesh. */
export function gateGeometry(bannerTop: number, bannerBottom: number, assist: boolean): THREE.BufferGeometry {
  const boardY = (bannerTop + bannerBottom) / 2;
  const parts: KitPart[] = [
    { geo: cyl(0.11, bannerTop, 8), color: palette.slate, at: [-1.25, bannerTop / 2, 0] },
    { geo: cyl(0.11, bannerTop, 8), color: palette.slate, at: [1.25, bannerTop / 2, 0] },
  ];
  if (assist) {
    parts.push({ geo: box(2.7, bannerTop - bannerBottom + 0.34, 0.1), color: palette.safetyYellow, at: [0, boardY, 0.06] });
  }
  parts.push({ geo: box(2.35, bannerTop - bannerBottom, 0.14), color: palette.white, at: [0, boardY, 0] });
  parts.push({ geo: box(2.35, 0.22, 0.16), color: palette.waterCyanLight, at: [0, bannerTop - 0.11, 0] });
  return mergeParts(parts);
}
