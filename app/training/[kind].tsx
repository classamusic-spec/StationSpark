import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TrainingPlayScreen } from '@/screens/Training/TrainingPlayScreen';

export default function TrainingPlay() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return <TrainingPlayScreen kind={typeof kind === 'string' ? kind : ''} />;
}
