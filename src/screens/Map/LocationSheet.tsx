import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { hit, palette, radii, roles, spacing } from '@/theme';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { Button, ChevronRightIcon, LockIcon, StarRow, SubjectPill, Text } from '@/ui';
import { useShowTranslation } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';

export interface SheetMission {
  def: MissionDef;
  stars: Stars;
  available: boolean;
  /** title of the mission that unlocks this one */
  requiresLabel?: string;
}

export interface LocationPanelProps {
  name: string;
  nameEs: string;
  color: string;
  missions: SheetMission[];
  onGo: (id: string) => void;
}

/**
 * What is at this pin. THIS is the detail view — the one place the full,
 * colour-coded subject pills belong, because here the child has already chosen
 * a place and is reading about a single job rather than scanning a board.
 */
export function LocationPanel({ name, nameEs, color, missions, onGo }: LocationPanelProps) {
  const showEs = useShowTranslation();
  return (
    <>
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={styles.headText}>
          <Text variant="h2" numberOfLines={2} accessibilityRole="header">
            {name}
          </Text>
          <Text variant="small" color={roles.ink.translation} numberOfLines={1}>
            {nameEs}
          </Text>
        </View>
      </View>

      {missions.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyStrong" center>
            Coming soon!
          </Text>
          <Text variant="small" color={roles.ink.secondary} center>
            New calls arrive here as you help around Spark City.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
          {missions.map((m) => {
            const es = showEs && m.def.titleEs && m.def.titleEs !== m.def.title ? m.def.titleEs : undefined;
            return (
              <View key={m.def.id} style={[styles.row, !m.available && styles.rowLocked]}>
                <View style={styles.rowText}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {m.def.title}
                  </Text>
                  {es ? (
                    <Text variant="small" color={roles.ink.translation} numberOfLines={1}>
                      {es}
                    </Text>
                  ) : null}
                  <Text variant="small" color={roles.ink.secondary} numberOfLines={2}>
                    {m.available ? m.def.tagline : `Finish ${m.requiresLabel ?? 'an earlier call'} first.`}
                  </Text>
                  <View style={styles.pills}>
                    {m.def.subjects.slice(0, 3).map((s) => (
                      <SubjectPill key={s} subject={s} small />
                    ))}
                  </View>
                  {m.stars > 0 ? <StarRow stars={m.stars} size={18} /> : null}
                </View>
                {m.available ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Go to ${m.def.title}`}
                    onPress={() => {
                      sfx.play('tap');
                      haptics.tap();
                      onGo(m.def.id);
                    }}
                    style={styles.go}
                    hitSlop={8}
                  >
                    <ChevronRightIcon size={26} />
                  </Pressable>
                ) : (
                  <View style={styles.lock} accessibilityLabel="Not open yet">
                    <LockIcon size={24} />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </>
  );
}

export interface LocationSheetProps extends LocationPanelProps {
  onClose: () => void;
}

/** The little panel that rises when a map pin is tapped — the phone form. */
export function LocationSheet({ name, nameEs, color, missions, onGo, onClose }: LocationSheetProps) {
  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
      <Animated.View entering={FadeInDown.springify().damping(17)} style={[styles.sheet, roles.lift.interactive]}>
        <View style={styles.grab} />
        <LocationPanel name={name} nameEs={nameEs} color={color} missions={missions} onGo={onGo} />
        <Button label="Close" tone="white" size="md" onPress={onClose} block />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,42,90,0.34)', justifyContent: 'flex-end', zIndex: 70 },
  sheet: {
    backgroundColor: roles.surface.card,
    borderTopLeftRadius: radii.panel + 8,
    borderTopRightRadius: radii.panel + 8,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    maxHeight: '78%',
  },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: palette.slateLight },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 18, height: 18, borderRadius: 9 },
  headText: { flexShrink: 1 },
  empty: { paddingVertical: spacing.lg, gap: 4 },
  list: { alignSelf: 'stretch' },
  listInner: { gap: spacing.sm, paddingBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: roles.surface.control,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  rowLocked: { backgroundColor: '#F1F3F9' },
  rowText: { flex: 1, gap: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  go: { width: hit.min, height: hit.min, borderRadius: hit.min / 2, backgroundColor: palette.leafGreen, alignItems: 'center', justifyContent: 'center' },
  lock: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
});
