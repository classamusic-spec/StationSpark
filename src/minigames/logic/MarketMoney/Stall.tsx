import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette, radii } from '@/theme';
import { Text } from '@/ui';

const SHADE = 'rgba(31,42,90,0.14)';
const SHEEN = 'rgba(255,255,255,0.34)';

/* ================================================================= */
/* The Farmers Market stall                                           */
/* ================================================================= */

export const STALL_VIEW = { w: 340, h: 148 } as const;
/** Where the produce on sale sits, and where the price board's face is. */
const STALL_ITEM = { x: 134, y: 40, w: 76, h: 76 } as const;
const STALL_SIGN = { x: 26, y: 46, w: 84, h: 40 } as const;

export function stallRects(width: number) {
  const k = width / STALL_VIEW.w;
  const scale = (r: { x: number; y: number; w: number; h: number }) => ({
    left: r.x * k,
    top: r.y * k,
    width: r.w * k,
    height: r.h * k,
  });
  return { k, height: STALL_VIEW.h * k, item: scale(STALL_ITEM), sign: scale(STALL_SIGN) };
}

/** One scallop of the awning valance. */
const scallops = (count: number, width: number, y: number, r: number) =>
  Array.from({ length: count }, (_, i) => {
    const cx = (width / count) * (i + 0.5);
    return <Path key={i} d={`M${cx - r} ${y} a ${r} ${r} 0 0 0 ${r * 2} 0 z`} fill={i % 2 ? palette.cream : palette.engineRed} />;
  });

/**
 * Striped awning, cream plank wall, a crate of produce and a hanging price
 * board. The board's face and the produce spot are left empty — the game draws
 * the real price and the VocabIcon over them (all text goes through `@/ui`).
 */
export function StallFront({ width }: { width: number }) {
  const { w, h } = STALL_VIEW;
  const stripes = 10;
  return (
    <Svg width={width} height={(width * h) / w} viewBox={`0 0 ${w} ${h}`}>
      {/* back wall */}
      <Rect x={18} y={26} width={304} height={104} rx={10} fill={palette.creamDeep} />
      <Rect x={18} y={26} width={304} height={98} rx={10} fill={palette.cream} />
      {[46, 66, 86, 106].map((y) => (
        <Rect key={y} x={22} y={y} width={296} height={2} rx={1} fill={palette.creamDeep} />
      ))}

      {/* posts */}
      {[6, 318].map((x) => (
        <G key={x}>
          <Rect x={x} y={20} width={16} height={128} rx={5} fill={palette.woodDark} />
          <Rect x={x + 2} y={22} width={5} height={122} rx={2.5} fill={palette.wood} />
        </G>
      ))}

      {/* awning */}
      {Array.from({ length: stripes }, (_, i) => (
        <Rect
          key={i}
          x={(w / stripes) * i}
          y={0}
          width={w / stripes}
          height={26}
          fill={i % 2 ? palette.cream : palette.engineRed}
        />
      ))}
      {scallops(stripes, w, 26, w / stripes / 2)}
      <Rect x={0} y={0} width={w} height={26} rx={9} fill="none" />
      <Rect x={0} y={0} width={w} height={7} rx={3.5} fill={SHEEN} />
      <Rect x={0} y={20} width={w} height={6} fill={SHADE} />

      {/* hanging price board */}
      <Path d={`M${STALL_SIGN.x + 12} 26 v 14 M${STALL_SIGN.x + STALL_SIGN.w - 12} 26 v 14`} stroke={palette.woodDark} strokeWidth={3} />
      <Rect x={STALL_SIGN.x - 6} y={STALL_SIGN.y - 8} width={STALL_SIGN.w + 12} height={STALL_SIGN.h + 16} rx={12} fill={palette.woodDark} />
      <Rect x={STALL_SIGN.x - 2} y={STALL_SIGN.y - 4} width={STALL_SIGN.w + 4} height={STALL_SIGN.h + 8} rx={9} fill={palette.panel} />

      {/* produce crate on the right */}
      <G>
        {([
          [252, 62, palette.engineRed],
          [278, 58, palette.leafGreen],
          [300, 64, palette.safetyYellow],
          [264, 78, palette.orange],
          [290, 80, palette.engineRedLight],
        ] as [number, number, string][]).map(([cx, cy, fill], i) => (
          <G key={i}>
            <Circle cx={cx} cy={cy + 2} r={11} fill={SHADE} />
            <Circle cx={cx} cy={cy} r={11} fill={fill} />
            <Circle cx={cx - 3.5} cy={cy - 4} r={3} fill="rgba(255,255,255,0.45)" />
          </G>
        ))}
        <Path d="M232 86 h88 l-6 40 a6 6 0 0 1-6 5 h-64 a6 6 0 0 1-6-5z" fill={palette.wood} />
        <Rect x={230} y={80} width={92} height={12} rx={6} fill={palette.woodDark} />
        <Path d="M240 96 h72 l-3 24 h-66z" fill={palette.tan} />
      </G>

      {/* the crate the item on sale sits in */}
      <Path
        d={`M${STALL_ITEM.x - 8} 104 h${STALL_ITEM.w + 16} l-5 26 a6 6 0 0 1-6 5 h-${STALL_ITEM.w} a6 6 0 0 1-6-5z`}
        fill={palette.wood}
      />
      <Rect x={STALL_ITEM.x - 10} y={98} width={STALL_ITEM.w + 20} height={12} rx={6} fill={palette.woodDark} />
      <Ellipse cx={STALL_ITEM.x + STALL_ITEM.w / 2} cy={112} rx={30} ry={5} fill="rgba(31,42,90,0.10)" />
    </Svg>
  );
}

/* ================================================================= */
/* Market dressing — bunting overhead, paving underfoot               */
/* ================================================================= */

const FLAG_COLORS = [palette.engineRed, palette.safetyYellow, palette.waterCyan, palette.leafGreen, palette.purple];

/** A string of little flags across the top of the market. */
export function Bunting({ width }: { width: number }) {
  const flags = 11;
  const step = 360 / flags;
  return (
    <Svg width={width} height={width * 0.1} viewBox="0 0 360 36">
      <Path d="M0 6 Q180 26 360 6" stroke={palette.woodDark} strokeWidth={2.6} fill="none" />
      {Array.from({ length: flags }, (_, i) => {
        const x = step * (i + 0.5);
        const dip = Math.sin((x / 360) * Math.PI) * 10;
        const y = 6 + dip;
        return (
          <Path
            key={i}
            d={`M${x - 9} ${y} L${x + 9} ${y} L${x} ${y + 17} Z`}
            fill={FLAG_COLORS[i % FLAG_COLORS.length]}
            opacity={0.95}
          />
        );
      })}
    </Svg>
  );
}

/**
 * The market street the stall stands on: warm paving, a kerb and a few
 * cobbles, so nothing floats in raw sky.
 */
export function MarketGround({ width }: { width: number }) {
  return (
    <View style={styles.ground} pointerEvents="none">
      <View style={styles.kerb} />
      <View style={styles.paving}>
        {[0.08, 0.3, 0.52, 0.74].map((left, row) =>
          [0, 1].map((col) => (
            <View
              key={`${left}-${col}`}
              style={[
                styles.cobble,
                {
                  left: `${(left + (col ? 0.11 : 0)) * 100}%`,
                  top: 12 + col * 22 + (row % 2) * 6,
                  width: width * 0.16,
                },
              ]}
            />
          )),
        )}
      </View>
    </View>
  );
}

/* ================================================================= */
/* Coins                                                              */
/* ================================================================= */

const coinTone = (value: number): { face: string; edge: string; rim: string } => {
  if (value >= 25) return { face: '#C6CDE0', edge: '#6B76A8', rim: '#EDF0F8' };
  if (value >= 10) return { face: palette.safetyYellow, edge: palette.goldDark, rim: '#FFE9A8' };
  if (value >= 5) return { face: '#DCE2F0', edge: palette.slate, rim: '#F3F5FB' };
  return { face: '#E8A85A', edge: '#B9762F', rim: '#F7D6A8' };
};

/** A chunky market coin with its value embossed in the middle. */
export function CoinDisc({ value, size = 56, dim }: { value: number; size?: number; dim?: boolean }) {
  const tone = coinTone(value);
  const notches = 16;
  return (
    <View style={[{ width: size, height: size }, styles.coin, dim && styles.dim]}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Circle cx={32} cy={34} r={29} fill={tone.edge} />
        <Circle cx={32} cy={31} r={29} fill={tone.face} />
        {Array.from({ length: notches }, (_, i) => (
          <Rect
            key={i}
            x={30.6}
            y={2}
            width={2.8}
            height={5}
            rx={1.4}
            fill={tone.edge}
            opacity={0.55}
            transform={`rotate(${(360 / notches) * i} 32 31)`}
          />
        ))}
        <Circle cx={32} cy={31} r={22} fill={tone.rim} />
        <Circle cx={32} cy={31} r={19} fill={tone.face} />
        <Path d="M14 20a22 22 0 0 1 17-11" stroke="rgba(255,255,255,0.7)" strokeWidth={4} strokeLinecap="round" fill="none" />
      </Svg>
      <View style={styles.coinLabel} pointerEvents="none">
        <Text variant="h3" center style={{ fontSize: size * 0.36, lineHeight: size * 0.46 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** The little paper bag the stallholder hands over when the bill is paid. */
export function PaperBag({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M12 20h40l-3 36a6 6 0 0 1-6 5H21a6 6 0 0 1-6-5z" fill={palette.tanDark} />
      <Path d="M15 22h34l-3 32a5 5 0 0 1-5 4H23a5 5 0 0 1-5-4z" fill={palette.tan} />
      <Path d="M24 22c0-8 3-12 8-12s8 4 8 12" stroke={palette.woodDark} strokeWidth={3.4} fill="none" strokeLinecap="round" />
      <Rect x={15} y={30} width={34} height={5} rx={2.5} fill="rgba(255,255,255,0.4)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '30%' },
  kerb: { height: 8, backgroundColor: palette.tanDark, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  paving: { flex: 1, backgroundColor: '#EBD9B4', overflow: 'hidden' },
  cobble: { position: 'absolute', height: 10, borderRadius: 5, backgroundColor: 'rgba(158,106,54,0.16)' },
  coin: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  coinLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.42 },
});
