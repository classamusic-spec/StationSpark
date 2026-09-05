/**
 * NAME BADGE — the profile card, pinned to the station wall: the child's
 * helmet portrait on a gold disc, their rank, and the Level / Next-rank row
 * with the green XP bar from reference frame F6.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import type { Avatar } from '@/state/store';
import { Chip, GlyphIcon, Panel, ProgressBar, StarIcon, Text } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { PushPin } from '@/screens/shared';
import { HelmetAvatar } from '../HelmetAvatar';

const PencilIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M4 17.2 15.6 5.6l2.8 2.8L6.8 20H4z" fill="#2F6BD8" />
    <Path d="M16.8 4.4l1.6-1.6a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3l-1.6 1.6z" fill="#2F6BD8" />
  </Svg>
);

export interface NameBadgeProps {
  name: string;
  avatar: Avatar;
  rankName: string;
  level: number;
  nextName: string | null;
  /** 0..1 toward the next rank */
  t: number;
  into: number;
  span: number;
  xp: number;
  avatarSize?: number;
  onEdit: () => void;
}

export function NameBadge({ name, avatar, rankName, level, nextName, t, into, span, xp, avatarSize = 112, onEdit }: NameBadgeProps) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.wrap}>
      <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <HelmetAvatar avatar={avatar} size={avatarSize} />
            <Chip label={rankName} tone="yellow" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              onPress={() => {
                sfx.play('tap');
                haptics.tap();
                onEdit();
              }}
              style={styles.editBtn}
              hitSlop={6}
            >
              <PencilIcon />
              <Text variant="buttonSmall" color="#2F6BD8">
                Edit Profile
              </Text>
            </Pressable>
          </View>

          <View style={styles.right}>
            <Text variant="h1" style={styles.name}>
              {name}
            </Text>
            <Text variant="small" color={palette.navySoft}>
              Helping today for a brighter tomorrow!
            </Text>
            <View style={styles.levelRow}>
              <Text variant="h3" style={styles.levelText}>
                {`Level ${level}`}
              </Text>
              <View style={styles.next}>
                <Text variant="small" color={palette.navySoft}>
                  {nextName ? `Next: ${nextName}` : 'Top rank!'}
                </Text>
                <StarIcon size={22} />
              </View>
            </View>
            <View style={styles.bar}>
              <ProgressBar value={t} height={22} accessibilityLabel={span > 0 ? `${into} of ${span} XP to the next rank` : `${xp} XP`} />
              {/* the faint end-goal marker on an empty bar */}
              {t < 0.9 ? (
                <View pointerEvents="none" style={styles.goal}>
                  <GlyphIcon id="star" size={16} label="next rank" />
                </View>
              ) : null}
            </View>
            <Text variant="small" color={palette.navySoft}>
              {span > 0 ? `${into} / ${span} XP` : `${xp} XP`}
            </Text>
          </View>
        </View>
      </Panel>
      {/* pinned through both top corners */}
      <View pointerEvents="none" style={[styles.pin, styles.pinLeft]}>
        <PushPin size={22} />
      </View>
      <View pointerEvents="none" style={[styles.pin, styles.pinRight]}>
        <PushPin size={22} color={palette.waterCyan} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  card: { gap: spacing.sm, ...shadows.card },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  left: { alignItems: 'center', gap: spacing.xs },
  right: { flex: 1, gap: 6, minWidth: 140 },
  name: { includeFontPadding: false },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: hit.min - 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#DCEBFF',
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, flexWrap: 'wrap', marginTop: 2 },
  levelText: { flexShrink: 0 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { alignSelf: 'stretch', justifyContent: 'center' },
  goal: { position: 'absolute', right: 4, opacity: 0.6 },
  pin: { position: 'absolute', top: -9 },
  pinLeft: { left: 22 },
  pinRight: { right: 22 },
});
