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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import VenueOwnerBottomNavigation from '../../../components/VenueOwnerBottomNavigation';
import VenueOwnerService, { Venue, CreateVenueData } from '../../../services/venueOwnerService';
import AuthService from '../../../services/authService';

const { width } = Dimensions.get('window');

interface VenueForm {
  name: string;
  sports: string[];
  location: string;
  description: string;
  facilities: string[];
  pricePerHour: string;
  timeSlots: { startTime: string; endTime: string; price: string }[];
  imageUrl: string;
}

export default function VenuesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [venueForm, setVenueForm] = useState<VenueForm>({
    name: '',
    sports: [],
    location: '',
    description: '',
    facilities: [],
    pricePerHour: '',
    timeSlots: [{ startTime: '', endTime: '', price: '' }],
    imageUrl: '',
  });
  
  const router = useRouter();
  const venueOwnerService = VenueOwnerService.getInstance();
  const authService = AuthService.getInstance();

  const sportsOptions = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 'Volleyball'];
  const facilityOptions = ['Parking', 'Washroom', 'Changing Room', 'Floodlights', 'AC', 'Equipment Rental', 'Seating', 'Canteen'];

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

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadVenues();
    setIsRefreshing(false);
  };

  const toggleVenueStatus = async (venueId: string) => {
    try {
      const venue = venues.find(v => v.id === venueId);
      if (!venue) return;

      const newStatus = !venue.is_active;
      await venueOwnerService.updateVenueStatus(venueId, newStatus);
      
      // Update local state
      setVenues(venues.map(v => 
        v.id === venueId 
          ? { ...v, is_active: newStatus }
          : v
      ));

      Alert.alert('Success', `Venue ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating venue status:', error);
      Alert.alert('Error', 'Failed to update venue status. Please try again.');
    }
  };

  const toggleSlotAvailability = async (venueId: string, slotId: string) => {
    // Note: This would require a separate API endpoint for slot management
    // For now, keep the local state update but add a note
    setVenues(venues.map(venue => 
      venue.id === venueId 
        ? {
            ...venue,
            slots: venue?.slots && Array.isArray(venue.slots) 
              ? venue.slots.map(slot =>
                  slot?._id === slotId
                    ? { ...slot, is_active: !slot.is_active }
                    : slot
                )
              : []
          }
        : venue
    ));
    
    // TODO: Implement API call for slot availability update
    Alert.alert('Note', 'Slot availability updated locally. API integration pending.');
  };

  const handleVenueDetails = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowDetailsModal(true);
  };

  const resetForm = () => {
    setVenueForm({
      name: '',
      sports: [],
      location: '',
      description: '',
      facilities: [],
      pricePerHour: '',
      timeSlots: [{ startTime: '', endTime: '', price: '' }],
      imageUrl: '',
    });
    setCurrentStep(1);
  };

  const handleAddVenue = () => {
    setShowAddModal(true);
    resetForm();
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return venueForm.name.trim() !== '' && venueForm.location.trim() !== '' && venueForm.sports.length > 0;
      case 2:
        return venueForm.description.trim() !== '' && venueForm.facilities.length > 0 && venueForm.pricePerHour.trim() !== '';
      case 3:
        return venueForm.timeSlots.every(slot => slot.startTime && slot.endTime && slot.price);
      case 4:
        return venueForm.imageUrl.trim() !== '';
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      Alert.alert('Error', 'Please fill in all required fields');
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmitVenue = async () => {
    try {
      // Create venue data object for API
      const venueData: CreateVenueData = {
        name: venueForm.name,
        sports_supported: venueForm.sports,
        address: venueForm.location,
        city: 'Mumbai', // TODO: Extract from location or add separate field
        state: 'Maharashtra', // TODO: Extract from location or add separate field  
        pincode: '400001', // TODO: Extract from location or add separate field
        description: venueForm.description,
        amenities: venueForm.facilities,
        base_price_per_hour: parseInt(venueForm.pricePerHour),
        contact_phone: authService.getCurrentUser()?.mobile || '',
        images: venueForm.imageUrl ? [venueForm.imageUrl] : [],
        slots: venueForm.timeSlots.map((slot, index) => ({
          day_of_week: 0, // TODO: Add day selection in form or default to all days
          start_time: slot.startTime,
          end_time: slot.endTime,
          capacity: 20, // TODO: Add capacity field to form
          price_per_hour: parseInt(slot.price),
          is_peak_hour: false, // TODO: Add peak hour logic
        })),
      };

      const result = await venueOwnerService.createVenue(venueData);
      
      if (result.success) {
        // Refresh venues list
        await loadVenues();
        handleCloseAddModal();
        Alert.alert('Success', 'Venue added successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to add venue');
      }
    } catch (error) {
      console.error('Error creating venue:', error);
      Alert.alert('Error', 'Failed to add venue. Please try again.');
    }
  };

  const addTimeSlot = () => {
    setVenueForm({
      ...venueForm,
      timeSlots: [...venueForm.timeSlots, { startTime: '', endTime: '', price: '' }]
    });
  };

  const removeTimeSlot = (index: number) => {
    if (venueForm.timeSlots.length > 1) {
      const newSlots = venueForm.timeSlots.filter((_, i) => i !== index);
      setVenueForm({ ...venueForm, timeSlots: newSlots });
    }
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    const newSlots = venueForm.timeSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setVenueForm({ ...venueForm, timeSlots: newSlots });
  };

  const toggleSport = (sport: string) => {
    const newSports = venueForm.sports.includes(sport)
      ? venueForm.sports.filter(s => s !== sport)
      : [...venueForm.sports, sport];
    setVenueForm({ ...venueForm, sports: newSports });
  };

  const toggleFacility = (facility: string) => {
    const newFacilities = venueForm.facilities.includes(facility)
      ? venueForm.facilities.filter(f => f !== facility)
      : [...venueForm.facilities, facility];
    setVenueForm({ ...venueForm, facilities: newFacilities });
  };

  const formatCurrency = (amount: number) => {
    return VenueOwnerService.formatCurrency(amount);
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
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.formInput}
                value={venueForm.location}
                onChangeText={(text) => setVenueForm({ ...venueForm, location: text })}
                placeholder="Enter complete address"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sports Supported *</Text>
              <View style={styles.optionsGrid}>
                {sportsOptions.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.optionChip,
                      venueForm.sports.includes(sport) && styles.optionChipSelected
                    ]}
                    onPress={() => toggleSport(sport)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      venueForm.sports.includes(sport) && styles.optionChipTextSelected
                    ]}>
                      {sport}
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
            <Text style={styles.stepTitle}>Details & Facilities</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={venueForm.description}
                onChangeText={(text) => setVenueForm({ ...venueForm, description: text })}
                placeholder="Describe your venue..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Base Price per Hour *</Text>
              <TextInput
                style={styles.formInput}
                value={venueForm.pricePerHour}
                onChangeText={(text) => setVenueForm({ ...venueForm, pricePerHour: text })}
                placeholder="Enter base price"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Facilities *</Text>
              <View style={styles.optionsGrid}>
                {facilityOptions.map((facility) => (
                  <TouchableOpacity
                    key={facility}
                    style={[
                      styles.optionChip,
                      venueForm.facilities.includes(facility) && styles.optionChipSelected
                    ]}
                    onPress={() => toggleFacility(facility)}
                  >
                    <Text style={[
                      styles.optionChipText,
                      venueForm.facilities.includes(facility) && styles.optionChipTextSelected
                    ]}>
                      {facility}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Time Slots & Pricing</Text>
            
            <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
              {venueForm?.timeSlots && Array.isArray(venueForm.timeSlots) && venueForm.timeSlots.length > 0 ? (
                venueForm.timeSlots.map((slot, index) => (
                  <View key={index} style={styles.slotCard}>
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotLabel}>Slot {index + 1}</Text>
                      {venueForm.timeSlots.length > 1 && (
                        <TouchableOpacity onPress={() => removeTimeSlot(index)}>
                          <Ionicons name="close-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.slotRow}>
                      <View style={styles.timeInput}>
                        <Text style={styles.timeLabel}>Start Time</Text>
                        <TextInput
                          style={styles.formInput}
                          value={slot?.startTime || ''}
                          onChangeText={(text) => updateTimeSlot(index, 'startTime', text)}
                          placeholder="HH:MM"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    
                    <View style={styles.timeInput}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <TextInput
                        style={styles.formInput}
                        value={slot?.endTime || ''}
                        onChangeText={(text) => updateTimeSlot(index, 'endTime', text)}
                        placeholder="HH:MM"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.timeLabel}>Price for this slot</Text>
                    <TextInput
                      style={styles.formInput}
                      value={slot?.price || ''}
                      onChangeText={(text) => updateTimeSlot(index, 'price', text)}
                      placeholder="Enter price"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No time slots added yet</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.addSlotButton} onPress={addTimeSlot}>
                <Ionicons name="add" size={16} color="#212529" />
                <Text style={styles.addSlotText}>Add Another Slot</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Venue Image</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Image URL *</Text>
              <TextInput
                style={styles.formInput}
                value={venueForm.imageUrl}
                onChangeText={(text) => setVenueForm({ ...venueForm, imageUrl: text })}
                placeholder="Enter image URL"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.formHint}>
                Paste a URL of your venue image or use a stock image URL
              </Text>
            </View>

            {venueForm.imageUrl && (
              <View style={styles.imagePreview}>
                <Text style={styles.formLabel}>Preview:</Text>
                <ImageBackground
                  source={{ uri: venueForm.imageUrl }}
                  style={styles.previewImage}
                  imageStyle={styles.previewImageStyle}
                >
                  <View style={styles.previewOverlay} />
                  <Text style={styles.previewText}>{venueForm.name}</Text>
                </ImageBackground>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
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
              onPress={handleAddVenue}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Overview Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{venues.filter(v => v.isActive).length}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statValue}>{venues.reduce((sum, v) => sum + v.totalBookings, 0)}</Text>
                  <Text style={styles.statLabel}>Bookings</Text>
                </View>
              </View>
              
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="star" size={20} color="#f59e0b" />
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
                  source={{ uri: venue.images?.[0] || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e' }}
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
                    <View style={styles.venueMainInfo}>
                      <View style={styles.venueDetails}>
                        <Text style={styles.venueName} numberOfLines={1}>{venue.name}</Text>
                        <View style={styles.venueLocationRow}>
                          <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.venueLocation} numberOfLines={1}>{venue.address}</Text>
                        </View>
                        <View style={styles.venueStats}>
                          <View style={styles.venueStatItem}>
                            <Ionicons name="star" size={14} color="#fbbf24" />
                            <Text style={styles.venueStatText}>{venue.rating}</Text>
                          </View>
                          <View style={styles.venueStatItem}>
                            <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.venueStatText}>{venue.total_bookings}</Text>
                          </View>
                          <View style={styles.venueStatItem}>
                            <Ionicons name="cash" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.venueStatText}>{formatCurrency(venue.base_price_per_hour)}/hr</Text>
                          </View>
                        </View>
                      </View>
                      
                      <Switch
                        value={venue.is_active}
                        onValueChange={() => toggleVenueStatus(venue.id)}
                        trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(16, 185, 129, 0.3)' }}
                        thumbColor={venue.is_active ? '#10b981' : '#ffffff'}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                      />
                    </View>
                  </View>
                </ImageBackground>

                {/* Facilities Tags */}
                <View style={styles.facilitiesContainer}>
                  {venue?.amenities && Array.isArray(venue.amenities) && venue.amenities.length > 0 ? (
                    <>
                      {venue.amenities.slice(0, 4).map((facility, fIndex) => (
                        <View key={fIndex} style={styles.facilityTag}>
                          <Text style={styles.facilityText}>{facility}</Text>
                        </View>
                      ))}
                      {venue.amenities.length > 4 && (
                        <View style={styles.facilityTag}>
                          <Text style={styles.facilityText}>+{venue.amenities.length - 4}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.facilityTag}>
                      <Text style={styles.facilityText}>No facilities listed</Text>
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
                  onPress={handleAddVenue}
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
          presentationStyle="fullScreen"
        >
          <SafeAreaView style={styles.modalContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <KeyboardAvoidingView 
              style={styles.modalContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseAddModal}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add New Venue</Text>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepText}>{currentStep}/4</Text>
                </View>
              </View>

              {/* Step Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]} />
                </View>
              </View>

              {/* Step Content */}
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {renderStepContent()}
              </ScrollView>

              {/* Navigation Buttons */}
              <View style={styles.modalFooter}>
                {currentStep > 1 && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={handlePreviousStep}>
                    <Text style={styles.secondaryButtonText}>Previous</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.primaryButton, currentStep === 1 && styles.fullWidthButton]}
                  onPress={currentStep === 4 ? handleSubmitVenue : handleNextStep}
                  disabled={!validateStep(currentStep)}
                >
                  <Text style={styles.primaryButtonText}>
                    {currentStep === 4 ? 'Create Venue' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
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
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Basic Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Name:</Text>
                    <Text style={styles.detailsValue}>{selectedVenue?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Location:</Text>
                    <Text style={styles.detailsValue}>{selectedVenue?.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Sports:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedVenue?.sports_supported && Array.isArray(selectedVenue.sports_supported) 
                        ? selectedVenue.sports_supported.join(', ') 
                        : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Description:</Text>
                    <Text style={styles.detailsValue}>{selectedVenue?.description || 'No description available'}</Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Time Slots & Pricing</Text>
                  {selectedVenue?.slots && Array.isArray(selectedVenue.slots) && selectedVenue.slots.length > 0 ? (
                    selectedVenue.slots.map((slot) => (
                      <View key={slot?._id || Math.random()} style={styles.slotRow}>
                        <View style={styles.slotInfo}>
                          <Text style={styles.slotTime}>
                            {slot?.start_time && slot?.end_time 
                              ? `${VenueOwnerService.formatTime(slot.start_time)} - ${VenueOwnerService.formatTime(slot.end_time)}`
                              : 'Time not available'}
                          </Text>
                          <Text style={styles.slotPrice}>{formatCurrency(slot?.price_per_hour || 0)}</Text>
                        </View>
                        <Switch
                          value={slot?.is_active || false}
                          onValueChange={() => toggleSlotAvailability(selectedVenue?.id, slot?._id)}
                          trackColor={{ false: '#e5e7eb', true: '#dbeafe' }}
                          thumbColor={slot?.is_active ? '#3b82f6' : '#9ca3af'}
                        />
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No time slots available</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.detailsTitle}>Facilities</Text>
                  <View style={styles.facilitiesGrid}>
                    {selectedVenue?.amenities && Array.isArray(selectedVenue.amenities) && selectedVenue.amenities.length > 0 ? (
                      selectedVenue.amenities.map((facility, index) => (
                        <View key={index} style={styles.facilityChip}>
                          <Text style={styles.facilityChipText}>{facility}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No facilities listed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>

        <VenueOwnerBottomNavigation currentRoute="venues" />
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
    backgroundColor: '#f5f6f7',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 2,
  },
  venuesSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    height: 160,
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
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  venueContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-end',
  },
  venueMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  venueDetails: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 22,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueLocation: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  venueStats: {
    flexDirection: 'row',
    gap: 12,
  },
  venueStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 3,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  facilityText: {
    fontSize: 10,
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
  modalSafeArea: {
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
  stepIndicator: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#212529',
    borderRadius: 2,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionChipSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  optionChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: '#ffffff',
  },
  slotsContainer: {
    maxHeight: 400,
  },
  slotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  addSlotText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginLeft: 8,
  },
  imagePreview: {
    marginTop: 16,
  },
  previewImage: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageStyle: {
    borderRadius: 12,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#212529',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
  fullWidthButton: {
    marginLeft: 0,
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