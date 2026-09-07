/**
 * Route wrapper for /mission/[id]: resolves the id to a MissionDef and hands it
 * to the runner. An unknown id gets a friendly card and a way back — never a
 * blank screen or a crash.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { missionById } from '@/content/missions';
import { spacing } from '@/theme';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { CharacterPortrait } from '@/characters';
import { useScaledLayout } from '@/screens/shared';
import { MissionRunner } from './MissionRunner';
import { SceneHero } from './SceneHero';

export function MissionRoute({ id }: { id: string }) {
  const router = useRouter();
  const { contentWidth } = useScaledLayout();
  const mission = id ? missionById(id) : undefined;

  if (!mission) {
    /* back in the station yard, not adrift on a rectangle of sky */
    return (
      <ScreenFrame backdrop={<SceneHero scene="station-yard" radius={0} style={StyleSheet.absoluteFill} />} chrome={<TopBar />}>
        <View style={styles.wrap}>
          <Panel tone="white" radius="panel" style={[styles.card, { width: contentWidth }]}>
            <CharacterPortrait id="bea" emotion="think" size={80} />
            <Text variant="h1" center>
              That call has closed
            </Text>
            <Text variant="body" center>
              Captain Bea could not find this job on the board. Let&apos;s pick another one!
            </Text>
            <Button label="Back to Dispatch ›" tone="green" size="lg" block onPress={() => router.replace('/dispatch')} />
          </Panel>
        </View>
      </ScreenFrame>
    );
  }

  return <MissionRunner key={mission.id} mission={mission} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { alignItems: 'center', gap: spacing.sm },
});
