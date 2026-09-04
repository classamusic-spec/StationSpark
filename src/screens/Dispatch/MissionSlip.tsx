/**
 * MissionSlip — a dispatch slip card.
 *
 * White card floating on the sky: scene thumbnail, title, tagline, subject
 * pills, stars already earned, and a green round chevron. Locked slips show a
 * lock and the mission that unlocks them; they are never scary, just "not yet".
 *
 * (The UI kit is expected to grow a shared `DispatchSlip`. Until it exports one
 * this local card carries the look — same anatomy, same tokens.)
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { easings, hit, palette, radii, shadows, spacing, springs, stagger } from '@/theme';
import { LockIcon, StarIcon } from '@/ui/icons';
import { SubjectPill } from '@/ui/SubjectPill';
import { Text } from '@/ui/Text';
import { SceneThumb } from '@/screens/Mission/SceneHero';

/** The green "go" chevron on the right of every slip. */
function GoChevron({ dim }: { dim?: boolean }) {
  return (
    <View style={styles.chevron}>
      <Svg width={54} height={54} viewBox="0 0 54 54">
        <Circle cx={27} cy={29} r={25} fill={dim ? palette.slate : palette.leafGreenDark} />
        <Circle cx={27} cy={26} r={25} fill={dim ? palette.lockedGrey : palette.leafGreen} />
        <Path d="M 22 15 L 34 26 L 22 37" stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

/** Tiny earned-stars row shown under the pills. */
function EarnedStars({ stars }: { stars: Stars }) {
  return (
    <View style={styles.stars}>
      {[0, 1, 2].map((i) => (
        <StarIcon
          key={i}
          size={16}
          color={i < stars ? palette.safetyYellow : palette.lockedGrey}
          stroke={i < stars ? palette.goldDark : palette.slate}
        />
      ))}
    </View>
  );
}

/** The red "DISPATCHED" stamp that slams down when a slip is chosen. */
function DispatchedStamp({ on }: { on: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!on) {
      t.value = 0;
      return;
    }
    t.value = withSequence(withTiming(1, { duration: 170, easing: easings.in }), withSpring(1, springs.bounce));
  }, [on, t]);

  const a = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ rotate: '-13deg' }, { scale: 2.4 - 1.4 * t.value }],
  }));

  if (!on) return null;
  return (
    <View style={styles.stampWrap} pointerEvents="none">
      <Animated.View style={[styles.stamp, a]}>
        <Text variant="h2" color={palette.engineRed} center style={styles.stampText}>
          DISPATCHED
        </Text>
      </Animated.View>
    </View>
  );
}

export interface MissionSlipProps {
  mission: MissionDef;
  /** stagger index for the entrance */
  index?: number;
  /** best stars the child has earned on this mission */
  stars?: Stars;
  locked?: boolean;
  /** e.g. "Complete Bakery Bell first" */
  lockLabel?: string;
  /** show the DISPATCHED stamp (the parent navigates once it lands) */
  dispatched?: boolean;
  onPress?: () => void;
}

export function MissionSlip({ mission, index = 0, stars = 0, locked, lockLabel, dispatched, onPress }: MissionSlipProps) {
  const press = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.025 }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * stagger.card)
        .springify()
        .damping(15)}
      style={a}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          locked ? `${mission.title}. Locked. ${lockLabel ?? ''}` : `${mission.title}. ${mission.tagline}`
        }
        accessibilityState={{ disabled: !!locked }}
        disabled={locked || dispatched}
        onPressIn={() => {
          press.value = withSpring(1, springs.pop);
        }}
        onPressOut={() => {
          press.value = withSpring(0, springs.pop);
        }}
        onPress={onPress}
        style={[styles.card, shadows.card, locked && styles.cardLocked]}
      >
        <View>
          <SceneThumb scene={mission.scene} width={112} height={92} style={locked ? styles.thumbLocked : undefined} />
          {locked ? (
            <View style={styles.lockBadge}>
              <LockIcon size={26} color={palette.white} />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text variant="h2" numberOfLines={2} color={locked ? palette.slate : palette.navy}>
            {mission.title}
          </Text>
          <Text variant="small" color={locked ? palette.slate : palette.navySoft} numberOfLines={2} style={styles.tagline}>
            {locked ? (lockLabel ?? 'Finish an earlier mission first') : mission.tagline}
          </Text>
          {!locked ? (
            <View style={styles.pills}>
              {mission.subjects.slice(0, 3).map((s) => (
                <SubjectPill key={s} subject={s} small />
              ))}
            </View>
          ) : null}
          {!locked && stars > 0 ? <EarnedStars stars={stars} /> : null}
        </View>

        <GoChevron dim={locked} />
        <DispatchedStamp on={!!dispatched} />
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
    minHeight: hit.big + 34,
    overflow: 'hidden',
  },
  cardLocked: { backgroundColor: '#F2F4FA' },
  thumbLocked: { opacity: 0.55 },
  lockBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.slate,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.white,
  },
  body: { flex: 1, gap: 3, paddingVertical: 2 },
  tagline: { marginTop: -1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  stars: { flexDirection: 'row', gap: 3, marginTop: 2 },
  chevron: { width: 54, alignItems: 'center', justifyContent: 'center' },
  stampWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    borderWidth: 5,
    borderColor: palette.engineRed,
    borderRadius: radii.tag,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  stampText: { letterSpacing: 2 },
});
