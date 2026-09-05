/**
 * GAME CREW — the resident characters that give every mini-game life
 * (art critique item #25): Beacon hovering with his glow, optionally Pepper
 * and a watching neighbour. Sits in a bottom corner, never blocks touches.
 *
 * Baseline implementation; the character art pass upgrades reactions and
 * secondary motion without changing this API.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Beacon } from './Beacon';
import { Pepper } from './Pepper';
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

export function GameCrew({ side = 'right', mood = 'idle', showPepper = false, npc, size = 84, bottom = 0, style }: GameCrewProps) {
  const emotion = emotionFor(mood);
  return (
    <View pointerEvents="none" style={[styles.wrap, side === 'left' ? styles.left : styles.right, { bottom }, style]}>
      {npc ? <Npc variant={npc} size={size * 1.6} emotion={emotion} /> : null}
      <Beacon size={size} emotion={emotion} spinning={mood === 'cheer'} />
      {showPepper ? <Pepper size={size * 0.9} emotion={emotion} wag={mood !== 'idle'} jumping={mood === 'cheer'} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', flexDirection: 'row', alignItems: 'flex-end', gap: 4, zIndex: 5 },
  left: { left: 8 },
  right: { right: 8 },
});
