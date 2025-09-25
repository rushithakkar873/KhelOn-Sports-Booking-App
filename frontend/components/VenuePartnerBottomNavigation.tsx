import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface VenuePartnerBottomNavigationProps {
  currentRoute?: string;
}

function VenuePartnerBottomNavigation({ currentRoute }: VenuePartnerBottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveRoute = () => {
    if (currentRoute) return currentRoute;
    if (pathname.includes('/dashboard/index') || pathname === '/venue-partner/dashboard' || pathname.endsWith('/dashboard')) return 'overview';
    if (pathname.includes('/dashboard/venues')) return 'venues';
    if (pathname.includes('/dashboard/bookings')) return 'bookings';
    if (pathname.includes('/dashboard/analytics')) return 'analytics';
    if (pathname.includes('/dashboard/profile')) return 'profile';
    return 'overview';
  };

  const activeRoute = getActiveRoute();

  const navItems = [
    { key: 'overview', icon: 'analytics', route: '/venue-partner/dashboard' },
    { key: 'venues', icon: 'business', route: '/venue-partner/dashboard/venues' },
    { key: 'bookings', icon: 'calendar', route: '/venue-partner/dashboard/bookings' },
    { key: 'analytics', icon: 'bar-chart', route: '/venue-partner/dashboard/analytics' },
    { key: 'profile', icon: 'person', route: '/venue-partner/dashboard/profile' },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

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
            onPress={() => handleNavigation(item.route)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={activeRoute === item.key ? item.icon as any : `${item.icon}-outline` as any} 
              size={22} 
              color={activeRoute === item.key ? "#ffffff" : "rgba(255,255,255,0.6)"} 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(VenuePartnerBottomNavigation);

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