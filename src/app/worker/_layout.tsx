import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientLayout() {
  return (
    <>
      <StatusBar barStyle={"light-content"} backgroundColor="#2C4A6E" />
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F2F2F7' }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="add"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaView>
    </>
  );
}