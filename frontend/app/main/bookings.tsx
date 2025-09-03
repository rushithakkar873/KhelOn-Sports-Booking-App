import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
    // Mock data - replace with API call
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => Alert.alert('Filter', 'Filter options coming soon!')}
        >
          <Ionicons name="options-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabChip,
              selectedTab === tab && styles.tabChipActive
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              styles.tabChipText,
              selectedTab === tab && styles.tabChipTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      <ScrollView 
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.venueInfo}>
                <View style={styles.sportIcon}>
                  <Ionicons name={getSportIcon(booking.sport) as any} size={20} color="#000000" />
                </View>
                <View style={styles.venueDetails}>
                  <Text style={styles.venueName}>{booking.venueName}</Text>
                  <Text style={styles.venueLocation}>{booking.location}</Text>
                </View>
              </View>
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

            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>
                  {new Date(booking.date).toLocaleDateString('en-IN', { 
                    weekday: 'short', 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>{booking.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#6b7280" />
                <Text style={styles.detailText}>₹{booking.amount}</Text>
              </View>
            </View>

            <View style={styles.paymentStatus}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Payment: </Text>
                <Text style={[
                  styles.paymentStatusText,
                  { color: booking.paymentStatus === 'paid' ? '#10b981' : booking.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b' }
                ]}>
                  {booking.paymentStatus.toUpperCase()}
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

              {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.payButton]}
                  onPress={() => handleBookingAction(booking, 'pay')}
                >
                  <Text style={[styles.actionButtonText, styles.payButtonText]}>Pay Now</Text>
                </TouchableOpacity>
              )}

              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleBookingAction(booking, 'cancel')}
                >
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
              )}

              {booking.status === 'completed' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rebookButton]}
                  onPress={() => handleBookingAction(booking, 'rebook')}
                >
                  <Text style={[styles.actionButtonText, styles.rebookButtonText]}>Book Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No bookings found</Text>
            <Text style={styles.emptyStateText}>
              {selectedTab === 'All' 
                ? "You haven't made any bookings yet"
                : `No ${selectedTab.toLowerCase()} bookings`
              }
            </Text>
            <TouchableOpacity 
              style={styles.browseVenuesButton}
              onPress={() => router.push('/main/venues')}
            >
              <Text style={styles.browseVenuesButtonText}>Browse Venues</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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