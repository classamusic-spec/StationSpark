import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { ToppingId, VocabWord } from '@/learning/types';
import { palette, radii, shadows } from '@/theme';
import { Text } from '@/ui/Text';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { toppings } from '../food';
import { type Pt, type Wedge, buildWedges, scatterPoints, wedgePath } from '../fractionMath';

/* ------------------------------------------------------------------ */
/* Blue bowl (the reference's ingredient bowls)                          */
/* ------------------------------------------------------------------ */

export function BlueBowl({ size, word, glyphId }: { size: number; word?: VocabWord; glyphId?: string }) {
  const bowlH = size * 0.46;
  return (
    <View style={{ width: size, height: size * 0.86 }}>
      <View style={[styles.center, { position: 'absolute', top: 0, left: 0, right: 0, height: size * 0.6 }]}>
        <VocabIcon id={glyphId ?? word?.id ?? 'bread'} size={size * 0.54} />
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <Svg width={size} height={bowlH} viewBox="0 0 100 46">
          <Defs>
            <LinearGradient id="bowlBlue" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#5AA0E8" />
              <Stop offset="1" stopColor="#2E63B8" />
            </LinearGradient>
          </Defs>
          <Path d="M4 8h92c0 22-14 36-46 36S4 30 4 8z" fill="url(#bowlBlue)" />
          <Ellipse cx={50} cy={9} rx={47} ry={9} fill="#7FBDF5" />
          <Ellipse cx={50} cy={9} rx={40} ry={6} fill="#2B5FB0" opacity={0.55} />
          <Path d="M16 20c4 10 14 17 24 18-14 1-26-6-30-16z" fill="rgba(255,255,255,0.28)" />
        </Svg>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* One ingredient, standing on something                                 */
/* ------------------------------------------------------------------ */

/**
 * A piece of food ON A DISH.
 *
 * The word-bank art is a sticker: correct for a flash card, weightless in a
 * kitchen. Everywhere a child reads an ingredient off a list or picks one off a
 * counter, the sticker gets a shallow cream dish to stand in — a lit rim, a
 * shaded well, and two contact shadows under it — so the thing being counted
 * has somewhere to *be*. That is the whole difference between an icon and an
 * object, and it costs one small drawing.
 */
export function FoodThumb({ id, size }: { id: string; size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="fbDish" x1="0.15" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor="#FFFDF6" />
            <Stop offset="1" stopColor="#EFDDBC" />
          </LinearGradient>
        </Defs>
        {/* what the dish lays on whatever it is standing on */}
        <Ellipse cx={52} cy={90} rx={38} ry={7} fill="rgba(31,42,90,0.06)" />
        <Ellipse cx={50} cy={88} rx={30} ry={5} fill="rgba(31,42,90,0.15)" />
        {/* the dish: its underside, its face, and the well the food sits in */}
        <Ellipse cx={50} cy={83} rx={39} ry={12} fill="#D9BE92" />
        <Ellipse cx={50} cy={79} rx={39} ry={12} fill="url(#fbDish)" />
        <Ellipse cx={50} cy={79} rx={27} ry={7.5} fill="#F3E2C4" />
        <Path d="M13 76a39 12 0 0 1 30 -9 39 12 0 0 0 -25 11z" fill="rgba(255,255,255,0.9)" />
        <Path d="M87 82a39 12 0 0 1 -26 9 39 12 0 0 0 21 -11z" fill="rgba(31,42,90,0.08)" />
      </Svg>
      <View style={[styles.thumbFood, { bottom: size * 0.23 }]} pointerEvents="none">
        <VocabIcon id={id} size={size * 0.88} noShadow />
      </View>
    </View>
  );
}

/**
 * A piece of food resting on a surface it is already part of — a tray, a
 * board, a table. No dish: just the two-part contact shadow that says the thing
 * is lying on wood and not floating in front of it. The sheet's own hairline
 * ellipse is too light to do that job at the size a tray of eight is drawn.
 */
export function FoodOnSurface({ id, size }: { id: string; size: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Ellipse cx={53} cy={91} rx={34} ry={6} fill="rgba(31,42,90,0.07)" />
        <Ellipse cx={51} cy={90} rx={25} ry={4.4} fill="rgba(31,42,90,0.17)" />
      </Svg>
      <VocabIcon id={id} size={size} noShadow />
    </View>
  );
}

/**
 * The navy ellipse a figure standing on the table owes the table. `CrewFigure`
 * draws a person, not a scene, so the ground under one is the scene's job.
 */
export function FigureShadow({ width, style }: { width: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width, height: width * 0.3 }, style]} pointerEvents="none">
      <Svg width={width} height={width * 0.3} viewBox="0 0 100 30">
        <Ellipse cx={51} cy={17} rx={44} ry={9} fill="rgba(31,42,90,0.06)" />
        <Ellipse cx={50} cy={16} rx={33} ry={6} fill="rgba(31,42,90,0.16)" />
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tan side rack + its cream cells (straight from the reference)         */
/* ------------------------------------------------------------------ */

export function RackPanel({ width, height, style }: { width: number; height: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Rect x={0} y={0} width={width} height={height} rx={18} fill={palette.tan} />
        <Rect x={0} y={0} width={width} height={height} rx={18} fill="none" stroke={palette.tanDark} strokeWidth={4} />
        <Rect x={6} y={6} width={width - 12} height={height - 12} rx={13} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={3} />
      </Svg>
    </View>
  );
}

/** One ingredient in the rack: cream cell, blue bowl, name underneath. */
export function BowlCell({
  word,
  width,
  label,
  selected,
  dim,
  glyphId,
}: {
  word: VocabWord;
  width: number;
  label: string;
  selected?: boolean;
  dim?: boolean;
  glyphId?: string;
}) {
  return (
    <View style={[styles.cell, shadows.soft, { width }, selected && styles.cellSelected, dim && styles.cellDim]}>
      <BlueBowl size={width * 0.74} word={word} glyphId={glyphId} />
      {/* BLOCKING DEFECT FIX: "Bell pep…" — ingredient names wrap now instead
          of truncating. The layout gives, never the word. */}
      <Text variant="tiny" center color={palette.navy} numberOfLines={2} style={styles.cellLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Topping scatter drawn onto a pizza region                             */
/* ------------------------------------------------------------------ */

function toppingPiece(topping: ToppingId, p: Pt, i: number, r: number): React.ReactElement {
  const look = toppings[topping];
  const key = `${topping}-${i}-${p.x.toFixed(1)}`;
  const rot = (i * 47) % 180;
  switch (look.shape) {
    case 'shred':
      return (
        <Rect
          key={key}
          x={p.x - r * 1.5}
          y={p.y - r * 0.34}
          width={r * 3}
          height={r * 0.68}
          rx={r * 0.34}
          fill={look.fill}
          stroke={look.shade}
          strokeWidth={0.6}
          transform={`rotate(${rot} ${p.x} ${p.y})`}
        />
      );
    case 'round':
      return (
        <G key={key}>
          <Circle cx={p.x} cy={p.y} r={r} fill={look.fill} />
          <Circle cx={p.x} cy={p.y} r={r * 0.55} fill={look.shade} opacity={0.5} />
          <Circle cx={p.x - r * 0.3} cy={p.y - r * 0.3} r={r * 0.24} fill="rgba(255,255,255,0.5)" />
        </G>
      );
    case 'ring':
      return (
        <G key={key}>
          <Circle cx={p.x} cy={p.y} r={r} fill={look.fill} />
          <Circle cx={p.x} cy={p.y} r={r * 0.42} fill={palette.engineRed} opacity={0.85} />
        </G>
      );
    case 'cap':
      return (
        <G key={key} transform={`rotate(${rot * 0.4} ${p.x} ${p.y})`}>
          <Path
            d={`M ${p.x - r} ${p.y} a ${r} ${r} 0 0 1 ${r * 2} 0 z`}
            fill={look.fill}
            stroke={look.shade}
            strokeWidth={0.7}
          />
          <Rect x={p.x - r * 0.28} y={p.y - 0.5} width={r * 0.56} height={r * 0.9} rx={r * 0.25} fill={look.shade} />
        </G>
      );
    case 'arc':
      return (
        <Path
          key={key}
          d={`M ${p.x - r} ${p.y} a ${r} ${r * 0.9} 0 0 1 ${r * 2} 0`}
          fill="none"
          stroke={look.fill}
          strokeWidth={r * 0.7}
          strokeLinecap="round"
          transform={`rotate(${rot} ${p.x} ${p.y})`}
        />
      );
    default:
      return (
        <Path
          key={key}
          d={`M ${p.x} ${p.y - r} q ${r} ${r} 0 ${r * 2} q ${-r} ${-r} 0 ${-r * 2} z`}
          fill={look.fill}
          transform={`rotate(${rot} ${p.x} ${p.y})`}
        />
      );
  }
}

export function ToppingRegion({
  topping,
  wedge,
  center,
  radius,
  pieceCount = 7,
}: {
  topping: ToppingId;
  wedge: Wedge;
  center: Pt;
  radius: number;
  pieceCount?: number;
}) {
  const look = toppings[topping];
  const pts = scatterPoints(center, radius, wedge, pieceCount);
  const r = radius * 0.075;
  return (
    <G>
      <Path d={wedgePath(center, radius, wedge.start, wedge.end)} fill={look.tint} opacity={0.75} />
      {pts.map((p, i) => toppingPiece(topping, p, i, r))}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Fraction pie indicator (the ½ | ½ badge above the pizza)              */
/* ------------------------------------------------------------------ */

export function PieIndicator({
  size,
  count,
  slices,
}: {
  size: number;
  count: number;
  /** in region order: which topping owns each wedge, and whether it is filled yet */
  slices: { topping: ToppingId | null; filled: boolean }[];
}) {
  const r = size / 2 - 3;
  const c: Pt = { x: size / 2, y: size / 2 };
  const wedges = buildWedges(count);
  return (
    <Svg width={size} height={size}>
      <Circle cx={c.x} cy={c.y} r={r + 2} fill={palette.white} />
      {wedges.map((w) => {
        const slice = slices[w.index];
        const look = slice?.topping ? toppings[slice.topping] : null;
        return (
          <Path
            key={w.index}
            d={wedgePath(c, r, w.start, w.end)}
            fill={look ? look.fill : palette.slateLight}
            opacity={slice?.filled ? 1 : 0.32}
            stroke={palette.white}
            strokeWidth={2}
          />
        );
      })}
      <Circle cx={c.x} cy={c.y} r={r + 1} fill="none" stroke={palette.navy} strokeWidth={2.5} opacity={0.25} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Plate with a crew portrait slot                                       */
/* ------------------------------------------------------------------ */

/**
 * A plate, with the three things that make a plate sit on a table: a rim you
 * can see the underside of, a lit sheen up its top-left, and a soft navy
 * contact ellipse. It used to be two flat ovals, which is why a row of plates
 * read as stickers floating on the wall.
 */
export function PlateArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 100 50">
      {/* what the plate lays on the surface */}
      <Ellipse cx={52} cy={41} rx={47} ry={8} fill="rgba(31,42,90,0.07)" />
      <Ellipse cx={51} cy={39} rx={42} ry={5.5} fill="rgba(31,42,90,0.14)" />
      {/* the rim: its underside, then its face */}
      <Ellipse cx={50} cy={25} rx={48} ry={21} fill="#C9D2E6" />
      <Ellipse cx={50} cy={22} rx={48} ry={21} fill="#F4F6FC" />
      {/* the well */}
      <Ellipse cx={50} cy={22} rx={36} ry={14.5} fill={palette.white} />
      <Ellipse cx={50} cy={22} rx={36} ry={14.5} fill="none" stroke="#DDE3F2" strokeWidth={2} />
      {/* one light direction: the sheen runs up the top-left of the rim */}
      <Path d="M8 18a48 21 0 0 1 34 -17 48 21 0 0 0 -28 19z" fill="rgba(255,255,255,0.9)" />
      <Path d="M92 27a48 21 0 0 1 -30 15 48 21 0 0 0 25 -17z" fill="rgba(31,42,90,0.07)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  thumbFood: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  cell: {
    backgroundColor: palette.panel,
    borderRadius: radii.tile,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cellLabel: { fontSize: 12, lineHeight: 14 },
  cellSelected: { borderColor: palette.safetyYellow, backgroundColor: palette.white },
  cellDim: { opacity: 0.45 },
});
