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
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>My Venues</Text>
              <Text style={styles.subtitle}>{venues.length} venues registered</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Overview Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{venues.filter(v => v.isActive).length}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={24} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{venues.reduce((sum, v) => sum + v.totalBookings, 0)}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="star" size={24} color="#f59e0b" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>
                    {venues.length > 0 ? (venues.reduce((sum, v) => sum + v.rating, 0) / venues.length).toFixed(1) : '0.0'}
                  </Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Venues Grid */}
          <View style={styles.venuesSection}>
            <Text style={styles.sectionTitle}>All Venues</Text>
            
            {venues.map((venue, index) => (
              <TouchableOpacity
                key={venue.id}
                style={styles.venueCard}
                onPress={() => handleVenueDetails(venue)}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={{ uri: venue.image }}
                  style={styles.venueImageBackground}
                  imageStyle={styles.venueImage}
                >
                  <View style={styles.venueOverlay} />
                  
                  {/* Status Badge */}
                  <View style={styles.statusBadgeContainer}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: venue.isActive ? '#10b981' : '#6b7280' }
                    ]}>
                      <Text style={styles.statusText}>
                        {venue.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                  </View>

                  {/* Venue Content */}
                  <View style={styles.venueContent}>
                    <View style={styles.venueHeader}>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{venue.name}</Text>
                        <View style={styles.venueLocationRow}>
                          <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.venueLocation}>{venue.location}</Text>
                        </View>
                      </View>
                      
                      <Switch
                        value={venue.isActive}
                        onValueChange={() => toggleVenueStatus(venue.id)}
                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(16, 185, 129, 0.3)' }}
                        thumbColor={venue.isActive ? '#10b981' : '#ffffff'}
                        style={styles.statusSwitch}
                      />
                    </View>

                    <View style={styles.venueStats}>
                      <View style={styles.venueStatItem}>
                        <Ionicons name="star" size={16} color="#fbbf24" />
                        <Text style={styles.venueStatText}>{venue.rating}</Text>
                      </View>
                      <View style={styles.venueStatItem}>
                        <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.venueStatText}>{venue.totalBookings} bookings</Text>
                      </View>
                      <View style={styles.venueStatItem}>
                        <Ionicons name="cash" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.venueStatText}>{formatCurrency(venue.pricePerHour)}/hr</Text>
                      </View>
                    </View>
                  </View>
                </ImageBackground>

                {/* Facilities Tags */}
                <View style={styles.facilitiesContainer}>
                  {venue.facilities.slice(0, 4).map((facility, fIndex) => (
                    <View key={fIndex} style={styles.facilityTag}>
                      <Text style={styles.facilityText}>{facility}</Text>
                    </View>
                  ))}
                  {venue.facilities.length > 4 && (
                    <View style={styles.facilityTag}>
                      <Text style={styles.facilityText}>+{venue.facilities.length - 4}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {venues.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No venues yet</Text>
                <Text style={styles.emptyStateText}>Add your first venue to start managing bookings</Text>
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.emptyStateButtonText}>Add Venue</Text>
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
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
                        trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                        thumbColor={slot.isAvailable ? '#3b82f6' : '#9ca3af'}
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
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  statIconContainer: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  venuesSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
  },
  venueCard: {
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
  venueImageBackground: {
    height: 200,
    justifyContent: 'space-between',
  },
  venueImage: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  venueOverlay: {
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
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  venueContent: {
    padding: 20,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  venueInfo: {
    flex: 1,
    marginRight: 16,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 24,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueLocation: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusSwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  venueStats: {
    flexDirection: 'row',
    gap: 20,
  },
  venueStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  facilityTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
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
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212529',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
  modalNote: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
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
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  slotPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
});