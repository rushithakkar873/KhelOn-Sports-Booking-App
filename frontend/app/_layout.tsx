import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        {/* COMMENTED OUT PLAYER SCREENS FOR VENUE PARTNER APP */}
        {/* <Stack.Screen name="main" /> */}
        <Stack.Screen name="venue-partner" />
      </Stack>
    </SafeAreaProvider>
  );
}