import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../../services/authService';
import { OnboardingValidation } from '../../../utils/validation';

const SPORTS_OPTIONS = [
  { label: 'Cricket', value: 'Cricket', price: '₹1000/hour' },
  { label: 'Football', value: 'Football', price: '₹800/hour' },
  { label: 'Badminton', value: 'Badminton', price: '₹500/hour' },
  { label: 'Tennis', value: 'Tennis', price: '₹600/hour' },
  { label: 'Basketball', value: 'Basketball', price: '₹700/hour' },
];

const SLOT_DURATIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

export default function OnboardingStep3Screen() {
  const router = useRouter();
  const authService = AuthService.getInstance();

  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [slotDuration, setSlotDuration] = useState(60);
  const [pricePerSlot, setPricePerSlot] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showErrors, setShowErrors] = useState(false);

  // Generate arena names based on sport and court count
  const generateArenaNames = () => {
    const suffix = selectedSport === 'Cricket' ? 'Turf' : 
                   selectedSport === 'Football' ? 'Field' : 'Court';
    
    return Array.from({ length: numberOfCourts }, (_, i) => ({
      name: `${selectedSport} ${suffix} ${i + 1}`,
      id: `${selectedSport.toLowerCase()}_${i + 1}`
    }));
  };

  const incrementCourts = () => {
    if (numberOfCourts < 20) {
      setNumberOfCourts(numberOfCourts + 1);
    }
  };

  const decrementCourts = () => {
    if (numberOfCourts > 1) {
      setNumberOfCourts(numberOfCourts - 1);
    }
  };

  // Validation helper functions
  const validateField = (fieldName: string, value: any) => {
    let validation;
    
    switch (fieldName) {
      case 'sportType':
        validation = OnboardingValidation.validateSportType(value);
        break;
      case 'numberOfCourts':
        validation = OnboardingValidation.validateNumberOfCourts(value);
        break;
      case 'slotDuration':
        validation = OnboardingValidation.validateSlotDuration(value);
        break;
      case 'pricePerSlot':
        validation = OnboardingValidation.validatePricePerSlot(value);
        break;
      default:
        validation = { isValid: true, errors: [] };
    }

    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: validation.errors[0] || ''
    }));

    return validation.isValid;
  };

  const handlePriceChange = (newPrice: string) => {
    setPricePerSlot(newPrice);
    if (showErrors) {
      validateField('pricePerSlot', newPrice);
    }
  };

  const handleSaveAndContinue = async () => {
    setShowErrors(true);

    // Comprehensive frontend validation
    const validationData = {
      sportType: selectedSport,
      numberOfCourts,
      slotDuration,
      pricePerSlot: parseFloat(pricePerSlot),
    };

    const validation = OnboardingValidation.validateStep3(validationData);
    
    if (!validation.isValid) {
      Alert.alert('Validation Error', OnboardingValidation.showValidationErrors(validation.errors));
      
      // Set individual field errors for visual feedback
      validateField('sportType', selectedSport);
      validateField('numberOfCourts', numberOfCourts);
      validateField('slotDuration', slotDuration);
      validateField('pricePerSlot', pricePerSlot);
      
      return;
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
      const generatedArenas = generateArenaNames();
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/onboarding/step3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sport_type: selectedSport,
          number_of_courts: numberOfCourts,
          slot_duration: slotDuration,
          price_per_slot: parseFloat(pricePerSlot),
          arena_names: generatedArenas, // Send generated arena names to backend
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.replace('/auth/onboarding/step4');
      } else {
        Alert.alert('Error', result.message || 'Failed to save arena information');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f7" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#212529" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Step 3 of 5</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add Your Sports Arena</Text>
            <Text style={styles.subtitle}>Set up at least one sport to start receiving bookings</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Sport *</Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={selectedSport}
                  onValueChange={(itemValue) => setSelectedSport(itemValue)}
                  style={styles.modernPicker}
                >
                  {SPORTS_OPTIONS.map((sport) => (
                    <Picker.Item 
                      key={sport.value} 
                      label={`${sport.label} (Suggested: ${sport.price})`} 
                      value={sport.value} 
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.helperText}>
                Will create {numberOfCourts} {selectedSport === 'Cricket' ? 'turf' : selectedSport === 'Football' ? 'field' : 'court'}{numberOfCourts > 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of {selectedSport === 'Cricket' ? 'Turfs' : selectedSport === 'Football' ? 'Fields' : 'Courts'} *</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity 
                  style={[styles.counterButton, numberOfCourts <= 1 && styles.counterButtonDisabled]}
                  onPress={decrementCourts}
                  disabled={numberOfCourts <= 1}
                >
                  <Ionicons name="remove" size={20} color={numberOfCourts <= 1 ? "#9ca3af" : "#212529"} />
                </TouchableOpacity>
                <View style={styles.counterDisplay}>
                  <Text style={styles.counterValue}>{numberOfCourts}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.counterButton, numberOfCourts >= 20 && styles.counterButtonDisabled]}
                  onPress={incrementCourts}
                  disabled={numberOfCourts >= 20}
                >
                  <Ionicons name="add" size={20} color={numberOfCourts >= 20 ? "#9ca3af" : "#212529"} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Maximum 20 {selectedSport === 'Cricket' ? 'turfs' : selectedSport === 'Football' ? 'fields' : 'courts'} allowed
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Slot Duration *</Text>
              <View style={styles.dropdownContainer}>
                <Picker
                  selectedValue={slotDuration}
                  onValueChange={(itemValue) => setSlotDuration(itemValue)}
                  style={styles.modernPicker}
                >
                  {SLOT_DURATIONS.map((duration) => (
                    <Picker.Item 
                      key={duration.value} 
                      label={duration.label} 
                      value={duration.value} 
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.helperText}>
                Duration for each booking slot
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price per Slot (₹) *</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <View style={[
                  styles.priceInputContainer,
                  fieldErrors.pricePerSlot && showErrors && styles.inputContainerError
                ]}>
                  <TextInput
                    style={styles.priceInput}
                    value={pricePerSlot}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <Text style={styles.priceUnit}>per {slotDuration} min</Text>
              </View>
              {fieldErrors.pricePerSlot && showErrors && (
                <Text style={styles.errorText}>{fieldErrors.pricePerSlot}</Text>
              )}
              {!fieldErrors.pricePerSlot && (
                <Text style={styles.helperText}>
                  Suggested: ₹{Math.round((parseFloat(pricePerSlot) || 1000) / (slotDuration / 60))}/hour
                </Text>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleSaveAndContinue}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Saving...' : 'Save & Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f5f6f7',
  },
  backButton: {
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
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#212529',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  counterValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
    minWidth: 40,
    textAlign: 'center',
  },
  modernPicker: {
    height: 56,
    color: '#212529',
  },
  inputIcon: {
    marginRight: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212529',
  },
  priceInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  priceInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  footer: {
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#212529',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});