import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
}

interface Venue {
  id: string;
  name: string;
  sports: string[];
  location: string;
  pricePerHour: number;
  facilities: string[];
  description: string;
  isActive: boolean;
  totalBookings: number;
  rating: number;
  timeSlots: TimeSlot[];
}

export default function VenuesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      // Mock data - replace with actual API call
      const mockVenues: Venue[] = [
        {
          id: '1',
          name: 'Elite Cricket Ground',
          sports: ['Cricket'],
          location: 'Andheri, Mumbai',
          pricePerHour: 1200,
          facilities: ['Floodlights', 'Parking', 'Washroom', 'Seating'],
          description: 'Professional cricket ground with excellent facilities',
          isActive: true,
          totalBookings: 156,
          rating: 4.8,
          timeSlots: [
            { id: '1', startTime: '06:00', endTime: '08:00', price: 1000, isAvailable: true },
            { id: '2', startTime: '08:00', endTime: '10:00', price: 1200, isAvailable: true },
            { id: '3', startTime: '10:00', endTime: '12:00', price: 1200, isAvailable: false },
            { id: '4', startTime: '16:00', endTime: '18:00', price: 1400, isAvailable: true },
            { id: '5', startTime: '18:00', endTime: '20:00', price: 1500, isAvailable: true },
          ]
        },
        {
          id: '2',
          name: 'Champions Football Turf',
          sports: ['Football'],
          location: 'Bandra, Mumbai',
          pricePerHour: 800,
          facilities: ['Floodlights', 'Parking', 'Washroom'],
          description: 'Synthetic turf football ground',
          isActive: true,
          totalBookings: 89,
          rating: 4.5,
          timeSlots: [
            { id: '1', startTime: '06:00', endTime: '07:00', price: 600, isAvailable: true },
            { id: '2', startTime: '07:00', endTime: '08:00', price: 700, isAvailable: true },
            { id: '3', startTime: '18:00', endTime: '19:00', price: 900, isAvailable: true },
            { id: '4', startTime: '19:00', endTime: '20:00', price: 1000, isAvailable: true },
          ]
        },
        {
          id: '3',
          name: 'Badminton Arena Pro',
          sports: ['Badminton'],
          location: 'Powai, Mumbai',
          pricePerHour: 600,
          facilities: ['AC', 'Parking', 'Washroom', 'Equipment'],
          description: '4 professional badminton courts with AC',
          isActive: false,
          totalBookings: 67,
          rating: 4.2,
          timeSlots: [
            { id: '1', startTime: '06:00', endTime: '08:00', price: 500, isAvailable: true },
            { id: '2', startTime: '18:00', endTime: '20:00', price: 700, isAvailable: true },
          ]
        }
      ];

      setVenues(mockVenues);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVenues();
    setIsRefreshing(false);
  };

  const toggleVenueStatus = (venueId: string) => {
    setVenues(venues.map(venue => 
      venue.id === venueId 
        ? { ...venue, isActive: !venue.isActive }
        : venue
    ));
  };

  const toggleSlotAvailability = (venueId: string, slotId: string) => {
    setVenues(venues.map(venue => 
      venue.id === venueId 
        ? {
            ...venue,
            timeSlots: venue.timeSlots.map(slot =>
              slot.id === slotId
                ? { ...slot, isAvailable: !slot.isAvailable }
                : slot
            )
          }
        : venue
    ));
  };

  const handleVenueDetails = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>My Venues</Text>
            <Text style={styles.headerSubtitle}>{venues.length} venues registered</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{venues.filter(v => v.isActive).length}</Text>
            <Text style={styles.statLabel}>Active Venues</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{venues.reduce((sum, v) => sum + v.totalBookings, 0)}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {venues.length > 0 ? (venues.reduce((sum, v) => sum + v.rating, 0) / venues.length).toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Venues List */}
        <View style={styles.venuesContainer}>
          {venues.map((venue) => (
            <View key={venue.id} style={styles.venueCard}>
              <View style={styles.venueHeader}>
                <View style={styles.venueBasicInfo}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueLocation}>{venue.location}</Text>
                  <View style={styles.venueMeta}>
                    <Text style={styles.venueSports}>{venue.sports.join(', ')}</Text>
                    <View style={styles.venueRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.venueRatingText}>{venue.rating}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.venueActions}>
                  <Switch
                    value={venue.isActive}
                    onValueChange={() => toggleVenueStatus(venue.id)}
                    trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                    thumbColor={venue.isActive ? '#2563eb' : '#9ca3af'}
                  />
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => handleVenueDetails(venue)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.venueStats}>
                <View style={styles.venueStat}>
                  <Text style={styles.venueStatValue}>{formatCurrency(venue.pricePerHour)}</Text>
                  <Text style={styles.venueStatLabel}>Per Hour</Text>
                </View>
                <View style={styles.venueStat}>
                  <Text style={styles.venueStatValue}>{venue.totalBookings}</Text>
                  <Text style={styles.venueStatLabel}>Bookings</Text>
                </View>
                <View style={styles.venueStat}>
                  <Text style={styles.venueStatValue}>{venue.timeSlots.length}</Text>
                  <Text style={styles.venueStatLabel}>Time Slots</Text>
                </View>
              </View>

              <View style={styles.venueFacilities}>
                {venue.facilities.slice(0, 3).map((facility, index) => (
                  <View key={index} style={styles.facilityTag}>
                    <Text style={styles.facilityText}>{facility}</Text>
                  </View>
                ))}
                {venue.facilities.length > 3 && (
                  <View style={styles.facilityTag}>
                    <Text style={styles.facilityText}>+{venue.facilities.length - 3} more</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {venues.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No venues yet</Text>
            <Text style={styles.emptyStateText}>Add your first venue to start managing bookings</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Add Venue</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Venue Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Venue</Text>
            <TouchableOpacity>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalNote}>This feature will be fully implemented with venue creation form.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Venue Details Modal */}
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
            <Text style={styles.modalTitle}>Venue Details</Text>
            <TouchableOpacity>
              <Text style={styles.modalSave}>Edit</Text>
            </TouchableOpacity>
          </View>
          {selectedVenue && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Basic Information</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Name:</Text>
                  <Text style={styles.detailsValue}>{selectedVenue.name}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Location:</Text>
                  <Text style={styles.detailsValue}>{selectedVenue.location}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Sports:</Text>
                  <Text style={styles.detailsValue}>{selectedVenue.sports.join(', ')}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Description:</Text>
                  <Text style={styles.detailsValue}>{selectedVenue.description}</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Time Slots & Pricing</Text>
                {selectedVenue.timeSlots.map((slot) => (
                  <View key={slot.id} style={styles.slotRow}>
                    <View style={styles.slotInfo}>
                      <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
                      <Text style={styles.slotPrice}>{formatCurrency(slot.price)}</Text>
                    </View>
                    <Switch
                      value={slot.isAvailable}
                      onValueChange={() => toggleSlotAvailability(selectedVenue.id, slot.id)}
                      trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                      thumbColor={slot.isAvailable ? '#2563eb' : '#9ca3af'}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Facilities</Text>
                <View style={styles.facilitiesGrid}>
                  {selectedVenue.facilities.map((facility, index) => (
                    <View key={index} style={styles.facilityChip}>
                      <Text style={styles.facilityChipText}>{facility}</Text>
                    </View>
                  ))}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  venuesContainer: {
    paddingHorizontal: 24,
  },
  venueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  venueBasicInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  venueMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueSports: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueRatingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  venueActions: {
    alignItems: 'flex-end',
  },
  detailsButton: {
    marginTop: 8,
    padding: 4,
  },
  venueStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  venueStat: {
    flex: 1,
    alignItems: 'center',
  },
  venueStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  venueStatLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  venueFacilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  facilityText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '500',
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
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
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
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  slotPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityChipText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
});