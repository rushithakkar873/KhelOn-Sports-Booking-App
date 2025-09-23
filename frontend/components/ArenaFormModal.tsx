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
import { CreateArena, CreateVenueSlot } from '../services/venueOwnerService';

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
      setArenaForm(arena);
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
      });
    }
  }, [arena, isVisible]);

  const handleSave = () => {
    // Validation
    if (!arenaForm.name.trim()) {
      Alert.alert('Error', 'Arena name is required');
      return;
    }
    if (!arenaForm.sport) {
      Alert.alert('Error', 'Please select a sport');
      return;
    }
    if (arenaForm.base_price_per_hour <= 0) {
      Alert.alert('Error', 'Base price must be greater than 0');
      return;
    }
    if (arenaForm.slots.length === 0) {
      Alert.alert('Error', 'At least one time slot is required');
      return;
    }

    // Validate time slots
    for (const slot of arenaForm.slots) {
      if (!slot.start_time || !slot.end_time) {
        Alert.alert('Error', 'All time slots must have start and end times');
        return;
      }
      if (slot.price_per_hour <= 0) {
        Alert.alert('Error', 'All time slots must have valid pricing');
        return;
      }
    }

    console.log('Arena form saving:', arenaForm);
    onSave(arenaForm);
    onClose();
  };

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
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Arena' : 'Add New Arena'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Arena Name *</Text>
              <TextInput
                style={styles.input}
                value={arenaForm.name}
                onChangeText={(text) => setArenaForm({ ...arenaForm, name: text })}
                placeholder="e.g., Cricket Ground A, Football Field 1"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sport *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                {sportsOptions.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.optionButton,
                      arenaForm.sport === sport && styles.optionButtonSelected,
                    ]}
                    onPress={() => setArenaForm({ ...arenaForm, sport })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        arenaForm.sport === sport && styles.optionTextSelected,
                      ]}
                    >
                      {sport}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={arenaForm.capacity?.toString() || '1'}
                  onChangeText={(text) => setArenaForm({ ...arenaForm, capacity: parseInt(text) || 1 })}
                  placeholder="Number of courts/fields"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Base Price/Hour *</Text>
                <TextInput
                  style={styles.input}
                  value={arenaForm.base_price_per_hour?.toString() || '0'}
                  onChangeText={(text) => setArenaForm({ ...arenaForm, base_price_per_hour: parseFloat(text) || 0 })}
                  placeholder="₹ per hour"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={arenaForm.description || ''}
                onChangeText={(text) => setArenaForm({ ...arenaForm, description: text })}
                placeholder="Brief description of this arena"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Arena Active</Text>
              <Switch
                value={arenaForm.is_active}
                onValueChange={(value) => setArenaForm({ ...arenaForm, is_active: value })}
                trackColor={{ false: '#e5e7eb', true: '#212529' }}
                thumbColor={arenaForm.is_active ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arena-Specific Amenities</Text>
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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Time Slots</Text>
              <TouchableOpacity onPress={addTimeSlot} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#212529" />
                <Text style={styles.addButtonText}>Add Slot</Text>
              </TouchableOpacity>
            </View>

            {arenaForm.slots.map((slot, index) => (
              <View key={index} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>Slot {index + 1}</Text>
                  {arenaForm.slots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeTimeSlot(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Day of Week</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                              styles.dayText,
                              slot.day_of_week === dayIndex && styles.dayTextSelected,
                            ]}
                          >
                            {day.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Start Time</Text>
                    <TextInput
                      style={styles.input}
                      value={slot.start_time}
                      onChangeText={(text) => updateTimeSlot(index, 'start_time', text)}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>End Time</Text>
                    <TextInput
                      style={styles.input}
                      value={slot.end_time}
                      onChangeText={(text) => updateTimeSlot(index, 'end_time', text)}
                      placeholder="HH:MM"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>Price/Hour</Text>
                    <TextInput
                      style={styles.input}
                      value={slot.price_per_hour?.toString() || '0'}
                      onChangeText={(text) => updateTimeSlot(index, 'price_per_hour', parseFloat(text) || 0)}
                      placeholder="₹ per hour"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <View style={styles.switchRow}>
                      <Text style={styles.label}>Peak Hour</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
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
  content: {
    flex: 1,
    backgroundColor: '#f5f6f7',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButtonText: {
    color: '#212529',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  slotCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  dayButtonSelected: {
    backgroundColor: '#212529',
    borderColor: '#212529',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayTextSelected: {
    color: '#ffffff',
  },
});