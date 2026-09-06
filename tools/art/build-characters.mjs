/**
 * Turns the authored vector art in `SVG ART/` into typed React Native path data.
 *
 * The rule this tool exists to enforce: **the shipped characters are the
 * authored art, path for path**. Nothing here redraws, simplifies or
 * re-proportions a shape — it only splits the flat path list into named rig
 * parts so the app can animate them, and rewrites `<circle>`/`<polygon>` into
 * the equivalent path `d` so the renderer has one shape kind to deal with.
 *
 * Run: node tools/art/build-characters.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'src', 'characters', 'art');

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

/** `.cls-3 {fill:#FFE62B;}` → { 'cls-3': { fill: '#FFE62B' } } */
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

const polygonToPath = (points) => {
  const n = points.trim().split(/[\s,]+/).map(num);
  let d = '';
  for (let i = 0; i < n.length; i += 2) d += `${i ? 'L' : 'M'}${n[i]} ${n[i + 1]}`;
  return `${d}z`;
};

/** Every drawable element, in document order. */
function parseShapes(svg) {
  const styles = parseStyles(svg);
  const shapes = [];
  for (const m of svg.matchAll(/<(path|circle|polygon)\b([^>]*?)\/?>/g)) {
    const [, tag, attrs] = m;
    const at = (name) => new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];
    const cls = at('class') ?? '';
    const style = styles[cls] ?? {};
    /* A circle stays a circle: rewriting it as arcs shifts its antialiased
     * edge by a fraction of a pixel, and "identical" here means identical. */
    let shape;
    if (tag === 'circle') {
      shape = { circle: { cx: num(at('cx')), cy: num(at('cy')), r: num(at('r')) }, fill: style.fill ?? '#000' };
    } else {
      const d = tag === 'path' ? at('d') : polygonToPath(at('points'));
      if (!d) continue;
      shape = { d, fill: style.fill ?? '#000' };
    }
    if (style.stroke) {
      shape.stroke = style.stroke;
      shape.strokeWidth = Number(style['stroke-width'] ?? 1);
      if (style['stroke-linecap']) shape.strokeLinecap = style['stroke-linecap'];
    }
    shapes.push(shape);
  }
  return shapes;
}

const viewBoxOf = (svg) => {
  const [, , w, h] = /viewBox="([^"]*)"/.exec(svg)[1].split(/\s+/).map(num);
  return { w, h };
};

/* ------------------------------------------------------------------ *
 * Rig maps — which authored shape belongs to which moving part.
 *
 * Indices are document order. Parts are emitted in the order listed, which is
 * the paint order; it only ever differs from the authored order where two
 * parts cannot overlap, so the drawing is pixel-identical either way.
 * ------------------------------------------------------------------ */

/** Fills that the avatar customiser is allowed to re-tint, by role. */
const TONES = {
  captain: {
    '#CA733B': 'skin', '#CC6232': 'skinShade', '#BD5830': 'skinLine',
    '#362526': 'hair', '#230C0C': 'hairDark',
  },
  rookie: {
    '#FCB68A': 'skin', '#FBAC7F': 'skinShade', '#FA9A69': 'skinShade2',
    '#F2875C': 'skinDeep', '#F49768': 'skinLine',
    '#3A292A': 'hair', '#3F2424': 'hairDark',
    '#EA292A': 'helmet', '#F73635': 'helmetLight', '#CE1724': 'helmetDark',
  },
};

const captain = {
  file: 'CAPTAIN.svg',
  name: 'captain',
  tones: TONES.captain,
  parts: [
    ['bootR', [1, 2, 5, 6]],
    ['bootL', [3, 4, 7, 8]],
    ['legL', [9, 11]],
    ['legR', [10, 12]],
    ['handL', [13]],
    ['handR', [14]],
    ['torso', [15, 18, 19, 20, 21, 22, 23, 24, 57, 58, 59, 60, 61]],
    ['cuffL', [16]],
    ['cuffR', [17]],
    ['neck', [25]],
    ['face', [26, 27]],
    ['hair', [28, 29, 30, 31, 32, 33]],
    ['browL', [34, 35]],
    ['browR', [36]],
    ['hat', [0, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]],
    ['earL', [47]],
    ['earR', [48]],
    ['cheekL', [49]],
    ['cheekR', [50]],
    ['eyeL', [51, 52]],
    ['eyeR', [53, 54]],
    ['mouth', [55, 56]],
  ],
  /* Measured from the authored art: the joints the rig rotates around. */
  anchors: {
    head: { x: 50, y: 47 },
    hat: { x: 50, y: 26 },
    torso: { x: 50, y: 76 },
    armL: { x: 26.5, y: 65.5 },
    armR: { x: 73.5, y: 65.5 },
    eyeL: { x: 42.8, y: 35.7 },
    eyeR: { x: 57.1, y: 35.7 },
    mouth: { x: 49.8, y: 41.5 },
    browL: { x: 42.5, y: 28.9 },
    browR: { x: 57.5, y: 29 },
    feet: { x: 50, y: 99 },
  },
};

const rookie = {
  file: 'FIREFIGHTER.svg',
  name: 'rookie',
  tones: TONES.rookie,
  parts: [
    ['handL', [0]],
    ['handR', [1]],
    ['bootL', [2, 3, 6]],
    ['bootR', [4, 5, 7]],
    ['legL', [8, 9, 12, 13]],
    ['legR', [10, 11, 14, 15]],
    ['torso', [16, 17, 18, 19, 20, 21, 22, 23]],
    ['armL', [24, 25, 26]],
    ['armR', [27, 28, 29, 30]],
    ['neck', [31]],
    ['collar', [32, 33]],
    ['badge', [59, 60]],
    ['hat', [34, 35, 36, 37, 38, 39, 40, 41]],
    ['hair', [42, 43, 44]],
    ['face', [45]],
    ['earL', [46]],
    ['earR', [47]],
    ['eyeL', [48, 49]],
    ['eyeR', [50, 51]],
    ['cheekL', [52]],
    ['cheekR', [53]],
    ['mouth', [54, 55]],
    ['browL', [56]],
    ['browR', [57]],
    ['nose', [58]],
  ],
  anchors: {
    head: { x: 50, y: 51 },
    hat: { x: 50, y: 38 },
    torso: { x: 50, y: 76 },
    armL: { x: 31.6, y: 56.6 },
    armR: { x: 68.3, y: 56.6 },
    eyeL: { x: 42.1, y: 39.7 },
    eyeR: { x: 58.1, y: 39.7 },
    mouth: { x: 50, y: 46 },
    browL: { x: 41.6, y: 32.6 },
    browR: { x: 58.7, y: 32.6 },
    feet: { x: 50, y: 99 },
  },
};

const logo = {
  file: 'LOGOMAIN.svg',
  name: 'logo',
  tones: {},
  parts: [
    ['plate', [0, 1]],
    ['flame', [2, 3]],
    ['wordTop', [4, 5, 6, 7, 8, 9, 10, 11]],
    ['wordBottom', [12, 13, 14, 15, 16]],
    ['tagline', [17]],
  ],
  anchors: { flame: { x: 75, y: 45 } },
};

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */

function build(spec) {
  const svg = readFileSync(join(ROOT, 'SVG ART', spec.file), 'utf8');
  const shapes = parseShapes(svg);
  const vb = viewBoxOf(svg);

  const used = new Set();
  for (const [, idx] of spec.parts) for (const i of idx) {
    if (i >= shapes.length) throw new Error(`${spec.file}: index ${i} is past the end (${shapes.length} shapes)`);
    if (used.has(i)) throw new Error(`${spec.file}: shape ${i} is in two parts`);
    used.add(i);
  }
  const missing = shapes.map((_, i) => i).filter((i) => !used.has(i));
  if (missing.length) throw new Error(`${spec.file}: shapes ${missing.join(', ')} were not assigned to a part`);

  const lines = [];
  lines.push('/**');
  lines.push(` * GENERATED from \`SVG ART/${spec.file}\` by \`tools/art/build-characters.mjs\`.`);
  lines.push(' * Do not edit by hand — re-run the tool instead. Every `d` here is the');
  lines.push(' * authored path, verbatim, so the rendered character is the reference art.');
  lines.push(' */');
  lines.push("import type { ArtPart } from './types';");
  lines.push('');
  lines.push(`export const ${spec.name}ViewBox = { w: ${vb.w}, h: ${vb.h} } as const;`);
  lines.push('');
  lines.push(`export const ${spec.name}Anchors = ${JSON.stringify(spec.anchors)} as const;`);
  lines.push('');
  lines.push(`export type ${cap(spec.name)}PartName = ${spec.parts.map(([n]) => `'${n}'`).join(' | ')};`);
  lines.push('');
  lines.push(`export const ${spec.name}Parts: readonly ArtPart<${cap(spec.name)}PartName>[] = [`);
  for (const [name, idx] of spec.parts) {
    lines.push(`  { name: '${name}', shapes: [`);
    for (const i of idx) {
      const s = shapes[i];
      const tone = spec.tones[s.fill.toUpperCase()];
      const bits = s.circle
        ? [`circle: { cx: ${s.circle.cx}, cy: ${s.circle.cy}, r: ${s.circle.r} }`, `fill: '${s.fill}'`]
        : [`d: ${JSON.stringify(s.d)}`, `fill: '${s.fill}'`];
      if (tone) bits.push(`tone: '${tone}'`);
      if (s.stroke) {
        bits.push(`stroke: '${s.stroke}'`, `strokeWidth: ${s.strokeWidth}`);
        if (s.strokeLinecap) bits.push(`strokeLinecap: '${s.strokeLinecap}'`);
      }
      lines.push(`    { ${bits.join(', ')} },`);
    }
    lines.push('  ] },');
  }
  lines.push('];');
  lines.push('');
  const file = join(OUT, `${spec.name}Art.ts`);
  writeFileSync(file, lines.join('\n'));
  console.log(`${spec.file.padEnd(18)} → ${shapes.length} shapes, ${spec.parts.length} parts → ${file.replace(ROOT + '/', '')}`);
  return { shapes: shapes.length, parts: spec.parts.length };
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

mkdirSync(OUT, { recursive: true });
for (const spec of [captain, rookie, logo]) build(spec);
