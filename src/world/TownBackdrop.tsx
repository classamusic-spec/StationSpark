import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Clouds } from './Clouds';
import { Hills } from './Hills';
import { Sun } from './Sun';
import { TownSkyline } from './TownSkyline';
import { TreeLine } from './Trees';

export interface TownBackdropProps {
  mood?: 'day' | 'evening';
  /** show the sun and its slow rays (off for busy screens) */
  sun?: boolean;
  /** how tall the green hill band is, from the bottom of the screen */
  hills?: number;
  /** distant town on the horizon */
  skyline?: boolean;
  /** row of trees along the hill line */
  trees?: boolean;
  cloudCount?: number;
}

/**
 * The standard outdoor world behind a screen: sun → clouds → distant town →
 * hills → trees. The sky gradient itself comes from `ScreenFrame`.
 */
export function TownBackdrop({ mood = 'day', sun = true, hills = 230, skyline = true, trees = true, cloudCount = 4 }: TownBackdropProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sun ? <Sun size={140} top={-16} right={-18} /> : null}
      <Clouds count={cloudCount} top={30} height={180} opacity={mood === 'evening' ? 0.7 : 1} />
      {skyline ? <TownSkyline mood={mood} bottom={hills - 34} height={116} opacity={mood === 'evening' ? 0.45 : 0.5} /> : null}
      {trees ? <TreeLine bottom={hills - 42} height={96} count={7} tone={mood === 'evening' ? 'dark' : 'mid'} /> : null}
      <Hills height={hills} mood={mood} />
    </View>
  );
}
