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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenueOwnerBottomNavigation from '../../../components/VenueOwnerBottomNavigation';
import VenueOwnerService from '../../../services/venueOwnerService';
import AuthService from '../../../services/authService';
import EnhancedBookingFlow from '../../../components/EnhancedBookingFlow';

const { width } = Dimensions.get('window');

// Use API booking interface instead of custom one
interface Booking {
  id: string;
  venue_name?: string;
  user_name?: string;
  user_mobile?: string;
  sport?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEnhancedBookingFlow, setShowEnhancedBookingFlow] = useState(false);
  
  const router = useRouter();
  const venueOwnerService = VenueOwnerService.getInstance();
  const authService = AuthService.getInstance();

  const statusFilters = [
    { key: 'all', label: 'All', count: 0, color: '#6b7280' },
    { key: 'pending', label: 'Pending', count: 0, color: '#f59e0b' },
    { key: 'confirmed', label: 'Confirmed', count: 0, color: '#3b82f6' },
    { key: 'completed', label: 'Completed', count: 0, color: '#10b981' },
    { key: 'cancelled', label: 'Cancelled', count: 0, color: '#ef4444' },
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedStatus]);

  const loadBookings = async () => {
    try {
      // Check if user is authenticated and is venue owner
      if (!authService.isAuthenticated() || !authService.isVenueOwner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue owner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Fetch bookings from API
      const filterStatus = selectedStatus === 'all' ? undefined : selectedStatus;
      const bookingsData = await venueOwnerService.getBookings(undefined, filterStatus, undefined, undefined, 0, 50);
      setBookings(bookingsData);

      // Also load venues for booking creation
      const venuesData = await venueOwnerService.getVenues(0, 50, true); // Only active venues
      
      // Sort venues alphabetically
      const sortedVenues = Array.isArray(venuesData) ? venuesData.sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      ) : [];
      
      setVenues(sortedVenues);

      // Update status counts
      statusFilters.forEach(filter => {
        if (filter.key === 'all') {
          filter.count = bookingsData.length;
        } else {
          filter.count = bookingsData.filter(booking => booking.status === filter.key).length;
        }
      });
    } catch (error) {
      console.error('Error loading bookings:', error);
      
      Alert.alert(
        'Error', 
        'Failed to load bookings. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadBookings() },
          { text: 'Cancel' }
        ]
      );
      
      setBookings([]);
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
    if (!bookings || !Array.isArray(bookings)) {
      return [];
    }
    if (selectedStatus === 'all') {
      return bookings;
    }
    return bookings.filter(booking => booking?.status === selectedStatus);
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

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await venueOwnerService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: newStatus }
          : booking
      ));

      Alert.alert('Success', `Booking ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return VenueOwnerService.formatCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return VenueOwnerService.formatDate(dateString);
  };

  const getStatusColor = (status: string) => {
    const filter = statusFilters.find(f => f.key === status);
    return filter?.color || '#6b7280';
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending': return 'rgba(245, 158, 11, 0.1)';
      case 'confirmed': return 'rgba(59, 130, 246, 0.1)';
      case 'completed': return 'rgba(16, 185, 129, 0.1)';
      case 'cancelled': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const getBookingActions = (booking: Booking) => {
    switch (booking.status) {
      case 'pending':
        return [
          { key: 'confirm', label: 'Confirm', color: '#3b82f6', icon: 'checkmark-circle' },
          { key: 'cancel', label: 'Cancel', color: '#ef4444', icon: 'close-circle' },
        ];
      case 'confirmed':
        return [
          { key: 'complete', label: 'Complete', color: '#10b981', icon: 'checkmark-done' },
          { key: 'cancel', label: 'Cancel', color: '#ef4444', icon: 'close-circle' },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const filteredBookings = getFilteredBookings();

  const handleAddBooking = () => {
    setShowEnhancedBookingFlow(true);
  };

  const handleBookingCreated = () => {
    loadBookings(); // Refresh the bookings list
  };



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
              <Text style={styles.greeting}>Bookings</Text>
              <Text style={styles.subtitle}>{bookings.length} total bookings</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddBooking}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
              {statusFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.statCard,
                    selectedStatus === filter.key && styles.statCardActive,
                    index === 0 && styles.firstStat
                  ]}
                  onPress={() => setSelectedStatus(filter.key)}
                >
                  <View style={styles.statContent}>
                    <Text style={[
                      styles.statCount,
                      { color: selectedStatus === filter.key ? '#ffffff' : filter.color }
                    ]}>
                      {filter.count}
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: selectedStatus === filter.key ? 'rgba(255,255,255,0.8)' : '#6b7280' }
                    ]}>
                      {filter.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Bookings List */}
          <View style={styles.bookingsSection}>
            {filteredBookings && Array.isArray(filteredBookings) && filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <TouchableOpacity
                  key={booking?.id || index}
                  style={styles.bookingCard}
                  onPress={() => handleBookingAction(booking, 'details')}
                  activeOpacity={0.8}
                >
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9' }}
                  style={styles.bookingImageBackground}
                  imageStyle={styles.bookingImage}
                >
                  <View style={styles.bookingOverlay} />
                  
                  {/* Status Badge */}
                  <View style={styles.statusBadgeContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBgColor(booking.status), borderColor: getStatusColor(booking.status) }
                    ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                        {booking.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Booking Header */}
                  <View style={styles.bookingHeader}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.venueName} numberOfLines={1}>{booking.venue_name}</Text>
                      <Text style={styles.playerName} numberOfLines={1}>{booking.user_name}</Text>
                    </View>
                    
                    <View style={styles.bookingAmount}>
                      <Text style={styles.amountText}>{formatCurrency(booking.total_amount)}</Text>
                    </View>
                  </View>
                </ImageBackground>

                {/* Booking Details */}
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{formatDate(booking.booking_date)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{booking.start_time} - {booking.end_time}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="basketball" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{booking.sport}</Text>
                    </View>
                  </View>

                  {/* Payment Status */}
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentStatus}>
                      <Ionicons 
                        name={booking.payment_status === 'paid' ? 'checkmark-circle' : 'time'} 
                        size={16} 
                        color={booking.payment_status === 'paid' ? '#10b981' : '#f59e0b'} 
                      />
                      <Text style={[
                        styles.paymentText,
                        { color: booking.payment_status === 'paid' ? '#10b981' : '#f59e0b' }
                      ]}>
                        {booking.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {getBookingActions(booking) && Array.isArray(getBookingActions(booking)) && getBookingActions(booking).length > 0 && (
                    <View style={styles.actionsContainer}>
                      {getBookingActions(booking).map((action) => (
                        <TouchableOpacity
                          key={action?.key || Math.random()}
                          style={[styles.actionButton, { borderColor: action?.color || '#9ca3af' }]}
                          onPress={() => handleBookingAction(booking, action?.key)}
                        >
                          <Ionicons name={action?.icon as any} size={16} color={action?.color || '#9ca3af'} />
                          <Text style={[styles.actionText, { color: action?.color || '#9ca3af' }]}>
                            {action?.label || 'Action'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
            ) : null}

            {(!filteredBookings || filteredBookings.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No bookings found</Text>
                <Text style={styles.emptyStateText}>
                  {selectedStatus === 'all' 
                    ? 'You haven\'t received any bookings yet'
                    : `No ${selectedStatus} bookings found`
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Add some bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Enhanced Booking Flow */}
        <EnhancedBookingFlow
          visible={showEnhancedBookingFlow}
          onClose={() => setShowEnhancedBookingFlow(false)}
          venues={venues}
          onBookingCreated={handleBookingCreated}
        />

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
                <Text style={styles.modalSave}>Actions</Text>
              </TouchableOpacity>
            </View>
            {selectedBooking && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Booking Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Venue:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.venue_name}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Player:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.user_name}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Phone:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.user_mobile}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Sport:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.sport}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date:</Text>
                    <Text style={styles.detailsValue}>{formatDate(selectedBooking.booking_date)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Time:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.start_time} - {selectedBooking.end_time}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Duration:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.duration_hours} hours</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Amount:</Text>
                    <Text style={styles.detailsValue}>{formatCurrency(selectedBooking.total_amount)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status:</Text>
                    <Text style={[styles.detailsValue, { color: getStatusColor(selectedBooking.status) }]}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Payment:</Text>
                    <Text style={[
                      styles.detailsValue, 
                      { color: selectedBooking.payment_status === 'paid' ? '#10b981' : '#f59e0b' }
                    ]}>
                      {selectedBooking.payment_status.charAt(0).toUpperCase() + selectedBooking.payment_status.slice(1)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Venue Picker Modal */}
        <Modal
          visible={showVenuePickerModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowVenuePickerModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Select Venue</Text>
              <View style={{ width: 60 }} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {venues && venues.length > 0 ? (
                venues.map((venue, index) => (
                  <TouchableOpacity
                    key={venue.id || index}
                    style={[
                      styles.venueOption,
                      newBooking.venueId === venue.id && styles.venueOptionSelected
                    ]}
                    onPress={() => handleVenueSelection(venue)}
                  >
                    <View style={styles.venueOptionContent}>
                      <Text style={[
                        styles.venueOptionName,
                        newBooking.venueId === venue.id && styles.venueOptionNameSelected
                      ]}>
                        {venue.name}
                      </Text>
                      <Text style={[
                        styles.venueOptionDetails,
                        newBooking.venueId === venue.id && styles.venueOptionDetailsSelected
                      ]}>
                        {venue.sports_supported?.join(', ')} • ₹{venue.base_price_per_hour}/hr
                      </Text>
                      <Text style={[
                        styles.venueOptionAddress,
                        newBooking.venueId === venue.id && styles.venueOptionAddressSelected
                      ]}>
                        {venue.address}
                      </Text>
                    </View>
                    {newBooking.venueId === venue.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyVenueState}>
                  <Ionicons name="business-outline" size={48} color="#9ca3af" />
                  <Text style={styles.emptyVenueTitle}>No Venues Found</Text>
                  <Text style={styles.emptyVenueText}>
                    Please create a venue first to start booking.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <VenueOwnerBottomNavigation currentRoute="bookings" />
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
    backgroundColor: '#f5f6f7',
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  statsSection: {
    paddingVertical: 24,
    backgroundColor: '#f5f6f7',
  },
  statsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  firstStat: {
    marginLeft: 0,
  },
  statContent: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bookingsSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  bookingCard: {
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  bookingImageBackground: {
    height: 120,
    justifyContent: 'space-between',
  },
  bookingImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  bookingAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  bookingDetails: {
    padding: 20,
  },
  bookingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  paymentRow: {
    marginBottom: 16,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
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
  detailsSection: {
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 100,
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
    fontWeight: '500',
  },
  bookingTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#212529',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#ffffff',
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#f9fafb',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeInput: {
    flex: 1,
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    color: '#9ca3af',
  },
  venueSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueSelectorText: {
    fontSize: 16,
    color: '#212529',
  },
  venuePlaceholder: {
    color: '#9ca3af',
  },
  venueOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  venueOptionSelected: {
    backgroundColor: '#f0f9ff',
    borderBottomColor: '#10b981',
  },
  venueOptionContent: {
    flex: 1,
  },
  venueOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  venueOptionNameSelected: {
    color: '#10b981',
  },
  venueOptionDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  venueOptionDetailsSelected: {
    color: '#059669',
  },
  venueOptionAddress: {
    fontSize: 13,
    color: '#9ca3af',
  },
  venueOptionAddressSelected: {
    color: '#10b981',
  },
  emptyVenueState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyVenueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyVenueText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '700',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '800',
    flex: 2,
    textAlign: 'right',
  },
  actionInfoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  actionInfoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  // Enhanced booking form styles
  explanationBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledInputText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  sportSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  sportOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sportOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sportOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  datePlaceholder: {
    color: '#9ca3af',
  },
  amountDisplay: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '600',
  },
  totalAmountRow: {
    borderTopWidth: 1,
    borderTopColor: '#93c5fd',
    marginTop: 8,
    paddingTop: 8,
  },
  totalAmountLabel: {
    fontSize: 16,
    color: '#0c4a6e',
    fontWeight: '700',
  },
  totalAmountValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '800',
  },
  // Date picker styles
  datePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  datePicker: {
    backgroundColor: '#ffffff',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  datePickerButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  datePickerCancel: {
    backgroundColor: '#f1f5f9',
  },
  datePickerConfirm: {
    backgroundColor: '#3b82f6',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  datePickerConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  // Time selection styles
  timeSelectionContainer: {
    gap: 16,
  },
  timeSelectGroup: {
    gap: 8,
  },
  timeSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  timeDropdownContainer: {
    minHeight: 48,
  },
  timeScrollView: {
    flexGrow: 0,
  },
  timeScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  timeOption: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  timeOptionTextSelected: {
    color: '#ffffff',
  },
  noTimesContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noTimesText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeSelectionSummary: {
    marginTop: 16,
  },
  timeSummaryCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  timeSummaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    flex: 1,
  },
  timeDurationText: {
    fontSize: 14,
    color: '#3730a3',
    fontWeight: '500',
  },
});