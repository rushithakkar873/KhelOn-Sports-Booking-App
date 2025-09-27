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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AuthService from '../../../services/authService';

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

  const handleSaveAndContinue = async () => {
    if (!pricePerSlot.trim() || parseFloat(pricePerSlot) <= 0) {
      Alert.alert('Error', 'Please enter a valid price per slot');
      return;
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
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
              <View style={styles.form}>
                {/* Progress Bar */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={[styles.progressSegment, styles.progressActive]} />
                  <View style={styles.progressSegment} />
                  <View style={styles.progressSegment} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Sport</Text>
                  <View style={styles.sportsGrid}>
                    {SPORTS_OPTIONS.map((sport) => (
                      <TouchableOpacity
                        key={sport.value}
                        style={[
                          styles.sportCard,
                          selectedSport === sport.value && styles.sportCardSelected,
                        ]}
                        onPress={() => setSelectedSport(sport.value)}
                      >
                        <Text style={[
                          styles.sportName,
                          selectedSport === sport.value && styles.sportNameSelected,
                        ]}>
                          {sport.label}
                        </Text>
                        <Text style={[
                          styles.sportPrice,
                          selectedSport === sport.value && styles.sportPriceSelected,
                        ]}>
                          Suggested: {sport.price}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Number of Courts/Turfs</Text>
                  <View style={styles.counterContainer}>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={decrementCourts}
                      disabled={numberOfCourts <= 1}
                    >
                      <Ionicons name="remove" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{numberOfCourts}</Text>
                    <TouchableOpacity 
                      style={styles.counterButton}
                      onPress={incrementCourts}
                      disabled={numberOfCourts >= 20}
                    >
                      <Ionicons name="add" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Slot Duration</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={slotDuration}
                      onValueChange={(itemValue) => setSlotDuration(itemValue)}
                      style={styles.picker}
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
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Price per Slot (₹)</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <View style={styles.priceInputContainer}>
                      <Text 
                        style={styles.priceInput}
                        onPress={() => {
                          Alert.prompt(
                            'Set Price',
                            'Enter price per slot:',
                            (text) => {
                              if (text && !isNaN(parseFloat(text))) {
                                setPricePerSlot(text);
                              }
                            },
                            'plain-text',
                            pricePerSlot
                          );
                        }}
                      >
                        {pricePerSlot}
                      </Text>
                    </View>
                    <Text style={styles.priceUnit}>per {slotDuration} min</Text>
                  </View>
                  <Text style={styles.helperText}>
                    Suggested: ₹{Math.round((parseFloat(pricePerSlot) || 1000) / (slotDuration / 60))}/hour
                  </Text>
                </View>
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
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sportsGrid: {
    gap: 12,
  },
  sportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  sportCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  sportNameSelected: {
    color: '#3b82f6',
  },
  sportPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  sportPriceSelected: {
    color: '#3b82f6',
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
    color: '#000000',
    minWidth: 40,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  picker: {
    height: 50,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
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
    color: '#000000',
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
  footer: {
    paddingTop: 16,
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