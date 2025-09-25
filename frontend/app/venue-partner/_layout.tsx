import React from 'react';
import { Stack } from 'expo-router';

export default function VenuePartnerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Venue Partner Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register as Venue Partner',
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