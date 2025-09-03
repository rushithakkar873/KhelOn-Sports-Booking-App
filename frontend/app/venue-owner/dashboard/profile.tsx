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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface VenueOwnerProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  businessName: string;
  businessAddress: string;
  gstNumber: string;
  profileImage?: string;
  joinedDate: string;
  isVerified: boolean;
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Mock data - replace with actual API call
      const mockProfile: VenueOwnerProfile = {
        id: '1',
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        mobile: '+91 9876543210',
        businessName: 'Elite Sports Complex',
        businessAddress: '123 Sports Street, Andheri, Mumbai - 400058',
        gstNumber: '27ABCDE1234F1Z5',
        joinedDate: '2024-08-15',
        isVerified: true,
        totalVenues: 3,
        totalBookings: 156,
        totalRevenue: 245000,
      };

      setProfile(mockProfile);
      setEditForm({
        name: mockProfile.name,
        businessName: mockProfile.businessName,
        businessAddress: mockProfile.businessAddress,
        gstNumber: mockProfile.gstNumber,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
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
        businessName: editForm.businessName,
        businessAddress: editForm.businessAddress,
        gstNumber: editForm.gstNumber,
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
          onPress: () => {
            // Clear token and navigate to login
            router.replace('/venue-owner/login');
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={48} color="#6b7280" />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.profileName}>{profile.name}</Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={20} color="#059669" style={styles.verifiedIcon} />
                )}
              </View>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <Text style={styles.profileMobile}>{profile.mobile}</Text>
              <Text style={styles.joinDate}>Joined {formatDate(profile.joinedDate)}</Text>
            </View>
          </View>

          {/* Business Info */}
          <View style={styles.businessInfo}>
            <Text style={styles.businessTitle}>Business Information</Text>
            <View style={styles.businessDetails}>
              <View style={styles.businessRow}>
                <Text style={styles.businessLabel}>Business Name:</Text>
                <Text style={styles.businessValue}>{profile.businessName || 'Not provided'}</Text>
              </View>
              <View style={styles.businessRow}>
                <Text style={styles.businessLabel}>Address:</Text>
                <Text style={styles.businessValue}>{profile.businessAddress || 'Not provided'}</Text>
              </View>
              <View style={styles.businessRow}>
                <Text style={styles.businessLabel}>GST Number:</Text>
                <Text style={styles.businessValue}>{profile.gstNumber || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.totalVenues}</Text>
            <Text style={styles.statLabel}>Total Venues</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(profile.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowSettingsModal(true)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Notification Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="card-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Business Documents</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-outline" size={24} color="#6b7280" />
              <Text style={styles.menuItemText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
                <Text style={styles.settingLabel}>New Bookings</Text>
                <Switch
                  value={notificationSettings.newBookings}
                  onValueChange={() => toggleNotificationSetting('newBookings')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.newBookings ? '#2563eb' : '#9ca3af'}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Booking Confirmations</Text>
                <Switch
                  value={notificationSettings.bookingConfirmations}
                  onValueChange={() => toggleNotificationSetting('bookingConfirmations')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.bookingConfirmations ? '#2563eb' : '#9ca3af'}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Cancellations</Text>
                <Switch
                  value={notificationSettings.cancellations}
                  onValueChange={() => toggleNotificationSetting('cancellations')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.cancellations ? '#2563eb' : '#9ca3af'}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Payment Updates</Text>
                <Switch
                  value={notificationSettings.payments}
                  onValueChange={() => toggleNotificationSetting('payments')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.payments ? '#2563eb' : '#9ca3af'}
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsTitle}>Communication Preferences</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Switch
                  value={notificationSettings.emailNotifications}
                  onValueChange={() => toggleNotificationSetting('emailNotifications')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.emailNotifications ? '#2563eb' : '#9ca3af'}
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>SMS Notifications</Text>
                <Switch
                  value={notificationSettings.smsNotifications}
                  onValueChange={() => toggleNotificationSetting('smsNotifications')}
                  trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                  thumbColor={notificationSettings.smsNotifications ? '#2563eb' : '#9ca3af'}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  profileAvatar: {
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
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  verifiedIcon: {
    marginLeft: 8,
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
  businessInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 20,
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  businessDetails: {},
  businessRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  businessLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 100,
  },
  businessValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#dc2626',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
});