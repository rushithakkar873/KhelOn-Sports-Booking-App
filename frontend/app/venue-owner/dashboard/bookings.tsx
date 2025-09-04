import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Booking {
  id: string;
  venueName: string;
  playerName: string;
  playerPhone: string;
  sport: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const router = useRouter();

  const statusFilters = [
    { key: 'all', label: 'All Bookings', count: 0 },
    { key: 'pending', label: 'Pending', count: 0 },
    { key: 'confirmed', label: 'Confirmed', count: 0 },
    { key: 'completed', label: 'Completed', count: 0 },
    { key: 'cancelled', label: 'Cancelled', count: 0 },
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      // Mock data - replace with actual API call
      const mockBookings: Booking[] = [
        {
          id: '1',
          venueName: 'Elite Cricket Ground',
          playerName: 'Arjun Singh',
          playerPhone: '+91 9876543210',
          sport: 'Cricket',
          bookingDate: '2025-01-15',
          startTime: '18:00',
          endTime: '20:00',
          duration: 2,
          totalAmount: 2400,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: '2025-01-10T14:30:00Z'
        },
        {
          id: '2',
          venueName: 'Champions Football Turf',
          playerName: 'Priya Sharma',
          playerPhone: '+91 8765432109',
          sport: 'Football',
          bookingDate: '2025-01-16',
          startTime: '19:00',
          endTime: '20:00',
          duration: 1,
          totalAmount: 900,
          status: 'pending',
          paymentStatus: 'pending',
          createdAt: '2025-01-11T10:15:00Z'
        },
        {
          id: '3',
          venueName: 'Elite Cricket Ground',
          playerName: 'Rahul Verma',
          playerPhone: '+91 7654321098',
          sport: 'Cricket',
          bookingDate: '2025-01-14',
          startTime: '16:00',
          endTime: '18:00',
          duration: 2,
          totalAmount: 2200,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: '2025-01-09T16:45:00Z'
        },
        {
          id: '4',
          venueName: 'Badminton Arena Pro',
          playerName: 'Sneha Patel',
          playerPhone: '+91 6543210987',
          sport: 'Badminton',
          bookingDate: '2025-01-13',
          startTime: '07:00',
          endTime: '08:00',
          duration: 1,
          totalAmount: 600,
          status: 'cancelled',
          paymentStatus: 'refunded',
          createdAt: '2025-01-08T11:20:00Z'
        },
        {
          id: '5',
          venueName: 'Champions Football Turf',
          playerName: 'Vikash Kumar',
          playerPhone: '+91 5432109876',
          sport: 'Football',
          bookingDate: '2025-01-17',
          startTime: '18:00',
          endTime: '19:00',
          duration: 1,
          totalAmount: 900,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: '2025-01-12T09:30:00Z'
        },
      ];

      // Update status counts
      statusFilters.forEach(filter => {
        if (filter.key === 'all') {
          filter.count = mockBookings.length;
        } else {
          filter.count = mockBookings.filter(booking => booking.status === filter.key).length;
        }
      });

      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const getFilteredBookings = () => {
    if (selectedStatus === 'all') {
      return bookings;
    }
    return bookings.filter(booking => booking.status === selectedStatus);
  };

  const handleBookingAction = (booking: Booking, action: string) => {
    switch (action) {
      case 'confirm':
        updateBookingStatus(booking.id, 'confirmed');
        break;
      case 'complete':
        updateBookingStatus(booking.id, 'completed');
        break;
      case 'cancel':
        Alert.alert(
          'Cancel Booking',
          'Are you sure you want to cancel this booking?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => updateBookingStatus(booking.id, 'cancelled') }
          ]
        );
        break;
      case 'details':
        setSelectedBooking(booking);
        setShowDetailsModal(true);
        break;
    }
  };

  const updateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: newStatus }
        : booking
    ));
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#2563eb';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#fef3c7';
      case 'confirmed':
        return '#dbeafe';
      case 'completed':
        return '#d1fae5';
      case 'cancelled':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredBookings = getFilteredBookings();

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
          <View>
            <Text style={styles.headerTitle}>Bookings</Text>
            <Text style={styles.headerSubtitle}>{bookings.length} total bookings</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={20} color={viewMode === 'list' ? '#2563eb' : '#6b7280'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('calendar')}
            >
              <Ionicons name="calendar" size={20} color={viewMode === 'calendar' ? '#2563eb' : '#6b7280'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedStatus === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedStatus(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedStatus === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bookings List */}
        <View style={styles.bookingsContainer}>
          {filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingBasicInfo}>
                  <Text style={styles.bookingVenue}>{booking.venueName}</Text>
                  <Text style={styles.bookingPlayer}>{booking.playerName}</Text>
                  <Text style={styles.bookingSport}>{booking.sport}</Text>
                </View>
                <View style={styles.bookingStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(booking.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(booking.status) }
                    ]}>
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.bookingDetail}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={styles.bookingDetailText}>
                    {formatDate(booking.bookingDate)}
                  </Text>
                </View>
                <View style={styles.bookingDetail}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.bookingDetailText}>
                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </Text>
                </View>
                <View style={styles.bookingDetail}>
                  <Ionicons name="cash-outline" size={16} color="#6b7280" />
                  <Text style={styles.bookingDetailText}>
                    {formatCurrency(booking.totalAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleBookingAction(booking, 'details')}
                >
                  <Text style={styles.actionButtonText}>Details</Text>
                </TouchableOpacity>

                {booking.status === 'pending' && (
                  <>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() => handleBookingAction(booking, 'confirm')}
                    >
                      <Text style={[styles.actionButtonText, styles.confirmButtonText]}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleBookingAction(booking, 'cancel')}
                    >
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}

                {booking.status === 'confirmed' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleBookingAction(booking, 'complete')}
                  >
                    <Text style={[styles.actionButtonText, styles.completeButtonText]}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No bookings found</Text>
            <Text style={styles.emptyStateText}>
              {selectedStatus === 'all' 
                ? 'You don\'t have any bookings yet'
                : `No ${selectedStatus} bookings at the moment`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Booking Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <TouchableOpacity>
              <Text style={styles.modalAction}>Action</Text>
            </TouchableOpacity>
          </View>
          {selectedBooking && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Venue Information</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Venue:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.venueName}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Sport:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.sport}</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Player Information</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Name:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.playerName}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Phone:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.playerPhone}</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Booking Details</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Date:</Text>
                  <Text style={styles.detailsValue}>{formatDate(selectedBooking.bookingDate)}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Time:</Text>
                  <Text style={styles.detailsValue}>
                    {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Duration:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.duration} hour(s)</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Amount:</Text>
                  <Text style={styles.detailsValue}>{formatCurrency(selectedBooking.totalAmount)}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(selectedBooking.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(selectedBooking.status) }
                    ]}>
                      {selectedBooking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Payment:</Text>
                  <Text style={styles.detailsValue}>{selectedBooking.paymentStatus}</Text>
                </View>
              </View>
            </ScrollView>
          )}
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
  },
  viewModeButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  viewModeButtonActive: {
    backgroundColor: '#dbeafe',
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersContent: {
    paddingHorizontal: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  bookingsContainer: {
    paddingHorizontal: 24,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingBasicInfo: {
    flex: 1,
  },
  bookingVenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookingPlayer: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  bookingSport: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#dbeafe',
  },
  confirmButtonText: {
    color: '#2563eb',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#dc2626',
  },
  completeButton: {
    backgroundColor: '#d1fae5',
  },
  completeButtonText: {
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
  modalAction: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  detailsValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
});