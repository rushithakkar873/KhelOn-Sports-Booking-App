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
import AuthService from '../../../services/authService';
import { OnboardingValidation } from '../../../utils/validation';

const AMENITIES_OPTIONS = [
  'Parking',
  'Washroom',
  'Changing Room',
  'Floodlights',
  'Seating Area',
  'Canteen',
  'First Aid',
  'Equipment Rental',
  'AC/Cooled Area',
  'WiFi',
  'Sound System',
  'Security',
];

export default function OnboardingStep4Screen() {
  const router = useRouter();
  const authService = AuthService.getInstance();

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showErrors, setShowErrors] = useState(false);

  const toggleAmenity = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    
    setSelectedAmenities(newAmenities);
    
    // Validate amenities if errors are being shown
    if (showErrors) {
      validateField('amenities', newAmenities);
    }
  };

  const validateField = (fieldName: string, value: any) => {
    let validation;
    
    switch (fieldName) {
      case 'amenities':
        validation = OnboardingValidation.validateAmenities(value);
        break;
      case 'rules':
        validation = OnboardingValidation.validateRules(value);
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

  const handleRulesChange = (newRules: string) => {
    setRules(newRules);
    if (showErrors) {
      validateField('rules', newRules);
    }
  };

  const handleSkip = () => {
    router.replace('/auth/onboarding/step5');
  };

  const handleSaveAndContinue = async () => {
    setShowErrors(true);

    // Comprehensive frontend validation
    const validationData = {
      amenities: selectedAmenities,
      rules: rules,
    };

    const validation = OnboardingValidation.validateStep4(validationData);
    
    if (!validation.isValid) {
      Alert.alert('Validation Error', OnboardingValidation.showValidationErrors(validation.errors));
      
      // Set individual field errors for visual feedback
      validateField('amenities', selectedAmenities);
      validateField('rules', rules);
      
      return;
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/onboarding/step4`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amenities: selectedAmenities,
          rules: rules.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.replace('/auth/onboarding/step5');
      } else {
        Alert.alert('Error', result.message || 'Failed to save amenities and rules');
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
              <Text style={styles.progressText}>Step 4 of 5</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Amenities & Rules</Text>
            <Text style={styles.subtitle}>Help customers understand what you offer</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amenities Available</Text>
              <Text style={styles.helperText}>Select all that apply to your venue</Text>
              <View style={styles.amenitiesGrid}>
                {AMENITIES_OPTIONS.map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.amenityCard,
                      selectedAmenities.includes(amenity) && styles.amenityCardSelected,
                    ]}
                    onPress={() => toggleAmenity(amenity)}
                  >
                    <View style={[
                      styles.checkBox,
                      selectedAmenities.includes(amenity) && styles.checkBoxSelected,
                    ]}>
                      {selectedAmenities.includes(amenity) && (
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      )}
                    </View>
                    <Text style={[
                      styles.amenityText,
                      selectedAmenities.includes(amenity) && styles.amenityTextSelected,
                    ]}>
                      {amenity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rules & Guidelines (Optional)</Text>
              <Text style={styles.helperText}>Any specific rules or guidelines for your venue</Text>
              <View style={[
                styles.textAreaContainer,
                fieldErrors.rules && showErrors && styles.inputContainerError
              ]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g., No outside food allowed, Sports shoes mandatory, etc."
                  placeholderTextColor="#9ca3af"
                  value={rules}
                  onChangeText={handleRulesChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              {fieldErrors.rules && showErrors && (
                <Text style={styles.errorText}>{fieldErrors.rules}</Text>
              )}
              {rules.trim() && !fieldErrors.rules && (
                <Text style={styles.helperText}>
                  {rules.trim().length}/2000 characters
                </Text>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={isLoading}
                >
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
                
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
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    marginBottom: 8,
  },
  amenityCardSelected: {
    borderColor: '#212529',
    backgroundColor: '#ffffff',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkBoxSelected: {
    borderColor: '#212529',
    backgroundColor: '#212529',
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  amenityTextSelected: {
    color: '#212529',
    fontWeight: '600',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f5f6f7',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    fontSize: 16,
    color: '#212529',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
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