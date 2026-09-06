import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Birds } from './Birds';
import { Clouds, SkyHaze } from './Clouds';
import { Hills } from './Hills';
import { Moon, Stars, Sun } from './Sun';
import { TownSkyline } from './TownSkyline';
import { TreeLine } from './Trees';

export interface TownBackdropProps {
  mood?: 'day' | 'evening';
  /** show the sun bloom (or the moon after dark); off for busy screens */
  sun?: boolean;
  /** how tall the green hill band is, from the bottom of the screen */
  hills?: number;
  /** distant town on the horizon */
  skyline?: boolean;
  /** row of trees along the hill line */
  trees?: boolean;
  cloudCount?: number;
  /** a bird arcing across the sky every ~20 s (default on) */
  birds?: boolean;
}

/**
 * The standard outdoor world behind a screen, far to near:
 * sun bloom (or moon + stars) → clouds → far haze band → distant town →
 * treeline → hills, with a bird crossing every 20 s. The sky gradient itself
 * comes from `ScreenFrame`.
 */
export function TownBackdrop({
  mood = 'day',
  sun = true,
  hills = 230,
  skyline = true,
  trees = true,
  cloudCount = 4,
  birds = true,
}: TownBackdropProps) {
  const evening = mood === 'evening';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {sun ? evening ? <Moon size={124} top={10} right={8} /> : <Sun size={260} top={-136} right={-128} /> : null}
      {evening ? <Stars band={300} count={9} /> : null}
      <Clouds count={cloudCount} top={30} height={180} opacity={evening ? 0.7 : 1} />
      <SkyHaze bottom={hills + 46} height={104} tint={evening ? '#9FA9D8' : '#BBD8F2'} />
      {/* the distant town sits *above* the treeline's tops, so the horizon
          actually reads instead of hiding behind the trees (critique #5) */}
      {skyline ? <TownSkyline mood={mood} bottom={hills + 26} height={116} opacity={evening ? 0.72 : 0.88} /> : null}
      {birds ? <Birds count={2} top={92} periodMs={20000} /> : null}
      {/*
        A treeline standing on a hill has to satisfy two things at once, and it
        used to satisfy neither.

        `Hills` draws over it, so the trees' feet are hidden only where the far
        ridge is above them — and that ridge undulates between 0.32h and 0.86h
        above the bottom. The trees were pinned at `hills - 46`, level with the
        ridge's highest peaks, so everywhere but those peaks they stood on open
        sky with their contact shadows beneath them: on the home screen, a row
        of bare poles apparently reflected in a lake.

        So root them below the ridge's *lowest* dip (0.3h) — and then size them
        to clear its *highest* peak, or they simply vanish behind the hill,
        which is what merely lowering them did on a tablet. At 0.52h the band
        reaches ~0.95h: every tree is planted in green, and the canopies break
        the ridge line by a different amount along its length, which is what
        gives the horizon its depth.
      */}
      {trees ? (
        <TreeLine
          bottom={Math.round(hills * 0.3)}
          height={Math.round(hills * 0.52)}
          count={7}
          tone={evening ? 'dark' : 'mid'}
        />
      ) : null}
      <Hills height={hills} mood={mood} />
    </View>
  );
}
