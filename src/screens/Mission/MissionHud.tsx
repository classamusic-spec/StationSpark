/**
 * MissionHud — the slim beat progress strip that sits under the TopBar.
 *
 * One dot per beat of the mission, in order. Done beats are solid navy, the
 * current one is a glowing gold pill, still-to-come beats are soft. It is a
 * map, not a score: nothing here can ever say "you are behind".
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { MissionBeat } from '@/content/types';
import { palette, radii, shadows, spacing } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Text } from '@/ui/Text';

const GLYPH: Record<MissionBeat['type'], string> = {
  dialogue: '💬',
  minigame: '⭐',
  travel: '🚒',
  scene: '📍',
  kitchen: '🍳',
  recap: '🎓',
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
        <Text variant="tiny">{GLYPH[beat.type]}</Text>
      </Animated.View>
    );
  }
  return <View style={[styles.dot, state === 'done' ? styles.done : styles.todo]} />;
}

export interface MissionHudProps {
  beats: MissionBeat[];
  /** index of the beat being played (-1 while on the brief) */
  index: number;
  /** hidden on the brief / celebration, where it would only be noise */
  hidden?: boolean;
}

export function MissionHud({ beats, index, hidden }: MissionHudProps) {
  if (hidden || beats.length === 0) return null;
  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap} pointerEvents="none">
      <View style={[styles.strip, shadows.soft]}>
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
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  done: { backgroundColor: palette.navySoft },
  todo: { backgroundColor: palette.slateLight },
  current: {
    minWidth: 30,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    backgroundColor: palette.safetyYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
