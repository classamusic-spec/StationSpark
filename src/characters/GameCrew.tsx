/**
 * GAME CREW — the resident character that gives every mini-game life.
 *
 * One figure, not a huddle. Two mascots in the corner of a phone screen ate
 * the play area, so the crew is now a single lead: Rookie by default (the
 * player's own firefighter, cheering their own work) or Captain Bea when the
 * game wants the grown-up in the room. A neighbour can still stand alongside.
 *
 * The `mood` prop is the whole reaction surface. Nothing else needs wiring:
 *
 *   idle   ambient only — breathing, blinking, the odd glance
 *   think  the lead tilts and considers, listening
 *   happy  a bounce — "yes, that one"
 *   cheer  a hop with sparkles over the crew
 */
import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { Sparkles } from '@/world/fx';
import { CaptainBea } from './CaptainBea';
import { Rookie } from './Rookie';
import { Npc, type NpcVariant } from './Npc';

export type CrewMood = 'idle' | 'happy' | 'think' | 'cheer';

export interface GameCrewProps {
  /** which bottom corner (default right) */
  side?: 'left' | 'right';
  mood?: CrewMood;
  /** who stands in the corner (default the player's own Rookie) */
  lead?: 'rookie' | 'bea';
  npc?: NpcVariant;
  /** lead height in px (the NPC scales from it) */
  size?: number;
  /** distance from the bottom edge, e.g. to sit above a Tray */
  bottom?: number;
  style?: StyleProp<ViewStyle>;
}

const emotionFor = (mood: CrewMood) =>
  mood === 'happy' ? ('happy' as const) : mood === 'cheer' ? ('excited' as const) : mood === 'think' ? ('think' as const) : ('calm' as const);

const poseFor = (mood: CrewMood) => (mood === 'cheer' ? ('cheer' as const) : mood === 'think' ? ('think' as const) : ('stand' as const));

export function GameCrew({ side = 'right', mood = 'idle', lead = 'rookie', npc, size = 92, bottom = 0, style }: GameCrewProps) {
  const emotion = emotionFor(mood);
  const pose = poseFor(mood);
  const reduced = useReducedMotion();

  /** one bounce per reaction, and a small listening tilt while thinking */
  const bounce = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(tilt);
    tilt.value = withTiming(mood === 'think' ? 1 : 0, timings.base);
  }, [mood, tilt]);

  useEffect(() => {
    if (mood !== 'happy' && mood !== 'cheer') return;
    if (reduced) {
      bounce.value = withSequence(withTiming(0.5, { duration: 110 }), withTiming(0, { duration: 110 }));
      return;
    }
    bounce.value = withSequence(withSpring(1, springs.bounce), withSpring(0, springs.pop));
    return () => cancelAnimation(bounce);
  }, [bounce, mood, reduced]);

  const crewStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bounce.value * size * 0.1 }, { rotate: `${tilt.value * (side === 'left' ? 4 : -4)}deg` }],
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, side === 'left' ? styles.left : styles.right, { bottom }, style]}>
      <Animated.View style={[styles.row, crewStyle]}>
        {npc ? <Npc variant={npc} size={size * 1.5} emotion={emotion} bobPhase={0.9} /> : null}
        <View>
          {lead === 'bea' ? (
            <CaptainBea size={size} emotion={emotion} pose={pose} bobPhase={0.35} />
          ) : (
            <Rookie size={size} emotion={emotion} pose={pose} bobPhase={0} />
          )}
          {/* mounting the burst IS the trigger — it fires once per cheer beat */}
          {mood === 'cheer' ? <Sparkles trigger={1} radius={size * 0.5} count={9} scale={0.9} /> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 5 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  left: { left: 8 },
  right: { right: 8 },
});
