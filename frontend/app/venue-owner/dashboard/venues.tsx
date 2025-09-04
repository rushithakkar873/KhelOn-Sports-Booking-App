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
  StatusBar,
  ImageBackground,
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
  image: string;
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
      // Mock data with professional images
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
          image: 'https://images.unsplash.com/photo-1705593136686-d5f32b611aa9',
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
          image: 'https://images.unsplash.com/photo-1724500760032-b2eb510e59c4',
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
          image: 'https://images.pexels.com/photos/8533631/pexels-photo-8533631.jpeg',
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
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading venues...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
              <Text style={styles.greeting}>My Venues</Text>
              <Text style={styles.subtitle}>{venues.length} venues registered</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.section}>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>{venues.filter(v => v.isActive).length}</Text>
                <Text style={styles.statLabel}>Active Venues</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>{venues.reduce((sum, v) => sum + v.totalBookings, 0)}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="star" size={20} color="#212529" />
                </View>
                <Text style={styles.statValue}>
                  {venues.length > 0 ? (venues.reduce((sum, v) => sum + v.rating, 0) / venues.length).toFixed(1) : '0.0'}
                </Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
          </View>

          {/* Venues List */}
          <View style={styles.section}>
            {venues.map((venue, index) => (
              <TouchableOpacity
                key={venue.id}
                style={[styles.venueCard, index === 0 && styles.featuredVenueCard]}
                onPress={() => handleVenueDetails(venue)}
              >
                <ImageBackground
                  source={{ uri: venue.image }}
                  style={index === 0 ? styles.featuredVenueImage : styles.venueImage}
                  imageStyle={styles.venueImageStyle}
                >
                  <View style={styles.venueOverlay} />
                  <View style={styles.venueContent}>
                    {/* Status Toggle */}
                    <View style={styles.venueHeader}>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: venue.isActive ? 'rgba(16, 185, 129, 0.9)' : 'rgba(156, 163, 175, 0.9)' }
                      ]}>
                        <Text style={styles.statusText}>
                          {venue.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                      <Switch
                        value={venue.isActive}
                        onValueChange={() => toggleVenueStatus(venue.id)}
                        trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.3)' }}
                        thumbColor={venue.isActive ? '#10b981' : '#9ca3af'}
                      />
                    </View>

                    {/* Venue Info */}
                    <View style={index === 0 ? styles.featuredVenueInfo : styles.regularVenueInfo}>
                      <Text style={index === 0 ? styles.featuredVenueName : styles.regularVenueName}>
                        {venue.name}
                      </Text>
                      <View style={styles.venueLocation}>
                        <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.venueLocationText}>{venue.location}</Text>
                      </View>
                      
                      <View style={styles.venueMeta}>
                        <View style={styles.venueRating}>
                          <Ionicons name="star" size={14} color="#fbbf24" />
                          <Text style={styles.venueRatingText}>{venue.rating}</Text>
                        </View>
                        <Text style={styles.venueSports}>{venue.sports.join(', ')}</Text>
                      </View>

                      <View style={styles.venueStats}>
                        <View style={styles.venueStat}>
                          <Text style={styles.venueStatValue}>{formatCurrency(venue.pricePerHour)}/hr</Text>
                        </View>
                        <View style={styles.venueStat}>
                          <Text style={styles.venueStatValue}>{venue.totalBookings} bookings</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ImageBackground>

                {/* Facilities */}
                <View style={styles.venueFacilities}>
                  {venue.facilities.slice(0, 3).map((facility, fIndex) => (
                    <View key={fIndex} style={styles.facilityTag}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                  {venue.facilities.length > 3 && (
                    <View style={styles.facilityTag}>
                      <Text style={styles.facilityText}>+{venue.facilities.length - 3} more</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {venues.length === 0 && (
              <View style={styles.emptyState}>
                <ImageBackground
                  source={{ uri: 'https://images.unsplash.com/photo-1435527173128-983b87201f4d' }}
                  style={styles.emptyStateImage}
                  imageStyle={styles.emptyStateImageStyle}
                >
                  <View style={styles.emptyStateOverlay} />
                  <View style={styles.emptyStateContent}>
                    <Ionicons name="business-outline" size={48} color="#ffffff" />
                    <Text style={styles.emptyStateTitle}>No venues yet</Text>
                    <Text style={styles.emptyStateText}>Add your first venue to start managing bookings</Text>
                    <TouchableOpacity 
                      style={styles.emptyStateButton}
                      onPress={() => setShowAddModal(true)}
                    >
                      <Text style={styles.emptyStateButtonText}>Add Venue</Text>
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
                        trackColor={{ false: '#e5e7eb', true: '#e5e7eb' }}
                        thumbColor={slot.isAvailable ? '#212529' : '#9ca3af'}
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#212529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  venueCard: {
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
  featuredVenueCard: {
    marginBottom: 32,
  },
  featuredVenueImage: {
    height: 280,
  },
  venueImage: {
    height: 200,
  },
  venueImageStyle: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  venueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  venueContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  featuredVenueInfo: {
    marginTop: 120,
  },
  regularVenueInfo: {
    marginTop: 80,
  },
  featuredVenueName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  regularVenueName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  venueLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueLocationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  venueMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  venueSports: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  venueStats: {
    flexDirection: 'row',
    gap: 20,
  },
  venueStat: {},
  venueStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  venueFacilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  facilityTag: {
    backgroundColor: '#f5f6f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  facilityText: {
    fontSize: 11,
    color: '#212529',
    fontWeight: '500',
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
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
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
  modalSave: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
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
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f6f7',
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  slotPrice: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    backgroundColor: '#f5f6f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  facilityChipText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '600',
  },
});