import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { usePulse } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Text } from '../Text';
import { SpeakerIcon } from '../icons';

const LCD_BG = '#0E2A1C';
const LCD_TEXT = '#5BF08F';

export type SpanishSupport = 'full' | 'some' | 'min';

export interface RadioCardProps {
  /** the Spanish line — always shown on the green display */
  es: string;
  /** the English line */
  en?: string;
  /**
   * full → Spanish on the display, English underneath at full size
   * some → Spanish on the display, English smaller
   * min  → Spanish only, English behind a tap-to-reveal chip
   */
  support?: SpanishSupport;
  /** speaker label ("Beacon", "Rosa") shown on the radio body */
  from?: string;
  /** override what the speaker button does */
  onSpeak?: () => void;
  /** auto-say when the card appears */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The bilingual radio: a dark navy handset panel with a green LCD line.
 * Tapping the speaker replays the Spanish in es-MX (and the English after it
 * when both are known) — the child hears the pair, never just reads it.
 */
export function RadioCard({ es, en, support = 'full', from, onSpeak, compact = false, style }: RadioCardProps) {
  const [revealed, setRevealed] = useState(false);
  const led = usePulse(1800, 0.8);
  const ledStyle = useAnimatedStyle(() => ({ opacity: 0.45 + led.value * 0.55 }));

  const speak = useCallback(() => {
    sfx.play('radio');
    haptics.tap();
    if (onSpeak) return onSpeak();
    if (en) speech.sayWord({ en, es }, 'es');
    else speech.say(es, { speaker: 'beacon', lang: 'es' });
  }, [en, es, onSpeak]);

  const showEnglish = en && (support === 'full' || support === 'some' || revealed);

  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.card, shadows.card, compact && styles.compact, style]}>
      <View style={styles.head}>
        <View style={styles.grille}>
          <Svg width={26} height={12} viewBox="0 0 26 12">
            {[0, 1, 2].map((r) => (
              <Rect key={r} x={0} y={r * 4.5} width={26} height={2.4} rx={1.2} fill="rgba(255,255,255,0.28)" />
            ))}
          </Svg>
        </View>
        <Text variant="tiny" color="rgba(255,255,255,0.72)" style={styles.title}>
          {from ? `RADIO · ${from.toUpperCase()}` : 'RADIO · ES-MX'}
        </Text>
        <Animated.View style={ledStyle}>
          <Svg width={12} height={12} viewBox="0 0 12 12">
            <Circle cx={6} cy={6} r={5} fill={palette.engineRed} />
            <Circle cx={4.6} cy={4.4} r={1.6} fill="#FF9E93" />
          </Svg>
        </Animated.View>
      </View>

      <View style={styles.row}>
        <View style={styles.lcd}>
          <Text variant={compact ? 'small' : 'bodyStrong'} color={LCD_TEXT} style={styles.lcdText}>
            {es}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Hear ${es} in Spanish`}
          onPress={speak}
          hitSlop={8}
          style={({ pressed }) => [styles.speaker, pressed && styles.speakerPressed]}
        >
          <SpeakerIcon size={26} color={palette.white} />
        </Pressable>
      </View>

      {showEnglish ? (
        <Text variant={support === 'some' ? 'small' : 'body'} color="rgba(255,255,255,0.86)" style={styles.en}>
          {en}
        </Text>
      ) : en ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show the English"
          onPress={() => {
            sfx.play('tap-soft');
            haptics.select();
            setRevealed(true);
          }}
          hitSlop={10}
          style={styles.reveal}
        >
          <Text variant="tiny" color={palette.white}>
            Tap for English
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.charcoalDark,
    borderRadius: radii.card,
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.xs,
  },
  compact: { padding: spacing.xs + 2, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  grille: { opacity: 0.9 },
  title: { flex: 1, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  lcd: {
    flex: 1,
    backgroundColor: LCD_BG,
    borderRadius: radii.tag,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(91,240,143,0.22)',
    minHeight: 44,
    justifyContent: 'center',
  },
  lcdText: { letterSpacing: 0.6 },
  speaker: {
    width: hit.min,
    height: hit.min,
    borderRadius: hit.min / 2,
    backgroundColor: palette.waterCyanDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  speakerPressed: { transform: [{ scale: 0.92 }], backgroundColor: palette.waterCyan },
  en: { paddingHorizontal: 4 },
  reveal: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
});
