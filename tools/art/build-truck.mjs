#!/usr/bin/env node
/**
 * SVG ART/FIRE_TRUCK.svg  →  src/world/art/fireTruckArt.ts
 *
 * The authored engine is the shipped drawing. Every `d` is copied out verbatim
 * and every `<circle>`/`<ellipse>` stays a circle/ellipse, because rewriting one
 * as arcs shifts its antialiased edge by a fraction of a pixel and "identical"
 * here means identical (see tools/art/build-characters.mjs, which learned this
 * the hard way on Captain Bea's buttons).
 *
 * The only thing this adds is *meaning*. The drawing is one flat side view, but
 * the truck in the app is the child's: it changes colour in the Garage, wears a
 * decal they chose, flashes the light bar they picked, and spins its wheels when
 * it drives. So each shape is filed under a role, by index, and the renderer
 * re-tints and animates by role rather than by hunting for a hex value.
 *
 *   npm run art:build:truck     regenerate
 *   npm run art:verify:truck    prove the render still matches the SVG
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'SVG ART/FIRE_TRUCK.svg';
const OUT = 'src/world/art/fireTruckArt.ts';

/* ------------------------------------------------------------------ *
 * Which shape is what.
 *
 * Indices are document order, taken from the file's own getBBox output —
 * see the header comment in `src/world/art/fireTruckArt.ts` for the map.
 * If the SVG is re-exported with shapes added or reordered, these move, and
 * the build fails loudly below rather than silently mis-filing a wheel.
 * ------------------------------------------------------------------ */
const ROLES = {
  /** the back wheel: tyre, hub, centre cap, seven bolts */
  wheelRear: [35, 36, 49, 50, 51, 52, 53, 54, 55, 56],
  /** the front wheel, same parts */
  wheelFront: [37, 38, 57, 58, 59, 60, 61, 62, 63, 64],
  /** the dark plinth the beacon sits on — never tinted */
  beaconBase: [22, 23],
  /** the dome itself: this is what the child's `lights` choice colours */
  beaconDome: [24, 25, 26, 48],
  /** the badge on the door: the cream disc, the ring drawn over it, the glyph */
  decalDisc: [14],
  decalRing: [15],
  decalGlyph: [16, 17],
};

/** Wheel centres and radii, measured from the art (not guessed). */
const WHEELS = {
  wheelRear: { cx: 36.75, cy: 63.8, r: 15 },
  wheelFront: { cx: 121.4, cy: 63.75, r: 15 },
};

/**
 * Body classes that follow the child's paint. Everything else in the body —
 * the gold stripe, the chrome ladder, the glass, the bumper — keeps the colour
 * the artist chose, because those parts are not the paintwork.
 */
const PAINT = { 'cls-0': 'deep', 'cls-1': 'face', 'cls-2': 'shade' };

/* ------------------------------------------------------------------ */

function parseStyles(svg) {
  const block = /<style[^>]*>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? '';
  const out = {};
  for (const m of block.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
    const decls = {};
    for (const d of m[2].split(';')) {
      const [k, v] = d.split(':').map((s) => s && s.trim());
      if (k && v) decls[k] = v;
    }
    out[m[1]] = decls;
  }
  return out;
}

const num = (s) => Number(s);

const pointsToPath = (points, close) => {
  const n = points.trim().split(/[\s,]+/).map(num);
  let d = '';
  for (let i = 0; i < n.length; i += 2) d += `${i ? 'L' : 'M'}${n[i]} ${n[i + 1]}`;
  /* A <polygon> closes; a <polyline> does not. It makes no difference to a
     plain fill, but it would to a stroked one, so keep the distinction. */
  return close ? `${d}z` : d;
};

/** Every drawable element, in document order. */
function parseShapes(svg) {
  const styles = parseStyles(svg);
  const shapes = [];
  for (const m of svg.matchAll(/<(path|circle|ellipse|polygon|polyline)\b([^>]*?)\/?>/g)) {
    const [, tag, attrs] = m;
    const at = (name) => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    const cls = at('class') ?? '';
    const style = styles[cls] ?? {};

    let shape;
    if (tag === 'circle') {
      shape = { circle: { cx: num(at('cx')), cy: num(at('cy')), r: num(at('r')) } };
    } else if (tag === 'ellipse') {
      shape = { ellipse: { cx: num(at('cx')), cy: num(at('cy')), rx: num(at('rx')), ry: num(at('ry')) } };
    } else {
      const d = tag === 'path' ? at('d') : pointsToPath(at('points'), tag === 'polygon');
      if (!d) continue;
      shape = { d };
    }
    shape.cls = cls;
    if (style.fill && style.fill !== 'none') shape.fill = style.fill;
    if (style.stroke) {
      shape.stroke = style.stroke;
      shape.strokeWidth = Number(style['stroke-width'] ?? 1);
      if (style['stroke-linecap']) shape.strokeLinecap = style['stroke-linecap'];
    }
    shapes.push(shape);
  }
  /*
   * Nothing may be dropped on the floor. The first cut of this parser handled
   * path/circle/ellipse/polygon and silently skipped the file's one <polyline>
   * — the pale highlight along the top of the gold stripe — and because the
   * "every shape is claimed" check below only sees shapes the parser produced,
   * it could not notice. So count the drawable tags in the raw file instead.
   */
  const drawable = [...svg.matchAll(/<(path|circle|ellipse|polygon|polyline|rect|line)\b/g)].length;
  if (drawable !== shapes.length) {
    throw new Error(`the art has ${drawable} drawable elements but only ${shapes.length} were parsed — an element type is unsupported`);
  }
  return shapes;
}

const viewBoxOf = (svg) => {
  const [, , w, h] = /viewBox="([^"]*)"/.exec(svg)[1].split(/\s+/).map(num);
  return { w, h };
};

/* ------------------------------------------------------------------ */

const svg = fs.readFileSync(SRC, 'utf8');
const shapes = parseShapes(svg);
const vb = viewBoxOf(svg);

/* Every shape must be claimed exactly once — by a role, or by the body. */
const claimed = new Map();
for (const [role, idx] of Object.entries(ROLES)) {
  for (const i of idx) {
    if (i >= shapes.length) throw new Error(`${role} claims shape ${i}, but the art only has ${shapes.length}`);
    if (claimed.has(i)) throw new Error(`shape ${i} claimed by both ${claimed.get(i)} and ${role}`);
    claimed.set(i, role);
  }
}

const groups = Object.fromEntries(Object.keys(ROLES).map((r) => [r, []]));
const body = [];
shapes.forEach((s, i) => {
  const role = claimed.get(i);
  const out = { ...s };
  const paint = PAINT[s.cls];
  delete out.cls;
  if (role) {
    groups[role].push(out);
  } else {
    if (paint) out.paint = paint;
    body.push(out);
  }
});

/* The decal ring follows the paint even though it lives in the badge. */
groups.decalRing = groups.decalRing.map((s) => ({ ...s, paint: 'shade' }));

const painted = body.filter((s) => s.paint).length;
if (painted < 8) throw new Error(`only ${painted} body shapes take the paint — the class map is probably stale`);

const lit = (name) => JSON.stringify(groups[name], null, 2).replace(/\n/g, '\n  ');

const out = `/* GENERATED by tools/art/build-truck.mjs — DO NOT EDIT.
 * Source: ${SRC}. Change the SVG and run \`npm run art:build:truck\`.
 *
 * Shape roles are assigned by document index in the build script. As exported,
 * the art is 65 drawable elements:
 *   0–13, 18–21, 27–34, 39–47  the body, ladder, glass, stripe and bumper
 *   14–17                      the door badge (disc, ring, flame glyph)
 *   22–23                      the beacon plinth
 *   24–26, 48                  the beacon dome — tinted by the child's lights
 *   35–36, 49–56               the back wheel
 *   37–38, 57–64               the front wheel
 */

/** A drawn shape, straight from the authored art. */
export interface TruckShape {
  d?: string;
  circle?: { cx: number; cy: number; r: number };
  ellipse?: { cx: number; cy: number; rx: number; ry: number };
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: string;
  /** which part of the child's paint this shape takes, if any */
  paint?: 'face' | 'shade' | 'deep';
}

export interface TruckWheel {
  cx: number;
  cy: number;
  r: number;
  shapes: TruckShape[];
}

/** The authored drawing's own box. */
export const TRUCK_ART_VB = { w: ${vb.w}, h: ${vb.h} } as const;

/** Everything that does not move or re-tint on its own. */
export const truckBody: TruckShape[] = ${JSON.stringify(body, null, 2)};

/** The two wheels, each with the centre it spins about. */
export const truckWheels: TruckWheel[] = [
  { ...${JSON.stringify(WHEELS.wheelRear)}, shapes: ${lit('wheelRear')} },
  { ...${JSON.stringify(WHEELS.wheelFront)}, shapes: ${lit('wheelFront')} },
];

/** The plinth under the beacon — always dark. */
export const truckBeaconBase: TruckShape[] = ${lit('beaconBase')};

/** The dome that flashes, in the colours the child chose. */
export const truckBeaconDome: TruckShape[] = ${lit('beaconDome')};

/** The door badge: ring and disc stay, the glyph is swapped per decal. */
export const truckDecalRing: TruckShape[] = ${lit('decalRing')};
export const truckDecalDisc: TruckShape[] = ${lit('decalDisc')};
/** The authored flame, used when the child's decal is \`flame\`. */
export const truckDecalFlame: TruckShape[] = ${lit('decalGlyph')};

/** Where the badge sits, so a different decal can be drawn in its place. */
export const TRUCK_DECAL = { cx: 46.9, cy: 34.4, r: 12.4 } as const;
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(
  `wrote ${OUT}\n  ${shapes.length} shapes: ${body.length} body (${painted} painted), ` +
    `${groups.wheelRear.length}+${groups.wheelFront.length} wheels, ` +
    `${groups.beaconDome.length} dome, ${groups.decalGlyph.length} decal glyph`,
);
