import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { palette, radii, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { BadgeArt, Text } from '@/ui';
import { mix } from '@/characters/rig/palettes';
import { SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

/**
 * PUSH PIN — the one pin every board in the station uses (consistency rule
 * 10: one motif per job). A round head with its shade and one highlight, a
 * short steel needle, and the tiny shadow the head throws onto the cork.
 */
export const PushPin = memo(function PushPin({ color = palette.engineRed, size = 22 }: { color?: string; size?: number }) {
  const shade = mix(color, palette.navy, 0.28);
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 22 26" pointerEvents="none">
      <Ellipse cx={11} cy={23.4} rx={5.5} ry={1.5} fill={SHADOW_FILL} opacity={0.16} />
      <Path d="M 11 13 L 11 23" stroke={palette.slate} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={11} cy={9.4} r={8.2} fill={shade} />
      <Circle cx={11} cy={8.4} r={7.6} fill={color} />
      <Circle cx={8.2} cy={5.8} r={2.6} fill="#FFFFFF" opacity={0.42} />
    </Svg>
  );
});

export interface BadgeShieldProps {
  name: string;
  color: string;
  icon: string;
  earned: boolean;
  size?: number;
  index?: number;
  onPress?: () => void;
}

/**
 * One badge pinned to the station board: THE kit shield (`BadgeArt` — one
 * silhouette for every badge in the app), a push pin through its top, the
 * soft shadow it throws on the cork, and a cream name plaque underneath.
 *
 * A badge that is not earned yet keeps its own hue at low saturation and its
 * own name on the plaque (art critique: "vary the label") — it reads as
 * "coming soon", never as "you failed".
 */
export function BadgeShield({ name, color, icon, earned, size = 84, index = 0, onPress }: BadgeShieldProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const height = size * 1.12;
  const pin = Math.max(16, Math.round(size * 0.24));
  const lift = Math.round(pin * 0.5);
  const shadowRx = size * 0.36;

  return (
    <Animated.View entering={ZoomIn.delay(index * stagger.tile).springify().damping(13)} style={[styles.wrap, { width: size + 12 }]}>
      <Animated.View style={style}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={earned ? `${name}, earned` : `${name}, not earned yet`}
          onPressIn={() => {
            scale.value = withSpring(0.92, springs.pop);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, springs.bounce);
          }}
          onPress={() => {
            sfx.play(earned ? 'pop' : 'tap-soft');
            haptics.tap();
            onPress?.();
          }}
          style={styles.press}
          hitSlop={6}
        >
          <View style={[styles.shield, { width: size, height: height + lift, paddingTop: lift }]}>
            {/* the shadow the shield throws onto the board (rule 3) */}
            <View style={[styles.shadow, { width: size, height: shadowRy(shadowRx) * 2 + 4, bottom: -2 }]} pointerEvents="none">
              <Svg width={size} height={shadowRy(shadowRx) * 2 + 4} viewBox={`0 0 ${size} ${shadowRy(shadowRx) * 2 + 4}`}>
                <Ellipse cx={size / 2} cy={shadowRy(shadowRx) + 2} rx={shadowRx} ry={shadowRy(shadowRx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
              </Svg>
            </View>
            <BadgeArt color={color} icon={icon} size={size} locked={!earned} />
            <View style={[styles.pin, { top: 0 }]} pointerEvents="none">
              <PushPin color={earned ? palette.engineRed : palette.slate} size={pin} />
            </View>
          </View>
          <View style={[styles.plaque, earned ? styles.plaqueOn : styles.plaqueOff, { maxWidth: size + 12 }]}>
            <Text variant="tiny" color={earned ? palette.navy : palette.navyMuted} center>
              {name}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  press: { alignItems: 'center' },
  shield: { alignItems: 'center', justifyContent: 'flex-start' },
  shadow: { position: 'absolute', left: 0 },
  pin: { position: 'absolute', alignSelf: 'center' },
  plaque: { marginTop: -4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.tag },
  plaqueOn: { backgroundColor: palette.creamDeep },
  plaqueOff: { backgroundColor: '#EEF1F7' },
});
