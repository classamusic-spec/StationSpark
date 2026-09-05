import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { useGame } from '@/state/store';
import { spacing } from '@/theme';

const routes: { label: string; href: Href }[] = [
  { label: 'Firehouse (home)', href: '/' },
  { label: 'Onboarding', href: '/onboarding' },
  { label: 'Dispatch', href: '/dispatch' },
  { label: 'Spark City map', href: '/map' },
  { label: 'Training Yard', href: '/training' },
  { label: 'Kitchen', href: '/kitchen' },
  { label: 'Garage', href: '/garage' },
  { label: 'Badge Wall / Progress', href: '/badges' },
  { label: 'Locker', href: '/locker' },
  { label: 'Grown-Ups', href: '/grownups' },
  { label: 'UI kit gallery', href: '/dev/kit' },
];

/** Dev-only index of every route, used for browser QA. */
export default function DevGallery() {
  const router = useRouter();
  const resetAll = useGame((s) => s.resetAll);
  const setProfile = useGame((s) => s.setProfile);
  return (
    <ScreenFrame chrome={<TopBar />}>
      <ScrollView contentContainerStyle={styles.list}>
        <Text variant="h1" center>
          Dev gallery
        </Text>
        {routes.map((r) => (
          <Button key={r.label} label={r.label} tone="white" size="md" block onPress={() => router.push(r.href)} />
        ))}
        <Panel tone="cream">
          <View style={styles.row}>
            <Button label="Reset store" tone="navy" size="sm" onPress={resetAll} />
            <Button label="Skip onboarding" tone="green" size="sm" onPress={() => setProfile({ onboarded: true })} />
          </View>
        </Panel>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingTop: 72, gap: spacing.sm, maxWidth: 520, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', flexWrap: 'wrap' },
});
