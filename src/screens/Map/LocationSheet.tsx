import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { Button, ChevronRightIcon, LockIcon, StarRow, SubjectPill, Text } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';

export interface SheetMission {
  def: MissionDef;
  stars: Stars;
  available: boolean;
  /** title of the mission that unlocks this one */
  requiresLabel?: string;
}

export interface LocationSheetProps {
  name: string;
  nameEs: string;
  color: string;
  missions: SheetMission[];
  onGo: (id: string) => void;
  onClose: () => void;
}

/** The little panel that rises when a map pin is tapped. */
export function LocationSheet({ name, nameEs, color, missions, onGo, onClose }: LocationSheetProps) {
  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
      <Animated.View entering={FadeInDown.springify().damping(17)} style={[styles.sheet, shadows.card]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={styles.headText}>
            <Text variant="h2" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="small" color={palette.purple}>
              {nameEs}
            </Text>
          </View>
        </View>

        {missions.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyStrong" center>
              Coming soon!
            </Text>
            <Text variant="small" color={palette.navySoft} center>
              New calls arrive here as you help around Spark City.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listInner} showsVerticalScrollIndicator={false}>
            {missions.map((m) => (
              <View key={m.def.id} style={[styles.row, !m.available && styles.rowLocked]}>
                <View style={styles.rowText}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {m.def.title}
                  </Text>
                  <Text variant="small" color={palette.navySoft} numberOfLines={2}>
                    {m.available ? m.def.tagline : `Finish ${m.requiresLabel ?? 'an earlier call'} first.`}
                  </Text>
                  <View style={styles.pills}>
                    {m.def.subjects.slice(0, 3).map((s) => (
                      <SubjectPill key={s} subject={s} small />
                    ))}
                  </View>
                  <StarRow stars={m.stars} size={18} />
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
                  <View style={styles.lock}>
                    <LockIcon size={24} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <Button label="Close" tone="white" size="md" onPress={onClose} block />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,42,90,0.34)', justifyContent: 'flex-end', zIndex: 70 },
  sheet: {
    backgroundColor: palette.white,
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
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  rowLocked: { backgroundColor: '#F1F3F9' },
  rowText: { flex: 1, gap: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  go: { width: hit.min, height: hit.min, borderRadius: hit.min / 2, backgroundColor: palette.leafGreen, alignItems: 'center', justifyContent: 'center' },
  lock: { width: hit.min, height: hit.min, alignItems: 'center', justifyContent: 'center' },
});
