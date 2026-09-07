import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
