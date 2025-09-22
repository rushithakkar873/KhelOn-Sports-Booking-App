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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreateArena, CreateVenueSlot } from '../services/venueOwnerService';

interface ArenaFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (arena: CreateArena) => void;
  arena?: CreateArena;
  isEditing?: boolean;
}

export default function ArenaFormModal({
  isVisible,
  onClose,
  onSave,
  arena,
  isEditing = false,
}: ArenaFormModalProps) {
  const [arenaForm, setArenaForm] = useState<CreateArena>({
    name: '',
    sport: '',
    capacity: 1,
    description: '',
    amenities: [],
    base_price_per_hour: 0,
    images: [],
    slots: [{ day_of_week: 0, start_time: '', end_time: '', capacity: 1, price_per_hour: 0, is_peak_hour: false }],
    is_active: true,
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
        slots: [{ day_of_week: 0, start_time: '', end_time: '', capacity: 1, price_per_hour: 0, is_peak_hour: false }],
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
      start_time: '',
      end_time: '',
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
            <Ionicons name="close" size={24} color="#666" />
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
                placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Arena Active</Text>
              <Switch
                value={arenaForm.is_active}
                onValueChange={(value) => setArenaForm({ ...arenaForm, is_active: value })}
                trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
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
                <Ionicons name="add" size={20} color="#4CAF50" />
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
                      <Ionicons name="trash-outline" size={16} color="#FF5252" />
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
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <Text style={styles.label}>End Time</Text>
                    <TextInput
                      style={styles.input}
                      value={slot.end_time}
                      onChangeText={(text) => updateTimeSlot(index, 'end_time', text)}
                      placeholder="HH:MM"
                      placeholderTextColor="#999"
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
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <View style={styles.switchRow}>
                      <Text style={styles.label}>Peak Hour</Text>
                      <Switch
                        value={slot.is_peak_hour}
                        onValueChange={(value) => updateTimeSlot(index, 'is_peak_hour', value)}
                        trackColor={{ false: '#E5E5E5', true: '#FF9800' }}
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
    backgroundColor: '#fff',
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
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
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FAFAFA',
  },
  optionButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#fff',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FAFAFA',
  },
  amenityButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
  },
  amenityTextSelected: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0F8F0',
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  slotCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: '#FAFAFA',
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
  },
  dayTextSelected: {
    color: '#fff',
  },
});