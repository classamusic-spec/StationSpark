import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { durations, palette, radii, shadows, spacing, springs, stagger, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { badgeById } from '@/content/badges';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { SubjectPill } from '@/ui/SubjectPill';
import { StarRow } from '@/ui/kit/StarRow';
import { BadgeArt } from '@/ui/kit/BadgeArt';
import { ConfettiBurst } from '@/ui/kit/ConfettiBurst';
import { Counter } from '@/ui/kit/Counter';
import { GlyphIcon } from '@/ui/kit/GlyphIcon';
import { Beacon, type BeaconHandle } from './Beacon';
import { Pepper } from './Pepper';
import { Rookie } from './Rookie';
import type { CelebrationOverlayProps } from './types';

const CREW_HEIGHT = 128;
const BADGE_SIZE = 104;
/** Jest never touches `@/three` (see docs/THREE.md), so don't even try there. */
const USE_BADGE_3D = process.env.NODE_ENV !== 'test';

/**
 * The badge arrives as a real medal.
 *
 * `@/three` is pulled in lazily and behind a boundary: it is the only place in
 * the app that wants a WebGL context, Jest never loads it, and if the import or
 * the GL context fails for any reason the child still gets the SVG badge doing
 * its own flip. Earning a badge can never be the thing that breaks.
 */
const LazyBadge3D = lazy(async () => {
  const mod = await import('@/three');
  return { default: mod.Badge3D };
});

/** Never let a decoration take the celebration down. */
class BadgeBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The 2D badge, flipping on its Y axis — the fallback, and the reduced-motion path. */
function BadgeFlipSvg({ color, icon }: { color: string; icon: string }) {
  const flip = useSharedValue(180);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      flip.value = 0;
      return;
    }
    flip.value = 180;
    flip.value = withDelay(600, withSpring(0, springs.gentle));
  }, [flip, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: flip.value > 92 ? 0 : 1,
    transform: [{ perspective: 800 }, { rotateY: `${flip.value}deg` }, { scale: 1 - Math.abs(flip.value) / 900 }],
  }));

  return (
    <Animated.View style={style}>
      <BadgeArt color={color} icon={icon} size={BADGE_SIZE} />
    </Animated.View>
  );
}

function BadgeFlip({ badge, play }: { badge: NonNullable<CelebrationOverlayProps['badge']>; play: number }) {
  const def = badgeById(badge);
  const svg = <BadgeFlipSvg color={def.color} icon={def.icon} />;

  return (
    <View style={styles.badgeBlock}>
      {USE_BADGE_3D ? (
        <BadgeBoundary fallback={svg}>
          <Suspense fallback={svg}>
            <LazyBadge3D color={def.color} icon={def.icon} size={BADGE_SIZE} flipKey={play} />
          </Suspense>
        </BadgeBoundary>
      ) : (
        svg
      )}
      <Animated.View entering={FadeInDown.delay(880).springify().damping(14)} style={styles.badgeName}>
        <Text variant="tiny" color={palette.navyMuted} center>
          BADGE EARNED
        </Text>
        <Text variant="h3" center>
          {def.name}
        </Text>
      </Animated.View>
    </View>
  );
}

/**
 * The end of a mission: dimmed sky, brand confetti, a title that pops, stars
 * that land one by one, the badge flipping in, XP and Sparks counting up, a
 * recap of what was practised — and the crew cheering along the bottom.
 */
export function CelebrationOverlay({
  visible,
  title,
  subtitle,
  stars,
  badge,
  xp,
  sparks,
  subjects,
  ctaLabel = 'Continue',
  onNext,
}: CelebrationOverlayProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const beacon = useRef<BeaconHandle>(null);
  const [play, setPlay] = useState(0);
  const titleScale = useSharedValue(0.4);

  useEffect(() => {
    if (!visible) return;
    // bump the burst key on the next frame so the confetti re-fires per reveal
    const burstFrame = requestAnimationFrame(() => setPlay((n) => n + 1));
    sfx.play('fanfare');
    haptics.celebrate();
    const confettiTimer = setTimeout(() => sfx.play('confetti'), 340);
    const spinTimer = setTimeout(() => beacon.current?.spin(), 500);

    titleScale.value = 0.4;
    titleScale.value = reduced
      ? withTiming(1, timings.fast)
      : withDelay(140, withSequence(withSpring(1.08, springs.bounce), withSpring(1, springs.pop)));

    return () => {
      cancelAnimationFrame(burstFrame);
      clearTimeout(confettiTimer);
      clearTimeout(spinTimer);
    };
  }, [reduced, titleScale, visible]);

  const titleStyle = useAnimatedStyle(() => ({ transform: [{ scale: titleScale.value }] }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <ConfettiBurst play={play} count={52} durationMs={2500} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: CREW_HEIGHT + insets.bottom + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify().damping(15)} style={[styles.card, shadows.card]}>
          <Animated.View style={titleStyle}>
            <Text variant="display" center>
              {title}
            </Text>
          </Animated.View>

          {subtitle ? (
            <Animated.View entering={FadeIn.delay(280)}>
              <Text variant="body" center color={palette.navySoft}>
                {subtitle}
              </Text>
            </Animated.View>
          ) : null}

          {stars !== undefined ? (
            <View style={styles.stars}>
              <StarRow stars={stars} size={48} animate />
            </View>
          ) : null}

          {badge ? <BadgeFlip badge={badge} play={play} /> : null}

          {xp !== undefined || sparks !== undefined ? (
            <Animated.View entering={FadeIn.delay(760)} style={styles.rewards}>
              {xp !== undefined ? (
                <View style={styles.reward}>
                  <Counter value={xp} prefix="+" suffix=" XP" variant="numeral" color={palette.goldDark} delayMs={820} durationMs={durations.cinematic} />
                  <Text variant="tiny" color={palette.navyMuted}>
                    EXPERIENCE
                  </Text>
                </View>
              ) : null}
              {sparks !== undefined ? (
                <View style={styles.reward}>
                  <View style={styles.rewardMark}>
                    <GlyphIcon id="spark" size={26} label="sparks" />
                    <Counter value={sparks} prefix="+" variant="numeral" color={palette.purple} delayMs={980} durationMs={durations.cinematic} />
                  </View>
                  <Text variant="tiny" color={palette.navyMuted}>
                    SPARKS
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          ) : null}

          {subjects && subjects.length ? (
            <View style={styles.recap}>
              <Text variant="tiny" color={palette.navyMuted} center>
                YOU PRACTISED
              </Text>
              <View style={styles.pills}>
                {subjects.map((s, i) => (
                  <Animated.View key={s} entering={FadeInDown.delay(1100 + i * stagger.tile).springify().damping(13)}>
                    <SubjectPill subject={s} small />
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(1240).springify().damping(15)} style={styles.cta}>
            <Button label={ctaLabel} tone="green" size="lg" block glow onPress={onNext} sound="pop" />
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* the crew, cheering along the bottom */}
      <View pointerEvents="none" style={[styles.crew, { bottom: insets.bottom }]}>
        <Rookie size={CREW_HEIGHT} pose="cheer" emotion="excited" jumping bobPhase={0} />
        <Beacon ref={beacon} size={CREW_HEIGHT * 0.86} emotion="excited" bobPhase={1.1} />
        <Pepper size={CREW_HEIGHT * 0.78} emotion="excited" wag jumping bobPhase={2.2} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(31,42,90,0.42)', zIndex: 80 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 440,
  },
  stars: { marginTop: 2 },
  badgeBlock: { alignItems: 'center', gap: 2, marginTop: spacing.xs },
  badgeName: { alignItems: 'center', gap: 0 },
  rewards: { flexDirection: 'row', gap: spacing.xl, justifyContent: 'center', marginTop: spacing.xs },
  reward: { alignItems: 'center' },
  rewardMark: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recap: { alignItems: 'center', gap: 6, marginTop: spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  cta: { alignSelf: 'stretch', marginTop: spacing.sm },
  crew: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
