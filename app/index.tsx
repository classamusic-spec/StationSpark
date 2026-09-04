import React from 'react';
import { Redirect } from 'expo-router';
import { useGame } from '@/state/store';
import { FirehouseScreen } from '@/screens/Firehouse/FirehouseScreen';

/** The Firehouse home. First run goes through onboarding. */
export default function Index() {
  const onboarded = useGame((s) => s.profile.onboarded);
  const hydrated = useGame((s) => s.hydrated);
  if (hydrated && !onboarded) return <Redirect href="/onboarding" />;
  return <FirehouseScreen />;
}
