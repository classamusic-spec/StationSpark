import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { hit, palette, radii, shadows, spacing, springs, typeScale } from '@/theme';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { AgeBand } from '@/learning/types';
import { useGame } from '@/state/store';
import type { Avatar } from '@/state/store';
import { Rookie } from '@/characters/Rookie';
import { hairTones, helmetTones, skinTones } from '@/characters/rig/palettes';
import { BottomBar, Swatch, useScaledLayout } from '@/screens/shared';
import { LockerWall } from './LockerWall';

const SKINS: Avatar['skin'][] = ['peach', 'tan', 'brown', 'deep'];
const HAIRS: Avatar['hair'][] = ['dark', 'brown', 'blonde', 'red', 'black-curly'];
const HELMETS: Avatar['helmet'][] = ['red', 'yellow', 'blue', 'pink'];

export const AGE_BANDS: { value: AgeBand; label: string; sub: string; color: string }[] = [
  { value: 'A', label: 'I am 5–6', sub: 'Counting & first words', color: palette.leafGreen },
  { value: 'B', label: 'I am 7–8', sub: 'Adding, reading, fractions', color: palette.safetyYellow },
  { value: 'C', label: 'I am 9–10', sub: 'Times tables & longer reads', color: palette.waterCyan },
];

export function AgeBandCards({ value, onChange, compact }: { value: AgeBand; onChange: (b: AgeBand) => void; compact?: boolean }) {
  return (
    <View style={compact ? styles.bandsRow : styles.bands}>
      {AGE_BANDS.map((b) => {
        const active = b.value === value;
        return (
          <Pressable
            key={b.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${b.label}. ${b.sub}`}
            onPress={() => {
              sfx.play('pop');
              haptics.select();
              onChange(b.value);
            }}
            style={[styles.band, shadows.soft, compact && styles.bandCompact, active && { backgroundColor: b.color, borderColor: palette.navy }]}
          >
            <Text variant={compact ? 'buttonSmall' : 'h3'} color={palette.navy} center numberOfLines={1}>
              {b.label}
            </Text>
            {!compact ? (
              <Text variant="small" color={active ? palette.navy : palette.navySoft} center numberOfLines={2}>
                {b.sub}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function AvatarPickers({ avatar, onChange, compact }: { avatar: Avatar; onChange: (a: Partial<Avatar>) => void; compact?: boolean }) {
  const size = compact ? 44 : hit.min;
  return (
    <View style={styles.pickers}>
      <Text variant={compact ? 'buttonSmall' : 'h3'}>Skin</Text>
      <View style={styles.swatchRow}>
        {SKINS.map((s) => (
          <Swatch key={s} size={size} color={skinTones[s].base} label={`Skin ${s}`} active={avatar.skin === s} onPress={() => onChange({ skin: s })} />
        ))}
      </View>
      <Text variant={compact ? 'buttonSmall' : 'h3'}>Hair</Text>
      <View style={styles.swatchRow}>
        {HAIRS.map((h) => (
          <Swatch key={h} size={size} color={hairTones[h].base} label={`Hair ${h}`} active={avatar.hair === h} onPress={() => onChange({ hair: h })} />
        ))}
      </View>
      <Text variant={compact ? 'buttonSmall' : 'h3'}>Helmet</Text>
      <View style={styles.swatchRow}>
        {HELMETS.map((h) => (
          <Swatch key={h} size={size} color={helmetTones[h].base} label={`Helmet ${h}`} active={avatar.helmet === h} onPress={() => onChange({ helmet: h })} />
        ))}
      </View>
    </View>
  );
}

export function NameTag({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const focus = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + focus.value * 0.02 }] }));
  return (
    <Animated.View style={[styles.nameTag, shadows.card, style]}>
      <Text variant="tiny" color={palette.engineRed}>
        STATION SPARK · CREW
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, 12))}
        placeholder="Your name"
        placeholderTextColor={palette.navyMuted}
        maxLength={12}
        autoCorrect={false}
        returnKeyType="done"
        accessibilityLabel="Your name"
        onFocus={() => {
          focus.value = withSpring(1, springs.pop);
        }}
        onBlur={() => {
          focus.value = withSpring(0, springs.gentle);
        }}
        style={[
          styles.nameInput,
          { fontFamily: typeScale.h2.fontFamily, fontSize: typeScale.h2.fontSize, color: palette.navy },
          Platform.OS === 'web' ? styles.noOutline : null,
        ]}
      />
      <View style={styles.nameRule} />
    </Animated.View>
  );
}

export function LockerScreen() {
  const router = useRouter();
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

  const rookieSize = Math.max(180, Math.min(280, layout.s(230)));

  return (
    <ScreenFrame safeBottom={false} backdrop={<LockerWall top={0} height={Math.max(340, layout.height * 0.5)} />} chrome={<TopBar />}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.header}>
          <Panel tone="glass" padding="xs" radius="pill" style={styles.banner}>
            <Text variant="h2" center>
              Your Locker
            </Text>
          </Panel>
        </Animated.View>

        <View style={styles.stage}>
          <Rookie size={rookieSize} avatar={profile.avatar} pose="stand" emotion="proud" />
        </View>

        <NameTag value={name} onChange={saveName} />

        <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
          <AvatarPickers avatar={profile.avatar} onChange={setAvatar} />
        </Panel>

        <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
          <Text variant="h3">How old are you?</Text>
          <Text variant="small" color={palette.navySoft}>
            For grown-ups: this sets how tricky the games are. You can change it any time.
          </Text>
          <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} />
        </Panel>

        <Button label="Back to the station" tone="green" size="lg" block onPress={() => router.push('/')} />
        <View style={styles.footerSpace} />
      </ScrollView>

      <BottomBar active="locker" />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: { alignItems: 'center', marginTop: 56 },
  banner: { paddingHorizontal: spacing.lg, minWidth: 190 },
  stage: { alignItems: 'center', marginTop: spacing.xs },
  card: { gap: spacing.xs },
  pickers: { gap: spacing.xs },
  swatchRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  nameTag: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 240,
    maxWidth: 360,
    width: '100%',
    borderWidth: 3,
    borderColor: palette.creamDeep,
  },
  nameInput: { minHeight: hit.min, paddingVertical: 4 },
  noOutline: { outlineStyle: 'none' } as object,
  nameRule: { height: 3, borderRadius: 2, backgroundColor: palette.engineRed, opacity: 0.5 },
  bands: { gap: spacing.xs },
  bandsRow: { flexDirection: 'row', gap: spacing.xs },
  band: {
    minHeight: hit.big,
    borderRadius: radii.card,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  bandCompact: { flex: 1, minHeight: hit.min },
  footerSpace: { height: spacing.lg },
});
