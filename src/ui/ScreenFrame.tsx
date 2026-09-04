import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkyBackground, type SkyMood } from './SkyBackground';

export interface ScreenFrameProps {
  mood?: SkyMood;
  /** world layers drawn over the sky but under content (clouds, hills, buildings) */
  backdrop?: React.ReactNode;
  /** absolutely-positioned chrome (TopBar etc.) */
  chrome?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** pad content below the status bar (default true) */
  safeTop?: boolean;
  safeBottom?: boolean;
}

/** Every screen: sky → backdrop → content → chrome. */
export function ScreenFrame({ mood = 'day', backdrop, chrome, children, style, safeTop = true, safeBottom = true }: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <SkyBackground mood={mood}>{backdrop}</SkyBackground>
      <View
        style={[
          styles.content,
          { paddingTop: safeTop ? insets.top : 0, paddingBottom: safeBottom ? insets.bottom : 0 },
          style,
        ]}
        pointerEvents="box-none"
      >
        {children}
      </View>
      {chrome}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
});
