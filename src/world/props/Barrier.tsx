import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { Text } from '@/ui';
import type { RingSlot } from './ringLayout';

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

/** A chunky red-and-white barrier with one panel per unit — the tray token. */
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
  tone?: 'red' | 'ghost';
  showLabel?: boolean;
}) {
  const n = Math.max(1, Math.round(segments));
  const width = n * segmentPx;
  const barH = height * 0.42;
  const faceA = tone === 'ghost' ? palette.slateLight : palette.engineRed;
  const faceB = tone === 'ghost' ? '#EEF1F8' : palette.white;
  const legs = tone === 'ghost' ? palette.slate : palette.charcoal;

  return (
    <View style={[styles.piece, { width, height }]}>
      <Svg width={width} height={height}>
        <Rect x={width * 0.14} y={barH * 0.9} width={5} height={height - barH * 0.9} rx={2.5} fill={legs} />
        <Rect x={width * 0.82} y={barH * 0.9} width={5} height={height - barH * 0.9} rx={2.5} fill={legs} />
        <Rect x={0} y={2} width={width} height={barH} rx={barH * 0.34} fill={faceA} />
        {Array.from({ length: n }, (_, i) =>
          i % 2 === 1 ? <Rect key={i} x={i * segmentPx + 2} y={4} width={segmentPx - 4} height={barH - 4} rx={5} fill={faceB} /> : null,
        )}
        <Rect x={4} y={5} width={Math.max(0, width - 8)} height={barH * 0.26} rx={barH * 0.13} fill={palette.white} opacity={0.3} />
        <Rect x={0} y={barH - 2} width={width} height={4} rx={2} fill={palette.navy} opacity={0.14} />
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
          <Rect x={-w / 2} y={-h / 2 + 3} width={w} height={h} rx={h * 0.36} fill={palette.navy} opacity={0.14} />
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.36} fill={alt ? palette.white : palette.engineRed} />
          <Rect x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={h * 0.3} rx={h * 0.15} fill={palette.white} opacity={0.32} />
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
      <Ellipse cx={60} cy={64} rx={46} ry={40} fill="#D8C39A" />
      <Ellipse cx={60} cy={64} rx={34} ry={29} fill="#C0A97E" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <Ellipse
            key={i}
            cx={60 + Math.cos(a) * 42}
            cy={64 + Math.sin(a) * 36}
            rx={11}
            ry={9}
            fill={i % 2 ? '#B9BFD1' : '#9FA7BE'}
          />
        );
      })}
      <Rect x={34} y={58} width={52} height={11} rx={5.5} fill={palette.wood} transform="rotate(-16 60 64)" />
      <Rect x={34} y={58} width={52} height={11} rx={5.5} fill={palette.woodDark} transform="rotate(20 60 64)" />
      {calm ? (
        <G>
          <Circle cx={50} cy={58} r={4} fill={palette.navy} />
          <Circle cx={70} cy={58} r={4} fill={palette.navy} />
          <Path d="M48 68q12 10 24 0" stroke={palette.navy} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Ellipse cx={60} cy={50} rx={22} ry={8} fill="#D6DCEC" opacity={0.6} />
        </G>
      ) : (
        <G>
          <Path d="M60 22c0 0-16 20-16 34 0 11 7 18 16 18s16-7 16-18C76 42 60 22 60 22z" fill={palette.flameOuter} />
          <Path d="M60 38c0 0-9 12-9 21 0 7 4 11 9 11s9-4 9-11c0-9-9-21-9-21z" fill={palette.flameMid} />
          <Path d="M60 52c0 0-4 7-4 12 0 4 2 6 4 6s4-2 4-6c0-5-4-12-4-12z" fill={palette.flameCore} />
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
