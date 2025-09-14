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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenueOwnerBottomNavigation from '../../../components/VenueOwnerBottomNavigation';
import VenueOwnerService from '../../../services/venueOwnerService';
import AuthService from '../../../services/authService';

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
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showVenuePickerModal, setShowVenuePickerModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    venueId: '',
    venueName: '',
    playerName: '',
    playerPhone: '',
    sport: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    totalAmount: '',
    type: 'manual' as 'manual' | 'block',
  });
  
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
      setVenues(venuesData);

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
    setShowAddBookingModal(true);
    setNewBooking({
      venueId: '',
      venueName: '',
      playerName: '',
      playerPhone: '',
      sport: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      totalAmount: '',
      type: 'manual',
    });
  };

  const handleSubmitBooking = async () => {
    // Validate form
    if (!newBooking.venueId || !newBooking.playerName.trim() || 
        !newBooking.bookingDate || !newBooking.startTime || !newBooking.endTime || !newBooking.playerPhone.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate Indian mobile number format
    const mobilePattern = /^\+91[6-9]\d{9}$/;
    let playerMobile = newBooking.playerPhone.trim();
    
    // Auto-format mobile number if needed
    if (playerMobile.match(/^[6-9]\d{9}$/)) {
      playerMobile = `+91${playerMobile}`;
    }
    
    if (!mobilePattern.test(playerMobile)) {
      Alert.alert('Error', 'Please enter a valid Indian mobile number (+91XXXXXXXXXX or 10 digits)');
      return;
    }

    setIsSubmitting(true);

    try {
      if (newBooking.type === 'block') {
        // For blocking slots, create a mock cancelled booking
        const booking: Booking = {
          id: Date.now().toString(),
          venue_name: venues.find(v => v.id === newBooking.venueId)?.name || 'Unknown Venue',
          user_name: 'BLOCKED',
          user_mobile: playerMobile,
          sport: newBooking.sport,
          booking_date: newBooking.bookingDate,
          start_time: newBooking.startTime,
          end_time: newBooking.endTime,
          duration_hours: calculateDurationHours(newBooking.startTime, newBooking.endTime),
          total_amount: 0,
          status: 'cancelled',
          payment_status: 'refunded',
          created_at: new Date().toISOString(),
        };

        setBookings([booking, ...bookings]);
        setShowAddBookingModal(false);
        Alert.alert('Success', 'Time slot blocked successfully!');
      } else {
        // Create real booking using API
        const bookingData = {
          venue_id: newBooking.venueId,
          player_mobile: playerMobile,
          player_name: newBooking.playerName,
          booking_date: newBooking.bookingDate,
          start_time: newBooking.startTime,
          end_time: newBooking.endTime,
          sport: newBooking.sport,
          notes: `Manual booking by venue owner`
        };

        const response = await venueOwnerService.createBooking(bookingData);
        
        // Show success message with payment link
        Alert.alert(
          'Booking Created Successfully! 🎉',
          `Payment link sent to ${playerMobile}\n\nAmount: ₹${response.total_amount}\nSMS Status: ${response.sms_status}\n\nPlayer will receive payment link via SMS to complete the booking.`,
          [
            {
              text: 'Copy Payment Link',
              onPress: () => {
                // In a real app, you'd use Clipboard API
                console.log('Payment Link:', response.payment_link);
              }
            },
            { text: 'OK', style: 'default' }
          ]
        );

        // Refresh bookings list
        await loadBookings();
        setShowAddBookingModal(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDurationHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    return Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
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

        {/* Add Booking Modal */}
        <Modal
          visible={showAddBookingModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <KeyboardAvoidingView 
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddBookingModal(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Booking</Text>
                <TouchableOpacity onPress={handleSubmitBooking} disabled={isSubmitting}>
                  <Text style={[styles.modalSave, isSubmitting && styles.modalSaveDisabled]}>
                    {isSubmitting ? 'Creating...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.bookingTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newBooking.type === 'manual' && styles.typeButtonActive
                    ]}
                    onPress={() => setNewBooking({ ...newBooking, type: 'manual' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newBooking.type === 'manual' && styles.typeButtonTextActive
                    ]}>
                      Manual Booking
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      newBooking.type === 'block' && styles.typeButtonActive
                    ]}
                    onPress={() => setNewBooking({ ...newBooking, type: 'block' })}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      newBooking.type === 'block' && styles.typeButtonTextActive
                    ]}>
                      Block Slot
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Venue *</Text>
                  <TouchableOpacity
                    style={[styles.formInput, styles.venueSelector]}
                    onPress={() => setShowVenuePickerModal(true)}
                  >
                    <Text style={[
                      styles.venueSelectorText, 
                      !newBooking.venueName && styles.venuePlaceholder
                    ]}>
                      {newBooking.venueName || 'Select a venue'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                {newBooking.type === 'manual' && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Player Name *</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newBooking.playerName}
                        onChangeText={(text) => setNewBooking({ ...newBooking, playerName: text })}
                        placeholder="Enter player name"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Phone Number</Text>
                      <TextInput
                        style={styles.formInput}
                        value={newBooking.playerPhone}
                        onChangeText={(text) => setNewBooking({ ...newBooking, playerPhone: text })}
                        placeholder="Enter phone number"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Sport</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newBooking.sport}
                    onChangeText={(text) => setNewBooking({ ...newBooking, sport: text })}
                    placeholder="Enter sport"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Booking Date *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newBooking.bookingDate}
                    onChangeText={(text) => setNewBooking({ ...newBooking, bookingDate: text })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Text style={styles.formLabel}>Start Time *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newBooking.startTime}
                      onChangeText={(text) => setNewBooking({ ...newBooking, startTime: text })}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  
                  <View style={styles.timeInput}>
                    <Text style={styles.formLabel}>End Time *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newBooking.endTime}
                      onChangeText={(text) => setNewBooking({ ...newBooking, endTime: text })}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {newBooking.type === 'manual' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Total Amount</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newBooking.totalAmount}
                      onChangeText={(text) => setNewBooking({ ...newBooking, totalAmount: text })}
                      placeholder="Enter amount"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

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
});