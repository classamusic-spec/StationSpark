import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { hit, palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';
import { useCountUp } from '@/hooks';

/**
 * LOCAL FALLBACKS — plain, on-brand versions of pieces the UI kit will grow
 * (ProgressBar / Toggle / SegmentedPills). Swap the imports when `@/ui`
 * exports them; the props here are deliberately the obvious ones.
 */

export function ProgressBar({
  value,
  height = 20,
  tone = palette.leafGreen,
  track = '#E2E7F2',
  style,
}: {
  /** 0..1 */
  value: number;
  height?: number;
  tone?: string;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(Math.max(0, Math.min(1, value)), timings.slow);
  }, [t, value]);
  const fill = useAnimatedStyle(() => ({ width: `${t.value * 100}%` }));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: tone }, fill]}>
        <View style={[styles.sheen, { borderRadius: height / 2 }]} />
      </Animated.View>
    </View>
  );
}

/** XP bar with the "Level n → next" framing from the progress reference. */
export function XpBar({ into, span, t }: { into: number; span: number; t: number }) {
  return (
    <View style={styles.xpWrap}>
      <ProgressBar value={t} height={22} />
      <Text variant="small" color={palette.navySoft}>
        {span > 0 ? `${into} / ${span} XP` : 'Top rank reached!'}
      </Text>
    </View>
  );
}

export function Toggle({ value, onChange, label, accessibilityHint }: { value: boolean; onChange: (v: boolean) => void; label: string; accessibilityHint?: string }) {
  const t = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    t.value = withSpring(value ? 1 : 0, springs.pop);
  }, [t, value]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * 28 }] }));
  const track = useAnimatedStyle(() => ({ backgroundColor: t.value > 0.5 ? palette.leafGreen : palette.slateLight }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        sfx.play('tap');
        haptics.select();
        onChange(!value);
      }}
      style={styles.toggleRow}
      hitSlop={8}
    >
      <Text variant="body">{label}</Text>
      <Animated.View style={[styles.toggleTrack, track]}>
        <Animated.View style={[styles.toggleKnob, shadows.soft, knob]} />
      </Animated.View>
    </Pressable>
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function SegmentedPills<T extends string>({
  options,
  value,
  onChange,
  tone = palette.engineRed,
  style,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  tone?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segments, style]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => {
              sfx.play('tap');
              haptics.select();
              onChange(o.value);
            }}
            style={[styles.segment, active && { backgroundColor: tone }]}
            hitSlop={4}
          >
            <Text variant="buttonSmall" color={active ? palette.white : palette.navySoft} center numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Round colour swatch used by the Garage and the Locker. */
export function Swatch({ color, active, onPress, label, size = hit.min }: { color: string; active: boolean; onPress: () => void; label: string; size?: number }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPressIn={() => {
        scale.value = withSpring(0.9, springs.pop);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.bounce);
      }}
      onPress={() => {
        sfx.play('tap');
        haptics.select();
        onPress();
      }}
      hitSlop={6}
    >
      <Animated.View
        style={[
          styles.swatch,
          shadows.soft,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color, borderColor: active ? palette.navy : 'rgba(255,255,255,0.85)' },
          style,
        ]}
      >
        {active ? <View style={styles.swatchDot} /> : null}
      </Animated.View>
    </Pressable>
  );
}

/** One of the four counting tiles on the progress screen. */
export function StatTile({ value, label, color, glyph, delayMs = 0 }: { value: number; label: string; color: string; glyph: React.ReactNode; delayMs?: number }) {
  const shown = useCountUp(value, { delayMs });
  return (
    <View style={[styles.stat, shadows.soft]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>{glyph}</View>
      <View style={styles.statText}>
        <Text variant="h2" color={palette.navy}>
          {shown}
        </Text>
        <Text variant="small" color={palette.navySoft}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: '100%' },
  sheen: { position: 'absolute', left: 0, right: 0, top: 0, height: '42%', backgroundColor: 'rgba(255,255,255,0.3)' },
  xpWrap: { gap: 6, alignSelf: 'stretch' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: hit.min, gap: spacing.md },
  toggleTrack: { width: 62, height: 34, borderRadius: 17, padding: 3, justifyContent: 'center' },
  toggleKnob: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.white },
  segments: {
    flexDirection: 'row',
    backgroundColor: '#EDF0F7',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, minHeight: 46, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  swatch: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  swatchDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.9)' },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 84,
  },
  statIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statText: { flexShrink: 1 },
});
