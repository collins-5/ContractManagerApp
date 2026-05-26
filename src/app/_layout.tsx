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
        animation: 'slide_from_right',
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="client/*" />
      <Stack.Screen name="project/*" />
      <Stack.Screen name="payment/*" />
      <Stack.Screen name="worker/*" />
      <Stack.Screen name="engineer/*" />
    </Stack>
  );
}