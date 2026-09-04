import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MissionRoute } from '@/screens/Mission/MissionRoute';

export default function Mission() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MissionRoute id={typeof id === 'string' ? id : ''} />;
}
