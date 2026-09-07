import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import type { AnimalId } from '@/learning/types';
import { idle, palette, springs } from '@/theme';
import { useBlinkState, useIdleBob, useReducedMotion } from '@/hooks';
import { HIGHLIGHT, SHADE, SHADE_DEEP, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '../tone';

export type AnimalMood = 'help' | 'happy' | 'safe';
/** `perch` sits up and looks at you, `held` puts both paws up, `safe` sits low with happy closed eyes. */
export type AnimalPose = 'perch' | 'held' | 'safe';

export const animalName: Record<
  AnimalId,
  { en: string; es: string; plural: string; pluralEs: string; sound: 'meow' | 'dog-bark' | 'pop' }
> = {
  kitten: { en: 'kitten', es: 'gatito', plural: 'kittens', pluralEs: 'gatitos', sound: 'meow' },
  puppy: { en: 'puppy', es: 'perrito', plural: 'puppies', pluralEs: 'perritos', sound: 'dog-bark' },
  bunny: { en: 'bunny', es: 'conejito', plural: 'bunnies', pluralEs: 'conejitos', sound: 'pop' },
  duckling: { en: 'duckling', es: 'patito', plural: 'ducklings', pluralEs: 'patitos', sound: 'pop' },
  turtle: { en: 'turtle', es: 'tortuga', plural: 'turtles', pluralEs: 'tortugas', sound: 'pop' },
};

/* ------------------------------------------------------------------ */
/* Path kit — repeated small shapes are concatenated, never repeated    */
/* ------------------------------------------------------------------ */

const f = (v: number) => Math.round(v * 1000) / 1000;

/** One ellipse as a path fragment, so a dozen of them can share one `<Path>`. */
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

/** A soft hexagon — the turtle's scutes. Tangent to each edge at its midpoint,
 *  so six plates read as a shell rather than a football. */
const hex = (cx: number, cy: number, r: number) => {
  const k = 0.26; // how much of each edge stays straight before the corner
  const v = (i: number): [number, number] => {
    const a = (Math.PI / 3) * (i % 6) - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const lerp = (i: number, j: number, t: number): [number, number] => {
    const [ax, ay] = v(i);
    const [bx, by] = v(j);
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  };
  const start = lerp(0, 1, k);
  let d = `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < 6; i += 1) {
    const [ex, ey] = lerp(i, i + 1, 1 - k);
    const [vx, vy] = v(i + 1);
    const [nx, ny] = lerp(i + 1, i + 2, k);
    d += `L${f(ex)} ${f(ey)}Q${f(vx)} ${f(vy)} ${f(nx)} ${f(ny)}`;
  }
  return `${d}Z`;
};

/**
 * A SCALLOPED FUR EDGE.
 *
 * Where two coat tones meet, a clean arc reads as vinyl and a run of soft
 * scallops reads as hair. Returns a closed strip: the scallops bulge to `drop`
 * (negative = upwards) and the strip closes back along a straight edge just the
 * other side of `y`, so it can be filled with either coat tone and sit exactly
 * on the join. One `<Path>` for a whole chest.
 */
const scallops = (x0: number, x1: number, y: number, n: number, drop: number) => {
  const step = (x1 - x0) / n;
  let d = `M${f(x0)} ${f(y)}`;
  for (let i = 0; i < n; i += 1) {
    const a = x0 + i * step;
    d += `Q${f(a + step * 0.5)} ${f(y + drop)} ${f(a + step)} ${f(y)}`;
  }
  const back = y - Math.sign(drop) * Math.abs(drop) * 0.42;
  return `${d}L${f(x1)} ${f(back)}L${f(x0)} ${f(back)}Z`;
};

/* ------------------------------------------------------------------ */
/* Light kit — ONE direction (top-left), ONE shade, ONE highlight       */
/* ------------------------------------------------------------------ */

/**
 * A crescent hugging the rim of a *unit* circle, `t` thick as a fraction of the
 * radius: `shade` rides the down-right rim, `light` the up-left one. Scaled
 * onto a head, a haunch or a shell it gives every round part the same light,
 * which is what the old flat "band across the middle" never did. Two module
 * constants, one `<Path>` each — no clip paths, no gradients, no per-frame maths.
 */
function rimCrescent(t: number, side: 'shade' | 'light', spanDeg: number): string {
  const half = (Math.min(300, Math.max(40, spanDeg)) * Math.PI) / 360;
  const c = Math.cos(half);
  const a = Math.min(0.97, Math.max(c + 0.05, 1 - t));
  const u0 = (a * a - 1) / (2 * (a - c));
  const r = f(Math.abs(a - u0));
  const axis = side === 'shade' ? Math.PI / 4 : (Math.PI * 5) / 4;
  const p = (ang: number) => `${f(Math.cos(ang))} ${f(Math.sin(ang))}`;
  const big = half > Math.PI / 2 ? 1 : 0;
  return `M${p(axis - half)}A1 1 0 ${big} 1 ${p(axis + half)}A${r} ${r} 0 0 0 ${p(axis - half)}Z`;
}

/* Short arcs, not half-circles: a 180° pair meets at the terminator and turns
   any head into a hard-edged ring. These stop well before that. */
const RIM_SHADE = rimCrescent(0.2, 'shade', 152);
const RIM_SHADE_SOFT = rimCrescent(0.13, 'shade', 124);
const RIM_LIGHT = rimCrescent(0.12, 'light', 74);

type RimTone = 'shade' | 'softShade' | 'light';

/** Drop the light on any round part: `<Rim cx cy rx ry />`. */
const Rim = ({ cx, cy, rx, ry, tone = 'shade', opacity }: { cx: number; cy: number; rx: number; ry: number; tone?: RimTone; opacity?: number }) => (
  <Path
    d={tone === 'light' ? RIM_LIGHT : tone === 'softShade' ? RIM_SHADE_SOFT : RIM_SHADE}
    transform={`translate(${f(cx)} ${f(cy)}) scale(${f(rx)} ${f(ry)})`}
    fill={tone === 'light' ? HIGHLIGHT : SHADE}
    opacity={opacity}
  />
);

/* ------------------------------------------------------------------ */
/* Face kit — shared by every rig so all five read as one family        */
/* ------------------------------------------------------------------ */

type Look = 'open' | 'wide' | 'blink' | 'closed';

interface EyesProps {
  x1: number;
  x2: number;
  y: number;
  r: number;
  look: Look;
}

/**
 * Big glossy eyes. The catch-light sits UP-LEFT, with the light: the old art
 * put it up-right and quietly fought every other highlight in the frame.
 * Four `<Path>` nodes for two eyes, never eight.
 */
function Eyes({ x1, x2, y, r, look }: EyesProps) {
  if (look === 'closed') {
    // happy closed eyes — two little upward arcs (ᵔ ᵔ)
    const arc = (x: number) => `M${f(x - r)} ${f(y + r * 0.3)}Q${f(x)} ${f(y - r * 0.98)} ${f(x + r)} ${f(y + r * 0.3)}`;
    return <Path d={`${arc(x1)}${arc(x2)}`} stroke={palette.navy} strokeWidth={r * 0.5} strokeLinecap="round" fill="none" />;
  }
  if (look === 'blink') {
    const lid = (x: number) => `M${f(x - r)} ${f(y - r * 0.12)}Q${f(x)} ${f(y + r * 0.72)} ${f(x + r)} ${f(y - r * 0.12)}`;
    return <Path d={`${lid(x1)}${lid(x2)}`} stroke={palette.navy} strokeWidth={r * 0.5} strokeLinecap="round" fill="none" />;
  }
  const rr = look === 'wide' ? r * 1.12 : r;
  return (
    <G>
      <Path d={`${ell(x1, y, rr, rr * 1.06)}${ell(x2, y, rr, rr * 1.06)}`} fill={palette.navy} />
      {/* the pool of reflected sky along the bottom of the eye */}
      <Path d={`${ell(x1, y + rr * 0.46, rr * 0.6, rr * 0.28)}${ell(x2, y + rr * 0.46, rr * 0.6, rr * 0.28)}`} fill={palette.white} opacity={0.24} />
      <Path
        d={`${ell(x1 - rr * 0.34, y - rr * 0.36, rr * 0.36, rr * 0.34)}${ell(x2 - rr * 0.34, y - rr * 0.36, rr * 0.36, rr * 0.34)}`}
        fill={palette.white}
      />
      <Path
        d={`${ell(x1 + rr * 0.4, y + rr * 0.32, rr * 0.16, rr * 0.15)}${ell(x2 + rr * 0.4, y + rr * 0.32, rr * 0.16, rr * 0.15)}`}
        fill={palette.white}
        opacity={0.7}
      />
    </G>
  );
}

/** Two soft blushes. Small and quiet — they sit under the light, not over it. */
const Cheeks = ({ x1, x2, y, r, opacity = 0.3 }: { x1: number; x2: number; y: number; r: number; opacity?: number }) => (
  <Path d={`${ell(x1, y, r, r * 0.66)}${ell(x2, y, r, r * 0.66)}`} fill={palette.pink} opacity={opacity} />
);

type MouthKind = 'o' | 'smile' | 'grin';

/** The mouth. `smile` is the cartoon-animal "w", `o` a small squeak, `grin` open and happy. */
function Mouth({ cx, cy, w, kind }: { cx: number; cy: number; w: number; kind: MouthKind }) {
  if (kind === 'o') {
    return (
      <G>
        <Path d={ell(cx, cy + w * 0.14, w * 0.22, w * 0.25)} fill={palette.engineRedDark} opacity={0.82} />
        <Path d={ell(cx, cy + w * 0.24, w * 0.13, w * 0.1)} fill={palette.pinkSoft} opacity={0.9} />
        <Path d={ell(cx - w * 0.07, cy + w * 0.04, w * 0.05, w * 0.04)} fill={palette.white} opacity={0.5} />
      </G>
    );
  }
  if (kind === 'grin') {
    return (
      <G>
        <Path d={`M${f(cx - w * 0.42)} ${f(cy)}a${f(w * 0.42)} ${f(w * 0.46)} 0 0 0 ${f(w * 0.84)} 0Z`} fill={palette.navy} />
        <Path d={`M${f(cx - w * 0.24)} ${f(cy + w * 0.2)}a${f(w * 0.24)} ${f(w * 0.22)} 0 0 0 ${f(w * 0.48)} 0Z`} fill={palette.pinkSoft} />
      </G>
    );
  }
  return (
    <Path
      d={`M${f(cx)} ${f(cy)}q${f(-w * 0.16)} ${f(w * 0.34)} ${f(-w * 0.46)} ${f(w * 0.05)}M${f(cx)} ${f(cy)}q${f(w * 0.16)} ${f(w * 0.34)} ${f(w * 0.46)} ${f(w * 0.05)}`}
      stroke={palette.navy}
      strokeWidth={w * 0.13}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** How a mood + pose resolve into a face. */
function faceFor(mood: AnimalMood, pose: AnimalPose, blink: boolean): { look: Look; mouth: MouthKind } {
  if (pose === 'safe') return { look: 'closed', mouth: 'smile' };
  if (blink) return { look: 'blink', mouth: mood === 'help' ? 'o' : 'smile' };
  if (pose === 'held') return { look: 'wide', mouth: 'grin' };
  if (mood === 'help') return { look: 'wide', mouth: 'o' };
  return { look: 'open', mouth: 'smile' };
}

/** The navy contact ellipse every grounded animal stands on (rule #3). */
const Ground = ({ rx }: { rx: number }) => <Ellipse cx={50} cy={95} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />;

/**
 * Two front paws with toes. Down on the ground (drawn behind the head), or —
 * when held — up over the cheeks and drawn *in front* of the face (`front`), so
 * the pose reads "paws up!" rather than two mittens floating beside the head.
 */
function Paws({
  pose,
  color,
  y = 88.5,
  up = 60,
  spread = 10.5,
  rx = 8.6,
  ry = 5.4,
  front,
}: {
  pose: AnimalPose;
  color: string;
  y?: number;
  up?: number;
  spread?: number;
  rx?: number;
  ry?: number;
  front?: boolean;
}) {
  if (pose === 'held') {
    if (!front) return null;
    return (
      <G>
        <Path d={`${ell(30, up, 7.4, 8.2)}${ell(70, up, 7.4, 8.2)}`} fill={color} />
        <Path d={`${ell(31.4, up + 3.4, 4.6, 2.8)}${ell(71.4, up + 3.4, 4.6, 2.8)}`} fill={SHADE} />
        <Path d={`${ell(27.8, up - 3.6, 2.6, 1.8)}${ell(67.8, up - 3.6, 2.6, 1.8)}`} fill={HIGHLIGHT} />
      </G>
    );
  }
  if (front) return null;
  const sp = pose === 'safe' ? spread + 1.5 : spread;
  const l = 50 - sp;
  const r = 50 + sp;
  const toe = (cx: number) =>
    `M${f(cx - rx * 0.4)} ${f(y + ry * 0.1)}v${f(ry * 0.6)}M${f(cx)} ${f(y - ry * 0.06)}v${f(ry * 0.72)}M${f(cx + rx * 0.4)} ${f(y + ry * 0.1)}v${f(ry * 0.6)}`;
  return (
    <G>
      <Path d={`${ell(l, y, rx, ry)}${ell(r, y, rx, ry)}`} fill={color} />
      <Rim cx={l} cy={y} rx={rx} ry={ry} tone="softShade" />
      <Rim cx={r} cy={y} rx={rx} ry={ry} tone="softShade" />
      <Path d={`${toe(l)}${toe(r)}`} stroke={SHADE} strokeWidth={0.85} strokeLinecap="round" fill="none" opacity={0.38} />
    </G>
  );
}

interface RigProps {
  blink: boolean;
  mood: AnimalMood;
  pose: AnimalPose;
}

/** `safe` settles the whole rig down onto its haunches — one node, no duplicate art. */
const settle = (low: boolean) => (low ? 'translate(50 96) scale(1.07 0.9) translate(-50 -96)' : 'translate(0 0)');

/* ------------------------------------------------------------------ */
/* Rigs — all drawn in a 100 × 100 viewBox, standing on y ≈ 95          */
/*                                                                      */
/* Every rig is BODY (memoized: silhouette, coat, rim light, markings)  */
/* then FACE (blink/mood) then FRONT PAWS. Each species has to be       */
/* recognisable from its silhouette alone: the cat by ears + hooked     */
/* tail, the dog by hanging ears + collar, the bunny by ears + big hind */
/* feet, the duckling by bill + tail flick, the turtle by its shell.    */
/* ------------------------------------------------------------------ */

/* ── kitten ───────────────────────────────────────────────────────── */

const KITTEN_COAT = palette.orange;
const KITTEN_STRIPE = palette.orangeDark;

const KittenBody = memo(function KittenBody() {
  return (
    <G>
      {/* tail: sweeps out and hooks up, two tabby rings across it */}
      <Path d="M67 86C80 86 89 76 86.5 64C85.4 58.6 79.5 56.4 78 61.5" stroke={KITTEN_COAT} strokeWidth={10.5} strokeLinecap="round" fill="none" />
      <Path d="M79 80.4l7.4-2M82.6 70.6h8.2" stroke={KITTEN_STRIPE} strokeWidth={2.8} strokeLinecap="round" fill="none" opacity={0.26} />
      {/* body: shoulders, haunches, a settled base — not an oval */}
      <Path d="M50 47c15.5 0 26 13.5 26 29 0 9.5-11 15-26 15s-26-5.5-26-15c0-15.5 10.5-29 26-29z" fill={KITTEN_COAT} />
      <Rim cx={50} cy={76} rx={26} ry={20} />
      <Path d="M50 64c8.4 0 14.2 6.6 14.2 14.2 0 6.4-5.8 9.8-14.2 9.8s-14.2-3.4-14.2-9.8C35.8 70.6 41.6 64 50 64z" fill={palette.cream} />
      {/* the bib's fur edge, and tabby banding over both shoulders: a coat is
          a flat fill until something breaks its silhouette into hair */}
      <Path d={scallops(37, 63, 65.6, 7, -2.8)} fill={palette.cream} />
      <Path
        d="M27.6 67q4 5.2 3 11M33.2 64.6q4.2 5.6 3.2 11.6M72.4 67q-4 5.2-3 11M66.8 64.6q-4.2 5.6-3.2 11.6"
        stroke={KITTEN_STRIPE}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.24}
        fill="none"
      />
      <Path d="M36.4 81c1.8 4 7.2 6.2 13.6 6.2s11.8-2.2 13.6-6.2c-0.8 5.4-6.4 8-13.6 8s-12.8-2.6-13.6-8z" fill={SHADE} opacity={0.4} />
    </G>
  );
});

/** Orange tabby: pointed ears, forehead stripes, a two-lobe muzzle, a hooked tail. */
function Kitten({ blink, mood, pose }: RigProps) {
  const { look, mouth } = faceFor(mood, pose, blink);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={26} />
      <G transform={settle(pose === 'safe')}>
        <KittenBody />
        <Paws pose={pose} color={KITTEN_COAT} />
        {/* ears — the cat's whole silhouette lives here */}
        <Path d="M31 30C28 22 27 14 29 10c1-2 3-1 5 1 4 4 9 9 12 14zM69 30C72 22 73 14 71 10c-1-2-3-1-5 1-4 4-9 9-12 14z" fill={KITTEN_COAT} />
        <Path d="M33.4 27C31.4 21.4 31 16.6 32.4 14.2c0.8-1.2 2-0.6 3 0.8 2.4 3 5 6.4 7 10zM66.6 27C68.6 21.4 69 16.6 67.6 14.2c-0.8-1.2-2-0.6-3 0.8-2.4 3-5 6.4-7 10z" fill={palette.pinkSoft} />
        {/* head */}
        <Path d={ell(50, 43, 25, 23)} fill={KITTEN_COAT} />
        <Rim cx={50} cy={43} rx={25} ry={23} />
        <Rim cx={50} cy={43} rx={25} ry={23} tone="light" />
        <Path d="M43 23v8.4M50 21v9.4M57 23v8.4" stroke={KITTEN_STRIPE} strokeWidth={3.2} strokeLinecap="round" opacity={0.34} fill="none" />
        {/* muzzle: two lobes and a chin, the way a cat's face actually reads */}
        <Path d={`${ell(44.8, 55.6, 8.6, 6.6)}${ell(55.2, 55.6, 8.6, 6.6)}`} fill={palette.cream} />
        <Eyes x1={40.5} x2={59.5} y={42} r={6} look={look} />
        <Cheeks x1={35.4} x2={64.6} y={59.6} r={4.8} />
        <Path d="M50 52.6l-3.9-4.1c-0.5-1.2 0-1.9 1.2-1.9h5.4c1.2 0 1.7 0.7 1.2 1.9z" fill={palette.pink} />
        <Path d={ell(48.4, 48.2, 1.1, 0.7)} fill={palette.white} opacity={0.5} />
        <Mouth cx={50} cy={53.6} w={12} kind={mouth} />
        <Path d="M36.6 50.4l-9.4-3.2M36.2 54.2l-9.8-0.6M63.4 50.4l9.4-3.2M63.8 54.2l9.8-0.6" stroke={palette.white} strokeWidth={1.2} strokeLinecap="round" opacity={0.55} fill="none" />
        <Paws pose={pose} color={KITTEN_COAT} front />
      </G>
    </Svg>
  );
}

/* ── puppy ────────────────────────────────────────────────────────── */

const PUPPY_COAT = palette.tan;
const PUPPY_EAR = palette.wood;

const PuppyBody = memo(function PuppyBody() {
  return (
    <G>
      {/* a tail held up and wagging, with a lighter tip */}
      <Path d="M67 86C80 88 90.4 84 91.4 75.6C91.8 71.8 86.8 71 86.6 75" stroke={PUPPY_COAT} strokeWidth={8.6} strokeLinecap="round" fill="none" />
      <Path d="M80 87.4c2.6-0.4 5-1.2 7-2.4" stroke={SHADE} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Path d="M89.4 73.6c0.6 0.8 0.9 1.7 0.9 2.6" stroke={PUPPY_EAR} strokeWidth={8.2} strokeLinecap="round" fill="none" opacity={0.9} />
      <Path d="M50 47c15.5 0 26.5 13.5 26.5 29 0 9.5-11.5 15-26.5 15s-26.5-5.5-26.5-15c0-15.5 11-29 26.5-29z" fill={PUPPY_COAT} />
      <Rim cx={50} cy={76} rx={26.5} ry={20} />
      <Path d={ell(31.5, 76, 7, 6)} fill={PUPPY_EAR} opacity={0.7} />
      <Path d="M50 63c8.8 0 15 7 15 15 0 6.6-6.2 10.2-15 10.2s-15-3.6-15-10.2C35 70 41.2 63 50 63z" fill={palette.creamDeep} />
      <Path d={scallops(36.2, 63.8, 64.6, 7, -2.6)} fill={palette.creamDeep} />
      {/* short fur lying along both haunches, in the ear's warmer tone */}
      <Path
        d="M28.4 67.4q3.4 5-0.2 10M33.8 64.6q3.6 5.2 0.2 10.4M71.6 67.4q-3.4 5 0.2 10M66.2 64.6q-3.6 5.2-0.2 10.4"
        stroke={PUPPY_EAR}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.22}
        fill="none"
      />
      <Path d="M35.6 81c1.8 4.2 7.4 6.5 14.4 6.5s12.6-2.3 14.4-6.5c-0.9 5.6-6.8 8.3-14.4 8.3s-13.5-2.7-14.4-8.3z" fill={SHADE} opacity={0.38} />
    </G>
  );
});

/** Cream puppy: long hanging ears, a chunky muzzle, an eye patch, a red collar. */
function Puppy({ blink, mood, pose }: RigProps) {
  const { look, mouth } = faceFor(mood, pose, blink);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={26} />
      <G transform={settle(pose === 'safe')}>
        <PuppyBody />
        <Paws pose={pose} color={PUPPY_COAT} />
        {/* the ears hang past the jaw — the puppy's whole silhouette */}
        <Path
          d="M31 29C21 26.6 14 36.4 14.6 51 15 63.6 22 71.6 30.4 68.4 27.4 57.6 27.4 40.6 31 29zM69 29C79 26.6 86 36.4 85.4 51 85 63.6 78 71.6 69.6 68.4 72.6 57.6 72.6 40.6 69 29z"
          fill={PUPPY_EAR}
        />
        <Path
          d="M28.4 36.6C23 37.6 19.8 45 20.4 53.4 20.8 61.4 24.6 66.6 29.4 65.2 27.2 56.4 27 45 28.4 36.6zM71.6 36.6C77 37.6 80.2 45 79.6 53.4 79.2 61.4 75.4 66.6 70.6 65.2 72.8 56.4 73 45 71.6 36.6z"
          fill={SHADE}
        />
        {/* head */}
        <Path d={ell(50, 42, 25, 23.5)} fill={PUPPY_COAT} />
        <Rim cx={50} cy={42} rx={25} ry={23.5} />
        <Rim cx={50} cy={42} rx={25} ry={23.5} tone="light" />
        <Path d={ell(59.6, 37.4, 9.4, 8.8)} fill={PUPPY_EAR} opacity={0.85} />
        {/* muzzle: a broad, projecting snout */}
        <Path d="M50 45.6c9.4 0 15.8 5.6 15.8 12.2 0 6.4-7 10.8-15.8 10.8s-15.8-4.4-15.8-10.8c0-6.6 6.4-12.2 15.8-12.2z" fill={palette.cream} />
        <Rim cx={50} cy={57.6} rx={15.8} ry={11.5} tone="softShade" />
        <Eyes x1={41} x2={59} y={41} r={6} look={look} />
        <Cheeks x1={34} x2={66} y={54.6} r={5} />
        <Path d="M50 55c-3.4 0-6-2-6-4.2 0-2.1 2.6-3.4 6-3.4s6 1.3 6 3.4c0 2.2-2.6 4.2-6 4.2z" fill={palette.navy} />
        <Path d={ell(47.8, 49.4, 1.7, 1.2)} fill={palette.white} opacity={0.7} />
        <Mouth cx={50} cy={57.6} w={13} kind={mouth} />
        {mouth === 'smile' ? <Path d="M50 60.4q4.4 6 8.4 1.8" stroke={palette.pink} strokeWidth={3.8} strokeLinecap="round" fill="none" /> : null}
        {/* collar: a band that follows the chest, not a bar laid across it */}
        <Path d="M31.6 65.6q18.4 8.6 36.8 0l0.6 6q-19 8.8-38 0z" fill={palette.engineRed} />
        <Path d="M31.6 65.6q18.4 8.6 36.8 0l0.2 2.2q-18.6 8.6-37.2 0z" fill={HIGHLIGHT} />
        <Path d={ell(50, 76.4, 3.9, 3.9)} fill={palette.gold} />
        <Path d={ell(48.6, 75.2, 1.4, 1.2)} fill={HIGHLIGHT} />
        <Paws pose={pose} color={PUPPY_COAT} front />
      </G>
    </Svg>
  );
}

/* ── bunny ────────────────────────────────────────────────────────── */

const BUNNY_COAT = palette.white;

const BunnyBody = memo(function BunnyBody() {
  return (
    <G>
      {/* cotton tail */}
      <Path d={ell(77, 78, 8.6, 8.2)} fill={BUNNY_COAT} />
      <Rim cx={77} cy={78} rx={8.6} ry={8.2} tone="softShade" opacity={0.6} />
      <Path d={ell(74.4, 74.8, 3, 2.6)} fill={HIGHLIGHT} />
      <Path d="M50 52c14 0 24.5 12.5 24.5 26.5 0 8.6-10.5 13.6-24.5 13.6s-24.5-5-24.5-13.6C25.5 64.5 36 52 50 52z" fill={BUNNY_COAT} />
      <Rim cx={50} cy={78} rx={24.5} ry={19} tone="softShade" opacity={0.6} />
      <Path d="M50 68c7 0 12 5.8 12 12.2 0 5.4-5 8.2-12 8.2s-12-2.8-12-8.2C38 73.8 43 68 50 68z" fill={palette.creamDeep} opacity={0.45} />
      <Path d={scallops(38.8, 61.2, 69, 6, -2.4)} fill={palette.creamDeep} opacity={0.45} />
      {/* white on white needs the shade to carry the fur, not the fill */}
      <Path
        d="M30.6 69.6q3.2 4.8 0.2 9.4M35.4 67q3.4 5 0.2 9.8M69.4 69.6q-3.2 4.8-0.2 9.4M64.6 67q-3.4 5-0.2 9.8"
        stroke={SHADE}
        strokeWidth={2.6}
        strokeLinecap="round"
        opacity={0.55}
        fill="none"
      />
      {/* big hind feet, set forward the way a sitting rabbit's are */}
      <Path d={`${ell(35, 87.5, 11, 6.4)}${ell(65, 87.5, 11, 6.4)}`} fill={BUNNY_COAT} />
      <Path d={`${ell(35, 90, 8.4, 3.4)}${ell(65, 90, 8.4, 3.4)}`} fill={SHADE} opacity={0.55} />
      <Path
        d={`${ell(30.6, 85.4, 1.9, 1.6)}${ell(35, 84.4, 2.1, 1.7)}${ell(39.4, 85.4, 1.9, 1.6)}${ell(60.6, 85.4, 1.9, 1.6)}${ell(65, 84.4, 2.1, 1.7)}${ell(69.4, 85.4, 1.9, 1.6)}`}
        fill={palette.pinkSoft}
      />
    </G>
  );
});

/** White bunny: one upright ear and one with a flop, a cotton tail, two teeth. */
function Bunny({ blink, mood, pose }: RigProps) {
  const { look, mouth } = faceFor(mood, pose, blink);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={25} />
      <G transform={settle(pose === 'safe')}>
        {/* ears: never a matched pair — the flop is what makes it a drawing */}
        <G transform="rotate(-11 39 34)">
          <Path d={ell(39, 20, 8, 20)} fill={BUNNY_COAT} />
          <Path d={ell(39, 21.5, 4.2, 14)} fill={palette.pinkSoft} />
          <Path d="M44.4 8.4c2 4.6 2.4 12.6 1 20.6-0.8 4.4-2 7.4-3.2 9 1.6-9.6 2-21 2.2-29.6z" fill={SHADE} />
        </G>
        <G transform="rotate(15 61 34)">
          <Path d="M61 40c-4-8.6-6.6-18-5.6-25.4 0.6-4.6 4.4-6.6 7.6-4.2 3.6 2.8 5.4 8.6 4.6 15.4-0.6 5.6-2.6 10.6-4.4 14.2z" fill={BUNNY_COAT} />
          <Path d="M61.2 34.6c-2.6-6.4-4.2-13.4-3.4-18.6 0.4-3 2.6-4.2 4.6-2.6 2.4 2 3.6 6 3 10.8-0.5 4-1.9 7.8-3.2 10.4z" fill={palette.pinkSoft} />
          <Path d="M65.6 13.6c1.8 2.8 2.4 7.6 1.6 12.6-0.7 4.2-2.2 8.2-3.8 11.2 1.4-8.2 2-17 2.2-23.8z" fill={SHADE} />
        </G>
        <BunnyBody />
        <Paws pose={pose} color={BUNNY_COAT} y={78.5} spread={7.6} rx={5.8} ry={4.4} />
        {/* head */}
        <Path d={ell(50, 48, 24.5, 23)} fill={BUNNY_COAT} />
        <Rim cx={50} cy={48} rx={24.5} ry={23} tone="softShade" opacity={0.6} />
        <Rim cx={50} cy={48} rx={24.5} ry={23} tone="light" />
        <Path d={`${ell(45.2, 59.8, 7.2, 5.4)}${ell(54.8, 59.8, 7.2, 5.4)}`} fill={palette.creamDeep} opacity={0.55} />
        <Eyes x1={40} x2={60} y={47} r={6} look={look} />
        <Cheeks x1={33} x2={67} y={58.6} r={5} />
        <Path d="M50 58.6l-3.8-4c-0.5-1.2 0-1.9 1.2-1.9h5.2c1.2 0 1.7 0.7 1.2 1.9z" fill={palette.pink} />
        <Mouth cx={50} cy={59.4} w={12} kind={mouth} />
        {mouth !== 'o' ? (
          <G>
            <Path d="M46.4 61.4h7.2c1 0 1.6 0.6 1.6 1.6v3.4c0 1-0.6 1.6-1.6 1.6h-7.2c-1 0-1.6-0.6-1.6-1.6v-3.4c0-1 0.6-1.6 1.6-1.6z" fill={palette.white} />
            <Path d="M49.4 61.4h1.2v6.6h-1.2zM44.8 66.4h10.4v1.2H44.8z" fill={SHADE} />
          </G>
        ) : null}
        <Path d={`${ell(35.4, 62.4, 1.1, 1.1)}${ell(38.6, 65, 1.1, 1.1)}${ell(64.6, 62.4, 1.1, 1.1)}${ell(61.4, 65, 1.1, 1.1)}`} fill={SHADE} />
        <Paws pose={pose} color={BUNNY_COAT} front />
      </G>
    </Svg>
  );
}

/* ── duckling ─────────────────────────────────────────────────────── */

const DUCK_COAT = palette.safetyYellow;
const DUCK_WING = palette.gold;

const DucklingBody = memo(function DucklingBody({ held }: { held: boolean }) {
  return (
    <G>
      {/* webbed feet */}
      <Path
        d="M41 85c-2.8 3-6.6 5.8-9.8 7.6-1.2 0.7-0.8 2.2 0.7 2.2h18.2c1.5 0 1.9-1.5 0.7-2.2-3.2-1.8-7-4.6-9.8-7.6zM61 85c2.8 3 6.6 5.8 9.8 7.6 1.2 0.7 0.8 2.2-0.7 2.2H51.9c-1.5 0-1.9-1.5-0.7-2.2 3.2-1.8 7-4.6 9.8-7.6z"
        fill={palette.orange}
      />
      <Path d="M41 88.6v6.2M35.6 92.2l3-2.6M46.4 92.2l-3-2.6M61 88.6v6.2M55.6 92.2l3-2.6M66.4 92.2l-3-2.6" stroke={palette.orangeDark} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} fill="none" />
      {/* the tail flick — this is what stops the duckling reading as a peanut */}
      <Path d="M74 62c7.4-2.6 12.6 0 15.6 4.6-4.6 0.4-8.4 0.8-11.4 3-1-3-2.4-5.4-4.2-7.6z" fill={DUCK_WING} />
      <Path d="M52 44c15 0 26 12 26 26.6 0 11-11 17.8-26 17.8s-26-6.8-26-17.8C26 56 37 44 52 44z" fill={DUCK_COAT} />
      <Rim cx={52} cy={70} rx={26} ry={19} />
      <Path d={ell(52, 77, 14, 10)} fill={palette.cream} opacity={0.42} />
      {/* two rows of down across the breast — a duckling is not a smooth egg */}
      <Path d={`${scallops(35, 69, 61.5, 8, 3)}${scallops(33, 71, 69.5, 9, 3.2)}`} fill={DUCK_WING} opacity={0.22} />
      {/* wings, with feather tips along the trailing edge */}
      {held ? (
        <G>
          <Path d="M30.6 47.2c-5-2.2-9.8 1.4-11 8.2-1 6 1.5 11.2 5.8 11.8 0.9-6.9 3-14 5.2-20z" fill={DUCK_WING} />
          <Path d="M73.4 47.2c5-2.2 9.8 1.4 11 8.2 1 6-1.5 11.2-5.8 11.8-0.9-6.9-3-14-5.2-20z" fill={DUCK_WING} />
        </G>
      ) : (
        <G>
          <Path d="M33.4 55.6c-5.4 1.6-8.6 8-7.6 14.8 0.9 5.6 4.6 8.6 8.4 7.2-2-7.2-2.4-15-0.8-22z" fill={DUCK_WING} />
          <Path d="M70.6 55.6c5.4 1.6 8.6 8 7.6 14.8-0.9 5.6-4.6 8.6-8.4 7.2 2-7.2 2.4-15 0.8-22z" fill={DUCK_WING} />
          <Path d="M26.6 71.8c1.6 2.2 3.8 3.4 6 3M29.4 75.6c1.3 1.4 2.9 2.1 4.5 2.1M77.4 71.8c-1.6 2.2-3.8 3.4-6 3M74.6 75.6c-1.3 1.4-2.9 2.1-4.5 2.1" stroke={SHADE} strokeWidth={1.3} strokeLinecap="round" fill="none" />
          <Path d="M30.4 58.4c-2.8 2.4-4.2 7.2-3.6 11.8 0.4 3.2 1.7 5.5 3.5 6.3-1.2-6-1.1-12.4 0.1-18.1z" fill={SHADE} opacity={0.5} />
        </G>
      )}
    </G>
  );
});

/** Yellow duckling: a head tuft, stubby gold wings, a wide bill and webbed feet. */
function Duckling({ blink, mood, pose }: RigProps) {
  const { look, mouth } = faceFor(mood, pose, blink);
  const open = mouth === 'o' || mouth === 'grin';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={24} />
      <G transform={settle(pose === 'safe')}>
        <DucklingBody held={pose === 'held'} />
        {/* tuft, drawn behind the head so it reads as feathers standing up */}
        <Path d="M40.6 19.8c-1.4-7 2.6-10.4 5.8-6.4 0.4-5.6 5.2-6 6.6-0.8 2.4-4 6.2-1.4 5 3.8-5.4-2.6-12.6-1.6-17.4 3.4z" fill={DUCK_WING} />
        <Path d="M34 64c0-13.6 6.2-23 14-23s14 9.4 14 23z" fill={DUCK_COAT} />
        <Path d={ell(48, 34, 20.5, 19.5)} fill={DUCK_COAT} />
        <Rim cx={48} cy={34} rx={20.5} ry={19.5} tone="softShade" />
        <Rim cx={48} cy={34} rx={20.5} ry={19.5} tone="light" />
        <Eyes x1={41} x2={55.6} y={33} r={5.4} look={look} />
        <Cheeks x1={32.6} x2={63.4} y={40.4} r={4.6} />
        {/* bill */}
        <Path d="M35 45.4h26c0 4.4-4.4 7.6-13 7.6s-13-3.2-13-7.6z" fill={palette.orange} />
        <Path d="M35 45.4h26c0 1.3-0.4 2.4-1.2 3.4H36.2c-0.8-1-1.2-2.1-1.2-3.4z" fill={HIGHLIGHT} opacity={0.6} />
        <Path d={ell(43.4, 46.8, 1.1, 0.9)} fill={palette.orangeDark} opacity={0.7} />
        <Path d={ell(52.6, 46.8, 1.1, 0.9)} fill={palette.orangeDark} opacity={0.7} />
        {open ? (
          <G>
            <Path d="M40 50.4h16c-1 2.6-4.2 4.2-8 4.2s-7-1.6-8-4.2z" fill={palette.engineRedDark} opacity={0.8} />
            <Path d={ell(48, 53.2, 3.2, 1.5)} fill={palette.pinkSoft} opacity={0.9} />
          </G>
        ) : (
          <Path d="M39 50.4h18" stroke={palette.orangeDark} strokeWidth={1.4} strokeLinecap="round" opacity={0.55} fill="none" />
        )}
      </G>
    </Svg>
  );
}

/* ── turtle ───────────────────────────────────────────────────────── */

/*
 * THE TURTLE'S VALUE.
 *
 * The shell used to be `leafGreen` on `grass` skin — a green animal sitting on
 * a green canopy in Rescue Pets, where it all but disappeared. A real turtle's
 * carapace is keratin, not leaf, so it is now warm brown: dark enough and far
 * enough round the wheel to separate from any foliage it is ever rescued off,
 * with a paler `wood` rim for the marginal scutes and the plastron and a lit
 * centre in each plate. The skin stays green — it is what makes it a turtle —
 * but one value step down, so head and shell do not compete.
 */
const TURTLE_SKIN = palette.grassDark;
/* olive, not `wood`: brown alone sat on the same note as the branch the
   turtles are rescued off, so the shell is pulled towards the yellow-greens —
   far enough from the canopy to read, far enough from the bark to separate */
const TURTLE_SHELL = '#8E7A3C';
const TURTLE_SCUTE = '#695A2A';
const TURTLE_RIM = '#C2A85E';

const TurtleShell = memo(function TurtleShell({ held }: { held: boolean }) {
  return (
    <G>
      {/* neck and legs, all opaque and all UNDER the shell — the old rig let a
          translucent head sit over the dome and the whole animal went muddy */}
      <Path d="M10 56c-1 14 6 24 20 24h16V56z" fill={TURTLE_SKIN} />
      {held ? (
        <Path d={`${ell(24, 66, 7.4, 9.6)}${ell(48, 62, 7, 9.2)}`} fill={TURTLE_SKIN} />
      ) : (
        <G>
          <Path d="M30 74h13v13a6.5 6.5 0 0 1-13 0z" fill={TURTLE_SKIN} />
          <Path d="M32.6 86.2h8.4M32.4 89.8h8.8" stroke={SHADE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
        </G>
      )}
      <Path d="M74 74h13v13a6.5 6.5 0 0 1-13 0z" fill={TURTLE_SKIN} />
      <Path d="M76.6 86.2h8.4M76.4 89.8h8.8" stroke={SHADE} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M86 72c7.6 1 11.6 4.6 11 9.4-4-0.2-8-2-11-4.6z" fill={TURTLE_SKIN} />
      {/* the shell: a paler rim of marginal scutes (the plastron edge), then an
          opaque dome over it */}
      <Path d="M26 76c0 8 14.4 12.6 32 12.6S90 84 90 76c0-4-14.4-6.4-32-6.4S26 72 26 76z" fill={TURTLE_RIM} />
      <Path d="M30.4 81c2.6 1.4 5.8 2.4 9.4 3.2M46.6 85.2c3.2 0.4 6.6 0.6 10 0.6M63 85.6c3.6-0.2 7-0.6 10.2-1.2M79 82.8c3-1 5.6-2.1 7.6-3.4" stroke={SHADE_DEEP} strokeWidth={1.3} strokeLinecap="round" opacity={0.45} fill="none" />
      <Path d="M32 79C32 60 43.6 47 58 47s26 13 26 32z" fill={TURTLE_SHELL} />
      <Rim cx={58} cy={66} rx={26} ry={17} tone="light" />
      <Path
        d={`${hex(46, 56.6, 5.4)}${hex(58, 53.4, 5.8)}${hex(70, 56.6, 5.4)}${hex(41, 68.6, 6)}${hex(53, 70.2, 6.6)}${hex(65, 70.2, 6.6)}${hex(77, 68.6, 6)}`}
        fill={TURTLE_SCUTE}
      />
      {/* the lit crown of each plate — shell is keratin, and keratin has a
          growth ring, which is what makes seven hexagons read as a carapace */}
      <Path
        d={`${hex(45.4, 55.8, 3)}${hex(57.4, 52.6, 3.2)}${hex(69.4, 55.8, 3)}${hex(40.4, 67.6, 3.3)}${hex(52.4, 69.2, 3.7)}${hex(64.4, 69.2, 3.7)}${hex(76.4, 67.6, 3.3)}`}
        fill={TURTLE_RIM}
        opacity={0.5}
      />
      <Rim cx={58} cy={66} rx={26} ry={17} tone="softShade" />
    </G>
  );
});

/** Turtle: a domed shell of soft scutes, a light-green head to the left, stubby legs. */
function Turtle({ blink, mood, pose }: RigProps) {
  const { look, mouth } = faceFor(mood, pose, blink);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={30} />
      <G transform={settle(pose === 'safe')}>
        <TurtleShell held={pose === 'held'} />
        {/* the head sits in front of the shell's leading edge, fully opaque */}
        <Path d={ell(21, 56, 15, 14)} fill={TURTLE_SKIN} />
        <Rim cx={21} cy={56} rx={15} ry={14} />
        <Rim cx={21} cy={56} rx={15} ry={14} tone="light" />
        {/* a soft beak, so the profile is a turtle and not a green ball */}
        <Eyes x1={15} x2={27} y={53} r={4.8} look={look} />
        <Cheeks x1={10.4} x2={31.6} y={62.8} r={4} opacity={0.2} />
        <Mouth cx={21} cy={63} w={9.5} kind={mouth} />
        {/* the beak line, so the profile is a turtle and not a green ball */}
        <Path d="M7.4 59.4c-1.4 1.8-0.6 3.8 1.8 4.4" stroke={TURTLE_SCUTE} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.45} />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */

export interface AnimalProps {
  id: AnimalId;
  size?: number;
  mood?: AnimalMood;
  /** idle wiggle + blink (default true) */
  animate?: boolean;
  /** de-syncs a row of animals */
  phase?: number;
  /**
   * Body pose. Defaults from the mood: `safe` sits low with happy closed
   * eyes, everything else perches. Pass `held` while the child carries one.
   */
  pose?: AnimalPose;
}

/**
 * A cute rescue animal. Idles with a tiny body squash on the feet plus a
 * blink; `mood="help"` wiggles faster, and every so often the animal gives a
 * quick "squeak" hop. All of it stops under reduced motion.
 */
export function Animal({ id, size = 72, mood = 'happy', animate = true, phase = 0, pose }: AnimalProps) {
  const reduced = useReducedMotion();
  const on = animate && !reduced;
  const resolvedPose: AnimalPose = pose ?? (mood === 'safe' ? 'safe' : 'perch');
  const blink = useBlinkState() && on;
  const quick = mood === 'help' && resolvedPose !== 'safe';
  const wiggle = useIdleBob(1, quick ? idle.bobPeriodMs * 0.3 : idle.bobPeriodMs, phase * 1.3);
  const squeak = useSharedValue(0);

  /* an occasional squeak — one quick squash-and-hop, on a random cadence */
  useEffect(() => {
    if (!on || resolvedPose === 'safe') {
      cancelAnimation(squeak);
      squeak.value = 0;
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          squeak.value = withSequence(withSpring(1, springs.pop), withSpring(0, springs.gentle));
          schedule();
        },
        idle.blinkMinMs + Math.random() * (idle.blinkMaxMs - idle.blinkMinMs) + phase * 300,
      );
    };
    schedule();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      cancelAnimation(squeak);
    };
  }, [on, phase, resolvedPose, squeak]);

  const amp = quick ? idle.breatheScale * 2.5 : idle.breatheScale * 1.5;
  const tilt = quick ? 4 : 1.2;
  const motion = on ? 1 : 0;

  const style = useAnimatedStyle(() => {
    const w = wiggle.value * motion;
    const s = squeak.value * motion;
    return {
      transform: [
        { translateY: -Math.max(0, w) * size * 0.03 - s * size * 0.06 },
        { rotate: `${w * tilt}deg` },
        { scaleX: 1 + w * amp + s * 0.08 },
        { scaleY: 1 - w * amp - s * 0.08 },
      ],
    };
  });

  const rigProps: RigProps = { blink, mood, pose: resolvedPose };
  const rig =
    id === 'kitten' ? (
      <Kitten {...rigProps} />
    ) : id === 'puppy' ? (
      <Puppy {...rigProps} />
    ) : id === 'bunny' ? (
      <Bunny {...rigProps} />
    ) : id === 'duckling' ? (
      <Duckling {...rigProps} />
    ) : (
      <Turtle {...rigProps} />
    );

  return (
    <Animated.View style={[{ width: size, height: size }, styles.rig, style]} pointerEvents="none">
      {rig}
    </Animated.View>
  );
}

/** The woven rescue basket Rookie holds out. */
export const RescueBasket = memo(function RescueBasket({ width, height, full }: { width: number; height: number; full?: boolean }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90">
      {/* the handle, behind the body so the rim can sit over its feet */}
      <Path d="M31 28a29 29 0 0 1 58 0" stroke={palette.woodDark} strokeWidth={8} fill="none" strokeLinecap="round" />
      <Path d="M33.4 27a27 27 0 0 1 12.4-20.6" stroke="#E0B07A" strokeWidth={2.8} fill="none" strokeLinecap="round" opacity={0.8} />
      <Path d="M14 26h92l-9 56a8 8 0 0 1-8 7H31a8 8 0 0 1-8-7z" fill={palette.wood} />
      {/* the weave: staves one way, bands the other, all in one path each */}
      <Path
        d="M31 32l4 52M46 32l1.6 52M60 32v52M74 32l-1.6 52M89 32l-4 52"
        stroke={palette.woodDark}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.35}
        fill="none"
      />
      <Path d="M25.6 44h68.8M27.6 58h64.8M29.6 72h60.8" stroke="#E0B07A" strokeWidth={4.6} strokeLinecap="round" fill="none" />
      <Path d="M14 26h92l-1.4 9H15.4z" fill="#D9A05F" />
      {/* the light falls on the left face, the right face turns away */}
      <Path d="M14 26h13l-7.2 62a8 8 0 0 1-5.8-6z" fill={HIGHLIGHT} />
      <Path d="M93 26h13l-9 56a8 8 0 0 1-8 7h-7z" fill={SHADE} />
      {full ? <Path d={ell(60, 39, 38, 8.4)} fill={palette.mint} opacity={0.8} /> : null}
      {full ? <Path d="M24 37q18 7 36 4t36-6" stroke={palette.white} strokeWidth={2.4} strokeLinecap="round" opacity={0.35} fill="none" /> : null}
      <Path d="M14 21h92a4.5 4.5 0 0 1 0 9H14a4.5 4.5 0 0 1 0-9z" fill={palette.woodDark} />
      <Path d="M16 22.6h88a2 2 0 0 1 0 3.2H16a2 2 0 0 1 0-3.2z" fill={HIGHLIGHT} />
    </Svg>
  );
});

const styles = StyleSheet.create({
  // squash from the feet, so the animal stays planted while it wiggles
  rig: { alignItems: 'center', justifyContent: 'flex-end', transformOrigin: 'bottom' },
});

/** A leafy tree / ledge the animals get stuck on. */
export const RescueTree = memo(function RescueTree({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* critique: not three circles on a stick — a dark back mass, a lit front
          mass with a lobed silhouette, branch forks and a bark highlight. */}
      <Svg width={width} height={height} viewBox="0 0 240 260">
        <Ellipse cx={120} cy={254} rx={62} ry={13} fill={palette.navy} opacity={0.12} />
        <Path d="M104 260 q -4 -80 8 -120 h 16 q 12 40 8 120 z" fill={palette.woodDark} />
        <Path d="M108 260 q -3 -78 7 -118 h 6 q -6 42 -3 118 z" fill={HIGHLIGHT} />
        <Path d="M120 152 q -30 -6 -56 -30" stroke={palette.woodDark} strokeWidth={17} strokeLinecap="round" fill="none" />
        <Path d="M120 172 q 34 -4 62 -26" stroke={palette.woodDark} strokeWidth={15} strokeLinecap="round" fill="none" />
        {/* back canopy mass */}
        <Path
          d="M120 8 q -46 0 -58 34 q -40 6 -34 44 q -22 22 4 46 q 12 26 46 20 q 22 22 44 4 q 26 16 46 -8 q 34 -2 32 -34 q 18 -26 -8 -46 q -2 -36 -38 -40 q -14 -22 -34 -20 z"
          fill="#2F7F45"
        />
        {/* lit front mass */}
        <Path
          d="M120 24 q -38 0 -48 28 q -32 6 -26 36 q -18 18 4 38 q 10 20 38 16 q 18 18 36 2 q 22 12 38 -8 q 28 -2 26 -28 q 14 -22 -8 -38 q -2 -28 -32 -32 q -12 -18 -28 -14 z"
          fill="#4CAF50"
        />
        <Path d="M120 30 q -30 0 -40 22 q 12 -10 34 -12 q 22 -4 44 8 q -10 -18 -38 -18 z" fill={HIGHLIGHT} />
        <Path d="M66 84 q 14 -14 34 -16 q -22 10 -30 26 z" fill="#8FD16B" opacity={0.85} />
        <Path d="M158 118 q 18 -6 26 -22 q -4 24 -24 30 z" fill="#2F7F45" />
      </Svg>
    </View>
  );
});
