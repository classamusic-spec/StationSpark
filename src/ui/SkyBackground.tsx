import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '@/theme';

export type SkyMood = 'day' | 'evening' | 'kitchen';

const moods: Record<SkyMood, readonly [string, string, ...string[]]> = {
  day: gradients.sky,
  evening: gradients.skyEvening,
  kitchen: gradients.kitchen,
};

/** Full-bleed sky gradient. Put world layers (clouds, hills, buildings) on top. */
export function SkyBackground({ mood = 'day', children }: { mood?: SkyMood; children?: React.ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <LinearGradient colors={moods[mood]} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}
