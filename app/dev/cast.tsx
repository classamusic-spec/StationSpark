import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CaptainBea, CharacterPortrait, Rookie } from '@/characters';
import type { CharacterPose } from '@/characters';
import type { Emotion } from '@/content/types';
import { palette, radii, spacing } from '@/theme';
import { Button, Logo, Text } from '@/ui';

/**
 * Dev-only bench for the two leads.
 *
 * The characters are the authored art from `SVG ART/` (see
 * `tools/art/build-characters.mjs` and `npm run art:verify`, which proves the
 * rendering is pixel-identical to the source files). This route exists to
 * check the *rig* — that every pose and mood reads clearly, that the hat lags
 * the head, that a blink lands, and that two characters side by side never
 * move in lockstep.
 */
const POSES: CharacterPose[] = ['stand', 'wave', 'point', 'think', 'cheer', 'talk'];
const MOODS: Emotion[] = ['happy', 'excited', 'proud', 'calm', 'think', 'worried', 'surprised'];

export default function CastRoute() {
  const [pose, setPose] = useState<CharacterPose>('stand');
  const [mood, setMood] = useState<Emotion>('happy');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Logo size={260} />

      <Text variant="h2">Cast</Text>
      <View style={styles.stage}>
        <View style={styles.slot}>
          <CaptainBea size={220} pose={pose} emotion={mood} speaking={pose === 'talk'} bobPhase={0.35} />
          <Text variant="bodyStrong" center>
            Captain Bea
          </Text>
        </View>
        <View style={styles.slot}>
          <Rookie size={220} pose={pose} emotion={mood} speaking={pose === 'talk'} bobPhase={0} />
          <Text variant="bodyStrong" center>
            Rookie
          </Text>
        </View>
      </View>

      <Text variant="h3">Pose</Text>
      <View style={styles.row}>
        {POSES.map((p) => (
          <Button key={p} label={p} size="sm" tone={p === pose ? 'red' : 'white'} onPress={() => setPose(p)} />
        ))}
      </View>

      <Text variant="h3">Mood</Text>
      <View style={styles.row}>
        {MOODS.map((m) => (
          <Button key={m} label={m} size="sm" tone={m === mood ? 'blue' : 'white'} onPress={() => setMood(m)} />
        ))}
      </View>

      <Text variant="h3">Sizes</Text>
      <View style={styles.row}>
        {[64, 96, 140, 180].map((s) => (
          <View key={s} style={styles.sizeSlot}>
            <Rookie size={s} pose="stand" bobPhase={s / 200} />
            <Text variant="tiny" center>{`${s} px`}</Text>
          </View>
        ))}
        {[64, 96, 140, 180].map((s) => (
          <View key={`b${s}`} style={styles.sizeSlot}>
            <CaptainBea size={s} pose="stand" bobPhase={s / 260} />
            <Text variant="tiny" center>{`${s} px`}</Text>
          </View>
        ))}
      </View>

      <Text variant="h3">Portraits (dialogue and hint chrome)</Text>
      <View style={styles.row}>
        {([56, 72, 96] as const).map((s2) => (
          <View key={s2} style={styles.sizeSlot}>
            <CharacterPortrait id="bea" emotion="think" size={s2} />
            <Text variant="tiny" center>{`bea ${s2}`}</Text>
          </View>
        ))}
        {([56, 72, 96] as const).map((s2) => (
          <View key={`r${s2}`} style={styles.sizeSlot}>
            <CharacterPortrait id="rookie" emotion="happy" size={s2} />
            <Text variant="tiny" center>{`rookie ${s2}`}</Text>
          </View>
        ))}
      </View>

      <Text variant="h3">Flat (thumbnails and crowds)</Text>
      <View style={styles.row}>
        <Rookie size={72} flat />
        <CaptainBea size={72} flat />
        <Rookie size={48} flat />
        <CaptainBea size={48} flat />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  content: { padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
  stage: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.md,
  },
  slot: { alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center', alignItems: 'flex-end' },
  sizeSlot: { alignItems: 'center' },
});
