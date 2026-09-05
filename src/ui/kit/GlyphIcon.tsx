/**
 * GLYPH SHEET — every small UI mark in Station Spark, drawn.
 *
 * This file exists to kill emoji (art critique item #21). Emoji render
 * differently on every platform and instantly break the hand-drawn spell, so
 * counters, subject pills, mission beats, training tiles and safety chips all
 * pull their marks from here instead.
 *
 * House rules, on every glyph, no exceptions:
 *   1. no outlines — shapes are separated by value, never by a keyline
 *   2. three tones per object: base → shade `rgba(31,42,90,0.14)` → highlight
 *      `rgba(255,255,255,0.32)`
 *   3. anything that sits on ground gets a navy shadow ellipse
 *      (opacity 0.12, ry ≈ rx × 0.22)
 *   6. palette tokens only; red is brand energy, never "wrong"
 *
 * Everything is authored in one 48×48 box so a strip of glyphs reads as one
 * hand at any size.
 */
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { mix } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

const VB = 48;

/** rules 2 and 3 come from one place for the whole app — see `@/world/tone`. */
const HI = HIGHLIGHT;
const HI_STRONG = 'rgba(255,255,255,0.55)';

const dark = (c: string, amount = 0.18) => mix(c, palette.navy, amount);
/** The drop-shade and the lift a subject mark uses, derived from its own ink. */
const shadeOf = (c: string) => (c === palette.white ? 'rgba(31,42,90,0.16)' : mix(c, palette.navy, 0.34));
const lightOf = (c: string) => (c === palette.white ? 'rgba(255,255,255,0.55)' : mix(c, '#FFFFFF', 0.45));
const lite = (c: string, amount = 0.3) => mix(c, '#FFFFFF', amount);

/** rule 3: a contact ellipse, ry ≈ rx × 0.22, centred on the contact point. */
const Ground = ({ cx = 24, cy = 43, rx = 15 }: { cx?: number; cy?: number; rx?: number }) => (
  <Ellipse cx={cx} cy={cy} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
);

/* ------------------------------------------------------------------ *
 * Shared builders                                                      *
 * ------------------------------------------------------------------ */

/** The friendly teardrop flame — rounded, never realistic (art direction). */
const Flame = ({ x = 24, y = 26, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <G transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
    <Path d="M 24 6 C 39 21 42 30 24 44 C 6 30 9 21 24 6 Z" fill={palette.flameOuter} />
    <Path d="M 24 15 C 33 24 34 30 24 40 C 14 30 15 24 24 15 Z" fill={palette.flameMid} />
    <Path d="M 24 24 C 29 29 29 32 24 37 C 19 32 19 29 24 24 Z" fill={palette.flameCore} />
    <Path d="M 15 24 C 16 18 19 14 22 12" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </G>
);

/** A water droplet. Used for "drop", "water" and the extinguished flame. */
const Drop = ({ x = 24, y = 26, s = 1 }: { x?: number; y?: number; s?: number }) => (
  <G transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}>
    <Path d="M 24 5 C 33 17 40 24 40 31 A 16 16 0 0 1 8 31 C 8 24 15 17 24 5 Z" fill={palette.waterCyanDark} />
    <Path d="M 24 9 C 32 19 38 25 38 31 A 14 14 0 0 1 10 31 C 10 25 16 19 24 9 Z" fill={palette.waterCyan} />
    <Path d="M 16 31 A 8 8 0 0 0 21 39" stroke={HI_STRONG} strokeWidth={3.2} strokeLinecap="round" fill="none" />
  </G>
);

/** The gold star. One shape, reused by the star counter, badges and the HUD. */
const STAR_D = 'M 24 4 L 30 17.6 L 44.6 19.4 L 33.8 29.4 L 36.7 44 L 24 36.7 L 11.3 44 L 14.2 29.4 L 3.4 19.4 L 18 17.6 Z';
const Star = ({ fill = palette.safetyYellow, shade = palette.gold }: { fill?: string; shade?: string }) => (
  <G>
    <Path d={STAR_D} fill={shade} transform="translate(0 1.6)" />
    <Path d={STAR_D} fill={fill} />
    <Path d="M 24 10 L 27.6 18.6 L 36.6 20 L 30 26 L 24 22 Z" fill={HI} />
  </G>
);

/** A speech bubble — the one shape every "talking" glyph uses. */
const Bubble = ({
  fill = palette.white,
  shade,
  x = 0,
  y = 0,
  s = 1,
  tail = true,
}: { fill?: string; shade?: string; x?: number; y?: number; s?: number; tail?: boolean }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    {shade ? <Path d="M 8 14 h 32 a 8 8 0 0 1 8 8 v 12 a 8 8 0 0 1 -8 8 h -18 l -9 7 l 1.6 -7 h -6.6 a 8 8 0 0 1 -8 -8 v -12 a 8 8 0 0 1 8 -8 z" fill={shade} transform="translate(-2 1.6)" /> : null}
    <Path
      d={
        tail
          ? 'M 8 12 h 32 a 8 8 0 0 1 8 8 v 12 a 8 8 0 0 1 -8 8 h -18 l -9 7 l 1.6 -7 h -6.6 a 8 8 0 0 1 -8 -8 v -12 a 8 8 0 0 1 8 -8 z'
          : 'M 8 12 h 32 a 8 8 0 0 1 8 8 v 12 a 8 8 0 0 1 -8 8 h -32 a 8 8 0 0 1 -8 -8 v -12 a 8 8 0 0 1 8 -8 z'
      }
      fill={fill}
      transform="translate(-4 0)"
    />
  </G>
);

/** An empty socket — "not filled in yet", never "wrong". */
const Socket = ({ tone = palette.slateLight }: { tone?: string }) => (
  <G>
    <Circle cx={24} cy={24} r={14} fill={tone} opacity={0.55} />
    <Circle cx={24} cy={24} r={10.4} fill={palette.white} opacity={0.85} />
  </G>
);

/* ------------------------------------------------------------------ *
 * The sheet                                                            *
 * ------------------------------------------------------------------ */

export type GlyphId =
  /* counters and marks */
  | 'flame' | 'drop' | 'star' | 'star-empty' | 'paw' | 'dot' | 'socket'
  | 'spark' | 'check' | 'wave' | 'lock'
  /* subject pills — authored white-forward for a coloured pill */
  | 'subject-math' | 'subject-reading' | 'subject-english' | 'subject-spanish'
  | 'subject-logic' | 'subject-teamwork' | 'subject-cooking'
  /* mission beats */
  | 'beat-dialogue' | 'beat-minigame' | 'beat-travel' | 'beat-scene' | 'beat-kitchen' | 'beat-recap'
  /* training stations */
  | 'hose' | 'water' | 'tank' | 'ladder' | 'numbers' | 'radio' | 'equipment' | 'gear'
  | 'path' | 'route' | 'hydrant' | 'spray' | 'clock' | 'pets' | 'barrier' | 'signals'
  | 'vocab' | 'listen' | 'pizza' | 'measure' | 'count' | 'share' | 'scale'
  /* odds and ends */
  | 'truck' | 'cone' | 'chef-hat' | 'book' | 'bulb' | 'crew' | 'pin' | 'cap';

export const glyphIds: readonly GlyphId[] = [
  'flame', 'drop', 'star', 'star-empty', 'paw', 'dot', 'socket', 'spark', 'check', 'wave', 'lock',
  'subject-math', 'subject-reading', 'subject-english', 'subject-spanish', 'subject-logic', 'subject-teamwork', 'subject-cooking',
  'beat-dialogue', 'beat-minigame', 'beat-travel', 'beat-scene', 'beat-kitchen', 'beat-recap',
  'hose', 'water', 'tank', 'ladder', 'numbers', 'radio', 'equipment', 'gear',
  'path', 'route', 'hydrant', 'spray', 'clock', 'pets', 'barrier', 'signals',
  'vocab', 'listen', 'pizza', 'measure', 'count', 'share', 'scale',
  'truck', 'cone', 'chef-hat', 'book', 'bulb', 'crew', 'pin', 'cap',
];

const isGlyph = (v: string): v is GlyphId => (glyphIds as readonly string[]).includes(v);

/* --- the walkie-talkie, shared by `radio` and the Dispatch beat -------- */
const Walkie = ({ rays = true }: { rays?: boolean }) => (
  <G>
    {rays ? (
      <G opacity={0.95}>
        <Path d="M 38 10 h 6 M 36.5 16 l 5.5 -2.4 M 36 4.4 l 3.4 -4" stroke={palette.safetyYellow} strokeWidth={3} strokeLinecap="round" />
      </G>
    ) : null}
    <Rect x={29} y={4} width={4.4} height={12} rx={2.2} fill="#5B6588" />
    <Rect x={10} y={9} width={26} height={36} rx={7} fill="#232C52" />
    <Rect x={10} y={9} width={26} height={32} rx={7} fill="#39425F" />
    <Rect x={14} y={14} width={18} height={11} rx={3} fill={palette.gold} />
    <Rect x={14} y={14} width={18} height={9} rx={3} fill={palette.safetyYellow} />
    <Rect x={16.4} y={16.6} width={9} height={2.2} rx={1.1} fill="rgba(31,42,90,0.35)" />
    <Circle cx={17.5} cy={32} r={3} fill={palette.engineRed} />
    <Circle cx={28.5} cy={32} r={3} fill="#5B6588" />
    <Circle cx={17.5} cy={39.5} r={3} fill="#5B6588" />
    <Circle cx={28.5} cy={39.5} r={3} fill="#5B6588" />
    <Rect x={12.4} y={12} width={4} height={10} rx={2} fill={HI} />
  </G>
);

function Art({ id, muted, ink }: { id: GlyphId; muted: boolean; ink: string }) {
  if (muted) return <Socket />;
  switch (id) {
    /* ---------------- counters and marks ---------------- */
    case 'flame':
      return (
        <G>
          <Ground cy={44} rx={12} />
          <Flame s={0.94} />
        </G>
      );
    case 'drop':
    case 'water':
      return (
        <G>
          <Ground cy={44} rx={12} />
          <Drop s={0.92} />
        </G>
      );
    case 'star':
    case 'beat-minigame':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Star />
        </G>
      );
    case 'star-empty':
      return (
        <G>
          <Path d={STAR_D} fill={palette.slateLight} opacity={0.7} />
          <Path d="M 24 11 L 28.4 21.2 L 39 22.4 L 31.2 29.6 L 33.2 40 L 24 34.6 L 14.8 40 L 16.8 29.6 L 9 22.4 L 19.6 21.2 Z" fill={palette.white} opacity={0.85} />
        </G>
      );
    case 'paw':
    case 'pets':
      return (
        <G>
          <Ground cy={44} rx={13} />
          <G>
            <Ellipse cx={24} cy={33} rx={12} ry={10} fill={dark(palette.wood, 0.24)} />
            <Ellipse cx={24} cy={31.6} rx={11} ry={9.2} fill={palette.wood} />
            <Ellipse cx={20} cy={28} rx={4.4} ry={3} fill={HI} />
            {([
              [10.5, 17.5, 4.4, 5.6, -18],
              [19.5, 12, 4.6, 6, -6],
              [28.5, 12, 4.6, 6, 6],
              [37.5, 17.5, 4.4, 5.6, 18],
            ] as [number, number, number, number, number][]).map(([cx, cy, rx, ry, rot], i) => (
              <G key={i}>
                <Ellipse cx={cx} cy={cy + 1.4} rx={rx} ry={ry} fill={dark(palette.wood, 0.24)} transform={`rotate(${rot} ${cx} ${cy})`} />
                <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={palette.wood} transform={`rotate(${rot} ${cx} ${cy})`} />
              </G>
            ))}
          </G>
        </G>
      );
    case 'dot':
      return (
        <G>
          <Ground cy={41} rx={11} />
          <Circle cx={24} cy={25} r={14} fill={palette.engineRedDark} />
          <Circle cx={24} cy={24} r={13} fill={palette.engineRed} />
          <Ellipse cx={18.5} cy={17.5} rx={5} ry={3.4} fill={HI} transform="rotate(-32 18.5 17.5)" />
        </G>
      );
    case 'socket':
      return <Socket />;
    case 'spark':
      return (
        <G>
          <Path d="M 24 3 L 28.4 17.6 L 43 22 L 28.4 26.4 L 24 41 L 19.6 26.4 L 5 22 L 19.6 17.6 Z" fill={palette.gold} />
          <Path d="M 24 6.6 L 27.6 18.4 L 39.4 22 L 27.6 25.6 L 24 37.4 L 20.4 25.6 L 8.6 22 L 20.4 18.4 Z" fill={palette.safetyYellow} />
          <Path d="M 38 32 l 1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill={palette.gold} />
          <Path d="M 9 8 l 1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill={palette.safetyYellow} opacity={0.85} />
          <Path d="M 21 13 L 24 9 L 27 13 L 24 17 Z" fill={HI_STRONG} />
        </G>
      );
    case 'check':
      return (
        <G>
          <Circle cx={24} cy={25} r={17} fill={palette.leafGreenDark} />
          <Circle cx={24} cy={24} r={16} fill={palette.leafGreen} />
          <Path d="M 15 24.5 L 21.5 31 L 33.5 18" stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Ellipse cx={17} cy={15} rx={5.4} ry={3.4} fill={HI} transform="rotate(-32 17 15)" />
        </G>
      );
    case 'wave': {
      const sk = '#FFD3B0';
      const skS = mix(sk, palette.navy, 0.2);
      const skD = mix(sk, palette.navy, 0.34);
      return (
        <G>
          {/* a small waving hand — the "ask a grown-up" mark. Four separated
              fingers and a thumb, so it still reads at 16 px in a chip. */}
          <Path d="M 12.5 17 q 2.5 -3.4 2.5 -7.4 M 35.5 17 q -2.5 -3.4 -2.5 -7.4" stroke={palette.safetyYellow} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          {([
            [17.6, 12.5],
            [23.2, 9.6],
            [28.8, 11.4],
          ] as [number, number][]).map(([x, y], i) => (
            <G key={i}>
              <Rect x={x - 3.1} y={y} width={6.2} height={20} rx={3.1} fill={skD} />
              <Rect x={x - 2.6} y={y + 0.6} width={5.2} height={18.4} rx={2.6} fill={sk} />
            </G>
          ))}
          {/* thumb, swung out to the side */}
          <Rect x={31.4} y={18} width={6.2} height={14} rx={3.1} fill={skD} transform="rotate(30 34.5 25)" />
          <Rect x={31.9} y={18.6} width={5.2} height={12.8} rx={2.6} fill={sk} transform="rotate(30 34.5 25)" />
          {/* palm */}
          <Rect x={14.4} y={24} width={19.2} height={20} rx={9} fill={skS} />
          <Rect x={14.4} y={24} width={19.2} height={17.4} rx={8.7} fill={sk} />
          <Rect x={17.4} y={27.4} width={4.4} height={6} rx={2.2} fill={HI_STRONG} />
        </G>
      );
    }
    case 'lock':
      return (
        <G>
          <Ground cy={43} rx={12} />
          <Path d="M 16 22 v -5 a 8 8 0 0 1 16 0 v 5" stroke={palette.slate} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Rect x={11} y={21} width={26} height={20} rx={6} fill={dark(palette.slate, 0.2)} />
          <Rect x={11} y={21} width={26} height={17} rx={6} fill={palette.slate} />
          <Circle cx={24} cy={30} r={3.4} fill={palette.white} opacity={0.9} />
          <Rect x={14} y={24} width={4} height={7} rx={2} fill={HI} />
        </G>
      );

    /* ---------------- subject pills ---------------- */
    case 'subject-math':
      return (
        <G>
          <Path d="M 20 8 h 8 v 12 h 12 v 8 h -12 v 12 h -8 v -12 h -12 v -8 h 12 z" fill={shadeOf(ink)} transform="translate(0 1.6)" />
          <Path d="M 20 8 h 8 v 12 h 12 v 8 h -12 v 12 h -8 v -12 h -12 v -8 h 12 z" fill={ink} />
          <Rect x={21.4} y={10} width={3.2} height={9} rx={1.6} fill={HI_STRONG} />
        </G>
      );
    case 'subject-reading':
    case 'book':
      return (
        <G>
          <Path d="M 24 13 C 18 8 10 6.5 3 7.5 v 28 C 10 34.6 18 36 24 41 C 30 36 38 34.6 45 35.5 v -28 C 38 6.5 30 8 24 13 Z" fill={shadeOf(ink)} transform="translate(0 1.8)" />
          <Path d="M 24 13 C 18 8 10 6.5 3 7.5 v 28 C 10 34.6 18 36 24 41 C 30 36 38 34.6 45 35.5 v -28 C 38 6.5 30 8 24 13 Z" fill={ink} />
          <Path d="M 24 13 v 28" stroke="#B9C3DC" strokeWidth={2.4} />
          <Path d="M 9 15 h 10 M 9 21 h 10 M 29 15 h 10 M 29 21 h 10" stroke="#C8D4EA" strokeWidth={2.4} strokeLinecap="round" />
          <Path d="M 6 10.4 C 11 10.4 17 12 20.5 14.4" stroke={HI_STRONG} strokeWidth={2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'subject-english':
    case 'vocab':
    case 'beat-dialogue':
      return (
        <G>
          <Bubble shade={shadeOf(ink)} />
          <Circle cx={16} cy={26} r={3.4} fill="#8FA0C8" />
          <Circle cx={24} cy={26} r={3.4} fill="#8FA0C8" />
          <Circle cx={32} cy={26} r={3.4} fill="#8FA0C8" />
          <Path d="M 9 17.5 C 12 15 16 14 20 14" stroke={HI_STRONG} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'subject-spanish':
      return (
        <G>
          {/* two bubbles — a conversation across two languages */}
          <Path d="M 20 6 h 20 a 7 7 0 0 1 7 7 v 9 a 7 7 0 0 1 -7 7 h -20 a 7 7 0 0 1 -7 -7 v -9 a 7 7 0 0 1 7 -7 z" fill={lightOf(ink)} />
          <Path d="M 8 18 h 22 a 7.5 7.5 0 0 1 7.5 7.5 v 8 a 7.5 7.5 0 0 1 -7.5 7.5 h -12 l -8 6 l 1.4 -6 h -3.4 a 7.5 7.5 0 0 1 -7.5 -7.5 v -8 A 7.5 7.5 0 0 1 8 18 Z" fill={shadeOf(ink)} transform="translate(0 1.6)" />
          <Path d="M 8 18 h 22 a 7.5 7.5 0 0 1 7.5 7.5 v 8 a 7.5 7.5 0 0 1 -7.5 7.5 h -12 l -8 6 l 1.4 -6 h -3.4 a 7.5 7.5 0 0 1 -7.5 -7.5 v -8 A 7.5 7.5 0 0 1 8 18 Z" fill={ink} />
          <Circle cx={13.5} cy={29.5} r={2.9} fill="#8FA0C8" />
          <Circle cx={21} cy={29.5} r={2.9} fill="#8FA0C8" />
          <Circle cx={28.5} cy={29.5} r={2.9} fill="#8FA0C8" />
        </G>
      );
    case 'subject-logic':
    case 'bulb':
      return (
        <G>
          <Path d="M 24 5 A 15 15 0 0 1 39 20 C 39 27 34.5 30 32.5 34 h -17 C 13.5 30 9 27 9 20 A 15 15 0 0 1 24 5 Z" fill={shadeOf(ink)} transform="translate(0 1.8)" />
          <Path d="M 24 5 A 15 15 0 0 1 39 20 C 39 27 34.5 30 32.5 34 h -17 C 13.5 30 9 27 9 20 A 15 15 0 0 1 24 5 Z" fill={ink} />
          <Path d="M 24 14 v 20 M 19 20 l 5 5 l 5 -5" stroke={palette.safetyYellow} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x={16} y={35} width={16} height={5} rx={2.5} fill="#C8D4EA" />
          <Rect x={17.5} y={41} width={13} height={4.4} rx={2.2} fill="#8FA0C8" />
          <Path d="M 15 15 C 16.4 11.6 19 9.4 22 8.6" stroke={HI_STRONG} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'subject-teamwork':
    case 'crew':
      return (
        <G>
          {/* three neighbours, shoulder to shoulder */}
          <Circle cx={11} cy={17} r={6.4} fill={lightOf(ink)} />
          <Path d="M 1 40 C 1 31.5 5.4 27 11 27 C 16.6 27 21 31.5 21 40 Z" fill={lightOf(ink)} />
          <Circle cx={37} cy={17} r={6.4} fill={lightOf(ink)} />
          <Path d="M 27 40 C 27 31.5 31.4 27 37 27 C 42.6 27 47 31.5 47 40 Z" fill={lightOf(ink)} />
          <Circle cx={24} cy={14.5} r={8.4} fill={shadeOf(ink)} transform="translate(0 1.6)" />
          <Circle cx={24} cy={14.5} r={8.4} fill={ink} />
          <Path d="M 11 42 C 11 31 16.8 25.5 24 25.5 C 31.2 25.5 37 31 37 42 Z" fill={shadeOf(ink)} transform="translate(0 1.6)" />
          <Path d="M 11 42 C 11 31 16.8 25.5 24 25.5 C 31.2 25.5 37 31 37 42 Z" fill={ink} />
          <Path d="M 19 10.5 C 20.4 8.6 22 8 23.6 8" stroke={HI_STRONG} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'subject-cooking':
    case 'beat-kitchen':
      return (
        <G>
          {/* a frying pan, seen from above-front, with an egg */}
          <Rect x={30} y={17} width={18} height={6} rx={3} fill="rgba(31,42,90,0.22)" transform="rotate(-12 39 20)" />
          <Rect x={30} y={16} width={17} height={5} rx={2.5} fill="#8FA0C8" transform="rotate(-12 38.5 18.5)" />
          <Ellipse cx={21} cy={26} rx={18} ry={11.5} fill={shadeOf(ink)} transform="translate(0 2)" />
          <Ellipse cx={21} cy={26} rx={18} ry={11.5} fill={ink} />
          <Ellipse cx={21} cy={26} rx={14} ry={8.4} fill="#DDE5F4" />
          <Ellipse cx={21} cy={25.4} rx={7} ry={4.4} fill="#FFF6E5" />
          <Ellipse cx={21} cy={25.4} rx={3.2} ry={2.4} fill={palette.safetyYellow} />
          <Path d="M 9 22 C 11 19.6 14 18.4 17 18" stroke={HI_STRONG} strokeWidth={2.2} strokeLinecap="round" fill="none" />
        </G>
      );

    /* ---------------- mission beats ---------------- */
    case 'beat-travel':
    case 'truck':
      return (
        <G>
          <Ground cy={42} rx={17} />
          <Rect x={3} y={17} width={42} height={18} rx={5} fill={palette.engineRedDark} />
          <Rect x={3} y={17} width={42} height={15} rx={5} fill={palette.engineRed} />
          <Rect x={27} y={12} width={17} height={11} rx={4} fill={palette.engineRed} />
          <Rect x={30} y={15} width={10} height={6} rx={2.4} fill="#8FC9F2" />
          <Rect x={5} y={11} width={19} height={4} rx={2} fill="#DDE3F0" />
          <Rect x={6} y={7.4} width={5} height={4} rx={1.6} fill="#4FA3F7" />
          <Rect x={16} y={7.4} width={5} height={4} rx={1.6} fill={palette.safetyYellow} />
          <Rect x={3} y={26} width={42} height={3.6} fill={palette.safetyYellow} />
          <Circle cx={13} cy={36} r={6} fill="#39425F" />
          <Circle cx={35} cy={36} r={6} fill="#39425F" />
          <Circle cx={13} cy={36} r={2.8} fill="#C6CDE0" />
          <Circle cx={35} cy={36} r={2.8} fill="#C6CDE0" />
          <Rect x={6} y={19.4} width={12} height={3.4} rx={1.7} fill={HI} />
        </G>
      );
    case 'beat-scene':
    case 'pin':
      return (
        <G>
          <Ground cy={44} rx={9} />
          <Path d="M 24 4 A 14 14 0 0 1 38 18 C 38 29 24 43 24 43 C 24 43 10 29 10 18 A 14 14 0 0 1 24 4 Z" fill={palette.engineRedDark} />
          <Path d="M 24 6 A 12 12 0 0 1 36 18 C 36 27.6 24 40 24 40 C 24 40 12 27.6 12 18 A 12 12 0 0 1 24 6 Z" fill={palette.engineRed} />
          <Circle cx={24} cy={18} r={5.4} fill={palette.white} />
          <Path d="M 16 13 C 17.4 10.4 19.6 8.8 22 8.2" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'beat-recap':
    case 'cap':
      return (
        <G>
          <Ground cy={43} rx={14} />
          <Path d="M 24 8 L 46 18 L 24 28 L 2 18 Z" fill={dark(palette.navySoft, 0.3)} />
          <Path d="M 24 9.6 L 42.6 18 L 24 26.4 L 5.4 18 Z" fill={palette.navySoft} />
          <Path d="M 12 22 v 9 C 12 36 36 36 36 31 v -9 L 24 27.4 Z" fill={dark(palette.navySoft, 0.3)} />
          <Path d="M 13.4 23 v 8 C 13.4 34.6 34.6 34.6 34.6 31 v -8 L 24 27.4 Z" fill={palette.navySoft} />
          <Path d="M 44 19 v 12" stroke={palette.safetyYellow} strokeWidth={2.6} strokeLinecap="round" />
          <Circle cx={44} cy={33} r={3.4} fill={palette.safetyYellow} />
          <Path d="M 10 17 L 24 11.4 L 30 14" stroke={HI} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );

    /* ---------------- training stations ---------------- */
    case 'hose':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Path d="M 14 34 L 6 42" stroke="#3B4460" strokeWidth={7.5} strokeLinecap="round" />
          <Circle cx={6} cy={42} r={3.8} fill={palette.gold} />
          <Circle cx={24} cy={23} r={18} fill={palette.gold} />
          <Circle cx={24} cy={22} r={17} fill={palette.safetyYellow} />
          <Circle cx={24} cy={22} r={11.4} fill="#E5A400" />
          <Circle cx={24} cy={22} r={10.4} fill="#FFD75E" />
          <Circle cx={24} cy={22} r={5.4} fill="#B87F00" />
          <Path d="M 12 15 A 13.5 13.5 0 0 1 22 7.5" stroke={HI_STRONG} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 34 34 L 41 41" stroke={palette.engineRed} strokeWidth={6} strokeLinecap="round" />
        </G>
      );
    case 'tank':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Rect x={8} y={9} width={32} height={34} rx={8} fill="#B4C6DE" />
          <Rect x={9.6} y={10.6} width={28.8} height={30.8} rx={6.6} fill="#DFEBF8" />
          <Path d="M 9.6 26 h 28.8 v 8.8 a 6.6 6.6 0 0 1 -6.6 6.6 h -15.6 a 6.6 6.6 0 0 1 -6.6 -6.6 Z" fill={palette.waterCyanDark} />
          <Path d="M 9.6 26 h 28.8 v 6.6 h -28.8 Z" fill={palette.waterCyan} />
          <Path d="M 9.6 25.4 q 7.2 -3.4 14.4 0 q 7.2 3.4 14.4 0 v 3 q -7.2 3.4 -14.4 0 q -7.2 -3.4 -14.4 0 z" fill={palette.waterCyanLight} />
          <Rect x={13} y={13} width={4.4} height={9} rx={2.2} fill={HI_STRONG} />
          <Rect x={16} y={4} width={16} height={6} rx={3} fill="#8FA0C8" />
          <Path d="M 8 18 h -4 M 8 34 h -4" stroke={palette.navyMuted} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      );
    case 'ladder':
      return (
        <G>
          <Ground cy={45} rx={14} />
          {[13, 24, 35].map((y) => (
            <G key={y}>
              <Rect x={13} y={y + 1.4} width={22} height={5.6} rx={2.8} fill="#B4BCD4" />
              <Rect x={13} y={y} width={22} height={4.8} rx={2.4} fill="#DDE3F0" />
            </G>
          ))}
          <Rect x={9} y={4} width={7.5} height={40} rx={3.75} fill={palette.engineRedDark} />
          <Rect x={9} y={4} width={7.5} height={37} rx={3.75} fill={palette.engineRed} />
          <Rect x={31.5} y={4} width={7.5} height={40} rx={3.75} fill={palette.engineRedDark} />
          <Rect x={31.5} y={4} width={7.5} height={37} rx={3.75} fill={palette.engineRed} />
          <Rect x={10.6} y={7.4} width={2.8} height={12} rx={1.4} fill={HI} />
        </G>
      );
    case 'numbers':
    case 'count':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Rect x={5} y={7} width={38} height={36} rx={8} fill={palette.creamDeep} />
          <Rect x={5} y={7} width={38} height={32} rx={8} fill={palette.cream} />
          {([
            [14, 17, palette.engineRed],
            [24, 17, palette.safetyYellow],
            [34, 17, palette.waterCyan],
            [14, 30, palette.leafGreen],
            [24, 30, palette.purple],
            [34, 30, palette.orange],
          ] as [number, number, string][]).map(([cx, cy, c], i) => (
            <G key={i}>
              <Circle cx={cx} cy={cy + 0.9} r={5.4} fill={dark(c, 0.24)} />
              <Circle cx={cx} cy={cy} r={5} fill={c} />
              <Circle cx={cx - 1.7} cy={cy - 1.8} r={1.5} fill={HI_STRONG} />
            </G>
          ))}
        </G>
      );
    case 'radio':
      return (
        <G>
          <Ground cy={46} rx={13} />
          <Walkie />
        </G>
      );
    case 'equipment':
      return (
        <G>
          <Ground cy={45} rx={14} />
          <Path d="M 15 12 C 15 6 33 6 33 12" stroke={dark(palette.leafGreen, 0.3)} strokeWidth={4} fill="none" strokeLinecap="round" />
          <Rect x={7} y={11} width={34} height={33} rx={9} fill={dark(palette.leafGreen, 0.26)} />
          <Rect x={7} y={11} width={34} height={29} rx={9} fill={palette.leafGreen} />
          <Rect x={12} y={22} width={24} height={14} rx={5} fill={lite(palette.leafGreen, 0.42)} />
          <Rect x={19} y={26} width={10} height={6} rx={3} fill={palette.safetyYellow} />
          <Rect x={11} y={15} width={6} height={9} rx={3} fill={HI} />
          <Rect x={7} y={17} width={34} height={3.4} fill={SHADE} />
        </G>
      );
    case 'gear':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Rect x={19} y={5} width={10} height={5} rx={2.5} fill="#5B6588" />
          <Rect x={4} y={16} width={40} height={27} rx={6} fill={palette.engineRedDark} />
          <Rect x={4} y={16} width={40} height={23} rx={6} fill={palette.engineRed} />
          <Rect x={4} y={24} width={40} height={4} fill={SHADE} />
          <Rect x={17} y={9} width={14} height={9} rx={3} fill="#5B6588" />
          <Rect x={18.6} y={10.4} width={10.8} height={4.4} rx={2.2} fill="#8FA0C8" />
          <Rect x={19} y={26} width={10} height={5} rx={2.5} fill={palette.safetyYellow} />
          <Rect x={8} y={19} width={12} height={3.4} rx={1.7} fill={HI} />
        </G>
      );
    case 'path':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Rect x={5} y={6} width={38} height={36} rx={9} fill={palette.tanDark} />
          <Rect x={5} y={6} width={38} height={32} rx={9} fill={palette.tan} />
          {/* a pipe elbow, the piece the child turns */}
          <Path d="M 12 30 h 8 a 8 8 0 0 1 8 -8 v -8" stroke={dark(palette.waterCyan, 0.3)} strokeWidth={11} strokeLinecap="round" fill="none" />
          <Path d="M 12 29 h 8 a 8 8 0 0 1 8 -8 v -8" stroke={palette.waterCyan} strokeWidth={8.4} strokeLinecap="round" fill="none" />
          <Path d="M 12 27 h 6" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={12} cy={29} r={3} fill={palette.waterCyanLight} />
          <Circle cx={28} cy={13} r={3} fill={palette.waterCyanLight} />
        </G>
      );
    case 'route':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Path d="M 4 12 L 18 7 L 32 13 L 44 8 v 30 L 32 43 L 18 37 L 4 42 Z" fill={dark(palette.grass, 0.3)} />
          <Path d="M 5.4 13.4 L 18 9 L 32 15 L 42.6 10.4 v 26.6 L 32 41.4 L 18 35.4 L 5.4 39.8 Z" fill={palette.grass} />
          <Path d="M 18 9 v 26.4 M 32 15 v 26.4" stroke={dark(palette.grass, 0.28)} strokeWidth={2} opacity={0.7} />
          <Path d="M 8 32 C 14 26 16 20 24 20 C 32 20 34 30 40 26" stroke={palette.cream} strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M 31 15.5 A 7.5 7.5 0 0 1 46 15.5 C 46 21.4 38.5 29 38.5 29 C 38.5 29 31 21.4 31 15.5 Z" fill={palette.engineRedDark} />
          <Path d="M 32.6 15.5 A 6 6 0 0 1 44.6 15.5 C 44.6 20.4 38.6 26.6 38.6 26.6 C 38.6 26.6 32.6 20.4 32.6 15.5 Z" fill={palette.engineRed} />
          <Circle cx={38.6} cy={15.5} r={2.6} fill={palette.white} />
        </G>
      );
    case 'hydrant':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Rect x={17} y={5} width={14} height={4.6} rx={2.3} fill={palette.engineRedDark} />
          <Circle cx={24} cy={6} r={3.8} fill={palette.engineRed} />
          <Path d="M 15 11 h 18 v 24 a 5 5 0 0 1 -5 5 h -8 a 5 5 0 0 1 -5 -5 z" fill={palette.engineRedDark} />
          <Path d="M 16 12 h 15 v 23 a 4 4 0 0 1 -4 4 h -7 a 4 4 0 0 1 -4 -4 z" fill={palette.engineRed} />
          <Rect x={6.5} y={17} width={9} height={8} rx={3} fill={palette.engineRedDark} />
          <Rect x={32.5} y={17} width={9} height={8} rx={3} fill={palette.engineRedDark} />
          <Circle cx={9} cy={21} r={2.4} fill={palette.gold} />
          <Circle cx={39} cy={21} r={2.4} fill={palette.gold} />
          <Rect x={11} y={38} width={26} height={5} rx={2.5} fill="#B9261C" />
          <Rect x={18.4} y={14.4} width={3.4} height={12} rx={1.7} fill={HI} />
        </G>
      );
    case 'spray':
      return (
        <G>
          <Ground cy={44} rx={16} />
          {/* an arc of water — the spray pattern the child chooses */}
          {([
            [20, palette.waterCyanDark],
            [15, palette.waterCyan],
            [10, palette.waterCyanLight],
          ] as [number, string][]).map(([r, c], i) => (
            <Path key={i} d={`M ${24 - r - 4} 38 A ${r + 4} ${r + 4} 0 0 1 ${24 + r + 4} 38`} stroke={c} strokeWidth={5} strokeLinecap="round" fill="none" />
          ))}
          <Path d="M 10 30 A 18 18 0 0 1 18 19" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
          <Circle cx={24} cy={38} r={4.4} fill="#5B6588" />
          <Circle cx={24} cy={38} r={2.4} fill={palette.waterCyanLight} />
        </G>
      );
    case 'clock':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Circle cx={24} cy={24} r={19} fill={dark(palette.tan, 0.28)} />
          <Circle cx={24} cy={23} r={18} fill={palette.tan} />
          <Circle cx={24} cy={23} r={14.4} fill={palette.cream} />
          {[0, 90, 180, 270].map((deg) => (
            <Rect key={deg} x={23} y={10.4} width={2} height={4.4} rx={1} fill={palette.navyMuted} transform={`rotate(${deg} 24 23)`} />
          ))}
          <Path d="M 24 23 v -9" stroke={palette.navy} strokeWidth={3} strokeLinecap="round" />
          <Path d="M 24 23 l 6.4 4" stroke={palette.navy} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={24} cy={23} r={2.2} fill={palette.engineRed} />
          <Ellipse cx={16} cy={14} rx={4.4} ry={2.8} fill={HI_STRONG} transform="rotate(-32 16 14)" />
        </G>
      );
    case 'barrier':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Rect x={9} y={22} width={4.4} height={21} rx={2.2} fill="#8FA0C8" />
          <Rect x={34.6} y={22} width={4.4} height={21} rx={2.2} fill="#8FA0C8" />
          <Rect x={4} y={13} width={40} height={13} rx={4} fill={palette.engineRedDark} />
          <Rect x={4} y={13} width={40} height={11} rx={4} fill={palette.white} />
          {[0, 1, 2, 3].map((i) => (
            <Path key={i} d={`M ${7 + i * 10} 13 l 7 0 l -7 11 l -7 0 z`} fill={palette.engineRed} />
          ))}
          <Rect x={4} y={13} width={40} height={3.4} rx={1.7} fill={HI} />
        </G>
      );
    case 'signals':
      return (
        <G>
          <Ground cy={45} rx={11} />
          <Rect x={21.4} y={34} width={5.2} height={10} rx={2.6} fill="#8FA0C8" />
          <Rect x={13} y={4} width={22} height={34} rx={9} fill="#232C52" />
          <Rect x={13} y={4} width={22} height={31} rx={9} fill="#39425F" />
          <Circle cx={24} cy={13} r={5.2} fill={palette.engineRed} />
          <Circle cx={24} cy={23} r={5.2} fill={palette.safetyYellow} />
          <Circle cx={24} cy={33} r={5.2} fill={palette.leafGreen} />
          <Circle cx={22.4} cy={11.4} r={1.7} fill={HI_STRONG} />
          <Rect x={15} y={7} width={4} height={10} rx={2} fill={HI} />
        </G>
      );
    case 'listen':
      return (
        <G>
          <Ground cy={45} rx={13} />
          {/* an ear with sound arriving */}
          <Path d="M 26 5 C 34 5 39 11 39 19 C 39 27 33 28 31 33 C 29.4 37 30 43 24 43 C 19 43 16 39 16 34 L 16 19 C 16 11 18 5 26 5 Z" fill={mix('#FFD3B0', palette.navy, 0.16)} />
          <Path d="M 26 7 C 33 7 37 12 37 19 C 37 26 31.4 27.4 29.4 32.2 C 28 36 28.4 41 24 41 C 20 41 18 38 18 34 L 18 19 C 18 12 20 7 26 7 Z" fill="#FFD3B0" />
          <Path d="M 26 14 C 30 14 32 17 31 21 C 30 25 26 25 26 29" stroke={mix('#FFD3B0', palette.navy, 0.28)} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 8 15 a 9 9 0 0 1 0 14 M 3 10 a 16 16 0 0 1 0 24" stroke={palette.waterCyan} strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M 22 10 C 24 9 26 9 28 9.6" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'pizza':
      return (
        <G>
          <Ground cy={45} rx={16} />
          <Path d="M 24 4 L 44 40 A 4 4 0 0 1 40 44 L 8 44 A 4 4 0 0 1 4 40 Z" fill="#E0A800" />
          <Path d="M 24 9 L 40.6 40 L 7.4 40 Z" fill="#FFD75E" />
          <Path d="M 24 13 L 37.4 38 L 10.6 38 Z" fill="#E63B2E" />
          <Path d="M 24 16 L 34.8 36.4 L 13.2 36.4 Z" fill="#FFC72C" />
          <Circle cx={24} cy={24} r={3.2} fill={palette.engineRed} />
          <Circle cx={18} cy={32} r={2.8} fill={palette.engineRed} />
          <Circle cx={30} cy={32} r={2.6} fill={palette.engineRed} />
          <Path d="M 21 29 q 3 -3 6 0" stroke={palette.leafGreen} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M 20 10 L 24 6.4 L 28 10" stroke={HI} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'measure':
      return (
        <G>
          <Ground cy={45} rx={15} />
          {/* the measuring cup, with a handle in FRONT so it reads as a cup */}
          <Path d="M 8 13 h 27 l -3 26 a 6 6 0 0 1 -6 5 h -12 a 6 6 0 0 1 -6 -5 z" fill="#B4C6DE" />
          <Path d="M 9.6 14.6 h 23.8 l -2.8 24 a 4.6 4.6 0 0 1 -4.6 4 h -11 a 4.6 4.6 0 0 1 -4.6 -4 z" fill="#EAF2FB" />
          <Path d="M 10.6 25 h 21.6 l -1.8 15.4 a 4 4 0 0 1 -4 3.6 h -10 a 4 4 0 0 1 -4 -3.6 z" fill={palette.waterCyanDark} />
          <Path d="M 10.6 25 h 21.6 l -0.7 6 h -20.2 z" fill={palette.waterCyan} />
          <Path d="M 26 20 h 5 M 26.6 32 h 4.4" stroke={palette.navyMuted} strokeWidth={2} strokeLinecap="round" />
          <Path d="M 34.6 18 C 43 18 45 24 45 28 C 45 33 40 36 34 36" stroke="#B4C6DE" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M 34.6 19.4 C 41.6 19.4 43.4 24.4 43.4 28 C 43.4 32 39.4 34.6 34.4 34.6" stroke="#EAF2FB" strokeWidth={3.4} fill="none" strokeLinecap="round" />
          <Rect x={12} y={17} width={3.4} height={8} rx={1.7} fill={HI_STRONG} />
        </G>
      );
    case 'share':
      return (
        <G>
          <Ground cy={45} rx={17} />
          <Ellipse cx={24} cy={27} rx={20} ry={15} fill="#B4C6DE" />
          <Ellipse cx={24} cy={25.6} rx={19} ry={14} fill={palette.white} />
          <Ellipse cx={24} cy={25.6} rx={14} ry={10} fill="#EAF2FB" />
          {/* three fair shares */}
          <Path d="M 24 25.6 L 24 15.6 A 10 10 0 0 1 32.7 30.6 Z" fill={palette.orange} />
          <Path d="M 24 25.6 L 32.7 30.6 A 10 10 0 0 1 15.3 30.6 Z" fill={palette.safetyYellow} />
          <Path d="M 24 25.6 L 15.3 30.6 A 10 10 0 0 1 24 15.6 Z" fill={palette.leafGreen} />
          <Circle cx={24} cy={25.6} r={2.4} fill={palette.white} />
          <Path d="M 10 20 C 12 17.4 15.4 15.4 19 14.6" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'scale':
      return (
        <G>
          <Ground cy={45} rx={15} />
          <Rect x={21.4} y={12} width={5.2} height={28} rx={2.6} fill="#8FA0C8" />
          <Rect x={12} y={40} width={24} height={5} rx={2.5} fill="#5B6588" />
          <Rect x={7} y={10} width={34} height={4.4} rx={2.2} fill="#5B6588" />
          <Circle cx={24} cy={12.2} r={4} fill={palette.safetyYellow} />
          {/* the two pans, one a touch lower than the other */}
          <Path d="M 3 18 h 18 l -4.4 8 a 5 5 0 0 1 -9.2 0 z" fill={dark(palette.engineRed, 0.24)} />
          <Path d="M 4.4 19 h 15.2 l -3.6 6.4 a 4 4 0 0 1 -8 0 z" fill={palette.engineRed} />
          <Path d="M 27 22 h 18 l -4.4 8 a 5 5 0 0 1 -9.2 0 z" fill={dark(palette.waterCyan, 0.28)} />
          <Path d="M 28.4 23 h 15.2 l -3.6 6.4 a 4 4 0 0 1 -8 0 z" fill={palette.waterCyan} />
          <Path d="M 12 14.4 v 4 M 36 14.4 v 8" stroke="#8FA0C8" strokeWidth={2.2} strokeLinecap="round" />
          <Rect x={6} y={20} width={5} height={2.6} rx={1.3} fill={HI_STRONG} />
        </G>
      );

    /* ---------------- odds and ends ---------------- */
    case 'cone':
      return (
        <G>
          <Ground cy={44} rx={16} />
          <Path d="M 24 4 C 27 4 28.8 6 29.6 9.6 L 37 39 L 11 39 L 18.4 9.6 C 19.2 6 21 4 24 4 Z" fill={palette.orangeDark} />
          <Path d="M 24 5.6 C 26.6 5.6 28 7.4 28.6 10.4 L 35 38 L 13 38 L 19.4 10.4 C 20 7.4 21.4 5.6 24 5.6 Z" fill={palette.orange} />
          <Path d="M 20.6 19 L 27.4 19 L 28.8 27 L 19.2 27 Z" fill={palette.white} />
          <Path d="M 22 8 L 20.6 15" stroke={HI_STRONG} strokeWidth={2.4} strokeLinecap="round" />
          <Rect x={5} y={38} width={38} height={7.5} rx={3.75} fill={palette.orangeDark} />
          <Rect x={5} y={38} width={38} height={5.4} rx={2.7} fill={palette.orange} />
        </G>
      );
    case 'chef-hat':
      return (
        <G>
          <Ground cy={45} rx={13} />
          <Circle cx={13} cy={19} r={9.4} fill="#DDE5F4" />
          <Circle cx={35} cy={19} r={9.4} fill="#DDE5F4" />
          <Circle cx={24} cy={14} r={11.4} fill="#DDE5F4" />
          <Circle cx={13.6} cy={18} r={8.4} fill={palette.white} />
          <Circle cx={34.4} cy={18} r={8.4} fill={palette.white} />
          <Circle cx={24} cy={13} r={10.4} fill={palette.white} />
          <Rect x={12} y={26} width={24} height={16} rx={5} fill="#DDE5F4" />
          <Rect x={12} y={26} width={24} height={12.4} rx={5} fill={palette.white} />
          <Path d="M 16 32 h 16" stroke="#C8D4EA" strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M 17 8.6 C 19 6.4 21.4 5.4 23.6 5.4" stroke={HI_STRONG} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </G>
      );
    default:
      return null;
  }
}

/** Ids other components use that map onto a canonical glyph. */
const ALIAS: Record<string, GlyphId> = {
  math: 'subject-math',
  reading: 'subject-reading',
  english: 'subject-english',
  spanish: 'subject-spanish',
  logic: 'subject-logic',
  teamwork: 'subject-teamwork',
  cooking: 'subject-cooking',
  dialogue: 'beat-dialogue',
  minigame: 'beat-minigame',
  travel: 'beat-travel',
  scene: 'beat-scene',
  kitchen: 'beat-kitchen',
  recap: 'beat-recap',
  speech: 'beat-dialogue',
  map: 'route',
  people: 'subject-teamwork',
  pan: 'subject-cooking',
  plus: 'subject-math',
  hand: 'wave',
  sparkle: 'spark',
};

export interface GlyphIconProps {
  /** any id from `glyphIds` (or an alias); an unknown id renders nothing */
  id: GlyphId | string;
  size?: number;
  /** the empty / not-yet state — a soft socket, never a cross */
  muted?: boolean;
  /**
   * The seven subject marks are authored white-forward for a coloured pill.
   * On a pale tile pass the subject's own strong hue so they still read.
   */
  ink?: string;
  /** screen-reader label; defaults to the id read as words */
  label?: string;
}

/**
 * One drawn mark. Every UI glyph in the app comes from here so a flame in a
 * counter, a flame on a badge and a flame in a scene are the same flame.
 */
export function GlyphIcon({ id, size = 32, muted = false, label, ink = palette.white }: GlyphIconProps) {
  const key = (ALIAS[id] ?? id) as string;
  if (!isGlyph(key)) return null;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} accessibilityLabel={label ?? key.replace(/^(subject|beat)-/, '').replace(/-/g, ' ')}>
      <Art id={key} muted={muted} ink={ink} />
    </Svg>
  );
}

/** True when `id` (or its alias) has art — lets callers pick a fallback. */
export const hasGlyph = (id: string): boolean => isGlyph(ALIAS[id] ?? id);
