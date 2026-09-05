import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { Text } from '@/ui';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '../tone';
import { FlameArt } from './Flame';
import type { RingSlot } from './ringLayout';

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

export type BarrierTone = 'red' | 'ghost';

/**
 * One block of the striped bar. The end blocks carry the bar's rounded ends;
 * the inner blocks are square so the stripes butt up with no gaps.
 */
const blockPath = (x: number, y: number, w: number, h: number, r: number, roundLeft: boolean, roundRight: boolean) => {
  const rl = roundLeft ? r : 0;
  const rr = roundRight ? r : 0;
  return (
    `M${x + rl} ${y}` +
    `h${w - rl - rr}` +
    (rr ? `a${rr} ${rr} 0 0 1 ${rr} ${rr}` : '') +
    `v${h - rr - rr}` +
    (rr ? `a${rr} ${rr} 0 0 1 -${rr} ${rr}` : '') +
    `h-${w - rl - rr}` +
    (rl ? `a${rl} ${rl} 0 0 1 -${rl} -${rl}` : '') +
    `v-${h - rl - rl}` +
    (rl ? `a${rl} ${rl} 0 0 1 ${rl} -${rl}` : '') +
    'z'
  );
};

/** The underside half of a horizontal capsule (the bar's shade). */
const underPath = (x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  return `M${x} ${y + r}a${r} ${r} 0 0 0 ${r} ${r}h${Math.max(0, w - 2 * r)}a${r} ${r} 0 0 0 ${r} -${r}z`;
};

/** An A-frame foot: post, splayed feet, a contact shadow. */
function Foot({ x, top, bottom, color }: { x: number; top: number; bottom: number; color: string }) {
  const h = bottom - top;
  const spread = Math.min(12, h * 0.55);
  return (
    <G>
      <Ellipse cx={x} cy={bottom} rx={spread + 3} ry={shadowRy(spread + 3)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Path d={`M${x - 2.6} ${top}h5.2l${spread} ${h}h-5z`} fill={color} />
      <Path d={`M${x - 2.6} ${top}h5.2l-${spread} ${h}h-5z`} fill={color} />
      <Rect x={x - spread - 3} y={bottom - 4} width={spread * 2 + 6} height={4.5} rx={2.2} fill={color} />
      <Rect x={x - spread - 3} y={bottom - 4} width={spread * 2 + 6} height={1.6} rx={0.8} fill={HIGHLIGHT} />
      <Rect x={x - 2.6} y={top} width={5.2} height={h * 0.5} rx={1.5} fill={color} />
      <Rect x={x - 1.6} y={top} width={1.6} height={h * 0.5} fill={HIGHLIGHT} />
    </G>
  );
}

/**
 * A chunky red-and-white barrier with one block per unit — the tray token.
 * The bar is base → navy shade underneath → white highlight on top, standing
 * on two A-frame feet with contact shadows. `segments` = the number of blocks.
 */
export function BarrierPiece({
  segments,
  segmentPx = 26,
  height = 54,
  tone = 'red',
  showLabel = true,
}: {
  segments: number;
  segmentPx?: number;
  height?: number;
  tone?: BarrierTone;
  showLabel?: boolean;
}) {
  const n = Math.max(1, Math.round(segments));
  const width = n * segmentPx;
  const barH = height * 0.42;
  const barY = 2;
  const r = Math.min(barH * 0.34, segmentPx * 0.45);
  const red = tone === 'ghost' ? palette.slateLight : palette.engineRed;
  const white = tone === 'ghost' ? palette.white : palette.white;
  const legs = tone === 'ghost' ? palette.slate : palette.charcoal;
  const footX = n === 1 ? [width * 0.5] : [Math.max(6, width * 0.16), Math.min(width - 6, width * 0.84)];

  return (
    <View style={[styles.piece, { width, height }]}>
      <Svg width={width} height={height}>
        {footX.map((x) => (
          <Foot key={x} x={x} top={barY + barH * 0.8} bottom={height - 2} color={legs} />
        ))}
        {Array.from({ length: n }, (_, i) => (
          <Path
            key={i}
            d={blockPath(i * segmentPx, barY, segmentPx, barH, r, i === 0, i === n - 1)}
            fill={i % 2 === 0 ? red : white}
            opacity={tone === 'ghost' && i % 2 === 1 ? 0.8 : 1}
          />
        ))}
        <Path d={underPath(0, barY, width, barH)} fill={SHADE} />
        <Rect x={r} y={barY + barH * 0.14} width={Math.max(0, width - 2 * r)} height={barH * 0.26} rx={barH * 0.13} fill={HIGHLIGHT} />
      </Svg>
      {showLabel ? (
        <View style={styles.badge}>
          <Text variant="buttonSmall" color={palette.white}>
            {n}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** One placed barrier panel, rotated tangent to the ring. */
export function RingPanel({
  slot,
  size,
  filled,
  alt,
}: {
  slot: RingSlot;
  size: number;
  filled: boolean;
  /** alternates the stripe colour along a placed run */
  alt?: boolean;
}) {
  const w = size * 1.35;
  const h = size * 0.62;
  return (
    <G transform={`translate(${slot.x} ${slot.y}) rotate(${slot.angle})`}>
      {filled ? (
        <>
          <Ellipse cx={0} cy={h * 0.62} rx={w * 0.5} ry={shadowRy(w * 0.5)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.36} fill={alt ? palette.white : palette.engineRed} />
          <Path d={underPath(-w / 2, -h / 2, w, h)} fill={SHADE} />
          <Rect x={-w / 2 + h * 0.36} y={-h / 2 + h * 0.14} width={Math.max(0, w - h * 0.72)} height={h * 0.28} rx={h * 0.14} fill={HIGHLIGHT} />
        </>
      ) : (
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={h * 0.36}
          fill={palette.white}
          fillOpacity={0.28}
          stroke={palette.white}
          strokeWidth={3}
          strokeDasharray="8 7"
        />
      )}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Campfire                                                             */
/* ------------------------------------------------------------------ */

/** A small friendly training-yard campfire seen from above. Smiles when safe. */
export function Campfire({ size = 120, calm }: { size?: number; calm?: boolean }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 120 120">
      <Ellipse cx={60} cy={66} rx={46} ry={40} fill="#D8C39A" />
      <Ellipse cx={60} cy={64} rx={34} ry={29} fill="#C0A97E" />
      {/* ring of stones: base → navy shade → white highlight, per stone */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const cx = 60 + Math.cos(a) * 42;
        const cy = 64 + Math.sin(a) * 36;
        return (
          <G key={i}>
            <Ellipse cx={cx} cy={cy + 5} rx={11} ry={4} fill={palette.navy} opacity={0.12} />
            <Ellipse cx={cx} cy={cy} rx={11} ry={9} fill={i % 2 ? '#BCC3D5' : '#A6AEC5'} />
            <Ellipse cx={cx} cy={cy + 3.5} rx={10} ry={5} fill="rgba(31,42,90,0.14)" />
            <Ellipse cx={cx - 3} cy={cy - 3.4} rx={4.6} ry={2.8} fill="rgba(255,255,255,0.32)" />
          </G>
        );
      })}
      {/* two split logs with cut ends and grain */}
      <G transform="rotate(-16 60 64)">
        <Rect x={34} y={58} width={52} height={12} rx={6} fill={palette.wood} />
        <Rect x={34} y={58} width={52} height={4} rx={2} fill="rgba(255,255,255,0.32)" />
        <Ellipse cx={84} cy={64} rx={4.4} ry={6} fill="#E4C08C" />
        <Ellipse cx={84} cy={64} rx={2} ry={2.8} fill={palette.woodDark} />
      </G>
      <G transform="rotate(20 60 64)">
        <Rect x={34} y={58} width={52} height={12} rx={6} fill={palette.woodDark} />
        <Rect x={34} y={58} width={52} height={4} rx={2} fill="rgba(255,255,255,0.18)" />
        <Ellipse cx={36} cy={64} rx={4.4} ry={6} fill="#D3AA79" />
        <Ellipse cx={36} cy={64} rx={2} ry={2.8} fill="#7C5228" />
      </G>
      {calm ? (
        <G>
          <Circle cx={50} cy={58} r={4} fill={palette.navy} />
          <Circle cx={70} cy={58} r={4} fill={palette.navy} />
          <Path d="M48 68q12 10 24 0" stroke={palette.navy} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Ellipse cx={60} cy={50} rx={22} ry={8} fill="#D6DCEC" opacity={0.6} />
        </G>
      ) : (
        /* one flame motif everywhere — the same drawing Hose Hero uses */
        <G>
          <Ellipse cx={60} cy={66} rx={30} ry={20} fill={palette.flameMid} opacity={0.18} />
          <G transform="translate(38 14) scale(0.44)">
            <FlameArt />
          </G>
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  piece: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
