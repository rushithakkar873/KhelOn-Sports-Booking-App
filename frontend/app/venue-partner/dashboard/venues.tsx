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
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenuePartnerService, { Venue, Arena } from '../../../services/venuePartnerService';
import AuthService from '../../../services/authService';
import ArenaFormModal from '../../../components/ArenaFormModal';
import ArenaCard from '../../../components/ArenaCard';

const { width } = Dimensions.get('window');

export default function MyVenueScreen() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArenaModal, setShowArenaModal] = useState(false);
  const [selectedArena, setSelectedArena] = useState<any | null>(null);
  const [editingArenaIndex, setEditingArenaIndex] = useState<number | null>(null);
  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    amenities: [] as string[],
    base_price_per_hour: '',
    whatsapp_number: '',
  });
  
  const router = useRouter();
  const venuePartnerService = VenuePartnerService.getInstance();
  const authService = AuthService.getInstance();

  const facilityOptions = ['Parking', 'Washroom', 'Changing Room', 'Floodlights', 'AC', 'Equipment Rental', 'Seating', 'Canteen', 'WiFi', 'First Aid'];

  useEffect(() => {
    loadVenue();
  }, []);

  const loadVenue = async () => {
    try {
      // Check if user is authenticated and is venue partner
      if (!authService.isAuthenticated() || !authService.isVenuePartner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue partner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Fetch venue from API - get first venue (single venue MVP)
      const venuesData = await venuePartnerService.getVenues(0, 1, undefined);
      if (venuesData && venuesData.length > 0) {
        setVenue(venuesData[0]);
        // Populate form with existing data
        const v = venuesData[0];
        setVenueForm({
          name: v.name,
          address: v.address,
          city: v.city,
          state: v.state,
          pincode: v.pincode,
          description: v.description || '',
          amenities: v.amenities || [],
          base_price_per_hour: v.base_price_per_hour?.toString() || '0',
          whatsapp_number: v.whatsapp_number || '',
        });
      } else {
        // No venue found - this shouldn't happen in MVP since venue is created during registration
        Alert.alert('No Venue Found', 'Please contact support to set up your venue.');
      }
    } catch (error) {
      console.error('Error loading venue:', error);
      Alert.alert(
        'Error', 
        'Failed to load venue. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadVenue() },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVenue();
    setIsRefreshing(false);
  };

  const handleEditVenue = () => {
    setShowEditModal(true);
  };

  const handleSaveVenue = async () => {
    try {
      if (!venue) return;

      // Validation
      if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.pincode.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (!venueForm.base_price_per_hour || parseFloat(venueForm.base_price_per_hour) <= 0) {
        Alert.alert('Error', 'Valid base price is required');
        return;
      }

      // Update venue using API
      const updateData = {
        name: venueForm.name,
        address: venueForm.address,
        city: venueForm.city,
        state: venueForm.state,
        pincode: venueForm.pincode,
        description: venueForm.description,
        amenities: venueForm.amenities,
        base_price_per_hour: parseFloat(venueForm.base_price_per_hour),
        whatsapp_number: venueForm.whatsapp_number,
        // Keep existing fields
        sports_supported: venue.sports_supported,
        contact_phone: venue.contact_phone,
        images: venue.images || [],
        rules_and_regulations: venue.rules_and_regulations,
        cancellation_policy: venue.cancellation_policy,
        arenas: venue.arenas || [],
      };

      // For now, just update local state (API update can be implemented later)
      setVenue({ ...venue, ...updateData });
      setShowEditModal(false);
      Alert.alert('Success', 'Venue details updated successfully!');
    } catch (error) {
      console.error('Error updating venue:', error);
      Alert.alert('Error', 'Failed to update venue. Please try again.');
    }
  };

  const handleAddArena = (arena: any) => {
    if (!venue) return;

    console.log('Adding arena:', arena);
    if (editingArenaIndex !== null) {
      // Editing existing arena
      const newArenas = (venue.arenas || []).map((a, i) => (i === editingArenaIndex ? arena : a));
      setVenue({ ...venue, arenas: newArenas });
      setEditingArenaIndex(null);
    } else {
      // Adding new arena
      const newArenas = [...(venue.arenas || []), { ...arena, id: Date.now().toString() }];
      setVenue({ ...venue, arenas: newArenas });
    }
    Alert.alert('Success', 'Arena added successfully!');
  };

  const handleEditArena = (arena: Arena) => {
    const arenaIndex = venue?.arenas?.findIndex(a => a.id === arena.id) ?? -1;
    if (arenaIndex >= 0) {
      setSelectedArena(arena);
      setEditingArenaIndex(arenaIndex);
      setShowArenaModal(true);
    }
  };

  const handleToggleArenaStatus = async (arenaId: string, isActive: boolean) => {
    try {
      // TODO: Implement arena status toggle API call
      console.log('Toggle arena status:', { arenaId, isActive });
      Alert.alert('Info', 'Arena status toggle will be implemented with API integration');
    } catch (error) {
      console.error('Error toggling arena status:', error);
      Alert.alert('Error', 'Failed to update arena status');
    }
  };

  const handleArenaDetails = (arena: Arena) => {
    const amenitiesText = arena.amenities?.length ? arena.amenities.join(', ') : 'None';
    const slotsText = arena.slots?.length ? `${arena.slots.length} time slots` : 'No time slots';
    Alert.alert(
      arena.name,
      `Sport: ${arena.sport}\nCapacity: ${arena.capacity}\nPrice: ₹${arena.base_price_per_hour}/hr\nAmenities: ${amenitiesText}\nSchedule: ${slotsText}`
    );
  };

  const openArenaModal = () => {
    setSelectedArena(null);
    setEditingArenaIndex(null);
    setShowArenaModal(true);
  };

  const closeArenaModal = () => {
    setSelectedArena(null);
    setEditingArenaIndex(null);
    setShowArenaModal(false);
  };

  const toggleFacility = (facility: string) => {
    const newFacilities = venueForm.amenities.includes(facility)
      ? venueForm.amenities.filter(f => f !== facility)
      : [...venueForm.amenities, facility];
    setVenueForm({ ...venueForm, amenities: newFacilities });
  };

  const formatCurrency = (amount: number) => {
    return VenuePartnerService.formatCurrency(amount);
  };

  const getSportsSummary = () => {
    if (!venue?.arenas || venue.arenas.length === 0) return 'No arenas';
    const sportCounts: { [key: string]: number } = {};
    venue.arenas.forEach(arena => {
      sportCounts[arena.sport] = (sportCounts[arena.sport] || 0) + 1;
    });
    return Object.entries(sportCounts)
      .map(([sport, count]) => `${sport}: ${count}`)
      .join(', ');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#212529" />
            <Text style={styles.loadingText}>Loading venue...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>My Venue</Text>
            <Text style={styles.subtitle}>
              {venue ? 'Manage your venue and arenas' : 'No venue found'}
            </Text>
          </View>
          {venue && (
            <TouchableOpacity onPress={handleEditVenue} style={styles.editButton}>
              <Ionicons name="create-outline" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {venue ? (
            <>
              {/* Venue Details Card */}
              <View style={styles.venueCard}>
                <View style={styles.venueHeader}>
                  <View style={styles.venueHeaderLeft}>
                    <Text style={styles.venueName}>{venue.name}</Text>
                    <Text style={styles.venueLocation}>{venue.city}, {venue.state}</Text>
                    <Text style={styles.venueDetails}>
                      Base Price: {formatCurrency(venue.base_price_per_hour)}/hr
                    </Text>
                  </View>
                </View>
                
                <View style={styles.venueInfo}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{venue.address}</Text>
                </View>
                
                {venue.description && (
                  <View style={styles.venueInfo}>
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{venue.description}</Text>
                  </View>
                )}

                {venue.amenities && venue.amenities.length > 0 && (
                  <View style={styles.venueInfo}>
                    <Text style={styles.infoLabel}>General Amenities:</Text>
                    <View style={styles.amenitiesContainer}>
                      {venue.amenities.map((amenity, index) => (
                        <View key={index} style={styles.amenityTag}>
                          <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Arenas Section */}
              <View style={styles.arenasSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Arenas ({venue.arenas?.length || 0})
                  </Text>
                  <TouchableOpacity onPress={openArenaModal} style={styles.addArenaButton}>
                    <Ionicons name="add" size={20} color="#212529" />
                    <Text style={styles.addArenaText}>Add Arena</Text>
                  </TouchableOpacity>
                </View>

                {!venue.arenas || venue.arenas.length === 0 ? (
                  <View style={styles.emptyArenas}>
                    <Ionicons name="business-outline" size={48} color="#9ca3af" />
                    <Text style={styles.emptyArenasText}>No arenas yet</Text>
                    <Text style={styles.emptyArenasSubtext}>Add your first arena to start taking bookings</Text>
                    <TouchableOpacity onPress={openArenaModal} style={styles.getStartedButton}>
                      <Text style={styles.getStartedButtonText}>Add Arena</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.arenasList}>
                    {venue.arenas.map((arena) => (
                      <ArenaCard
                        key={arena.id}
                        arena={arena}
                        onEdit={(arena) => handleEditArena(arena)}
                        onToggleStatus={(arenaId, isActive) => handleToggleArenaStatus(arenaId, isActive)}
                        onViewDetails={(arena) => handleArenaDetails(arena)}
                      />
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noVenueContainer}>
              <Ionicons name="business-outline" size={64} color="#9ca3af" />
              <Text style={styles.noVenueText}>No venue found</Text>
              <Text style={styles.noVenueSubtext}>Please contact support to set up your venue</Text>
            </View>
          )}
        </ScrollView>

        {/* Edit Venue Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Venue Details</Text>
              <TouchableOpacity onPress={handleSaveVenue} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Venue Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={venueForm.name}
                    onChangeText={(text) => setVenueForm({ ...venueForm, name: text })}
                    placeholder="Enter venue name"
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Address *</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={venueForm.address}
                    onChangeText={(text) => setVenueForm({ ...venueForm, address: text })}
                    placeholder="Enter full address"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.formLabel}>City</Text>
                    <TextInput
                      style={styles.formInput}
                      value={venueForm.city}
                      onChangeText={(text) => setVenueForm({ ...venueForm, city: text })}
                      placeholder="City"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.formLabel}>State</Text>
                    <TextInput
                      style={styles.formInput}
                      value={venueForm.state}
                      onChangeText={(text) => setVenueForm({ ...venueForm, state: text })}
                      placeholder="State"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.formLabel}>Pincode *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={venueForm.pincode}
                      onChangeText={(text) => setVenueForm({ ...venueForm, pincode: text })}
                      placeholder="Pincode"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.formLabel}>Base Price/Hour *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={venueForm.base_price_per_hour}
                      onChangeText={(text) => setVenueForm({ ...venueForm, base_price_per_hour: text })}
                      placeholder="₹ per hour"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={venueForm.description}
                    onChangeText={(text) => setVenueForm({ ...venueForm, description: text })}
                    placeholder="Brief description of your venue"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>WhatsApp Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={venueForm.whatsapp_number}
                    onChangeText={(text) => setVenueForm({ ...venueForm, whatsapp_number: text })}
                    placeholder="WhatsApp number for booking inquiries"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>General Amenities</Text>
                  <View style={styles.facilitiesGrid}>
                    {facilityOptions.map((facility) => (
                      <TouchableOpacity
                        key={facility}
                        style={[
                          styles.facilityButton,
                          venueForm.amenities.includes(facility) && styles.facilityButtonSelected,
                        ]}
                        onPress={() => toggleFacility(facility)}
                      >
                        <Text
                          style={[
                            styles.facilityText,
                            venueForm.amenities.includes(facility) && styles.facilityTextSelected,
                          ]}
                        >
                          {facility}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Arena Form Modal */}
        <ArenaFormModal
          isVisible={showArenaModal}
          onClose={closeArenaModal}
          onSave={handleAddArena}
          arena={selectedArena}
          isEditing={!!selectedArena}
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
    marginTop: 16,
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
  editButton: {
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
    elevation: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  venueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  venueHeaderLeft: {
    flex: 1,
  },
  venueName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  venueDetails: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '600',
  },
  venueInfo: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  amenityTag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '500',
  },
  arenasSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  addArenaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addArenaText: {
    color: '#212529',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyArenas: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyArenasText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyArenasSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: '#212529',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  arenasList: {
    gap: 12,
  },
  noVenueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noVenueText: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  noVenueSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  saveButton: {
    backgroundColor: '#212529',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  formSection: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 24,
    borderRadius: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  facilityButtonSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  facilityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  facilityTextSelected: {
    color: '#ffffff',
  },
});