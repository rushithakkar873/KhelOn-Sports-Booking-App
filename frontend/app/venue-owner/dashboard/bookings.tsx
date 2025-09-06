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
  image: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
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

  const loadBookings = async () => {
    try {
      // Mock data with professional images
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
          createdAt: '2025-01-10T14:30:00Z',
          image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9',
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
          createdAt: '2025-01-11T10:15:00Z',
          image: 'https://images.unsplash.com/photo-1724500760032-b2eb510e59c4',
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
          createdAt: '2025-01-09T16:45:00Z',
          image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9',
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
          createdAt: '2025-01-08T11:20:00Z',
          image: 'https://images.pexels.com/photos/8533631/pexels-photo-8533631.jpeg',
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
          createdAt: '2025-01-12T09:30:00Z',
          image: 'https://images.unsplash.com/photo-1724500760032-b2eb510e59c4',
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

  const handleSubmitBooking = () => {
    // Validate form
    if (!newBooking.venueName.trim() || !newBooking.playerName.trim() || 
        !newBooking.bookingDate || !newBooking.startTime || !newBooking.endTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Create new booking
    const booking: Booking = {
      id: Date.now().toString(),
      venueName: newBooking.venueName,
      playerName: newBooking.playerName,
      playerPhone: newBooking.playerPhone,
      sport: newBooking.sport,
      bookingDate: newBooking.bookingDate,
      startTime: newBooking.startTime,
      endTime: newBooking.endTime,
      duration: 1, // Calculate based on time difference
      totalAmount: parseInt(newBooking.totalAmount) || 0,
      status: newBooking.type === 'block' ? 'cancelled' : 'confirmed',
      paymentStatus: newBooking.type === 'block' ? 'refunded' : 'paid',
      createdAt: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9', // Default image
    };

    setBookings([booking, ...bookings]);
    setShowAddBookingModal(false);
    Alert.alert('Success', `${newBooking.type === 'block' ? 'Time slot blocked' : 'Booking added'} successfully!`);
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
            {filteredBookings.map((booking, index) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => handleBookingAction(booking, 'details')}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={{ uri: booking.image }}
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
                      <Text style={styles.venueName} numberOfLines={1}>{booking.venueName}</Text>
                      <Text style={styles.playerName} numberOfLines={1}>{booking.playerName}</Text>
                    </View>
                    
                    <View style={styles.bookingAmount}>
                      <Text style={styles.amountText}>{formatCurrency(booking.totalAmount)}</Text>
                    </View>
                  </View>
                </ImageBackground>

                {/* Booking Details */}
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{formatDate(booking.bookingDate)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={16} color="#6b7280" />
                      <Text style={styles.metaText}>{booking.startTime} - {booking.endTime}</Text>
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
                        name={booking.paymentStatus === 'paid' ? 'checkmark-circle' : 'time'} 
                        size={16} 
                        color={booking.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'} 
                      />
                      <Text style={[
                        styles.paymentText,
                        { color: booking.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }
                      ]}>
                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  {getBookingActions(booking).length > 0 && (
                    <View style={styles.actionsContainer}>
                      {getBookingActions(booking).map((action) => (
                        <TouchableOpacity
                          key={action.key}
                          style={[styles.actionButton, { borderColor: action.color }]}
                          onPress={() => handleBookingAction(booking, action.key)}
                        >
                          <Ionicons name={action.icon as any} size={16} color={action.color} />
                          <Text style={[styles.actionText, { color: action.color }]}>
                            {action.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {filteredBookings.length === 0 && (
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
                    <Text style={styles.detailsValue}>{selectedBooking.venueName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Player:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.playerName}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Phone:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.playerPhone}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Sport:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.sport}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date:</Text>
                    <Text style={styles.detailsValue}>{formatDate(selectedBooking.bookingDate)}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Time:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.startTime} - {selectedBooking.endTime}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Duration:</Text>
                    <Text style={styles.detailsValue}>{selectedBooking.duration} hours</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Amount:</Text>
                    <Text style={styles.detailsValue}>{formatCurrency(selectedBooking.totalAmount)}</Text>
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
                      { color: selectedBooking.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }
                    ]}>
                      {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
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
  statsSection: {
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statsContainer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
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
    padding: 20,
  },
  bookingInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  bookingAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
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
});