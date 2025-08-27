import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  role: 'player' | 'venue_owner';
  sportsInterests: string[];
  location: string;
  joinDate: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobile: '+91 98765 43210',
    role: 'player',
    sportsInterests: ['Badminton', 'Cricket', 'Football'],
    location: 'Bangalore, Karnataka',
    joinDate: '2024-12-01',
  });

  const [notifications, setNotifications] = useState({
    bookingReminders: true,
    tournamentUpdates: true,
    promotions: false,
  });

  const router = useRouter();

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage your payment options',
      onPress: () => router.push('/profile/payments'),
    },
    {
      icon: 'receipt-outline',
      title: 'Transaction History',
      subtitle: 'View all your payments',
      onPress: () => router.push('/profile/transactions'),
    },
    {
      icon: 'star-outline',
      title: 'My Reviews',
      subtitle: 'Reviews you\'ve given',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'people-outline',
      title: 'Invite Friends',
      subtitle: 'Share the app with friends',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms & Privacy',
      subtitle: 'Legal information',
      onPress: () => Alert.alert('Coming Soon!'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Clear user session and navigate to auth
            router.replace('/');
          },
        },
      ]
    );
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <Ionicons 
                name={user.role === 'venue_owner' ? 'business' : 'person'} 
                size={16} 
                color="white" 
              />
            </View>
          </View>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.joinDate}>
            Member since {formatJoinDate(user.joinDate)}
          </Text>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Tournaments</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Sports Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sports Interests</Text>
          <View style={styles.sportsContainer}>
            {user.sportsInterests.map((sport, index) => (
              <View key={index} style={styles.sportChip}>
                <Text style={styles.sportText}>{sport}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.notificationsList}>
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Booking Reminders</Text>
                <Text style={styles.notificationSubtitle}>
                  Get reminded about upcoming bookings
                </Text>
              </View>
              <Switch
                value={notifications.bookingReminders}
                onValueChange={(value) => 
                  setNotifications(prev => ({...prev, bookingReminders: value}))
                }
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Tournament Updates</Text>
                <Text style={styles.notificationSubtitle}>
                  Updates about tournaments you joined
                </Text>
              </View>
              <Switch
                value={notifications.tournamentUpdates}
                onValueChange={(value) => 
                  setNotifications(prev => ({...prev, tournamentUpdates: value}))
                }
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Promotions</Text>
                <Text style={styles.notificationSubtitle}>
                  Special offers and discounts
                </Text>
              </View>
              <Switch
                value={notifications.promotions}
                onValueChange={(value) => 
                  setNotifications(prev => ({...prev, promotions: value}))
                }
                trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon as any} size={24} color="#666666" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Playon v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 Playon. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    backgroundColor: '#F8F9FA',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 24,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    backgroundColor: '#FFF4F0',
    borderColor: '#FF6B35',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sportText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  notificationsList: {
    gap: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  versionText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
});