/**
 * GAME CREW — the resident characters that give every mini-game life
 * (art critique item #25). Beacon hovers with his cyan ground glow, Pepper's
 * tail wags and her ear flicks, and a neighbour can stand and watch. Sits in a
 * bottom corner and never blocks a touch.
 *
 * The `mood` prop is the whole reaction surface. Nothing else needs wiring:
 *
 *   idle   ambient only — hover, glow, blink, breathe, the odd ear flick
 *   think  Beacon's visor sweeps left-to-right and the crew tilts, listening
 *   happy  Beacon bounces, Pepper wags and hops — "yes, that one"
 *   cheer  Beacon barrel-rolls, Pepper jumps, sparkles pop over the crew
 *
 * Props are additive only: the scene engineer is placing this in all 22 games,
 * so `side`/`mood`/`showPepper`/`npc`/`size`/`bottom`/`style` keep their
 * meaning exactly.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { Sparkles } from '@/world/fx';
import { Beacon, type BeaconHandle } from './Beacon';
import { Pepper, type PepperHandle } from './Pepper';
import { Npc, type NpcVariant } from './Npc';

export type CrewMood = 'idle' | 'happy' | 'think' | 'cheer';

export interface GameCrewProps {
  /** which bottom corner (default right) */
  side?: 'left' | 'right';
  mood?: CrewMood;
  showPepper?: boolean;
  npc?: NpcVariant;
  /** Beacon height in px (Pepper/NPC scale from it) */
  size?: number;
  /** distance from the bottom edge, e.g. to sit above a Tray */
  bottom?: number;
  style?: StyleProp<ViewStyle>;
}

const emotionFor = (mood: CrewMood) =>
  mood === 'happy' ? ('happy' as const) : mood === 'cheer' ? ('excited' as const) : mood === 'think' ? ('think' as const) : ('calm' as const);

/** Pepper is delighted for anything that isn't "still thinking". */
const wagFor = (mood: CrewMood) => mood === 'happy' || mood === 'cheer';

export function GameCrew({ side = 'right', mood = 'idle', showPepper = false, npc, size = 84, bottom = 0, style }: GameCrewProps) {
  const emotion = emotionFor(mood);
  const reduced = useReducedMotion();
  const beacon = useRef<BeaconHandle>(null);
  const pepper = useRef<PepperHandle>(null);

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
    pepper.current?.jump();
    if (mood === 'cheer') beacon.current?.spin();
    return () => cancelAnimation(bounce);
  }, [bounce, mood, reduced]);

  const crewStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bounce.value * size * 0.1 }, { rotate: `${tilt.value * (side === 'left' ? 5 : -5)}deg` }],
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, side === 'left' ? styles.left : styles.right, { bottom }, style]}>
      <Animated.View style={[styles.row, crewStyle]}>
        {npc ? <Npc variant={npc} size={size * 1.6} emotion={emotion} bobPhase={0.9} /> : null}
        <View>
          <Beacon ref={beacon} size={size} emotion={emotion} scanning={mood === 'think'} bobPhase={0.4} />
          {/* mounting the burst IS the trigger — it fires once per cheer beat */}
          {mood === 'cheer' ? <Sparkles trigger={1} radius={size * 0.5} count={9} scale={0.9} /> : null}
        </View>
        {showPepper ? <Pepper ref={pepper} size={size * 0.9} emotion={emotion} wag={wagFor(mood)} bobPhase={1.6} /> : null}
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
