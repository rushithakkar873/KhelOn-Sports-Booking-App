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
import VenuePartnerService from '../../../services/venuePartnerService';
import AuthService from '../../../services/authService';
import AnimatedLoader from '../../../components/AnimatedLoader';

interface UserProfile {
  id: string;
  mobile: string;
  name: string;
  email?: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  business_name?: string;
  business_address?: string;
  gst_number?: string;
  total_venues?: number;
  total_revenue?: number;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    business_name: '',
    business_address: '',
    gst_number: '',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    newBookings: true,
    bookingUpdates: true,
    paymentAlerts: true,
    promotionalOffers: false,
    systemUpdates: true,
  });

  const venuePartnerService = VenuePartnerService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await authService.getProfile();
      if (profileData) {
        setProfile(profileData);
        setEditData({
          name: profileData.name || '',
          email: profileData.email || '',
          business_name: profileData.business_name || '',
          business_address: profileData.business_address || '',
          gst_number: profileData.gst_number || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update API
      Alert.alert('Success', 'Profile updated successfully');
      setShowEditModal(false);
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
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
            await authService.logout();
            // Navigate to auth screen - handled by authentication context
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Ionicons name="person-circle-outline" size={64} color="#9ca3af" />
            <Text style={styles.errorTitle}>Profile Not Found</Text>
            <Text style={styles.errorMessage}>
              Unable to load profile information
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setIsLoading(true);
                loadProfile();
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
              <Ionicons name="pencil" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>{profile.email || profile.mobile}</Text>
                <Text style={styles.joinDate} numberOfLines={1}>Member since {VenuePartnerService.formatDate(profile.created_at)}</Text>
              </View>
              {profile.is_verified && (
                <View style={styles.verificationBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.total_venues || 0}</Text>
                <Text style={styles.statLabel}>Venues</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹{(profile.total_revenue || 0).toLocaleString('en-IN')}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
            </View>
          </View>

          {/* Business Information */}
          {profile.business_name && (
            <View style={styles.businessCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="business" size={24} color="#212529" />
                <Text style={styles.cardTitle}>Business Information</Text>
              </View>
              <View style={styles.businessInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Business Name</Text>
                  <Text style={styles.infoValue}>{profile.business_name}</Text>
                </View>
                {profile.business_address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{profile.business_address}</Text>
                  </View>
                )}
                {profile.gst_number && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>GST Number</Text>
                    <Text style={styles.infoValue}>{profile.gst_number}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Settings Menu */}
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowNotificationModal(true)}
            >
              <View style={styles.settingIcon}>
                <Ionicons name="notifications" size={24} color="#6b7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Manage your notification preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#6b7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Privacy & Security</Text>
                <Text style={styles.settingSubtitle}>Manage your privacy settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="help-circle" size={24} color="#6b7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>Get help and contact support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons name="document-text" size={24} color="#6b7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Terms & Privacy</Text>
                <Text style={styles.settingSubtitle}>Read our terms and privacy policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

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
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.email}
                  onChangeText={(text) => setEditData({ ...editData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.business_name}
                  onChangeText={(text) => setEditData({ ...editData, business_name: text })}
                  placeholder="Enter business name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Address</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaInput]}
                  value={editData.business_address}
                  onChangeText={(text) => setEditData({ ...editData, business_address: text })}
                  placeholder="Enter business address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GST Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editData.gst_number}
                  onChangeText={(text) => setEditData({ ...editData, gst_number: text })}
                  placeholder="Enter GST number"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          visible={showNotificationModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalSave}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.notificationSection}>
                <Text style={styles.notificationSectionTitle}>Booking Notifications</Text>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>New Bookings</Text>
                    <Text style={styles.notificationSubtitle}>Get notified when you receive new bookings</Text>
                  </View>
                  <Switch
                    value={notificationSettings.newBookings}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, newBookings: value })
                    }
                    trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Booking Updates</Text>
                    <Text style={styles.notificationSubtitle}>Get notified about booking changes and cancellations</Text>
                  </View>
                  <Switch
                    value={notificationSettings.bookingUpdates}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, bookingUpdates: value })
                    }
                    trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={styles.notificationSection}>
                <Text style={styles.notificationSectionTitle}>Financial Notifications</Text>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Payment Alerts</Text>
                    <Text style={styles.notificationSubtitle}>Get notified about payments and refunds</Text>
                  </View>
                  <Switch
                    value={notificationSettings.paymentAlerts}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, paymentAlerts: value })
                    }
                    trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              <View style={styles.notificationSection}>
                <Text style={styles.notificationSectionTitle}>General Notifications</Text>
                
                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>Promotional Offers</Text>
                    <Text style={styles.notificationSubtitle}>Receive offers and promotional updates</Text>
                  </View>
                  <Switch
                    value={notificationSettings.promotionalOffers}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, promotionalOffers: value })
                    }
                    trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.notificationItem}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>System Updates</Text>
                    <Text style={styles.notificationSubtitle}>Important app updates and announcements</Text>
                  </View>
                  <Switch
                    value={notificationSettings.systemUpdates}
                    onValueChange={(value) => 
                      setNotificationSettings({ ...notificationSettings, systemUpdates: value })
                    }
                    trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#212529',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  verificationBadge: {
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 24,
  },
  businessCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 12,
  },
  businessInfo: {
    gap: 16,
  },
  infoRow: {},
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  notificationSection: {
    marginBottom: 32,
  },
  notificationSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  notificationContent: {
    flex: 1,
    marginRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});