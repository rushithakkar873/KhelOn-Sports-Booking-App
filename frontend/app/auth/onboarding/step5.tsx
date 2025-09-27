import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AuthService from '../../../services/authService';

export default function OnboardingStep5Screen() {
  const router = useRouter();
  const authService = AuthService.getInstance();

  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSkip = async () => {
    setIsLoading(true);

    try {
      const token = authService.getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/onboarding/step5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_account_number: null,
          bank_ifsc: null,
          bank_account_holder: null,
          upi_id: null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to dashboard after completing onboarding
        Alert.alert(
          'Welcome to KhelON!',
          'Your venue partner account has been created successfully. You can add payment details later from settings.',
          [
            { 
              text: 'Get Started', 
              onPress: () => router.replace('/venue-partner/dashboard') 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to complete setup');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndComplete = async () => {
    if (bankAccountNumber.trim() && (!bankIfsc.trim() || !accountHolderName.trim())) {
      Alert.alert('Error', 'Please provide all bank details if you want to add payment information');
      return;
    }

    setIsLoading(true);

    try {
      const token = authService.getToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/onboarding/step5`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bank_account_number: bankAccountNumber.trim() || null,
          bank_ifsc: bankIfsc.trim().toUpperCase() || null,
          bank_account_holder: accountHolderName.trim() || null,
          upi_id: upiId.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to dashboard after completing onboarding
        Alert.alert(
          'Setup Complete!',
          'Congratulations! Your venue partner account is ready. You can now start managing your venue and receiving bookings.',
          [
            { 
              text: 'Go to Dashboard', 
              onPress: () => router.replace('/venue-partner/dashboard') 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save payment details');
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
                <Text style={styles.progressText}>Step 5 of 5</Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Payment Setup</Text>
              <Text style={styles.subtitle}>Add your payment details to receive payouts</Text>
              <Text style={styles.note}>You can add this later before going live</Text>
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
                  <View style={[styles.progressSegment, styles.progressActive]} />
                </View>

                <View style={styles.sectionHeader}>
                  <Ionicons name="card-outline" size={24} color="#3b82f6" />
                  <Text style={styles.sectionTitle}>Bank Account Details</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full name as per bank account"
                      placeholderTextColor="#9ca3af"
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                      autoComplete="name"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bank Account Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your bank account number"
                      placeholderTextColor="#9ca3af"
                      value={bankAccountNumber}
                      onChangeText={setBankAccountNumber}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IFSC Code</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter IFSC code"
                      placeholderTextColor="#9ca3af"
                      value={bankIfsc}
                      onChangeText={setBankIfsc}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.sectionHeader}>
                  <Ionicons name="phone-portrait-outline" size={24} color="#3b82f6" />
                  <Text style={styles.sectionTitle}>UPI Details</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>UPI ID</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="at-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="yourname@paytm"
                      placeholderTextColor="#9ca3af"
                      value={upiId}
                      onChangeText={setUpiId}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
                  <Text style={styles.infoText}>
                    Payment details are required before you can receive your first payout. You can always add or update this information later.
                  </Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkip}
                  disabled={isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Setup Later</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleSaveAndComplete}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Completing Setup...' : 'Complete Setup'}
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
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontStyle: 'italic',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1d4ed8',
    marginLeft: 12,
    lineHeight: 20,
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