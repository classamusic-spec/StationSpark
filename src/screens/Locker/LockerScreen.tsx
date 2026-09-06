/**
 * LOCKER — the child's own corner of the station.
 *
 * The room (lockers, the open locker with their gear, the bench
 * on it) stays put while the gear sheet scrolls underneath, so Rookie is
 * always in view and every swatch tap shows up on the kid straight away.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, shadows, spacing, stagger } from '@/theme';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { useGame } from '@/state/store';
import { Rookie } from '@/characters/Rookie';
import { CaptainBea } from '@/characters/CaptainBea';
import { BottomBar, useScaledLayout } from '@/screens/shared';
import { LockerWall, lockerRoomLayout } from './LockerWall';
import { AgeBandCards } from './parts/AgeBandCards';
import { AvatarPickers } from './parts/AvatarPickers';
import { NamePatch } from './parts/NamePatch';
import { SignBoard } from './parts/SignBoard';

/* The Onboarding and Grown-Ups screens borrow these pieces. */
export { AGE_BANDS, AgeBandCards } from './parts/AgeBandCards';
export { AvatarPickers } from './parts/AvatarPickers';
export { NamePatch as NameTag } from './parts/NamePatch';

const ROOKIE_ASPECT = 120 / 165;
const PEPPER_ASPECT = 132 / 126;

export function LockerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useScaledLayout();
  const profile = useGame((s) => s.profile);
  const setAvatar = useGame((s) => s.setAvatar);
  const setProfile = useGame((s) => s.setProfile);
  const [name, setName] = useState(profile.name ?? '');

  const saveName = useCallback(
    (v: string) => {
      setName(v);
      setProfile({ name: v });
    },
    [setProfile],
  );

  const stageH = Math.round(Math.max(330, Math.min(layout.height * 0.44, 470)));
  const room = useMemo(() => lockerRoomLayout(layout.width, stageH), [layout.width, stageH]);
  const rookieSize = Math.round(Math.min(280, stageH * 0.7));
  const pepperSize = Math.round(Math.min(96, stageH * 0.24));

  return (
    <ScreenFrame
      safeBottom={false}
      backdrop={<LockerWall height={stageH} helmet={profile.avatar.helmet} name={name.trim() || 'Rookie'} />}
      chrome={
        <TopBar
          center={
            <SignBoard compact>
              <Text variant="h3">LOCKER ROOM</Text>
            </SignBoard>
          }
        />
      }
    >
      {/* the room stage: Rookie in front of the open locker, Captain Bea approving */}
      <View style={[styles.stage, { height: stageH - insets.top }]} pointerEvents="none">
        <View style={[styles.actor, { left: room.rookieX - (rookieSize * ROOKIE_ASPECT) / 2, bottom: 4 }]}>
          <Rookie size={rookieSize} avatar={profile.avatar} pose="wave" emotion="proud" />
        </View>
        <View style={[styles.actor, { left: room.benchX - (pepperSize * PEPPER_ASPECT) / 2 + 4, bottom: stageH - room.benchTop - 3 }]}>
          <CaptainBea size={pepperSize * 1.25} emotion="proud" pose="stand" bobPhase={0.7} />
        </View>
      </View>

      {/* the gear sheet */}
      <View style={[styles.sheet, shadows.card]}>
        <ScrollView
          contentContainerStyle={[styles.sheetContent, { maxWidth: layout.contentWidth }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.springify().damping(17)}>
            <NamePatch value={name} onChange={saveName} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(stagger.card).springify().damping(17)}>
            <Panel tone="white" padding="md" radius="panel" style={styles.card}>
              <Text variant="h3">Gear up!</Text>
              <AvatarPickers avatar={profile.avatar} onChange={setAvatar} />
            </Panel>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(stagger.card * 2).springify().damping(17)}>
            <Panel tone="white" padding="md" radius="panel" style={styles.card}>
              <Text variant="h3">How old are you?</Text>
              <Text variant="small" color={palette.navySoft}>
                For grown-ups: this sets how tricky the games are. You can change it any time.
              </Text>
              <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} />
            </Panel>
          </Animated.View>

          <Button label="Back to the station" tone="green" size="lg" block onPress={() => router.push('/')} />
          <View style={styles.footerSpace} />
        </ScrollView>
      </View>

      <BottomBar active="locker" />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignSelf: 'stretch' },
  actor: { position: 'absolute' },
  sheet: {
    flex: 1,
    backgroundColor: palette.panel,
    borderTopLeftRadius: radii.panel + 6,
    borderTopRightRadius: radii.panel + 6,
    overflow: 'hidden',
  },
  sheetContent: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  card: { gap: spacing.xs },
  footerSpace: { height: spacing.lg },
});
