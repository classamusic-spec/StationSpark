import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { AnimalId } from '@/learning/types';
import { idle, palette, springs } from '@/theme';
import { useBlinkState, useIdleBob, useReducedMotion } from '@/hooks';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '../tone';

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
/* Face kit — shared by every rig so all five animals read as one family */
/* ------------------------------------------------------------------ */

type Look = 'open' | 'wide' | 'blink' | 'closed';

interface EyesProps {
  x1: number;
  x2: number;
  y: number;
  r: number;
  look: Look;
}

/** Big glossy navy eyes: one broad catch-light top-right, a pinprick bottom-left. */
function Eyes({ x1, x2, y, r, look }: EyesProps) {
  if (look === 'closed') {
    // happy closed eyes — two little upward arcs (ᵔ ᵔ)
    const arc = (x: number) => `M${x - r} ${y + r * 0.35} Q${x} ${y - r * 0.95} ${x + r} ${y + r * 0.35}`;
    return (
      <G>
        <Path d={arc(x1)} stroke={palette.navy} strokeWidth={r * 0.6} strokeLinecap="round" fill="none" />
        <Path d={arc(x2)} stroke={palette.navy} strokeWidth={r * 0.6} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  if (look === 'blink') {
    const lid = (x: number) => `M${x - r} ${y} Q${x} ${y + r * 0.7} ${x + r} ${y}`;
    return (
      <G>
        <Path d={lid(x1)} stroke={palette.navy} strokeWidth={r * 0.6} strokeLinecap="round" fill="none" />
        <Path d={lid(x2)} stroke={palette.navy} strokeWidth={r * 0.6} strokeLinecap="round" fill="none" />
      </G>
    );
  }
  const rr = look === 'wide' ? r * 1.12 : r;
  const eye = (x: number) => (
    <G>
      {look === 'wide' ? <Circle cx={x} cy={y} r={rr + r * 0.3} fill={palette.white} /> : null}
      <Circle cx={x} cy={y} r={rr} fill={palette.navy} />
      <Circle cx={x + rr * 0.34} cy={y - rr * 0.36} r={rr * 0.34} fill={palette.white} />
      <Circle cx={x - rr * 0.36} cy={y + rr * 0.38} r={rr * 0.14} fill={palette.white} opacity={0.85} />
    </G>
  );
  return (
    <G>
      {eye(x1)}
      {eye(x2)}
    </G>
  );
}

const Cheeks = ({ x1, x2, y, r }: { x1: number; x2: number; y: number; r: number }) => (
  <G>
    <Ellipse cx={x1} cy={y} rx={r} ry={r * 0.72} fill={palette.pink} opacity={0.55} />
    <Ellipse cx={x2} cy={y} rx={r} ry={r * 0.72} fill={palette.pink} opacity={0.55} />
  </G>
);

type MouthKind = 'o' | 'smile' | 'grin';

function Mouth({ cx, cy, w, kind }: { cx: number; cy: number; w: number; kind: MouthKind }) {
  if (kind === 'o') {
    return (
      <G>
        <Ellipse cx={cx} cy={cy + w * 0.12} rx={w * 0.3} ry={w * 0.28} fill={palette.engineRedDark} opacity={0.85} />
        <Ellipse cx={cx} cy={cy + w * 0.22} rx={w * 0.16} ry={w * 0.1} fill={palette.pink} opacity={0.8} />
      </G>
    );
  }
  if (kind === 'grin') {
    return (
      <G>
        <Path d={`M${cx - w * 0.5} ${cy} Q${cx} ${cy + w * 0.7} ${cx + w * 0.5} ${cy} Z`} fill={palette.navy} />
        <Path d={`M${cx - w * 0.28} ${cy + w * 0.12} Q${cx} ${cy + w * 0.5} ${cx + w * 0.28} ${cy + w * 0.12} Z`} fill={palette.pink} />
      </G>
    );
  }
  return (
    <Path
      d={`M${cx - w * 0.5} ${cy} q${w * 0.25} ${w * 0.45} ${w * 0.5} 0 q${w * 0.25} ${w * 0.45} ${w * 0.5} 0`}
      stroke={palette.navy}
      strokeWidth={w * 0.16}
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

/** Two soft paws: down on the ground, or up beside the face when held. */
function Paws({ pose, color, y = 90, up = 58, spread = 10 }: { pose: AnimalPose; color: string; y?: number; up?: number; spread?: number }) {
  if (pose === 'held') {
    return (
      <G>
        <Ellipse cx={50 - 24} cy={up} rx={6.5} ry={7.5} fill={color} />
        <Ellipse cx={50 + 24} cy={up} rx={6.5} ry={7.5} fill={color} />
        <Ellipse cx={50 - 24} cy={up + 3} rx={4} ry={2.6} fill={SHADE} />
        <Ellipse cx={50 + 24} cy={up + 3} rx={4} ry={2.6} fill={SHADE} />
      </G>
    );
  }
  const sp = pose === 'safe' ? spread - 2 : spread;
  return (
    <G>
      <Ellipse cx={50 - sp} cy={y} rx={7.5} ry={4.6} fill={color} />
      <Ellipse cx={50 + sp} cy={y} rx={7.5} ry={4.6} fill={color} />
      <Ellipse cx={50 - sp} cy={y + 1.6} rx={5} ry={2} fill={SHADE} />
      <Ellipse cx={50 + sp} cy={y + 1.6} rx={5} ry={2} fill={SHADE} />
    </G>
  );
}

interface RigProps {
  blink: boolean;
  mood: AnimalMood;
  pose: AnimalPose;
}

/* ------------------------------------------------------------------ */
/* Rigs — all drawn in a 100 × 100 viewBox, standing on y ≈ 96          */
/* Every rig: contact shadow → tail → body (base, shade, highlight) →   */
/* paws → head (ears first) → face. No outlines anywhere.              */
/* ------------------------------------------------------------------ */

/** Orange tabby: pointed ears, forehead stripes, cream muzzle, curled tail. */
function Kitten({ blink, mood, pose }: RigProps) {
  const coat = palette.orange;
  const { look, mouth } = faceFor(mood, pose, blink);
  const low = pose === 'safe';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={27} />
      {/* tail — curls up behind the body (or wraps round the paws when safe) */}
      {low ? (
        <Path d="M64 92c12 2 22-4 22-14 0-5-6-6-7-1-1 6-8 9-15 9z" fill={coat} />
      ) : (
        <Path d="M74 82c14-2 18-14 12-24-3-5-10-3-8 3 3 7-1 13-8 15z" fill={coat} />
      )}
      <Path d="M82 66c2-4 1-8-1-10 3 3 4 7 1 10z" fill={SHADE} />
      {/* body */}
      <Ellipse cx={50} cy={low ? 77 : 74} rx={low ? 27 : 25} ry={low ? 18 : 20} fill={coat} />
      <Ellipse cx={50} cy={low ? 86 : 84} rx={22} ry={8} fill={SHADE} />
      <Ellipse cx={50} cy={low ? 80 : 78} rx={15} ry={11} fill={palette.cream} />
      <Paws pose={pose} color={coat} />
      {/* ears */}
      <Path d="M27 46l-4-21 19 9z" fill={coat} />
      <Path d="M73 46l4-21-19 9z" fill={coat} />
      <Path d="M29 42l-2-10 9 5z" fill={palette.pinkSoft} />
      <Path d="M71 42l2-10-9 5z" fill={palette.pinkSoft} />
      {/* head */}
      <Circle cx={50} cy={44} r={25} fill={coat} />
      <Path d="M27 52a25 25 0 0 0 46 0 25 25 0 0 1-46 0z" fill={SHADE} />
      <Ellipse cx={40} cy={27} rx={9} ry={4.6} fill={HIGHLIGHT} />
      <Path d="M43 21v8M50 19v9M57 21v8" stroke={SHADE} strokeWidth={3.4} strokeLinecap="round" />
      <Ellipse cx={50} cy={53} rx={15} ry={11} fill={palette.cream} />
      <Eyes x1={41} x2={59} y={42} r={5.4} look={look} />
      <Cheeks x1={32} x2={68} y={52} r={5.4} />
      <Path d="M50 49.5l-3.6 3.2h7.2z" fill={palette.pink} />
      <Mouth cx={50} cy={56} w={12} kind={mouth} />
      <Path d="M22 50h-11M22 55h-11M78 50h11M78 55h11" stroke={palette.white} strokeWidth={2} strokeLinecap="round" opacity={0.9} />
    </Svg>
  );
}

/** Cream puppy: floppy brown ears, an eye patch, red collar with a gold tag. */
function Puppy({ blink, mood, pose }: RigProps) {
  const coat = palette.creamDeep;
  const patch = palette.wood;
  const { look, mouth } = faceFor(mood, pose, blink);
  const low = pose === 'safe';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={27} />
      {/* tail */}
      <Path d="M74 80c9-3 13-12 9-20-2-5-9-2-7 3 2 6-2 10-8 12z" fill={coat} />
      <Path d="M83 62c1-2 0-4-1-5 2 1 3 3 2 5z" fill={patch} />
      {/* body */}
      <Ellipse cx={50} cy={low ? 77 : 75} rx={low ? 26 : 24} ry={low ? 18 : 19} fill={coat} />
      <Ellipse cx={50} cy={low ? 86 : 84} rx={21} ry={8} fill={SHADE} />
      <Ellipse cx={50} cy={low ? 81 : 80} rx={14} ry={10} fill={palette.white} />
      <Ellipse cx={30} cy={76} rx={6} ry={5} fill={patch} opacity={0.8} />
      <Paws pose={pose} color={coat} />
      {/* ears hang from the temples */}
      <Ellipse cx={25} cy={50} rx={9} ry={17} fill={patch} />
      <Ellipse cx={75} cy={50} rx={9} ry={17} fill={patch} />
      <Ellipse cx={27} cy={54} rx={5} ry={12} fill={SHADE} />
      <Ellipse cx={73} cy={54} rx={5} ry={12} fill={SHADE} />
      {/* head */}
      <Circle cx={50} cy={44} r={25} fill={coat} />
      <Path d="M27 52a25 25 0 0 0 46 0 25 25 0 0 1-46 0z" fill={SHADE} />
      <Ellipse cx={61} cy={36} rx={10} ry={9} fill={patch} opacity={0.9} />
      <Ellipse cx={40} cy={27} rx={9} ry={4.6} fill={HIGHLIGHT} />
      <Ellipse cx={50} cy={56} rx={14} ry={10} fill={palette.white} />
      <Eyes x1={41} x2={59} y={42} r={5.4} look={look} />
      <Cheeks x1={32} x2={68} y={52} r={5.2} />
      <Ellipse cx={50} cy={52} rx={5} ry={4} fill={palette.navy} />
      <Circle cx={48.4} cy={50.8} r={1.4} fill={palette.white} opacity={0.8} />
      <Mouth cx={50} cy={59} w={12} kind={mouth} />
      {mouth === 'smile' ? <Path d="M50 62q4 6 8 2" stroke={palette.pink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
      {/* collar + tag */}
      <Rect x={33} y={64} width={34} height={6} rx={3} fill={palette.engineRed} />
      <Rect x={33} y={64} width={34} height={2.2} rx={1.1} fill={HIGHLIGHT} />
      <Circle cx={50} cy={71} r={3.6} fill={palette.gold} />
      <Circle cx={49} cy={70} r={1.2} fill={HIGHLIGHT} />
    </Svg>
  );
}

/** White bunny: tall ears with pink insides, a cotton tail, two little teeth. */
function Bunny({ blink, mood, pose }: RigProps) {
  const coat = palette.white;
  const { look, mouth } = faceFor(mood, pose, blink);
  const low = pose === 'safe';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={25} />
      {/* ears */}
      <G transform="rotate(-9 38 34)">
        <Ellipse cx={38} cy={20} rx={8} ry={20} fill={coat} />
        <Ellipse cx={38} cy={21} rx={4.2} ry={14} fill={palette.pinkSoft} />
        <Ellipse cx={42} cy={16} rx={2.6} ry={9} fill={SHADE} opacity={0.6} />
      </G>
      <G transform="rotate(9 62 34)">
        <Ellipse cx={62} cy={20} rx={8} ry={20} fill={coat} />
        <Ellipse cx={62} cy={21} rx={4.2} ry={14} fill={palette.pinkSoft} />
        <Ellipse cx={58} cy={16} rx={2.6} ry={9} fill={SHADE} opacity={0.6} />
      </G>
      {/* cotton tail */}
      <Circle cx={77} cy={78} r={8.5} fill={coat} />
      <Ellipse cx={78} cy={81} rx={6} ry={3.4} fill={SHADE} />
      <Circle cx={74} cy={75} r={3} fill={HIGHLIGHT} />
      {/* body */}
      <Ellipse cx={50} cy={low ? 78 : 76} rx={low ? 25 : 23} ry={low ? 17 : 18} fill={coat} />
      <Ellipse cx={50} cy={low ? 86 : 84} rx={20} ry={8} fill={SHADE} />
      <Paws pose={pose} color={coat} />
      {/* head */}
      <Circle cx={50} cy={49} r={25} fill={coat} />
      <Path d="M27 57a25 25 0 0 0 46 0 25 25 0 0 1-46 0z" fill={SHADE} />
      <Ellipse cx={40} cy={32} rx={9} ry={4.6} fill={HIGHLIGHT} />
      <Eyes x1={40} x2={60} y={47} r={5.4} look={look} />
      <Cheeks x1={31} x2={69} y={57} r={5.4} />
      <Path d="M50 55l-3.4 3h6.8z" fill={palette.pink} />
      <Mouth cx={50} cy={61} w={11} kind={mouth} />
      {mouth !== 'o' ? (
        <G>
          <Rect x={46} y={62} width={8} height={5.5} rx={2} fill={palette.white} />
          <Rect x={49.5} y={62} width={1} height={5.5} fill={SHADE} />
          <Rect x={46} y={66.5} width={8} height={1} fill={SHADE} />
        </G>
      ) : null}
      <Circle cx={30} cy={62} r={1.3} fill={SHADE} />
      <Circle cx={34} cy={65} r={1.3} fill={SHADE} />
      <Circle cx={70} cy={62} r={1.3} fill={SHADE} />
      <Circle cx={66} cy={65} r={1.3} fill={SHADE} />
    </Svg>
  );
}

/** Yellow duckling: a tuft, stubby gold wings, an orange bill and webbed feet. */
function Duckling({ blink, mood, pose }: RigProps) {
  const coat = palette.safetyYellow;
  const wing = palette.gold;
  const { look, mouth } = faceFor(mood, pose, blink);
  const low = pose === 'safe';
  const held = pose === 'held';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={24} />
      {/* feet */}
      <Path d="M38 91l-9 5h18zM62 91l9 5H53z" fill={palette.orange} />
      <Path d="M38 91l-9 5h9z" fill={SHADE} />
      <Path d="M62 91l9 5h-9z" fill={SHADE} />
      {/* body */}
      <Ellipse cx={50} cy={low ? 72 : 70} rx={low ? 28 : 26} ry={low ? 20 : 22} fill={coat} />
      <Ellipse cx={50} cy={low ? 84 : 82} rx={22} ry={8} fill={SHADE} />
      <Ellipse cx={40} cy={58} rx={9} ry={4.6} fill={HIGHLIGHT} />
      {/* wings */}
      {held ? (
        <G>
          <Ellipse cx={24} cy={56} rx={7} ry={13} fill={wing} transform="rotate(-28 24 56)" />
          <Ellipse cx={76} cy={56} rx={7} ry={13} fill={wing} transform="rotate(28 76 56)" />
        </G>
      ) : (
        <G>
          <Ellipse cx={26} cy={70} rx={9} ry={13} fill={wing} transform="rotate(14 26 70)" />
          <Ellipse cx={74} cy={70} rx={9} ry={13} fill={wing} transform="rotate(-14 74 70)" />
          <Ellipse cx={28} cy={74} rx={5} ry={8} fill={SHADE} transform="rotate(14 28 74)" />
        </G>
      )}
      {/* head */}
      <Circle cx={50} cy={40} r={23} fill={coat} />
      <Path d="M29 46a23 23 0 0 0 42 0 23 23 0 0 1-42 0z" fill={SHADE} />
      <Path d="M43 21c2-8 12-8 14 0-4-3-10-3-14 0z" fill={wing} />
      <Ellipse cx={41} cy={25} rx={8} ry={4.2} fill={HIGHLIGHT} />
      <Eyes x1={42} x2={58} y={37} r={5} look={look} />
      <Cheeks x1={33} x2={67} y={46} r={5} />
      {/* bill */}
      <Path d="M40 48h20a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6z" fill={palette.orange} />
      <Path d="M40 48h20a6 6 0 0 1-1 3.4H41a6 6 0 0 1-1-3.4z" fill={HIGHLIGHT} opacity={0.6} />
      {mouth === 'o' ? <Ellipse cx={50} cy={53} rx={4} ry={2.6} fill={palette.orangeDark} /> : null}
      {mouth === 'grin' ? <Path d="M44 52q6 4 12 0" stroke={palette.orangeDark} strokeWidth={2} strokeLinecap="round" fill="none" /> : null}
    </Svg>
  );
}

/** Turtle: a domed shell with scutes, a light-green head to the left, stubby legs. */
function Turtle({ blink, mood, pose }: RigProps) {
  const skin = palette.grass;
  const shell = palette.leafGreen;
  const scute = palette.leafGreenDark;
  const { look, mouth } = faceFor(mood, pose, blink);
  const held = pose === 'held';
  const low = pose === 'safe';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Ground rx={30} />
      {/* legs + tail */}
      {held ? (
        <G>
          <Ellipse cx={14} cy={66} rx={7} ry={10} fill={skin} transform="rotate(-30 14 66)" />
          <Ellipse cx={44} cy={62} rx={7} ry={10} fill={skin} transform="rotate(20 44 62)" />
        </G>
      ) : (
        <G>
          <Ellipse cx={24} cy={84} rx={9} ry={7} fill={skin} />
          <Ellipse cx={24} cy={86} rx={6} ry={3} fill={SHADE} />
        </G>
      )}
      <Ellipse cx={76} cy={84} rx={9} ry={7} fill={skin} />
      <Ellipse cx={76} cy={86} rx={6} ry={3} fill={SHADE} />
      <Path d="M84 68c8 2 10 8 6 12-3 3-8 0-7-4z" fill={skin} />
      {/* shell */}
      <Ellipse cx={54} cy={80} rx={36} ry={9} fill={scute} />
      <Ellipse cx={54} cy={low ? 64 : 62} rx={34} ry={low ? 24 : 26} fill={shell} />
      <Ellipse cx={54} cy={low ? 62 : 60} rx={26} ry={19} fill={scute} />
      <Circle cx={54} cy={58} r={8} fill={shell} />
      <Circle cx={36} cy={60} r={6} fill={shell} />
      <Circle cx={72} cy={60} r={6} fill={shell} />
      <Circle cx={54} cy={44} r={6} fill={shell} />
      <Circle cx={40} cy={47} r={4.4} fill={shell} />
      <Circle cx={68} cy={47} r={4.4} fill={shell} />
      <Ellipse cx={54} cy={76} rx={30} ry={5} fill={SHADE} />
      <Ellipse cx={38} cy={42} rx={9} ry={4.6} fill={HIGHLIGHT} />
      {/* head */}
      <Circle cx={24} cy={low ? 44 : 40} r={19} fill={skin} />
      <Path d={`M5 ${low ? 50 : 46}a19 19 0 0 0 38 0 19 19 0 0 1-38 0z`} fill={SHADE} />
      <Ellipse cx={17} cy={low ? 31 : 27} rx={7} ry={3.6} fill={HIGHLIGHT} />
      <Eyes x1={17} x2={31} y={low ? 39 : 35} r={4.4} look={look} />
      <Cheeks x1={11} x2={37} y={low ? 47 : 43} r={4} />
      <Mouth cx={24} cy={low ? 50 : 46} w={9} kind={mouth} />
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
export function RescueBasket({ width, height, full }: { width: number; height: number; full?: boolean }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90">
      <Path d="M14 26h92l-9 56a8 8 0 0 1-8 7H31a8 8 0 0 1-8-7z" fill={palette.wood} />
      <Path d="M14 26h92l-2 12H16z" fill="#D9A05F" />
      <Path d="M26 44h68M29 58h62M32 72h56" stroke="#E0B07A" strokeWidth={5} strokeLinecap="round" />
      <Path d="M30 26a30 30 0 0 1 60 0" stroke={palette.woodDark} strokeWidth={8} fill="none" strokeLinecap="round" />
      {full ? <Ellipse cx={60} cy={40} rx={38} ry={9} fill={palette.mint} opacity={0.75} /> : null}
      <Rect x={14} y={22} width={92} height={9} rx={4.5} fill={palette.woodDark} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // squash from the feet, so the animal stays planted while it wiggles
  rig: { alignItems: 'center', justifyContent: 'flex-end', transformOrigin: 'bottom' },
});

/** A leafy tree / ledge the animals get stuck on. */
export function RescueTree({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* critique: not three circles on a stick — a dark back mass, a lit front
          mass with a lobed silhouette, branch forks and a bark highlight. */}
      <Svg width={width} height={height} viewBox="0 0 240 260">
        <Ellipse cx={120} cy={254} rx={62} ry={13} fill={palette.navy} opacity={0.12} />
        <Path d="M104 260 q -4 -80 8 -120 h 16 q 12 40 8 120 z" fill={palette.woodDark} />
        <Path d="M108 260 q -3 -78 7 -118 h 6 q -6 42 -3 118 z" fill="rgba(255,255,255,0.32)" />
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
        <Path
          d="M120 30 q -30 0 -40 22 q 12 -10 34 -12 q 22 -4 44 8 q -10 -18 -38 -18 z"
          fill="rgba(255,255,255,0.32)"
        />
        <Path d="M66 84 q 14 -14 34 -16 q -22 10 -30 26 z" fill="#8FD16B" opacity={0.85} />
        <Path d="M158 118 q 18 -6 26 -22 q -4 24 -24 30 z" fill="#2F7F45" />
      </Svg>
    </View>
  );
}
