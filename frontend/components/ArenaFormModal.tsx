import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreateArena, CreateVenueSlot } from '../services/venuePartnerService';

const { width } = Dimensions.get('window');

interface ArenaFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (arena: CreateArena) => void;
  arena?: CreateArena;
  isEditing?: boolean;
}

interface ArenaFormData extends CreateArena {
  currentStep: number;
  isSubmitting: boolean;
}

export default function ArenaFormModal({
  isVisible,
  onClose,
  onSave,
  arena,
  isEditing = false,
}: ArenaFormModalProps) {
  const insets = useSafeAreaInsets();
  const [arenaForm, setArenaForm] = useState<ArenaFormData>({
    name: '',
    sport: '',
    capacity: 1,
    description: '',
    amenities: [],
    base_price_per_hour: 0,
    images: [],
    slots: [{ day_of_week: 0, start_time: '06:00', end_time: '08:00', capacity: 1, price_per_hour: 0, is_peak_hour: false }],
    is_active: true,
    currentStep: 1,
    isSubmitting: false,
  });

  const sportsOptions = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 'Volleyball', 'Hockey', 'Squash'];
  const amenityOptions = ['Parking', 'Washroom', 'Changing Room', 'Floodlights', 'AC', 'Equipment Rental', 'Seating', 'Canteen', 'WiFi', 'First Aid'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    if (arena) {
      setArenaForm({
        ...arena,
        currentStep: 1,
        isSubmitting: false,
      });
    } else {
      // Reset form when creating new arena
      setArenaForm({
        name: '',
        sport: '',
        capacity: 1,
        description: '',
        amenities: [],
        base_price_per_hour: 0,
        images: [],
        slots: [{ day_of_week: 0, start_time: '06:00', end_time: '08:00', capacity: 1, price_per_hour: 0, is_peak_hour: false }],
        is_active: true,
        currentStep: 1,
        isSubmitting: false,
      });
    }
  }, [arena, isVisible]);

  const validateCurrentStep = (): boolean => {
    switch (arenaForm.currentStep) {
      case 1:
        if (!arenaForm.name.trim()) {
          Alert.alert('Required Field', 'Arena name is required');
          return false;
        }
        if (!arenaForm.sport) {
          Alert.alert('Required Field', 'Please select a sport');
          return false;
        }
        if (arenaForm.base_price_per_hour <= 0) {
          Alert.alert('Invalid Price', 'Base price must be greater than 0');
          return false;
        }
        return true;
      case 2:
        // Amenities step - no required fields, but validate slots if any
        if (arenaForm.slots.length === 0) {
          Alert.alert('Required', 'At least one time slot is required');
          return false;
        }
        // Validate time slots
        for (const slot of arenaForm.slots) {
          if (!slot.start_time || !slot.end_time) {
            Alert.alert('Invalid Time', 'All time slots must have start and end times');
            return false;
          }
          if (slot.price_per_hour <= 0) {
            Alert.alert('Invalid Price', 'All time slots must have valid pricing');
            return false;
          }
        }
        return true;
      case 3:
        // Review step - all validation done in previous steps
        return true;
      default:
        return false;
    }
  };

  const handleStepNavigation = (direction: 'next' | 'back') => {
    if (direction === 'next') {
      if (validateCurrentStep()) {
        setArenaForm(prev => ({
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, 3),
        }));
      }
    } else {
      setArenaForm(prev => ({
        ...prev,
        currentStep: Math.max(prev.currentStep - 1, 1),
      }));
    }
  };

  const handleSave = async () => {
    if (!validateCurrentStep()) return;

    setArenaForm(prev => ({ ...prev, isSubmitting: true }));

    try {
      const arenaData: CreateArena = {
        name: arenaForm.name,
        sport: arenaForm.sport,
        capacity: arenaForm.capacity,
        description: arenaForm.description,
        amenities: arenaForm.amenities,
        base_price_per_hour: arenaForm.base_price_per_hour,
        images: arenaForm.images,
        slots: arenaForm.slots,
        is_active: arenaForm.is_active,
      };

      console.log('Arena form saving:', arenaData);
      onSave(arenaData);
      onClose();
    } catch (error) {
      console.error('Error saving arena:', error);
      Alert.alert('Error', 'Failed to save arena. Please try again.');
    } finally {
      setArenaForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const resetArenaData = () => {
    setArenaForm({
      name: '',
      sport: '',
      capacity: 1,
      description: '',
      amenities: [],
      base_price_per_hour: 0,
      images: [],
      slots: [{ day_of_week: 0, start_time: '06:00', end_time: '08:00', capacity: 1, price_per_hour: 0, is_peak_hour: false }],
      is_active: true,
      currentStep: 1,
      isSubmitting: false,
    });
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Set up your arena's basic details and pricing</Text>

      {/* Arena Name */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Arena Name *</Text>
        <TextInput
          style={styles.formInput}
          value={arenaForm.name}
          onChangeText={(text) => setArenaForm({ ...arenaForm, name: text })}
          placeholder="e.g., Cricket Ground A, Football Field 1"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Sport Selection */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Sport *</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.sportsScrollView}
          contentContainerStyle={styles.sportsContainer}
        >
          {sportsOptions.map((sport) => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportChip,
                arenaForm.sport === sport && styles.sportChipSelected,
              ]}
              onPress={() => setArenaForm({ ...arenaForm, sport })}
            >
              <Text
                style={[
                  styles.sportChipText,
                  arenaForm.sport === sport && styles.sportChipTextSelected,
                ]}
              >
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Capacity and Price Row */}
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.formLabel}>Capacity</Text>
          <TextInput
            style={styles.formInput}
            value={arenaForm.capacity?.toString() || '1'}
            onChangeText={(text) => setArenaForm({ ...arenaForm, capacity: parseInt(text) || 1 })}
            placeholder="Number of courts"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.formLabel}>Base Price/Hour *</Text>
          <TextInput
            style={styles.formInput}
            value={arenaForm.base_price_per_hour?.toString() || '0'}
            onChangeText={(text) => setArenaForm({ ...arenaForm, base_price_per_hour: parseFloat(text) || 0 })}
            placeholder="₹ per hour"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={[styles.formInput, styles.textArea]}
          value={arenaForm.description || ''}
          onChangeText={(text) => setArenaForm({ ...arenaForm, description: text })}
          placeholder="Brief description of this arena"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Active Status */}
      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Arena Active</Text>
          <Switch
            value={arenaForm.is_active}
            onValueChange={(value) => setArenaForm({ ...arenaForm, is_active: value })}
            trackColor={{ false: '#e5e7eb', true: '#10b981' }}
            thumbColor={arenaForm.is_active ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.switchSubtext}>
          {arenaForm.is_active ? 'Arena is available for booking' : 'Arena is temporarily unavailable'}
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Amenities & Time Slots</Text>
      <Text style={styles.stepSubtitle}>Configure arena amenities and available time slots</Text>

      {/* Amenities */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Arena-Specific Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {amenityOptions.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[
                styles.amenityButton,
                arenaForm.amenities.includes(amenity) && styles.amenityButtonSelected,
              ]}
              onPress={() => toggleAmenity(amenity)}
            >
              <Text
                style={[
                  styles.amenityText,
                  arenaForm.amenities.includes(amenity) && styles.amenityTextSelected,
                ]}
              >
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Slots */}
      <View style={styles.formGroup}>
        <View style={styles.sectionHeader}>
          <Text style={styles.formLabel}>Time Slots</Text>
          <TouchableOpacity onPress={addTimeSlot} style={styles.addSlotButton}>
            <Ionicons name="add" size={20} color="#10b981" />
            <Text style={styles.addSlotText}>Add Slot</Text>
          </TouchableOpacity>
        </View>

        {arenaForm.slots.map((slot, index) => (
          <View key={index} style={styles.slotCard}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>Slot {index + 1}</Text>
              {arenaForm.slots.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeTimeSlot(index)}
                  style={styles.removeSlotButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Day Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.slotLabel}>Day of Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day, dayIndex) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        slot.day_of_week === dayIndex && styles.dayButtonSelected,
                      ]}
                      onPress={() => updateTimeSlot(index, 'day_of_week', dayIndex)}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          slot.day_of_week === dayIndex && styles.dayButtonTextSelected,
                        ]}
                      >
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time and Price */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.slotLabel}>Start Time</Text>
                <TextInput
                  style={styles.slotInput}
                  value={slot.start_time}
                  onChangeText={(text) => updateTimeSlot(index, 'start_time', text)}
                  placeholder="HH:MM"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.slotLabel}>End Time</Text>
                <TextInput
                  style={styles.slotInput}
                  value={slot.end_time}
                  onChangeText={(text) => updateTimeSlot(index, 'end_time', text)}
                  placeholder="HH:MM"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.slotLabel}>Price/Hour</Text>
                <TextInput
                  style={styles.slotInput}
                  value={slot.price_per_hour?.toString() || '0'}
                  onChangeText={(text) => updateTimeSlot(index, 'price_per_hour', parseFloat(text) || 0)}
                  placeholder="₹ per hour"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <View style={styles.slotSwitchRow}>
                  <Text style={styles.slotLabel}>Peak Hour</Text>
                  <Switch
                    value={slot.is_peak_hour}
                    onValueChange={(value) => updateTimeSlot(index, 'is_peak_hour', value)}
                    trackColor={{ false: '#e5e7eb', true: '#f59e0b' }}
                    thumbColor={slot.is_peak_hour ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepSubtitle}>Review your arena details before saving</Text>

      {/* Arena Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Arena Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{arenaForm.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sport:</Text>
          <Text style={styles.summaryValue}>{arenaForm.sport}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Capacity:</Text>
          <Text style={styles.summaryValue}>{arenaForm.capacity} courts/fields</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Base Price:</Text>
          <Text style={styles.summaryValue}>₹{arenaForm.base_price_per_hour}/hour</Text>
        </View>
        
        {arenaForm.description && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Description:</Text>
            <Text style={styles.summaryValue}>{arenaForm.description}</Text>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Status:</Text>
          <Text style={[
            styles.summaryValue,
            { color: arenaForm.is_active ? '#10b981' : '#ef4444' }
          ]}>
            {arenaForm.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Amenities Summary */}
      {arenaForm.amenities.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Amenities</Text>
          <View style={styles.amenitiesSummary}>
            {arenaForm.amenities.map((amenity, index) => (
              <View key={index} style={styles.amenitySummaryTag}>
                <Text style={styles.amenitySummaryText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Time Slots Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Time Slots ({arenaForm.slots.length})</Text>
        {arenaForm.slots.map((slot, index) => (
          <View key={index} style={styles.slotSummary}>
            <Text style={styles.slotSummaryDay}>
              {daysOfWeek[slot.day_of_week]}
            </Text>
            <Text style={styles.slotSummaryTime}>
              {slot.start_time} - {slot.end_time}
            </Text>
            <Text style={styles.slotSummaryPrice}>
              ₹{slot.price_per_hour}/hr
              {slot.is_peak_hour && ' (Peak)'}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Info */}
      <View style={styles.actionInfo}>
        <Ionicons name="information-circle" size={24} color="#3b82f6" />
        <View style={styles.actionInfoContent}>
          <Text style={styles.actionInfoTitle}>Ready to save?</Text>
          <Text style={styles.actionInfoText}>
            Your arena will be {arenaForm.is_active ? 'immediately available for bookings' : 'saved as inactive and can be activated later'}.
          </Text>
        </View>
      </View>
    </View>
  );

  const toggleAmenity = (amenity: string) => {
    const newAmenities = arenaForm.amenities.includes(amenity)
      ? arenaForm.amenities.filter(a => a !== amenity)
      : [...arenaForm.amenities, amenity];
    setArenaForm({ ...arenaForm, amenities: newAmenities });
  };

  const addTimeSlot = () => {
    const newSlot: CreateVenueSlot = {
      day_of_week: 0,
      start_time: '06:00',
      end_time: '08:00',
      capacity: arenaForm.capacity || 1,
      price_per_hour: arenaForm.base_price_per_hour,
      is_peak_hour: false,
    };
    setArenaForm({
      ...arenaForm,
      slots: [...arenaForm.slots, newSlot],
    });
  };

  const removeTimeSlot = (index: number) => {
    if (arenaForm.slots.length > 1) {
      const newSlots = arenaForm.slots.filter((_, i) => i !== index);
      setArenaForm({ ...arenaForm, slots: newSlots });
    }
  };

  const updateTimeSlot = (index: number, field: keyof CreateVenueSlot, value: any) => {
    const newSlots = arenaForm.slots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setArenaForm({ ...arenaForm, slots: newSlots });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Arena' : 'New Arena'}
          </Text>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>{arenaForm.currentStep}/3</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(arenaForm.currentStep / 3) * 100}%` }]} />
          </View>
        </View>

        {/* Step Content */}
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {arenaForm.currentStep === 1 && renderStep1()}
            {arenaForm.currentStep === 2 && renderStep2()}
            {arenaForm.currentStep === 3 && renderStep3()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Navigation Footer */}
        <View style={styles.modalFooter}>
          {arenaForm.currentStep > 1 && (
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => handleStepNavigation('back')}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              arenaForm.currentStep === 1 && styles.fullWidthButton
            ]}
            onPress={arenaForm.currentStep === 3 ? handleSave : () => handleStepNavigation('next')}
            disabled={arenaForm.isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {arenaForm.currentStep === 3 
                ? (arenaForm.isSubmitting ? 'Saving...' : 'Save Arena')
                : 'Next'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  headerCancel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
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
    minHeight: 80,
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
  
  // Sport Selection Styles
  sportsScrollView: {
    flexGrow: 0,
  },
  sportsContainer: {
    paddingRight: 20,
    gap: 12,
  },
  sportChip: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sportChipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  sportChipText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  sportChipTextSelected: {
    color: '#ffffff',
  },

  // Switch Container
  switchContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
  },
  switchSubtext: {
    fontSize: 14,
    color: '#0369a1',
    fontStyle: 'italic',
  },

  // Amenities Grid
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  amenityButtonSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  amenityTextSelected: {
    color: '#ffffff',
  },

  // Section Header for Slots
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  addSlotText: {
    color: '#10b981',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },

  // Slot Cards
  slotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  removeSlotButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  slotInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212529',
    backgroundColor: '#ffffff',
  },
  slotSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },

  // Days Container
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  dayButtonSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },

  // Summary Cards (Step 3)
  summaryCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c4a6e',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#0c4a6e',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },

  // Amenities Summary
  amenitiesSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenitySummaryTag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenitySummaryText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
  },

  // Slot Summary
  slotSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  slotSummaryDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    flex: 1,
  },
  slotSummaryTime: {
    fontSize: 14,
    color: '#0369a1',
    flex: 2,
    textAlign: 'center',
  },
  slotSummaryPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    flex: 1,
    textAlign: 'right',
  },

  // Action Info
  actionInfo: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  actionInfoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },

  // Modal Footer
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
  fullWidthButton: {
    marginLeft: 0,
  },
});