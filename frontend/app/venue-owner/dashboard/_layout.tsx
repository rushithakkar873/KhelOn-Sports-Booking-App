import React from 'react';
import { Stack } from 'expo-router';

export default function VenueOwnerDashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="venues" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}