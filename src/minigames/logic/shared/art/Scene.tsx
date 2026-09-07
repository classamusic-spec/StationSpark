/**
 * PLAY-AREA SCENERY — the room each logic game is played in.
 *
 * The problem this file exists to solve: a full-screen backdrop does not know
 * where the play area is. Its dressing lands behind the task bar (so a pinned
 * map arrives cropped at the top edge) and its middle band lands nowhere at all
 * (so the child gets a slab of undifferentiated grey). Everything here is drawn
 * in *play-area* coordinates instead — the box is measured with `usePlayBox()`
 * and the SVG viewBox is exactly that box, so nothing can be cropped by chrome
 * and nothing can float in a void.
 *
 * House rules obeyed (docs/ART_CRITIQUE.md "Consistency rules"):
 *  1. no outlines — shapes separate by value
 *  2. three tones per object: base → navy 14 % shade → white 32 % highlight
 *  3. a navy contact ellipse under everything that stands on something
 *  4. radii from the theme, no hard 90° corners in the world layer
 *  5. no emoji
 *  6. palette tokens only, ≤ 5 hues + neutrals per composition
 *  7. one ground plane with a soft lip; no undressed band
 *  8. buildings are 2.5D: side plane, soffit, sills, cast shadow
 *  9. every scene idles (one drifting or swaying element, reduced-motion aware)
 * 10. one motif per job
 *
 * Scenery is never interactive: every layer here is `pointerEvents="none"`.
 */
import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { palette, radii } from '@/theme';
import { useLoop } from '@/hooks';

/* ------------------------------------------------------------------ */
/* Tones                                                               */
/* ------------------------------------------------------------------ */

export const SHADE = 'rgba(31,42,90,0.14)';
export const SHADE_SOFT = 'rgba(31,42,90,0.07)';
export const SHADE_DEEP = 'rgba(31,42,90,0.24)';
export const HILITE = 'rgba(255,255,255,0.32)';
export const HILITE_SOFT = 'rgba(255,255,255,0.16)';
export const HILITE_STRONG = 'rgba(255,255,255,0.55)';

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ------------------------------------------------------------------ */
/* The measured play box                                               */
/* ------------------------------------------------------------------ */

export interface PlayBox {
  w: number;
  h: number;
  /** uniform prop scale for this box (1 ≈ a 390 × 520 phone play area) */
  s: number;
}

const EMPTY: PlayBox = { w: 0, h: 0, s: 1 };

/**
 * Measure the play area so scenery and the activity can both be sized against
 * the room they really have. Returns a stable box and the `onLayout` to attach.
 */
export function usePlayBox(): { box: PlayBox; onLayout: (e: LayoutChangeEvent) => void } {
  const [box, setBox] = useState<PlayBox>(EMPTY);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) =>
      Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1
        ? prev
        : { w: width, h: height, s: clamp(Math.min(width / 390, height / 520), 0.7, 2.1) },
    );
  }, []);
  return { box, onLayout };
}

/** True once the box has been measured and is worth drawing into. */
export const boxReady = (box: PlayBox) => box.w > 8 && box.h > 8;

/**
 * An SVG layer that fills the measured play area exactly, in px coordinates.
 * Children are plain SVG nodes; nothing here ever takes a touch.
 */
export function SceneLayer({ box, children }: { box: PlayBox; children: React.ReactNode }) {
  if (!boxReady(box)) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
        {children}
      </Svg>
    </View>
  );
}

/**
 * The quiet full-bleed wash behind everything, including behind the task bar.
 * It carries NO detail on purpose: detail belongs inside the play box where it
 * cannot be cropped. One per screen (it owns its gradient id).
 */
export const RoomWash = memo(function RoomWash({ top, bottom }: { top: string; bottom: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="ssWash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#ssWash)" />
      </Svg>
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* Small shared shapes                                                 */
/* ------------------------------------------------------------------ */

/** Rule 3: everything that stands on something gets a navy contact ellipse. */
export function Contact({ cx, cy, rx, o = 0.12 }: { cx: number; cy: number; rx: number; o?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(2, rx * 0.22)} fill={palette.navy} opacity={o} />;
}

/** A ground plane with a soft top lip (rule 7) — never a hard-edged band. */
export function Ground({ w, h, top, near, lip }: { w: number; h: number; top: number; near: string; lip: string }) {
  const edge = `M 0 ${top + 7} Q ${w / 2} ${top - 4} ${w} ${top + 7}`;
  return (
    <G>
      <Path d={`${edge} L ${w} ${h} L 0 ${h} Z`} fill={near} />
      <Path d={`${edge} L ${w} ${top + 15} Q ${w / 2} ${top + 4} 0 ${top + 15} Z`} fill={lip} />
    </G>
  );
}

/** A shelf board on two brackets — the store room's one shelf motif. */
export function Shelf({ x, y, w, s, tone = palette.wood }: { x: number; y: number; w: number; s: number; tone?: string }) {
  const t = Math.max(6, 9 * s);
  return (
    <G>
      <Rect x={x} y={y} width={w} height={t} rx={t / 2} fill={tone} />
      <Rect x={x} y={y} width={w} height={t * 0.34} rx={t * 0.17} fill={HILITE} />
      <Rect x={x} y={y + t} width={w} height={t * 0.4} rx={t * 0.2} fill={SHADE} />
      {[x + w * 0.1, x + w * 0.9].map((bx) => (
        <G key={`br${bx}`}>
          <Path d={`M ${bx - 9 * s} ${y + t} h ${18 * s} l ${-9 * s} ${18 * s} z`} fill={palette.woodDark} />
          <Path d={`M ${bx - 9 * s} ${y + t} h ${6 * s} l ${-3 * s} ${11 * s} z`} fill={HILITE_SOFT} />
        </G>
      ))}
    </G>
  );
}

/** A pinned sheet of paper — notices, rotas, drawings. */
export function Notice({
  x,
  y,
  w,
  h,
  s,
  tint = palette.white,
  lines = 3,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  tint?: string;
  lines?: number;
}) {
  return (
    <G>
      <Rect x={x + 2} y={y + 3} width={w} height={h} rx={5} fill={SHADE_SOFT} />
      <Rect x={x} y={y} width={w} height={h} rx={5} fill={tint} />
      <Rect x={x} y={y} width={w} height={h * 0.2} rx={4} fill={HILITE} />
      {Array.from({ length: lines }, (_, i) => (
        <Rect
          key={`nl${i}`}
          x={x + w * 0.12}
          y={y + h * (0.34 + i * 0.2)}
          width={w * (i % 2 ? 0.5 : 0.72)}
          height={Math.max(2, 3 * s)}
          rx={1.6}
          fill={palette.navyMuted}
          opacity={0.4}
        />
      ))}
      <Circle cx={x + w / 2} cy={y + 5 * s} r={4 * s} fill={palette.engineRed} />
      <Circle cx={x + w / 2 - 1.2 * s} cy={y + 3.6 * s} r={1.4 * s} fill={HILITE_STRONG} />
    </G>
  );
}

/** A coil of hose hanging on a peg — station dressing, drawn once. */
export function HoseCoil({ cx, cy, r, tone = palette.engineRed }: { cx: number; cy: number; r: number; tone?: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={tone} />
      <Circle cx={cx} cy={cy} r={r * 0.74} fill={palette.engineRedDark} opacity={0.5} />
      <Circle cx={cx} cy={cy} r={r * 0.52} fill={tone} />
      <Circle cx={cx} cy={cy} r={r * 0.3} fill={palette.charcoal} />
      <Path
        d={`M ${cx - r * 0.72} ${cy - r * 0.3} a ${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.5} ${-r * 0.5}`}
        stroke={HILITE_STRONG}
        strokeWidth={Math.max(2, r * 0.14)}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

/** The station helmet, hanging or standing. */
export function HelmetProp({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Path d={`M ${cx - r} ${cy} q 0 ${-r * 1.15} ${r} ${-r * 1.15} q ${r} 0 ${r} ${r * 1.15} z`} fill={palette.engineRed} />
      <Path d={`M ${cx - r * 1.24} ${cy} h ${r * 2.48} a ${r * 0.24} ${r * 0.24} 0 0 1 0 ${r * 0.34} h ${-r * 2.48} a ${r * 0.24} ${r * 0.24} 0 0 1 0 ${-r * 0.34} z`} fill={palette.engineRedDark} />
      <Path d={`M ${cx - r * 0.7} ${cy - r * 0.34} q ${r * 0.2} ${-r * 0.62} ${r * 0.5} ${-r * 0.72}`} stroke={HILITE_STRONG} strokeWidth={Math.max(2, r * 0.16)} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx} ${cy - r * 0.92} l ${r * 0.2} ${r * 0.34} l ${-r * 0.2} ${r * 0.28} l ${-r * 0.2} ${-r * 0.28} z`} fill={palette.safetyYellow} />
    </G>
  );
}

/** A mug on a desk — the smallest, warmest piece of dressing we own. */
export function Mug({ x, baseY, s, tint = palette.cream }: { x: number; baseY: number; s: number; tint?: string }) {
  const w = 26 * s;
  const h = 28 * s;
  return (
    <G>
      <Contact cx={x + w / 2} cy={baseY + 2} rx={w * 0.62} />
      <Rect x={x} y={baseY - h} width={w} height={h} rx={7 * s} fill={tint} />
      <Rect x={x} y={baseY - h} width={w * 0.34} height={h} rx={6 * s} fill={HILITE} />
      <Rect x={x} y={baseY - h} width={w} height={5 * s} rx={2.5 * s} fill={SHADE_SOFT} />
      <Path
        d={`M ${x + w} ${baseY - h * 0.72} a ${8 * s} ${8 * s} 0 0 1 0 ${14 * s}`}
        stroke={tint}
        strokeWidth={5 * s}
        fill="none"
      />
      <Rect x={x + w * 0.2} y={baseY - h * 0.42} width={w * 0.6} height={4 * s} rx={2 * s} fill={palette.engineRed} opacity={0.7} />
    </G>
  );
}

/**
 * A station wall clock. Every room we draw is a working room, and a working
 * room has a clock on it — it is the cheapest way to make a bare band of wall
 * read as somewhere rather than as paint.
 */
export function WallClock({ cx, cy, r, tone = palette.engineRed }: { cx: number; cy: number; r: number; tone?: string }) {
  return (
    <G>
      <Circle cx={cx} cy={cy + r * 0.06} r={r} fill={SHADE_SOFT} />
      <Circle cx={cx} cy={cy} r={r} fill={tone} />
      <Circle cx={cx} cy={cy} r={r * 0.84} fill={palette.cream} />
      <Path d={`M ${cx - r} ${cy} a ${r} ${r} 0 0 1 ${r} ${-r} l 0 ${r * 0.16} a ${r * 0.84} ${r * 0.84} 0 0 0 ${-r * 0.84} ${r * 0.84} z`} fill={HILITE_STRONG} opacity={0.5} />
      {/* four quarter ticks concatenated into one path — never four nodes */}
      <Path
        d={
          `M ${cx - 1.6} ${cy - r * 0.74} h 3.2 v ${r * 0.2} h -3.2 z ` +
          `M ${cx - 1.6} ${cy + r * 0.54} h 3.2 v ${r * 0.2} h -3.2 z ` +
          `M ${cx - r * 0.74} ${cy - 1.6} h ${r * 0.2} v 3.2 h ${-r * 0.2} z ` +
          `M ${cx + r * 0.54} ${cy - 1.6} h ${r * 0.2} v 3.2 h ${-r * 0.2} z`
        }
        fill={palette.navyMuted}
        opacity={0.55}
      />
      <Path d={`M ${cx} ${cy} L ${cx + r * 0.36} ${cy - r * 0.3}`} stroke={palette.navy} strokeWidth={Math.max(2, r * 0.13)} strokeLinecap="round" />
      <Path d={`M ${cx} ${cy} L ${cx - r * 0.12} ${cy - r * 0.6}`} stroke={palette.navy} strokeWidth={Math.max(1.6, r * 0.09)} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={Math.max(1.8, r * 0.1)} fill={palette.safetyYellow} />
    </G>
  );
}

/**
 * A framed picture on a wall — mount, frame, glass sheen, and a simple drawn
 * motif so the frame is never an empty rectangle.
 */
export function Poster({
  x,
  y,
  w,
  h,
  s,
  motif = 'engine',
  frame = palette.wood,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  motif?: 'engine' | 'hills' | 'helmet';
  frame?: string;
}) {
  const ix = x + 5 * s;
  const iy = y + 5 * s;
  const iw = w - 10 * s;
  const ih = h - 10 * s;
  return (
    <G>
      <Rect x={x + 2} y={y + 4} width={w} height={h} rx={7} fill={SHADE_SOFT} />
      <Rect x={x} y={y} width={w} height={h} rx={7} fill={frame} />
      <Rect x={x} y={y} width={w} height={h - 4 * s} rx={7} fill={HILITE_SOFT} />
      <Rect x={ix} y={iy} width={iw} height={ih} rx={3} fill={motif === 'hills' ? '#CFEAFF' : palette.panel} />
      {motif === 'engine' ? (
        <G>
          <Rect x={ix + iw * 0.12} y={iy + ih * 0.46} width={iw * 0.72} height={ih * 0.28} rx={4} fill={palette.engineRed} />
          <Rect x={ix + iw * 0.12} y={iy + ih * 0.46} width={iw * 0.72} height={ih * 0.09} rx={3} fill={HILITE} />
          <Rect x={ix + iw * 0.12} y={iy + ih * 0.68} width={iw * 0.72} height={ih * 0.07} rx={3} fill={palette.safetyYellow} />
          <Circle cx={ix + iw * 0.28} cy={iy + ih * 0.78} r={Math.max(2, ih * 0.07)} fill={palette.charcoal} />
          <Circle cx={ix + iw * 0.7} cy={iy + ih * 0.78} r={Math.max(2, ih * 0.07)} fill={palette.charcoal} />
        </G>
      ) : motif === 'hills' ? (
        <G>
          <Circle cx={ix + iw * 0.74} cy={iy + ih * 0.3} r={Math.max(3, ih * 0.14)} fill={palette.safetyYellow} />
          <Path d={`M ${ix} ${iy + ih} L ${ix + iw * 0.36} ${iy + ih * 0.42} L ${ix + iw * 0.66} ${iy + ih} z`} fill={palette.grass} />
          <Path d={`M ${ix + iw * 0.4} ${iy + ih} L ${ix + iw * 0.76} ${iy + ih * 0.54} L ${ix + iw} ${iy + ih} z`} fill={palette.grassDark} />
        </G>
      ) : (
        <G>
          <HelmetProp cx={ix + iw / 2} cy={iy + ih * 0.66} r={Math.min(iw, ih) * 0.3} />
        </G>
      )}
      <Path d={`M ${ix} ${iy + ih} L ${ix + iw * 0.44} ${iy} L ${ix + iw * 0.62} ${iy} L ${ix + iw * 0.18} ${iy + ih} z`} fill={HILITE_SOFT} />
    </G>
  );
}

/**
 * Paving joints for a ground plane, as ONE path.
 *
 * A flat slab of colour across the foot of a scene is the single most common
 * way a backdrop goes bland, and the cure is texture rather than props: the
 * ground gets a running bond of joints, so it reads as a surface with a size.
 */
export function Paving({
  w,
  top,
  bottom,
  s,
  unit = 74,
  tone = SHADE_SOFT,
}: {
  w: number;
  top: number;
  bottom: number;
  s: number;
  unit?: number;
  tone?: string;
}) {
  const step = Math.max(22, unit * s);
  const rows = Math.max(1, Math.ceil((bottom - top) / (step * 0.42)));
  let d = '';
  for (let r = 0; r < rows; r += 1) {
    const y = top + (r + 1) * step * 0.42;
    if (y > bottom) break;
    d += `M 0 ${y.toFixed(1)} h ${w.toFixed(1)} v 2 h ${(-w).toFixed(1)} z `;
    const offset = r % 2 ? step / 2 : 0;
    for (let c = 0; c * step + offset < w + step; c += 1) {
      const x = c * step + offset;
      d += `M ${x.toFixed(1)} ${y.toFixed(1)} h 2 v ${(-step * 0.42).toFixed(1)} h -2 z `;
    }
  }
  return <Path d={d} fill={tone} />;
}

/* ------------------------------------------------------------------ */
/* Light and material                                                  */
/* ------------------------------------------------------------------ */

/**
 * THE LIGHT IN THE ROOM.
 *
 * Every surface in this file is lit from the upper left (ART_DIRECTION), but a
 * vertical gradient on a wall only says "brighter at the top" — it is ambient,
 * not directional, and a room built out of ambient gradients still reads as a
 * sheet of stickers. This is the envelope that ties a whole scene into ONE
 * light: a soft key wash falling in from the top-left corner and the ambient
 * occlusion that gathers in the opposite one.
 *
 * It is drawn LAST in a room, over the props, because that is what makes it
 * lighting rather than another painted shape — the near corner of the floor,
 * the shaded flank of a shopfront and the underside of a desk all darken
 * together. Two nodes and two gradients for the whole room; nothing per-frame.
 *
 * Only one room is ever mounted at a time, so the gradient ids are fixed.
 */
export function SceneLight({
  w,
  h,
  /** strength of the key wash falling in from the upper left */
  keyLight = 0.13,
  /** strength of the occlusion gathering in the lower right */
  ambient = 0.13,
  /** the colour of the key — white indoors, a warm cream under a sun */
  tint = '#FFFFFF',
}: {
  w: number;
  h: number;
  keyLight?: number;
  ambient?: number;
  tint?: string;
}) {
  if (w <= 0 || h <= 0) return null;
  return (
    <G>
      <Defs>
        <RadialGradient id="ssAmbient" cx="86%" cy="102%" r="88%">
          <Stop offset="0" stopColor={palette.navy} stopOpacity={ambient} />
          <Stop offset="0.55" stopColor={palette.navy} stopOpacity={ambient * 0.34} />
          <Stop offset="1" stopColor={palette.navy} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="ssKeyLight" cx="13%" cy="1%" r="84%">
          <Stop offset="0" stopColor={tint} stopOpacity={keyLight} />
          <Stop offset="0.5" stopColor={tint} stopOpacity={keyLight * 0.36} />
          <Stop offset="1" stopColor={tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#ssAmbient)" />
      <Rect x={0} y={0} width={w} height={h} fill="url(#ssKeyLight)" />
    </G>
  );
}

/**
 * WOOD GRAIN, as one path.
 *
 * The pizza board read as a wall until it got grain: a flat brown rectangle is
 * a colour, and a brown rectangle with five long bowed figures in it is a
 * plank. Each line is a closed lens (a quadratic out and a quadratic back), so
 * the whole surface costs a single node however wide the desk is.
 */
export function WoodGrain({
  x,
  y,
  w,
  h,
  lines = 5,
  seed = 0,
  tone = 'rgba(118,74,34,0.22)',
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lines?: number;
  seed?: number;
  tone?: string;
}) {
  if (w <= 0 || h <= 0) return null;
  let d = '';
  for (let i = 0; i < lines; i += 1) {
    const k = i + seed;
    const gy = y + (h * (i + 1)) / (lines + 1);
    const bow = (k % 2 ? 1 : -1) * h * (0.06 + 0.05 * ((k % 3) / 2));
    const x0 = x + w * 0.03 + w * 0.07 * ((k % 4) / 3);
    const x1 = x + w * 0.97 - w * 0.08 * (((k + 2) % 4) / 3);
    const mid = (x0 + x1) / 2;
    const th = Math.max(1.1, h * 0.035);
    d +=
      `M ${x0.toFixed(1)} ${gy.toFixed(1)} ` +
      `Q ${mid.toFixed(1)} ${(gy + bow).toFixed(1)} ${x1.toFixed(1)} ${gy.toFixed(1)} ` +
      `Q ${mid.toFixed(1)} ${(gy + bow + th).toFixed(1)} ${x0.toFixed(1)} ${(gy + th).toFixed(1)} z `;
  }
  return <Path d={d} fill={tone} />;
}

/**
 * A specular band — the one bright streak that tells a child a surface is
 * metal or glass rather than paint. Angled with the key light, so it always
 * runs down-right from the upper-left corner of the thing it is on.
 */
export function Specular({
  x,
  y,
  w,
  h,
  o = 0.3,
  rx = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  o?: number;
  rx?: number;
}) {
  if (w <= 0 || h <= 0) return null;
  const bandW = Math.max(3, w * 0.16);
  return (
    <G opacity={o}>
      <Defs>
        <LinearGradient id="ssSpec" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={x} y={y} width={bandW} height={h} rx={rx} fill="url(#ssSpec)" />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Idle life                                                           */
/* ------------------------------------------------------------------ */

/**
 * Rule 9: every scene idles. One tiny swaying layer per room (a pennant, a
 * pendant lamp, a hanging sign) — reduced-motion aware through `useLoop`.
 */
export function Sway({
  children,
  style,
  periodMs = 4200,
  degrees = 3.2,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  periodMs?: number;
  degrees?: number;
}) {
  const t = useLoop(periodMs, true);
  const anim = useAnimatedStyle(() => ({ transform: [{ rotate: `${(t.value - 0.5) * 2 * degrees}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[style, anim]}>
      {children}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* A framed board — the one "physical panel" motif (rule 10)           */
/* ------------------------------------------------------------------ */

export type BoardTone = 'wood' | 'steel' | 'cream';

const BOARD_TONES: Record<BoardTone, { frame: string; frameDark: string; face: string; faceEdge: string }> = {
  wood: { frame: palette.wood, frameDark: palette.woodDark, face: palette.creamDeep, faceEdge: palette.tanDark },
  steel: { frame: '#9AA4C4', frameDark: '#6F7CA6', face: '#EDF1FA', faceEdge: '#CBD3E7' },
  cream: { frame: palette.tan, frameDark: palette.tanDark, face: palette.panel, faceEdge: palette.creamDeep },
};

/**
 * A real board on a wall: a frame with corner bolts, a recessed face and a
 * cast shadow. Wraps whatever the child actually touches, so a play field is
 * always *mounted* on something instead of floating.
 */
export function BoardFrame({
  width,
  height,
  tone = 'wood',
  pad = 14,
  style,
  children,
}: {
  width: number;
  height: number;
  tone?: BoardTone;
  pad?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const t = BOARD_TONES[tone];
  const r = Math.min(radii.panel, width * 0.09);
  const bolt = Math.max(3.5, Math.min(width, height) * 0.018);
  return (
    <View style={[{ width, height }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect x={2} y={5} width={width - 4} height={height - 4} rx={r} fill={SHADE_SOFT} />
          <Rect x={0} y={0} width={width} height={height} rx={r} fill={t.frameDark} />
          <Rect x={0} y={0} width={width} height={height - 5} rx={r} fill={t.frame} />
          <Rect x={0} y={0} width={width} height={height * 0.06} rx={r * 0.5} fill={HILITE} />
          <Rect
            x={pad * 0.62}
            y={pad * 0.62}
            width={width - pad * 1.24}
            height={height - pad * 1.24}
            rx={Math.max(6, r - 8)}
            fill={t.faceEdge}
          />
          <Rect
            x={pad * 0.62}
            y={pad * 0.62}
            width={width - pad * 1.24}
            height={height - pad * 1.24 - 3}
            rx={Math.max(6, r - 8)}
            fill={t.face}
          />
          {[
            [pad * 0.62 + bolt * 2.2, pad * 0.62 + bolt * 2.2],
            [width - pad * 0.62 - bolt * 2.2, pad * 0.62 + bolt * 2.2],
            [pad * 0.62 + bolt * 2.2, height - pad * 0.62 - bolt * 2.2],
            [width - pad * 0.62 - bolt * 2.2, height - pad * 0.62 - bolt * 2.2],
          ].map(([bx, by], i) => (
            <G key={`bolt${i}`}>
              <Circle cx={bx ?? 0} cy={by ?? 0} r={bolt} fill={palette.slate} />
              <Circle cx={(bx ?? 0) - bolt * 0.28} cy={(by ?? 0) - bolt * 0.28} r={bolt * 0.42} fill={HILITE_STRONG} />
            </G>
          ))}
        </Svg>
      </View>
      <View style={{ flex: 1, padding: pad }}>{children}</View>
    </View>
  );
}

/* ================================================================== */
/* ROOM 1 — the radio room (Dispatch Decoder, Firefighter Signals)     */
/* ================================================================== */

export interface RadioRoomMetrics {
  deskTop: number;
  deskH: number;
  s: number;
}

export function radioRoomMetrics(box: PlayBox): RadioRoomMetrics {
  const deskH = clamp(box.h * 0.21, 84, 190);
  return { deskTop: box.h - deskH, deskH, s: box.s };
}

/**
 * The dispatch room: a panelled wall with a framed town map and the shift rota,
 * a perforated acoustic panel behind the console, a cable run, and a wooden
 * desk across the foot with a mug, a notepad and the mic boom. The console the
 * child reads stands ON the desk — nothing floats, nothing is cropped.
 */
export const RadioRoom = memo(function RadioRoom({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { deskTop } = radioRoomMetrics(box);
  const wallH = deskTop;

  /* the two pinned boards live in the top band … */
  const bandTop = 12 * s;
  const boardH = clamp((wallH - bandTop) * 0.42, 56, 190);
  const mapW = clamp(w * 0.44, 118, 330);
  const mapX = w * 0.05;
  const rotaW = clamp(w * 0.34, 96, 250);
  const rotaX = w - rotaW - w * 0.05;

  /* … and the acoustic panel fills the band that used to be a grey slab */
  const acTop = bandTop + boardH + 16 * s;
  const acH = Math.max(30, deskTop - acTop - 8 * s);
  const acX = w * 0.05;
  const acW = w * 0.9;
  const dotCols = Math.max(4, Math.round(acW / (18 * s)));
  const dotRows = Math.max(2, Math.round(acH / (18 * s)));

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="rrWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#AEB7D5" />
          <Stop offset="1" stopColor="#8C97BD" />
        </LinearGradient>
        <LinearGradient id="rrDesk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D2A470" />
          <Stop offset="1" stopColor="#B7854D" />
        </LinearGradient>
      </Defs>

      {/* wall + panel joints */}
      <Rect x={0} y={0} width={w} height={wallH + 4} fill="url(#rrWall)" />
      {Array.from({ length: 5 }, (_, i) => (
        <G key={`pj${i}`}>
          <Rect x={(w * (i + 1)) / 6} y={0} width={2} height={wallH} fill={SHADE_SOFT} />
          <Rect x={(w * (i + 1)) / 6 + 2} y={0} width={1.4} height={wallH} fill={HILITE_SOFT} />
        </G>
      ))}
      {/* picture rail */}
      <Rect x={0} y={bandTop - 8 * s} width={w} height={5 * s} rx={2.5 * s} fill="#C7CEE4" />
      <Rect x={0} y={bandTop - 3 * s} width={w} height={2.4 * s} fill={SHADE_SOFT} />

      {/* --- the pinned town map: framed, mounted, complete in frame --- */}
      <G>
        <Rect x={mapX - 6 * s} y={bandTop - 4 * s} width={mapW + 12 * s} height={boardH + 12 * s} rx={9} fill={SHADE_SOFT} />
        <Rect x={mapX - 7 * s} y={bandTop - 6 * s} width={mapW + 14 * s} height={boardH + 12 * s} rx={9} fill={palette.woodDark} />
        <Rect x={mapX - 7 * s} y={bandTop - 6 * s} width={mapW + 14 * s} height={boardH + 8 * s} rx={9} fill={palette.wood} />
        <Rect x={mapX - 3 * s} y={bandTop - 2 * s} width={mapW + 6 * s} height={boardH + 4 * s} rx={5} fill={palette.cream} />
        <Rect x={mapX} y={bandTop} width={mapW} height={boardH} rx={3} fill="#DCEBD6" />
        {/* blocks */}
        {[0.06, 0.4, 0.72].map((fx, i) =>
          [0.08, 0.56].map((fy, j) => (
            <Rect
              key={`blk${i}${j}`}
              x={mapX + mapW * fx}
              y={bandTop + boardH * fy}
              width={mapW * 0.22}
              height={boardH * 0.3}
              rx={4}
              fill={(i + j) % 2 ? '#C9DEBB' : '#E9DFC3'}
            />
          )),
        )}
        {/* roads */}
        <Rect x={mapX} y={bandTop + boardH * 0.44} width={mapW} height={Math.max(5, boardH * 0.09)} fill="#EFF2F9" />
        <Rect x={mapX + mapW * 0.33} y={bandTop} width={Math.max(5, mapW * 0.05)} height={boardH} fill="#EFF2F9" />
        <Rect x={mapX + mapW * 0.66} y={bandTop} width={Math.max(4, mapW * 0.04)} height={boardH} fill="#EFF2F9" />
        {/* river — inset by half its own stroke so the round caps stay inside
            the frame instead of poking out past the map's left edge */}
        <Path
          d={`M ${mapX + Math.max(3, boardH * 0.05)} ${bandTop + boardH * 0.84} Q ${mapX + mapW * 0.35} ${bandTop + boardH * 0.7} ${mapX + mapW - Math.max(3, boardH * 0.05)} ${bandTop + boardH * 0.88}`}
          stroke={palette.waterCyanLight}
          strokeWidth={Math.max(5, boardH * 0.1)}
          fill="none"
          strokeLinecap="round"
        />
        {/* the call pin */}
        <G>
          <Ellipse cx={mapX + mapW * 0.62} cy={bandTop + boardH * 0.34} rx={7 * s} ry={2.4 * s} fill={palette.navy} opacity={0.16} />
          <Path
            d={`M ${mapX + mapW * 0.62} ${bandTop + boardH * 0.32} l ${-5 * s} ${-11 * s} a ${5 * s} ${5 * s} 0 1 1 ${10 * s} 0 z`}
            fill={palette.engineRed}
          />
          <Circle cx={mapX + mapW * 0.62} cy={bandTop + boardH * 0.32 - 12 * s} r={2.4 * s} fill={palette.cream} />
        </G>
        {/* glass sheen */}
        <Path
          d={`M ${mapX} ${bandTop + boardH} L ${mapX + mapW * 0.42} ${bandTop} L ${mapX + mapW * 0.66} ${bandTop} L ${mapX + mapW * 0.2} ${bandTop + boardH} Z`}
          fill={HILITE_SOFT}
        />
      </G>

      {/* --- the shift rota --- */}
      <G>
        <Rect x={rotaX - 5 * s} y={bandTop + 4 * s} width={rotaW + 10 * s} height={boardH + 4 * s} rx={8} fill={SHADE_SOFT} />
        <Rect x={rotaX - 6 * s} y={bandTop + 2 * s} width={rotaW + 12 * s} height={boardH + 4 * s} rx={8} fill={palette.tanDark} />
        <Rect x={rotaX - 6 * s} y={bandTop + 2 * s} width={rotaW + 12 * s} height={boardH} rx={8} fill={palette.tan} />
        <Rect x={rotaX} y={bandTop + 8 * s} width={rotaW} height={boardH - 12 * s} rx={5} fill={palette.panel} />
        <Rect x={rotaX} y={bandTop + 8 * s} width={rotaW} height={Math.max(9, boardH * 0.17)} rx={5} fill={palette.engineRed} />
        <Rect x={rotaX} y={bandTop + 8 * s} width={rotaW} height={Math.max(3, boardH * 0.05)} rx={3} fill={HILITE} />
        {[0, 1, 2, 3].map((i) => {
          const ry = bandTop + 8 * s + boardH * (0.28 + i * 0.16);
          return (
            <G key={`rota${i}`}>
              <Rect x={rotaX + rotaW * 0.07} y={ry} width={rotaW * 0.16} height={Math.max(4, boardH * 0.08)} rx={3} fill={[palette.waterCyan, palette.safetyYellow, palette.leafGreen, palette.purple][i % 4]} />
              <Rect x={rotaX + rotaW * 0.3} y={ry + 1} width={rotaW * (i % 2 ? 0.42 : 0.58)} height={Math.max(3, boardH * 0.055)} rx={2} fill={palette.navyMuted} opacity={0.35} />
            </G>
          );
        })}
        <Circle cx={rotaX + rotaW * 0.5} cy={bandTop + 4 * s} r={4 * s} fill={palette.safetyYellow} />
      </G>

      {/* --- the acoustic panel behind the console --- */}
      <G>
        <Rect x={acX} y={acTop} width={acW} height={acH} rx={16} fill="#96A1C6" />
        <Rect x={acX} y={acTop} width={acW} height={acH - 5} rx={16} fill="#A2ACCF" />
        <Rect x={acX} y={acTop} width={acW} height={Math.max(4, acH * 0.06)} rx={6} fill={HILITE_SOFT} />
        {Array.from({ length: dotRows }, (_, r) =>
          Array.from({ length: dotCols }, (_, c) => (
            <Circle
              key={`ac${r}-${c}`}
              cx={acX + acW * ((c + 0.5) / dotCols)}
              cy={acTop + acH * ((r + 0.5) / dotRows)}
              r={Math.max(1.2, 2 * s)}
              fill={SHADE_SOFT}
            />
          )),
        )}
        {/* a wall speaker and the channel lamps live on the panel, so the room
            still reads when no console stands in front of it (Signals) */}
        <G>
          <Rect x={acX + acW * 0.06} y={acTop + acH * 0.18} width={clamp(acW * 0.16, 34, 96)} height={clamp(acH * 0.4, 30, 96)} rx={8} fill={palette.charcoalDark} />
          <Rect x={acX + acW * 0.06} y={acTop + acH * 0.18} width={clamp(acW * 0.16, 34, 96)} height={clamp(acH * 0.1, 8, 22)} rx={6} fill={HILITE_SOFT} />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 3 }, (_, c) => (
              <Circle
                key={`ws${r}-${c}`}
                cx={acX + acW * 0.06 + clamp(acW * 0.16, 34, 96) * ((c + 0.5) / 3)}
                cy={acTop + acH * 0.18 + clamp(acH * 0.4, 30, 96) * ((r + 0.5) / 3)}
                r={Math.max(1.6, 3 * s)}
                fill={palette.navySoft}
              />
            )),
          )}
        </G>
        <G>
          <Rect x={acX + acW * 0.34} y={acTop + acH * 0.26} width={clamp(acW * 0.3, 60, 200)} height={clamp(acH * 0.16, 14, 42)} rx={7} fill="#7F8AAE" />
          {[0, 1, 2, 3].map((i) => (
            <Circle
              key={`lp${i}`}
              cx={acX + acW * 0.34 + clamp(acW * 0.3, 60, 200) * ((i + 0.5) / 4)}
              cy={acTop + acH * 0.26 + clamp(acH * 0.16, 14, 42) / 2}
              r={Math.max(2.4, 4.4 * s)}
              fill={[palette.leafGreen, palette.safetyYellow, palette.engineRedLight, palette.waterCyan][i % 4]}
              opacity={0.9}
            />
          ))}
        </G>
        {/* cable run down the wall into the desk */}
        <Path
          d={`M ${acX + acW * 0.96} ${acTop + acH * 0.1} q ${10 * s} ${acH * 0.4} ${-4 * s} ${acH * 0.9}`}
          stroke={palette.charcoal}
          strokeWidth={Math.max(2.5, 4 * s)}
          fill="none"
          strokeLinecap="round"
          opacity={0.55}
        />
        <Rect x={acX + acW * 0.93} y={acTop + acH * 0.06} width={9 * s} height={9 * s} rx={2.5} fill="#7A86AC" />

        {/*
         * EVERYTHING ON THIS PANEL LIVES IN ITS TOP HALF. The console
         * (Dispatch) and the call sheet (Signals) both stand across the lower
         * part of this wall, so anything hung below the midline comes out as a
         * fragment poking round the furniture. The watch clock, the charger
         * rack of handhelds and the station photograph all sit above it.
         */}
        {acH > 74 * s ? (
          <G>
            <G>
              {(() => {
                const rw = clamp(acW * 0.22, 52, 140);
                const rh = clamp(acH * 0.16, 24, 58);
                const rx0 = acX + acW * 0.32;
                const ry0 = acTop + acH * 0.34;
                return (
                  <G>
                    <Rect x={rx0} y={ry0} width={rw} height={rh} rx={7} fill="#77839F" />
                    <Rect x={rx0} y={ry0} width={rw} height={rh * 0.24} rx={5} fill={HILITE_SOFT} />
                    {[0, 1, 2].map((i) => (
                      <G key={`hh${i}`}>
                        <Rect x={rx0 + rw * (0.1 + i * 0.3)} y={ry0 + rh * 0.2} width={rw * 0.2} height={rh * 0.66} rx={3} fill={palette.charcoalDark} />
                        <Rect x={rx0 + rw * (0.1 + i * 0.3)} y={ry0 + rh * 0.26} width={rw * 0.2} height={rh * 0.16} rx={2} fill={palette.leafGreen} opacity={0.85} />
                        <Rect x={rx0 + rw * (0.17 + i * 0.3)} y={ry0 + rh * 0.04} width={rw * 0.05} height={rh * 0.18} rx={2} fill={palette.slate} />
                      </G>
                    ))}
                  </G>
                );
              })()}
            </G>
            <WallClock cx={acX + acW * 0.86} cy={acTop + acH * 0.2} r={clamp(acH * 0.13, 12, 32)} tone={palette.navySoft} />
            <Poster
              x={acX + acW * 0.68}
              y={acTop + acH * 0.4}
              w={clamp(acW * 0.17, 42, 110)}
              h={clamp(acH * 0.2, 30, 76)}
              s={s}
              motif="engine"
              frame={palette.tanDark}
            />
          </G>
        ) : null}
      </G>

      {/* --- the desk --- */}
      <Rect x={0} y={deskTop} width={w} height={h - deskTop} fill="url(#rrDesk)" />
      <Rect x={0} y={deskTop} width={w} height={9 * s} rx={4 * s} fill="#E2BC86" />
      <Rect x={0} y={deskTop + 9 * s} width={w} height={4 * s} fill={SHADE_SOFT} />
      {/* grain, and the rubber desk mat the console stands on */}
      <WoodGrain x={0} y={deskTop + 12 * s} w={w} h={h - deskTop - 12 * s} lines={5} seed={1} />
      <WoodGrain x={0} y={deskTop + 12 * s} w={w} h={h - deskTop - 12 * s} lines={3} seed={4} tone="rgba(255,235,205,0.16)" />
      <Rect x={w * 0.12} y={deskTop + 12 * s} width={w * 0.76} height={Math.max(8, (h - deskTop) * 0.3)} rx={8} fill={SHADE_SOFT} />

      {/* the props stand along the FRONT edge, clear of the console behind them */}
      <Mug x={w * 0.045 + 10} baseY={h - 5 * s} s={s} />
      <G>
        {/* notepad + pencil */}
        <Contact cx={w * 0.86} cy={h - 4 * s} rx={24 * s} />
        <Rect x={w * 0.86 - 22 * s} y={h - 20 * s} width={44 * s} height={15 * s} rx={3} fill={palette.white} />
        <Rect x={w * 0.86 - 22 * s} y={h - 20 * s} width={44 * s} height={4.4 * s} rx={2} fill={palette.creamDeep} />
        <Rect x={w * 0.86 - 15 * s} y={h - 14 * s} width={28 * s} height={2.4 * s} rx={1.2} fill={palette.navyMuted} opacity={0.4} />
        <Rect x={w * 0.86 - 15 * s} y={h - 10 * s} width={20 * s} height={2.4 * s} rx={1.2} fill={palette.navyMuted} opacity={0.3} />
        <Rect
          x={w * 0.86 + 16 * s}
          y={h - 26 * s}
          width={4.4 * s}
          height={26 * s}
          rx={2.2 * s}
          fill={palette.safetyYellow}
          transform={`rotate(26 ${w * 0.86 + 18 * s} ${h - 12 * s})`}
        />
      </G>
      {/* the mic on its boom, standing on the near edge of the desk */}
      <G>
        <Contact cx={w * 0.94 - 10} cy={h - 4 * s} rx={18 * s} />
        <Ellipse cx={w * 0.94 - 10} cy={h - 10 * s} rx={17 * s} ry={5.4 * s} fill={palette.charcoalDark} />
        <Path
          d={`M ${w * 0.94 - 10} ${h - 14 * s} q ${-5 * s} ${-24 * s} ${-20 * s} ${-29 * s}`}
          stroke={palette.charcoal}
          strokeWidth={4.4 * s}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse cx={w * 0.94 - 32 * s} cy={h - 44 * s} rx={8 * s} ry={10 * s} fill={palette.slate} />
        <Ellipse cx={w * 0.94 - 34 * s} cy={h - 46 * s} rx={3 * s} ry={4 * s} fill={HILITE} />
      </G>
      {/* the keyboard, lying on the mat in front of the console */}
      <G>
        <Rect x={w * 0.28} y={h - 26 * s} width={w * 0.44} height={18 * s} rx={5} fill="#8C97BD" />
        <Rect x={w * 0.28} y={h - 26 * s} width={w * 0.44} height={14 * s} rx={5} fill="#A7B0D0" />
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => (
            <Rect
              key={`kb${r}-${c}`}
              x={w * 0.29 + (c * w * 0.42) / 9}
              y={h - 23 * s + r * 4 * s}
              width={w * 0.03}
              height={2.6 * s}
              rx={1.3}
              fill={HILITE}
            />
          )),
        )}
      </G>
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.14} ambient={0.15} />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 2 — the station store room (Gear Sort, Listen & Count)         */
/* ================================================================== */

export interface StoreRoomMetrics {
  floorTop: number;
  floorH: number;
  s: number;
}

export function storeRoomMetrics(box: PlayBox): StoreRoomMetrics {
  const floorH = clamp(box.h * 0.26, 84, 220);
  return { floorTop: box.h - floorH, floorH, s: box.s };
}

/** Where a workbench top should sit so the things standing on it clear the floor. */
export function benchTopFor(box: PlayBox, contentHeight: number): number {
  return clamp(box.h - clamp(box.h * 0.14, 34, 86), contentHeight + 20, box.h - 26);
}

/**
 * The store room behind the appliance bay: a plank wall with a pegboard of
 * gear, a locker bank, a loaded shelf and a hose reel, over a painted floor
 * with a safety line and a drain. Bins and crates stand ON the floor.
 */
export const StoreRoom = memo(function StoreRoom({
  box,
  benchY,
  /** false when the game draws its own shelf in this band, so the two never collide */
  dressMiddle = true,
}: {
  box: PlayBox;
  benchY?: number;
  dressMiddle?: boolean;
}) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  /* with a bench in the room the floor starts under it; without one the floor
     is simply the bottom band */
  const floorTop = benchY !== undefined ? Math.min(benchY + 30 * s, h - 12) : storeRoomMetrics(box).floorTop;
  const wallBottom = benchY ?? floorTop;

  const pegW = clamp(w * 0.42, 110, 320);
  const pegH = clamp(wallBottom * 0.3, 58, 170);
  const pegX = w * 0.05;
  const pegY = 12 * s;
  const lockW = clamp(w * 0.36, 96, 260);
  const lockX = w - lockW - w * 0.05;
  const lockH = clamp(wallBottom * 0.36, 84, 210);
  const shelfY = pegY + Math.max(pegH, lockH) + clamp(wallBottom * 0.07, 18, 52);
  const railY = shelfY + clamp(wallBottom * 0.055, 16, 44);

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="srWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FCF3E1" />
          <Stop offset="0.42" stopColor="#F1E2C2" />
          <Stop offset="1" stopColor="#DCC69C" />
        </LinearGradient>
        {/*
         * The store room is lit by one high window on the left. This is the
         * shaft of it across the boarding — the thing that turns the biggest
         * flat surface in the game into a wall that a light is falling on.
         */}
        <LinearGradient id="srShaft" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.34} />
          <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={w} height={floorTop + 4} fill="url(#srWall)" />
      {/* the boarding: a shadow line and the lit edge of the plank above it */}
      {Array.from({ length: 7 }, (_, i) => (
        <G key={`pl${i}`}>
          <Rect x={0} y={(floorTop / 7) * (i + 1) - 2} width={w} height={2.4} rx={1.2} fill={SHADE_SOFT} />
          <Rect x={0} y={(floorTop / 7) * (i + 1) + 0.4} width={w} height={1.6} rx={0.8} fill={HILITE_SOFT} />
        </G>
      ))}
      <Path d={`M 0 0 L ${w * 0.62} 0 L ${w * 0.14} ${floorTop} L 0 ${floorTop} z`} fill="url(#srShaft)" />

      {/* pegboard of gear */}
      <G>
        <Rect x={pegX - 5} y={pegY + 4} width={pegW + 10} height={pegH} rx={12} fill={SHADE_SOFT} />
        <Rect x={pegX - 6} y={pegY} width={pegW + 12} height={pegH} rx={12} fill={palette.tanDark} />
        <Rect x={pegX - 6} y={pegY} width={pegW + 12} height={pegH - 5} rx={12} fill="#DFBE8B" />
        {Array.from({ length: Math.max(4, Math.round(pegH / (20 * s))) }, (_, r) =>
          Array.from({ length: Math.max(5, Math.round(pegW / (20 * s))) }, (_, c) => (
            <Circle
              key={`ph${r}-${c}`}
              cx={pegX + pegW * ((c + 0.5) / Math.max(5, Math.round(pegW / (20 * s))))}
              cy={pegY + pegH * ((r + 0.5) / Math.max(4, Math.round(pegH / (20 * s))))}
              r={Math.max(1.4, 2.2 * s)}
              fill={SHADE_SOFT}
            />
          )),
        )}
        <HoseCoil cx={pegX + pegW * 0.17} cy={pegY + pegH * 0.4} r={Math.min(pegH * 0.3, pegW * 0.14)} />
        <HelmetProp cx={pegX + pegW * 0.48} cy={pegY + pegH * 0.55} r={Math.min(pegH * 0.24, pegW * 0.12)} />
        {/* torch */}
        <G>
          <Rect x={pegX + pegW * 0.7} y={pegY + pegH * 0.3} width={pegW * 0.07} height={pegH * 0.36} rx={5} fill={palette.charcoal} />
          <Path
            d={`M ${pegX + pegW * 0.685} ${pegY + pegH * 0.3} h ${pegW * 0.1} l ${-pegW * 0.012} ${-pegH * 0.14} h ${-pegW * 0.076} z`}
            fill={palette.safetyYellow}
          />
        </G>
        {/* axe */}
        <G>
          <Rect x={pegX + pegW * 0.86} y={pegY + pegH * 0.26} width={pegW * 0.035} height={pegH * 0.48} rx={4} fill={palette.wood} />
          <Path
            d={`M ${pegX + pegW * 0.84} ${pegY + pegH * 0.3} q ${pegW * 0.09} ${-pegH * 0.02} ${pegW * 0.08} ${pegH * 0.14} q ${-pegW * 0.05} ${pegH * 0.03} ${-pegW * 0.08} ${-pegH * 0.02} z`}
            fill="#B9C0D6"
          />
        </G>
      </G>

      {/* locker bank */}
      <G>
        <Rect x={lockX} y={pegY + 4} width={lockW} height={lockH} rx={10} fill={SHADE_SOFT} />
        <Rect x={lockX} y={pegY} width={lockW} height={lockH} rx={10} fill="#4E68A8" />
        {[0, 1, 2].map((i) => {
          const dw = (lockW - 10) / 3;
          const dx = lockX + 5 + i * dw;
          return (
            <G key={`lk${i}`}>
              <Rect x={dx + 2} y={pegY + 5} width={dw - 4} height={lockH - 10} rx={7} fill="#6A82BE" />
              <Rect x={dx + 2} y={pegY + 5} width={(dw - 4) * 0.24} height={lockH - 10} rx={7} fill={HILITE_SOFT} />
              {[0, 1, 2].map((v) => (
                <Rect key={`v${v}`} x={dx + dw * 0.22} y={pegY + 16 + v * 7 * s} width={dw * 0.56} height={2.6 * s} rx={1.3} fill={SHADE} />
              ))}
              <Rect x={dx + dw * 0.24} y={pegY + lockH * 0.42} width={dw * 0.52} height={lockH * 0.11} rx={4} fill={palette.cream} />
              <Circle cx={dx + dw * 0.78} cy={pegY + lockH * 0.56} r={3.6 * s} fill={palette.safetyYellow} />
            </G>
          );
        })}
      </G>

      {/* loaded shelf across the middle of the wall */}
      {dressMiddle && shelfY < wallBottom - 30 * s ? (
        <G>
          <Shelf x={w * 0.05} y={shelfY} w={w * 0.56} s={s} />
          {[0, 1, 2, 3].map((i) => {
            const bx = w * 0.09 + i * w * 0.125;
            const bh = (18 + (i % 3) * 8) * s;
            return (
              <G key={`box${i}`}>
                <Rect x={bx} y={shelfY - bh} width={w * 0.092} height={bh} rx={4} fill={[palette.cream, palette.waterCyanLight, palette.creamDeep, '#D8E7C6'][i % 4]} />
                <Rect x={bx} y={shelfY - bh} width={w * 0.092} height={bh * 0.28} rx={3} fill={HILITE} />
                <Rect x={bx + w * 0.016} y={shelfY - bh * 0.58} width={w * 0.06} height={3.4 * s} rx={1.7} fill={SHADE} />
              </G>
            );
          })}
          {/* the hose reel and the first-aid cabinet share the band under the
              shelf, so the wall between the shelf and the bench is never bare */}
          <G>
            <Rect x={w * 0.72} y={shelfY + 4 * s} width={6 * s} height={16 * s} rx={3 * s} fill={palette.slate} />
            <HoseCoil cx={w * 0.75} cy={shelfY + 34 * s} r={16 * s} tone={palette.engineRedLight} />
          </G>
          <G>
            <Rect x={w * 0.08} y={shelfY + 16 * s} width={38 * s} height={32 * s} rx={6} fill="#E3E8F2" />
            <Rect x={w * 0.08} y={shelfY + 16 * s} width={38 * s} height={28 * s} rx={6} fill={palette.white} />
            <Rect x={w * 0.08 + 15 * s} y={shelfY + 22 * s} width={8 * s} height={16 * s} rx={2} fill={palette.engineRed} />
            <Rect x={w * 0.08 + 11 * s} y={shelfY + 26 * s} width={16 * s} height={8 * s} rx={2} fill={palette.engineRed} />
            <Rect x={w * 0.08 + 36 * s} y={shelfY + 28 * s} width={4 * s} height={8 * s} rx={2} fill={palette.slate} />
          </G>
        </G>
      ) : null}

      {/* a tool rail low on the wall, so the middle band is never bare */}
      {dressMiddle && benchY === undefined && railY < wallBottom - 24 * s ? (
        <G>
          <Rect x={w * 0.06} y={railY} width={w * 0.88} height={6 * s} rx={3 * s} fill="#B9A57F" />
          <Rect x={w * 0.06} y={railY} width={w * 0.88} height={2.2 * s} rx={1.1 * s} fill={HILITE} />
          {[0.12, 0.3, 0.5, 0.7, 0.88].map((f, i) => (
            <G key={`hk${i}`}>
              <Path d={`M ${w * f} ${railY + 6 * s} v ${7 * s} a ${4 * s} ${4 * s} 0 0 0 ${8 * s} 0`} stroke={palette.slate} strokeWidth={3 * s} fill="none" strokeLinecap="round" />
              {i % 2 === 0 ? (
                <Rect x={w * f + 2 * s} y={railY + 15 * s} width={7 * s} height={20 * s} rx={3.5 * s} fill={[palette.engineRed, palette.safetyYellow, palette.waterCyanDark][i % 3]} />
              ) : (
                <Rect x={w * f - 1 * s} y={railY + 15 * s} width={15 * s} height={12 * s} rx={4} fill={palette.creamDeep} />
              )}
            </G>
          ))}
        </G>
      ) : null}

      {/*
       * THE BAND BETWEEN THE SHELF AND THE BENCH. With a bench in the room the
       * old tool rail switched itself off and left a hand's width of bare
       * planking across the middle of the frame.
       *
       * It is dressed with WALL, not with props: whatever the game stands on
       * the bench — three gear bins, a crate, a row of name plaques — occupies
       * most of this band, and anything object-shaped drawn here ends up half
       * behind it. A dado rail and a half-tone below it read correctly at any
       * height and can never collide with the activity.
       */}
      {dressMiddle && benchY !== undefined && wallBottom - (shelfY + 40 * s) > 46 * s
        ? (() => {
            const dado = shelfY + clamp((wallBottom - shelfY) * 0.28, 34, 110);
            return (
              <G>
                <Rect x={0} y={dado} width={w} height={wallBottom - dado + 8} fill="rgba(31,42,90,0.055)" />
                <Rect x={0} y={dado} width={w} height={5 * s} rx={2.5 * s} fill="#C4AC80" />
                <Rect x={0} y={dado} width={w} height={2 * s} rx={1 * s} fill={HILITE} />
                <Rect x={0} y={dado + 5 * s} width={w} height={2.4 * s} fill={SHADE_SOFT} />
                {/* the tongue-and-groove of the boarding below the rail */}
                <Path
                  d={[0.1, 0.3, 0.5, 0.7, 0.9]
                    .map((f) => `M ${(w * f).toFixed(1)} ${(dado + 10 * s).toFixed(1)} h 2 v ${(wallBottom - dado - 10 * s).toFixed(1)} h -2 z `)
                    .join('')}
                  fill={HILITE_SOFT}
                />
              </G>
            );
          })()
        : null}

      {/* floor: painted safety line, joint lines and a drain */}
      <Ground w={w} h={h} top={floorTop} near="#CBD2E3" lip="#E1E6F1" />
      <Paving w={w} top={floorTop + 18 * s} bottom={h} s={s} unit={70} />
      <Rect x={0} y={floorTop + 12 * s} width={w} height={4 * s} rx={2 * s} fill={palette.safetyYellow} opacity={0.7} />
      <G>
        <Rect x={w * 0.44} y={h - 18 * s} width={24 * s} height={11 * s} rx={4} fill="#B4BCD2" />
        {[0, 1, 2].map((i) => (
          <Rect key={`dg${i}`} x={w * 0.44 + 4 * s + i * 6.4 * s} y={h - 16 * s} width={2.6 * s} height={7 * s} rx={1.3} fill={SHADE} />
        ))}
      </G>

      {/* the workbench the bins stand on */}
      {benchY !== undefined ? (
        <G>
          {[w * 0.1, w * 0.9].map((lx, i) => (
            <G key={`lg${i}`}>
              <Rect x={lx - 7 * s} y={benchY + 16 * s} width={14 * s} height={h - benchY - 16 * s} rx={4} fill={palette.woodDark} />
              <Rect x={lx - 7 * s} y={benchY + 16 * s} width={4.4 * s} height={h - benchY - 16 * s} fill={HILITE_SOFT} />
            </G>
          ))}
          <Rect x={0} y={benchY + 13 * s} width={w} height={9 * s} rx={4 * s} fill="#A2743F" />
          <Rect x={0} y={benchY} width={w} height={14 * s} rx={6 * s} fill={palette.wood} />
          <Rect x={0} y={benchY} width={w} height={4.4 * s} rx={2.2 * s} fill="#DDAE72" />
          {/* a worked bench top: grain along the plank, not a brown bar */}
          <WoodGrain x={0} y={benchY + 3 * s} w={w} h={9 * s} lines={3} seed={2} tone="rgba(118,74,34,0.26)" />
          <Rect x={0} y={benchY + 11 * s} width={w} height={3.4 * s} fill={SHADE_SOFT} />
          {/*
           * The bench dressing lives on the APRON, under the top — a vice
           * standing on the bench top collided with whatever the game stands
           * there (it poked out of the first gear bin at every size). Under the
           * top there is nothing to hit: two drawer fronts and a hanging cloth.
           */}
          {h - benchY > 34 * s ? (
            <G>
              {[0.16, 0.56].map((f, i) => {
                const dw = w * 0.28;
                const dy = benchY + 24 * s;
                const dh = Math.max(10, h - dy - 6 * s);
                return (
                  <G key={`bd${i}`}>
                    <Rect x={w * f} y={dy} width={dw} height={dh} rx={5} fill="#8E5F2E" />
                    <Rect x={w * f} y={dy} width={dw} height={dh - 3 * s} rx={5} fill="#B07A3E" />
                    <Rect x={w * f} y={dy} width={dw} height={2.6 * s} rx={1.3 * s} fill={HILITE_SOFT} />
                    <Rect x={w * f + dw * 0.32} y={dy + dh * 0.42} width={dw * 0.36} height={Math.max(3.4, 4 * s)} rx={2 * s} fill="#6E4823" />
                  </G>
                );
              })}
            </G>
          ) : null}
        </G>
      ) : null}
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.16} ambient={0.13} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 3 — the clock tower (Clock Watch)                              */
/* ================================================================== */

/**
 * The tower the dial is *set into*. The game passes the dial's real centre and
 * radius, so the stone housing, the corbelled ledge and the louvre openings are
 * always drawn around the clock rather than behind it.
 */
export const ClockTower = memo(function ClockTower({
  box,
  cx,
  cy,
  r,
}: {
  box: PlayBox;
  cx: number;
  cy: number;
  r: number;
}) {
  if (!boxReady(box) || r <= 0) return null;
  const { w, h, s } = box;
  const towerW = clamp(Math.max(w * 0.9, r * 2.42), 200, w * 1.25);
  const tx = (w - towerW) / 2;
  const capY = Math.max(6 * s, cy - r * 1.5);
  const ledgeY = cy + r * 1.16;

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="ctSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7BC6FA" />
          <Stop offset="1" stopColor="#CDEAFF" />
        </LinearGradient>
        <LinearGradient id="ctStone" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#F6EBD4" />
          <Stop offset="0.72" stopColor="#EFE0C1" />
          <Stop offset="1" stopColor="#DCC79F" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={w} height={h} fill="url(#ctSky)" />
      {/* two soft clouds and the neighbours' rooftops, so the sky is never raw */}
      <G opacity={0.9}>
        <Ellipse cx={w * 0.16} cy={h * 0.16} rx={38 * s} ry={16 * s} fill={palette.white} opacity={0.7} />
        <Ellipse cx={w * 0.24} cy={h * 0.14} rx={26 * s} ry={13 * s} fill={palette.white} opacity={0.7} />
        <Ellipse cx={w * 0.86} cy={h * 0.26} rx={30 * s} ry={13 * s} fill={palette.white} opacity={0.55} />
      </G>
      <G opacity={0.55}>
        {[0.02, 0.16, 0.78, 0.9].map((f, i) => (
          <G key={`nb${i}`}>
            <Rect x={w * f} y={h - (78 + (i % 2) * 34) * s} width={w * 0.12} height={100 * s} rx={6} fill="#9FCBEA" />
            <Path
              d={`M ${w * f - 6 * s} ${h - (78 + (i % 2) * 34) * s} L ${w * f + w * 0.06} ${h - (98 + (i % 2) * 34) * s} L ${w * f + w * 0.12 + 6 * s} ${h - (78 + (i % 2) * 34) * s} Z`}
              fill="#8FC0E4"
            />
          </G>
        ))}
      </G>

      {/* --- the tower shaft --- */}
      <G>
        <Rect x={tx} y={capY} width={towerW} height={h - capY} rx={10} fill="url(#ctStone)" />
        {/* shaded right plane + soft left highlight */}
        <Path d={`M ${tx + towerW * 0.84} ${capY} L ${tx + towerW} ${capY + 10 * s} L ${tx + towerW} ${h} L ${tx + towerW * 0.84} ${h} Z`} fill={SHADE_SOFT} />
        <Rect x={tx} y={capY} width={towerW * 0.09} height={h - capY} fill={HILITE_SOFT} />
        {/* stone courses */}
        {Array.from({ length: Math.max(3, Math.round((h - capY) / (46 * s))) }, (_, i) => (
          <Rect key={`sc${i}`} x={tx} y={capY + (i + 1) * 46 * s} width={towerW} height={2.4} fill={SHADE_SOFT} />
        ))}
        {/*
         * QUOINS. The shaft is the largest single surface in this game, and a
         * course line every 46 px was not enough to stop it reading as a sheet
         * of cream. Dressed stones down both angles give the tower its
         * masonry — and they cost one path each, not one node per block.
         */}
        {[0, 1].map((side) => (
          <Path
            key={`qn${side}`}
            d={Array.from({ length: Math.max(2, Math.round((h - capY) / (46 * s))) }, (_, i) => {
              const qy = capY + i * 46 * s + 4 * s;
              const long = i % 2 === 0;
              const qw = (long ? 34 : 22) * s;
              const qx = side === 0 ? tx + 3 * s : tx + towerW - 3 * s - qw;
              return `M ${qx.toFixed(1)} ${qy.toFixed(1)} h ${qw.toFixed(1)} v ${(42 * s).toFixed(1)} h ${(-qw).toFixed(1)} z `;
            }).join('')}
            fill={side === 0 ? HILITE_SOFT : SHADE_SOFT}
          />
        ))}
        {/* cornice above the dial */}
        <Rect x={tx - 12 * s} y={capY} width={towerW + 24 * s} height={13 * s} rx={6 * s} fill="#E2CDA6" />
        <Rect x={tx - 12 * s} y={capY + 13 * s} width={towerW + 24 * s} height={5 * s} rx={2.5 * s} fill={SHADE} />
        <Rect x={tx - 12 * s} y={capY} width={towerW + 24 * s} height={4 * s} rx={2 * s} fill={HILITE} />
        {/* parapet merlons */}
        {Array.from({ length: 6 }, (_, i) => (
          <Rect
            key={`mr${i}`}
            x={tx - 8 * s + ((towerW + 16 * s) / 6) * i + 4 * s}
            y={Math.max(0, capY - 14 * s)}
            width={(towerW + 16 * s) / 12}
            height={14 * s}
            rx={3}
            fill="#E8D5B0"
          />
        ))}
      </G>

      {/*
       * WEATHERING. Cut stone that has stood in the rain for a hundred years
       * does not stay one flat cream: it darkens in long streaks under every
       * ledge that sheds water. Two paths, and the shaft stops being a sheet.
       */}
      <Path
        d={[0.14, 0.3, 0.52, 0.68, 0.86].map((f, i) => {
          const sx = tx + towerW * f;
          const sw = towerW * (i % 2 ? 0.02 : 0.03);
          const len = (h - capY) * (i % 2 ? 0.34 : 0.5);
          /* wide where the water leaves the cornice, tapering to nothing */
          return `M ${sx.toFixed(1)} ${(capY + 14 * s).toFixed(1)} h ${sw.toFixed(1)} L ${(sx + sw * 0.35).toFixed(1)} ${(capY + 14 * s + len).toFixed(1)} L ${(sx + sw * 0.2).toFixed(1)} ${(capY + 14 * s + len).toFixed(1)} z `;
        }).join('')}
        fill="rgba(31,42,90,0.05)"
      />

      {/* --- the dial housing --- */}
      <G>
        {/* what the housing throws onto the shaft, down and to the right */}
        <Circle cx={cx + r * 0.1} cy={cy + r * 0.12} r={r * 1.26} fill={palette.navy} opacity={0.09} />
        <Circle cx={cx} cy={cy} r={r * 1.2} fill="#E2CDA6" />
        <Circle cx={cx} cy={cy} r={r * 1.13} fill="#D2B98D" />
        <Circle cx={cx} cy={cy} r={r * 1.07} fill="#EFE0C1" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4 + Math.PI / 8;
          return (
            <Circle
              key={`hb${i}`}
              cx={cx + Math.cos(a) * r * 1.15}
              cy={cy + Math.sin(a) * r * 1.15}
              r={Math.max(2.4, 3.6 * s)}
              fill={palette.slate}
            />
          );
        })}
      </G>

      {/* --- the corbelled ledge under the dial --- */}
      <G>
        <Rect x={tx - 10 * s} y={ledgeY} width={towerW + 20 * s} height={11 * s} rx={5 * s} fill="#E2CDA6" />
        <Rect x={tx - 10 * s} y={ledgeY} width={towerW + 20 * s} height={3.6 * s} rx={1.8 * s} fill={HILITE} />
        <Rect x={tx - 10 * s} y={ledgeY + 11 * s} width={towerW + 20 * s} height={5 * s} rx={2.5 * s} fill={SHADE} />
        {[0.14, 0.42, 0.7].map((f, i) => (
          <Path
            key={`cb${i}`}
            d={`M ${tx + towerW * f} ${ledgeY + 16 * s} h ${towerW * 0.14} l ${-towerW * 0.03} ${11 * s} h ${-towerW * 0.08} z`}
            fill="#DCC79F"
          />
        ))}
      </G>

      {/* --- a carved roundel between the louvres, so the base is not bare --- */}
      {h - ledgeY > 70 * s ? (
        <G>
          {(() => {
            const ry = ledgeY + (h - ledgeY) * 0.44;
            const rr = clamp((h - ledgeY) * 0.16, 11, 34);
            return (
              <G>
                <Circle cx={tx + towerW / 2} cy={ry + 2} r={rr} fill={SHADE_SOFT} />
                <Circle cx={tx + towerW / 2} cy={ry} r={rr} fill="#E2CDA6" />
                <Circle cx={tx + towerW / 2} cy={ry} r={rr * 0.78} fill="#EFE0C1" />
                <Path
                  d={`M ${tx + towerW / 2} ${ry - rr * 0.56} l ${rr * 0.2} ${rr * 0.4} l ${rr * 0.44} ${rr * 0.06} l ${-rr * 0.34} ${rr * 0.32} l ${rr * 0.1} ${rr * 0.44} l ${-rr * 0.4} ${-rr * 0.22} l ${-rr * 0.4} ${rr * 0.22} l ${rr * 0.1} ${-rr * 0.44} l ${-rr * 0.34} ${-rr * 0.32} l ${rr * 0.44} ${-rr * 0.06} z`}
                  fill={palette.safetyYellow}
                  opacity={0.9}
                />
              </G>
            );
          })()}
        </G>
      ) : null}

      {/* --- louvred openings below the ledge --- */}
      <G>
        {[0.26, 0.74].map((f, i) => {
          const ow = towerW * 0.2;
          const ox = tx + towerW * f - ow / 2;
          const oy = ledgeY + 40 * s;
          const oh = Math.max(0, h - oy - 8 * s);
          if (oh < 18 * s) return null;
          return (
            <G key={`lv${i}`}>
              <Path d={`M ${ox} ${oy + oh} v ${-oh + ow / 2} a ${ow / 2} ${ow / 2} 0 0 1 ${ow} 0 v ${oh - ow / 2} z`} fill="#4A5578" />
              <Path d={`M ${ox} ${oy + oh} v ${-oh + ow / 2} a ${ow / 2} ${ow / 2} 0 0 1 ${ow} 0 v ${oh - ow / 2} z`} fill={SHADE_DEEP} />
              {Array.from({ length: Math.max(2, Math.round(oh / (13 * s))) }, (_, k) => (
                <Rect key={`sl${k}`} x={ox + 2} y={oy + ow * 0.3 + k * 13 * s} width={ow - 4} height={5 * s} rx={2.5 * s} fill="#B7A788" opacity={0.85} />
              ))}
              <Rect x={ox - 5 * s} y={oy + oh - 6 * s} width={ow + 10 * s} height={7 * s} rx={3 * s} fill="#DCC79F" />
            </G>
          );
        })}
      </G>
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.18} ambient={0.14} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 4 — the training yard (Spray Patterns, Lay the Hose)           */
/* ================================================================== */

export interface YardMetrics {
  groundTop: number;
  s: number;
}

export function yardMetrics(box: PlayBox): YardMetrics {
  return { groundTop: box.h - clamp(box.h * 0.26, 80, 200), s: box.s };
}

/**
 * The station's training yard: a painted breeze-block wall with target rings
 * and a hose drying rack, the training tower over the fence, and a chalk-marked
 * apron with cones, a standpipe and a drain.
 */
export const TrainingYard = memo(function TrainingYard({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { groundTop } = yardMetrics(box);
  const wallTop = clamp(h * 0.12, 26, 130);

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="tySky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7FC8FA" />
          <Stop offset="1" stopColor="#C6E7FF" />
        </LinearGradient>
        <LinearGradient id="tyWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EFE6D0" />
          <Stop offset="0.4" stopColor="#E1D6BB" />
          <Stop offset="1" stopColor="#C7B99A" />
        </LinearGradient>
        {/* sun over the yard wall, falling in from the left */}
        <LinearGradient id="tySun" x1="0" y1="0" x2="1" y2="0.6">
          <Stop offset="0" stopColor="#FFF3D6" stopOpacity={0.4} />
          <Stop offset="0.5" stopColor="#FFF3D6" stopOpacity={0.1} />
          <Stop offset="1" stopColor="#FFF3D6" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={w} height={wallTop + 8} fill="url(#tySky)" />
      <Ellipse cx={w * 0.2} cy={wallTop * 0.42} rx={34 * s} ry={14 * s} fill={palette.white} opacity={0.65} />

      {/* the training tower behind the wall */}
      <G>
        <Rect x={w * 0.6} y={-40 * s} width={w * 0.3} height={wallTop + 44 * s} rx={7} fill="#C2A377" />
        <Rect x={w * 0.6} y={-40 * s} width={w * 0.07} height={wallTop + 44 * s} fill={HILITE_SOFT} />
        <Path d={`M ${w * 0.85} ${-40 * s} L ${w * 0.9} ${-32 * s} L ${w * 0.9} ${wallTop + 4} L ${w * 0.85} ${wallTop + 4} Z`} fill={SHADE_SOFT} />
        {[0, 1].map((i) => {
          const wy = -22 * s + i * 40 * s;
          return wy + 26 * s < wallTop ? (
            <G key={`tw${i}`}>
              <Rect x={w * 0.66} y={wy} width={w * 0.09} height={26 * s} rx={5} fill="#33477A" />
              <Rect x={w * 0.655} y={wy + 26 * s} width={w * 0.1} height={4 * s} rx={2} fill={SHADE} />
              <Rect x={w * 0.79} y={wy} width={w * 0.07} height={26 * s} rx={5} fill="#33477A" />
            </G>
          ) : null;
        })}
      </G>
      {/* the yard wall */}
      <Rect x={0} y={wallTop} width={w} height={groundTop - wallTop + 6} fill="url(#tyWall)" />
      <Rect x={0} y={wallTop} width={w} height={groundTop - wallTop + 6} fill="url(#tySun)" />
      <Rect x={0} y={wallTop} width={w} height={10 * s} rx={5 * s} fill="#C6B896" />
      <Rect x={0} y={wallTop} width={w} height={3.4 * s} rx={1.7 * s} fill={HILITE} />
      {/* the coping throws its own line down the wall */}
      <Rect x={0} y={wallTop + 10 * s} width={w} height={6 * s} fill={SHADE_SOFT} />
      {/* block courses */}
      {Array.from({ length: Math.max(3, Math.round((groundTop - wallTop) / (34 * s))) }, (_, r) => (
        <G key={`bc${r}`}>
          <Rect x={0} y={wallTop + 18 * s + r * 34 * s} width={w} height={2.4} fill={SHADE_SOFT} />
          {Array.from({ length: Math.max(3, Math.round(w / (78 * s))) }, (_, c) => (
            <Rect
              key={`bv${r}-${c}`}
              x={((c + (r % 2 ? 0.5 : 0)) * w) / Math.max(3, Math.round(w / (78 * s)))}
              y={wallTop + 18 * s + r * 34 * s}
              width={2.4}
              height={34 * s}
              fill={SHADE_SOFT}
            />
          ))}
        </G>
      ))}
      {/*
       * The lower wall takes a second value. Above the red band the blocks used
       * to run all the way to the props in one unbroken field — the flattest
       * band in the yard, and the one the child stares at while they think.
       */}
      <Rect x={0} y={groundTop - (groundTop - wallTop) * 0.42} width={w} height={(groundTop - wallTop) * 0.42 + 6} fill="rgba(31,42,90,0.055)" />
      {/* a gear rail across the middle of the wall, hung with hose and coats */}
      {groundTop - wallTop > 150 * s ? (
        <G>
          {(() => {
            const railY = groundTop - (groundTop - wallTop) * 0.5;
            return (
              <G>
                <Rect x={w * 0.28} y={railY} width={w * 0.44} height={5.4 * s} rx={2.7 * s} fill="#9AA4C4" />
                <Rect x={w * 0.28} y={railY} width={w * 0.44} height={2 * s} rx={1 * s} fill={HILITE} />
                {[0.32, 0.42, 0.52, 0.62].map((f, i) => (
                  <G key={`gr${i}`}>
                    <Path d={`M ${w * f} ${railY + 5 * s} v ${6 * s} a ${3.6 * s} ${3.6 * s} 0 0 0 ${7 * s} 0`} stroke={palette.slate} strokeWidth={2.8 * s} fill="none" strokeLinecap="round" />
                    {i % 2 === 0 ? (
                      <Path
                        d={`M ${w * f} ${railY + 14 * s} h ${9 * s} l ${3 * s} ${26 * s} q ${-7 * s} ${5 * s} ${-15 * s} 0 z`}
                        fill={[palette.charcoal, palette.navySoft][i % 2]}
                      />
                    ) : (
                      <Rect x={w * f - 1 * s} y={railY + 14 * s} width={12 * s} height={22 * s} rx={5 * s} fill={[palette.safetyYellow, palette.engineRedLight][i % 2]} />
                    )}
                  </G>
                ))}
                {/* an equipment cabinet at the end of the rail */}
                <G>
                  <Rect x={w * 0.76} y={railY - 4 * s} width={34 * s} height={40 * s} rx={6} fill="#E3E8F2" />
                  <Rect x={w * 0.76} y={railY - 4 * s} width={34 * s} height={35 * s} rx={6} fill={palette.white} />
                  <Rect x={w * 0.76 + 13 * s} y={railY + 5 * s} width={8 * s} height={20 * s} rx={2.4} fill={palette.engineRed} />
                  <Rect x={w * 0.76 + 7 * s} y={railY + 11 * s} width={20 * s} height={8 * s} rx={2.4} fill={palette.engineRed} />
                  <Rect x={w * 0.76 + 31 * s} y={railY + 12 * s} width={4 * s} height={9 * s} rx={2} fill={palette.slate} />
                </G>
              </G>
            );
          })()}
        </G>
      ) : null}
      {/* painted red band */}
      <Rect x={0} y={groundTop - 34 * s} width={w} height={13 * s} fill={palette.engineRed} opacity={0.75} />
      <Rect x={0} y={groundTop - 34 * s} width={w} height={4 * s} fill={HILITE_SOFT} />

      {/* the painted target the yard trains on */}
      <G opacity={0.75}>
        <Circle cx={w * 0.2} cy={wallTop + (groundTop - wallTop) * 0.34} r={44 * s} fill={palette.white} />
        <Circle cx={w * 0.2} cy={wallTop + (groundTop - wallTop) * 0.34} r={33 * s} fill={palette.waterCyanLight} />
        <Circle cx={w * 0.2} cy={wallTop + (groundTop - wallTop) * 0.34} r={21 * s} fill={palette.white} />
        <Circle cx={w * 0.2} cy={wallTop + (groundTop - wallTop) * 0.34} r={11 * s} fill={palette.engineRed} />
      </G>
      {/* a ladder leaning on the wall behind the board */}
      <G>
        <Rect x={w * 0.86} y={wallTop + 10 * s} width={5 * s} height={groundTop - wallTop - 12 * s} rx={2.5 * s} fill={palette.safetyYellow} transform={`rotate(5 ${w * 0.88} ${groundTop})`} />
        <Rect x={w * 0.94} y={wallTop + 10 * s} width={5 * s} height={groundTop - wallTop - 12 * s} rx={2.5 * s} fill={palette.safetyYellow} transform={`rotate(5 ${w * 0.88} ${groundTop})`} />
        {Array.from({ length: Math.max(2, Math.round((groundTop - wallTop) / (30 * s))) }, (_, i) => (
          <Rect
            key={`ld${i}`}
            x={w * 0.86}
            y={wallTop + 26 * s + i * 30 * s}
            width={13 * s + w * 0.08}
            height={4.4 * s}
            rx={2.2 * s}
            fill={palette.gold}
            transform={`rotate(5 ${w * 0.88} ${groundTop})`}
          />
        ))}
      </G>
      {/* a downpipe on the left of the wall */}
      <G>
        <Rect x={w * 0.03} y={wallTop + 6 * s} width={9 * s} height={groundTop - wallTop - 6 * s} rx={4.5 * s} fill="#C6B896" />
        <Rect x={w * 0.03} y={wallTop + 6 * s} width={3 * s} height={groundTop - wallTop - 6 * s} fill={HILITE_SOFT} />
        {[0.3, 0.66].map((f, i) => (
          <Rect key={`br${i}`} x={w * 0.03 - 3 * s} y={wallTop + (groundTop - wallTop) * f} width={15 * s} height={5 * s} rx={2.5 * s} fill="#B0A283" />
        ))}
      </G>

      {/* the station shield and a coiled line, high on the wall where they read */}
      <G>
        <Path
          d={`M ${w * 0.52} ${wallTop + (groundTop - wallTop) * 0.16} h ${34 * s} v ${22 * s} q 0 ${14 * s} ${-17 * s} ${20 * s} q ${-17 * s} ${-6 * s} ${-17 * s} ${-20 * s} z`}
          fill={palette.engineRed}
        />
        <Path
          d={`M ${w * 0.52} ${wallTop + (groundTop - wallTop) * 0.16} h ${34 * s} v ${6 * s} h ${-34 * s} z`}
          fill={HILITE}
        />
        <Circle cx={w * 0.52 + 17 * s} cy={wallTop + (groundTop - wallTop) * 0.16 + 20 * s} r={7 * s} fill={palette.safetyYellow} />
      </G>
      <G>
        <Rect x={w * 0.63} y={wallTop + (groundTop - wallTop) * 0.14} width={6 * s} height={18 * s} rx={3 * s} fill={palette.slate} />
        <HoseCoil cx={w * 0.66} cy={wallTop + (groundTop - wallTop) * 0.14 + 34 * s} r={17 * s} />
      </G>

      {/* hose drying rack on the right of the wall */}
      <G>
        <Rect x={w * 0.78} y={wallTop + 22 * s} width={w * 0.17} height={5 * s} rx={2.5 * s} fill={palette.slate} />
        {[0, 1, 2].map((i) => (
          <Path
            key={`hd${i}`}
            d={`M ${w * (0.8 + i * 0.05)} ${wallTop + 26 * s} v ${(28 + i * 8) * s}`}
            stroke={[palette.engineRed, palette.cream, palette.engineRedLight][i % 3]}
            strokeWidth={6 * s}
            strokeLinecap="round"
          />
        ))}
      </G>

      {/* apron */}
      <Ground w={w} h={h} top={groundTop} near="#C7CFE1" lip="#DEE4F1" />
      <Paving w={w} top={groundTop + 18 * s} bottom={h} s={s} unit={76} />
      {[0.34, 0.66].map((f, i) => (
        <Rect key={`ck${i}`} x={w * 0.08} y={groundTop + (h - groundTop) * f} width={w * 0.84} height={3 * s} rx={1.5 * s} fill={palette.white} opacity={0.5} />
      ))}
      {/* a wet patch where the yard has been hosed down — the apron's one soft
          shape, and the reason the ground is not a flat sheet of grey */}
      <Ellipse cx={w * 0.44} cy={h - 10 * s} rx={clamp(w * 0.22, 40, 170)} ry={9 * s} fill={palette.waterCyanLight} opacity={0.4} />
      <Ellipse cx={w * 0.3} cy={h - 16 * s} rx={clamp(w * 0.09, 18, 70)} ry={5 * s} fill={palette.waterCyanLight} opacity={0.3} />
      {/* a stack of spare hose reels in the near corner */}
      <G>
        <Contact cx={w * 0.17} cy={h - 6 * s} rx={22 * s} />
        <HoseCoil cx={w * 0.17} cy={h - 16 * s} r={15 * s} />
        <HoseCoil cx={w * 0.17 + 4 * s} cy={h - 34 * s} r={12 * s} tone={palette.engineRedLight} />
      </G>
      {/* standpipe */}
      <G>
        <Contact cx={w * 0.07} cy={h - 8 * s} rx={16 * s} />
        <Rect x={w * 0.07 - 6 * s} y={groundTop + 4} width={12 * s} height={h - groundTop - 12 * s} rx={5 * s} fill="#9AA4C4" />
        <Rect x={w * 0.07 - 12 * s} y={groundTop + 10 * s} width={24 * s} height={8 * s} rx={4 * s} fill={palette.engineRed} />
      </G>
      {/* cones at the far corners */}
      {[w * 0.88, w * 0.96].map((cxp, i) => (
        <G key={`cn${i}`}>
          <Contact cx={cxp} cy={h - 6 * s} rx={15 * s} />
          <Path d={`M ${cxp - 13 * s} ${h - 8 * s} l ${9 * s} ${-30 * s} h ${8 * s} l ${9 * s} ${30 * s} z`} fill={palette.orange} />
          <Rect x={cxp - 10 * s} y={h - 24 * s} width={20 * s} height={6 * s} rx={2} fill={palette.white} opacity={0.85} />
          <Rect x={cxp - 16 * s} y={h - 10 * s} width={32 * s} height={7 * s} rx={3.5 * s} fill={palette.orangeDark} />
        </G>
      ))}
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.16} ambient={0.14} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 5 — the classroom wall (Word Tap, Word Builder)                */
/* ================================================================== */

export interface ClassroomMetrics {
  boardX: number;
  boardY: number;
  boardW: number;
  boardH: number;
  deskTop: number;
  s: number;
}

export function classroomMetrics(box: PlayBox): ClassroomMetrics {
  const deskH = clamp(box.h * 0.12, 40, 96);
  const deskTop = box.h - deskH;
  const friezeH = clamp(box.h * 0.1, 28, 74);
  const boardY = friezeH + 10 * box.s;
  const boardH = Math.max(60, deskTop - boardY - 22 * box.s);
  const boardW = clamp(box.w * 0.9, 200, 720);
  return { boardX: (box.w - boardW) / 2, boardY, boardW, boardH, deskTop, s: box.s };
}

/**
 * The station's learning corner: an alphabet frieze, a framed chalkboard with a
 * chalk ledge, a wall clock, a bookshelf and a desk edge with an apple and a
 * pencil pot. The word the child reads is pinned on the board.
 */
export const Classroom = memo(function Classroom({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const m = classroomMetrics(box);
  const friezeH = m.boardY - 10 * s;

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="clWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6EEDC" />
          <Stop offset="1" stopColor="#EADCC0" />
        </LinearGradient>
        {/* the chalk that never quite comes off the foot of a board */}
        <LinearGradient id="clDust" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.13} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={m.deskTop + 4} fill="url(#clWall)" />

      {/* alphabet frieze */}
      <G>
        <Rect x={0} y={0} width={w} height={friezeH} fill="#E3D6BA" />
        <Rect x={0} y={friezeH - 5 * s} width={w} height={5 * s} rx={2.5 * s} fill={SHADE_SOFT} />
        {Array.from({ length: 7 }, (_, i) => {
          const cw = (w - 16) / 7;
          const cx = 8 + i * cw + 4 + (cw - 8) / 2;
          const cy = friezeH * 0.48;
          const r = Math.min(friezeH * 0.18, cw * 0.16);
          return (
            <G key={`al${i}`}>
              <Rect x={8 + i * cw + 4} y={friezeH * 0.18} width={cw - 8} height={friezeH * 0.6} rx={7} fill={[palette.pink, palette.safetyYellow, palette.waterCyan, palette.leafGreen][i % 4]} opacity={0.85} />
              <Rect x={12 + i * cw + 4} y={friezeH * 0.26} width={cw - 20} height={friezeH * 0.12} rx={3} fill={HILITE} />
              {/* a drawn mark on every card, so the frieze is not a row of blanks */}
              {i % 4 === 0 ? (
                <Path d={`M ${cx} ${cy - r} l ${r * 0.32} ${r * 0.66} l ${r * 0.72} ${r * 0.1} l ${-r * 0.55} ${r * 0.52} l ${r * 0.16} ${r * 0.72} l ${-r * 0.65} ${-r * 0.36} l ${-r * 0.65} ${r * 0.36} l ${r * 0.16} ${-r * 0.72} l ${-r * 0.55} ${-r * 0.52} l ${r * 0.72} ${-r * 0.1} z`} fill={palette.white} opacity={0.9} />
              ) : i % 4 === 1 ? (
                <Path d={`M ${cx} ${cy - r} q ${r * 0.9} ${r} 0 ${r * 1.7} q ${-r * 0.9} ${-r * 0.7} 0 ${-r * 1.7} z`} fill={palette.white} opacity={0.9} />
              ) : i % 4 === 2 ? (
                <Circle cx={cx} cy={cy} r={r * 0.72} fill={palette.white} opacity={0.9} />
              ) : (
                <Rect x={cx - r * 0.7} y={cy - r * 0.6} width={r * 1.4} height={r * 1.2} rx={r * 0.3} fill={palette.white} opacity={0.9} />
              )}
            </G>
          );
        })}
      </G>

      {/* the chalkboard */}
      <G>
        <Rect x={m.boardX - 4} y={m.boardY + 6} width={m.boardW + 8} height={m.boardH} rx={14} fill={SHADE_SOFT} />
        <Rect x={m.boardX - 10 * s} y={m.boardY - 8 * s} width={m.boardW + 20 * s} height={m.boardH + 20 * s} rx={14} fill={palette.woodDark} />
        <Rect x={m.boardX - 10 * s} y={m.boardY - 8 * s} width={m.boardW + 20 * s} height={m.boardH + 14 * s} rx={14} fill={palette.wood} />
        <Rect x={m.boardX} y={m.boardY} width={m.boardW} height={m.boardH} rx={8} fill="#2F3A50" />
        <Rect x={m.boardX} y={m.boardY} width={m.boardW} height={m.boardH * 0.24} rx={8} fill="#3B4760" />
        {/*
         * CHALK WORK. A blackboard with nothing on it is the same defect as a
         * band of raw sky: a big flat field in the middle of the frame. The
         * board is a used one — a wiped sweep, a heading rule, a number line, a
         * chalk engine and a sun — all pushed to the margins so the word card
         * the game pins in the middle still lands on quiet board.
         */}
        {/* the wiped sweep: what a cloth leaves behind, and the board's material */}
        <Path
          d={`M ${m.boardX} ${m.boardY + m.boardH * 0.72} Q ${m.boardX + m.boardW * 0.3} ${m.boardY + m.boardH * 0.3} ${m.boardX + m.boardW * 0.62} ${m.boardY + m.boardH * 0.5} Q ${m.boardX + m.boardW * 0.86} ${m.boardY + m.boardH * 0.64} ${m.boardX + m.boardW} ${m.boardY + m.boardH * 0.38} L ${m.boardX + m.boardW} ${m.boardY + m.boardH * 0.9} Q ${m.boardX + m.boardW * 0.5} ${m.boardY + m.boardH * 0.62} ${m.boardX} ${m.boardY + m.boardH * 0.94} z`}
          fill={palette.white}
          opacity={0.05}
        />
        {/*
         * The chalk lives in the top and bottom TENTHS of the board and
         * nowhere else. Word Builder pins a full-height sheet over the middle
         * of this board, and anything drawn under it came out as a half-hidden
         * fragment poking round the paper — a stray mark, not a drawing.
         */}
        {/* heading: a double rule with a hand-written wave, top-left */}
        <G opacity={0.26}>
          <Rect x={m.boardX + m.boardW * 0.07} y={m.boardY + m.boardH * 0.035} width={m.boardW * 0.3} height={3} rx={1.5} fill={palette.white} />
          <Path
            d={`M ${m.boardX + m.boardW * 0.07} ${m.boardY + m.boardH * 0.085} q ${m.boardW * 0.03} ${-8} ${m.boardW * 0.06} 0 q ${m.boardW * 0.03} ${8} ${m.boardW * 0.06} 0 q ${m.boardW * 0.03} ${-8} ${m.boardW * 0.06} 0`}
            stroke={palette.white}
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
          />
        </G>
        {/* a chalk engine, drawn in outline the way a teacher would, top-right */}
        <G opacity={0.22}>
          <Rect x={m.boardX + m.boardW * 0.74} y={m.boardY + m.boardH * 0.028} width={m.boardW * 0.18} height={m.boardH * 0.048} rx={4} fill="none" stroke={palette.white} strokeWidth={2.4} />
          <Rect x={m.boardX + m.boardW * 0.74} y={m.boardY + m.boardH * 0.008} width={m.boardW * 0.06} height={m.boardH * 0.024} rx={3} fill="none" stroke={palette.white} strokeWidth={2.2} />
          <Circle cx={m.boardX + m.boardW * 0.785} cy={m.boardY + m.boardH * 0.084} r={Math.max(2.6, m.boardH * 0.016)} fill="none" stroke={palette.white} strokeWidth={2.2} />
          <Circle cx={m.boardX + m.boardW * 0.885} cy={m.boardY + m.boardH * 0.084} r={Math.max(2.6, m.boardH * 0.016)} fill="none" stroke={palette.white} strokeWidth={2.2} />
        </G>
        {/* a number line along the foot: ticks in ONE path */}
        <G opacity={0.2}>
          <Rect x={m.boardX + m.boardW * 0.07} y={m.boardY + m.boardH * 0.945} width={m.boardW * 0.44} height={2.6} rx={1.3} fill={palette.white} />
          <Path
            d={Array.from({ length: 6 }, (_, i) => {
              const tx = m.boardX + m.boardW * (0.07 + i * 0.088);
              return `M ${tx.toFixed(1)} ${(m.boardY + m.boardH * 0.945 - 5).toFixed(1)} h 2.6 v 12 h -2.6 z `;
            }).join('')}
            fill={palette.white}
          />
        </G>
        {/* a chalk sun in the far corner */}
        <G opacity={0.18}>
          <Circle cx={m.boardX + m.boardW * 0.88} cy={m.boardY + m.boardH * 0.945} r={Math.max(6, m.boardH * 0.028)} fill="none" stroke={palette.white} strokeWidth={2.4} />
          <Path
            d={Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              const r0 = Math.max(6, m.boardH * 0.028) + 3;
              const r1 = r0 + Math.max(4, m.boardH * 0.018);
              const cx0 = m.boardX + m.boardW * 0.88;
              const cy0 = m.boardY + m.boardH * 0.945;
              return `M ${(cx0 + Math.cos(a) * r0).toFixed(1)} ${(cy0 + Math.sin(a) * r0).toFixed(1)} L ${(cx0 + Math.cos(a) * r1).toFixed(1)} ${(cy0 + Math.sin(a) * r1).toFixed(1)} `;
            }).join('')}
            stroke={palette.white}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        </G>
        {/* chalk dust: settled along the ledge, and hanging in the air over it
            — the material that says slate rather than dark paint */}
        <Rect x={m.boardX} y={m.boardY + m.boardH - 5} width={m.boardW} height={5} fill={palette.white} opacity={0.11} />
        <Rect
          x={m.boardX}
          y={m.boardY + m.boardH * 0.82}
          width={m.boardW}
          height={m.boardH * 0.18}
          fill="url(#clDust)"
        />
        {/* chalk ledge with chalk and an eraser */}
        <Rect x={m.boardX - 10 * s} y={m.boardY + m.boardH + 4 * s} width={m.boardW + 20 * s} height={9 * s} rx={4 * s} fill="#A2743F" />
        <Rect x={m.boardX - 10 * s} y={m.boardY + m.boardH + 4 * s} width={m.boardW + 20 * s} height={3 * s} rx={1.5 * s} fill={HILITE} />
        {[0, 1, 2].map((i) => (
          <Rect key={`ck${i}`} x={m.boardX + m.boardW * (0.06 + i * 0.06)} y={m.boardY + m.boardH + 1 * s} width={m.boardW * 0.045} height={4 * s} rx={2 * s} fill={[palette.white, palette.pinkSoft, palette.waterCyanLight][i % 3]} />
        ))}
        <Rect x={m.boardX + m.boardW * 0.84} y={m.boardY + m.boardH - 1 * s} width={m.boardW * 0.1} height={6 * s} rx={2.5 * s} fill="#6F7CA6" />
      </G>

      {/* desk edge with an apple and a pencil pot */}
      <Rect x={0} y={m.deskTop} width={w} height={h - m.deskTop} fill="#C0A87C" />
      <Rect x={0} y={m.deskTop} width={w} height={8 * s} rx={4 * s} fill="#EBD9B4" />
      <Rect x={0} y={m.deskTop + 8 * s} width={w} height={3.4 * s} fill={SHADE_SOFT} />
      {/*
       * The desk FACE. Left as one flat plank it was the last empty band in the
       * room — so it gets what a desk really has: two drawer fronts with a rail
       * handle each, a joint between them, and the grain of the wood.
       */}
      {h - m.deskTop > 26 * s
        ? [0.06, 0.56].map((f, i) => {
            const dw = w * 0.38;
            const dx = w * f;
            const dy = m.deskTop + 16 * s;
            const dh = Math.max(12, h - dy - 8 * s);
            return (
              <G key={`dw${i}`}>
                <Rect x={dx} y={dy} width={dw} height={dh} rx={6} fill="#B49A6C" />
                <Rect x={dx} y={dy} width={dw} height={dh - 4 * s} rx={6} fill="#CBB183" />
                <Rect x={dx} y={dy} width={dw} height={3.4 * s} rx={1.7 * s} fill={HILITE_SOFT} />
                <Rect x={dx + dw * 0.3} y={dy + dh * 0.42} width={dw * 0.4} height={Math.max(4, 5 * s)} rx={2.5 * s} fill="#8E7A55" />
                <Rect x={dx + dw * 0.3} y={dy + dh * 0.42} width={dw * 0.4} height={Math.max(1.6, 2 * s)} rx={1} fill={HILITE} />
              </G>
            );
          })
        : null}
      <WoodGrain x={0} y={m.deskTop + 10 * s} w={w} h={h - m.deskTop - 10 * s} lines={4} seed={2} tone="rgba(140,110,66,0.2)" />
      <G>
        <Contact cx={w * 0.08} cy={m.deskTop + 2} rx={14 * s} />
        <Circle cx={w * 0.08} cy={m.deskTop - 10 * s} r={11 * s} fill={palette.engineRed} />
        <Circle cx={w * 0.08 - 3.4 * s} cy={m.deskTop - 13 * s} r={3 * s} fill={HILITE_STRONG} />
        <Rect x={w * 0.08 - 1.2 * s} y={m.deskTop - 24 * s} width={2.4 * s} height={6 * s} rx={1.2 * s} fill={palette.woodDark} />
      </G>
      <G>
        <Contact cx={w * 0.92} cy={m.deskTop + 2} rx={16 * s} />
        <Rect x={w * 0.92 - 12 * s} y={m.deskTop - 18 * s} width={24 * s} height={20 * s} rx={5} fill={palette.waterCyanLight} />
        {[0, 1, 2].map((i) => (
          <Rect key={`pc${i}`} x={w * 0.92 - 8 * s + i * 6 * s} y={m.deskTop - 30 * s} width={4 * s} height={14 * s} rx={2 * s} fill={[palette.safetyYellow, palette.engineRed, palette.leafGreen][i % 3]} />
        ))}
      </G>
      {/* a stack of readers and the station globe share the desk */}
      <G>
        <Contact cx={w * 0.24} cy={m.deskTop + 2} rx={26 * s} />
        {[0, 1, 2].map((i) => (
          <G key={`bk${i}`}>
            <Rect x={w * 0.24 - (24 - i * 2) * s} y={m.deskTop - (8 + i * 7) * s} width={(48 - i * 4) * s} height={7 * s} rx={2.4 * s} fill={[palette.engineRed, palette.waterCyanDark, palette.safetyYellow][i % 3]} />
            <Rect x={w * 0.24 - (24 - i * 2) * s} y={m.deskTop - (8 + i * 7) * s} width={(48 - i * 4) * s} height={2.4 * s} rx={1.2 * s} fill={HILITE} />
          </G>
        ))}
      </G>
      <G>
        <Contact cx={w * 0.72} cy={m.deskTop + 2} rx={18 * s} />
        <Rect x={w * 0.72 - 10 * s} y={m.deskTop - 8 * s} width={20 * s} height={8 * s} rx={3 * s} fill={palette.woodDark} />
        <Circle cx={w * 0.72} cy={m.deskTop - 22 * s} r={15 * s} fill={palette.waterCyan} />
        <Path d={`M ${w * 0.72 - 12 * s} ${m.deskTop - 26 * s} q ${8 * s} ${-5 * s} ${16 * s} ${1 * s} q ${5 * s} ${4 * s} ${8 * s} ${1 * s}`} stroke={palette.leafGreen} strokeWidth={4 * s} fill="none" strokeLinecap="round" />
        <Circle cx={w * 0.72 - 5 * s} cy={m.deskTop - 27 * s} r={4 * s} fill={HILITE} />
      </G>
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.15} ambient={0.13} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 6 — the engine bay (Equipment Check)                           */
/* ================================================================== */

export interface BayMetrics {
  floorTop: number;
  s: number;
}

export function bayMetrics(box: PlayBox): BayMetrics {
  return { floorTop: box.h - clamp(box.h * 0.2, 60, 170), s: box.s };
}

/**
 * The appliance bay the engine is parked in: a roller door, a tool board, a
 * wall hose reel, an ENGINE 1 plaque, a ceiling light strip and a painted bay
 * line on the floor with a puddle.
 */
export const EngineBay = memo(function EngineBay({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { floorTop } = bayMetrics(box);
  const doorW = clamp(w * 0.46, 130, 380);
  const doorX = w * 0.06;
  const doorTop = clamp(h * 0.1, 22, 110);

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="ebWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F2E5CB" />
          <Stop offset="1" stopColor="#E1CFAB" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={floorTop + 4} fill="url(#ebWall)" />
      {/* block coursing on the bay wall — the surface gets a size, in one path */}
      <Path
        d={Array.from({ length: Math.max(2, Math.round(floorTop / (38 * s))) }, (_, i) => {
          const cy = (i + 1) * 38 * s;
          return `M 0 ${cy.toFixed(1)} h ${w.toFixed(1)} v 2 h ${(-w).toFixed(1)} z `;
        }).join('')}
        fill={SHADE_SOFT}
      />

      {/* ceiling light strip */}
      <G>
        <Rect x={w * 0.16} y={6 * s} width={w * 0.68} height={9 * s} rx={4.5 * s} fill="#C9CFE0" />
        <Rect x={w * 0.18} y={8 * s} width={w * 0.64} height={4 * s} rx={2 * s} fill={palette.white} opacity={0.9} />
        <Path d={`M ${w * 0.2} ${15 * s} L ${w * 0.1} ${floorTop} L ${w * 0.9} ${floorTop} L ${w * 0.8} ${15 * s} Z`} fill={palette.white} opacity={0.09} />
      </G>

      {/* the roller door */}
      <G>
        <Rect x={doorX} y={doorTop} width={doorW} height={floorTop - doorTop} rx={10} fill="#B8C0D6" />
        <Rect x={doorX} y={doorTop} width={doorW} height={floorTop - doorTop - 4} rx={10} fill="#CBD2E3" />
        {Array.from({ length: Math.max(4, Math.round((floorTop - doorTop) / (20 * s))) }, (_, i) => (
          <Rect key={`sl${i}`} x={doorX + 4} y={doorTop + 8 + i * 20 * s} width={doorW - 8} height={13 * s} rx={5} fill={i % 2 ? '#DDE2EE' : '#C6CEE0'} />
        ))}
        <Rect x={doorX - 7 * s} y={doorTop - 9 * s} width={doorW + 14 * s} height={12 * s} rx={6 * s} fill={palette.engineRed} />
        <Rect x={doorX - 7 * s} y={doorTop - 9 * s} width={doorW + 14 * s} height={4 * s} rx={2 * s} fill={HILITE} />
      </G>

      {/* tool board + hose reel on the right wall */}
      <G>
        <Rect x={w * 0.6} y={doorTop + 6 * s} width={w * 0.32} height={clamp(h * 0.22, 54, 150)} rx={10} fill="#DFBE8B" />
        <Rect x={w * 0.6} y={doorTop + 6 * s} width={w * 0.32} height={clamp(h * 0.22, 54, 150) - 5} rx={10} fill="#E9CEA3" />
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 6 }, (_, c) => (
            <Circle key={`tb${r}-${c}`} cx={w * (0.62 + c * 0.056)} cy={doorTop + 16 * s + r * 14 * s} r={Math.max(1.2, 2 * s)} fill={SHADE_SOFT} />
          )),
        )}
        <Rect x={w * 0.63} y={doorTop + 20 * s} width={5 * s} height={30 * s} rx={2.5 * s} fill={palette.charcoal} />
        <Rect x={w * 0.7} y={doorTop + 22 * s} width={5 * s} height={26 * s} rx={2.5 * s} fill={palette.wood} />
        <Rect x={w * 0.77} y={doorTop + 20 * s} width={16 * s} height={12 * s} rx={4} fill={palette.safetyYellow} />
        <HoseCoil cx={w * 0.86} cy={doorTop + 40 * s} r={15 * s} />
      </G>

      {/* ENGINE 1 plaque (a plate, not a word — text lives in @/ui) */}
      <G>
        <Rect x={w * 0.6} y={floorTop - 40 * s} width={w * 0.2} height={20 * s} rx={7} fill={palette.navy} />
        <Rect x={w * 0.6} y={floorTop - 40 * s} width={w * 0.2} height={6 * s} rx={3} fill={HILITE_SOFT} />
        {[0, 1, 2].map((i) => (
          <Rect key={`pt${i}`} x={w * (0.62 + i * 0.05)} y={floorTop - 34 * s} width={w * 0.035} height={8 * s} rx={2} fill={palette.safetyYellow} opacity={0.85} />
        ))}
      </G>

      {/* the floor */}
      <Ground w={w} h={h} top={floorTop} near="#C6CEDF" lip="#DEE4F1" />
      <Paving w={w} top={floorTop + 20 * s} bottom={h} s={s} unit={86} />
      <Rect x={w * 0.08} y={floorTop + 14 * s} width={w * 0.84} height={4 * s} rx={2 * s} fill={palette.safetyYellow} opacity={0.7} />
      {/* the pool the ceiling strip throws on the concrete, so the bay reads
          as lit from a fitting rather than from nowhere */}
      <Ellipse cx={w * 0.5} cy={floorTop + (h - floorTop) * 0.62} rx={w * 0.42} ry={(h - floorTop) * 0.44} fill={palette.white} opacity={0.13} />
      <Ellipse cx={w * 0.22} cy={h - 12 * s} rx={30 * s} ry={7 * s} fill={palette.waterCyanLight} opacity={0.55} />
      <Ellipse cx={w * 0.22 - 8 * s} cy={h - 14 * s} rx={13 * s} ry={2.6 * s} fill={palette.white} opacity={0.5} />
      <Ellipse cx={w * 0.78} cy={h - 8 * s} rx={20 * s} ry={5 * s} fill={SHADE_SOFT} />
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.15} ambient={0.15} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 7 — the street (Hydrant Match, Code the Route)                 */
/* ================================================================== */

export interface StreetMetrics {
  roadTop: number;
  shopBase: number;
  s: number;
}

export function streetMetrics(box: PlayBox): StreetMetrics {
  const roadTop = box.h - clamp(box.h * 0.3, 90, 220);
  return { roadTop, shopBase: roadTop, s: box.s };
}

/** One 2.5D shopfront: side plane, cornice, awning, sill, signage plate. */
function Shopfront({
  x,
  w,
  base,
  top,
  wall,
  roof,
  awning,
  s,
}: {
  x: number;
  w: number;
  base: number;
  top: number;
  wall: string;
  roof: string;
  awning: string;
  s: number;
}) {
  const side = Math.max(8, w * 0.12);
  const h = base - top;
  return (
    <G>
      <Rect x={x} y={top} width={w} height={h} rx={6} fill={wall} />
      <Path d={`M ${x + w - side} ${top} L ${x + w} ${top + 7 * s} L ${x + w} ${base} L ${x + w - side} ${base} Z`} fill={SHADE_SOFT} />
      <Rect x={x} y={top} width={w * 0.1} height={h} fill={HILITE_SOFT} />
      {/* cornice + roof slab */}
      <Rect x={x - 5 * s} y={top - 9 * s} width={w + 10 * s} height={11 * s} rx={5 * s} fill={roof} />
      <Rect x={x - 5 * s} y={top - 9 * s} width={w + 10 * s} height={3.4 * s} rx={1.7 * s} fill={HILITE} />
      <Rect x={x} y={top + 2 * s} width={w} height={4 * s} fill={SHADE_SOFT} />
      {/* upper windows with sills */}
      {[0, 1].map((i) => (
        <G key={`uw${i}`}>
          <Rect x={x + w * (0.16 + i * 0.42)} y={top + 16 * s} width={w * 0.26} height={Math.max(10, h * 0.24)} rx={4} fill="#33477A" />
          <Rect x={x + w * (0.16 + i * 0.42)} y={top + 16 * s} width={w * 0.26} height={Math.max(4, h * 0.08)} rx={4} fill="#4A5FA8" />
          <Rect x={x + w * (0.14 + i * 0.42)} y={top + 16 * s + Math.max(10, h * 0.24)} width={w * 0.3} height={4 * s} rx={2 * s} fill={SHADE} />
        </G>
      ))}
      {/*
       * THE STOREY BETWEEN. From the sills to the signboard the façade used to
       * be one unbroken slab of render — a hand's width of flat cream across
       * the middle of the frame, which is the blandest thing a backdrop can do.
       * It now gets a string course, a second storey of smaller windows with a
       * flower box, and the render's own coursing.
       */}
      {h > 150 * s ? (
        <G>
          {/* render coursing: one path, so a whole wall costs a single node */}
          <Path
            d={[0.36, 0.44, 0.52, 0.6].map((f) => {
              const cy = top + h * f;
              return `M ${x.toFixed(1)} ${cy.toFixed(1)} h ${w.toFixed(1)} v 2 h ${(-w).toFixed(1)} z `;
            }).join('')}
            fill={SHADE_SOFT}
          />
          {/* string course */}
          <Rect x={x - 3 * s} y={top + h * 0.32} width={w + 6 * s} height={6 * s} rx={3 * s} fill={roof} opacity={0.55} />
          <Rect x={x - 3 * s} y={top + h * 0.32} width={w + 6 * s} height={2.2 * s} rx={1.1 * s} fill={HILITE} />
          {/* second storey: three smaller sashes */}
          {[0.12, 0.4, 0.68].map((f, i) => (
            <G key={`sw${i}`}>
              <Rect x={x + w * f} y={top + h * 0.4} width={w * 0.2} height={h * 0.14} rx={4} fill="#3D5290" />
              <Rect x={x + w * f} y={top + h * 0.4} width={w * 0.2} height={h * 0.05} rx={4} fill="#5B72BE" />
              <Rect x={x + w * f + w * 0.093} y={top + h * 0.4} width={2.4} height={h * 0.14} fill={palette.cream} opacity={0.55} />
              <Rect x={x + w * (f - 0.015)} y={top + h * 0.54} width={w * 0.23} height={3.4 * s} rx={1.7 * s} fill={SHADE} />
            </G>
          ))}
          {/* a window box on the middle sill — the one warm note on the storey */}
          <G>
            <Rect x={x + w * 0.385} y={top + h * 0.545} width={w * 0.23} height={h * 0.05} rx={3} fill={palette.woodDark} />
            <Rect x={x + w * 0.385} y={top + h * 0.545} width={w * 0.23} height={h * 0.017} rx={2} fill={HILITE_SOFT} />
            {[0.06, 0.115, 0.17].map((g, i) => (
              <Circle key={`fl${i}`} cx={x + w * (0.385 + g)} cy={top + h * 0.54} r={Math.max(2.4, h * 0.016)} fill={[palette.engineRedLight, palette.safetyYellow, palette.pink][i % 3]} />
            ))}
          </G>
          {/* a downpipe hugging the shaded edge */}
          <Rect x={x + w - side * 0.55} y={top + h * 0.3} width={4.4 * s} height={h * 0.4} rx={2.2 * s} fill={SHADE} />
        </G>
      ) : null}
      {/* signage plate */}
      <Rect x={x + w * 0.14} y={base - h * 0.42} width={w * 0.72} height={Math.max(9, h * 0.11)} rx={5} fill={palette.cream} />
      <Rect x={x + w * 0.14} y={base - h * 0.42} width={w * 0.72} height={Math.max(3, h * 0.04)} rx={3} fill={HILITE} />
      {/* drawn lettering, so the sign is a sign rather than a blank plate */}
      <Path
        d={[0.2, 0.34, 0.46, 0.56, 0.68].map((f, i) => {
          const lw = w * (i % 2 ? 0.08 : 0.1);
          const ly = base - h * 0.42 + Math.max(9, h * 0.11) * 0.42;
          return `M ${(x + w * f).toFixed(1)} ${ly.toFixed(1)} h ${lw.toFixed(1)} v ${Math.max(2.6, h * 0.028).toFixed(1)} h ${(-lw).toFixed(1)} z `;
        }).join('')}
        fill={palette.navyMuted}
        opacity={0.45}
      />
      {/* awning — canvas, so it takes the light on its crown and throws the
          shopfront under it into shade */}
      <G>
        {Array.from({ length: 5 }, (_, i) => (
          <G key={`aw${i}`}>
            <Path
              d={`M ${x + (w / 5) * i} ${base - h * 0.28} h ${w / 5} v ${11 * s} q ${-w / 10} ${6 * s} ${-w / 5} 0 z`}
              fill={i % 2 ? palette.cream : awning}
            />
            {/* the fold: every scallop is a bulge of cloth, lit at the ridge */}
            <Path
              d={`M ${x + (w / 5) * i} ${base - h * 0.28} h ${w / 10} v ${13 * s} q ${-w / 20} ${3 * s} ${-w / 10} 0 z`}
              fill={HILITE_SOFT}
            />
            <Path
              d={`M ${x + (w / 5) * i + w / 10} ${base - h * 0.28} h ${w / 10} v ${11 * s} q ${-w / 20} ${5 * s} ${-w / 10} ${2 * s} z`}
              fill={SHADE_SOFT}
            />
          </G>
        ))}
        <Rect x={x - 2 * s} y={base - h * 0.28 - 4 * s} width={w + 4 * s} height={6 * s} rx={3 * s} fill={awning} />
        <Rect x={x - 2 * s} y={base - h * 0.28 - 4 * s} width={w + 4 * s} height={2.2 * s} rx={1.1 * s} fill={HILITE} />
      </G>
      {/* what the awning throws onto the shopfront below it */}
      <Rect x={x} y={base - h * 0.28 + 15 * s} width={w} height={Math.max(6, h * 0.09)} fill={SHADE_SOFT} />
      {/* shop window + door */}
      <Rect x={x + w * 0.1} y={base - h * 0.16} width={w * 0.48} height={h * 0.16} rx={4} fill="#9FC9E8" />
      <Rect x={x + w * 0.1} y={base - h * 0.16} width={w * 0.48} height={h * 0.05} rx={3} fill={HILITE} />
      <Rect x={x + w * 0.66} y={base - h * 0.18} width={w * 0.2} height={h * 0.18} rx={4} fill={palette.woodDark} />
      <Circle cx={x + w * 0.7} cy={base - h * 0.09} r={2.4 * s} fill={palette.safetyYellow} />
    </G>
  );
}

/**
 * A block of Spark City: three individual shopfronts over a pavement with a
 * kerb, a drain, a lamp post and a litter bin. Used where the activity is
 * played in the street.
 */
export const StreetBlock = memo(function StreetBlock({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { roadTop } = streetMetrics(box);
  const shops: { f: number; wf: number; topf: number; wall: string; roof: string; awn: string }[] = [
    { f: -0.04, wf: 0.36, topf: 0.2, wall: '#F3DFBD', roof: palette.engineRed, awn: palette.engineRed },
    { f: 0.33, wf: 0.34, topf: 0.12, wall: '#EFE1CA', roof: '#4A5FA8', awn: palette.waterCyanDark },
    { f: 0.68, wf: 0.38, topf: 0.24, wall: '#F6E3C2', roof: palette.leafGreenDark, awn: palette.leafGreen },
  ];

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="stSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6FC0F8" />
          <Stop offset="1" stopColor="#C6E7FF" />
        </LinearGradient>
        <LinearGradient id="stCast" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.navy} stopOpacity={0.2} />
          <Stop offset="1" stopColor={palette.navy} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={roadTop + 6} fill="url(#stSky)" />
      <Ellipse cx={w * 0.22} cy={h * 0.08} rx={40 * s} ry={15 * s} fill={palette.white} opacity={0.6} />
      <Ellipse cx={w * 0.32} cy={h * 0.07} rx={26 * s} ry={11 * s} fill={palette.white} opacity={0.6} />

      {/* far rooftops */}
      <G opacity={0.45}>
        {Array.from({ length: Math.max(4, Math.round(w / 90)) }, (_, i) => (
          <Rect key={`fr${i}`} x={i * 90 - 20} y={roadTop - (110 + (i % 3) * 30) * s} width={72} height={140 * s} rx={7} fill="#9FCBEA" />
        ))}
      </G>

      {shops.map((sh, i) => (
        <Shopfront
          key={`sf${i}`}
          x={w * sh.f}
          w={w * sh.wf}
          base={roadTop}
          top={Math.max(24 * s, roadTop - h * (0.9 - sh.topf))}
          wall={sh.wall}
          roof={sh.roof}
          awning={sh.awn}
          s={s}
        />
      ))}

      {/* pavement + kerb + road */}
      <Ground w={w} h={h} top={roadTop} near="#C4CCDE" lip="#E3E8F2" />
      {/* the block's own shadow, thrown forward onto the flags — a row of
          shopfronts standing on paint is the giveaway that nothing is lit */}
      <Rect x={0} y={roadTop} width={w} height={clamp((h - roadTop) * 0.42, 14, 60)} fill="url(#stCast)" />
      <Rect x={0} y={roadTop + 16 * s} width={w} height={4 * s} fill={SHADE_SOFT} />
      {/* the flags of the pavement: material, not props */}
      <Paving w={w} top={roadTop + 22 * s} bottom={h} s={s} unit={80} />
      {/* drain */}
      <G>
        <Rect x={w * 0.12} y={roadTop + 24 * s} width={24 * s} height={11 * s} rx={4} fill="#AEB6CC" />
        {[0, 1, 2].map((i) => (
          <Rect key={`dr${i}`} x={w * 0.12 + 4 * s + i * 6 * s} y={roadTop + 26 * s} width={2.6 * s} height={7 * s} rx={1.3} fill={SHADE} />
        ))}
      </G>
      {/* lamp post — head fully inside the frame */}
      <G>
        <Contact cx={w * 0.9} cy={roadTop + 18 * s} rx={13 * s} />
        <Rect x={w * 0.9 - 3.4 * s} y={Math.max(30 * s, roadTop - 120 * s)} width={7 * s} height={120 * s + 16 * s} rx={3.5 * s} fill="#5A6488" />
        <Path d={`M ${w * 0.9} ${Math.max(30 * s, roadTop - 120 * s)} q 0 ${-14 * s} ${-20 * s} ${-14 * s}`} stroke="#5A6488" strokeWidth={6 * s} fill="none" strokeLinecap="round" />
        <Path d={`M ${w * 0.9 - 30 * s} ${Math.max(16 * s, roadTop - 134 * s)} h ${20 * s} l ${-4 * s} ${13 * s} h ${-12 * s} z`} fill={palette.safetyYellow} />
      </G>
      {/* litter bin */}
      <G>
        <Contact cx={w * 0.08} cy={roadTop + 20 * s} rx={13 * s} />
        <Path d={`M ${w * 0.08 - 11 * s} ${roadTop - 22 * s} h ${22 * s} l ${-2.6 * s} ${40 * s} h ${-16.8 * s} z`} fill="#6F7CA6" />
        <Rect x={w * 0.08 - 13 * s} y={roadTop - 26 * s} width={26 * s} height={7 * s} rx={3.5 * s} fill="#5A6488" />
      </G>
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.15} ambient={0.14} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 8 — the market street (Market Money)                           */
/* ================================================================== */

export interface MarketMetrics {
  pavingTop: number;
  s: number;
}

export function marketMetrics(box: PlayBox, pavingTop?: number): MarketMetrics {
  return { pavingTop: pavingTop ?? box.h - clamp(box.h * 0.3, 92, 230), s: box.s };
}

/**
 * The market the stall stands in: neighbouring stalls left and right, a chalk
 * menu board, a lamp post with a hanging basket and a cobbled paving with
 * crates — so the stall is part of a market instead of an object in the sky.
 */
export const MarketStreet = memo(function MarketStreet({ box, pavingTop: pavingOverride }: { box: PlayBox; pavingTop?: number }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { pavingTop } = marketMetrics(box, pavingOverride);
  const neighTop = clamp(h * 0.12, 26, 130);

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="mkSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#6FC0F8" />
          <Stop offset="1" stopColor="#CDEAFF" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={pavingTop + 6} fill="url(#mkSky)" />
      <Ellipse cx={w * 0.78} cy={h * 0.1} rx={34 * s} ry={14 * s} fill={palette.white} opacity={0.6} />

      {/* town rooftops behind the market */}
      <G opacity={0.75}>
        {Array.from({ length: Math.max(4, Math.round(w / 96)) }, (_, i) => (
          <G key={`mr${i}`}>
            <Rect x={i * 96 - 24} y={neighTop - (34 + (i % 3) * 20) * s} width={76} height={130 * s} rx={7} fill="#8FBEDE" />
            <Path d={`M ${i * 96 - 32} ${neighTop - (34 + (i % 3) * 20) * s} L ${i * 96 + 14} ${neighTop - (58 + (i % 3) * 20) * s} L ${i * 96 + 60} ${neighTop - (34 + (i % 3) * 20) * s} Z`} fill="#7BAED4" />
          </G>
        ))}
      </G>

      {/* the two neighbouring stalls, cropped deliberately by the frame edge */}
      {[
        { x: -w * 0.14, tone: palette.purple },
        { x: w * 0.78, tone: palette.leafGreen },
      ].map((n, i) => {
        const nw = w * 0.36;
        return (
          <G key={`ns${i}`}>
            <Rect x={n.x} y={neighTop + 18 * s} width={nw} height={pavingTop - neighTop - 18 * s} rx={8} fill="#EDD9B2" />
            <Rect x={n.x} y={neighTop + 18 * s} width={nw * 0.12} height={pavingTop - neighTop - 18 * s} fill={HILITE_SOFT} />
            {Array.from({ length: 6 }, (_, k) => (
              <G key={`na${k}`}>
                <Path
                  d={`M ${n.x + (nw / 6) * k} ${neighTop} h ${nw / 6} v ${16 * s} q ${-nw / 12} ${8 * s} ${-nw / 6} 0 z`}
                  fill={k % 2 ? palette.cream : n.tone}
                  opacity={0.9}
                />
                <Path
                  d={`M ${n.x + (nw / 6) * k + nw / 12} ${neighTop} h ${nw / 12} v ${16 * s} q ${-nw / 24} ${6 * s} ${-nw / 12} ${2 * s} z`}
                  fill={SHADE_SOFT}
                />
              </G>
            ))}
            {/* the shade the neighbour's canvas throws down its own front */}
            <Rect x={n.x} y={neighTop + 24 * s} width={nw} height={18 * s} fill={SHADE_SOFT} />
            <Rect x={n.x - 3 * s} y={neighTop - 5 * s} width={nw + 6 * s} height={8 * s} rx={4 * s} fill={n.tone} opacity={0.9} />
            <Rect x={n.x + nw * 0.16} y={pavingTop - 46 * s} width={nw * 0.68} height={30 * s} rx={6} fill={palette.wood} />
            {[0, 1, 2].map((k) => (
              <Circle key={`nf${k}`} cx={n.x + nw * (0.26 + k * 0.2)} cy={pavingTop - 50 * s} r={8 * s} fill={[palette.engineRed, palette.safetyYellow, palette.orange][k % 3]} />
            ))}
          </G>
        );
      })}

      {/* paving */}
      <Ground w={w} h={h} top={pavingTop} near="#E3CFA6" lip="#F1E2C1" />
      {/* cobbles, as a running bond in a single path: the market's floor has a
          size, so the stall reads as standing on a street rather than on paint */}
      <Paving w={w} top={pavingTop + 16 * s} bottom={h} s={s} unit={54} tone="rgba(158,106,54,0.16)" />
      <Rect x={0} y={pavingTop + 14 * s} width={w} height={3.4 * s} fill="rgba(158,106,54,0.2)" />
      {/* the stall's own cast shadow, so it is planted rather than pasted on */}
      <Ellipse cx={w * 0.5} cy={pavingTop + 20 * s} rx={w * 0.44} ry={11 * s} fill={palette.navy} opacity={0.07} />
      {/* chalk menu board propped at the near edge of the market */}
      <G>
        <Contact cx={w * 0.09} cy={h - 8 * s} rx={24 * s} />
        <Rect x={w * 0.09 - 22 * s} y={h - 74 * s} width={44 * s} height={70 * s} rx={7} fill={palette.woodDark} />
        <Rect x={w * 0.09 - 18 * s} y={h - 70 * s} width={36 * s} height={60 * s} rx={5} fill="#2F3A50" />
        {[0, 1, 2].map((i) => (
          <Rect key={`cm${i}`} x={w * 0.09 - 12 * s} y={h - 60 * s + i * 13 * s} width={(24 - i * 5) * s} height={3.4 * s} rx={1.7} fill={palette.white} opacity={0.34} />
        ))}
      </G>

      {/* crates at the frame edges */}
      {[{ x: w * 0.82, tone: palette.leafGreen }].map((c, i) => (
        <G key={`ct${i}`}>
          <Contact cx={c.x + 26 * s} cy={h - 6 * s} rx={30 * s} />
          <Path d={`M ${c.x} ${h - 40 * s} h ${52 * s} l ${-4 * s} ${34 * s} h ${-44 * s} z`} fill={palette.wood} />
          <Rect x={c.x - 3 * s} y={h - 46 * s} width={58 * s} height={9 * s} rx={4.5 * s} fill={palette.woodDark} />
          {[0, 1, 2].map((k) => (
            <Circle key={`cf${k}`} cx={c.x + (12 + k * 15) * s} cy={h - 50 * s} r={9 * s} fill={k % 2 ? palette.safetyYellow : c.tone} />
          ))}
        </G>
      ))}
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.16} ambient={0.13} tint="#FFF6E5" />
    </SceneLayer>
  );
});

/* ================================================================== */
/* ROOM 9 — the plan room (Code the Route, Lay the Hose)               */
/* ================================================================== */

export interface PlanRoomMetrics {
  tableTop: number;
  s: number;
}

export function planRoomMetrics(box: PlayBox): PlanRoomMetrics {
  return { tableTop: box.h - clamp(box.h * 0.13, 40, 110), s: box.s };
}

/**
 * The planning room the route board is laid out in: a blueprint wall with
 * rolled plans, a set square and a pinned photo, over the edge of the plan
 * table. The board the child touches sits on the table.
 */
export const PlanRoom = memo(function PlanRoom({ box }: { box: PlayBox }) {
  if (!boxReady(box)) return null;
  const { w, h, s } = box;
  const { tableTop } = planRoomMetrics(box);

  return (
    <SceneLayer box={box}>
      <Defs>
        <LinearGradient id="prWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9D6E8" />
          <Stop offset="1" stopColor="#A9BAD6" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={tableTop + 4} fill="url(#prWall)" />
      {/* faint drawing grid */}
      {Array.from({ length: Math.round(w / (34 * s)) + 1 }, (_, i) => (
        <Rect key={`gv${i}`} x={i * 34 * s} y={0} width={1.4} height={tableTop} fill={HILITE_SOFT} />
      ))}
      {Array.from({ length: Math.round(tableTop / (34 * s)) + 1 }, (_, i) => (
        <Rect key={`gh${i}`} x={0} y={i * 34 * s} width={w} height={1.4} fill={HILITE_SOFT} />
      ))}

      {/* rolled plans on a rack, top-left */}
      <G>
        <Rect x={w * 0.04} y={10 * s} width={w * 0.2} height={7 * s} rx={3.5 * s} fill={palette.slate} />
        {[0, 1, 2].map((i) => (
          <G key={`rp${i}`}>
            <Rect x={w * (0.05 + i * 0.055)} y={14 * s} width={12 * s} height={(38 + i * 8) * s} rx={6 * s} fill={palette.cream} />
            <Rect x={w * (0.05 + i * 0.055)} y={14 * s} width={4 * s} height={(38 + i * 8) * s} rx={2 * s} fill={HILITE} />
          </G>
        ))}
      </G>

      {/* set square + a pinned photo, top-right */}
      <G>
        <Path d={`M ${w * 0.78} ${14 * s} h ${54 * s} l ${-54 * s} ${54 * s} z`} fill={palette.waterCyanLight} opacity={0.85} />
        <Path d={`M ${w * 0.78 + 9 * s} ${22 * s} h ${32 * s} l ${-32 * s} ${32 * s} z`} fill="url(#prWall)" opacity={0.6} />
      </G>
      <Notice x={w * 0.56} y={12 * s} w={w * 0.16} h={30 * s} s={s} lines={2} />

      {/* a pinned route photo and the station plaque, mid-wall */}
      <Notice x={w * 0.3} y={16 * s} w={w * 0.18} h={34 * s} s={s} lines={3} tint={palette.creamDeep} />
      <G>
        <Rect x={w * 0.86} y={14 * s} width={w * 0.1} height={26 * s} rx={6} fill={palette.engineRed} />
        <Rect x={w * 0.86} y={14 * s} width={w * 0.1} height={8 * s} rx={4} fill={HILITE} />
        <Circle cx={w * 0.91} cy={14 * s + 16 * s} r={5 * s} fill={palette.safetyYellow} />
      </G>

      {/*
       * WAINSCOT. The plan board covers the middle of this wall, so what the
       * child actually sees of the room is a strip above it and a strip below —
       * and below it was one flat sheet of blueprint blue. A dado rail and a
       * half-tone panelled skirt give the lower wall its own value, and the
       * clock and the pinned elevation give the strip above the board something
       * to be about.
       */}
      {(() => {
        const dado = tableTop - clamp(tableTop * 0.16, 24, 96);
        return (
          <G>
            <Rect x={0} y={dado} width={w} height={tableTop - dado + 4} fill="rgba(31,42,90,0.07)" />
            <Rect x={0} y={dado} width={w} height={5 * s} rx={2.5 * s} fill="#DCE5F2" />
            <Rect x={0} y={dado + 5 * s} width={w} height={2.4 * s} fill={SHADE_SOFT} />
            {/* panel joints in the skirt — one path, four panels */}
            <Path
              d={[0.14, 0.38, 0.62, 0.86].map((f) => `M ${(w * f).toFixed(1)} ${(dado + 12 * s).toFixed(1)} h 2 v ${(tableTop - dado - 16 * s).toFixed(1)} h -2 z `).join('')}
              fill={HILITE_SOFT}
            />
          </G>
        );
      })()}
      {/* the watch clock and a wide pinned elevation, filling the band the top
          props left bare */}
      <WallClock cx={w * 0.5} cy={clamp(tableTop * 0.16, 30, 88)} r={clamp(tableTop * 0.055, 11, 26)} tone={palette.navySoft} />
      <G>
        <Rect x={w * 0.06} y={clamp(tableTop * 0.24, 56, 140)} width={w * 0.34} height={clamp(tableTop * 0.09, 16, 44)} rx={4} fill={palette.panel} opacity={0.9} />
        <Rect x={w * 0.06} y={clamp(tableTop * 0.24, 56, 140)} width={w * 0.34} height={clamp(tableTop * 0.03, 5, 14)} rx={3} fill={HILITE} />
        <Path
          d={[0.09, 0.17, 0.25, 0.33].map((f) => {
            const py = clamp(tableTop * 0.24, 56, 140) + clamp(tableTop * 0.055, 10, 26);
            return `M ${(w * f).toFixed(1)} ${py.toFixed(1)} h ${(w * 0.05).toFixed(1)} v 2.6 h ${(-w * 0.05).toFixed(1)} z `;
          }).join('')}
          fill={palette.navyMuted}
          opacity={0.35}
        />
      </G>

      {/* the table */}
      <Rect x={0} y={tableTop} width={w} height={h - tableTop} fill="#B08A57" />
      <Rect x={0} y={tableTop} width={w} height={8 * s} rx={4 * s} fill="#D6AC77" />
      <Rect x={0} y={tableTop + 8 * s} width={w} height={3.4 * s} fill={SHADE_SOFT} />
      {/* the plan table is oak, not a brown rectangle */}
      <WoodGrain x={0} y={tableTop + 10 * s} w={w} h={h - tableTop - 10 * s} lines={4} seed={3} tone="rgba(104,64,28,0.2)" />
      <WoodGrain x={0} y={tableTop + 10 * s} w={w} h={h - tableTop - 10 * s} lines={2} seed={5} tone="rgba(255,232,196,0.16)" />
      {/* what a planner keeps on the table: a mug, a rule and two pencils */}
      <Mug x={w * 0.04} baseY={h - 4 * s} s={s * 0.9} tint={palette.waterCyanLight} />
      <G>
        <Rect x={w * 0.24} y={h - 16 * s} width={w * 0.26} height={9 * s} rx={3} fill={palette.creamDeep} />
        <Rect x={w * 0.24} y={h - 16 * s} width={w * 0.26} height={3 * s} rx={1.5} fill={HILITE} />
        {Array.from({ length: 8 }, (_, i) => (
          <Rect key={`tk${i}`} x={w * (0.25 + i * 0.03)} y={h - 14 * s} width={1.6} height={4 * s} fill={palette.navyMuted} opacity={0.4} />
        ))}
      </G>
      <G>
        <Rect x={w * 0.62} y={h - 14 * s} width={w * 0.16} height={5 * s} rx={2.5 * s} fill={palette.safetyYellow} />
        <Rect x={w * 0.62} y={h - 22 * s} width={w * 0.13} height={5 * s} rx={2.5 * s} fill={palette.engineRed} transform={`rotate(-6 ${w * 0.68} ${h - 20 * s})`} />
      </G>
      {/* a model appliance parked on the corner of the table */}
      <G>
        <Contact cx={w * 0.9} cy={h - 5 * s} rx={22 * s} />
        <Rect x={w * 0.9 - 20 * s} y={h - 24 * s} width={40 * s} height={15 * s} rx={5} fill={palette.engineRed} />
        <Rect x={w * 0.9 - 20 * s} y={h - 24 * s} width={40 * s} height={5 * s} rx={2.5} fill={HILITE} />
        <Rect x={w * 0.9 - 20 * s} y={h - 30 * s} width={16 * s} height={7 * s} rx={3} fill={palette.engineRedDark} />
        <Circle cx={w * 0.9 - 12 * s} cy={h - 8 * s} r={5 * s} fill={palette.charcoal} />
        <Circle cx={w * 0.9 + 12 * s} cy={h - 8 * s} r={5 * s} fill={palette.charcoal} />
      </G>
      {/* the room's one light: key from the upper left, occlusion in the far
          corner — drawn last so every surface shades together */}
      <SceneLight w={w} h={h} keyLight={0.14} ambient={0.15} />
    </SceneLayer>
  );
});
