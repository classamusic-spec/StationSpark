/**
 * MissionHud — the slim beat progress strip that sits under the TopBar.
 *
 * One dot per beat of the mission, in order. It is a map, not a score: nothing
 * here can ever say "you are behind".
 *
 * State is never colour alone (docs/ARCHITECTURE.md), so the three states differ
 * in *shape* first: a beat still to come is an open ring, a beat that is done is
 * a filled dot, and the one being played is a gold pill carrying that beat's own
 * drawn mark. The strip also carries the position as a spoken label, because a
 * row of dots says nothing to a screen reader.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { MissionBeat } from '@/content/types';
import { palette, radii, shadows, spacing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { GlyphIcon, type GlyphId } from '@/ui/kit/GlyphIcon';

/** Drawn beat marks (art critique item #21) — emoji are banned from the world. */
const GLYPH: Record<MissionBeat['type'], GlyphId> = {
  dialogue: 'beat-dialogue',
  minigame: 'beat-minigame',
  travel: 'beat-travel',
  scene: 'beat-scene',
  kitchen: 'beat-kitchen',
  recap: 'beat-recap',
};

function Dot({ beat, state }: { beat: MissionBeat; state: 'done' | 'current' | 'todo' }) {
  const pulse = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (state !== 'current' || reduced) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 780 }), withTiming(0, { duration: 780 })), -1, true);
  }, [pulse, reduced, state]);

  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.08 }] }));

  if (state === 'current') {
    return (
      <Animated.View style={[styles.current, a]}>
        <GlyphIcon id={GLYPH[beat.type]} size={22} />
      </Animated.View>
    );
  }
  return <View style={[styles.dot, state === 'done' ? styles.done : styles.todo]} />;
}

/** the strip has to hold up to fourteen beats on a 360 px phone */
const gapFor = (n: number) => (n > 11 ? 5 : 7);

export interface MissionHudProps {
  beats: MissionBeat[];
  /** index of the beat being played (-1 while on the brief) */
  index: number;
  /** hidden on the brief / celebration, where it would only be noise */
  hidden?: boolean;
}

export function MissionHud({ beats, index, hidden }: MissionHudProps) {
  if (hidden || beats.length === 0) return null;
  const at = Math.min(Math.max(index, 0), beats.length - 1) + 1;
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap} pointerEvents="none">
      <View
        style={[styles.strip, shadows.soft, { gap: gapFor(beats.length) }]}
        accessibilityLabel={`Step ${at} of ${beats.length}`}
      >
        {beats.map((b, i) => (
          <Dot key={i} beat={b} state={i < index ? 'done' : i === index ? 'current' : 'todo'} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '94%',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dot: { width: 11, height: 11, borderRadius: 6 },
  /* filled = behind us, open ring = still to come: shape, not just colour */
  done: { backgroundColor: palette.navySoft },
  todo: { borderWidth: 2, borderColor: palette.slateLight, backgroundColor: 'rgba(255,255,255,0.55)' },
  current: {
    minWidth: 30,
    height: 26,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    backgroundColor: palette.safetyYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
