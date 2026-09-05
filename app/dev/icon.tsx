import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { Logo } from '@/ui';
import { palette } from '@/theme';

/**
 * Dev-only route used to render the app icon / splash / favicon from the real
 * logo component (tools/qa/icons.mjs screenshots it at 1024×1024).
 *   /dev/icon?variant=icon        opaque sky→cyan ground, logo centred
 *   /dev/icon?variant=foreground  transparent, logo at 62 % (Android adaptive)
 *   /dev/icon?variant=splash      transparent, logo at 70 %
 *   /dev/icon?variant=favicon     opaque, tight logo
 */
export default function IconRoute() {
  const { variant = 'icon' } = useLocalSearchParams<{ variant?: string }>();
  const transparent = variant === 'foreground' || variant === 'splash';
  const scale = variant === 'foreground' ? 0.62 : variant === 'splash' ? 0.7 : variant === 'favicon' ? 0.98 : 0.86;
  return (
    <View style={[styles.root, transparent && styles.transparent]}>
      {!transparent ? (
        <LinearGradient colors={[palette.skyTop, palette.skyMid, palette.waterCyanLight]} style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[styles.center, { transform: [{ scale }] }]}>
        <Logo size={1000} tagline={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 1024, height: 1024, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: palette.skyTop },
  transparent: { backgroundColor: 'transparent' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
