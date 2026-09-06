import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, shadows } from '@/theme';
import { CaptainBea } from './CaptainBea';
import { Npc, npcVariants, type NpcVariant } from './Npc';
import { Rookie } from './Rookie';
import type { CharacterPortraitProps } from './types';

/**
 * How much of the rig to show inside the circle.
 *  scale — rig height as a multiple of the circle diameter
 *  cx/cy — where the head sits inside the rig, as a fraction of its box
 */
const framing = {
  /* The neighbours are still the tall shared Person rig. */
  person: { scale: 1.92, aspect: 120 / 165, cx: 0.5, cy: 0.364 },
  /* The two leads are the authored art: a square box with the head — hat and
   * all — sitting in its top third. */
  lead: { scale: 1.96, aspect: 1, cx: 0.5, cy: 0.265 },
} as const;

const backdrops: Record<string, string> = {
  rookie: '#FFEBD7',
  bea: '#E3E8FF',
  npc: '#FFF2D9',
};

/** vertical anchor of the head inside the circle (0 = top, 1 = bottom) */
const HEAD_Y = 0.46;

const isNpcVariant = (v: string | undefined): v is NpcVariant => !!v && (npcVariants as readonly string[]).includes(v);

/**
 * Circle-cropped bust of any cast member — used by dialogue bubbles, hint
 * bubbles, the locker and the dev gallery. Renders the *real* rig, so the
 * portrait blinks and breathes exactly like the full-body character.
 */
export function CharacterPortrait({ id, npc, emotion = 'happy', size = 72, animate = true }: CharacterPortraitProps) {
  const key = id === 'npc' ? 'person' : 'lead';
  const f = framing[key];
  const rigH = f.scale * size;
  const rigW = rigH * f.aspect;
  const left = size * 0.5 - f.cx * rigW;
  const top = size * HEAD_Y - f.cy * rigH;

  const rig = () => {
    switch (id) {
      case 'bea':
        return <CaptainBea size={rigH} emotion={emotion} pose="stand" animate={animate} />;
      case 'npc':
        return <Npc variant={isNpcVariant(npc) ? npc : 'rosa'} size={rigH} emotion={emotion} pose="stand" animate={animate} />;
      case 'rookie':
      default:
        return <Rookie size={rigH} emotion={emotion} pose="stand" animate={animate} />;
    }
  };

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={id === 'npc' ? (npc ?? 'neighbour') : id}
      style={[
        styles.circle,
        shadows.soft,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: backdrops[id] ?? palette.cream, borderWidth: Math.max(2, size * 0.045) },
      ]}
    >
      <View pointerEvents="none" style={{ position: 'absolute', left, top, width: rigW, height: rigH }}>
        {rig()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
