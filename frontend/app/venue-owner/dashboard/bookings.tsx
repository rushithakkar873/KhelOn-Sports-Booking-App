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
  image: string;
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

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#212529';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'rgba(245, 158, 11, 0.1)';
      case 'confirmed':
        return 'rgba(33, 37, 41, 0.1)';
      case 'completed':
        return 'rgba(16, 185, 129, 0.1)';
      case 'cancelled':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(156, 163, 175, 0.1)';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const filteredBookings = getFilteredBookings();

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
            <View>
              <Text style={styles.greeting}>Bookings</Text>
              <Text style={styles.subtitle}>{bookings.length} total bookings</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons name="list" size={16} color={viewMode === 'list' ? '#ffffff' : '#9ca3af'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
                onPress={() => setViewMode('calendar')}
              >
                <Ionicons name="calendar" size={16} color={viewMode === 'calendar' ? '#ffffff' : '#9ca3af'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Filters */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
              {statusFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedStatus === filter.key && styles.filterButtonActive,
                    index === 0 && styles.firstFilter
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
          </View>

          {/* Bookings List */}
          <View style={styles.section}>
            {filteredBookings.map((booking, index) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => handleBookingAction(booking, 'details')}
              >
                <ImageBackground
                  source={{ uri: booking.image }}
                  style={styles.bookingImage}
                  imageStyle={styles.bookingImageStyle}
                >
                  <View style={styles.bookingOverlay} />
                  <View style={styles.bookingContent}>
                    {/* Status Badge */}
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

                    {/* Booking Info */}
                    <View style={styles.bookingInfo}>
                      <Text style={styles.venueName}>{booking.venueName}</Text>
                      <Text style={styles.playerName}>{booking.playerName}</Text>
                      <Text style={styles.sportName}>{booking.sport}</Text>
                      
                      <View style={styles.bookingMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.metaText}>
                            {formatDate(booking.bookingDate)}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time" size={12} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.metaText}>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>{formatCurrency(booking.totalAmount)}</Text>
                        <View style={[
                          styles.paymentBadge,
                          { backgroundColor: booking.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 
                            booking.paymentStatus === 'refunded' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)' }
                        ]}>
                          <Text style={[
                            styles.paymentText,
                            { color: booking.paymentStatus === 'paid' ? '#10b981' : 
                              booking.paymentStatus === 'refunded' ? '#ef4444' : '#f59e0b' }
                          ]}>
                            {booking.paymentStatus.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ImageBackground>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                  {booking.status === 'pending' && (
                    <>
                      <TouchableOpacity 
                        style={styles.primaryAction}
                        onPress={() => handleBookingAction(booking, 'confirm')}
                      >
                        <Text style={styles.primaryActionText}>Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.secondaryAction}
                        onPress={() => handleBookingAction(booking, 'cancel')}
                      >
                        <Text style={styles.secondaryActionText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <TouchableOpacity 
                      style={styles.primaryAction}
                      onPress={() => handleBookingAction(booking, 'complete')}
                    >
                      <Text style={styles.primaryActionText}>Mark Complete</Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === 'completed' && (
                    <TouchableOpacity 
                      style={styles.secondaryAction}
                      onPress={() => handleBookingAction(booking, 'details')}
                    >
                      <Text style={styles.secondaryActionText}>View Details</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {filteredBookings.length === 0 && (
              <View style={styles.emptyState}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1633526543814-9718c8922b7a' }}
                  style={styles.emptyStateImage}
                  imageStyle={styles.emptyStateImageStyle}
                >
                  <View style={styles.emptyStateOverlay} />
                  <View style={styles.emptyStateContent}>
                    <Ionicons name="calendar-outline" size={48} color="#ffffff" />
                    <Text style={styles.emptyStateTitle}>No bookings found</Text>
                    <Text style={styles.emptyStateText}>
                      {selectedStatus === 'all' 
                        ? 'You don\'t have any bookings yet'
                        : `No ${selectedStatus} bookings at the moment`
                      }
                    </Text>
                  </View>
                </ImageBackground>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f6f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#212529',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filtersContainer: {
    paddingLeft: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f6f7',
  },
  firstFilter: {
    marginLeft: 0,
  },
  filterButtonActive: {
    backgroundColor: '#212529',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  bookingCard: {
    marginBottom: 24,
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
  bookingImage: {
    height: 200,
    justifyContent: 'space-between',
  },
  bookingImageStyle: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bookingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bookingContent: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookingInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  sportName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    fontWeight: '600',
  },
  bookingMeta: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#212529',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryActionText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 300,
  },
  emptyStateImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateImageStyle: {
    borderRadius: 24,
  },
  emptyStateOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    color: '#9ca3af',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalAction: {
    fontSize: 16,
    color: '#212529',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailsLabel: {
    fontSize: 14,
    color: '#9ca3af',
    width: 80,
  },
  detailsValue: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
    fontWeight: '500',
  },
});