import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import VenuePartnerService from '../../../services/venuePartnerService';
import AuthService from '../../../services/authService';
import VenuePartnerBottomNavigation from '../../../components/VenuePartnerBottomNavigation';

interface Booking {
  id: string;
  venue_name: string;
  arena_name: string;
  player_name: string;
  player_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  sport: string;
  notes?: string;
  created_at: string;
}

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  
  const venuePartnerService = VenuePartnerService.getInstance();
  const authService = AuthService.getInstance();

  useEffect(() => {
    checkAuthAndLoadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStatus, searchText]);

  const checkAuthAndLoadBookings = async () => {
    try {
      if (!authService.isAuthenticated() || !authService.isVenuePartner()) {
        router.replace('/auth/login');
        return;
      }
      await loadBookings();
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/auth/login');
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsData = await venuePartnerService.getBookings();
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }
    
    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(booking => 
        booking.player_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.venue_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.player_phone?.includes(searchText)
      );
    }
    
    setFilteredBookings(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleBookingPress = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalVisible(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await venuePartnerService.updateBookingStatus(bookingId, newStatus);
      Alert.alert('Success', `Booking status updated to ${newStatus}`);
      setActionModalVisible(false);
      await loadBookings();
    } catch (error) {
      console.error('Failed to update booking status:', error);
      Alert.alert('Error', 'Failed to update booking status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#6366F1';
      default: return '#6B7280';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderStatusTabs = () => {
    const statuses = [
      { key: 'all', label: 'All', count: bookings.length },
      { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
      { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
      { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
      { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusTabs}
      >
        {statuses.map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.statusTab,
              selectedStatus === status.key && styles.activeStatusTab
            ]}
            onPress={() => setSelectedStatus(status.key)}
          >
            <Text style={[
              styles.statusTabText,
              selectedStatus === status.key && styles.activeStatusTabText
            ]}>
              {status.label}
            </Text>
            <Text style={[
              styles.statusTabCount,
              selectedStatus === status.key && styles.activeStatusTabCount
            ]}>
              {status.count}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderBookingCard = (booking: Booking) => (
    <TouchableOpacity
      key={booking.id}
      style={styles.bookingCard}
      onPress={() => handleBookingPress(booking)}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.venueName}>{booking.venue_name}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
            <Text style={styles.statusText}>{booking.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{booking.player_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{booking.player_phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            {VenuePartnerService.formatDate(booking.booking_date)} • {VenuePartnerService.formatTime(booking.start_time)} - {VenuePartnerService.formatTime(booking.end_time)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="football-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{booking.sport} • {booking.arena_name}</Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {VenuePartnerService.formatCurrency(booking.total_amount)}
          </Text>
        </View>
        <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(booking.payment_status) }]}>
          <Text style={styles.paymentText}>{booking.payment_status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={detailsModalVisible}
      animationType="slide"
      onRequestClose={() => setDetailsModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setDetailsModalVisible(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Booking Details</Text>
          <TouchableOpacity
            onPress={() => {
              setDetailsModalVisible(false);
              setActionModalVisible(true);
            }}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {selectedBooking && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Venue Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Venue</Text>
                <Text style={styles.detailValue}>{selectedBooking.venue_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Arena</Text>
                <Text style={styles.detailValue}>{selectedBooking.arena_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sport</Text>
                <Text style={styles.detailValue}>{selectedBooking.sport}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Player Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedBooking.player_name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{selectedBooking.player_phone}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Booking Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {VenuePartnerService.formatDate(selectedBooking.booking_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {VenuePartnerService.formatTime(selectedBooking.start_time)} - {VenuePartnerService.formatTime(selectedBooking.end_time)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedBooking.status) }]}>
                  <Text style={styles.statusText}>{selectedBooking.status}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment</Text>
                <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(selectedBooking.payment_status) }]}>
                  <Text style={styles.paymentText}>{selectedBooking.payment_status}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.amountValueLarge}>
                  {VenuePartnerService.formatCurrency(selectedBooking.total_amount)}
                </Text>
              </View>
              {selectedBooking.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{selectedBooking.notes}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderActionModal = () => (
    <Modal
      visible={actionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setActionModalVisible(false)}
    >
      <View style={styles.actionModalOverlay}>
        <View style={styles.actionModalContent}>
          <Text style={styles.actionModalTitle}>Update Booking Status</Text>
          
          {['confirmed', 'cancelled', 'completed'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.actionItem, { opacity: selectedBooking?.status === status ? 0.5 : 1 }]}
              disabled={selectedBooking?.status === status}
              onPress={() => selectedBooking && handleStatusChange(selectedBooking.id, status as any)}
            >
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
              <Text style={styles.actionItemText}>Mark as {status}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.cancelActionButton}
            onPress={() => setActionModalVisible(false)}
          >
            <Text style={styles.cancelActionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <Text>Loading bookings...</Text>
        </View>
        <VenuePartnerBottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="filter" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by player name, venue, or phone"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Tabs */}
      {renderStatusTabs()}

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {selectedStatus === 'all' 
                ? 'No bookings available for your venues.'
                : `No ${selectedStatus} bookings found.`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderDetailsModal()}
      {renderActionModal()}

      <VenuePartnerBottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  statusTabs: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeStatusTab: {
    backgroundColor: '#3B82F6',
  },
  statusTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 6,
  },
  activeStatusTabText: {
    color: '#FFFFFF',
  },
  statusTabCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  activeStatusTabCount: {
    backgroundColor: '#1E40AF',
    color: '#FFFFFF',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bookingInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  actionButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
  amountValueLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    flex: 2,
    textAlign: 'right',
  },
  
  // Action Modal styles
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  actionItemText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  cancelActionButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});