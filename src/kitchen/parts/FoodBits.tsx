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
      <Text variant="tiny" center color={palette.navy} numberOfLines={1}>
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

export function PlateArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 100 50">
      <Ellipse cx={50} cy={26} rx={48} ry={22} fill={palette.white} />
      <Ellipse cx={50} cy={24} rx={48} ry={22} fill="#F4F6FC" />
      <Ellipse cx={50} cy={24} rx={36} ry={15} fill={palette.white} />
      <Ellipse cx={50} cy={24} rx={36} ry={15} fill="none" stroke="#DDE3F2" strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  cell: {
    backgroundColor: palette.panel,
    borderRadius: radii.tile,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  cellSelected: { borderColor: palette.safetyYellow, backgroundColor: palette.white },
  cellDim: { opacity: 0.45 },
});
