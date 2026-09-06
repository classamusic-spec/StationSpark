/**
 * The home screen's own sky.
 *
 * `TownBackdrop` stacks a haze band, a distant skyline, a treeline and three
 * hill ridges — five layers of scenery, all at the same visual weight, all
 * directly behind the one building the child is meant to look at. On every
 * other screen that density is right, because the content floats over it. Here
 * the *station* is the content, so the background's whole job is to stay out of
 * its way: a gradient, a couple of clouds, one warm bloom and a bird.
 *
 * The ground is not drawn here — `Street` owns it — so this piece never has to
 * agree with the hills about where the horizon is.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Birds, Clouds, Moon, SkyHaze, Stars, Sun } from '@/world';

export interface FirehouseBackdropProps {
  mood?: 'day' | 'evening';
  /** px from the bottom of the screen where the world meets the sky */
  horizon: number;
}

export function FirehouseBackdrop({ mood = 'day', horizon }: FirehouseBackdropProps) {
  const { width } = useWindowDimensions();
  const evening = mood === 'evening';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {evening ? <Moon size={116} top={16} right={14} /> : <Sun size={280} top={-150} right={-142} />}
      {evening ? <Stars band={280} count={8} /> : null}
      {/* a couple of clouds, high and unhurried: enough to say "sky", never a
          pattern — a wide window gets one more so the band still reads */}
      <Clouds count={width >= 900 ? 3 : 2} top={44} height={140} opacity={evening ? 0.62 : 0.92} />
      {/* the value step that separates sky from ground, right where they meet */}
      <SkyHaze bottom={horizon} height={132} tint={evening ? '#9FA9D8' : '#CBE6FA'} />
      <Birds count={1} top={104} periodMs={22000} />
    </View>
  );
}
