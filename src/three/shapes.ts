/**
 * Flat 2D silhouettes used by the 3D layer, built from `THREE.Shape` and
 * extruded into chunky stickers. Everything is authored in a ±0.5 box centred
 * on the origin so a caller can scale a decal or an emblem to any size.
 *
 * No external assets — every curve here is the same one the SVG art uses,
 * transcribed into shape space (SVG y is down, shape y is up).
 */
import * as THREE from 'three';
import type { TruckStyle } from '@/state/store';

export type DecalId = Exclude<TruckStyle['decal'], 'none'>;

/** A closed regular star, points-up. */
export function starShape(points = 5, outer = 0.5, inner = 0.22): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = -Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

const circle = (x: number, y: number, r: number): THREE.Shape =>
  new THREE.Shape().absarc(x, y, r, 0, Math.PI * 2, false);

const ellipse = (x: number, y: number, rx: number, ry: number): THREE.Shape =>
  new THREE.Shape().absellipse(x, y, rx, ry, 0, Math.PI * 2, false, 0);

/** The friendly teardrop flame — the same bezier as `FireTruck`'s decal. */
function flameShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.5 * scale);
  s.bezierCurveTo(0.32 * scale, 0.23 * scale, 0.41 * scale, 0, 0, -0.32 * scale);
  s.bezierCurveTo(-0.41 * scale, 0, -0.32 * scale, 0.23 * scale, 0, 0.5 * scale);
  return s;
}

function boltShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.14, 0.5);
  s.lineTo(-0.34, -0.06);
  s.lineTo(-0.04, -0.06);
  s.lineTo(-0.17, -0.5);
  s.lineTo(0.34, 0.09);
  s.lineTo(0.04, 0.09);
  s.closePath();
  return s;
}

/**
 * A door decal as two colour layers: `main` behind, `accent` in front.
 * (Empty accent layers are allowed — the caller just skips that mesh.)
 */
export function decalShapes(decal: DecalId): { main: THREE.Shape[]; accent: THREE.Shape[] } {
  switch (decal) {
    case 'flame':
      return { main: [flameShape(1)], accent: [flameShape(0.5)] };
    case 'star':
      return { main: [starShape(5, 0.5, 0.22)], accent: [starShape(5, 0.26, 0.11)] };
    case 'paw':
      return {
        main: [
          ellipse(0, -0.11, 0.29, 0.24),
          circle(-0.28, 0.16, 0.125),
          circle(-0.1, 0.29, 0.125),
          circle(0.1, 0.29, 0.125),
          circle(0.28, 0.16, 0.125),
        ],
        accent: [ellipse(0, -0.13, 0.12, 0.1)],
      };
    case 'lightning':
    default:
      return { main: [boltShape()], accent: [] };
  }
}

/* ------------------------------------------------------------------ */
/* Badge shield + emblems                                              */
/* ------------------------------------------------------------------ */

/**
 * The Station Spark shield, in a 1×1.12 box centred on the origin — the same
 * silhouette as `@/ui` `BadgeArt`, so a 3D badge and a 2D badge stack.
 */
export function shieldShape(scale = 1): THREE.Shape {
  // BadgeArt's viewBox is 100×112 with the shield inset by ~9.5 units.
  const p = (x: number, y: number): [number, number] => [((x - 50) / 100) * scale, ((56 - y) / 100) * scale];
  const s = new THREE.Shape();
  s.moveTo(...p(50, 4));
  s.bezierCurveTo(...p(58, 4), ...p(78, 10), ...p(87, 13.5));
  s.bezierCurveTo(...p(89.5, 14.5), ...p(90.5, 16), ...p(90.5, 18.5));
  s.lineTo(...p(90.5, 58));
  s.bezierCurveTo(...p(90.5, 84), ...p(68, 101), ...p(51, 108));
  s.bezierCurveTo(...p(50.4, 108.3), ...p(49.6, 108.3), ...p(49, 108));
  s.bezierCurveTo(...p(32, 101), ...p(9.5, 84), ...p(9.5, 58));
  s.lineTo(...p(9.5, 18.5));
  s.bezierCurveTo(...p(9.5, 16), ...p(10.5, 14.5), ...p(13, 13.5));
  s.bezierCurveTo(...p(22, 10), ...p(42, 4), ...p(50, 4));
  s.closePath();
  return s;
}

export type Badge3DIcon =
  | 'flame'
  | 'star'
  | 'chef-hat'
  | 'ladder'
  | 'hose'
  | 'book'
  | 'map'
  | 'heart'
  | 'cat'
  | 'pizza'
  | 'clock'
  | 'numbers';

export const badge3DIcons: readonly Badge3DIcon[] = [
  'flame',
  'star',
  'chef-hat',
  'ladder',
  'hose',
  'book',
  'map',
  'heart',
  'cat',
  'pizza',
  'clock',
  'numbers',
];

const roundedRect = (x: number, y: number, w: number, h: number, r: number): THREE.Shape => {
  const s = new THREE.Shape();
  const rr = Math.min(r, w / 2, h / 2);
  s.moveTo(x - w / 2 + rr, y - h / 2);
  s.lineTo(x + w / 2 - rr, y - h / 2);
  s.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + rr);
  s.lineTo(x + w / 2, y + h / 2 - rr);
  s.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - rr, y + h / 2);
  s.lineTo(x - w / 2 + rr, y + h / 2);
  s.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - rr);
  s.lineTo(x - w / 2, y - h / 2 + rr);
  s.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + rr, y - h / 2);
  s.closePath();
  return s;
};

const ring = (x: number, y: number, outer: number, inner: number): THREE.Shape => {
  const s = circle(x, y, outer);
  s.holes.push(new THREE.Path().absarc(x, y, inner, 0, Math.PI * 2, true));
  return s;
};

const triangle = (x: number, y: number, w: number, h: number): THREE.Shape => {
  const s = new THREE.Shape();
  s.moveTo(x, y + h / 2);
  s.lineTo(x + w / 2, y - h / 2);
  s.lineTo(x - w / 2, y - h / 2);
  s.closePath();
  return s;
};

/** The emblem on a badge face, in a ±0.5 box. One extrude, many shapes. */
export function emblemShapes(icon: Badge3DIcon): THREE.Shape[] {
  switch (icon) {
    case 'flame':
      return [flameShape(0.95)];
    case 'star':
      return [starShape(5, 0.5, 0.22)];
    case 'chef-hat':
      return [
        circle(-0.19, 0.15, 0.17),
        circle(0.19, 0.15, 0.17),
        circle(0, 0.25, 0.21),
        roundedRect(0, -0.19, 0.44, 0.32, 0.08),
      ];
    case 'ladder':
      return [
        roundedRect(-0.26, 0, 0.12, 0.86, 0.06),
        roundedRect(0.26, 0, 0.12, 0.86, 0.06),
        roundedRect(0, 0.26, 0.5, 0.1, 0.05),
        roundedRect(0, 0, 0.5, 0.1, 0.05),
        roundedRect(0, -0.26, 0.5, 0.1, 0.05),
      ];
    case 'hose':
      return [ring(0.03, 0.04, 0.36, 0.24), ring(0.03, 0.04, 0.14, 0.05), circle(-0.34, -0.36, 0.11)];
    case 'book':
      return [
        roundedRect(-0.22, 0, 0.38, 0.62, 0.06),
        roundedRect(0.22, 0, 0.38, 0.62, 0.06),
        roundedRect(0, 0, 0.06, 0.66, 0.03),
      ];
    case 'map':
      return [
        roundedRect(-0.3, 0, 0.26, 0.66, 0.05),
        roundedRect(0, 0.02, 0.26, 0.66, 0.05),
        roundedRect(0.3, 0, 0.26, 0.66, 0.05),
      ];
    case 'heart': {
      const s = new THREE.Shape();
      s.moveTo(0, -0.42);
      s.bezierCurveTo(-0.56, -0.02, -0.42, 0.44, -0.16, 0.44);
      s.bezierCurveTo(-0.05, 0.44, 0, 0.34, 0, 0.26);
      s.bezierCurveTo(0, 0.34, 0.05, 0.44, 0.16, 0.44);
      s.bezierCurveTo(0.42, 0.44, 0.56, -0.02, 0, -0.42);
      s.closePath();
      return [s];
    }
    case 'cat':
      return [
        triangle(-0.26, 0.3, 0.26, 0.28),
        triangle(0.26, 0.3, 0.26, 0.28),
        circle(0, 0, 0.4),
        roundedRect(-0.5, -0.06, 0.2, 0.05, 0.025),
        roundedRect(0.5, -0.06, 0.2, 0.05, 0.025),
      ];
    case 'pizza': {
      const s = new THREE.Shape();
      s.moveTo(0, 0.5);
      s.lineTo(0.44, -0.42);
      s.quadraticCurveTo(0, -0.56, -0.44, -0.42);
      s.closePath();
      return [s];
    }
    case 'clock':
      return [ring(0, 0, 0.44, 0.33), roundedRect(0, 0.1, 0.07, 0.34, 0.035), roundedRect(0.1, -0.06, 0.26, 0.07, 0.035)];
    case 'numbers':
    default:
      return [
        roundedRect(-0.24, 0.24, 0.42, 0.1, 0.05),
        roundedRect(-0.24, 0.24, 0.1, 0.42, 0.05),
        roundedRect(0.26, 0.24, 0.42, 0.1, 0.05),
        roundedRect(0.26, -0.26, 0.42, 0.1, 0.05),
        roundedRect(-0.24, -0.26, 0.42, 0.1, 0.05),
      ];
  }
}
