import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui';

/* ================================================================= */
/* The word board (the classroom board in the station's ready room)   */
/* ================================================================= */

/** Faint ruled lines behind the word — the board feels like real paper. */
export function BoardRules() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {['16%', '34%', '52%', '70%', '88%'].map((top) => (
        <View key={top} style={[styles.rule, { top: top as unknown as number }]} />
      ))}
    </View>
  );
}

/**
 * The station's ready room behind the board: a soft painted wall with a rail,
 * and a wooden floor — the word board hangs on it instead of floating in sky.
 */
export function ReadyRoomWall({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.66} viewBox="0 0 360 238" preserveAspectRatio="xMidYMin slice">
      <Rect x={0} y={0} width={360} height={238} fill="#D9EEF7" />
      <Rect x={0} y={0} width={360} height={9} fill="rgba(31,42,90,0.08)" />
      {[0, 1, 2].map((i) => (
        <Rect key={i} x={i * 120 + 14} y={12} width={92} height={226} rx={10} fill="rgba(255,255,255,0.22)" />
      ))}
      {/* noticeboard with three pinned notes */}
      <G>
        <Rect x={22} y={26} width={128} height={94} rx={9} fill={palette.woodDark} />
        <Rect x={28} y={32} width={116} height={82} rx={6} fill="#E7C98F" />
        {([
          [36, 40, palette.white],
          [96, 44, palette.pinkSoft],
          [58, 76, palette.waterCyanLight],
        ] as [number, number, string][]).map(([x, y, fill], i) => (
          <G key={i}>
            <Rect x={x} y={y} width={42} height={32} rx={4} fill={fill} />
            <Rect x={x + 6} y={y + 8} width={30} height={3} rx={1.5} fill="rgba(31,42,90,0.16)" />
            <Rect x={x + 6} y={y + 16} width={22} height={3} rx={1.5} fill="rgba(31,42,90,0.12)" />
            <Circle cx={x + 21} cy={y + 3} r={3.4} fill={palette.engineRed} />
          </G>
        ))}
      </G>

      {/* station clock */}
      <G>
        <Circle cx={296} cy={70} r={34} fill={palette.navy} />
        <Circle cx={296} cy={68} r={29} fill={palette.cream} />
        {[0, 90, 180, 270].map((deg) => (
          <Rect key={deg} x={294.5} y={42} width={3} height={7} rx={1.5} fill={palette.navySoft} transform={`rotate(${deg} 296 68)`} />
        ))}
        <Path d="M296 68V50" stroke={palette.navy} strokeWidth={4} strokeLinecap="round" />
        <Path d="M296 68l14 8" stroke={palette.engineRed} strokeWidth={3.4} strokeLinecap="round" />
        <Circle cx={296} cy={68} r={3.4} fill={palette.navy} />
      </G>

      <Rect x={0} y={150} width={360} height={10} rx={5} fill={palette.tanDark} />
      <Rect x={0} y={150} width={360} height={4} rx={2} fill={palette.tan} />
      {/* a hook with a helmet hanging on the rail */}
      <G>
        <Rect x={296} y={158} width={6} height={16} rx={3} fill={palette.slate} />
        <Path d="M280 196c0-11 8-19 19-19s19 8 19 19z" fill={palette.engineRed} />
        <Rect x={274} y={193} width={50} height={8} rx={4} fill={palette.engineRedDark} />
        <Circle cx={299} cy={185} r={5} fill={palette.safetyYellow} />
      </G>
    </Svg>
  );
}

/** Wooden floor strip for the bottom of the ready room. */
export function ReadyRoomFloor({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.18} viewBox="0 0 360 64" preserveAspectRatio="xMidYMax slice">
      <Rect x={0} y={0} width={360} height={64} fill={palette.tan} />
      <Rect x={0} y={0} width={360} height={6} rx={3} fill={palette.tanDark} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Rect key={i} x={i * 62 + 18} y={9} width={3} height={55} fill="rgba(158,106,54,0.22)" />
      ))}
      <Rect x={0} y={30} width={360} height={2} fill="rgba(255,255,255,0.35)" />
    </Svg>
  );
}

/** Wooden chalk ledge with two sticks of chalk and an eraser. */
export function ChalkLedge({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.075} viewBox="0 0 320 24">
      <Rect x={0} y={4} width={320} height={16} rx={7} fill={palette.woodDark} />
      <Rect x={4} y={2} width={312} height={10} rx={5} fill={palette.wood} />
      <Rect x={24} y={4} width={54} height={7} rx={3.5} fill={palette.white} />
      <Rect x={88} y={4} width={38} height={7} rx={3.5} fill={palette.pinkSoft} />
      <G>
        <Rect x={236} y={1} width={54} height={11} rx={4} fill={palette.waterCyanLight} />
        <Rect x={236} y={1} width={54} height={5} rx={2.5} fill="rgba(255,255,255,0.55)" />
      </G>
    </Svg>
  );
}

/** The pinned picture card at the top of the board. */
export function PictureCard({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { width: size + spacing.md, height: size + spacing.md }, shadows.card]}>
      <Svg width={18} height={18} viewBox="0 0 18 18" style={styles.pin}>
        <Circle cx={9} cy={9} r={8} fill={palette.engineRedDark} />
        <Circle cx={9} cy={8} r={7} fill={palette.engineRed} />
        <Circle cx={6.4} cy={6} r={2.2} fill="rgba(255,255,255,0.6)" />
      </Svg>
      {children}
    </View>
  );
}

/* ================================================================= */
/* Letter tiles                                                       */
/* ================================================================= */

export interface LetterTileProps {
  letter: string;
  size: number;
  tone?: 'cream' | 'gold' | 'ghost';
  dim?: boolean;
}

/** A chunky cream tile with a navy letter — the same object in the tray and the slot. */
export function LetterTile({ letter, size, tone = 'cream', dim }: LetterTileProps) {
  const face = tone === 'gold' ? palette.safetyYellow : palette.cream;
  const edge = tone === 'gold' ? palette.goldDark : palette.creamDeep;
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          backgroundColor: face,
          borderBottomColor: edge,
          borderBottomWidth: Math.max(4, size * 0.1),
          borderRadius: Math.max(12, size * 0.26),
        },
        dim && styles.dim,
      ]}
    >
      <View style={[styles.tileSheen, { borderRadius: Math.max(8, size * 0.2) }]} pointerEvents="none" />
      <Text variant="h1" center style={{ fontSize: size * 0.52, lineHeight: size * 0.68 }}>
        {letter}
      </Text>
    </View>
  );
}

/** The dashed outline a letter is still missing from. */
export function LetterSlotGhost({ size }: { size: number }) {
  return (
    <View
      style={[
        styles.ghost,
        { width: size, height: size, borderRadius: Math.max(12, size * 0.26) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  rule: { position: 'absolute', left: 12, right: 12, height: 2, backgroundColor: palette.creamDeep, borderRadius: 1 },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.card,
  },
  pin: { position: 'absolute', top: -7 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  tileSheen: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '10%',
    height: '22%',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  ghost: {
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: palette.navyMuted,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dim: { opacity: 0.4 },
});
