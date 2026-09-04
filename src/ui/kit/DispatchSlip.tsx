import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { hit, palette, radii, shadows, spacing, stagger, type SubjectId } from '@/theme';
import { useFeedbackAnim } from '@/hooks';
import { Text } from '../Text';
import { SubjectPill } from '../SubjectPill';
import { ChevronRightIcon, LockIcon } from '../icons';
import { StarRow } from './StarRow';

export interface DispatchSlipProps {
  title: string;
  /** the one-line hook — "Help the bakery get ready for the big festival!" */
  tagline?: string;
  subjects?: readonly SubjectId[];
  /** scene art for the left-hand thumbnail (a `<BuildingFacade/>`, an illustration…) */
  thumbnail?: React.ReactNode;
  /** stars already earned on this mission */
  stars?: 0 | 1 | 2 | 3;
  locked?: boolean;
  /** why it's locked — "Finish Bakery Bell first" */
  lockedHint?: string;
  /** small right-hand meta, e.g. "8 min" */
  meta?: string;
  onPress?: () => void;
  /** position in the list, for the entrance stagger */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

const THUMB_W = 118;
const THUMB_H = 96;

/**
 * The dispatch slip — Station Spark's mission card. A white card floating over
 * the sky: scene thumbnail, title, tagline, subject pills and a big green round
 * chevron. Locked slips stay friendly: greyed art, a padlock, and a hint about
 * what opens them (never "you failed").
 */
export function DispatchSlip({ title, tagline, subjects, thumbnail, stars, locked = false, lockedHint, meta, onPress, index = 0, style }: DispatchSlipProps) {
  const { style: anim, press } = useFeedbackAnim();

  return (
    <Animated.View entering={FadeInDown.delay(index * stagger.card).springify().damping(16)} style={[anim, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
        accessibilityLabel={locked ? `${title}, locked. ${lockedHint ?? ''}` : `${title}. ${tagline ?? ''}`}
        disabled={locked || !onPress}
        onPressIn={() => press(true)}
        onPressOut={() => press(false)}
        onPress={onPress}
      >
        <View style={[styles.card, shadows.card, locked && styles.locked]}>
          <View style={styles.thumb}>
            <LinearGradient
              colors={locked ? [palette.slateLight, '#B9C0D6'] : [palette.skyMid, palette.grass]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            />
            {thumbnail ? <View style={styles.thumbArt}>{thumbnail}</View> : null}
            {locked ? (
              <View style={styles.thumbLock}>
                <LockIcon size={34} color={palette.white} />
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant="h2" numberOfLines={2} style={styles.title}>
                {title}
              </Text>
              {meta ? (
                <Text variant="tiny" color={palette.navyMuted}>
                  {meta}
                </Text>
              ) : null}
            </View>
            {tagline ? (
              <Text variant="small" color={palette.navySoft} numberOfLines={2}>
                {tagline}
              </Text>
            ) : null}
            {locked && lockedHint ? (
              <Text variant="tiny" color={palette.navyMuted}>
                {lockedHint}
              </Text>
            ) : null}
            {subjects && subjects.length ? (
              <View style={styles.pills}>
                {subjects.map((s) => (
                  <SubjectPill key={s} subject={s} small />
                ))}
              </View>
            ) : null}
            {stars !== undefined && !locked ? <StarRow stars={stars} size={20} /> : null}
          </View>

          <View style={styles.go}>
            {locked ? (
              <View style={[styles.chevron, styles.chevronLocked]}>
                <LockIcon size={26} color={palette.white} />
              </View>
            ) : (
              <View style={[styles.chevronEdge]}>
                <View style={styles.chevron}>
                  <ChevronRightIcon size={30} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  locked: { opacity: 0.72 },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: radii.tile,
    overflow: 'hidden',
    backgroundColor: palette.skyMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbArt: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  thumbLock: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(31,42,90,0.28)' },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  title: { flexShrink: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  go: { width: hit.min + 4, alignItems: 'center', justifyContent: 'center' },
  chevronEdge: { borderRadius: hit.min, backgroundColor: palette.leafGreenDark, paddingBottom: 4 },
  chevron: {
    width: hit.min,
    height: hit.min,
    borderRadius: hit.min / 2,
    backgroundColor: palette.leafGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  chevronLocked: { backgroundColor: palette.lockedGrey, borderColor: 'rgba(255,255,255,0.5)' },
});
