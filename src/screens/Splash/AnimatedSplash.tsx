import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, springs } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { Logo } from '@/ui';

export interface AnimatedSplashProps {
  /**
   * True once the app underneath is ready to be shown (fonts + Skia loaded).
   * The splash still enforces a minimum on-screen time so the intro always
   * reads, even when the build loads instantly.
   */
  active: boolean;
  /** called once the splash has fully faded away */
  onFinished: () => void;
}

/** Smallest time the splash stays up, so the logo intro is never a flash. */
const MIN_ON_SCREEN_MS = 1500;
const FADE_MS = 460;

/**
 * The first thing a child sees: the Station Spark badge springing onto a warm
 * sky, its flame already alive, three dots counting the last of the load.
 *
 * It leans on nothing that has to load first — the wordmark is the authored
 * SVG art, not a font — so it can paint the instant the JS starts, cover the
 * plain native splash, and hand off to the app the moment it is ready.
 */
export function AnimatedSplash({ active, onFinished }: AnimatedSplashProps) {
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const logoSize = Math.min(300, width * 0.72);
  const mountedAt = useRef(0);
  const fade = useSharedValue(1);
  const enter = useSharedValue(0);
  const glow = useSharedValue(0.5);

  /* Stamp the mount time once, off the render path (Date.now is impure). */
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  /* Intro: the badge drops in and settles, and a soft halo begins to breathe. */
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = withDelay(90, withSpring(1, springs.bounce));
    glow.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(glow);
  }, [enter, glow, reduced]);

  /* Hold for the minimum, then fade to reveal the app. */
  useEffect(() => {
    if (!active) return;
    const wait = Math.max(0, MIN_ON_SCREEN_MS - (Date.now() - mountedAt.current));
    const timer = setTimeout(() => {
      fade.value = withTiming(0, { duration: FADE_MS, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(onFinished)();
      });
    }, wait);
    return () => clearTimeout(timer);
  }, [active, fade, onFinished]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: (1 - enter.value) * 26 },
      { scale: 0.82 + enter.value * 0.18 },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.4,
    transform: [{ scale: 0.9 + glow.value * 0.16 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, rootStyle]} pointerEvents="none">
      <LinearGradient
        colors={[palette.skyTop, palette.skyMid, palette.waterCyanLight]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <Animated.View style={logoStyle}>
            <Logo size={logoSize} />
          </Animated.View>
        </View>
      </View>

      <View style={styles.dots}>
        <Dot delay={0} on={!active && !reduced} />
        <Dot delay={140} on={!active && !reduced} />
        <Dot delay={280} on={!active && !reduced} />
      </View>
    </Animated.View>
  );
}

/** One bouncing load dot. Rests still (dimmed) when the app is already ready. */
function Dot({ delay, on }: { delay: number; on: boolean }) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!on) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 200 });
      return;
    }
    v.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) })), -1, false),
    );
    return () => cancelAnimation(v);
  }, [delay, on, v]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.45 + v.value * 0.55,
    transform: [{ translateY: -v.value * 9 }, { scale: 0.9 + v.value * 0.2 }],
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', zIndex: 100, backgroundColor: palette.skyTop },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: '86%',
    height: '86%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,199,44,0.55)',
  },
  dots: { position: 'absolute', bottom: 84, flexDirection: 'row', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: palette.white },
});
