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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenueOwnerService, { Venue, CreateVenueData, CreateArena, Arena } from '../../../services/venueOwnerService';
import AuthService from '../../../services/authService';
import ArenaFormModal from '../../../components/ArenaFormModal';
import ArenaCard from '../../../components/ArenaCard';

const { width } = Dimensions.get('window');

interface VenueForm {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description: string;
  amenities: string[];
  base_price_per_hour: string;
  contact_phone: string;
  whatsapp_number: string;
  images: string[];
  rules_and_regulations: string;
  cancellation_policy: string;
  arenas: CreateArena[];
}

export default function VenuesScreen() {
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showArenaModal, setShowArenaModal] = useState(false);
  const [selectedArena, setSelectedArena] = useState<CreateArena | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [venueForm, setVenueForm] = useState<VenueForm>({
    name: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    description: '',
    amenities: [],
    base_price_per_hour: '',
    contact_phone: '',
    whatsapp_number: '',
    images: [],
    rules_and_regulations: '',
    cancellation_policy: '',
    arenas: [],
  });
  const [expandedVenues, setExpandedVenues] = useState<Set<string>>(new Set());
  
  const router = useRouter();
  const venueOwnerService = VenueOwnerService.getInstance();
  const authService = AuthService.getInstance();

  const facilityOptions = ['Parking', 'Washroom', 'Changing Room', 'Floodlights', 'AC', 'Equipment Rental', 'Seating', 'Canteen', 'WiFi', 'First Aid'];

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      // Check if user is authenticated and is venue owner
      if (!authService.isAuthenticated() || !authService.isVenueOwner()) {
        Alert.alert('Authentication Error', 'Please log in as a venue owner', [
          { text: 'OK', onPress: () => router.replace('/auth/login') }
        ]);
        return;
      }

      // Fetch venues from API
      const venuesData = await venueOwnerService.getVenues(0, 50, undefined);
      setVenues(venuesData);
    } catch (error) {
      console.error('Error loading venues:', error);
      
      Alert.alert(
        'Error', 
        'Failed to load venues. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadVenues() },
          { text: 'Cancel' }
        ]
      );
      
      // Set empty venues on error
      setVenues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadVenues();
    setIsRefreshing(false);
  };

  const handleAddVenue = () => {
    setCurrentStep(1);
    setVenueForm({
      name: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '',
      description: '',
      amenities: [],
      base_price_per_hour: '',
      contact_phone: authService.getCurrentUser()?.mobile || '',
      whatsapp_number: '',
      images: [],
      rules_and_regulations: '',
      cancellation_policy: '',
      arenas: [],
    });
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setCurrentStep(1);
    setSelectedVenue(null);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate basic info
      if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.pincode.trim()) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmitVenue = async () => {
    try {
      // Validation
      if (!venueForm.name.trim()) {
        Alert.alert('Error', 'Venue name is required');
        return;
      }
      if (!venueForm.address.trim()) {
        Alert.alert('Error', 'Address is required');
        return;
      }
      if (!venueForm.pincode.trim()) {
        Alert.alert('Error', 'Pincode is required');
        return;
      }
      if (venueForm.arenas.length === 0) {
        Alert.alert('Error', 'At least one arena is required');
        return;
      }
      if (!venueForm.base_price_per_hour || parseFloat(venueForm.base_price_per_hour) <= 0) {
        Alert.alert('Error', 'Valid base price is required');
        return;
      }

      // Extract sports from arenas
      const sports_supported = [...new Set(venueForm.arenas.map(arena => arena.sport))];

      // Create venue data object for API
      const venueData: CreateVenueData = {
        name: venueForm.name,
        sports_supported,
        address: venueForm.address,
        city: venueForm.city,
        state: venueForm.state,
        pincode: venueForm.pincode,
        description: venueForm.description,
        amenities: venueForm.amenities,
        base_price_per_hour: parseFloat(venueForm.base_price_per_hour),
        contact_phone: authService.getCurrentUser()?.mobile || '',
        whatsapp_number: venueForm.whatsapp_number || undefined,
        images: venueForm.images,
        rules_and_regulations: venueForm.rules_and_regulations || undefined,
        cancellation_policy: venueForm.cancellation_policy || undefined,
        arenas: venueForm.arenas,
      };

      console.log('Creating venue with data:', venueData);
      const result = await venueOwnerService.createVenue(venueData);
      
      if (result.success) {
        // Refresh venues list
        await loadVenues();
        handleCloseAddModal();
        Alert.alert('Success', 'Venue with arenas added successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to add venue');
      }
    } catch (error) {
      console.error('Error creating venue:', error);
      Alert.alert('Error', 'Failed to add venue. Please try again.');
    }
  };

  // Arena management functions
  const handleAddArena = (arena: CreateArena) => {
    setVenueForm({
      ...venueForm,
      arenas: [...venueForm.arenas, arena],
    });
  };

  const handleEditArena = (index: number, arena: CreateArena) => {
    const newArenas = venueForm.arenas.map((a, i) => (i === index ? arena : a));
    setVenueForm({ ...venueForm, arenas: newArenas });
  };

  const handleRemoveArena = (index: number) => {
    if (venueForm.arenas.length > 1) {
      const newArenas = venueForm.arenas.filter((_, i) => i !== index);
      setVenueForm({ ...venueForm, arenas: newArenas });
    } else {
      Alert.alert('Error', 'At least one arena is required');
    }
  };

  const openArenaModal = (arena?: CreateArena, index?: number) => {
    setSelectedArena(arena || null);
    setShowArenaModal(true);
  };

  const closeArenaModal = () => {
    setSelectedArena(null);
    setShowArenaModal(false);
  };

  // Venue management functions
  const toggleVenueExpansion = (venueId: string) => {
    const newExpanded = new Set(expandedVenues);
    if (newExpanded.has(venueId)) {
      newExpanded.delete(venueId);
    } else {
      newExpanded.add(venueId);
    }
    setExpandedVenues(newExpanded);
  };

  const handleArenaToggleStatus = async (venue: Venue, arenaId: string, isActive: boolean) => {
    try {
      // TODO: Implement arena status toggle API call
      console.log('Toggle arena status:', { venueId: venue.id, arenaId, isActive });
      Alert.alert('Info', 'Arena status toggle will be implemented with API integration');
    } catch (error) {
      console.error('Error toggling arena status:', error);
      Alert.alert('Error', 'Failed to update arena status');
    }
  };

  const handleArenaEdit = (venue: Venue, arena: Arena) => {
    // TODO: Implement arena editing
    Alert.alert('Info', 'Arena editing will be implemented');
  };

  const handleArenaDetails = (venue: Venue, arena: Arena) => {
    // TODO: Show arena details modal
    Alert.alert('Arena Details', `Arena: ${arena.name}\nSport: ${arena.sport}\nPrice: ₹${arena.base_price_per_hour}/hr`);
  };

  const toggleFacility = (facility: string) => {
    const newFacilities = venueForm.amenities.includes(facility)
      ? venueForm.amenities.filter(f => f !== facility)
      : [...venueForm.amenities, facility];
    setVenueForm({ ...venueForm, amenities: newFacilities });
  };

  const formatCurrency = (amount: number) => {
    return VenueOwnerService.formatCurrency(amount);
  };

  const getSportsSummary = (venue: Venue) => {
    if (!venue.arenas || venue.arenas.length === 0) return 'No arenas';
    const sportCounts: { [key: string]: number } = {};
    venue.arenas.forEach(arena => {
      sportCounts[arena.sport] = (sportCounts[arena.sport] || 0) + 1;
    });
    return Object.entries(sportCounts)
      .map(([sport, count]) => `${sport}: ${count}`)
      .join(', ');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Venue Name *</Text>
              <TextInput
                style={styles.formInput}
                value={venueForm.name}
                onChangeText={(text) => setVenueForm({ ...venueForm, name: text })}
                placeholder="Enter venue name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={venueForm.address}
                onChangeText={(text) => setVenueForm({ ...venueForm, address: text })}
                placeholder="Enter full address"
                placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.formLabel}>State</Text>
                <TextInput
                  style={styles.formInput}
                  value={venueForm.state}
                  onChangeText={(text) => setVenueForm({ ...venueForm, state: text })}
                  placeholder="State"
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
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
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.stepTitle}>Arena Management</Text>
              <TouchableOpacity onPress={() => openArenaModal()} style={styles.addArenaButton}>
                <Ionicons name="add" size={20} color="#4CAF50" />
                <Text style={styles.addArenaText}>Add Arena</Text>
              </TouchableOpacity>
            </View>

            {venueForm.arenas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No arenas added yet</Text>
                <Text style={styles.emptyStateSubtext}>Add at least one arena to continue</Text>
              </View>
            ) : (
              <ScrollView style={styles.arenasList} showsVerticalScrollIndicator={false}>
                {venueForm.arenas.map((arena, index) => (
                  <View key={index} style={styles.arenaPreview}>
                    <View style={styles.arenaHeader}>
                      <View style={styles.arenaInfo}>
                        <Text style={styles.arenaName}>{arena.name}</Text>
                        <Text style={styles.arenaSport}>{arena.sport}</Text>
                      </View>
                      <View style={styles.arenaActions}>
                        <TouchableOpacity
                          onPress={() => openArenaModal(arena, index)}
                          style={styles.editArenaButton}
                        >
                          <Ionicons name="create-outline" size={16} color="#2196F3" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleRemoveArena(index)}
                          style={styles.removeArenaButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF5252" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.arenaStats}>
                      <Text style={styles.arenaStat}>Capacity: {arena.capacity || 1}</Text>
                      <Text style={styles.arenaStat}>Price: ₹{arena.base_price_per_hour}/hr</Text>
                      <Text style={styles.arenaStat}>Slots: {arena.slots?.length || 0}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Venue Information</Text>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{venueForm.name}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Address:</Text>
                <Text style={styles.reviewValue}>{venueForm.address}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>City:</Text>
                <Text style={styles.reviewValue}>{venueForm.city}, {venueForm.state} - {venueForm.pincode}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Base Price:</Text>
                <Text style={styles.reviewValue}>₹{venueForm.base_price_per_hour}/hour</Text>
              </View>
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>Arenas ({venueForm.arenas.length})</Text>
              {venueForm.arenas.map((arena, index) => (
                <View key={index} style={styles.reviewArena}>
                  <Text style={styles.reviewArenaName}>{arena.name} - {arena.sport}</Text>
                  <Text style={styles.reviewArenaDetails}>
                    Capacity: {arena.capacity}, Price: ₹{arena.base_price_per_hour}/hr, Slots: {arena.slots?.length || 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading venues...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Venues</Text>
        <TouchableOpacity onPress={handleAddVenue} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No venues yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first venue to get started</Text>
            <TouchableOpacity onPress={handleAddVenue} style={styles.getStartedButton}>
              <Text style={styles.getStartedButtonText}>Add Venue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          venues.map((venue) => (
            <View key={venue.id} style={styles.venueCard}>
              {/* Venue Header */}
              <TouchableOpacity
                style={styles.venueHeader}
                onPress={() => toggleVenueExpansion(venue.id)}
              >
                <View style={styles.venueHeaderLeft}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueLocation}>{venue.city}, {venue.state}</Text>
                  <Text style={styles.venueArenas}>
                    {venue.arenas?.length || 0} arenas • {getSportsSummary(venue)}
                  </Text>
                </View>
                <View style={styles.venueHeaderRight}>
                  <Switch
                    value={venue.is_active}
                    onValueChange={(value) => {
                      // TODO: Implement venue status toggle
                      console.log('Toggle venue status:', value);
                    }}
                    trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
                    thumbColor={venue.is_active ? '#fff' : '#f4f3f4'}
                  />
                  <Ionicons
                    name={expandedVenues.has(venue.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                    style={styles.expandIcon}
                  />
                </View>
              </TouchableOpacity>

              {/* Arena List (Expandable) */}
              {expandedVenues.has(venue.id) && venue.arenas && venue.arenas.length > 0 && (
                <View style={styles.arenasContainer}>
                  <Text style={styles.arenasTitle}>Arenas ({venue.arenas.length})</Text>
                  {venue.arenas.map((arena) => (
                    <ArenaCard
                      key={arena.id}
                      arena={arena}
                      onEdit={(arena) => handleArenaEdit(venue, arena)}
                      onToggleStatus={(arenaId, isActive) => handleArenaToggleStatus(venue, arenaId, isActive)}
                      onViewDetails={(arena) => handleArenaDetails(venue, arena)}
                    />
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Venue Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseAddModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseAddModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Venue</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{currentStep}/3</Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          <View style={styles.modalFooter}>
            {currentStep > 1 && (
              <TouchableOpacity onPress={handlePreviousStep} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < 3 ? (
              <TouchableOpacity onPress={handleNextStep} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSubmitVenue} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Create Venue</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getStartedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  venueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  venueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  venueHeaderLeft: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  venueLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  venueArenas: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  venueHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    marginLeft: 8,
  },
  arenasContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  arenasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  stepIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
  },
  facilityButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  facilityText: {
    fontSize: 12,
    color: '#666',
  },
  facilityTextSelected: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addArenaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addArenaText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  arenasList: {
    maxHeight: 400,
  },
  arenaPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  arenaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  arenaInfo: {
    flex: 1,
  },
  arenaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arenaSport: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  arenaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editArenaButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  removeArenaButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#FFEBEE',
  },
  arenaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  arenaStat: {
    fontSize: 12,
    color: '#666',
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 80,
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  reviewArena: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  reviewArenaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewArenaDetails: {
    fontSize: 12,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});