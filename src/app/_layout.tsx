import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '@/database/database';
import '../../global.css';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="client" />
      <Stack.Screen name="worker" />
      <Stack.Screen name="engineer" />
      <Stack.Screen name="project" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}