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
  location: string;
  date: string;
  timeSlot: string;
  duration: number;
  amount: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  bookingDate: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const router = useRouter();

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', icon: 'time-outline' },
    { key: 'completed', label: 'Completed', icon: 'checkmark-circle-outline' },
    { key: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
  ];

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
        venueName: 'SportZone Arena',
        sport: 'Badminton',
        location: 'Koramangala, Bangalore',
        date: '2025-01-28',
        timeSlot: '18:00 - 19:00',
        duration: 1,
        amount: 800,
        status: 'upcoming',
        bookingDate: '2025-01-20',
        paymentStatus: 'paid',
      },
      {
        id: '2',
        venueName: 'Elite Cricket Ground',
        sport: 'Cricket',
        location: 'Andheri, Mumbai',
        date: '2025-01-30',
        timeSlot: '14:00 - 17:00',
        duration: 3,
        amount: 3600,
        status: 'upcoming',
        bookingDate: '2025-01-21',
        paymentStatus: 'paid',
      },
      {
        id: '3',
        venueName: 'Ace Tennis Club',
        sport: 'Tennis',
        location: 'Banjara Hills, Hyderabad',
        date: '2025-01-15',
        timeSlot: '07:00 - 08:00',
        duration: 1,
        amount: 600,
        status: 'completed',
        bookingDate: '2025-01-10',
        paymentStatus: 'paid',
      },
      {
        id: '4',
        venueName: 'Champions Football Club',
        sport: 'Football',
        location: 'Connaught Place, Delhi',
        date: '2025-01-12',
        timeSlot: '19:00 - 20:00',
        duration: 1,
        amount: 1000,
        status: 'cancelled',
        bookingDate: '2025-01-08',
        paymentStatus: 'paid',
      },
      {
        id: '5',
        venueName: 'Hoops Basketball Arena',
        sport: 'Basketball',
        location: 'Electronic City, Bangalore',
        date: '2025-02-02',
        timeSlot: '20:00 - 21:00',
        duration: 1,
        amount: 500,
        status: 'upcoming',
        bookingDate: '2025-01-22',
        paymentStatus: 'pending',
      },
    ];
    
    setBookings(mockBookings);
  };

  const filterBookings = () => {
    const filtered = bookings.filter(booking => booking.status === selectedTab);
    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Update booking status to cancelled
            setBookings(prev => 
              prev.map(booking => 
                booking.id === bookingId 
                  ? { ...booking, status: 'cancelled' as const }
                  : booking
              )
            );
            Alert.alert('Success', 'Booking cancelled successfully');
          },
        },
      ]
    );
  };

  const handleRebook = (booking: Booking) => {
    router.push('/main/venues');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#FF6B35';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#666666';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/main/venues')}
        >
          <Ionicons name="add" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? '#FF6B35' : '#666666'} 
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      <ScrollView 
        style={styles.bookingsList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No {selectedTab} bookings</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedTab === 'upcoming' 
                ? 'Book a venue to see your upcoming reservations'
                : `You don't have any ${selectedTab} bookings yet`
              }
            </Text>
            {selectedTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => router.push('/main/venues')}
              >
                <Text style={styles.emptyStateButtonText}>Book Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingIcon}>
                  <Ionicons name="location-outline" size={20} color="#FF6B35" />
                </View>
                <View style={styles.bookingStatus}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: getStatusColor(booking.status) }
                    ]} 
                  />
                  <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.bookingContent}>
                <Text style={styles.venueName}>{booking.venueName}</Text>
                <Text style={styles.venueLocation}>{booking.location}</Text>
                
                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="fitness-outline" size={16} color="#666666" />
                      <Text style={styles.detailText}>{booking.sport}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color="#666666" />
                      <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="time-outline" size={16} color="#666666" />
                      <Text style={styles.detailText}>{booking.timeSlot}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="hourglass-outline" size={16} color="#666666" />
                      <Text style={styles.detailText}>{booking.duration}h</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.amountText}>₹{booking.amount}</Text>
                    <View style={styles.paymentStatus}>
                      <View 
                        style={[
                          styles.paymentDot, 
                          { backgroundColor: getPaymentStatusColor(booking.paymentStatus) }
                        ]} 
                      />
                      <Text style={styles.paymentStatusText}>
                        {booking.paymentStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingActions}>
                    {booking.status === 'upcoming' && (
                      <>
                        {booking.paymentStatus === 'pending' && (
                          <TouchableOpacity style={styles.payButton}>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={() => handleCancelBooking(booking.id)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    
                    {booking.status === 'completed' && (
                      <TouchableOpacity 
                        style={styles.rebookButton}
                        onPress={() => handleRebook(booking)}
                      >
                        <Text style={styles.rebookButtonText}>Book Again</Text>
                      </TouchableOpacity>
                    )}
                    
                    {booking.status === 'cancelled' && (
                      <TouchableOpacity 
                        style={styles.rebookButton}
                        onPress={() => handleRebook(booking)}
                      >
                        <Text style={styles.rebookButtonText}>Rebook</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FFF4F0',
    borderColor: '#FF6B35',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#FF6B35',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 0,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  bookingContent: {
    padding: 16,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  bookingDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paymentInfo: {
    alignItems: 'flex-start',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  payButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  rebookButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rebookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});