import React from 'react';
import { Stack } from 'expo-router';

export default function VenueOwnerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Venue Owner Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register as Venue Owner',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="dashboard" 
        options={{ 
          title: 'Dashboard',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}