import React from 'react';
import { AnimatedSplash } from '@/screens/Splash/AnimatedSplash';

/** Dev-only: holds the splash open (active=false) so it can be inspected. */
export default function SplashPreview() {
  return <AnimatedSplash active={false} onFinished={() => {}} />;
}
