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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenuePartnerService from '../../../services/venuePartnerService';
import AuthService from '../../../services/authService';
import EnhancedBookingFlow from '../../../components/EnhancedBookingFlow';

const { width } = Dimensions.get('window');

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
  player_name: string;
  player_phone: string;
  notes?: string;
  created_at: string;
}

interface FilterOptions {
  status: string;
  venue: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
  sport: string;
  paymentStatus: string;
}

export default function EnhancedBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showEnhancedBookingFlow, setShowEnhancedBookingFlow] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    venue: 'all',
    dateRange: 'all',
    sport: 'all',
    paymentStatus: 'all',
  });
  
  const router = useRouter();
  const venuePartnerService = VenuePartnerService.getInstance();
  const authService = AuthService.getInstance();

  const statusOptions = [
    { key: 'all', label: 'All Status', color: '#6b7280' },
    { key: 'pending', label: 'Pending', color: '#f59e0b' },
    { key: 'confirmed', label: 'Confirmed', color: '#3b82f6' },
    { key: 'completed', label: 'Completed', color: '#10b981' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];

  const paymentStatusOptions = [
    { key: 'all', label: 'All Payments' },
    { key: 'pending', label: 'Payment Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'refunded', label: 'Refunded' },
  ];

  const dateRangeOptions = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  const sportsOptions = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball'];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, filters]);

  const loadBookings = async () => {
    try {
      if (!authService.isAuthenticated() || !authService.isVenueOwner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue owner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Fetch bookings and venues
      const [bookingsData, venuesData] = await Promise.all([
        venuePartnerService.getBookings(undefined, undefined, undefined, undefined, 0, 100),
        venuePartnerService.getVenues(0, 50, true)
      ]);
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setVenues(Array.isArray(venuesData) ? venuesData : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.player_name.toLowerCase().includes(query) ||
        booking.player_phone.includes(query) ||
        booking.venue_name?.toLowerCase().includes(query) ||
        booking.sport?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Venue filter
    if (filters.venue !== 'all') {
      filtered = filtered.filter(booking => booking.venue_name === filters.venue);
    }

    // Payment status filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === filters.paymentStatus);
    }

    // Sport filter
    if (filters.sport !== 'all') {
      filtered = filtered.filter(booking => booking.sport === filters.sport);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        switch (filters.dateRange) {
          case 'today':
            return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'week':
            const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return bookingDate >= weekStart;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return bookingDate >= monthStart;
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedBookings.length === 0) {
      Alert.alert('No Selection', 'Please select bookings to perform bulk actions.');
      return;
    }

    const actionName = action === 'confirm' ? 'confirm' : action === 'cancel' ? 'cancel' : 'complete';
    
    Alert.alert(
      `Bulk ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`,
      `Are you sure you want to ${actionName} ${selectedBookings.length} booking(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              // Update each selected booking
              await Promise.all(
                selectedBookings.map(bookingId => 
                  venuePartnerService.updateBookingStatus(bookingId, action as any)
                )
              );
              
              // Update local state
              setBookings(bookings.map(booking => 
                selectedBookings.includes(booking.id) 
                  ? { ...booking, status: action as any }
                  : booking
              ));
              
              setSelectedBookings([]);
              setShowBulkActions(false);
              Alert.alert('Success', `${selectedBookings.length} booking(s) ${actionName}ed successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to ${actionName} bookings. Please try again.`);
            }
          }
        }
      ]
    );
  };

  const updateBookingStatus = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await venuePartnerService.updateBookingStatus(bookingId, newStatus);
      
      setBookings(bookings.map(booking =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));

      Alert.alert('Success', `Booking ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'Failed to update booking status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.key === status);
    return statusOption?.color || '#6b7280';
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

  const formatCurrency = (amount: number) => {
    return VenuePartnerService.formatCurrency(amount);
  };

  const formatDate = (dateString: string) => {
    return VenuePartnerService.formatDate(dateString);
  };

  const renderBookingCard = ({ item: booking }: { item: Booking }) => (
    <TouchableOpacity
      style={[
        styles.bookingCard,
        selectedBookings.includes(booking.id) && styles.bookingCardSelected
      ]}
      onPress={() => {
        if (showBulkActions) {
          toggleBookingSelection(booking.id);
        } else {
          setSelectedBooking(booking);
          setShowDetailsModal(true);
        }
      }}
      onLongPress={() => {
        setShowBulkActions(true);
        toggleBookingSelection(booking.id);
      }}
      activeOpacity={0.7}
    >
      {showBulkActions && (
        <View style={styles.selectionCircle}>
          {selectedBookings.includes(booking.id) && (
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          )}
        </View>
      )}
      
      <View style={styles.bookingHeader}>
        <View style={styles.bookingMainInfo}>
          <Text style={styles.playerName}>{booking.player_name}</Text>
          <Text style={styles.venueInfo}>{booking.venue_name} • {booking.sport}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusBgColor(booking.status) }
        ]}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatDate(booking.booking_date)} • {booking.start_time} - {booking.end_time}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{booking.player_phone}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatCurrency(booking.total_amount)} • {booking.payment_status}
          </Text>
        </View>
      </View>

      {!showBulkActions && (
        <View style={styles.bookingActions}>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => updateBookingStatus(booking.id, 'confirmed')}
              >
                <Ionicons name="checkmark" size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => updateBookingStatus(booking.id, 'cancelled')}
              >
                <Ionicons name="close" size={16} color="#ffffff" />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          
          {booking.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => updateBookingStatus(booking.id, 'completed')}
            >
              <Ionicons name="checkmark-done" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const clearFilters = () => {
    setFilters({
      status: 'all',
      venue: 'all',
      dateRange: 'all',
      sport: 'all',
      paymentStatus: 'all',
    });
    setSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.venue !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.sport !== 'all') count++;
    if (filters.paymentStatus !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Bookings</Text>
            <Text style={styles.subtitle}>
              {filteredBookings.length} of {bookings.length} bookings
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="funnel" size={20} color="#212529" />
              {getActiveFilterCount() > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowEnhancedBookingFlow(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, venue, or sport..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <View style={styles.bulkActionsBar}>
            <TouchableOpacity 
              style={styles.bulkActionCancel}
              onPress={() => {
                setShowBulkActions(false);
                setSelectedBookings([]);
              }}
            >
              <Text style={styles.bulkActionCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.bulkActionCount}>
              {selectedBookings.length} selected
            </Text>
            
            <View style={styles.bulkActionButtons}>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.confirmBulkButton]}
                onPress={() => handleBulkAction('confirmed')}
              >
                <Text style={styles.bulkActionButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.cancelBulkButton]}
                onPress={() => handleBulkAction('cancelled')}
              >
                <Text style={styles.bulkActionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsContainer}
        >
          {statusOptions.map((status, index) => {
            const count = status.key === 'all' 
              ? filteredBookings.length 
              : filteredBookings.filter(b => b.status === status.key).length;
            
            return (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statCard,
                  filters.status === status.key && styles.statCardActive,
                  index === 0 && styles.firstStat
                ]}
                onPress={() => setFilters({...filters, status: status.key})}
              >
                <Text style={[
                  styles.statCount,
                  { color: filters.status === status.key ? '#ffffff' : status.color }
                ]}>
                  {count}
                </Text>
                <Text style={[
                  styles.statLabel,
                  { color: filters.status === status.key ? 'rgba(255,255,255,0.8)' : '#6b7280' }
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bookings List */}
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No bookings found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || getActiveFilterCount() > 0 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first booking to get started'
                }
              </Text>
              {(searchQuery || getActiveFilterCount() > 0) && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Filter Bookings</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.modalClear}>Clear All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Booking Status</Text>
                <View style={styles.filterOptions}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.status === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, status: option.key})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.status === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Venue Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Venue</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filters.venue === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters({...filters, venue: 'all'})}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.venue === 'all' && styles.filterOptionTextActive
                    ]}>
                      All Venues
                    </Text>
                  </TouchableOpacity>
                  {venues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      style={[
                        styles.filterOption,
                        filters.venue === venue.name && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, venue: venue.name})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.venue === venue.name && styles.filterOptionTextActive
                      ]}>
                        {venue.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Date Range</Text>
                <View style={styles.filterOptions}>
                  {dateRangeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.dateRange === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, dateRange: option.key as any})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.dateRange === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Payment Status</Text>
                <View style={styles.filterOptions}>
                  {paymentStatusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        filters.paymentStatus === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setFilters({...filters, paymentStatus: option.key})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        filters.paymentStatus === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
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
              <View style={{ width: 60 }} />
            </View>
            
            {selectedBooking && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailsCard}>
                  <Text style={styles.detailsTitle}>Player Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.player_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.player_phone}</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsTitle}>Booking Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Venue:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.venue_name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sport:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.sport}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedBooking.booking_date)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{selectedBooking.duration_hours} hours</Text>
                  </View>
                </View>

                <View style={styles.detailsCard}>
                  <Text style={styles.detailsTitle}>Payment Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>{formatCurrency(selectedBooking.total_amount)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Status:</Text>
                    <Text style={[styles.detailValue, { 
                      color: selectedBooking.payment_status === 'paid' ? '#10b981' : '#f59e0b' 
                    }]}>
                      {selectedBooking.payment_status.charAt(0).toUpperCase() + selectedBooking.payment_status.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Booking Status:</Text>
                    <Text style={[styles.detailValue, { 
                      color: getStatusColor(selectedBooking.status)
                    }]}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {selectedBooking.notes && (
                  <View style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Notes</Text>
                    <Text style={styles.notesText}>{selectedBooking.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        {/* Enhanced Booking Flow Modal */}
        <EnhancedBookingFlow
          visible={showEnhancedBookingFlow}
          onClose={() => setShowEnhancedBookingFlow(false)}
          onBookingCreated={() => {
            setShowEnhancedBookingFlow(false);
            loadBookings();
          }}
          venues={venues}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#212529',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
  },
  bulkActionCancel: {
    paddingVertical: 4,
  },
  bulkActionCancelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  bulkActionCount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bulkActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confirmBulkButton: {
    backgroundColor: '#10b981',
  },
  cancelBulkButton: {
    backgroundColor: '#ef4444',
  },
  bulkActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingLeft: 24,
    paddingBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardActive: {
    backgroundColor: '#212529',
  },
  firstStat: {
    marginLeft: 0,
  },
  statCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingCardSelected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#fafbff',
  },
  selectionCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingMainInfo: {
    flex: 1,
    marginRight: 16,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  venueInfo: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  completeButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 24,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#212529',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  clearFiltersText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
  modalClear: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterOptionActive: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  detailsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
});