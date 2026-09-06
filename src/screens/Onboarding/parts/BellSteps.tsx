/**
 * BELL STEPS — the three-step progress indicator drawn as three station
 * bells on a rail: rung (gold with a tick), ringing now (gold, swaying, in a
 * glow) and still to come (pale). Never a dot row.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows } from '@/theme';
import { usePulse } from '@/hooks';
import { CheckIcon } from '@/ui';
import { HIGHLIGHT, SHADE } from '@/world/tone';

const SIZE = 34;

function BellShape({ tone }: { tone: 'done' | 'now' | 'next' }) {
  const body = tone === 'next' ? palette.slateLight : palette.safetyYellow;
  const shade = tone === 'next' ? '#AEB6CC' : palette.goldDark;
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 48 48" pointerEvents="none">
      <Ellipse cx={24} cy={45} rx={12} ry={2.6} fill={palette.navy} opacity={0.12} />
      <Rect x={21} y={2} width={6} height={7} rx={3} fill={shade} />
      <Path d="M 24 8 C 34 8 39 17 39 28 L 40 33 L 8 33 L 9 28 C 9 17 14 8 24 8 Z" fill={body} />
      <Path d="M 31 10 C 37 14 39 21 39 28 L 40 33 L 30 33 C 33 26 33 16 31 10 Z" fill={SHADE} />
      <Path d="M 17 12 C 14 17 13 23 13 28" stroke={HIGHLIGHT} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={6} y={32} width={36} height={6} rx={3} fill={shade} />
      <Ellipse cx={24} cy={41} rx={4.6} ry={5} fill={shade} />
    </Svg>
  );
}

/** The bell that is ringing now: it sways from its crown inside a soft glow. */
function RingingBell() {
  const sway = usePulse(1300, 0.5);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -SIZE / 2 }, { rotate: `${(sway.value - 0.5) * 16}deg` }, { translateY: SIZE / 2 }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.5 + sway.value * 0.4, transform: [{ scale: 0.95 + sway.value * 0.1 }] }));
  return (
    <View style={styles.bellWell}>
      <Animated.View pointerEvents="none" style={[styles.glow, shadows.glowGold, glowStyle]} />
      <Animated.View style={style}>
        <BellShape tone="now" />
      </Animated.View>
    </View>
  );
}

export interface BellStepsProps {
  step: number;
  total: number;
}

export function BellSteps({ step, total }: BellStepsProps) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: total, now: step + 1 }} accessibilityLabel={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const tone: 'done' | 'now' | 'next' = i < step ? 'done' : i === step ? 'now' : 'next';
        return (
          <React.Fragment key={i}>
            {i > 0 ? <View style={[styles.rail, i <= step && styles.railDone]} /> : null}
            <View style={styles.stepCol}>
              {tone === 'now' ? (
                <RingingBell />
              ) : (
                <View style={styles.bellWell}>
                  <BellShape tone={tone} />
                  {tone === 'done' ? (
                    <View style={styles.tick}>
                      <CheckIcon size={13} color={palette.white} />
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  stepCol: { alignItems: 'center' },
  bellWell: { width: SIZE + 16, height: SIZE + 12, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', left: 2, right: 2, top: 0, bottom: 0, borderRadius: radii.pill, backgroundColor: 'rgba(255,199,44,0.5)' },
  rail: { width: 44, height: 5, borderRadius: 3, backgroundColor: palette.slateLight },
  railDone: { backgroundColor: palette.gold },
  tick: { position: 'absolute', right: 2, bottom: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: palette.leafGreen, alignItems: 'center', justifyContent: 'center' },
});
