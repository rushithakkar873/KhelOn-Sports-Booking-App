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
  StatusBar,
  ImageBackground,
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Profile</Text>
              <Text style={styles.subtitle}>Manage your account</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Profile Header Card */}
          <View style={styles.section}>
            <View style={styles.profileHeaderCard}>
              <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1676315636766-7b129985c537' }}
                style={styles.profileBackground}
                imageStyle={styles.profileBackgroundStyle}
              >
                <View style={styles.profileOverlay} />
                <View style={styles.profileContent}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={32} color="#ffffff" />
                    </View>
                  </View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                  <Text style={styles.joinDate}>
                    Member since {new Date(profile.joinedDate).toLocaleDateString('en-IN', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  
                  {/* Sports Interests */}
                  <View style={styles.sportsContainer}>
                    {profile.sportsInterests.map((sport, index) => (
                      <View key={index} style={styles.sportTag}>
                        <Text style={styles.sportTagText}>{sport}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.section}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>{profile.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="cash" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>₹{(profile.totalSpent / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="heart" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>{profile.favoriteVenues}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
            </View>
          </View>

          {/* Notification Settings Card */}
          <View style={styles.section}>
            <View style={styles.settingsCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="notifications" size={20} color="#212529" />
                <Text style={styles.cardTitle}>Notifications</Text>
              </View>
              
              {Object.entries(notificationSettings).map(([key, value]) => (
                <View key={key} style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>
                      {key === 'bookingReminders' && 'Booking Reminders'}
                      {key === 'newVenues' && 'New Venues'}
                      {key === 'tournaments' && 'Tournaments'}
                      {key === 'promotions' && 'Promotions'}
                      {key === 'emailNotifications' && 'Email Notifications'}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={() => handleNotificationToggle(key as keyof NotificationSettings)}
                    trackColor={{ false: '#f5f6f7', true: '#e5e7eb' }}
                    thumbColor={value ? '#212529' : '#9ca3af'}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.section}>
            <View style={styles.menuCard}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuItemIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#9ca3af" />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#e5e7eb" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
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
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  profileHeaderCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileBackground: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBackgroundStyle: {
    borderRadius: 24,
  },
  profileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
  },
  profileContent: {
    alignItems: 'center',
    padding: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  joinDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    textAlign: 'center',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  sportTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sportTagText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#f5f6f7',
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    color: '#212529',
  },
  menuCard: {
    backgroundColor: '#f5f6f7',
    borderRadius: 20,
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
  lastMenuItem: {
    borderBottomWidth: 0,
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f6f7',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});