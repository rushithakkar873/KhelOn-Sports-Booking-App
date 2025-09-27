import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ImageBackground,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthService from '../../../services/authService';

const AMENITY_OPTIONS = [
  'Parking',
  'Washroom',
  'Changing Room',
  'Floodlights',
  'AC',
  'Equipment Rental',
  'Seating',
  'Canteen',
  'WiFi',
  'First Aid',
];

export default function OnboardingStep4Screen() {
  const router = useRouter();
  const authService = AuthService.getInstance();

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSkip = async () => {
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
          amenities: [],
          rules: null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.replace('/auth/onboarding/step5');
      } else {
        Alert.alert('Error', result.message || 'Failed to skip step');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Step 4 of 5</Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Amenities & Rules</Text>
              <Text style={styles.subtitle}>Enhance your venue profile (Optional)</Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Progress Bar */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={styles.progressSegment} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>General Amenities</Text>
                  <Text style={styles.description}>Select the amenities available at your venue</Text>
                  <View style={styles.amenitiesGrid}>
                    {AMENITY_OPTIONS.map((amenity) => (
                      <TouchableOpacity
                        key={amenity}
                        style={[
                          styles.amenityButton,
                          selectedAmenities.includes(amenity) && styles.amenityButtonSelected,
                        ]}
                        onPress={() => toggleAmenity(amenity)}
                      >
                        <Text
                          style={[
                            styles.amenityText,
                            selectedAmenities.includes(amenity) && styles.amenityTextSelected,
                          ]}
                        >
                          {amenity}
                        </Text>
                        {selectedAmenities.includes(amenity) && (
                          <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={styles.checkIcon} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Venue Rules (Optional)</Text>
                  <Text style={styles.description}>Any specific rules or guidelines for your venue</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="e.g., No outside food allowed, Proper sports attire required..."
                      placeholderTextColor="#9ca3af"
                      value={rules}
                      onChangeText={setRules}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkip}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Skip for now</Text>
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
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
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
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    marginBottom: 24,
  },
  form: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#3b82f6',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  amenityButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  amenityTextSelected: {
    color: '#ffffff',
  },
  checkIcon: {
    marginLeft: 6,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  textArea: {
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
  },
  footer: {
    paddingTop: 16,
    gap: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});