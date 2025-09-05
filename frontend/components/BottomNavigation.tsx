import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface BottomNavigationProps {
  currentRoute?: string;
}

export default function BottomNavigation({ currentRoute }: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveRoute = () => {
    if (currentRoute) return currentRoute;
    if (pathname.includes('/home')) return 'home';
    if (pathname.includes('/venues')) return 'venues';
    if (pathname.includes('/tournaments')) return 'tournaments';
    if (pathname.includes('/bookings')) return 'bookings';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  const activeRoute = getActiveRoute();

  const navItems = [
    { key: 'home', icon: 'home', route: '/main/home' },
    { key: 'venues', icon: 'location', route: '/main/venues' },
    { key: 'tournaments', icon: 'trophy', route: '/main/tournaments' },
    { key: 'bookings', icon: 'calendar', route: '/main/bookings' },
    { key: 'profile', icon: 'person', route: '/main/profile' },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              activeRoute === item.key && styles.navItemActive
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons 
              name={activeRoute === item.key ? item.icon as any : `${item.icon}-outline` as any} 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#212529',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    padding: 8,
    opacity: 0.6,
  },
  navItemActive: {
    opacity: 1,
  },
});