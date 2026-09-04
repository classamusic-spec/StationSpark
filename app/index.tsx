import React from 'react';
import { View } from 'react-native';
import { Button, Logo, ScreenFrame, Text } from '@/ui';

/** Placeholder — replaced by the Firehouse home screen (src/screens/FirehouseScreen). */
export default function Index() {
  return (
    <ScreenFrame>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Logo size={260} />
        <Text variant="h2" center>
          The station is being built…
        </Text>
        <Button label="Start Shift" size="xl" />
      </View>
    </ScreenFrame>
  );
}
