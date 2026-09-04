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
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** On web, Skia needs CanvasKit (wasm) loaded before any <Canvas/> renders. */
function useSkiaWeb() {
  const [ready, setReady] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    (async () => {
      try {
        const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
        await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
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
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const skiaReady = useSkiaWeb();
  const settings = useGame((s) => s.settings);

  useEffect(() => {
    sfx.setEnabled(settings.sfx);
    haptics.setEnabled(settings.haptics);
    speech.setEnabled(settings.voice);
  }, [settings.sfx, settings.haptics, settings.voice]);

  useEffect(() => {
    if (fontsLoaded && skiaReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, skiaReady]);

  if (!fontsLoaded || !skiaReady) {
    return <View style={{ flex: 1, backgroundColor: palette.skyTop }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: palette.skyTop },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
