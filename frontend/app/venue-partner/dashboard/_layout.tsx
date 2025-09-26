import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import VenuePartnerBottomNavigation from '../../../components/VenuePartnerBottomNavigation';

export default function VenueOwnerDashboardLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f6f7' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="venues" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="profile" />
      </Stack>
      
      {/* Fixed Bottom Navigation - Won't re-render on screen changes */}
      <VenueOwnerBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
});