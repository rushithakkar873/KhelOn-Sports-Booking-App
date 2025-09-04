import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Booking {
  id: string;
  venueName: string;
  sport: string;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  paymentStatus: 'paid' | 'pending' | 'failed';
  location: string;
  image: string;
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  const tabs = ['All', 'Upcoming', 'Completed', 'Cancelled'];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [selectedTab, bookings]);

  const loadBookings = async () => {
    // Mock data with professional images
    const mockBookings: Booking[] = [
      {
        id: '1',
        venueName: 'Elite Cricket Ground',
        sport: 'Cricket',
        date: '2025-01-18',
        time: '18:00 - 20:00',
        duration: 2,
        amount: 2400,
        status: 'confirmed',
        paymentStatus: 'paid',
        location: 'Andheri, Mumbai',
        image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9',
      },
      {
        id: '2',
        venueName: 'SportZone Arena',
        sport: 'Badminton',
        date: '2025-01-20',
        time: '08:00 - 09:00',
        duration: 1,
        amount: 800,
        status: 'pending',
        paymentStatus: 'pending',
        location: 'Koramangala, Bangalore',
        image: 'https://images.pexels.com/photos/8533631/pexels-photo-8533631.jpeg',
      },
      {
        id: '3',
        venueName: 'Champions Football Club',
        sport: 'Football',
        date: '2025-01-15',
        time: '19:00 - 20:00',
        duration: 1,
        amount: 1000,
        status: 'completed',
        paymentStatus: 'paid',
        location: 'Connaught Place, Delhi',
        image: 'https://images.unsplash.com/photo-1724500760032-b2eb510e59c4',
      },
      {
        id: '4',
        venueName: 'Ace Tennis Club',
        sport: 'Tennis',
        date: '2025-01-12',
        time: '07:00 - 08:00',
        duration: 1,
        amount: 600,
        status: 'cancelled',
        paymentStatus: 'failed',
        location: 'Banjara Hills, Hyderabad',
        image: 'https://images.pexels.com/photos/3067481/pexels-photo-3067481.jpeg',
      },
      {
        id: '5',
        venueName: 'Hoops Basketball Arena',
        sport: 'Basketball',
        date: '2025-01-22',
        time: '20:00 - 21:00',
        duration: 1,
        amount: 500,
        status: 'confirmed',
        paymentStatus: 'paid',
        location: 'Electronic City, Bangalore',
        image: 'https://images.unsplash.com/photo-1676315636766-7b129985c537',
      },
    ];

    setBookings(mockBookings);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (selectedTab !== 'All') {
      const today = new Date();
      
      switch (selectedTab) {
        case 'Upcoming':
          filtered = bookings.filter(booking => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= today && (booking.status === 'confirmed' || booking.status === 'pending');
          });
          break;
        case 'Completed':
          filtered = bookings.filter(booking => booking.status === 'completed');
          break;
        case 'Cancelled':
          filtered = bookings.filter(booking => booking.status === 'cancelled');
          break;
      }
    }

    setFilteredBookings(filtered);
  };

  const handleBookingAction = (booking: Booking, action: string) => {
    switch (action) {
      case 'cancel':
        Alert.alert(
          'Cancel Booking',
          `Are you sure you want to cancel this booking for ${booking.venueName}?`,
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Yes, Cancel', 
              style: 'destructive',
              onPress: () => {
                // Update booking status
                setBookings(bookings.map(b => 
                  b.id === booking.id 
                    ? { ...b, status: 'cancelled' as const }
                    : b
                ));
                Alert.alert('Success', 'Booking cancelled successfully');
              }
            }
          ]
        );
        break;
      case 'rebook':
        Alert.alert(
          'Rebook Venue',
          `Would you like to book ${booking.venueName} again?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Book Again', onPress: () => Alert.alert('Redirect', 'Redirecting to booking...') }
          ]
        );
        break;
      case 'details':
        Alert.alert('Booking Details', `Venue: ${booking.venueName}\nDate: ${booking.date}\nTime: ${booking.time}\nAmount: ₹${booking.amount}`);
        break;
      case 'pay':
        Alert.alert('Payment', `Pay ₹${booking.amount} for ${booking.venueName}?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pay Now', 
            onPress: () => {
              setBookings(bookings.map(b => 
                b.id === booking.id 
                  ? { ...b, paymentStatus: 'paid' as const, status: 'confirmed' as const }
                  : b
              ));
              Alert.alert('Success', 'Payment completed successfully');
            }
          }
        ]);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#000000';
      case 'pending':
        return '#f59e0b';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#f3f4f6';
      case 'pending':
        return '#fef3c7';
      case 'completed':
        return '#d1fae5';
      case 'cancelled':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'cricket':
        return 'baseball-outline';
      case 'football':
        return 'football-outline';
      case 'badminton':
        return 'tennisball-outline';
      case 'tennis':
        return 'tennisball-outline';
      case 'basketball':
        return 'basketball-outline';
      default:
        return 'fitness-outline';
    }
  };

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
              <Text style={styles.greeting}>My Bookings</Text>
              <Text style={styles.subtitle}>Track your reservations</Text>
            </View>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => Alert.alert('Calendar', 'Calendar view coming soon!')}
            >
              <Ionicons name="calendar-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Status Tabs */}
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    selectedTab === tab && styles.tabActive,
                    index === 0 && styles.firstTab
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[
                    styles.tabText,
                    selectedTab === tab && styles.tabTextActive
                  ]}>
                    {tab}
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
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.locationText}>{booking.location}</Text>
                      </View>
                      
                      <View style={styles.bookingMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.metaText}>
                            {new Date(booking.date).toLocaleDateString('en-IN', { 
                              weekday: 'short', 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="time" size={14} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.metaText}>{booking.time}</Text>
                        </View>
                      </View>

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>₹{booking.amount}</Text>
                        <View style={[
                          styles.paymentBadge,
                          { backgroundColor: booking.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 
                            booking.paymentStatus === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)' }
                        ]}>
                          <Text style={[
                            styles.paymentText,
                            { color: booking.paymentStatus === 'paid' ? '#10b981' : 
                              booking.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b' }
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
                  {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                    <TouchableOpacity 
                      style={styles.primaryAction}
                      onPress={() => handleBookingAction(booking, 'pay')}
                    >
                      <Text style={styles.primaryActionText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}

                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <TouchableOpacity 
                      style={styles.secondaryAction}
                      onPress={() => handleBookingAction(booking, 'cancel')}
                    >
                      <Text style={styles.secondaryActionText}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === 'completed' && (
                    <TouchableOpacity 
                      style={styles.primaryAction}
                      onPress={() => handleBookingAction(booking, 'rebook')}
                    >
                      <Text style={styles.primaryActionText}>Book Again</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {filteredBookings.length === 0 && (
              <View style={styles.emptyState}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1435527173128-983b87201f4d' }}
                  style={styles.emptyStateImage}
                  imageStyle={styles.emptyStateImageStyle}
                >
                  <View style={styles.emptyStateOverlay} />
                  <View style={styles.emptyStateContent}>
                    <Ionicons name="calendar-outline" size={48} color="#ffffff" />
                    <Text style={styles.emptyStateTitle}>No bookings found</Text>
                    <Text style={styles.emptyStateText}>
                      {selectedTab === 'All' 
                        ? "You haven't made any bookings yet"
                        : `No ${selectedTab.toLowerCase()} bookings`
                      }
                    </Text>
                    <TouchableOpacity 
                      style={styles.browseButton}
                      onPress={() => router.push('/main/venues')}
                    >
                      <Text style={styles.browseButtonText}>Browse Venues</Text>
                      <Ionicons name="arrow-forward" size={16} color="#212529" />
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabsContent: {
    paddingHorizontal: 24,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  tabChipActive: {
    backgroundColor: '#000000',
  },
  tabChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  bookingCard: {
    backgroundColor: '#f9fafb',
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
  venueInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  sportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#6b7280',
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
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  paymentStatus: {
    marginBottom: 16,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  payButton: {
    backgroundColor: '#000000',
  },
  payButtonText: {
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
  rebookButton: {
    backgroundColor: '#000000',
  },
  rebookButtonText: {
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseVenuesButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseVenuesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});