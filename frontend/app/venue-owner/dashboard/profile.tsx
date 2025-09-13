import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenueOwnerBottomNavigation from '../../../components/VenueOwnerBottomNavigation';
import VenueOwnerService from '../../../services/venueOwnerService';
import AuthService from '../../../services/authService';
import AnimatedLoader from '../../../components/AnimatedLoader';

interface VenueOwnerProfile {
  id: string;
  name: string;
  email?: string;
  mobile: string;
  business_name?: string;
  business_address?: string;
  gst_number?: string;
  profileImage?: string;
  created_at: string;
  is_verified: boolean;
  total_venues?: number;
  total_revenue?: number;
}

interface NotificationSettings {
  newBookings: boolean;
  bookingConfirmations: boolean;
  cancellations: boolean;
  payments: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<VenueOwnerProfile | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newBookings: true,
    bookingConfirmations: true,
    cancellations: true,
    payments: true,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    businessName: '',
    businessAddress: '',
    gstNumber: '',
  });
  
  const router = useRouter();
  const venueOwnerService = VenueOwnerService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Check if user is authenticated and is venue owner
      if (!authService.isAuthenticated() || !authService.isVenueOwner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue owner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Get current user profile
      const user = await authService.getProfile();
      if (!user) {
        throw new Error('Failed to load profile');
      }

      // Transform user data to profile format
      const profileData: VenueOwnerProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        business_name: user.business_name,
        business_address: user.business_address,
        gst_number: user.gst_number,
        created_at: user.created_at,
        is_verified: user.is_verified,
        total_venues: user.total_venues,
        total_revenue: user.total_revenue,
      };

      setProfile(profileData);
      setEditForm({
        name: profileData.name,
        businessName: profileData.business_name || '',
        businessAddress: profileData.business_address || '',
        gstNumber: profileData.gst_number || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      
      Alert.alert(
        'Error', 
        'Failed to load profile data. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadProfile() },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Update profile with form data
    if (profile) {
      setProfile({
        ...profile,
        name: editForm.name,
        business_name: editForm.businessName,
        business_address: editForm.businessAddress,
        gst_number: editForm.gstNumber,
      });
    }

    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully');
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
          onPress: async () => {
            // Clear authentication data
            await authService.logout();
            router.replace('/auth/login');
          }
        }
      ]
    );
  };

  const toggleNotificationSetting = (setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const menuItems = [
    {
      icon: 'notifications-outline',
      title: 'Notification Settings',
      subtitle: 'Manage your notifications',
      onPress: () => setShowSettingsModal(true),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      title: 'Business Documents',
      subtitle: 'Upload required documents',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and support',
      onPress: () => {},
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      onPress: () => {},
    },
    {
      icon: 'document-outline',
      title: 'Terms of Service',
      subtitle: 'Read terms and conditions',
      onPress: () => {},
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
        <SafeAreaView style={styles.safeArea}>
          <AnimatedLoader 
            message="Loading profile..." 
            size="medium"
            color="#212529"
          />
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load profile</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>Profile</Text>
              <Text style={styles.subtitle}>Manage your account</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create" size={20} color="#212529" />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={40} color="#212529" />
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  {profile.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileEmail}>{profile.email || 'Not provided'}</Text>
                <Text style={styles.profileMobile}>{profile.mobile}</Text>
                <Text style={styles.joinDate}>Member since {VenueOwnerService.formatDate(profile.created_at)}</Text>
              </View>
            </View>

            {/* Business Info */}
            <View style={styles.businessSection}>
              <Text style={styles.businessTitle}>Business Information</Text>
              <View style={styles.businessGrid}>
                <View style={styles.businessItem}>
                  <Text style={styles.businessLabel}>Business Name</Text>
                  <Text style={styles.businessValue}>{profile.business_name || 'Not provided'}</Text>
                </View>
                <View style={styles.businessItem}>
                  <Text style={styles.businessLabel}>GST Number</Text>
                  <Text style={styles.businessValue}>{profile.gst_number || 'Not provided'}</Text>
                </View>
              </View>
              <View style={styles.businessItem}>
                <Text style={styles.businessLabel}>Business Address</Text>
                <Text style={styles.businessValue}>{profile.business_address || 'Not provided'}</Text>
              </View>
            </View>
          </View>

          {/* Stats Cards - 2-1 Layout */}
          <View style={styles.statsSection}>
            <View style={styles.statsTopRow}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="business" size={20} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{profile.total_venues || 0}</Text>
                <Text style={styles.statLabel}>Venues</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={20} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{0}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
            </View>
            <View style={styles.statsBottomRow}>
              <View style={styles.statCardFull}>
                <View style={styles.statIcon}>
                  <Ionicons name="cash" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{formatCurrency(profile.total_revenue || 0)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
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
                    <Ionicons name={item.icon as any} size={24} color="#6b7280" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemText}>{item.title}</Text>
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

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={styles.modalSave}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm({...editForm, name: text})}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.businessName}
                  onChangeText={(text) => setEditForm({...editForm, businessName: text})}
                  placeholder="Enter business name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Business Address</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={editForm.businessAddress}
                  onChangeText={(text) => setEditForm({...editForm, businessAddress: text})}
                  placeholder="Enter business address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>GST Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.gstNumber}
                  onChangeText={(text) => setEditForm({...editForm, gstNumber: text})}
                  placeholder="Enter GST number"
                  autoCapitalize="characters"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Notification Settings Modal */}
        <Modal
          visible={showSettingsModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.modalCancel}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Text style={styles.modalSave}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Push Notifications</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>New Bookings</Text>
                    <Text style={styles.settingDescription}>Get notified when you receive new bookings</Text>
                  </View>
                  <Switch
                    value={notificationSettings.newBookings}
                    onValueChange={() => toggleNotificationSetting('newBookings')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.newBookings ? '#212529' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Booking Confirmations</Text>
                    <Text style={styles.settingDescription}>Updates on booking status changes</Text>
                  </View>
                  <Switch
                    value={notificationSettings.bookingConfirmations}
                    onValueChange={() => toggleNotificationSetting('bookingConfirmations')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.bookingConfirmations ? '#212529' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Cancellations</Text>
                    <Text style={styles.settingDescription}>Notifications for booking cancellations</Text>
                  </View>
                  <Switch
                    value={notificationSettings.cancellations}
                    onValueChange={() => toggleNotificationSetting('cancellations')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.cancellations ? '#212529' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Payment Updates</Text>
                    <Text style={styles.settingDescription}>Payment confirmations and updates</Text>
                  </View>
                  <Switch
                    value={notificationSettings.payments}
                    onValueChange={() => toggleNotificationSetting('payments')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.payments ? '#212529' : '#9ca3af'}
                  />
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Communication Preferences</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>Email Notifications</Text>
                    <Text style={styles.settingDescription}>Receive notifications via email</Text>
                  </View>
                  <Switch
                    value={notificationSettings.emailNotifications}
                    onValueChange={() => toggleNotificationSetting('emailNotifications')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.emailNotifications ? '#212529' : '#9ca3af'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingLabel}>SMS Notifications</Text>
                    <Text style={styles.settingDescription}>Receive notifications via SMS</Text>
                  </View>
                  <Switch
                    value={notificationSettings.smsNotifications}
                    onValueChange={() => toggleNotificationSetting('smsNotifications')}
                    trackColor={{ false: '#e5e7eb', true: 'rgba(33, 37, 41, 0.2)' }}
                    thumbColor={notificationSettings.smsNotifications ? '#212529' : '#9ca3af'}
                  />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <VenueOwnerBottomNavigation currentRoute="profile" />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  safeArea: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginRight: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  profileMobile: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  joinDate: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  businessSection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 24,
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  businessGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  businessItem: {
    flex: 1,
  },
  businessLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  businessValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsTopRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statsBottomRow: {
    flexDirection: 'row',
  },
  statCardFull: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalSave: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});