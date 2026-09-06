import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { palette } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { loadSkia } from '@/services/skiaWeb';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { AnimatedSplash } from '@/screens/Splash/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** On web, Skia needs CanvasKit (wasm) loaded before any <Canvas/> renders. */
function useSkiaWeb() {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    (async () => {
      try {
        await loadSkia();
      } catch (e) {
        console.warn('Skia web failed to load; Skia canvases will not render.', e);
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const skiaReady = useSkiaWeb();
  const settings = useGame((s) => s.settings);
  const [splashGone, setSplashGone] = useState(false);
  /*
   * A font that fails to load must not trap the child on the splash screen
   * forever. `useFonts` reports the failure and then never flips `loaded`, so
   * discarding the error meant one bad download = an app that never starts.
   * Ugly type is better than no app: carry on with the system face.
   */
  useEffect(() => {
    if (fontError) console.warn('Fonts failed to load; falling back to the system face.', fontError);
  }, [fontError]);
  const ready = (fontsLoaded || !!fontError) && skiaReady;

  useEffect(() => {
    sfx.setEnabled(settings.sfx);
    haptics.setEnabled(settings.haptics);
    speech.setEnabled(settings.voice);
  }, [settings.sfx, settings.haptics, settings.voice]);

  /*
   * Hand the native splash straight to our animated one: hide the OS splash on
   * first paint so the child never sees the plain launch screen flash before
   * the badge springs in.
   */
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/* The app mounts only once fonts and Skia are ready — a Skia canvas
            rendered before CanvasKit lands would warn — and the splash covers
            the gap until then. */}
        {ready ? (
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: palette.skyTop },
            }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: palette.skyTop }} />
        )}
        {!splashGone ? <AnimatedSplash active={ready} onFinished={() => setSplashGone(true)} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
