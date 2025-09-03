import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  joinedDate: string;
  sportsInterests: string[];
  totalBookings: number;
  totalSpent: number;
  favoriteVenues: number;
}

interface NotificationSettings {
  bookingReminders: boolean;
  newVenues: boolean;
  tournaments: boolean;
  promotions: boolean;
  emailNotifications: boolean;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    bookingReminders: true,
    newVenues: false,
    tournaments: true,
    promotions: false,
    emailNotifications: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    // Mock data - replace with API call
    const mockProfile: UserProfile = {
      id: '1',
      name: 'Arjun Patel',
      email: 'arjun.patel@example.com',
      mobile: '+91 9876543210',
      joinedDate: '2024-08-15',
      sportsInterests: ['Cricket', 'Badminton', 'Football'],
      totalBookings: 24,
      totalSpent: 18500,
      favoriteVenues: 5,
    };

    setProfile(mockProfile);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleNotificationToggle = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Handle logout logic
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: 'heart-outline',
      title: 'Favorite Venues',
      subtitle: 'Your saved venues',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'trophy-outline',
      title: 'My Tournaments',
      subtitle: 'Tournaments you joined',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'receipt-outline',
      title: 'Booking History',
      subtitle: 'View all your bookings',
      onPress: () => router.push('/main/bookings'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => Alert.alert('Coming Soon!'),
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      onPress: () => Alert.alert('Coming Soon!'),
    },
  ];

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#6b7280" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <Text style={styles.profileMobile}>{profile.mobile}</Text>
              <Text style={styles.joinDate}>
                Joined {new Date(profile.joinedDate).toLocaleDateString('en-IN', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
          </View>

          {/* Sports Interests */}
          <View style={styles.sportsSection}>
            <Text style={styles.sportsTitle}>Sports Interests</Text>
            <View style={styles.sportsContainer}>
              {profile.sportsInterests.map((sport, index) => (
                <View key={index} style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{sport}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{profile.totalSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.favoriteVenues}</Text>
            <Text style={styles.statLabel}>Favorite Venues</Text>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Booking Reminders</Text>
              <Text style={styles.settingDescription}>Get reminded about upcoming bookings</Text>
            </View>
            <Switch
              value={notificationSettings.bookingReminders}
              onValueChange={() => handleNotificationToggle('bookingReminders')}
              trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
              thumbColor={notificationSettings.bookingReminders ? '#000000' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>New Venues</Text>
              <Text style={styles.settingDescription}>Notify about new venues in your area</Text>
            </View>
            <Switch
              value={notificationSettings.newVenues}
              onValueChange={() => handleNotificationToggle('newVenues')}
              trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
              thumbColor={notificationSettings.newVenues ? '#000000' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Tournaments</Text>
              <Text style={styles.settingDescription}>Updates about tournaments</Text>
            </View>
            <Switch
              value={notificationSettings.tournaments}
              onValueChange={() => handleNotificationToggle('tournaments')}
              trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
              thumbColor={notificationSettings.tournaments ? '#000000' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Promotions</Text>
              <Text style={styles.settingDescription}>Special offers and discounts</Text>
            </View>
            <Switch
              value={notificationSettings.promotions}
              onValueChange={() => handleNotificationToggle('promotions')}
              trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
              thumbColor={notificationSettings.promotions ? '#000000' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications via email</Text>
            </View>
            <Switch
              value={notificationSettings.emailNotifications}
              onValueChange={() => handleNotificationToggle('emailNotifications')}
              trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
              thumbColor={notificationSettings.emailNotifications ? '#000000' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIcon}>
                  <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#f9fafb',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  profileMobile: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sportsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
  },
  sportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sportTag: {
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  sportTagText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: '#f9fafb',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuSection: {
    backgroundColor: '#f9fafb',
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
});