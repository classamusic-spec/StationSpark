import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { SceneId } from '@/learning/types';
import { SceneHero, SceneThumb } from '@/screens/Mission/SceneHero';

const IDS: SceneId[] = [
  'bakery',
  'pizza',
  'school',
  'park',
  'clock-tower',
  'apartments',
  'pet-shop',
  'library',
  'market',
  'station-yard',
];

/** TEMPORARY QA route — delete before shipping. */
export default function DevScene() {
  const { id, bare } = useLocalSearchParams<{ id?: string; bare?: string }>();
  const scene = (IDS.includes(id as SceneId) ? id : 'bakery') as SceneId;
  const grid = id === 'all';
  if (grid) {
    return (
      <View style={styles.grid}>
        {IDS.map((s) => (
          <SceneThumb key={s} scene={s} width={120} height={100} />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <SceneHero scene={scene} radius={0} style={StyleSheet.absoluteFill} />
      {bare ? null : <View style={styles.bubble} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 150 },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, backgroundColor: '#EEF2F8', alignContent: 'flex-start' },
  /* an honest stand-in for DialogueOverlay's card: opaque, so it hides what it
     hides instead of tinting the art underneath and lying about its colour */
  bubble: { position: 'absolute', left: 16, right: 16, bottom: 24, height: 200, borderRadius: 28, backgroundColor: '#FFFFFF' },
});
